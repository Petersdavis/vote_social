/**
 * Constituent-to-Representative message helpers.
 *
 * Implements:
 * 1. Server-authoritative representative email resolution & 30-day Firestore
 *    cache (`boundary_reps_cache/{boundaryId}`), never trusting client emails.
 * 2. Representative unsubscribe blocklist (`rep_email_blocklist/{repId}`).
 * 3. Per-representative 24-hour notification rate limit (`representatives_cache/{repId}`).
 * 4. Quick-and-dirty spam/toxic content screening with dead-letter routing.
 * 5. Public (`comms_public`) and Private (`comms_private`) message storage.
 * 6. Outbound notification dispatch via Amazon SES (`ca-central-1`).
 */

import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {
  // createUnsubscribeSignature,
  // sendRepNotificationViaSes,
  verifyUnsubscribeSignature,
} from "./sesMailer";
import { evaluateMessageRisk } from "./messageModeration";

export const REGION = "northamerica-northeast1";

export const BOUNDARY_REPS_CACHE_COLLECTION = "boundary_reps_cache";
export const REPRESENTATIVES_CACHE_COLLECTION = "representatives_cache";
export const REP_EMAIL_BLOCKLIST_COLLECTION = "rep_email_blocklist";
export const COMMS_DEAD_LETTER_COLLECTION = "comms_dead_letter";
export const COMMS_PUBLIC_COLLECTION = "comms_public";
export const COMMS_PRIVATE_COLLECTION = "comms_private";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DAILY_EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export const sesAwsRegion = defineString("SES_AWS_REGION", {
  default: "ca-central-1",
});
export const sesFromEmail = defineString("SES_FROM_EMAIL", {
  default: "notifications@vote-social.ca",
});

export const sesAwsAccessKeyId = defineSecret("SES_AWS_ACCESS_KEY_ID");
export const sesAwsSecretAccessKey = defineSecret("SES_AWS_SECRET_ACCESS_KEY");
export const commsUnsubscribeSecret = defineSecret("COMMS_UNSUBSCRIBE_SECRET");

export interface CachedBoundaryRep {
  repId: string;
  name: string;
  electedOffice: string;
  districtName: string;
  representativeSetName: string;
  email: string;
  boundaryUrl: string;
}

const VALID_BOUNDARY_URL_REGEX = /^\/boundaries\/[a-z0-9-_]+\/[a-z0-9-_]+\/$/i;
const MAX_MESSAGE_BODY_LENGTH = 1000;

/**
 * Reject HTML tags, script injections, dangerous URI schemes (`javascript:`,
 * `data:`, `vbscript:`), HTML entity-encoded tags/schemes, and inline event
 * handlers while allowing plain text and standard `http://` / `https://` links.
 */
function containsXssVector(input: string): boolean {
  const htmlTagPattern = /<\/?[a-zA-Z!/?][^>]*>/;
  const dangerousSchemePattern = /\b(?:javascript|vbscript|data)\s*:/i;
  const eventHandlerPattern = /\bon[a-z]{2,}\s*=/i;
  const encodedEntityVectorPattern = /&(?:#x0*3c|#0*60|lt)\b/i;
  return (
    htmlTagPattern.test(input) ||
    dangerousSchemePattern.test(input) ||
    eventHandlerPattern.test(input) ||
    encodedEntityVectorPattern.test(input)
  );
}

/**
 * Verify that the incoming request originates from a Canadian IP address
 * using Cloudflare (`cf-ipcountry`) or Google Cloud Edge (`x-appengine-country`).
 */
function assertCanadianOrigin(
  headers: Record<string, string | string[] | undefined>,
): void {
  const rawCfCountry = headers["cf-ipcountry"];
  const rawGcpCountry = headers["x-appengine-country"];

  const cfCountry = (
    Array.isArray(rawCfCountry) ? rawCfCountry[0] : rawCfCountry ?? ""
  )
    .trim()
    .toUpperCase();
  const gcpCountry = (
    Array.isArray(rawGcpCountry) ? rawGcpCountry[0] : rawGcpCountry ?? ""
  )
    .trim()
    .toUpperCase();

  const resolvedCountry = cfCountry || gcpCountry;

  // In production on Cloud Run / Cloudflare, one or both headers are populated.
  // Allow empty/ZZ only for local emulator testing.
  if (
    resolvedCountry &&
    resolvedCountry !== "CA" &&
    resolvedCountry !== "ZZ"
  ) {
    throw new HttpsError(
      "permission-denied",
      "Constituent communications are restricted to requests originating within Canada.",
    );
  }
}

function boundaryIdFromUrl(url: string): string {
  return url
    .trim()
    .replace(/^\/?boundaries\/?/i, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "__")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

function repIdFromEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, "_");
}

