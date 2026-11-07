"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowBigUp,
  ArrowRight,
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  Compass,
  ExternalLink,
  Flag,
  Layers,
  MapPin,
  MessageSquare,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import CommunityFeedScreen from "@/components/screens/CommunityFeedScreen";
import CandidateHubScreen from "@/components/screens/CandidateHubScreen";
import ElectionCenterScreen from "@/components/screens/ElectionCenterScreen";

export default function WaitlistLandingPage() {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<1 | 2 | 3>(1);
  const [heroEmail, setHeroEmail] = useState("");
  const [heroPostal, setHeroPostal] = useState("M4K 1N2");
  const [heroRole, setHeroRole] = useState<"Voter" | "Candidate" | "Voting Block">("Voter");
  const [heroSubmitted, setHeroSubmitted] = useState(false);

  const [footerEmail, setFooterEmail] = useState("");
  const [footerPostal, setFooterPostal] = useState("");
  const [footerRole, setFooterRole] = useState<"Voter" | "Candidate" | "Voting Block">("Voter");
  const [footerSubmitted, setFooterSubmitted] = useState(false);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroEmail.trim()) {
      setHeroSubmitted(true);
    }
  };

  const handleFooterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (footerEmail.trim()) {
      setFooterSubmitted(true);
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

          {/* Direct Screenshot Route Links */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400 font-mono mr-1 inline-flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              Screenshot Views:
            </span>
            <Link
              href="/screens/community-feed"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700 transition"
            >
              1. Community Feed
            </Link>
            <Link
              href="/screens/candidate-hub"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700 transition"
            >
              2. Candidate Hub
            </Link>
            <Link
              href="/screens/election-center"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700 transition"
            >
              3. Election Center
            </Link>
          </div>

          <a
            href="#join-waitlist"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs"
          >
            Join the Waitlist
          </a>
        </div>
      </nav>

      {/* =====================================================================
          HERO SECTION & PRIMARY CTA
          [ Hero Section: "Democracy is Social. Knowledge is Power. Politics is Local." ]
          [ Primary CTA: "Join the Waitlist for Early Access" ]
         ===================================================================== */}
      <header className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Civic Social Platform for Voters, Candidates & Voting Blocks</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.08] mb-6">
            Democracy is Social.{" "}
            <span className="text-blue-700">Knowledge is Power.</span>{" "}
            <span className="underline decoration-emerald-500/70 decoration-4 underline-offset-8">
              Politics is Local.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
            Connect with verified neighbors in your voting precinct, compare candidates side-by-side on standardized local surveys, pledge your vote with trusted community slates, and manage every election from School Board to Parliament in one place.
          </p>

          {/* Primary CTA Form */}
          <div
            id="join-waitlist"
            className="max-w-2xl mx-auto bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Join the Waitlist for Early Access
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                {(["Voter", "Candidate", "Voting Block"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setHeroRole(r)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      heroRole === r
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    I’m a {r}
                  </button>
                ))}
              </div>
            </div>

            {heroSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">
                      You’re on the Vote Social Early Access list ({heroRole})!
                    </p>
                    <p className="text-xs text-emerald-800">
                      We’ve reserved your spot for postal zone{" "}
                      <span className="font-mono font-bold">{heroPostal || "M4K 1N2"}</span>{" "}
                      and will notify <span className="font-semibold">{heroEmail}</span> when your precinct opens.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHeroSubmitted(false)}
                  className="text-xs font-semibold underline shrink-0"
                >
                  Edit
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleHeroSubmit}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <div className="relative sm:w-40 shrink-0">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={heroPostal}
                    onChange={(e) => setHeroPostal(e.target.value.toUpperCase())}
                    placeholder="Postal Code"
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
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
                  className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
                >
                  <span>Join the Waitlist for Early Access</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>🔒 Verified by postal code • Zero spam • Opt-in notifications only</span>
              <span className="font-mono font-semibold text-emerald-700">
                3,890+ neighbors & 42 local organizations already queued
              </span>
            </div>
          </div>
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
              Click any screen card below to preview the full interactive application or open the standalone screenshot view.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
            {/* ==================== COLUMN 1: LOCAL COMMUNITY FEED ==================== */}
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
                <div className="bg-slate-900 p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-3">
                    <span className="font-mono font-bold text-emerald-400">
                      01 • COMMUNITY FEED PREVIEW
                    </span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">
                      Ward 14 • M4K
                    </span>
                  </div>

                  {/* Mini UI Mock Card inside Preview Graphic */}
                  <div className="bg-white rounded-xl p-3.5 text-slate-900 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        #1 Precinct Priority • ▲ 342
                      </span>
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                        🛡️ Pledged: Maya Lin
                      </span>
                    </div>
                    <p className="text-xs font-bold leading-snug text-slate-900">
                      “How will the next Councillor hold Metrolinx accountable for overnight haul trucks near Pape?”
                    </p>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-2 text-[11px]">
                      <div className="flex items-center gap-1 font-bold text-emerald-900 mb-0.5">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Maya Lin • Verified Candidate Q&A</span>
                      </div>
                      <p className="text-slate-700 text-[10px] line-clamp-2">
                        “My Day 1 motion mandates automated heavy-truck camera enforcement on restricted side streets...”
                      </p>
                    </div>
                  </div>
                </div>

                {/* Screen 1 Description & Bullet Points */}
                <div className="p-6">
                  <div className="text-xs font-semibold text-blue-700 italic mb-1">
                    Core Value: “Democracy is a social activity”
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    1. Local Community Feed & Discussion
                  </h3>

                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Hyper-local neighborhood feed:
                        </strong>{" "}
                        Real-time discussions, debates, and community issues scoped strictly to your precinct or voting district.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <ArrowBigUp className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Upvote community priorities:
                        </strong>{" "}
                        Push the most pressing concerns to the top of the feed so candidates and local leaders see what matters most.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Voter endorsement badges:
                        </strong>{" "}
                        Show your neighbors who or what you stand for by displaying pledge badges on public discussions.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Verified candidate Q&A:
                        </strong>{" "}
                        Join public Q&A threads where candidate responses are clearly highlighted into transparent dialogue.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-blue-700">
                  {activeShowcaseTab === 1 ? "● Active in Preview Below" : "Preview Below"}
                </span>
                <Link
                  href="/screens/community-feed"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-slate-800 hover:text-blue-700"
                >
                  <span>Full Screen Screenshot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* ==================== COLUMN 2: CANDIDATE INTELLIGENCE HUB ==================== */}
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
                <div className="bg-slate-900 p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-3">
                    <span className="font-mono font-bold text-blue-400">
                      02 • CANDIDATE INTELLIGENCE HUB
                    </span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">
                      Survey Matrix
                    </span>
                  </div>

                  {/* Mini UI Mock Card inside Preview Graphic */}
                  <div className="bg-white rounded-xl p-3.5 text-slate-900 space-y-2 shadow-sm">
                    <div className="text-[10px] font-mono font-bold uppercase text-blue-800 bg-blue-50 px-2 py-0.5 rounded inline-block">
                      Issue: 6-Storey Transit Corridor Zoning
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="font-bold text-slate-900">Maya Lin</div>
                        <div className="text-emerald-800 font-bold mt-0.5">
                          ✓ Strong Support
                        </div>
                        <div className="text-slate-600 mt-0.5 line-clamp-2">
                          As-of-right 6-storey + co-op fast-track
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="font-bold text-slate-900">D. Kowalski</div>
                        <div className="text-amber-900 font-bold mt-0.5">
                          ◐ Conditional
                        </div>
                        <div className="text-slate-600 mt-0.5 line-clamp-2">
                          Main arterials after hydro review
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="font-bold text-slate-900">Priya Nair</div>
                        <div className="text-emerald-800 font-bold mt-0.5">
                          ✓ Strong Support
                        </div>
                        <div className="text-slate-600 mt-0.5 line-clamp-2">
                          6-storey + $25M Land Trust fund
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 text-slate-600 font-medium">
                      <span>★ Slate: More Neighbours Metro</span>
                      <span className="text-blue-700 font-bold">Direct Message →</span>
                    </div>
                  </div>
                </div>

                {/* Screen 2 Description & Bullet Points */}
                <div className="p-6">
                  <div className="text-xs font-semibold text-blue-700 italic mb-1">
                    Core Value: “Knowledge is power”
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    2. Candidate & Ballot Intelligence Hub
                  </h3>

                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Scale className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Side-by-side platform matrix:
                        </strong>{" "}
                        Instantly compare candidate responses to standardized local survey questions on housing, transit, and safety.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Complete candidate bios & media:
                        </strong>{" "}
                        Access detailed bios, voting records, verified media clips, and endorsements in one central place.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Trusted voter guides & slates:
                        </strong>{" "}
                        View curated slate recommendations and endorsements from trusted local advocacy groups and voting blocks.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Direct messaging & peer reviews:
                        </strong>{" "}
                        Read authentic peer testimonials from fellow voters or reach out directly to candidates with your questions.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-blue-700">
                  {activeShowcaseTab === 2 ? "● Active in Preview Below" : "Preview Below"}
                </span>
                <Link
                  href="/screens/candidate-hub"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-slate-800 hover:text-blue-700"
                >
                  <span>Full Screen Screenshot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* ==================== COLUMN 3: MY ACTION & ELECTION CENTER ==================== */}
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
                <div className="bg-slate-900 p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-3">
                    <span className="font-mono font-bold text-amber-400">
                      03 • MY ACTION & ELECTION CENTER
                    </span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">
                      Nov 21 Poll
                    </span>
                  </div>

                  {/* Mini UI Mock Card inside Preview Graphic */}
                  <div className="bg-white rounded-xl p-3.5 text-slate-900 space-y-2.5 shadow-sm">
                    {/* Mini Tier Tabs */}
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Regional
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white">
                        Councilor (Active)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Mayoral
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Prov
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Fed
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between text-[10px]">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Vote Pledged: Maya Lin (Ward 14)
                        </span>
                        <span className="text-emerald-800 font-semibold">
                          ✓ Lawn Sign Ordered for 482 Logan Ave
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded bg-blue-700 text-white font-bold">
                        1-Click
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 text-slate-600 font-mono">
                      <span>📍 Poll: Earl Grey Sr PS (6m walk)</span>
                      <span className="text-emerald-700 font-bold">10 AM–8 PM</span>
                    </div>
                  </div>
                </div>

                {/* Screen 3 Description & Bullet Points */}
                <div className="p-6">
                  <div className="text-xs font-semibold text-blue-700 italic mb-1">
                    Core Value: “Politics is local”
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    3. My Action & Election Center
                  </h3>

                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Active election tabs (Local to Fed):
                        </strong>{" "}
                        Easily navigate active races by level of government (Regional, Councilor, Mayoral, Provincial, Federal).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Flag className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Candidate snapshots & primary issues:
                        </strong>{" "}
                        View running candidates directly within each active tab, complete with top primary issues and profile links.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Integrated calendar (Times, Debates):
                        </strong>{" "}
                        Track crucial voting times, local debate schedules, volunteer shifts, and community watch parties.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span>
                        <strong className="text-slate-900">
                          Polling location & yard sign tools:
                        </strong>{" "}
                        Get directions, hours, and ID details for your polling station, plus 1-click vote pledges and yard sign delivery.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-blue-700">
                  {activeShowcaseTab === 3 ? "● Active in Preview Below" : "Preview Below"}
                </span>
                <Link
                  href="/screens/election-center"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-slate-800 hover:text-blue-700"
                >
                  <span>Full Screen Screenshot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
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
                Interactive Screen Studio • Ready for Screenshots
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Explore the 3 Live Mock Screens
              </h2>
            </div>

            {/* Switcher Tabs + Open Full Screen Button */}
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
                  1. Local Community Feed
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
                  2. Candidate Intelligence Hub
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
                  3. My Action & Election Center
                </button>
              </div>

              <Link
                href={
                  activeShowcaseTab === 1
                    ? "/screens/community-feed"
                    : activeShowcaseTab === 2
                    ? "/screens/candidate-hub"
                    : "/screens/election-center"
                }
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Open Standalone Screen for Screenshot</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
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
                    ? "ward-14/community-feed"
                    : activeShowcaseTab === 2
                    ? "ward-14/candidate-intelligence-hub"
                    : "ward-14/election-center"}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-emerald-400">● Verified Precinct Session (M4K 1N2)</span>
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

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Select Your Account Type
              </span>
              <div className="flex items-center gap-1.5">
                {(["Voter", "Candidate", "Voting Block"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFooterRole(role)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      footerRole === role
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {footerSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-sm flex items-center justify-between">
                <span>
                  ✓ Early access registered for <strong>{footerEmail}</strong> ({footerRole} • {footerPostal || "Canada"}).
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
                className="grid grid-cols-1 sm:grid-cols-12 gap-3"
              >
                <input
                  type="text"
                  value={footerPostal}
                  onChange={(e) => setFooterPostal(e.target.value.toUpperCase())}
                  placeholder="Postal Code (e.g. M4K 1N2)"
                  className="sm:col-span-4 px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  required
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  placeholder="Your email address..."
                  className="sm:col-span-5 px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="sm:col-span-3 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition cursor-pointer"
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
