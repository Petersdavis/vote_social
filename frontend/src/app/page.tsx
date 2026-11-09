"use client";

import React, { useState } from "react";
import {
  ArrowBigUp,
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  FileText,
  Flag,
  Layers,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CommunityFeedScreen from "@/components/screens/CommunityFeedScreen";
import CandidateHubScreen from "@/components/screens/CandidateHubScreen";
import ElectionCenterScreen from "@/components/screens/ElectionCenterScreen";
import WaitlistCarousel from "@/components/screens/WaitlistCarousel";
import { useAuth } from "@/components/auth/AuthProvider";
import { submitEmailWaitlist } from "@/lib/waitlist";

export default function WaitlistLandingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<1 | 2 | 3>(1);
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitted, setHeroSubmitted] = useState(false);

  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubmitted, setFooterSubmitted] = useState(false);

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = heroEmail.trim();
    if (trimmed) {
      setHeroSubmitted(true);
      try {
        await submitEmailWaitlist(trimmed, "landing-hero");
      } catch (err) {
        console.error("Failed to record waitlist signup:", err);
      }
      if (user) {
        router.push("/profile");
      } else {
        router.push(`/register?email=${encodeURIComponent(trimmed)}`);
      }
    }
  };

  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = footerEmail.trim();
    if (trimmed) {
      setFooterSubmitted(true);
      try {
        await submitEmailWaitlist(trimmed, "landing-footer");
      } catch (err) {
        console.error("Failed to record waitlist signup:", err);
      }
      if (user) {
        router.push("/profile");
      } else {
        router.push(`/register?email=${encodeURIComponent(trimmed)}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-slate-200/80">
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
            {user ? (
              <Link
                href="/profile"
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {profile?.profileComplete ? "Your Waitlist Profile" : "Complete Profile →"}
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

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.08] mb-6">
              Democracy is Social.{" "}
              <span className="text-blue-700">Knowledge is Power.</span>{" "}
              <span className="underline decoration-emerald-500/70 decoration-4 underline-offset-8">
                Politics is Local.
              </span>
            </h1>

            <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              Connect with verified neighbors in your ward, compare candidates side-by-side on standardized local surveys, pledge your vote with trusted community slates, and manage every election from School Board to Parliament in one place.
            </p>
          </div>

          {/* 2-Slide Waitlist & Community Carousel */}
          <WaitlistCarousel
            slide1Label="1 • Join the Waitlist"
            backToSlide1Label="Back to Waitlist Signup"
            highlightElectionSetIds={profile?.election_set_ids ?? []}
          >
            {/* Primary CTA Form */}
            <div
              id="join-waitlist"
              className="max-w-xl mx-auto bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-md"
            >
              <div className="mb-3 flex items-center justify-between text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Join the Waitlist for Early Access
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  1. Email → 2. Google Auth → 3. Profile
                </span>
              </div>

              {user ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">
                        {profile?.profileComplete
                          ? `Welcome back, ${profile.first_name || user.displayName || user.email}!`
                          : "Account authenticated — finish your profile"}
                      </p>
                      <p className="text-xs text-emerald-800">
                        {profile?.profileComplete
                          ? `Registered in postal zone ${profile.postcode || "Canada"}`
                          : "Add your name, postal code, and optional civic role in Step 3."}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition"
                  >
                    <span>
                      {profile?.profileComplete ? "View Profile" : "Complete Profile"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={handleHeroSubmit}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <input
                    type="email"
                    required
                    value={heroEmail}
                    onChange={(e) => setHeroEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={heroSubmitted}
                    className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
                  >
                    <span>
                      {heroSubmitted ? "Continuing…" : "Join the Waitlist"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>
                  🔒 Zero spam • Complete your civic profile in under 60 seconds
                </span>
                <span className="font-mono font-semibold text-emerald-700">
                  3,890+ neighbors already queued
                </span>
              </div>
            </div>
          </WaitlistCarousel>
        </div>
      </header>

      {/* =====================================================================
          THREE-COLUMN SCREEN PREVIEW GRAPHICS & FEATURE BREAKDOWN
          Matches the Updated Waitlist Layout Structure:
          Screen 1 Preview Graphic | Screen 2 Preview Graphic | Screen 3 Preview Graphic
         ===================================================================== */}
      <section className="py-14 lg:py-20 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-700 font-bold">
              Platform Architecture • 3 Core Pillars
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Built for Transparent Local Democracy
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Click any card below to preview that screen in the interactive showcase.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
            {/* ==================== COLUMN 1: ELECTION SUMMARY ==================== */}
            <div
              onClick={() => setActiveShowcaseTab(1)}
              className={`group rounded-2xl bg-white border transition flex flex-col justify-between overflow-hidden cursor-pointer ${
                activeShowcaseTab === 1
                  ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                  : "border-slate-200/90 shadow-xs hover:border-slate-300"
              }`}
            >
              <div>
                {/* Screen 1 Miniature Graphic Preview */}
                <div className="bg-slate-900 p-4 border-b border-slate-200 h-[196px] flex flex-col">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-3 shrink-0">
                    <span className="font-mono font-bold text-emerald-400">
                      01 • ELECTION SUMMARY
                    </span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">
                      /toronto_2026/summary
                    </span>
                  </div>

                  {/* Mini UI Mock Card inside Preview Graphic */}
                  <div className="bg-white rounded-xl p-3 text-slate-900 flex-1 flex flex-col justify-between shadow-sm">
                    {/* Mini Row of Candidate Cards */}
                    <div className="grid grid-cols-3 gap-1 text-[9px]">
                      <div className="p-1.5 rounded bg-blue-50/70 border border-blue-200">
                        <div className="font-bold text-slate-900 flex items-center gap-0.5">
                          <span>Maya Lin</span>
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-slate-600 truncate">MNM (740) • 485 Unaff.</div>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-900 flex items-center gap-0.5">
                          <span>D. Kowalski</span>
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-slate-600 truncate">DSBA (620) • 590 Unaff.</div>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-900 flex items-center gap-0.5">
                          <span>Priya Nair</span>
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-slate-600 truncate">EETU (440) • 315 Unaff.</div>
                      </div>
                    </div>

                    {/* Mini 2-Col Split: Issue Feed + Top Issues / Org Guides */}
                    <div className="grid grid-cols-12 gap-1.5 text-[9px] pt-1.5 border-t border-slate-100">
                      <div className="col-span-7 p-1.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-800">Issue: Transit</span>
                          <span className="px-1 rounded bg-blue-100 text-blue-800 font-semibold">
                            Endorses: Maya Lin
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          Overnight haul-truck mitigation & Policies
                        </p>
                      </div>
                      <div className="col-span-5 p-1.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-900">Top Issues • ▲ 418</div>
                        <div className="text-emerald-800 font-semibold truncate">
                          + Org Voter Guides
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Screen 1 Description & Bullet Points */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Election Summary
                  </h3>

                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Understand where the community stands:
                        </strong>{" "}
                        Quickly see which issues each candidate champions and how many neighbors and local groups back them.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Join real neighborhood conversations:
                        </strong>{" "}
                        Discuss local issues with verified neighbors and see how everyday concerns connect to real policy proposals.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <ArrowBigUp className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Shape the local agenda:
                        </strong>{" "}
                        Vote on the issues that matter most to your household so candidates have to address top community concerns.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Vote with trusted community guides:
                        </strong>{" "}
                        Discover which candidates are endorsed by the local advocacy groups and community organizations you trust.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-blue-700">
                  {activeShowcaseTab === 1 ? "● Active in Preview Below" : "Click to Preview Below"}
                </span>
              </div>
            </div>

            {/* ==================== COLUMN 2: CANDIDATE PROFILES ==================== */}
            <div
              onClick={() => setActiveShowcaseTab(2)}
              className={`group rounded-2xl bg-white border transition flex flex-col justify-between overflow-hidden cursor-pointer ${
                activeShowcaseTab === 2
                  ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                  : "border-slate-200/90 shadow-xs hover:border-slate-300"
              }`}
            >
              <div>
                {/* Screen 2 Miniature Graphic Preview */}
                <div className="bg-slate-900 p-4 border-b border-slate-200 h-[196px] flex flex-col">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-3 shrink-0">
                    <span className="font-mono font-bold text-blue-400">
                      02 • CANDIDATE PROFILES
                    </span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">
                      /toronto_2026/candidates
                    </span>
                  </div>

                  {/* Mini UI Mock Card inside Preview Graphic (Flush cards + summary) */}
                  <div className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-sm border border-slate-200 flex-1 flex flex-col justify-between">
                    {/* Flush Candidate Cards Row */}
                    <div className="grid grid-cols-3 divide-x divide-slate-200 bg-slate-50 text-[9px] border-b border-slate-200">
                      <div className="p-2 bg-white">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>Maya Lin</span>
                          <span className="px-1 rounded bg-blue-700 text-white text-[8px]">
                            Your Vote
                          </span>
                        </div>
                        <div className="text-slate-500 mt-0.5 truncate">
                          Housing • MNM (740)
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="font-bold text-slate-700">D. Kowalski</div>
                        <div className="text-slate-500 mt-0.5 truncate">
                          Budget • DSBA (620)
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="font-bold text-slate-700">Priya Nair</div>
                        <div className="text-slate-500 mt-0.5 truncate">
                          Climate • EETU (440)
                        </div>
                      </div>
                    </div>

                    {/* Flush Candidate Summary Preview */}
                    <div className="p-2.5 text-[9px] flex-1 flex flex-col justify-between">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-blue-700 text-white font-bold">
                          Pledge your support
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
                          Lawn Sign Request
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-slate-600 font-mono">
                        <span>📄 maya_lin_cv.pdf • resume.pdf</span>
                        <span className="text-blue-700 font-sans font-bold">
                          Testimonials & Q&A
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Screen 2 Description & Bullet Points */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Candidate Profiles
                  </h3>

                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Compare Candidates on Issues and Policies:
                        </strong>{" "}
                        Cut through campaign noise to see what each candidate actually stands for and who supports their campaign.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Flag className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Engage voters with 1-click CTAs:
                        </strong>{" "}
                        Show your support publicly, request a lawn sign for your yard, or stay in the loop on campaign updates in one click.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Verify experience & track records:
                        </strong>{" "}
                        Look beyond slogans by reviewing candidates’ full resumes, past council votes, and town hall clips.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Hear from neighbors & ask direct questions:
                        </strong>{" "}
                        Read personal vouches from people in your ward and put your own questions to candidates on the public record.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-blue-700">
                  {activeShowcaseTab === 2 ? "● Active in Preview Below" : "Click to Preview Below"}
                </span>
              </div>
            </div>

            {/* ==================== COLUMN 3: VOTER DASHBOARD ==================== */}
            <div
              onClick={() => setActiveShowcaseTab(3)}
              className={`group rounded-2xl bg-white border transition flex flex-col justify-between overflow-hidden cursor-pointer ${
                activeShowcaseTab === 3
                  ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                  : "border-slate-200/90 shadow-xs hover:border-slate-300"
              }`}
            >
              <div>
                {/* Screen 3 Miniature Graphic Preview */}
                <div className="bg-slate-900 p-4 border-b border-slate-200 h-[196px] flex flex-col">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-3 shrink-0">
                    <span className="font-mono font-bold text-amber-400">
                      03 • VOTER DASHBOARD
                    </span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">
                      Weekly | Monthly
                    </span>
                  </div>

                  {/* Mini UI Mock Card inside Preview Graphic */}
                  <div className="bg-white rounded-xl p-3 text-slate-900 flex-1 flex flex-col justify-between shadow-sm">
                    {/* Mini Active Election Card with Endorses Badge (Top Row) */}
                    <div className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[9px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-slate-900 truncate">
                          Toronto Election (2026) →
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold shrink-0">
                          ● Endorses: Maya Lin
                        </span>
                      </div>
                      <span className="text-blue-700 font-bold shrink-0 ml-1">/summary</span>
                    </div>

                    {/* Mini Calendar Strip */}
                    <div className="flex items-center justify-between text-[9px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                      <span className="text-blue-800">Election Calendar (Weekly)</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 font-mono">
                        Nov 12–15 Early Polls • Nov 21 Vote
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-100 text-slate-600 font-mono">
                      <span>Following: Issues • Candidates • Orgs</span>
                      <span className="text-emerald-700 font-bold">⚙ Notifications</span>
                    </div>
                  </div>
                </div>

                {/* Screen 3 Description & Bullet Points */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Voter Dashboard
                  </h3>

                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Stay ready for every election:
                        </strong>{" "}
                        Keep track of all your upcoming municipal, provincial, and federal elections—and who you’re backing—in one place.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Never miss a debate or voting day:
                        </strong>{" "}
                        See early polling windows, Election Day hours, and local town halls from the candidates and groups you follow.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Know exactly where and how to vote:
                        </strong>{" "}
                        Get walking directions to your assigned polling station, check wait times, and verify what ID to bring before you head out.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Follow what matters, on your terms:
                        </strong>{" "}
                        Follow specific issues, candidates, and organizations while controlling exactly which updates reach your inbox.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-blue-700">
                  {activeShowcaseTab === 3 ? "● Active in Preview Below" : "Click to Preview Below"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          INTERACTIVE HIGH-FIDELITY SCREEN SHOWCASE (LIVE EMBED OF ALL 3 SCREENS)
         ===================================================================== */}
      <section className="py-12 lg:py-16 bg-slate-100/80 border-b border-slate-200/90">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveShowcaseTab(1)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    activeShowcaseTab === 1
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Election Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShowcaseTab(2)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    activeShowcaseTab === 2
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Candidate Profiles
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShowcaseTab(3)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    activeShowcaseTab === 3
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Voter Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Browser Window Frame Wrapping Active Mock Screen */}
          <div className="rounded-3xl border border-slate-300 bg-white shadow-xl overflow-hidden">
            {/* Browser Chrome Header */}
            <div className="bg-slate-900 text-slate-300 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-400">
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
            <div>
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
      <section className="py-16 lg:py-20 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Bring Vote Social to Your Riding or Municipality
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Ready to make local democracy social, informed, and actionable?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Whether you’re a voter looking for transparent answers, a candidate running a grassroots campaign, or a local organization mobilizing a voting block—reserve your early access invite today.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto text-left">
            {footerSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-sm flex items-center justify-between">
                <span>
                  ✓ Early access registered for <strong>{footerEmail}</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setFooterSubmitted(false)}
                  className="text-xs underline ml-3"
                >
                  Reset
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleFooterSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition cursor-pointer shrink-0"
                >
                  Get Early Access
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
