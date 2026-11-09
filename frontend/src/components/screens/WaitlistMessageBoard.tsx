"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Globe,
  Lock,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  WAITLIST_MESSAGES_PAGE_SIZE,
  createWaitlistPost,
  deleteOwnPublicPost,
  fetchRecentPublicPosts,
  formatPostAuthorName,
  subscribeToRecentPublicPosts,
  type PostMode,
  type WaitlistPost,
} from "@/lib/posts";

function formatRelativeTime(date: Date): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
}

export default function WaitlistMessageBoard() {
  const { user, profile } = useAuth();

  const [mode, setMode] = useState<PostMode>("public");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Live first-page posts (from onSnapshot) + older paginated posts (from Load More)
  const [livePosts, setLivePosts] = useState<WaitlistPost[]>([]);
  const [olderPosts, setOlderPosts] = useState<WaitlistPost[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  // Keep the cutoff timestamp fixed for the session
  const cutoffRef = useRef<Date>(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasLoadedMoreRef = useRef(false);

  useEffect(() => {
    setLoadingInitial(true);
    cutoffRef.current = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const unsubscribe = subscribeToRecentPublicPosts({
      pageSize: WAITLIST_MESSAGES_PAGE_SIZE,
      cutoffDate: cutoffRef.current,
      onUpdate: (result) => {
        setLivePosts(result.posts);
        if (!hasLoadedMoreRef.current) {
          lastDocRef.current = result.lastDoc;
          setHasMore(result.hasMore);
        }
        setLoadingInitial(false);
      },
      onError: (error) => {
        console.error("Realtime public posts listener error", error);
        setLoadingInitial(false);
      },
    });

    return () => unsubscribe();
  }, []);

  // Merge live first-page posts with any older paginated posts without duplicates
  const posts = React.useMemo(() => {
    const seen = new Set<string>();
    const merged: WaitlistPost[] = [];
    for (const p of [...livePosts, ...olderPosts]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push(p);
      }
    }
    return merged;
  }, [livePosts, olderPosts]);

  async function handleLoadMore() {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchRecentPublicPosts({
        afterCursor: lastDocRef.current,
        pageSize: WAITLIST_MESSAGES_PAGE_SIZE,
        cutoffDate: cutoffRef.current,
      });
      hasLoadedMoreRef.current = true;
      setOlderPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = result.posts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      lastDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Failed to load more messages", error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim() || submitting) return;

    setSubmitError(null);
    setFeedbackSuccess(false);
    setSubmitting(true);

    const text = content.trim();
    try {
      await createWaitlistPost({
        user,
        profile,
        content: text,
        mode,
      });
      setContent("");

      if (mode === "feedback") {
        // Feedback is fire-and-forget
        setFeedbackSuccess(true);
      }
      // Public posts are picked up automatically by the real-time onSnapshot listener
    } catch (error) {
      console.error("Failed to submit message", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not post your message. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(post: WaitlistPost) {
    if (!user || user.uid !== post.authorId) return;
    setDeletingIds((prev) => ({ ...prev, [post.id]: true }));
    try {
      await deleteOwnPublicPost(post.authorId, post.id);
      setOlderPosts((prev) => prev.filter((item) => item.id !== post.id));
    } catch (error) {
      console.error("Failed to delete public message", error);
    } finally {
      setDeletingIds((prev) => {
        const next = { ...prev };
        delete next[post.id];
        return next;
      });
    }
  }

  const authorPreview = user ? formatPostAuthorName(user, profile) : "";

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold">
              Thoughts? Features?
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Join the conversation!
            </h3>
          </div>
        </div>
      </div>

      {/* Composer (authenticated users) or Sign-In prompt */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Public / Feedback Toggle */}
            <div className="inline-flex rounded-lg bg-slate-200/80 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("public");
                  setFeedbackSuccess(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  mode === "public"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("feedback");
                  setFeedbackSuccess(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  mode === "feedback"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Feedback</span>
              </button>
            </div>

            <span className="text-xs text-slate-500">
              Posting as <strong className="text-slate-800">{authorPreview}</strong>
            </span>
          </div>

          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={mode === "public" ? 2000 : 4000}
            placeholder={
              mode === "public"
                ? "Share what local issues or elections matter most in your community..."
                : "Send private product feedback or feature ideas directly to the Vote Social team..."
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
          />

          {submitError && (
            <p className="text-xs text-rose-600 font-semibold">{submitError}</p>
          )}

          {feedbackSuccess && mode === "feedback" && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thanks! Your feedback was sent to the team.</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              {mode === "public"
                ? "Visible to everyone on the waitlist • You can delete your posts anytime"
                : ""}
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0 ${
                mode === "public"
                  ? "bg-blue-700 hover:bg-blue-800"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {submitting
                  ? "Sending…"
                  : mode === "public"
                  ? "Post Publicly"
                  : "Send Feedback"}
              </span>
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-600">
            Join the waitlist or sign in to post on the community board or send private feedback.
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold transition"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      )}

      {/* Public Messages Feed (Last 24h, 25 per page) */}
      {loadingInitial ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Loading recent messages…
        </div>
      ) : posts.length === 0 ? (
        <div className="py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
          No public messages yet. Be the first to share what matters in your riding!
        </div>
      ) : (
        <div className="space-y-2.5">
          {posts.map((post) => {
            const isOwn = Boolean(user && user.uid === post.authorId);
            const isDeleting = Boolean(deletingIds[post.id]);

            return (
              <div
                key={post.id}
                className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      {post.author}
                    </span>
                    {isOwn && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                        You
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">
                      • {formatRelativeTime(post.date_created)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {isOwn && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(post)}
                    disabled={isDeleting}
                    title="Delete your public message"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => void handleLoadMore()}
                disabled={loadingMore}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <ChevronDown className="w-4 h-4" />
                <span>
                  {loadingMore
                    ? "Loading…"
                    : `More Messages (+${WAITLIST_MESSAGES_PAGE_SIZE})`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
