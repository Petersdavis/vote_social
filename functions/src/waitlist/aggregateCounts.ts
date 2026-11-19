/**
 * Sparse ElectionSet aggregate counts (`electionSets/{setId}`).
 *
 * Maintains and repairs the sparse `electionSets` collection from `waitlist/{entryId}`
 * and `users/{uid}` documents, automatically linking unauthenticated `waitlist`
 * records onto `users/{uid}` if the user later signs in with the same email.
 */

import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const REGION = "northamerica-northeast1";
export const USERS_COLLECTION = "users";
export const WAITLIST_COLLECTION = "waitlist";
export const ELECTION_SETS_COLLECTION = "electionSets";
export const PUBLIC_METADATA_COLLECTION = "public_metadata";
export const PUBLIC_STATS_DOC_ID = "stats";

function waitlistDocIdFromEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, "_");
}

/**
 * When a new `users/{userId}` document is created (after Firebase Auth login):
 * - Check if a `waitlist/{emailDocId}` record already exists for that email.
 * - If so, copy the confirmed electoral districts (`postcode`, `election_sets`,
 *   `profileComplete`, etc.) onto `users/{userId}` and skip double-counting
 *   `public_metadata/stats.user_count`.
 * - Otherwise, increment `public_metadata/stats.user_count`.
 */
export const onUserCreated = onDocumentCreated(
  {
    document: `${USERS_COLLECTION}/{userId}`,
    region: REGION,
  },
  async (event) => {
    const db = getFirestore();
    const userData = event.data?.data();
    const rawEmail =
      typeof userData?.email === "string" ? userData.email.trim() : "";

    let alreadyInWaitlist = false;

    if (rawEmail) {
      const waitlistId = waitlistDocIdFromEmail(rawEmail);
      const waitlistSnap = await db
        .collection(WAITLIST_COLLECTION)
        .doc(waitlistId)
        .get();

      if (waitlistSnap.exists) {
        alreadyInWaitlist = true;
        const wData = waitlistSnap.data() ?? {};
        const mergePayload: Record<string, unknown> = {
          linkedWaitlistId: waitlistId,
          updatedAt: FieldValue.serverTimestamp(),
        };
        const fieldsToCopy = [
          "postcode",
          "city",
          "province",
          "municipal_district",
          "provincial_district",
          "federal_district",
          "election_sets",
          "election_set_ids",
          "profileComplete",
          "attribution",
        ];
        for (const key of fieldsToCopy) {
          if (wData[key] !== undefined && userData?.[key] === undefined) {
            mergePayload[key] = wData[key];
          }
        }
        await db
          .collection(USERS_COLLECTION)
          .doc(event.params.userId)
          .set(mergePayload, {merge: true});
      }
    }

    if (!alreadyInWaitlist) {
      const statsRef = db
        .collection(PUBLIC_METADATA_COLLECTION)
        .doc(PUBLIC_STATS_DOC_ID);

      await statsRef.set(
        {
          user_count: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
    }

    logger.info("Processed new users/{userId} document", {
      userId: event.params.userId,
      linkedFromWaitlist: alreadyInWaitlist,
    });
  },
);

/**
 * Increment `public_metadata/stats.user_count` whenever a new `waitlist/{entryId}`
 * document is created.
 */
export const onWaitlistCreated = onDocumentCreated(
  {
    document: `${WAITLIST_COLLECTION}/{entryId}`,
    region: REGION,
  },
  async (event) => {
    const db = getFirestore();
    const statsRef = db
      .collection(PUBLIC_METADATA_COLLECTION)
      .doc(PUBLIC_STATS_DOC_ID);

    await statsRef.set(
      {
        user_count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    logger.info("Incremented public_metadata/stats.user_count from waitlist", {
      entryId: event.params.entryId,
    });
  },
);

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
 * scanning both `waitlist` and `users` collections (deduplicating by email).
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
    const [waitlistSnap, usersSnap] = await Promise.all([
      db.collection(WAITLIST_COLLECTION).get(),
      db.collection(USERS_COLLECTION).get(),
    ]);

    // Deduplicate records by normalized email (preferring `users` if both have `election_sets`)
    const recordsByKey = new Map<string, FirebaseFirestore.DocumentData>();

    waitlistSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const emailKey =
        typeof data.email === "string" && data.email.trim() ?
          data.email.trim().toLowerCase() :
          `waitlist:${docSnap.id}`;
      recordsByKey.set(emailKey, data);
    });

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const emailKey =
        typeof data.email === "string" && data.email.trim() ?
          data.email.trim().toLowerCase() :
          `user:${docSnap.id}`;
      const existing = recordsByKey.get(emailKey);
      if (!existing || Array.isArray(data.election_sets)) {
        recordsByKey.set(emailKey, {...existing, ...data});
      }
    });

    const tallies = new Map<
      string,
      { meta: StoredElectionSet; count: number }
    >();

    for (const data of recordsByKey.values()) {
      const sets = data.election_sets;
      if (!Array.isArray(sets)) continue;
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
    }

    const batch = db.batch();
    const results: Array<{ id: string; name: string; count: number }> = [];

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

    const uniqueUserCount = recordsByKey.size;
    await db
      .collection(PUBLIC_METADATA_COLLECTION)
      .doc(PUBLIC_STATS_DOC_ID)
      .set(
        {
          user_count: uniqueUserCount,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );

    logger.info("Recomputed sparse electionSets counts", {
      sets: results.length,
      userCount: uniqueUserCount,
    });
    return {electionSets: results, userCount: uniqueUserCount};
  },
);
