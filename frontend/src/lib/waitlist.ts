/**
 * Waitlist signup persistence.
 *
 * Uses lazy-loaded Firestore via `loadFirebaseFirestore()` so `firebase/firestore`
 * is split out of the initial page bundle.
 */

import { getAttributionParams, trackEvent } from "./analytics";
import { loadFirebaseFirestore } from "./firebase";
import { isCanonicalCommunityId } from "./ontario-communities";
import {
  buildUserElectionSets,
  formatCanadianPostcode,
  type PoliticalBoundaryOption,
  type UserElectionSet,
} from "./opennorth";

/** Firestore collection holding one document per waitlist signup. */
export const WAITLIST_COLLECTION = "waitlist";

/** Sparse Firestore collection holding per-election-set waitlist counters. */
export const ELECTION_SETS_COLLECTION = "electionSets";

/** Browser localStorage key for persisting the user's completed waitlist state without requiring auth. */
export const LOCAL_WAITLIST_STORAGE_KEY = "vs_waitlist_profile";

export interface LocalWaitlistProfile {
  email: string;
  uname?: string | null;
  postcode: string;
  city?: string | null;
  province?: string | null;
  municipal_district?: PoliticalBoundaryOption | null;
  provincial_district?: PoliticalBoundaryOption | null;
  federal_district?: PoliticalBoundaryOption | null;
  election_sets?: UserElectionSet[];
  election_set_ids?: string[];
  profileComplete: boolean;
}

export const WAITLIST_PROFILE_UPDATED_EVENT = "vs-waitlist-profile-updated";

export function getSavedWaitlistProfile(): LocalWaitlistProfile | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_WAITLIST_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalWaitlistProfile;
  } catch {
    return null;
  }
}

export function saveLocalWaitlistProfile(profile: LocalWaitlistProfile): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      LOCAL_WAITLIST_STORAGE_KEY,
      JSON.stringify(profile),
    );
    window.dispatchEvent(new CustomEvent(WAITLIST_PROFILE_UPDATED_EVENT));
  } catch {
    // Ignore localStorage quota/privacy errors
  }
}

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
 * Persist an email-only waitlist signup from the landing page or `/profile`.
 * Saves `{ email, uname, profileComplete: true }` to `localStorage` and writes
 * the signup record to `waitlist/{emailDocId}` in Firestore.
 */
