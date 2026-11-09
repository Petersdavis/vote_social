/**
 * Firebase Authentication & Waitlist Profile helpers.
 *
 * All auth is client-side: the frontend is a fully static export, so there is
 * no request-time server. The Firebase SDK manages ID-token refresh and
 * persistence (localStorage by default) on its own.
 */

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
  type UserCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { getFirebaseAuth, getFirebaseFirestore } from "./firebase";
import {
  buildUserElectionSets,
  type PoliticalBoundaryOption,
  type UserElectionSet,
} from "./opennorth";

/** Firestore collection holding one profile document per user. */
export const USERS_COLLECTION = "users";

/** Sparse Firestore collection holding per-election-set waitlist counters. */
export const ELECTION_SETS_COLLECTION = "electionSets";

/** Shape of the `users/{uid}` Firestore document created on sign-up and updated on `/profile`. */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  /** Auth providers linked to the account, e.g. ["password", "google.com"]. */
  providers: string[];
  /** Given name captured during waitlist profile completion. */
  first_name?: string | null;
  /** Family name captured during waitlist profile completion. */
  last_name?: string | null;
  /** Postal code captured during waitlist profile completion (e.g. "M4K 1N2"). */
  postcode?: string | null;
  /** Municipality / city resolved via OpenNorth Represent API. */
  city?: string | null;
  /** Province code resolved via OpenNorth Represent API (e.g. "ON"). */
  province?: string | null;
  /** Selected or auto-resolved Federal electoral district. */
  federal_district?: PoliticalBoundaryOption | null;
  /** Selected or auto-resolved Provincial electoral district. */
  provincial_district?: PoliticalBoundaryOption | null;
  /** Selected or auto-resolved Municipal ward / subdivision. */
  municipal_district?: PoliticalBoundaryOption | null;
  /** Confirmed multi-tier ElectionSet memberships for this user. */
  election_sets?: UserElectionSet[];
  /** Array of deterministic ElectionSet IDs for fast `array-contains` queries. */
  election_set_ids?: string[];
  /** 1. Are you a candidate? */
  is_candidate?: boolean;
  /** Election / race name when `is_candidate` is true. */
  candidate_election?: string | null;
  /** 2. Are you a representative of a local organization? */
  is_org_representative?: boolean;
  /** Organization name when `is_org_representative` is true. */
  organization_name?: string | null;
  /** 3. Are you a journalist? */
  is_journalist?: boolean;
  /** Link to a published article when `is_journalist` is true. */
  published_article_url?: string | null;
  /** Canonical community id (optional, derived or selected). */
  community?: string | null;
  /** True once the user has completed the waitlist profile form. */
  profileComplete?: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

/** Fields captured by the Vote Social waitlist profile setup form. */
export interface ProfileInput {
  first_name: string;
  last_name: string;
  postcode: string;
  city?: string | null;
  province?: string | null;
  federal_district?: PoliticalBoundaryOption | null;
  provincial_district?: PoliticalBoundaryOption | null;
  municipal_district?: PoliticalBoundaryOption | null;
  is_candidate: boolean;
  candidate_election: string;
  is_org_representative: boolean;
  organization_name: string;
  is_journalist: boolean;
  published_article_url: string;
}

/** OAuth providers supported by the registration/login UI. */
export type OAuthProviderId = "google";

function auth(): Auth {
  return getFirebaseAuth();
}

/**
 * Create the `users/{uid}` profile document if it does not already exist.
 *
 * Idempotent: safe to call on every sign-in. Uses `getDoc` first so we never
 * clobber fields written by later flows.
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        providers: user.providerData.map((p) => p.providerId),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }

  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providers: user.providerData.map((p) => p.providerId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function ensureUserProfileSafely(user: User): Promise<void> {
  try {
    await ensureUserProfile(user);
  } catch (error) {
    console.error("Failed to provision user profile document", error);
  }
}

/**
 * Persist the Vote Social waitlist profile captured after authentication.
 *
 * Records the user's confirmed district memberships (`users/{uid}.election_set_ids`
 * and `electionSets/{setId}/members/{uid}`) and creates/increments each
 * `electionSets/{setId}` counter when the user joins.
 */
