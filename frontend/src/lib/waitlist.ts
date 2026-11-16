/**
 * Waitlist signup persistence.
 *
 * Uses lazy-loaded Firestore via `loadFirebaseFirestore()` so `firebase/firestore`
 * is split out of the initial page bundle.
 */

import { trackEvent } from "./analytics";
import { loadFirebaseFirestore } from "./firebase";
import { isCanonicalCommunityId } from "./ontario-communities";

/** Firestore collection holding one document per waitlist signup. */
export const WAITLIST_COLLECTION = "waitlist";

/** Shape of a `waitlist/{id}` Firestore document. */
export interface WaitlistSignup {
  /** Normalized (lowercased, trimmed) email address. */
  email: string;
  /** Display name as entered by the user. */
  name: string;
  /** Canonical community id (see `ontario-communities.ts`). */
  community: string;
  /** Where the signup came from, e.g. "landing" or "leaderboard". */
  source: string;
  /** Community id of the referrer, when the signup came from a share link. */
  referralCommunity: string | null;
  createdAt: unknown;
}

export interface WaitlistInput {
  name: string;
  email: string;
  community: string;
  /** Optional source label; defaults to "landing". */
  source?: string;
  /** Optional referring community id from a share link. */
  referralCommunity?: string | null;
}

export type WaitlistResult =
  | { status: "created" }
  | { status: "duplicate" };

/** Normalize an email for storage and duplicate detection. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Derive a stable, Firestore-safe document id from an email address.
 */
export function waitlistDocId(email: string): string {
  return normalizeEmail(email).replace(/[^a-z0-9@._+-]/g, "_");
}

/** Thrown when a signup is submitted with invalid or non-canonical data. */
export class WaitlistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WaitlistValidationError";
  }
}

/**
 * Persist a waitlist signup.
 */
export async function submitWaitlistSignup(
  input: WaitlistInput,
): Promise<WaitlistResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const community = input.community.trim();

  if (!name) {
    throw new WaitlistValidationError("Name is required.");
  }
  if (!email) {
    throw new WaitlistValidationError("Email is required.");
  }
  if (!isCanonicalCommunityId(community)) {
    throw new WaitlistValidationError("Please choose a community from the list.");
  }

  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { doc, runTransaction, serverTimestamp } = firestoreModule;
  const ref = doc(db, WAITLIST_COLLECTION, waitlistDocId(email));

  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);

    if (existing.exists()) {
      if (existing.get("community") !== community) {
        transaction.update(ref, { community });
      }
      return { status: "duplicate" };
    }

    const signup: WaitlistSignup = {
      email,
      name,
      community,
      source: input.source ?? "landing",
      referralCommunity: input.referralCommunity ?? null,
      createdAt: serverTimestamp(),
    };

    transaction.set(ref, signup);
    return { status: "created" };
  });
}

/**
 * Persist an initial email-only waitlist user record from the landing page CTA
 * before redirecting to Step 2 (/register?email=...).
 */
export async function submitEmailWaitlist(
  rawEmail: string,
  source = "landing-hero",
): Promise<WaitlistResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new WaitlistValidationError("Email is required.");
  }

  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { doc, serverTimestamp, setDoc } = firestoreModule;
  const ref = doc(db, WAITLIST_COLLECTION, waitlistDocId(email));

  await setDoc(
    ref,
    {
      email,
      first_name: null,
      last_name: null,
      postcode: null,
      is_candidate: false,
      candidate_election: null,
      is_org_representative: false,
      organization_name: null,
      is_journalist: false,
      published_article_url: null,
      profileComplete: false,
      source,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  trackEvent("generate_lead", { source });
  return { status: "created" };
}
