/**
 * Sparse ElectionSet aggregate counts (`electionSets/{setId}`).
 *
 * Maintains and repairs the sparse `electionSets` collection from `users/{uid}`
 * documents. Each user document stores `election_sets: UserElectionSet[]` once
 * the user confirms their Municipal, Provincial, and Federal political
 * boundaries on `/profile`.
 */

import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const REGION = "northamerica-northeast1";
export const USERS_COLLECTION = "users";
export const ELECTION_SETS_COLLECTION = "electionSets";

export interface StoredElectionSet {
  id: string;
  url: string;
  name: string;
  boundary_set_name: string;
  tier: "municipal" | "provincial" | "federal";
  external_id: string | null;
  city: string | null;
  province: string | null;
}

/**
 * Recompute every sparse `electionSets/{setId}` document from scratch by
 * scanning all completed user profiles (`users` collection).
 */
export const recomputeWaitlistCounts = onCall(
  {region: REGION},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to recompute election set counts.",
      );
    }

    const db = getFirestore();
    const usersSnap = await db.collection(USERS_COLLECTION).get();

    const tallies = new Map<
      string,
      {meta: StoredElectionSet; count: number}
    >();

    usersSnap.forEach((docSnap) => {
      const sets = docSnap.get("election_sets");
      if (!Array.isArray(sets)) return;
      for (const raw of sets) {
        if (!raw || typeof raw.id !== "string" || !raw.id) continue;
        const existing = tallies.get(raw.id);
        if (existing) {
          existing.count += 1;
        } else {
          tallies.set(raw.id, {
            meta: {
              id: raw.id,
              url: typeof raw.url === "string" ? raw.url : "",
              name: typeof raw.name === "string" ? raw.name : raw.id,
              boundary_set_name:
                typeof raw.boundary_set_name === "string" ?
                  raw.boundary_set_name :
                  "",
              tier:
                raw.tier === "municipal" ||
                raw.tier === "provincial" ||
                raw.tier === "federal" ?
                  raw.tier :
                  "municipal",
              external_id:
                typeof raw.external_id === "string" ? raw.external_id : null,
              city: typeof raw.city === "string" ? raw.city : null,
              province: typeof raw.province === "string" ? raw.province : null,
            },
            count: 1,
          });
        }
      }
    });

    const batch = db.batch();
    const results: Array<{id: string; name: string; count: number}> = [];

    for (const [id, entry] of tallies.entries()) {
      const ref = db.collection(ELECTION_SETS_COLLECTION).doc(id);
      batch.set(
        ref,
        {
          ...entry.meta,
          count: entry.count,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      results.push({id, name: entry.meta.name, count: entry.count});
    }

    await batch.commit();
    logger.info("Recomputed sparse electionSets counts", {
      sets: results.length,
    });
    return {electionSets: results};
  },
);
