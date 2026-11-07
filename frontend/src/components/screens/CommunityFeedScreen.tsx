"use client";

import React, { useState } from "react";
import {
  ArrowBigUp,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  Filter,
  Flame,
  MapPin,
  MessageSquare,
  Megaphone,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import {
  FORUM_THREADS,
  PRECINCT_PRIORITIES,
  VOTER_CONTEXT,
  type EndorsementBadge,
} from "@/data/mockCivicData";

function PledgeBadgePill({ badge }: { badge: EndorsementBadge }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200",
  }[badge.color];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyles}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
      {badge.label}
    </span>
  );
}

export default function CommunityFeedScreen({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({
    "thread-ontario-line-mitigation": true,
    "thread-missing-middle-housing": true,
  });
  const [showCandidateOnly, setShowCandidateOnly] = useState(false);

  const categories = [
    "All",
    "Transit & Streets",
    "Housing & Zoning",
    "Parks & Safety",
    "Local Budget",
  ];

  const filteredThreads = FORUM_THREADS.filter((t) => {
    if (selectedCategory !== "All" && t.category !== selectedCategory) {
      return false;
    }
    if (showCandidateOnly && !t.candidateResponded) {
      return false;
    }
    return true;
  });

  const toggleUpvote = (id: string) => {
    setUpvotedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-[#FAF8F5] text-slate-900 min-h-full font-sans selection:bg-blue-600 selection:text-white">
      {/* Top App Bar */}
      <header className="bg-white border-b border-slate-200/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            VS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 text-base">
                Vote Social
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                Screen 1 • Community Feed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Core Value:{" "}
              <span className="font-semibold text-slate-700 italic">
                “Democracy is a social activity”
              </span>
            </p>
          </div>
        </div>

        {/* Hyper-Local Precinct Pill */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{VOTER_CONTEXT.wardName}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-emerald-300">
              {VOTER_CONTEXT.postalCode}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>1,428 Verified Neighbors in Precinct 14-08</span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className={`max-w-[1360px] mx-auto ${compact ? "p-4" : "p-5 lg:p-7"}`}>
        {/* Neighborhood Banner & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 mb-6 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Hyper-Local Precinct Forum • Subdivision 14-08 (Riverdale North)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                What matters most in {VOTER_CONTEXT.wardName} right now?
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Discussions are scoped strictly to verified postal codes in{" "}
                <span className="font-mono font-semibold text-slate-800">M4K / M4J</span>.
                Top-upvoted priorities are automatically delivered to all certified Ward 14 candidates for public response.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowCandidateOnly(!showCandidateOnly)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  showCandidateOnly
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <BadgeCheck className="w-4 h-4" />
                <span>Verified Candidate Q&A (7)</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Local Priority</span>
              </button>
            </div>
          </div>

          {/* Filter Pills & Active Voter Badge */}
          <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-xs font-medium text-slate-500 mr-1 inline-flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-slate-500">Your Active Forum Badges:</span>
              <PledgeBadgePill badge={VOTER_CONTEXT.userPledgeBadge} />
              <span className="hidden xl:inline-flex">
                <PledgeBadgePill badge={VOTER_CONTEXT.userOrgBadge} />
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Asymmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left/Center Column: Neighborhood Timeline & Q&A Threads (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {filteredThreads.map((thread) => {
              const isUpvoted = upvotedIds[thread.id] ?? false;
              const displayUpvotes =
                thread.upvotes + (isUpvoted && !thread.userUpvoted ? 1 : 0) - (!isUpvoted && thread.userUpvoted ? 1 : 0);

              return (
                <article
                  key={thread.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition hover:border-slate-300"
                >
                  {/* Top Priority Banner Strip */}
                  <div className="bg-slate-50/90 border-b border-slate-200/70 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300/80">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />#{thread.priorityRank} Precinct Priority
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-200/75 text-slate-700">
                        {thread.category}
                      </span>
                      {thread.tags.map((tag) => (
                        <span
                          key={tag}
                          className="hidden sm:inline-block text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {thread.candidateResponded && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {thread.candidateResponsesCount} Verified Candidate Responses
                      </span>
                    )}
                  </div>

                  {/* Main Post Body */}
                  <div className="p-5 flex gap-4">
                    {/* Upvote Column */}
                    <div className="flex flex-col items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleUpvote(thread.id)}
                        className={`w-12 py-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition ${
                          isUpvoted
                            ? "bg-blue-700 text-white border-blue-700 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                        title="Upvote local priority"
                      >
                        <ArrowBigUp
                          className={`w-5 h-5 ${isUpvoted ? "fill-current" : ""}`}
                        />
                        <span className="font-mono text-xs font-bold">
                          {displayUpvotes}
                        </span>
                      </button>
                      <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                        Priority
                      </span>
                    </div>

                    {/* Thread Content */}
                    <div className="flex-1 min-w-0">
                      {/* Author & Voter Endorsement Badge Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                          {thread.authorInitials}
                        </div>
                        <span className="font-semibold text-sm text-slate-900">
                          {thread.authorName}
                        </span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {thread.precinct} ({thread.postalPrefix})
                        </span>
                        <PledgeBadgePill badge={thread.pledgeBadge} />
                        <span className="text-xs text-slate-400 ml-auto">
                          {thread.timestamp}
                        </span>
                      </div>

                      {/* Title & Summary */}
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2">
                        {thread.title}
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {thread.summary}
                      </p>

                      {/* Verified Candidate Interactions & Neighbor Replies */}
                      {thread.replies.length > 0 && (
                        <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                          {thread.replies.map((reply) =>
                            reply.verifiedCandidate ? (
                              <div
                                key={reply.id}
                                className="rounded-xl bg-emerald-50/70 border border-emerald-300/90 p-4 relative"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                                      {reply.authorInitials}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-sm text-slate-900">
                                          {reply.authorName}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-700 text-white">
                                          <BadgeCheck className="w-3 h-3" />
                                          {reply.precinctOrTitle}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs text-emerald-800 font-mono">
                                    Official Q&A Response • {reply.timestamp}
                                  </span>
                                </div>

                                <p className="text-sm text-slate-800 leading-relaxed mb-2.5">
                                  {reply.content}
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/70 text-xs">
                                  {reply.policyCitation && (
                                    <span className="font-mono text-[11px] text-emerald-900 bg-white/90 px-2.5 py-1 rounded border border-emerald-200 font-medium">
                                      📄 {reply.policyCitation}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-3 text-emerald-900 font-semibold ml-auto">
                                    <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-emerald-200">
                                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                      {reply.helpfulCount} Neighbors found helpful
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                key={reply.id}
                                className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5"
                              >
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center">
                                    {reply.authorInitials}
                                  </div>
                                  <span className="font-semibold text-xs text-slate-900">
                                    {reply.authorName}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {reply.precinctOrTitle}
                                  </span>
                                  {reply.pledgeBadge && (
                                    <PledgeBadgePill badge={reply.pledgeBadge} />
                                  )}
                                  <span className="text-[11px] text-slate-400 ml-auto">
                                    {reply.timestamp}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                  {reply.content}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Footer Action Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            {thread.commentCount} Neighbor & Candidate Comments
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Bell className="w-3.5 h-3.5 text-blue-600" />
                            Subscribed to thread updates
                          </span>
                        </div>
                        <span className="font-medium text-blue-700 hover:underline cursor-pointer">
                          Ask Candidates a Follow-up →
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right Column: Precinct Priorities Leaderboard, Endorsement Badges & Org Pinned Feed (4 cols) */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Widget 1: Upvoted Local Priorities Leaderboard */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    Top Precinct Priorities
                  </h3>
                </div>
                <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  M4K • Live Rank
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Issues crossing 150+ verified neighbor upvotes trigger an official Q&A prompt to all Ward 14 candidates.
              </p>

              <div className="space-y-3">
                {PRECINCT_PRIORITIES.map((item) => (
                  <div
                    key={item.rank}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/75 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        #{item.rank}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-snug">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-slate-500">
                            {item.category}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {item.candidatesReplied}/3 Candidates Answered
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        ▲ {item.upvotes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Voter Endorsement Badges & Neighborhood Momentum */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Voter Endorsement Badges
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-3.5">
                Display your public pledge next to your forum comments so neighbors see local grassroots momentum.
              </p>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-blue-950">Your Active Badge</span>
                  <span className="text-[11px] font-semibold text-blue-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Visible on Posts
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <PledgeBadgePill badge={VOTER_CONTEXT.userPledgeBadge} />
                  <PledgeBadgePill badge={VOTER_CONTEXT.userOrgBadge} />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="font-medium text-slate-700">
                    Pledged: Maya Lin (Ward 14)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    214 in M4K
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="font-medium text-slate-700">
                    Pledged: David Kowalski (Ward 14)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    112 in M4K
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="font-medium text-slate-700">
                    Pledged: Priya Nair (Ward 14)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    86 in M4K
                  </span>
                </div>
              </div>
            </div>

            {/* Widget 3: Voting Block Pinned Broadcast */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                  <Megaphone className="w-3.5 h-3.5" />
                  Pinned Voting Block Broadcast
                </span>
                <span className="text-[11px] text-slate-400">Opt-in Feed</span>
              </div>
              <h4 className="font-bold text-sm text-white mb-1">
                More Neighbours Metro • Ward 14 Chapter
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                “Our volunteer research team audited all 3 Ward 14 candidates on 6-storey transit zoning and co-op housing speedups. Join 412 East End subscribers at Tuesday’s debate!”
              </p>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-xs">
                <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> 4,820 Block Subscribers
                </span>
                <span className="text-white font-semibold underline cursor-pointer">
                  View Slate Guide →
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
