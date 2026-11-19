"use client";

import React, { Suspense, useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  Mail,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import WaitlistCarousel from "@/components/screens/WaitlistCarousel";
import WaitlistShareEmbed from "@/components/screens/WaitlistShareEmbed";
import { BLOG_POSTS } from "@/data/blogPosts";
import { trackEvent } from "@/lib/analytics";
import {
  WAITLIST_PROFILE_UPDATED_EVENT,
  getSavedWaitlistProfile,
  submitEmailWaitlist,
  type LocalWaitlistProfile,
} from "@/lib/waitlist";

const CandidateHubScreen = dynamic(
  () => import("@/components/screens/CandidateHubScreen"),
);
const CommunityFeedScreen = dynamic(
  () => import("@/components/screens/CommunityFeedScreen"),
);
const ElectionCenterScreen = dynamic(
  () => import("@/components/screens/ElectionCenterScreen"),
);

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileForm />
    </Suspense>
  );
}

function ProfileForm() {
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  const queryEmail = searchParams.get("email") ?? "";

  const [localWaitlist, setLocalWaitlist] =
    useState<LocalWaitlistProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [email, setEmail] = useState(queryEmail);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTabState] = useState<1 | 2 | 3>(1);

  const setActiveShowcaseTab = (tab: 1 | 2 | 3) => {
    setActiveShowcaseTabState(tab);
    const screenName =
      tab === 1
        ? "election_summary"
        : tab === 2
        ? "candidate_profiles"
        : "voter_dashboard";
    trackEvent("screen_preview", { screen: screenName, location: "profile" });
  };

  useEffect(() => {
    const syncFromStorage = () => {
      const saved = getSavedWaitlistProfile();
      if (saved) {
        setLocalWaitlist(saved);
        if (!queryEmail && saved.email) {
          setEmail(saved.email);
        }
      }
    };

    syncFromStorage();
    setHydrated(true);
    window.addEventListener(WAITLIST_PROFILE_UPDATED_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(
        WAITLIST_PROFILE_UPDATED_EVENT,
        syncFromStorage,
      );
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [queryEmail]);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await submitEmailWaitlist(trimmedEmail, "profile-form");
      const saved = getSavedWaitlistProfile();
      if (saved) {
        setLocalWaitlist(saved);
      }
      setEditingEmail(false);
      setJustSaved(true);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Could not join the waitlist. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-8 shadow-md text-center text-sm text-slate-600 flex items-center justify-center gap-2.5">
        <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
        <span>Loading waitlist status…</span>
      </div>
    );
  }

  const confirmedEmail =
    email.trim() || localWaitlist?.email || user?.email || "";
  const isCompletedView =
    !editingEmail &&
    (justSaved ||
      Boolean(queryEmail) ||
      Boolean(localWaitlist?.email) ||
      Boolean(profile?.profileComplete) ||
      Boolean(user?.email));

  if (isCompletedView) {
    const latestPost = BLOG_POSTS[0];

    return (
      <div className="space-y-10">
        {/* Waitlist Complete Dashboard Card */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-md">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            className="w-full flex items-start justify-between gap-4 mb-5 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold">
                  Waitlist Confirmed
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  You’re on the Vote Social Early Access List!
                </h1>
              </div>
            </div>

            <div
              title={
                detailsOpen
                  ? "Collapse waitlist details"
                  : "Expand waitlist details"
              }
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 group-hover:bg-slate-100 text-slate-600 transition shrink-0 mt-1"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  detailsOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {detailsOpen && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-sm mb-6">
              {confirmedEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Email</span>
                  <span className="font-mono text-xs text-slate-800">
                    {confirmedEmail}
                  </span>
                </div>
              )}
              {localWaitlist?.uname && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">
                    Chat Username
                  </span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                    @{localWaitlist.uname}
                  </span>
                </div>
              )}

              <div className="pt-2.5 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setJustSaved(false);
                    setEditingEmail(true);
                  }}
                  className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Change email address →
                </button>
              </div>
            </div>
          )}

          <WaitlistCarousel
            slide1Label="Invite Neighbors"
            slide2Label="Give Feedback"
            backToSlide1Label="Back to Invite Neighbors"
          >
            <WaitlistShareEmbed communityLabel={null} referralSlug={null} />
          </WaitlistCarousel>
        </div>

        {/* Development Blog Section (Latest Article Preview) */}
        {latestPost && (
          <section className="max-w-4xl mx-auto">
            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-blue-700 font-bold">
                  <Link href="/blog/" className="hover:underline">
                    Development Blog
                  </Link>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-600 font-normal">
                    {latestPost.publishedAt}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {latestPost.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {latestPost.subtitle}
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href={`/blog/${latestPost.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read article: ${latestPost.title} (opens in a new tab)`}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-blue-700 hover:border-blue-700 hover:text-white text-slate-800 text-xs font-bold inline-flex items-center gap-2 transition shadow-2xs"
                >
                  <span>Read Article</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* On-Page Interactive High-Fidelity Screen Showcase */}
        <section className="pt-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                Interactive Platform Preview
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Explore the 3 Live Screens
              </h2>
            </div>

            {/* Switcher Tabs */}
            <div
              role="group"
              aria-label="Interactive Screen Demonstration Switcher"
              className="flex flex-wrap items-center gap-2"
            >
              <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  aria-pressed={activeShowcaseTab === 1}
                  onClick={() => setActiveShowcaseTab(1)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeShowcaseTab === 1
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  Election Summary
                </button>
                <button
                  type="button"
                  aria-pressed={activeShowcaseTab === 2}
                  onClick={() => setActiveShowcaseTab(2)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeShowcaseTab === 2
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  Candidate Profiles
                </button>
                <button
                  type="button"
                  aria-pressed={activeShowcaseTab === 3}
                  onClick={() => setActiveShowcaseTab(3)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeShowcaseTab === 3
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  Voter Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Browser Window Frame Wrapping Active Mock Screen */}
          <div
            role="region"
            aria-label="Simulated Browser Window Demonstrating Vote Social"
            className="rounded-3xl border border-slate-300 bg-white shadow-xl overflow-hidden"
          >
            {/* Browser Chrome Header */}
            <div
              aria-hidden="true"
              className="bg-slate-900 text-slate-200 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-300">
                  votesocial.ca/
                  {activeShowcaseTab === 1
                    ? "toronto_2026/summary"
                    : activeShowcaseTab === 2
                    ? "toronto_2026/candidates"
                    : "ward-14/election-center"}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-emerald-400">
                  ● Early Access Preview
                </span>
              </div>
            </div>

            {/* Active Screen Component */}
            <div aria-live="polite">
              {activeShowcaseTab === 1 && <CommunityFeedScreen compact />}
              {activeShowcaseTab === 2 && <CandidateHubScreen compact />}
              {activeShowcaseTab === 3 && <ElectionCenterScreen compact />}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Fallback Email-only form (if user visited /profile directly without an email)
  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
          Early Access Waitlist
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Join the Vote Social Waitlist
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Enter your email address to reserve your early access invite. Full profile and riding setup will happen when we launch.
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold"
        >
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="waitlist_email"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="waitlist_email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Joining Waitlist…</span>
            </>
          ) : (
            <>
              <span>Join the Waitlist</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
