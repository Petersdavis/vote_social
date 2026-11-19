"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowBigUp,
  ArrowRight,
  Calendar,
  CheckCircle2,
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
import { useRouter } from "next/navigation";
import WaitlistCarousel from "@/components/screens/WaitlistCarousel";
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
  const router = useRouter();
  const { user, profile } = useAuth();
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
  const [heroSubmitted, setHeroSubmitted] = useState(false);

  const [footerEmail, setFooterEmail] = useState("");
  const [footerError, setFooterError] = useState<string | null>(null);
  const [footerSubmitted, setFooterSubmitted] = useState(false);
  const latestPost = BLOG_POSTS[0];

  useEffect(() => {
    const syncFromStorage = () => {
      const saved = getSavedWaitlistProfile();
      if (saved) {
        setLocalWaitlist(saved);
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
    setHeroSubmitted(true);
    try {
      await submitEmailWaitlist(trimmedEmail, "landing-hero");
    } catch (err) {
      console.error("Failed to record waitlist signup:", err);
    }
    router.push(`/profile?email=${encodeURIComponent(trimmedEmail)}`);
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
    } catch (err) {
      console.error("Failed to record waitlist signup:", err);
    }
    router.push(`/profile?email=${encodeURIComponent(trimmedEmail)}`);
  };

  const isWaitlistComplete = Boolean(
    profile?.profileComplete ||
      localWaitlist?.profileComplete ||
      localWaitlist?.email,
  );
  const activeDisplayName =
    localWaitlist?.uname ||
    profile?.first_name ||
    user?.displayName ||
    localWaitlist?.email ||
    user?.email ||
    null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Keyboard & Screen Reader Skip Navigation Links */}
      <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-3 focus-within:left-3 focus-within:z-50 focus-within:flex focus-within:gap-2">
        <a
          href="#join-waitlist"
          className="px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-slate-950"
        >
          Skip directly to Waitlist Signup Form
        </a>
        <a
          href="#core-pillars"
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
            {user || isWaitlistComplete ? (
              <Link
                href="/profile"
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isWaitlistComplete
                    ? "Your Waitlist Profile"
                    : "Confirm Districts →"}
                </span>
              </Link>
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
            HERO SECTION & 2-PAGE CAROUSEL SLIDER
            Static Hero Headline + Carousel wrapping:
            Slide 1 (0): Primary Waitlist Signup CTA
            Slide 2 (1): Leaderboard & Join the Conversation
           ===================================================================== */}
        <header className="relative overflow-hidden pt-10 pb-14 lg:pt-14 lg:pb-18 border-b border-slate-200/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Static Hero Block */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Civic Social Platform for Voters, Candidates &amp; Voting Blocks</span>
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
              Compare candidates side-by-side, pledge your vote with trusted community slates, and manage every election from School Board to Parliament in one place.
            </p>
          </div>

          {/* 2-Slide Waitlist & Community Carousel */}
          <WaitlistCarousel
            slide1Label="Waitlist Signup"
            slide2Label="Join the Conversation"
            backToSlide1Label="Back to Waitlist Signup"
          >
            {/* Primary CTA Form */}
            <div
              id="join-waitlist"
              className="max-w-2xl mx-auto bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Join the Waitlist for Early Access
                </span>
              </div>

              {isWaitlistComplete ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">
                        {`Welcome back${activeDisplayName ? `, ${activeDisplayName}` : ""}!`}
                      </p>
                      <p className="text-xs text-emerald-800">
                        You’re on the Vote Social Early Access List
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition"
                  >
                    <span>View Waitlist Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
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
                      disabled={heroSubmitted}
                      className="px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
                    >
                      <span>
                        {heroSubmitted ? "Joining…" : "Join the Waitlist"}
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
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span>
                  🔒 Zero spam • Early access &amp; launch updates only
                </span>
                <span className="font-mono font-semibold text-emerald-800">
                  {`✨✨ ${((userCount ?? 0) + 15).toLocaleString()} / 2,500 ✨✨ signups to dev launch! 🎉🎉🎉`}
                </span>
              </div>
            </div>
          </WaitlistCarousel>
        </div>
      </header>

      {/* =====================================================================
          DEVELOPMENT BLOG SECTION (LATEST ARTICLE PREVIEW)
         ===================================================================== */}
      {latestPost && (
        <section
          aria-labelledby="dev-blog-heading"
          className="py-10 lg:py-12 border-b border-slate-200/80 bg-slate-100/50"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-blue-700 font-bold">
                  <Link href="/blog/" className="hover:underline">
                    Development Blog
                  </Link>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-600 font-normal">
                    {latestPost.publishedAt}
                  </span>
                </div>
                <h2
                  id="dev-blog-heading"
                  className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
                >
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
          </div>
        </section>
      )}

      {/* =====================================================================
          OUR BELIEFS • 3 CORE PILLARS
          Foundational values and beliefs ("The Big WHY"), decoupled from the
          interactive screen showcase below.
         ===================================================================== */}
      <section
        id="core-pillars"
        aria-labelledby="core-pillars-heading"
        className="py-14 lg:py-20 border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
            {/* ==================== CARD 01: ACCESSIBILITY ==================== */}
            <article className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                01 • ACCESSIBILITY
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                Breaking down Barriers
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                It's well known that friction reduces engagement. Participation shouldn&apos;t mean digging through fragmented websites just to cast an informed vote. We use technology to reduce the gap between wanting to participate and taking a meaningful action.
              </p>

              <ul className="mt-auto pt-5 border-t border-slate-100 space-y-3.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Instant Ballot Lookup:
                    </strong>{" "}
                    Enter your postal code to see a clean, factual profile of every candidate running in your exact ward or riding.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Compass className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      5-Minute Voter Preparedness:
                    </strong>{" "}
                    Skip hours of dead-end searches and get everything you need to make an informed choice in one place.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Precision Voting Alerts:
                    </strong>{" "}
                    Get customized reminders for registration deadlines, advance voting days, and your exact polling station.
                  </span>
                </li>
              </ul>
            </article>

            {/* ==================== CARD 02: PUBLIC INFRASTRUCTURE ==================== */}
            <article className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                02 • PUBLIC INFRASTRUCTURE
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                Discourse transforms
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Social media platforms profit from echo chambers. Neighbours actually want constructive conversation. We provide a non-partisan public square built for substance, good faith, and genuine connection.
              </p>

              <ul className="mt-auto pt-5 border-t border-slate-100 space-y-3.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      A True “Wikipedia for Elections”:
                    </strong>{" "}
                    Access a non-partisan, non-profit civic commons owned by the public interest—not political parties or corporate shareholders.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Verified, Bot-Free &amp; Private:
                    </strong>{" "}
                    Engage in a strictly moderated forum of verified local neighbours with zero bots, zero data sales, and no robocalls.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Side-by-Side Policy Blueprints:
                    </strong>{" "}
                    Skip the spin and compare substantive candidate stances head-to-head on local issues like housing, transit, and property taxes.
                  </span>
                </li>
              </ul>
            </article>

            {/* ==================== CARD 03: CIVIC STEWARDSHIP ==================== */}
            <article className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                03 • CIVIC STEWARDSHIP
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">
                It&apos;s Our Democracy
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Cynicism thrives when citizens are treated as commodities.  Healthy democratic institutions depend on active local stewardship: asking tough questions, making our voices heard, and holding leaders accountable year-round.
              </p>

              <ul className="mt-auto pt-5 border-t border-slate-100 space-y-3.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Direct Candidate Q&amp;A:
                    </strong>{" "}
                    Ask questions directly to local candidates and review their public, on-the-record answers before you vote.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ArrowBigUp className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Community Micro-Polling:
                    </strong>{" "}
                    Weigh in on neighbourhood polls to show candidates where locals actually stand long before Election Day.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Flag className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>
                    <strong className="text-slate-900">
                      Post-Election Promise Tracker:
                    </strong>{" "}
                    Keep officials accountable after the ballots are counted by tracking whether they actually fulfill their campaign pledges.
                  </span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* =====================================================================
          INTERACTIVE HIGH-FIDELITY SCREEN SHOWCASE (LIVE EMBED OF ALL 3 SCREENS)
         ===================================================================== */}
      <section
        id="interactive-preview"
        aria-labelledby="interactive-preview-heading"
        className="py-12 lg:py-16 bg-slate-100/80 border-b border-slate-200/90"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sr-only focus-within:not-sr-only focus-within:mb-4">
            <a
              href="#secondary-waitlist-cta"
              className="inline-flex px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-xs"
            >
              Skip interactive demonstration controls to Bottom Waitlist Signup Form
            </a>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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
                <span className="text-emerald-400">● Verified Ward Session (M4K 1N2)</span>
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
      </section>

      {/* =====================================================================
          SECONDARY CTA FORM
          [ Secondary CTA Form ]
         ===================================================================== */}
      <section
        id="secondary-waitlist-cta"
        aria-labelledby="secondary-cta-heading"
        className="py-16 lg:py-20 bg-slate-950 text-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Bring Vote Social to Your Riding or Municipality
          </span>
          <h2
            id="secondary-cta-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4"
          >
            Ready to make local democracy social, informed, and actionable?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Whether you’re a voter looking for transparent answers, a candidate running a grassroots campaign, or a local organization mobilizing a voting block—reserve your early access invite today.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto text-left">
            {footerSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-sm flex items-center justify-between">
                <span>
                  ✓ Added <strong>{footerEmail}</strong> to the early access waitlist…
                </span>
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
                  <p role="alert" className="text-xs text-rose-400 font-semibold">
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
