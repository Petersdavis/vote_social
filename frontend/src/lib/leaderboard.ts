/**
 * Sparse ElectionSet Waitlist Counters (`electionSets/{setId}`).
 *
 * Queries only election sets with `count > 0` pending users, sorted by count
 * descending and grouped or badged by governance tier (`municipal`,
 * `provincial`, `federal`).
 */

import { collection, getDocs, query, where } from "firebase/firestore";

import { ELECTION_SETS_COLLECTION } from "./auth";
import { getFirebaseFirestore } from "./firebase";
import type { GovernanceTierSlug, UserElectionSet } from "./opennorth";
import { getCommunityLabel, ONTARIO_COMMUNITIES } from "./ontario-communities";
import { absoluteUrl } from "./site";

export const WAITLIST_COUNTS_COLLECTION = "waitlistCounts";

/** A sparse `electionSets/{id}` document with > 0 pending waitlist users. */
export interface ActiveElectionSetCounter extends UserElectionSet {
  count: number;
  rank: number;
}

/**
 * Fetch all sparse `electionSets` with `count > 0` pending users from Firestore,
 * sorted by count (descending) and then alphabetically by name.
 */
export async function fetchActiveElectionSets(): Promise<ActiveElectionSetCounter[]> {
  const db = getFirebaseFirestore();
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
        typeof data.boundary_set_name === "string" ? data.boundary_set_name : "",
      tier,
      external_id: typeof data.external_id === "string" ? data.external_id : null,
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
  const db = getFirebaseFirestore();
  const snapshot = await getDocs(collection(db, WAITLIST_COUNTS_COLLECTION));

  const counts = new Map<string, number>();
  snapshot.forEach((doc) => {
    const data = doc.data() as { community?: unknown; count?: unknown };
    const community = typeof data.community === "string" ? data.community : doc.id;
    const count =
      typeof data.count === "number" && Number.isFinite(data.count) ? data.count : 0;
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
