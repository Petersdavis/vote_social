/**
 * Constituent-to-Representative message helpers.
 */

import { trackEvent } from "./analytics";
import { loadFirebaseFirestore, loadFirebaseFunctions } from "./firebase";
import {
  fetchRepresentativesForBoundary,
  type GovernanceTierSlug,
  type PoliticalBoundaryOption,
  type PostcodeBoundaryResolution,
  type RepresentativeOption,
} from "./opennorth";

export const COMMS_PUBLIC_COLLECTION = "comms_public";
export const REP_EMAIL_BLOCKLIST_COLLECTION = "rep_email_blocklist";

export interface ResolvedRepresentative extends RepresentativeOption {
  unsubscribed: boolean;
}

export interface SubmitConstituentMessageRecipient {
  boundaryUrl: string;
  repName: string;
  electedOffice?: string;
}

export interface SubmitConstituentMessagePayload {
  senderName: string;
  senderEmail: string;
  postcode: string;
  subject: string;
  body: string;
  visibility: "public" | "private";
  recipients: SubmitConstituentMessageRecipient[];
}

export interface RecipientDeliveryOutcome {
  repId: string;
  repName: string;
  electedOffice: string;
  districtName: string;
  officialEmail: string;
  status:
    | "notified_email_sent"
    | "saved_daily_limit_reached"
    | "blocked_unsubscribed"
    | "routed_dead_letter";
}

export interface PublicCommsPost {
  id: string;
  senderName: string;
  postcode: string;
  subject: string;
  body: string;
  repName: string;
  electedOffice: string;
  districtName: string;
  representativeSetName: string;
  createdAt: Date;
}

function normalizeDistrictName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\u2012\u2013\u2014\u2015-]+/g, "-")
    .replace(/\s+/g, " ");
}

/**
 * Resolve all elected representatives (Federal, Provincial, Regional, Municipal)
 * for the user's confirmed political districts, fetching any concordance
 * boundary representatives on-demand and checking `rep_email_blocklist`.
 */
export async function resolveConfirmedRepresentatives(params: {
  resolution: PostcodeBoundaryResolution;
  municipal: PoliticalBoundaryOption | null;
  regional: PoliticalBoundaryOption | null;
  provincial: PoliticalBoundaryOption | null;
  federal: PoliticalBoundaryOption | null;
}): Promise<ResolvedRepresentative[]> {
  const { resolution, municipal, regional, provincial, federal } = params;

  const selectedSpecificBoundaries = [
    municipal,
    regional,
    provincial,
    federal,
  ].filter((b): b is PoliticalBoundaryOption => Boolean(b && b.url));

  const allowedBoundaryUrls = new Set<string>();
  const allowedDistrictNames = new Set<string>();

  for (const b of selectedSpecificBoundaries) {
    allowedBoundaryUrls.add(b.url.trim().toLowerCase());
    allowedDistrictNames.add(normalizeDistrictName(b.name));
  }
  for (const cityB of resolution.cityBoundaries) {
    allowedBoundaryUrls.add(cityB.url.trim().toLowerCase());
    allowedDistrictNames.add(normalizeDistrictName(cityB.name));
  }
  for (const regB of resolution.regionBoundaries) {
    allowedBoundaryUrls.add(regB.url.trim().toLowerCase());
    allowedDistrictNames.add(normalizeDistrictName(regB.name));
  }

  // Start with representatives from the postcode lookup that match the confirmed
  // boundary URL, district name, or single-option governance tier
  const byKey = new Map<string, RepresentativeOption>();
  for (const rep of resolution.postcodeRepresentatives) {
    const matchesUrl = allowedBoundaryUrls.has(
      rep.boundary_url.trim().toLowerCase(),
    );
    const matchesDistrictName = allowedDistrictNames.has(
      normalizeDistrictName(rep.district_name),
    );
    const matchesSingleOptionTier =
      (rep.tier === "federal" && resolution.federalOptions.length <= 1) ||
      (rep.tier === "provincial" && resolution.provincialOptions.length <= 1) ||
      (rep.tier === "regional" && resolution.regionalOptions.length <= 1) ||
      (rep.tier === "municipal" && resolution.municipalOptions.length <= 1);

    if (matchesUrl || matchesDistrictName || matchesSingleOptionTier) {
      const key = `${rep.repId}::${rep.representative_set_name.toLowerCase()}`;
      byKey.set(key, rep);
    }
  }

  // For any explicitly confirmed boundary that has no matching rep in postcodeRepresentatives
  // (e.g. a concordance ward or riding), fetch its representatives from OpenNorth
  const missingBoundaries = selectedSpecificBoundaries.filter(
    (b) =>
      !Array.from(byKey.values()).some(
        (rep) =>
          rep.boundary_url.trim().toLowerCase() ===
            b.url.trim().toLowerCase() ||
          normalizeDistrictName(rep.district_name) ===
            normalizeDistrictName(b.name),
      ),
  );

  if (missingBoundaries.length > 0) {
    const fetchedLists = await Promise.all(
      missingBoundaries.map((b) => fetchRepresentativesForBoundary(b.url)),
    );
    for (const list of fetchedLists) {
      for (const rep of list) {
        const key = `${rep.repId}::${rep.representative_set_name.toLowerCase()}`;
        if (!byKey.has(key)) {
          byKey.set(key, rep);
        }
      }
    }
  }

  const reps = Array.from(byKey.values());

  // Check Firestore blocklist (`rep_email_blocklist/{repId}`) in parallel
  const unsubscribedIds = new Set<string>();
  try {
    const { db, firestoreModule } = await loadFirebaseFirestore();
    const { doc, getDoc } = firestoreModule;
    const uniqueRepIds = Array.from(new Set(reps.map((r) => r.repId)));
    await Promise.all(
      uniqueRepIds.map(async (repId) => {
        try {
          const snap = await getDoc(
            doc(db, REP_EMAIL_BLOCKLIST_COLLECTION, repId),
          );
          if (snap.exists()) {
            unsubscribedIds.add(repId);
          }
        } catch {
          // Ignore individual read errors
        }
      }),
    );
  } catch {
    // Ignore offline / blocklist read errors; server enforces blocklist authoritatively
  }

  const tierOrder: Record<RepresentativeOption["tier"], number> = {
    municipal: 1,
    regional: 2,
    provincial: 3,
    federal: 4,
  };

  return reps
    .map((r) => ({
      ...r,
      unsubscribed: unsubscribedIds.has(r.repId),
    }))
    .sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
}