export async function submitEmailWaitlist(
  rawEmail: string,
  source = "landing-hero",
): Promise<WaitlistResult> {
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) {
    throw new WaitlistValidationError("Please enter a valid email address.");
  }

  trackEvent("generate_lead", { source });
  trackEvent("sign_up", { method: "waitlist", source });

  const existing = getSavedWaitlistProfile();

  saveLocalWaitlistProfile({
    email,
    uname: existing?.uname ?? null,
    postcode: existing?.postcode ?? "",
    city: existing?.city ?? null,
    province: existing?.province ?? null,
    municipal_district: existing?.municipal_district ?? null,
    provincial_district: existing?.provincial_district ?? null,
    federal_district: existing?.federal_district ?? null,
    election_sets: existing?.election_sets ?? [],
    election_set_ids: existing?.election_set_ids ?? [],
    profileComplete: true,
  });

  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { doc, serverTimestamp, setDoc } = firestoreModule;
  const ref = doc(db, WAITLIST_COLLECTION, waitlistDocId(email));
  const attribution = getAttributionParams();

  try {
    await setDoc(
      ref,
      {
        email,
        ...(existing?.uname ? { uname: existing.uname } : {}),
        profileComplete: true,
        source,
        ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // If the waitlist document already exists or a duplicate write is rejected,
    // treat the signup attempt as a success since localStorage is saved.
  }
  return { status: "created" };
}

/**
 * Save the user's chosen chat username (`uname`) and `email` in localStorage
 * (`vs_waitlist_profile`) and merge `uname` onto their `waitlist/{emailDocId}`
 * Firestore record.
 */
export async function saveWaitlistUserIdentity(params: {
  uname: string;
  email?: string;
}): Promise<LocalWaitlistProfile> {
  const existing = getSavedWaitlistProfile();
  const trimmedUname = params.uname.trim();
  const rawEmail = params.email?.trim() || existing?.email || "";
  const email = normalizeEmail(rawEmail);

  if (!trimmedUname || trimmedUname.length < 2) {
    throw new WaitlistValidationError(
      "Please choose a username (at least 2 characters).",
    );
  }
  if (trimmedUname.length > 40) {
    throw new WaitlistValidationError(
      "Username must be 40 characters or fewer.",
    );
  }
  if (!email || !email.includes("@")) {
    throw new WaitlistValidationError(
      "Please enter a valid email address.",
    );
  }

  const isNewEmailSignup = !existing?.email || existing.email !== email;

  const updated: LocalWaitlistProfile = {
    email,
    uname: trimmedUname,
    postcode: existing?.postcode ?? "",
    city: existing?.city ?? null,
    province: existing?.province ?? null,
    municipal_district: existing?.municipal_district ?? null,
    provincial_district: existing?.provincial_district ?? null,
    federal_district: existing?.federal_district ?? null,
    election_sets: existing?.election_sets ?? [],
    election_set_ids: existing?.election_set_ids ?? [],
    profileComplete: true,
  };

  saveLocalWaitlistProfile(updated);

  if (isNewEmailSignup) {
    trackEvent("generate_lead", { source: "chat-identity" });
    trackEvent("sign_up", { method: "waitlist_chat", source: "chat-identity" });
  }

  try {
    const { db, firestoreModule } = await loadFirebaseFirestore();
    const { doc, serverTimestamp, setDoc } = firestoreModule;
    const ref = doc(db, WAITLIST_COLLECTION, waitlistDocId(email));
    const attribution = getAttributionParams();
    await setDoc(
      ref,
      {
        email,
        uname: trimmedUname,
        profileComplete: true,
        ...(isNewEmailSignup ? { source: "chat-identity" } : {}),
        ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // Keep localStorage profile even if offline or Firestore write fails
  }

  return updated;
}

export interface ConfirmWaitlistDistrictsInput {
  email: string;
  postcode: string;
  city?: string | null;
  province?: string | null;
  municipal_district?: PoliticalBoundaryOption | null;
  provincial_district?: PoliticalBoundaryOption | null;
  federal_district?: PoliticalBoundaryOption | null;
}

/**
 * Step 2: Persist the user's confirmed Municipal, Provincial, and Federal
 * electoral districts directly to `waitlist/{emailDocId}` (and local storage),
 * increment `electionSets/{setId}` counters when permitted, and fire conversion
 * analytics events—without requiring account registration.
 */
export async function confirmWaitlistDistricts(
  input: ConfirmWaitlistDistrictsInput,
): Promise<LocalWaitlistProfile> {
  const existing = getSavedWaitlistProfile();
  const email = normalizeEmail(input.email);
  const postcode = formatCanadianPostcode(input.postcode);

  const confirmedSets = buildUserElectionSets({
    municipal: input.municipal_district,
    provincial: input.provincial_district,
    federal: input.federal_district,
    city: input.city ?? null,
    province: input.province ?? null,
  });
  const electionSetIds = confirmedSets.map((s) => s.id);

  const completedProfile: LocalWaitlistProfile = {
    email,
    uname: existing?.uname ?? null,
    postcode,
    city: input.city ?? null,
    province: input.province ?? null,
    municipal_district: input.municipal_district ?? null,
    provincial_district: input.provincial_district ?? null,
    federal_district: input.federal_district ?? null,
    election_sets: confirmedSets,
    election_set_ids: electionSetIds,
    profileComplete: true,
  };

  saveLocalWaitlistProfile(completedProfile);

  trackEvent("sign_up", { method: "waitlist" });
  trackEvent("complete_profile", {
    city: input.city ?? null,
    province: input.province ?? null,
    postcode,
  });

  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { doc, increment, serverTimestamp, setDoc } = firestoreModule;
  const docId = waitlistDocId(email);
  const waitlistRef = doc(db, WAITLIST_COLLECTION, docId);
  const attribution = getAttributionParams();

  await setDoc(
    waitlistRef,
    {
      email,
      ...(existing?.uname ? { uname: existing.uname } : {}),
      postcode,
      city: input.city ?? null,
      province: input.province ?? null,
      municipal_district: input.municipal_district ?? null,
      provincial_district: input.provincial_district ?? null,
      federal_district: input.federal_district ?? null,
      election_sets: confirmedSets,
      election_set_ids: electionSetIds,
      profileComplete: true,
      ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // Best-effort increment of public `electionSets` counters for the leaderboard
  await Promise.all(
    confirmedSets.map(async (item) => {
      try {
        const setRef = doc(db, ELECTION_SETS_COLLECTION, item.id);
        await setDoc(
          setRef,
          {
            id: item.id,
            url: item.url,
            name: item.name,
            boundary_set_name: item.boundary_set_name,
            tier: item.tier,
            external_id: item.external_id ?? null,
            city: item.city ?? null,
            province: item.province ?? null,
            count: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch {
        // Ignore if unauthenticated writes to electionSets are restricted before rules deploy
      }
    }),
  );

  return completedProfile;
}
