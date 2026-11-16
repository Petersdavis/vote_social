/**
 * Firebase Authentication & Waitlist Profile helpers.
 *
 * Uses lazy-loaded Firebase Auth and Firestore (`loadFirebaseAuth`,
 * `loadFirebaseFirestore`) so the heavy Firebase SDK chunks are split out of
 * the initial entry bundle.
 */

import type { User, UserCredential } from "firebase/auth";

import { trackEvent } from "./analytics";
import { loadFirebaseAuth, loadFirebaseFirestore } from "./firebase";
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

/**
 * Create the `users/{uid}` profile document if it does not already exist.
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { doc, getDoc, serverTimestamp, setDoc } = firestoreModule;
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
 */
export async function saveUserProfile(
  user: User,
  input: ProfileInput,
): Promise<void> {
  const [{ db, firestoreModule }, { authModule }] = await Promise.all([
    loadFirebaseFirestore(),
    loadFirebaseAuth(),
  ]);
  const { doc, increment, runTransaction, serverTimestamp } = firestoreModule;
  const { updateProfile } = authModule;

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const first_name = input.first_name.trim();
  const last_name = input.last_name.trim();
  const postcode = input.postcode.trim().toUpperCase();
  const displayName = [first_name, last_name].filter(Boolean).join(" ");

  const is_candidate = Boolean(input.is_candidate);
  const candidate_election = is_candidate
    ? input.candidate_election.trim()
    : null;

  const is_org_representative = Boolean(input.is_org_representative);
  const organization_name = is_org_representative
    ? input.organization_name.trim()
    : null;

  const is_journalist = Boolean(input.is_journalist);
  const published_article_url = is_journalist
    ? input.published_article_url.trim()
    : null;

  const confirmedSets = buildUserElectionSets({
    municipal: input.municipal_district,
    provincial: input.provincial_district,
    federal: input.federal_district,
    city: input.city ?? null,
    province: input.province ?? null,
  });

  await runTransaction(db, async (tx) => {
    const setStates = await Promise.all(
      confirmedSets.map(async (item) => {
        const setRef = doc(db, ELECTION_SETS_COLLECTION, item.id);
        const memberRef = doc(
          db,
          ELECTION_SETS_COLLECTION,
          item.id,
          "members",
          user.uid,
        );
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

  trackEvent("complete_profile", {
    city: input.city ?? null,
    province: input.province ?? null,
    is_candidate,
    is_org_representative,
    is_journalist,
  });
}

/**
 * Read the `users/{uid}` profile document, or null when it does not exist.
 */
export async function fetchUserProfile(
  user: User,
): Promise<UserProfile | null> {
  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { doc, getDoc } = firestoreModule;
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
  const { auth, authModule } = await loadFirebaseAuth();
  const { createUserWithEmailAndPassword, updateProfile } = authModule;
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  await ensureUserProfileSafely(credential.user);
  trackEvent("sign_up", { method: "password" });
  return credential;
}

/** Sign in with email + password, ensuring a profile document exists. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  const { auth, authModule } = await loadFirebaseAuth();
  const { signInWithEmailAndPassword } = authModule;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfileSafely(credential.user);
  trackEvent("login", { method: "password" });
  return credential;
}

/** Sign in (or sign up) with a Google popup, then ensure the profile document. */
export async function signInWithGoogle(
  loginHint?: string,
): Promise<UserCredential> {
  const { auth, authModule } = await loadFirebaseAuth();
  const { GoogleAuthProvider, signInWithPopup } = authModule;
  const provider = new GoogleAuthProvider();
  const customParams: Record<string, string> = { prompt: "select_account" };
  if (loginHint && loginHint.trim()) {
    customParams.login_hint = loginHint.trim();
  }
  provider.setCustomParameters(customParams);

  const credential = await signInWithPopup(auth, provider);
  await ensureUserProfileSafely(credential.user);
  trackEvent("login", { method: "google" });
  return credential;
}

/** Sign the current user out. */
export async function signOutUser(): Promise<void> {
  const { auth, authModule } = await loadFirebaseAuth();
  await authModule.signOut(auth);
}

export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

const lastVerificationSentAt = new Map<string, number>();

export function getVerificationResendCooldown(
  user: User,
  now: number = Date.now(),
): number {
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

export async function sendVerificationEmail(
  user: User,
  now: number = Date.now(),
): Promise<void> {
  const remaining = getVerificationResendCooldown(user, now);
  if (remaining > 0) {
    throw new VerificationRateLimitError(remaining);
  }

  const { authModule } = await loadFirebaseAuth();
  await authModule.sendEmailVerification(user);
  lastVerificationSentAt.set(user.uid, now);
}

export async function reloadUser(user: User): Promise<User> {
  const { auth } = await loadFirebaseAuth();
  await user.reload();
  return auth.currentUser ?? user;
}

export function resetVerificationCooldown(): void {
  lastVerificationSentAt.clear();
}

export function subscribeToAuthState(
  callback: (user: User | null) => void,
): () => void {
  let cancelled = false;
  let unsubscribeAuth: (() => void) | undefined;

  void loadFirebaseAuth()
    .then(({ auth, authModule }) => {
      if (cancelled) return;
      unsubscribeAuth = authModule.onAuthStateChanged(auth, (user) => {
        if (!cancelled) {
          callback(user);
        }
      });
    })
    .catch((error) => {
      console.error("Failed to initialize Firebase Auth listener", error);
      if (!cancelled) {
        callback(null);
      }
    });

  return () => {
    cancelled = true;
    unsubscribeAuth?.();
  };
}

export function subscribeToIdTokenChanges(
  callback: (user: User | null) => void,
): () => void {
  let cancelled = false;
  let unsubscribeToken: (() => void) | undefined;

  void loadFirebaseAuth()
    .then(({ auth, authModule }) => {
      if (cancelled) return;
      unsubscribeToken = authModule.onIdTokenChanged(auth, (user) => {
        if (!cancelled) {
          callback(user);
        }
      });
    })
    .catch((error) => {
      console.error("Failed to initialize Firebase token listener", error);
    });

  return () => {
    cancelled = true;
    unsubscribeToken?.();
  };
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