/**
 * Resolve representatives for an OpenNorth boundary URL using the 30-day
 * Firestore cache (`boundary_reps_cache/{boundaryId}`) first, falling back to
 * OpenNorth's `/boundaries/<set>/<slug>/representatives/` endpoint on cache miss.
 */
async function resolveBoundaryRepresentatives(
  db: FirebaseFirestore.Firestore,
  rawBoundaryUrl: string,
): Promise<CachedBoundaryRep[]> {
  const normalizedUrl = rawBoundaryUrl.trim();
  if (!VALID_BOUNDARY_URL_REGEX.test(normalizedUrl)) {
    throw new HttpsError(
      "invalid-argument",
      `Invalid boundary URL format: ${normalizedUrl}`,
    );
  }

  const boundaryId = boundaryIdFromUrl(normalizedUrl);
  const cacheRef = db.collection(BOUNDARY_REPS_CACHE_COLLECTION).doc(boundaryId);
  const cacheSnap = await cacheRef.get();

  if (cacheSnap.exists) {
    const data = cacheSnap.data();
    const fetchedAt = data?.fetchedAt instanceof Timestamp ? data.fetchedAt.toMillis() : 0;
    if (
      fetchedAt > 0 &&
      Date.now() - fetchedAt < CACHE_TTL_MS &&
      Array.isArray(data?.representatives)
    ) {
      return data.representatives as CachedBoundaryRep[];
    }
  }

  // Cache miss or stale (>30 days): fetch from OpenNorth Represent API
  const apiUrl = `https://represent.opennorth.ca${normalizedUrl}representatives/?format=json&limit=100`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new HttpsError(
      "unavailable",
      `Could not verify representatives for boundary ${normalizedUrl}.`,
    );
  }

  const payload = (await response.json()) as {
    objects?: Array<{
      name?: string;
      elected_office?: string;
      district_name?: string;
      representative_set_name?: string;
      email?: string;
    }>;
  };

  const reps: CachedBoundaryRep[] = [];
  for (const item of payload.objects ?? []) {
    const email = (item.email ?? "").trim().toLowerCase();
    const name = (item.name ?? "").trim();
    if (!email || !name) continue;
    reps.push({
      repId: repIdFromEmail(email),
      name,
      electedOffice: (item.elected_office ?? "Representative").trim(),
      districtName: (item.district_name ?? "").trim(),
      representativeSetName: (item.representative_set_name ?? "").trim(),
      email,
      boundaryUrl: normalizedUrl,
    });
  }

  await cacheRef.set(
    {
      boundaryId,
      boundaryUrl: normalizedUrl,
      representatives: reps,
      fetchedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return reps;
}

export interface SubmitConstituentMessageRecipientInput {
  boundaryUrl: string;
  repName: string;
  electedOffice?: string;
}

export interface SubmitConstituentMessageInput {
  senderName: string;
  senderEmail: string;
  postcode: string;
  subject: string;
  body: string;
  visibility: "public" | "private";
  recipients: SubmitConstituentMessageRecipientInput[];
}

export interface RecipientDeliveryResult {
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

/**
 * Submit a constituent message (public or private) to one or more elected
 * representatives. Resolves official emails exclusively from the server-side
 * cache, enforces the unsubscribe blocklist, saves the message, and sends at
 * most 1 Amazon SES notification email per representative per 24 hours.
 */
export const submitConstituentMessage = onCall(
  {
    region: REGION,
    secrets: [
      sesAwsAccessKeyId,
      sesAwsSecretAccessKey,
      commsUnsubscribeSecret,
    ],
  },
  async (request) => {
    assertCanadianOrigin(request.rawRequest?.headers ?? {});

    const data = (request.data ?? {}) as Partial<SubmitConstituentMessageInput>;

    const senderName = (data.senderName ?? "").trim();
    const senderEmail = (data.senderEmail ?? "").trim().toLowerCase();
    const postcode = (data.postcode ?? "").trim().toUpperCase();
    const subject = (data.subject ?? "").trim();
    const body = (data.body ?? "").trim();
    const visibility = data.visibility === "private" ? "private" : "public";
    const recipients = Array.isArray(data.recipients) ? data.recipients : [];

    if (!senderName || senderName.length < 2 || senderName.length > 80) {
      throw new HttpsError(
        "invalid-argument",
        "Please provide your name or username (2–80 characters).",
      );
    }
    if (!senderEmail || !senderEmail.includes("@") || senderEmail.length > 320) {
      throw new HttpsError(
        "invalid-argument",
        "Please provide a valid email address.",
      );
    }
    if (!postcode || postcode.length < 6 || postcode.length > 7) {
      throw new HttpsError(
        "invalid-argument",
        "Please provide a valid Canadian postal code.",
      );
    }
    if (!subject || subject.length < 3 || subject.length > 200) {
      throw new HttpsError(
        "invalid-argument",
        "Please enter a subject line (3–200 characters).",
      );
    }
    if (!body || body.length < 10 || body.length > MAX_MESSAGE_BODY_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `Please enter a message between 10 and ${MAX_MESSAGE_BODY_LENGTH} characters.`,
      );
    }
    if (
      containsXssVector(senderName) ||
      containsXssVector(subject) ||
      containsXssVector(body)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "HTML tags and script expressions are not permitted. Plain text and standard http:// or https:// links are allowed.",
      );
    }
    if (recipients.length === 0 || recipients.length > 10) {
      throw new HttpsError(
        "invalid-argument",
        "Please select between 1 and 10 representatives.",
      );
    }

    const db = getFirestore();
    const risk = evaluateMessageRisk({
      senderName,
      senderEmail,
      subject,
      body,
    });
    const results: RecipientDeliveryResult[] = [];
    const seenRepIds = new Set<string>();

    if (risk.flagged) {
      await db.collection(COMMS_DEAD_LETTER_COLLECTION).add({
        senderName,
        senderEmail,
        postcode,
        subject,
        body,
        visibility,
        recipients,
        moderation: {
          flagged: true,
          score: risk.score,
          reasons: risk.reasons,
        },
        routedAt: FieldValue.serverTimestamp(),
        route: "dead_letter",
      });

      logger.warn("Constituent message routed to dead letter collection", {
        senderEmail,
        score: risk.score,
        reasons: risk.reasons,
        recipientCount: recipients.length,
      });

      return {
        results: recipients.map((rec) => ({
          repId: "dead_letter",
          repName: rec?.repName?.trim() || "Unknown",
          electedOffice: rec?.electedOffice?.trim() || "",
          districtName: "",
          officialEmail: "",
          status: "routed_dead_letter",
        })),
      };
    }

    for (const rec of recipients) {
      if (!rec || typeof rec.boundaryUrl !== "string" || typeof rec.repName !== "string") {
        continue;
      }

      const boundaryReps = await resolveBoundaryRepresentatives(
        db,
        rec.boundaryUrl,
      );
      const targetNameLower = rec.repName.trim().toLowerCase();
      const targetOfficeLower = (rec.electedOffice ?? "").trim().toLowerCase();

      const matchedRep =
        boundaryReps.find(
          (r) =>
            r.name.toLowerCase() === targetNameLower &&
            (!targetOfficeLower ||
              r.electedOffice.toLowerCase() === targetOfficeLower),
        ) ??
        boundaryReps.find((r) => r.name.toLowerCase() === targetNameLower);

      if (!matchedRep) {
        throw new HttpsError(
          "not-found",
          `Could not verify official email for representative "${rec.repName}" in boundary ${rec.boundaryUrl}.`,
        );
      }

      if (seenRepIds.has(matchedRep.repId)) {
        continue;
      }
      seenRepIds.add(matchedRep.repId);

      // 1. Check if this representative has unsubscribed (blocklist)
      const blocklistSnap = await db
        .collection(REP_EMAIL_BLOCKLIST_COLLECTION)
        .doc(matchedRep.repId)
        .get();

      if (blocklistSnap.exists) {
        results.push({
          repId: matchedRep.repId,
          repName: matchedRep.name,
          electedOffice: matchedRep.electedOffice,
          districtName: matchedRep.districtName,
          officialEmail: matchedRep.email,
          status: "blocked_unsubscribed",
        });
        continue;
      }

      // 2. Save the message to comms_public or comms_private
      if (visibility === "public") {
        await db.collection(COMMS_PUBLIC_COLLECTION).add({
          senderName,
          postcode,
          subject,
          body,
          visibility: "public",
          repId: matchedRep.repId,
          repName: matchedRep.name,
          electedOffice: matchedRep.electedOffice,
          districtName: matchedRep.districtName,
          representativeSetName: matchedRep.representativeSetName,
          boundaryUrl: matchedRep.boundaryUrl,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Always store full record (including constituent email) in write-only comms_private for the representative
      await db.collection(COMMS_PRIVATE_COLLECTION).add({
        senderName,
        senderEmail,
        postcode,
        subject,
        body,
        visibility,
        repId: matchedRep.repId,
        repName: matchedRep.name,
        electedOffice: matchedRep.electedOffice,
        districtName: matchedRep.districtName,
        representativeSetName: matchedRep.representativeSetName,
        officialEmail: matchedRep.email,
        boundaryUrl: matchedRep.boundaryUrl,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 3. Enforce 24-hour per-representative notification rate limit via transaction
      const repCacheRef = db
        .collection(REPRESENTATIVES_CACHE_COLLECTION)
        .doc(matchedRep.repId);

      const rateLimitOutcome = await db.runTransaction(async (tx) => {
        const repSnap = await tx.get(repCacheRef);
        const repData = repSnap.data() ?? {};
        const prevUnread =
          typeof repData.unreadMessageCount === "number"
            ? repData.unreadMessageCount
            : 0;
        const lastNotifiedTs =
          repData.lastNotifiedAt instanceof Timestamp
            ? repData.lastNotifiedAt.toMillis()
            : 0;

        const nowMs = Date.now();
        const canSendEmailToday =
          lastNotifiedTs === 0 ||
          nowMs - lastNotifiedTs >= DAILY_EMAIL_COOLDOWN_MS;
        const nextUnread = prevUnread + 1;

        tx.set(
          repCacheRef,
          {
            repId: matchedRep.repId,
            name: matchedRep.name,
            electedOffice: matchedRep.electedOffice,
            districtName: matchedRep.districtName,
            representativeSetName: matchedRep.representativeSetName,
            email: matchedRep.email,
            boundaryUrl: matchedRep.boundaryUrl,
            unreadMessageCount: nextUnread,
            lastMessageAt: FieldValue.serverTimestamp(),
            ...(canSendEmailToday
              ? { lastNotifiedAt: FieldValue.serverTimestamp() }
              : {}),
          },
          { merge: true },
        );

        return { canSendEmailToday, unreadCount: nextUnread };
      });

      if (!rateLimitOutcome.canSendEmailToday) {
        results.push({
          repId: matchedRep.repId,
          repName: matchedRep.name,
          electedOffice: matchedRep.electedOffice,
          districtName: matchedRep.districtName,
          officialEmail: matchedRep.email,
          status: "saved_daily_limit_reached",
        });
        continue;
      }

      // 4. DEMO MODE: Store messages in Firestore, but keep Amazon SES email dispatch
      // commented out prior to official launch.
      logger.info(
        "DEMO MODE: Constituent message stored in Firestore; Amazon SES email dispatch is commented out.",
        {
          repId: matchedRep.repId,
          email: matchedRep.email,
          unreadCount: rateLimitOutcome.unreadCount,
        },
      );

      results.push({
        repId: matchedRep.repId,
        repName: matchedRep.name,
        electedOffice: matchedRep.electedOffice,
        districtName: matchedRep.districtName,
        officialEmail: matchedRep.email,
        status: "saved_daily_limit_reached",
      });

      /*
      // 4. Send Amazon SES notification email (at most 1 per rep per 24h)
      const sig = createUnsubscribeSignature(
        commsUnsubscribeSecret.value(),
        matchedRep.repId,
        matchedRep.email,
      );
      const unsubscribeUrl =
        `https://vote-social.ca/message_representative/?unsubscribe_rep=${encodeURIComponent(matchedRep.repId)}` +
        `&email=${encodeURIComponent(matchedRep.email)}` +
        `&name=${encodeURIComponent(matchedRep.name)}` +
        `&sig=${encodeURIComponent(sig)}`;
      const registerUrl =
        `https://vote-social.ca/register/?email=${encodeURIComponent(matchedRep.email)}` +
        `&role=representative`;

      try {
        await sendRepNotificationViaSes({
          credentials: {
            accessKeyId: sesAwsAccessKeyId.value().trim(),
            secretAccessKey: sesAwsSecretAccessKey.value().trim(),
            region: sesAwsRegion.value().trim() || "ca-central-1",
          },
          fromEmail:
            sesFromEmail.value().trim() || "notifications@vote-social.ca",
          toEmail: matchedRep.email,
          repName: matchedRep.name,
          electedOffice: matchedRep.electedOffice,
          districtName: matchedRep.districtName,
          constituentName: senderName,
          constituentPostcode: postcode,
          subjectLine: subject,
          visibility,
          unreadCount: rateLimitOutcome.unreadCount,
          unsubscribeUrl,
          registerUrl,
        });

        results.push({
          repId: matchedRep.repId,
          repName: matchedRep.name,
          electedOffice: matchedRep.electedOffice,
          districtName: matchedRep.districtName,
          officialEmail: matchedRep.email,
          status: "notified_email_sent",
        });
      } catch (err) {
        logger.error("SES send failed for representative; rolling back lastNotifiedAt", {
          repId: matchedRep.repId,
          email: matchedRep.email,
          error: err instanceof Error ? err.message : String(err),
        });
        // Reset lastNotifiedAt so the next message or retry can send once SES Sandbox is lifted
        await repCacheRef.set({ lastNotifiedAt: null }, { merge: true });
        results.push({
          repId: matchedRep.repId,
          repName: matchedRep.name,
          electedOffice: matchedRep.electedOffice,
          districtName: matchedRep.districtName,
          officialEmail: matchedRep.email,
          status: "saved_daily_limit_reached",
        });
      }
      */
    }

    return { results };
  },
);

/**
 * Unsubscribe a representative from Vote Social constituent notifications using
 * the HMAC-SHA256 signed link included in every SES notification email.
 * Populates `rep_email_blocklist/{repId}` so any future constituent message
 * attempt to this representative fails and prompts the user to email them directly.
 */
export const unsubscribeRepresentative = onCall(
  {
    region: REGION,
    secrets: [commsUnsubscribeSecret],
  },
  async (request) => {
    const data = (request.data ?? {}) as {
      repId?: string;
      email?: string;
      name?: string;
      sig?: string;
    };

    const repId = (data.repId ?? "").trim().toLowerCase();
    const email = (data.email ?? "").trim().toLowerCase();
    const name = (data.name ?? "Representative").trim();
    const sig = (data.sig ?? "").trim();

    if (!repId || !email || !sig) {
      throw new HttpsError(
        "invalid-argument",
        "Missing unsubscribe verification parameters.",
      );
    }

    const isValid = verifyUnsubscribeSignature(
      commsUnsubscribeSecret.value(),
      repId,
      email,
      sig,
    );

    if (!isValid) {
      throw new HttpsError(
        "permission-denied",
        "Invalid or expired unsubscribe signature.",
      );
    }

    const db = getFirestore();
    await db
      .collection(REP_EMAIL_BLOCKLIST_COLLECTION)
      .doc(repId)
      .set(
        {
          repId,
          email,
          name,
          unsubscribedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    await db
      .collection(REPRESENTATIVES_CACHE_COLLECTION)
      .doc(repId)
      .set(
        {
          unsubscribed: true,
          unsubscribedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    logger.info("Representative unsubscribed from vote-social.ca notifications", {
      repId,
      email,
    });

    return { status: "unsubscribed", repId, email, name };
  },
);
