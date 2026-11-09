/**
 * Waitlist Message Board & Feedback persistence (`user -> post` relationship).
 *
 * Uses two subcollections under `users/{userId}` queried as collection groups:
 *  - `users/{userId}/public_posts/{postId}`: Globally readable via
 *    `collectionGroup("public_posts")`, writable & deletable by the author.
 *  - `users/{userId}/feedback_posts/{postId}`: Read/writable only by the author
 *    (fire-and-forget feedback from the UI).
 *
 * Both collection groups are indexed on `date_created` (see `firestore.indexes.json`).
 * Each post duplicates the user's `first_name last_name` into `author` to avoid
 * N+1 user profile lookups, while also recording `authorId`.
 */

import type { User } from "firebase/auth";
import {
  Timestamp,
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { USERS_COLLECTION, type UserProfile } from "./auth";
import { getFirebaseFirestore } from "./firebase";

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

  const db = getFirebaseFirestore();
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
  const db = getFirebaseFirestore();
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

  const q = query(collectionGroup(db, PUBLIC_POSTS_SUBCOLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  const posts: WaitlistPost[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const rawTs = data.date_created;
    const createdDate =
      rawTs instanceof Timestamp
        ? rawTs.toDate()
        : new Date();

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
 * Automatically fires when new posts are created or deleted.
 */
export function subscribeToRecentPublicPosts(
  options: {
    pageSize?: number;
    cutoffDate?: Date;
    onUpdate: (result: FetchPublicPostsResult) => void;
    onError?: (error: Error) => void;
  },
): () => void {
  const db = getFirebaseFirestore();
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

  return onSnapshot(
    q,
    (snapshot) => {
      const posts: WaitlistPost[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const rawTs = data.date_created;
        const createdDate =
          rawTs instanceof Timestamp ? rawTs.toDate() : new Date();

        return {
          id: docSnap.id,
          author:
            typeof data.author === "string" ? data.author : "Waitlist Member",
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
      options.onError?.(error);
    },
  );
}

/**
 * Delete a user's own public message (`users/{authorId}/public_posts/{postId}`).
 */
export async function deleteOwnPublicPost(
  authorId: string,
  postId: string,
): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(
    db,
    USERS_COLLECTION,
    authorId,
    PUBLIC_POSTS_SUBCOLLECTION,
    postId,
  );
  await deleteDoc(ref);
}
