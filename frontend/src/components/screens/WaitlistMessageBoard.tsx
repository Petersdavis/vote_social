"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Lock, MessageSquare, Send } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { createWaitlistPost } from "@/lib/posts";
import {
  WAITLIST_PROFILE_UPDATED_EVENT,
  getSavedWaitlistProfile,
  saveWaitlistUserIdentity,
} from "@/lib/waitlist";

export default function WaitlistMessageBoard() {
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Sync saved email + name from localStorage if available
  useEffect(() => {
    const syncFromStorage = () => {
      const saved = getSavedWaitlistProfile();
      const resolvedEmail = saved?.email || user?.email || "";
      const resolvedName = saved?.uname || user?.displayName || "";
      if (resolvedEmail) {
        setEmail((prev) => prev || resolvedEmail);
      }
      if (resolvedName) {
        setName((prev) => prev || resolvedName);
      }
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
  }, [user?.email, user?.displayName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    const trimmedContent = content.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    if (!trimmedContent) {
      setSubmitError("Please enter your feedback before sending.");
      return;
    }

    // Use provided name, or derive a clean fallback from the email prefix (2–50 chars)
    const emailPrefix = trimmedEmail.split("@")[0] || "Voter";
    const resolvedAuthor = (name.trim() || emailPrefix).slice(0, 50);
    const safeAuthor =
      resolvedAuthor.length >= 2 ? resolvedAuthor : `${resolvedAuthor}_vs`;

    setSubmitError(null);
    setFeedbackSuccess(false);
    setSubmitting(true);

    try {
      await saveWaitlistUserIdentity({
        uname: safeAuthor,
        email: trimmedEmail,
      });

      await createWaitlistPost({
        uname: safeAuthor,
        email: trimmedEmail,
        content: trimmedContent,
        mode: "feedback",
      });

      setContent("");
      setFeedbackSuccess(true);
    } catch (error) {
      console.error("Failed to submit feedback", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not send your feedback. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-bold">
              Direct Application Feedback
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Send Feedback to the Vote Social Team
            </h3>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
          <Lock className="w-3 h-3 text-emerald-700" />
          <span>Private to Team</span>
        </span>
      </div>

      <form
        aria-label="Direct application feedback form"
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="feedback-email" className="sr-only">
              Your email address
            </label>
            <input
              id="feedback-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (submitError) setSubmitError(null);
              }}
              placeholder="Your email (you@example.com) *"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="feedback-name" className="sr-only">
              Your name (optional)
            </label>
            <input
              id="feedback-name"
              type="text"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="waitlist-feedback-textarea" className="sr-only">
            Feedback for the Vote Social team
          </label>
          <textarea
            id="waitlist-feedback-textarea"
            rows={4}
            required
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (submitError) setSubmitError(null);
              if (feedbackSuccess) setFeedbackSuccess(false);
            }}
            maxLength={4000}
            placeholder="Share product feedback, feature ideas, or questions directly with the Vote Social team..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-600 focus:bg-white resize-y"
          />
        </div>

        {submitError && (
          <p role="alert" className="text-xs text-rose-600 font-semibold">
            {submitError}
          </p>
        )}

        {feedbackSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Thanks! Your feedback was sent directly to the Vote Social team.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-600">
            Sent privately to the Vote Social team • Never posted publicly
          </span>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Sending…" : "Send Feedback"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