export async function saveUserProfile(user: User, input: ProfileInput): Promise<void> {
  const db = getFirebaseFirestore();
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const first_name = input.first_name.trim();
  const last_name = input.last_name.trim();
  const postcode = input.postcode.trim().toUpperCase();
  const displayName = [first_name, last_name].filter(Boolean).join(" ");

  const is_candidate = Boolean(input.is_candidate);
  const candidate_election = is_candidate ? input.candidate_election.trim() : null;

  const is_org_representative = Boolean(input.is_org_representative);
  const organization_name = is_org_representative ? input.organization_name.trim() : null;

  const is_journalist = Boolean(input.is_journalist);
  const published_article_url = is_journalist ? input.published_article_url.trim() : null;

  const confirmedSets = buildUserElectionSets({
    municipal: input.municipal_district,
    provincial: input.provincial_district,
    federal: input.federal_district,
    city: input.city ?? null,
    province: input.province ?? null,
  });

  await runTransaction(db, async (tx) => {
    // Read electionSets and membership docs first (Firestore transactions require all reads before writes)
    const setStates = await Promise.all(
      confirmedSets.map(async (item) => {
        const setRef = doc(db, ELECTION_SETS_COLLECTION, item.id);
        const memberRef = doc(db, ELECTION_SETS_COLLECTION, item.id, "members", user.uid);
        const [setSnap, memberSnap] = await Promise.all([
          tx.get(setRef),
          tx.get(memberRef),
        ]);
        return {
          item,
          setRef,
          memberRef,
          setExists: setSnap.exists(),
          alreadyMember: memberSnap.exists(),
        };
      }),
    );

    // Create (if required) and increment each electionSet when the user joins it
    for (const { item, setRef, memberRef, setExists, alreadyMember } of setStates) {
      if (!alreadyMember) {
        tx.set(memberRef, {
          uid: user.uid,
          tier: item.tier,
          election_set_id: item.id,
          joinedAt: serverTimestamp(),
        });

        tx.set(
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
            count: setExists ? increment(1) : 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    tx.set(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName,
        first_name,
        last_name,
        postcode,
        city: input.city ?? null,
        province: input.province ?? null,
        federal_district: input.federal_district ?? null,
        provincial_district: input.provincial_district ?? null,
        municipal_district: input.municipal_district ?? null,
        election_sets: confirmedSets,
        election_set_ids: confirmedSets.map((s) => s.id),
        is_candidate,
        candidate_election,
        is_org_representative,
        organization_name,
        is_journalist,
        published_article_url,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  if (displayName && displayName !== user.displayName) {
    try {
      await updateProfile(user, { displayName });
    } catch (error) {
      console.error("Failed to update auth display name", error);
    }
  }
}

/**
 * Read the `users/{uid}` profile document, or null when it does not exist.
 */
export async function fetchUserProfile(user: User): Promise<UserProfile | null> {
  const db = getFirebaseFirestore();
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as UserProfile;
}

/** Sign up with email + password, then create the profile document. */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth(), email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  await ensureUserProfileSafely(credential.user);
  return credential;
}

/** Sign in with email + password, ensuring a profile document exists. */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const credential = await signInWithEmailAndPassword(auth(), email, password);
  await ensureUserProfileSafely(credential.user);
  return credential;
}

/** Sign in (or sign up) with a Google popup, then ensure the profile document. */
export async function signInWithGoogle(loginHint?: string): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  const customParams: Record<string, string> = { prompt: "select_account" };
  if (loginHint && loginHint.trim()) {
    customParams.login_hint = loginHint.trim();
  }
  provider.setCustomParameters(customParams);

  const credential = await signInWithPopup(auth(), provider);
  await ensureUserProfileSafely(credential.user);
  return credential;
}

/** Sign the current user out. */
export async function signOutUser(): Promise<void> {
  await signOut(auth());
}

export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

const lastVerificationSentAt = new Map<string, number>();

export function getVerificationResendCooldown(user: User, now: number = Date.now()): number {
  const last = lastVerificationSentAt.get(user.uid);
  if (last === undefined) {
    return 0;
  }
  const remaining = VERIFICATION_RESEND_COOLDOWN_MS - (now - last);
  return remaining > 0 ? remaining : 0;
}

export class VerificationRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("Please wait before requesting another verification email.");
    this.name = "VerificationRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export async function sendVerificationEmail(user: User, now: number = Date.now()): Promise<void> {
  const remaining = getVerificationResendCooldown(user, now);
  if (remaining > 0) {
    throw new VerificationRateLimitError(remaining);
  }

  await sendEmailVerification(user);
  lastVerificationSentAt.set(user.uid, now);
}

export async function reloadUser(user: User): Promise<User> {
  await user.reload();
  return auth().currentUser ?? user;
}

export function resetVerificationCooldown(): void {
  lastVerificationSentAt.clear();
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth(), callback);
}

export function subscribeToIdTokenChanges(callback: (user: User | null) => void): () => void {
  return onIdTokenChanged(auth(), callback);
}

export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look valid.";
    case "auth/weak-password":
      return "Please choose a stronger password (at least 8 characters).";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/expired-action-code":
      return "That verification link has expired. Request a new one.";
    case "auth/invalid-action-code":
      return "That verification link is no longer valid. Request a new one.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/requires-recent-login":
      return "Please sign in again to continue.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled. Please contact support.";
    default:
      return "Something went wrong. Please try again.";
  }
}
