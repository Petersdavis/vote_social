/**
 * Sparse ElectionSet Waitlist Counters (`electionSets/{setId}`) & Public Metadata.
 *
 * Uses lazy-loaded Firestore via `loadFirebaseFirestore()` so `firebase/firestore`
 * is split out of the initial page bundle.
 */

import { ELECTION_SETS_COLLECTION } from "./auth";
import { firebaseConfig, useFirebaseEmulators } from "./env";
import { loadFirebaseFirestore } from "./firebase";
import type { GovernanceTierSlug, UserElectionSet } from "./opennorth";
import { getCommunityLabel, ONTARIO_COMMUNITIES } from "./ontario-communities";
import { absoluteUrl } from "./site";

export const WAITLIST_COUNTS_COLLECTION = "waitlistCounts";
export const PUBLIC_METADATA_COLLECTION = "public_metadata";
export const PUBLIC_STATS_DOC_ID = "stats";

/**
 * Fetch the global user count from `public_metadata/stats` (`user_count`) using
 * the lightweight Firestore REST endpoint so the landing page does not have to
 * download the full 580 KB `firebase/firestore` SDK just to display the counter.
 */
export async function fetchPublicUserCount(): Promise<number> {
  if (!useFirebaseEmulators && firebaseConfig.projectId) {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseConfig.projectId,
    )}/databases/(default)/documents/${PUBLIC_METADATA_COLLECTION}/${PUBLIC_STATS_DOC_ID}`;
    const res = await fetch(url);
    if (res.status === 404) {
      return 0;
    }
    if (res.ok) {
      const json = (await res.json()) as {
        fields?: {
          user_count?: { integerValue?: string; doubleValue?: number };
        };
      };
      const intVal = json.fields?.user_count?.integerValue;
      const dblVal = json.fields?.user_count?.doubleValue;
      const parsed =
        typeof intVal === "string"
          ? Number.parseInt(intVal, 10)
          : typeof dblVal === "number"
          ? dblVal
          : 0;
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }
  }

  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { doc, getDoc } = firestoreModule;
  const ref = doc(db, PUBLIC_METADATA_COLLECTION, PUBLIC_STATS_DOC_ID);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return 0;
  }
  const raw = snapshot.get("user_count");
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

/**
 * Fetch `public_metadata/stats.user_count` without pulling in `firebase/firestore`
 * on initial page load.
 */
export function subscribeToPublicUserCount(
  onUpdate: (count: number) => void,
  onError?: (error: Error) => void,
): () => void {
  let cancelled = false;

  void fetchPublicUserCount()
    .then((count) => {
      if (!cancelled) {
        onUpdate(count);
      }
    })
    .catch((error) => {
      if (!cancelled) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    });

  return () => {
    cancelled = true;
  };
}

/** A sparse `electionSets/{id}` document with > 0 pending waitlist users. */
export interface ActiveElectionSetCounter extends UserElectionSet {
  count: number;
  rank: number;
}

/**
 * Fetch all sparse `electionSets` with `count > 0` pending users from Firestore,
 * sorted by count (descending) and then alphabetically by name.
 */
export async function fetchActiveElectionSets(): Promise<
  ActiveElectionSetCounter[]
> {
  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { collection, getDocs, query, where } = firestoreModule;
  const q = query(
    collection(db, ELECTION_SETS_COLLECTION),
    where("count", ">", 0),
  );
  const snapshot = await getDocs(q);

  const items: Omit<ActiveElectionSetCounter, "rank">[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Partial<ActiveElectionSetCounter>;
    const count =
      typeof data.count === "number" && Number.isFinite(data.count)
        ? data.count
        : 0;
    if (count <= 0) return;

    const tier: GovernanceTierSlug =
      data.tier === "municipal" ||
      data.tier === "provincial" ||
      data.tier === "federal"
        ? data.tier
        : "municipal";

    items.push({
      id: typeof data.id === "string" ? data.id : docSnap.id,
      url: typeof data.url === "string" ? data.url : "",
      name: typeof data.name === "string" ? data.name : docSnap.id,
      boundary_set_name:
        typeof data.boundary_set_name === "string"
          ? data.boundary_set_name
          : "",
      tier,
      external_id:
        typeof data.external_id === "string" ? data.external_id : null,
      city: typeof data.city === "string" ? data.city : null,
      province: typeof data.province === "string" ? data.province : null,
      count,
    });
  });

  items.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });

  return items.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export interface LeaderboardEntry {
  community: string;
  label: string;
  count: number;
  rank: number;
}

export function rankCommunities(
  counts: ReadonlyMap<string, number>,
): LeaderboardEntry[] {
  const rows = ONTARIO_COMMUNITIES.map((community) => ({
    community: community.id,
    label: community.label,
    count: counts.get(community.id) ?? 0,
  }));

  rows.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.label.localeCompare(b.label);
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { collection, getDocs } = firestoreModule;
  const snapshot = await getDocs(collection(db, WAITLIST_COUNTS_COLLECTION));

  const counts = new Map<string, number>();
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as { community?: unknown; count?: unknown };
    const community =
      typeof data.community === "string" ? data.community : docSnap.id;
    const count =
      typeof data.count === "number" && Number.isFinite(data.count)
        ? data.count
        : 0;
    counts.set(community, count);
  });

  return rankCommunities(counts);
}

export function findEntry(
  entries: readonly LeaderboardEntry[],
  communityId: string | null | undefined,
): LeaderboardEntry | undefined {
  if (!communityId) {
    return undefined;
  }
  return entries.find((entry) => entry.community === communityId);
}

export function buildShareUrl(communityId: string): string {
  return absoluteUrl(`/waitlist?ref=${encodeURIComponent(communityId)}`);
}

export function buildShareText(communityId: string): string {
  const label = getCommunityLabel(communityId);
  return `I just joined the Vote Social waitlist for ${label}. Vote Social connects voters, candidates, and local organizations for upcoming elections. Join us:`;
}
