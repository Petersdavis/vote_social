"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowBigUp,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Compass,
  ExternalLink,
  Flag,
  Layers,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import WaitlistCarousel, {
  type CarouselSlideItem,
} from "@/components/screens/WaitlistCarousel";
import WaitlistShareEmbed from "@/components/screens/WaitlistShareEmbed";
import { useAuth } from "@/components/auth/AuthProvider";
import { trackEvent } from "@/lib/analytics";
import { subscribeToPublicUserCount } from "@/lib/leaderboard";
import {
  WAITLIST_PROFILE_UPDATED_EVENT,
  getSavedWaitlistProfile,
  submitEmailWaitlist,
  type LocalWaitlistProfile,
} from "@/lib/waitlist";
import { BLOG_POSTS } from "@/data/blogPosts";

const WaitlistMessageBoard = dynamic(
  () => import("@/components/screens/WaitlistMessageBoard"),
);
const CommunityFeedScreen = dynamic(
  () => import("@/components/screens/CommunityFeedScreen"),
);
const CandidateHubScreen = dynamic(
  () => import("@/components/screens/CandidateHubScreen"),
);
const ElectionCenterScreen = dynamic(
  () => import("@/components/screens/ElectionCenterScreen"),
);

export default function WaitlistLandingPage() {
  const { user, profile } = useAuth();
  const [activeCarouselSlide, setActiveCarouselSlide] = useState<number>(0);
  const [activeShowcaseTab, setActiveShowcaseTabState] = useState<1 | 2 | 3>(1);

  const setActiveShowcaseTab = (tab: 1 | 2 | 3) => {
    setActiveShowcaseTabState(tab);
    const screenName =
      tab === 1
        ? "election_summary"
        : tab === 2
        ? "candidate_profiles"
        : "voter_dashboard";
    trackEvent("screen_preview", { screen: screenName, location: "landing" });
  };

  const [userCount, setUserCount] = useState<number | null>(15);
  const [localWaitlist, setLocalWaitlist] =
    useState<LocalWaitlistProfile | null>(null);

  const [heroEmail, setHeroEmail] = useState("");
  const [heroError, setHeroError] = useState<string | null>(null);
  const [heroSubmitting, setHeroSubmitting] = useState(false);
  const [editingWaitlistEmail, setEditingWaitlistEmail] = useState(false);
  const [waitlistDetailsOpen, setWaitlistDetailsOpen] = useState(false);

  const [footerEmail, setFooterEmail] = useState("");
  const [footerError, setFooterError] = useState<string | null>(null);
  const [footerSubmitted, setFooterSubmitted] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => {
      const saved = getSavedWaitlistProfile();
      if (saved) {
        setLocalWaitlist(saved);
        if (saved.email) {
          setHeroEmail(saved.email);
        }
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
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToPublicUserCount(
      (count) => {
        setUserCount(count);
      },
      (err) => {
        console.error("Failed to read public_metadata user count:", err);
      },
    );
    return () => {
      unsubscribe();
    };
  }, []);

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeroError(null);
    const trimmedEmail = heroEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setHeroError("Please enter a valid email address.");
      return;
    }
    setHeroSubmitting(true);
    try {
      await submitEmailWaitlist(trimmedEmail, "landing-hero");
      const saved = getSavedWaitlistProfile();
      if (saved) {
        setLocalWaitlist(saved);
      }
      setEditingWaitlistEmail(false);
    } catch (err) {
      console.error("Failed to record waitlist signup:", err);
      setHeroError(
        err instanceof Error
          ? err.message
          : "Could not join the waitlist. Please try again.",
      );
    } finally {
      setHeroSubmitting(false);
    }
  };

  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFooterError(null);
    const trimmedEmail = footerEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setFooterError("Please enter a valid email address.");
      return;
    }
    setFooterSubmitted(true);
    try {
      await submitEmailWaitlist(trimmedEmail, "landing-footer");
      const saved = getSavedWaitlistProfile();
      if (saved) {
        setLocalWaitlist(saved);
      }
      setEditingWaitlistEmail(false);
      setActiveCarouselSlide(0);
    } catch (err) {
      console.error("Failed to record waitlist signup:", err);
    }
  };

  const isWaitlistComplete = Boolean(
    profile?.profileComplete ||
      localWaitlist?.profileComplete ||
      localWaitlist?.email ||
      user?.email,
  );
  const confirmedEmail =
    localWaitlist?.email || user?.email || heroEmail.trim() || "";
  const showShareView = isWaitlistComplete && !editingWaitlistEmail;

  const carouselSlides: CarouselSlideItem[] = [
    /* ==================== SLIDE 0: WAITLIST (SIGNUP OR SHARE) ==================== */
    {
      id: "waitlist",
      label: "Waitlist",
      content: (
        <div
          id="join-waitlist"
          className="max-w-2xl mx-auto bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-md text-left"
        >
          {showShareView ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setWaitlistDetailsOpen((open) => !open)}
                aria-expanded={waitlistDetailsOpen}
                className="w-full flex items-start justify-between gap-4 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold">
                      Waitlist Confirmed
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      You’re on the Vote Social Early Access List!
                    </h2>
                  </div>
                </div>

                <div
                  title={
                    waitlistDetailsOpen
                      ? "Collapse waitlist details"
                      : "Expand waitlist details"
                  }
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 group-hover:bg-slate-100 text-slate-600 transition shrink-0 mt-0.5"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      waitlistDetailsOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {waitlistDetailsOpen && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs sm:text-sm">
                  {confirmedEmail && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Email</span>
                      <span className="font-mono text-xs text-slate-800">
                        {confirmedEmail}
                      </span>
                    </div>
                  )}
                  {localWaitlist?.uname && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">
                        Chat Username
                      </span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        @{localWaitlist.uname}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setWaitlistDetailsOpen(false);
                        setEditingWaitlistEmail(true);
                      }}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Change email address →
                    </button>
                  </div>
                </div>
              )}

              <WaitlistShareEmbed communityLabel={null} referralSlug={null} />
            </div>
          ) : (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Join the Waitlist for Early Access
                </span>
                {isWaitlistComplete && editingWaitlistEmail && (
                  <button
                    type="button"
                    onClick={() => setEditingWaitlistEmail(false)}
                    className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    ← Back to Share
                  </button>
                )}
              </div>

              <form
                aria-label="Primary Early Access Waitlist Signup"
                onSubmit={handleHeroSubmit}
                className="space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <label htmlFor="hero-waitlist-email" className="sr-only">
                    Email address for early access waitlist
                  </label>
                  <input
                    id="hero-waitlist-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={heroEmail}
                    onChange={(e) => {
                      setHeroEmail(e.target.value);
                      if (heroError) setHeroError(null);
                    }}
                    placeholder="Enter your email address..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />

                  <button
                    type="submit"
                    disabled={heroSubmitting}
                    className="px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <span>
                      {heroSubmitting ? "Joining…" : "Join the Waitlist"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {heroError && (
                  <p
                    role="alert"
                    className="text-xs text-rose-600 font-semibold text-left"
                  >
                    {heroError}
                  </p>
                )}
              </form>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <span>🔒 Zero spam • Early access &amp; launch updates only</span>
            <span className="font-mono font-semibold text-emerald-800">
              {`✨✨ ${((userCount ?? 0) + 15).toLocaleString()} / 2,500 ✨✨ signups to dev launch! 🎉🎉🎉`}
            </span>
          </div>
        </div>
      ),
    },

    /* ==================== SLIDE 1: DEMO ==================== */
    {
      id: "demo",
      label: "Demo",
      content: (
        <div
          id="interactive-preview"
          className="max-w-[1400px] mx-auto text-left space-y-5"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                Interactive Platform Preview
              </span>
              <h2
                id="interactive-preview-heading"
                className="text-2xl font-bold text-slate-900"
              >
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
                  ● Verified Ward Session (M4K 1N2)
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
        </div>
      ),
    },

    /* ==================== SLIDE 2: OUR WHY ==================== */
    {
      id: "our-why",
      label: "Our Why",
      content: (
        <div
          id="core-pillars"
          className="max-w-7xl mx-auto text-left space-y-8"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-700 font-bold">
              OUR BELIEFS • 3 CORE PILLARS
            </span>
            <h2
              id="core-pillars-heading"
              className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1"
            >
              Built for Transparent Local Democracy
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* ==================== CARD 01: ACCESSIBILITY ==================== */}
            <article className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                01 • ACCESSIBILITY
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                Breaking down Barriers
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                It&apos;s well known that friction reduces engagement.
                Participation shouldn&apos;t mean digging through fragmented
                websites just to cast an informed vote. We use technology to
                reduce the gap between wanting to participate and taking a
                meaningful action.
              </p>

              <ul className="mt-auto pt-5 border-t border-slate-100 space-y-3.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Instant Ballot Lookup:
                    </strong>{" "}
                    Enter your postal code to see a clean, factual profile of
                    every candidate running in your exact ward or riding.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Compass className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      5-Minute Voter Preparedness:
                    </strong>{" "}
                    Skip hours of dead-end searches and get everything you need
                    to make an informed choice in one place.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Precision Voting Alerts:
                    </strong>{" "}
                    Get customized reminders for registration deadlines, advance
                    voting days, and your exact polling station.
                  </span>
                </li>
              </ul>
            </article>

            {/* ==================== CARD 02: PUBLIC INFRASTRUCTURE ==================== */}
            <article className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                02 • PUBLIC INFRASTRUCTURE
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                Discourse transforms
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Social media platforms profit from echo chambers. Neighbours
                actually want constructive conversation. We provide a
                non-partisan public square built for substance, good faith, and
                genuine connection.
              </p>

              <ul className="mt-auto pt-5 border-t border-slate-100 space-y-3.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      A True “Wikipedia for Elections”:
                    </strong>{" "}
                    Access a non-partisan, non-profit civic commons owned by the
                    public interest—not political parties or corporate
                    shareholders.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Verified, Bot-Free &amp; Private:
                    </strong>{" "}
                    Engage in a strictly moderated forum of verified local
                    neighbours with zero bots, zero data sales, and no
                    robocalls.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Side-by-Side Policy Blueprints:
                    </strong>{" "}
                    Skip the spin and compare substantive candidate stances
                    head-to-head on local issues like housing, transit, and
                    property taxes.
                  </span>
                </li>
              </ul>
            </article>

            {/* ==================== CARD 03: CIVIC STEWARDSHIP ==================== */}
            <article className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                03 • CIVIC STEWARDSHIP
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                It&apos;s Our Democracy
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Cynicism thrives when citizens are treated as commodities.
                Healthy democratic institutions depend on active local
                stewardship: asking tough questions, making our voices heard,
                and holding leaders accountable year-round.
              </p>

              <ul className="mt-auto pt-5 border-t border-slate-100 space-y-3.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Direct Candidate Q&amp;A:
                    </strong>{" "}
                    Ask questions directly to local candidates and review their
                    public, on-the-record answers before you vote.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ArrowBigUp className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Community Micro-Polling:
                    </strong>{" "}
                    Weigh in on neighbourhood polls to show candidates where
                    locals actually stand long before Election Day.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Flag className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Post-Election Promise Tracker:
                    </strong>{" "}
                    Keep officials accountable after the ballots are counted by
                    tracking whether they actually fulfill their campaign
                    pledges.
                  </span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      ),
    },

    /* ==================== SLIDE 3: BLOG ==================== */
    {
      id: "blog",
      label: "Blog",
      content: (
        <div className="max-w-4xl mx-auto space-y-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-blue-700 font-bold">
                Development Blog
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Latest Dispatches on Civic Infrastructure
              </h2>
            </div>

            <Link
              href="/blog/"
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition shrink-0"
            >
              <span>All Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {BLOG_POSTS.map((post, idx) => (
              <article
                key={post.slug}
                className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-blue-700 font-bold">
                    <span>{idx === 0 ? "Latest Dispatch" : "Article"}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-normal">
                      {post.publishedAt}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-normal">
                      {post.readingTimeMinutes} min read
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {post.subtitle}
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    href={`/blog/${post.slug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read article: ${post.title} (opens in a new tab)`}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-blue-700 hover:border-blue-700 hover:text-white text-slate-800 text-xs font-bold inline-flex items-center gap-2 transition shadow-2xs"
                  >
                    <span>Read Article</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      ),
    },

    /* ==================== SLIDE 4: CONTACT ==================== */
    {
      id: "contact",
      label: "Contact",
      content: (
        <div className="max-w-2xl mx-auto space-y-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveCarouselSlide(0)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-blue-700" />
              <span>Back to Waitlist</span>
            </button>

            <span className="text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold">
              Direct Application Feedback
            </span>
          </div>

          <WaitlistMessageBoard />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Keyboard & Screen Reader Skip Navigation Links */}
      <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-3 focus-within:left-3 focus-within:z-50 focus-within:flex focus-within:gap-2">
        <a
          href="#join-waitlist"
          onClick={() => setActiveCarouselSlide(0)}
          className="px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-slate-950"
        >
          Skip directly to Waitlist Signup Form
        </a>
        <a
          href="#core-pillars"
          onClick={() => setActiveCarouselSlide(2)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
        >
          Skip to Platform Features
        </a>
      </div>

      {/* Top Navigation */}
      <nav
        aria-label="Primary Navigation"
        className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              VS
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Vote Social
              </span>
              <span className="hidden sm:inline-block ml-2.5 text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold">
                Stage 1 • Early Access Waitlist
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isWaitlistComplete ? (
              <button
                type="button"
                onClick={() => setActiveCarouselSlide(0)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Invite Neighbors</span>
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition"
                >
                  Sign In
                </Link>
                <a
                  href="#join-waitlist"
                  onClick={() => setActiveCarouselSlide(0)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs"
                >
                  Join the Waitlist
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* =====================================================================
            HERO SECTION & 5-TAB CAROUSEL SLIDER
            Waitlist | Feedback | Blog | Our Why | Demo Pages
           ===================================================================== */}
        <header className="relative overflow-hidden pt-10 pb-14 lg:pt-14 lg:pb-18 border-b border-slate-200/80">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Static Hero Block */}
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Social Media Platform for Civic Society 
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950 leading-[1.2] mb-6 space-y-1.5">
                <span className="block">
                  Meet local people and verified candidates.
                </span>
                <span className="block text-blue-700">
                  A non-profit social media app for civic engagement.
                </span>
                <span className="block underline decoration-emerald-500/70 decoration-4 underline-offset-8">
                  Start building a stronger democracy today.
                </span>
              </h1>

              <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
                Compare candidates side-by-side, pledge your vote with trusted
                community slates, and manage every election from School Board to
                Parliament in one place.
              </p>
            </div>

            {/* 5-Slide Landing Carousel: Waitlist | Feedback | Blog | Our Why | Demo Pages */}
            <WaitlistCarousel
              slides={carouselSlides}
              activeSlideIndex={activeCarouselSlide}
              onSlideChange={setActiveCarouselSlide}
            />
          </div>
        </header>

        {/* =====================================================================
            SECONDARY CTA FORM
           ===================================================================== */}
        <section
          id="secondary-waitlist-cta"
          aria-labelledby="secondary-cta-heading"
          className="py-16 lg:py-20 bg-slate-950 text-white"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-mono uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Bring Vote Social to Your
              Riding or Municipality
            </span>
            <h2
              id="secondary-cta-heading"
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4"
            >
              Ready to make local democracy social, informed, and actionable?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
              Whether you’re a voter looking for transparent answers, a
              candidate running a grassroots campaign, or a local organization
              mobilizing a voting block—reserve your early access invite today.
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto text-left">
              {footerSubmitted || isWaitlistComplete ? (
                <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-sm flex flex-wrap items-center justify-between gap-3">
                  <span>
                    ✓ You’re on the early access waitlist
                    {confirmedEmail ? (
                      <>
                        {" "}
                        (<strong>{confirmedEmail}</strong>)
                      </>
                    ) : null}
                    !
                  </span>
                  <a
                    href="#join-waitlist"
                    onClick={() => setActiveCarouselSlide(0)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition"
                  >
                    Share with Neighbors ↑
                  </a>
                </div>
              ) : (
                <form
                  aria-label="Secondary Early Access Waitlist Signup"
                  onSubmit={handleFooterSubmit}
                  className="space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label htmlFor="footer-waitlist-email" className="sr-only">
                      Email address for early access waitlist
                    </label>
                    <input
                      id="footer-waitlist-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={footerEmail}
                      onChange={(e) => {
                        setFooterEmail(e.target.value);
                        if (footerError) setFooterError(null);
                      }}
                      placeholder="Enter your email address..."
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                    />

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition cursor-pointer shrink-0"
                    >
                      Get Early Access
                    </button>
                  </div>

                  {footerError && (
                    <p
                      role="alert"
                      className="text-xs text-rose-400 font-semibold"
                    >
                      {footerError}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
