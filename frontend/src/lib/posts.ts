/**
 * Waitlist Message Board & Feedback persistence.
 *
 * Because waitlist users do not have a Firebase Auth `users/{uid}` session,
 * public chat messages and private product feedback are written directly to
 * dedicated waitlist collections (`waitlist_posts` and `waitlist_feedback`)
 * using the user's `uname` and `email` stored in `localStorage`.
 *
 * Uses lazy-loaded Firestore via `loadFirebaseFirestore()` so `firebase/firestore`
 * is split out of the initial page bundle.
 */

import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { trackEvent } from "./analytics";
import { loadFirebaseFirestore } from "./firebase";
import { normalizeEmail, waitlistDocId } from "./waitlist";

/** Custom top-level collection for public waitlist chat messages (create-only + public read). */
export const WAITLIST_PUBLIC_POSTS_COLLECTION = "waitlist_posts";

/** Custom top-level collection for private waitlist feedback (strictly write-only). */
export const WAITLIST_FEEDBACK_COLLECTION = "waitlist_feedback";

export const WAITLIST_MESSAGES_PAGE_SIZE = 25;
export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export type PostMode = "public" | "feedback";

export interface WaitlistPost {
  id: string;
  author: string;
  authorId: string;
  content: string;
  date_created: Date;
}

export interface FetchPublicPostsResult {
  posts: WaitlistPost[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Create a new `waitlist_posts` (public chat) or `waitlist_feedback` (private feedback)
 * document using the user's chosen `uname` and `email` from localStorage.
 */
export async function createWaitlistPost(params: {
  uname: string;
  email: string;
  content: string;
  mode: PostMode;
}): Promise<{ id: string; author: string }> {
  const trimmedContent = params.content.trim();
  const trimmedUname = params.uname.trim();
  const normalizedEmail = normalizeEmail(params.email);

  if (!trimmedUname) {
    throw new Error("Please choose a username before posting.");
  }
  if (!normalizedEmail) {
    throw new Error("Please enter your email address before posting.");
  }
  if (!trimmedContent) {
    throw new Error("Message cannot be empty.");
  }

  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { addDoc, collection, serverTimestamp } = firestoreModule;
  const targetCollection =
    params.mode === "public"
      ? WAITLIST_PUBLIC_POSTS_COLLECTION
      : WAITLIST_FEEDBACK_COLLECTION;

  const colRef = collection(db, targetCollection);
  const authorId = waitlistDocId(normalizedEmail);

  const docRef = await addDoc(colRef, {
    author: trimmedUname,
    uname: trimmedUname,
    email: normalizedEmail,
    authorId,
    content: trimmedContent,
    date_created: serverTimestamp(),
  });

  trackEvent("post_message", {
    mode: params.mode,
    content_type: params.mode === "public" ? "public_chat" : "private_feedback",
  });
  trackEvent("generate_lead", {
    source:
      params.mode === "public" ? "waitlist_public_post" : "waitlist_feedback",
    mode: params.mode,
  });
  if (params.mode === "feedback") {
    trackEvent("contact", {
      method: "waitlist_feedback",
      source: "waitlist_feedback",
    });
  }

  return { id: docRef.id, author: trimmedUname };
}

/**
 * Fetch public waitlist messages from the last 24 hours (`limit 25`), ordered by
 * `date_created` descending, with cursor pagination (`startAfter`) for "Load More".
 */
export async function fetchRecentPublicPosts(options?: {
  afterCursor?: QueryDocumentSnapshot<DocumentData> | null;
  pageSize?: number;
  cutoffDate?: Date;
}): Promise<FetchPublicPostsResult> {
  const { db, firestoreModule } = await loadFirebaseFirestore();
  const {
    Timestamp,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
  } = firestoreModule;

  const pageSize = options?.pageSize ?? WAITLIST_MESSAGES_PAGE_SIZE;
  const cutoff =
    options?.cutoffDate ?? new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
  const cutoffTimestamp = Timestamp.fromDate(cutoff);

  const constraints = [
    where("date_created", ">=", cutoffTimestamp),
    orderBy("date_created", "desc"),
    ...(options?.afterCursor ? [startAfter(options.afterCursor)] : []),
    limit(pageSize),
  ];

  const q = query(
    collection(db, WAITLIST_PUBLIC_POSTS_COLLECTION),
    ...constraints,
  );
  const snapshot = await getDocs(q);

  const posts: WaitlistPost[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const rawTs = data.date_created;
    const createdDate =
      rawTs instanceof Timestamp ? rawTs.toDate() : new Date();

    return {
      id: docSnap.id,
      author: typeof data.author === "string" ? data.author : "Waitlist Member",
      authorId: typeof data.authorId === "string" ? data.authorId : "",
      content: typeof data.content === "string" ? data.content : "",
      date_created: createdDate,
    };
  });

  const lastDoc =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return {
    posts,
    lastDoc,
    hasMore: snapshot.docs.length === pageSize,
  };
}

/**
 * Subscribe in real time to the newest public waitlist messages from the last 24 hours.
 */
export function subscribeToRecentPublicPosts(options: {
  pageSize?: number;
  cutoffDate?: Date;
  onUpdate: (result: FetchPublicPostsResult) => void;
  onError?: (error: Error) => void;
}): () => void {
  let cancelled = false;
  let unsubscribeSnapshot: (() => void) | undefined;

  void loadFirebaseFirestore()
    .then(({ db, firestoreModule }) => {
      if (cancelled) return;
      const {
        Timestamp,
        collection,
        limit,
        onSnapshot,
        orderBy,
        query,
        where,
      } = firestoreModule;

      const pageSize = options.pageSize ?? WAITLIST_MESSAGES_PAGE_SIZE;
      const cutoff =
        options.cutoffDate ?? new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
      const cutoffTimestamp = Timestamp.fromDate(cutoff);

      const q = query(
        collection(db, WAITLIST_PUBLIC_POSTS_COLLECTION),
        where("date_created", ">=", cutoffTimestamp),
        orderBy("date_created", "desc"),
        limit(pageSize),
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          if (cancelled) return;
          const posts: WaitlistPost[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const rawTs = data.date_created;
            const createdDate =
              rawTs instanceof Timestamp ? rawTs.toDate() : new Date();

            return {
              id: docSnap.id,
              author:
                typeof data.author === "string"
                  ? data.author
                  : "Waitlist Member",
              authorId: typeof data.authorId === "string" ? data.authorId : "",
              content: typeof data.content === "string" ? data.content : "",
              date_created: createdDate,
            };
          });

          const lastDoc =
            snapshot.docs.length > 0
              ? snapshot.docs[snapshot.docs.length - 1]
              : null;

          options.onUpdate({
            posts,
            lastDoc,
            hasMore: snapshot.docs.length === pageSize,
          });
        },
        (error) => {
          if (!cancelled) {
            options.onError?.(error);
          }
        },
      );
    })
    .catch((error) => {
      if (!cancelled) {
        options.onError?.(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    });

  return () => {
    cancelled = true;
    unsubscribeSnapshot?.();
  };
}
