"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Globe,
  Lock,
  MessageSquare,
  Send,
  UserCircle2,
} from "lucide-react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  WAITLIST_MESSAGES_PAGE_SIZE,
  createWaitlistPost,
  fetchRecentPublicPosts,
  subscribeToRecentPublicPosts,
  type PostMode,
  type WaitlistPost,
} from "@/lib/posts";
import {
  WAITLIST_PROFILE_UPDATED_EVENT,
  getSavedWaitlistProfile,
  saveWaitlistUserIdentity,
  waitlistDocId,
} from "@/lib/waitlist";

function formatRelativeTime(date: Date): string {
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
}

export default function WaitlistMessageBoard() {
  const { user } = useAuth();

  const [savedEmail, setSavedEmail] = useState("");
  const [savedUname, setSavedUname] = useState("");
  const [unameDraft, setUnameDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

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

  // Keep the cutoff timestamp fixed for the session
  const cutoffRef = useRef<Date>(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasLoadedMoreRef = useRef(false);

  // Sync saved email + uname from localStorage
  useEffect(() => {
    const syncFromStorage = () => {
      const saved = getSavedWaitlistProfile();
      const resolvedEmail = saved?.email || user?.email || "";
      const resolvedUname = saved?.uname || "";
      setSavedEmail(resolvedEmail);
      setSavedUname(resolvedUname);
      setEmailDraft((prev) => prev || resolvedEmail);
      setUnameDraft((prev) => prev || resolvedUname);
    };

    syncFromStorage();
    window.addEventListener(WAITLIST_PROFILE_UPDATED_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(
        WAITLIST_PROFILE_UPDATED_EVENT,
        syncFromStorage,
      );
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [user?.email]);

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

  async function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (identitySaving) return;
    setIdentityError(null);
    setIdentitySaving(true);
    try {
      const updated = await saveWaitlistUserIdentity({
        uname: unameDraft,
        email: savedEmail || emailDraft,
      });
      setSavedEmail(updated.email);
      setSavedUname(updated.uname ?? "");
      setEditingIdentity(false);
    } catch (error) {
      setIdentityError(
        error instanceof Error
          ? error.message
          : "Please enter a valid username and email.",
      );
    } finally {
      setIdentitySaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!savedUname || !savedEmail || !content.trim() || submitting) return;

    setSubmitError(null);
    setFeedbackSuccess(false);
    setSubmitting(true);

    const text = content.trim();
    try {
      await createWaitlistPost({
        uname: savedUname,
        email: savedEmail,
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

  const hasIdentity = Boolean(savedEmail && savedUname) && !editingIdentity;
  const currentAuthorId = savedEmail ? waitlistDocId(savedEmail) : "";

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

      {/* Composer (once uname + email are in localStorage) or Choose Username step */}
      {hasIdentity ? (
        <form
          aria-label="Community message board composer"
          onSubmit={handleSubmit}
          className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Public / Feedback Toggle */}
            <div
              role="group"
              aria-label="Message visibility mode"
              className="inline-flex rounded-lg bg-slate-200/80 p-1"
            >
              <button
                type="button"
                aria-pressed={mode === "public"}
                onClick={() => {
                  setMode("public");
                  setFeedbackSuccess(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  mode === "public"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public</span>
              </button>
              <button
                type="button"
                aria-pressed={mode === "feedback"}
                onClick={() => {
                  setMode("feedback");
                  setFeedbackSuccess(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  mode === "feedback"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Feedback</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>
                Posting as{" "}
                <strong className="text-slate-900">@{savedUname}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setUnameDraft(savedUname);
                  setEmailDraft(savedEmail);
                  setIdentityError(null);
                  setEditingIdentity(true);
                }}
                className="text-blue-700 hover:underline font-bold cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          <label htmlFor="waitlist-message-textarea" className="sr-only">
            {mode === "public"
              ? "Public message to the waitlist community"
              : "Private product feedback for the Vote Social team"}
          </label>
          <textarea
            id="waitlist-message-textarea"
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={mode === "public" ? 2000 : 4000}
            placeholder={
              mode === "public"
                ? "Share what local issues or elections matter most in your community..."
                : "Send private product feedback or feature ideas directly to the Vote Social team..."
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-blue-600 resize-none"
          />

          {submitError && (
            <p role="alert" className="text-xs text-rose-600 font-semibold">
              {submitError}
            </p>
          )}

          {feedbackSuccess && mode === "feedback" && (
            <div
              role="status"
              aria-live="polite"
              className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thanks! Your feedback was sent to the team.</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600">
              {mode === "public"
                ? "Visible to everyone on the waitlist"
                : "Sent privately to the Vote Social team"}
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
        <form
          aria-label="Choose a username to post in the chat"
          onSubmit={handleIdentitySubmit}
          className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <UserCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                {savedEmail
                  ? "Choose a username before posting to the chat"
                  : "Enter your email and choose a username to post"}
              </span>
            </div>
            {editingIdentity && savedUname && (
              <button
                type="button"
                onClick={() => {
                  setEditingIdentity(false);
                  setIdentityError(null);
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {!savedEmail && (
              <div className="flex-1">
                <label htmlFor="chat-identity-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="chat-identity-email"
                  type="email"
                  required
                  value={emailDraft}
                  onChange={(e) => {
                    setEmailDraft(e.target.value);
                    if (identityError) setIdentityError(null);
                  }}
                  placeholder="Email address (you@example.com)"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            <div className="flex-1">
              <label htmlFor="chat-identity-uname" className="sr-only">
                Username
              </label>
              <input
                id="chat-identity-uname"
                type="text"
                required
                minLength={2}
                maxLength={40}
                value={unameDraft}
                onChange={(e) => {
                  setUnameDraft(e.target.value);
                  if (identityError) setIdentityError(null);
                }}
                placeholder="Choose a username (e.g. DanforthVoter)"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={identitySaving || !unameDraft.trim()}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {identitySaving ? "Saving…" : "Continue to Chat"}
            </button>
          </div>

          {identityError && (
            <p role="alert" className="text-xs text-rose-600 font-semibold">
              {identityError}
            </p>
          )}
        </form>
      )}

      {/* Public Messages Feed (Last 24h, 25 per page) */}
      {loadingInitial ? (
        <div
          role="status"
          aria-live="polite"
          className="py-8 text-center text-xs text-slate-600"
        >
          Loading recent messages…
        </div>
      ) : posts.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-600"
        >
          No public messages yet. Be the first to share what matters in your riding!
        </div>
      ) : (
        <div
          aria-live="polite"
          aria-label="Recent public waitlist messages"
          className="space-y-2.5"
        >
          {posts.map((post) => {
            const isOwn = Boolean(
              (currentAuthorId && post.authorId === currentAuthorId) ||
                (savedUname && post.author === savedUname),
            );

            return (
              <div
                key={post.id}
                className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      @{post.author}
                    </span>
                    {isOwn && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                        You
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-600">
                      • {formatRelativeTime(post.date_created)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                    {post.content}
                  </p>
                </div>
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
