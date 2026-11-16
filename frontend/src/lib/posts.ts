/**
 * Waitlist Message Board & Feedback persistence (`user -> post` relationship).
 *
 * Uses lazy-loaded Firestore via `loadFirebaseFirestore()` so `firebase/firestore`
 * is split out of the initial page bundle.
 */

import type { User } from "firebase/auth";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { USERS_COLLECTION, type UserProfile } from "./auth";
import { trackEvent } from "./analytics";
import { loadFirebaseFirestore } from "./firebase";

export const PUBLIC_POSTS_SUBCOLLECTION = "public_posts";
export const FEEDBACK_POSTS_SUBCOLLECTION = "feedback_posts";

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
 * Resolve the denormalized `author` string (`first_name last_name`) from the
 * user's profile or Firebase Auth display name.
 */
export function formatPostAuthorName(
  user: User,
  profile?: UserProfile | null,
): string {
  const fromProfile = [profile?.first_name, profile?.last_name]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (fromProfile) {
    return fromProfile;
  }
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  if (user.email) {
    return user.email.split("@")[0] || "Waitlist Member";
  }
  return "Waitlist Member";
}

/**
 * Create a new `public_posts` or `feedback_posts` document under `users/{uid}`.
 */
export async function createWaitlistPost(params: {
  user: User;
  profile?: UserProfile | null;
  content: string;
  mode: PostMode;
}): Promise<{ id: string; author: string }> {
  const trimmed = params.content.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { addDoc, collection, serverTimestamp } = firestoreModule;
  const author = formatPostAuthorName(params.user, params.profile);
  const subcollectionName =
    params.mode === "public"
      ? PUBLIC_POSTS_SUBCOLLECTION
      : FEEDBACK_POSTS_SUBCOLLECTION;

  const colRef = collection(
    db,
    USERS_COLLECTION,
    params.user.uid,
    subcollectionName,
  );

  const docRef = await addDoc(colRef, {
    author,
    authorId: params.user.uid,
    content: trimmed,
    date_created: serverTimestamp(),
  });

  trackEvent("post_message", { mode: params.mode });

  return { id: docRef.id, author };
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
    collectionGroup,
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
    collectionGroup(db, PUBLIC_POSTS_SUBCOLLECTION),
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
        collectionGroup,
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
        collectionGroup(db, PUBLIC_POSTS_SUBCOLLECTION),
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

/**
 * Delete a user's own public message (`users/{authorId}/public_posts/{postId}`).
 */
export async function deleteOwnPublicPost(
  authorId: string,
  postId: string,
): Promise<void> {
  const { db, firestoreModule } = await loadFirebaseFirestore();
  const { deleteDoc, doc } = firestoreModule;
  const ref = doc(
    db,
    USERS_COLLECTION,
    authorId,
    PUBLIC_POSTS_SUBCOLLECTION,
    postId,
  );
  await deleteDoc(ref);
}