/**
 * Resolve representatives strictly for the single governance tier & boundary
 * clicked by the user on Slide 2 of the `/message_representative` carousel:
 * - `federal`: MP for the selected federal riding
 * - `provincial`: MPP/MLA/MNA for the selected provincial riding
 * - `regional`: Regional Chair & Regional Councillors for the selected regional boundary
 * - `municipal`: Local Ward Councillor + City Mayor for the selected municipal boundary
 */
export async function resolveRepresentativesForTierSelection(params: {
  resolution: PostcodeBoundaryResolution;
  tier: GovernanceTierSlug;
  boundary: PoliticalBoundaryOption;
}): Promise<ResolvedRepresentative[]> {
  const { resolution, tier, boundary } = params;

  const allowedUrls = new Set<string>([boundary.url.trim().toLowerCase()]);
  const allowedNames = new Set<string>([normalizeDistrictName(boundary.name)]);

  if (tier === "municipal") {
    for (const cityB of resolution.cityBoundaries) {
      allowedUrls.add(cityB.url.trim().toLowerCase());
      allowedNames.add(normalizeDistrictName(cityB.name));
    }
  } else if (tier === "regional") {
    for (const regB of resolution.regionBoundaries) {
      allowedUrls.add(regB.url.trim().toLowerCase());
      allowedNames.add(normalizeDistrictName(regB.name));
    }
  }

  const byKey = new Map<string, RepresentativeOption>();
  const tierOptionCount =
    tier === "federal"
      ? resolution.federalOptions.length
      : tier === "provincial"
      ? resolution.provincialOptions.length
      : tier === "regional"
      ? resolution.regionalOptions.length
      : resolution.municipalOptions.length;

  for (const rep of resolution.postcodeRepresentatives) {
    if (rep.tier !== tier) continue;
    const matchesUrl = allowedUrls.has(rep.boundary_url.trim().toLowerCase());
    const matchesName = allowedNames.has(
      normalizeDistrictName(rep.district_name),
    );
    const matchesSingleOption = tierOptionCount <= 1;

    if (matchesUrl || matchesName || matchesSingleOption) {
      const key = `${rep.repId}::${rep.representative_set_name.toLowerCase()}`;
      byKey.set(key, rep);
    }
  }

  // If the clicked boundary itself was a concordance option not in postcodeRepresentatives, fetch it
  const hasSpecificBoundaryRep = Array.from(byKey.values()).some(
    (rep) =>
      rep.boundary_url.trim().toLowerCase() ===
        boundary.url.trim().toLowerCase() ||
      normalizeDistrictName(rep.district_name) ===
        normalizeDistrictName(boundary.name),
  );

  if (!hasSpecificBoundaryRep) {
    const fetched = await fetchRepresentativesForBoundary(boundary.url);
    for (const rep of fetched) {
      const key = `${rep.repId}::${rep.representative_set_name.toLowerCase()}`;
      if (!byKey.has(key)) {
        byKey.set(key, { ...rep, tier });
      }
    }
  }

  const reps = Array.from(byKey.values());
  const unsubscribedIds = new Set<string>();
  try {
    const { db, firestoreModule } = await loadFirebaseFirestore();
    const { doc, getDoc } = firestoreModule;
    const uniqueRepIds = Array.from(new Set(reps.map((r) => r.repId)));
    await Promise.all(
      uniqueRepIds.map(async (repId) => {
        try {
          const snap = await getDoc(
            doc(db, REP_EMAIL_BLOCKLIST_COLLECTION, repId),
          );
          if (snap.exists()) {
            unsubscribedIds.add(repId);
          }
        } catch {
          // Ignore individual read error
        }
      }),
    );
  } catch {
    // Server enforces blocklist authoritatively
  }

  return reps.map((r) => ({
    ...r,
    unsubscribed: unsubscribedIds.has(r.repId),
  }));
}

/**
 * Call the server-authoritative `submitConstituentMessage` Cloud Function.
 */
export async function sendConstituentCommsMessage(
  payload: SubmitConstituentMessagePayload,
): Promise<{ results: RecipientDeliveryOutcome[] }> {
  const { functions, functionsModule } = await loadFirebaseFunctions();
  const callable = functionsModule.httpsCallable<
    SubmitConstituentMessagePayload,
    { results: RecipientDeliveryOutcome[] }
  >(functions, "submitConstituentMessage");

  const response = await callable(payload);

  trackEvent("post_message", {
    mode: payload.visibility,
    content_type: "constituent_comms",
    recipient_count: payload.recipients.length,
  });
  trackEvent("contact", {
    method: "constituent_comms",
    visibility: payload.visibility,
    postcode: payload.postcode,
  });
  trackEvent("generate_lead", {
    source: `comms_${payload.visibility}`,
    postcode: payload.postcode,
  });

  return response.data;
}

/**
 * Call the `unsubscribeRepresentative` Cloud Function when a representative
 * visits their signed unsubscribe link.
 */
export async function unsubscribeRepresentativeViaLink(params: {
  repId: string;
  email: string;
  name: string;
  sig: string;
}): Promise<{ status: string; repId: string; email: string; name: string }> {
  const { functions, functionsModule } = await loadFirebaseFunctions();
  const callable = functionsModule.httpsCallable<
    typeof params,
    { status: string; repId: string; email: string; name: string }
  >(functions, "unsubscribeRepresentative");

  const response = await callable(params);
  return response.data;
}

/**
 * Subscribe in real time to recent public constituent letters (`comms_public`).
 */
export function subscribeToRecentPublicComms(options: {
  limitCount?: number;
  onUpdate: (posts: PublicCommsPost[]) => void;
  onError?: (err: Error) => void;
}): () => void {
  let cancelled = false;
  let unsubscribeSnapshot: (() => void) | undefined;

  void loadFirebaseFirestore()
    .then(({ db, firestoreModule }) => {
      if (cancelled) return;
      const { Timestamp, collection, limit, onSnapshot, orderBy, query } =
        firestoreModule;

      const q = query(
        collection(db, COMMS_PUBLIC_COLLECTION),
        orderBy("createdAt", "desc"),
        limit(options.limitCount ?? 20),
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          if (cancelled) return;
          const posts: PublicCommsPost[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const rawTs = data.createdAt;
            const createdAt =
              rawTs instanceof Timestamp ? rawTs.toDate() : new Date();

            return {
              id: docSnap.id,
              senderName:
                typeof data.senderName === "string"
                  ? data.senderName
                  : "Constituent",
              postcode:
                typeof data.postcode === "string" ? data.postcode : "",
              subject: typeof data.subject === "string" ? data.subject : "",
              body: typeof data.body === "string" ? data.body : "",
              repName: typeof data.repName === "string" ? data.repName : "",
              electedOffice:
                typeof data.electedOffice === "string"
                  ? data.electedOffice
                  : "Representative",
              districtName:
                typeof data.districtName === "string" ? data.districtName : "",
              representativeSetName:
                typeof data.representativeSetName === "string"
                  ? data.representativeSetName
                  : "",
              createdAt,
            };
          });
          options.onUpdate(posts);
        },
        (err) => {
          if (!cancelled) {
            options.onError?.(err);
          }
        },
      );
    })
    .catch((err) => {
      if (!cancelled) {
        options.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    });

  return () => {
    cancelled = true;
    unsubscribeSnapshot?.();
  };
}
