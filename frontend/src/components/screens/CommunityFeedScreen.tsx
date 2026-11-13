"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowBigUp,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  FileText,
  Flame,
  Layers,
  MapPin,
  MessageSquare,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import {
  CANDIDATES,
  FORUM_THREADS,
  SCOPED_POLICIES,
  VOTER_CONTEXT,
  VOTING_ORGANIZATIONS,
  getIssuesWithPoliciesForTier,
  type EndorsementBadge,
} from "@/data/mockCivicData";

function PledgeBadgePill({ badge }: { badge: EndorsementBadge }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200",
    slate: "bg-slate-100 text-slate-700 border-slate-300",
  }[badge.color];

  const dotStyles = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    purple: "bg-purple-600",
    slate: "bg-slate-400",
  }[badge.color];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyles}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotStyles}`} />
      {badge.label}
    </span>
  );
}

export default function CommunityFeedScreen({
  compact = false,
  municipality,
}: {
  compact?: boolean;
  municipality?: string;
}) {
  const params = useParams<{ municipality?: string }>();
  const rawSlug =
    municipality ||
    (typeof params?.municipality === "string"
      ? params.municipality
      : "toronto_2026");

  const normalizedSlug = rawSlug.includes("_")
    ? rawSlug.toLowerCase()
    : `${rawSlug.toLowerCase()}_2026`;

  const [entityPart, yearPart = "2026"] = normalizedSlug.split("_");

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    CANDIDATES[0]?.id ?? "maya-lin"
  );
  const [selectedIssueId, setSelectedIssueId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [upvotedThreadIds, setUpvotedThreadIds] = useState<
    Record<string, boolean>
  >({
    "thread-ontario-line-mitigation": true,
    "thread-missing-middle-housing": true,
  });
  const [upvotedIssueIds, setUpvotedIssueIds] = useState<
    Record<string, boolean>
  >({});

  const formattedEntity =
    entityPart === "toronto"
      ? "City of Toronto"
      : entityPart === "ontario"
      ? "Province of Ontario"
      : entityPart === "canada"
      ? "Government of Canada"
      : entityPart
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

  const formattedMunicipality = `${formattedEntity} (${yearPart})`;

  const issuesForElection = getIssuesWithPoliciesForTier(
    entityPart === "ontario"
      ? ["Provincial"]
      : entityPart === "canada"
      ? ["Federal"]
      : ["Councilor", "Mayoral", "Regional"]
  );

  // Top Issues by Vote
  const topIssuesByVote = [...issuesForElection].sort(
    (a, b) => b.voteCount - a.voteCount
  );

  // Left-hand feed of issues ordered by recent activity
  const feedThreadsByRecentActivity = [...FORUM_THREADS]
    .sort((a, b) => a.recentActivityMinutesAgo - b.recentActivityMinutesAgo)
    .filter((thread) => {
      if (selectedIssueId !== "all" && thread.issueId !== selectedIssueId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = thread.title.toLowerCase().includes(q);
        const matchesIssue = thread.issueTitle.toLowerCase().includes(q);
        const matchesSummary = thread.summary.toLowerCase().includes(q);
        const matchesTags = thread.tags.some((t) =>
          t.toLowerCase().includes(q)
        );
        return matchesTitle || matchesIssue || matchesSummary || matchesTags;
      }
      return true;
    });

  const toggleThreadVote = (id: string) => {
    setUpvotedThreadIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleIssueVote = (id: string) => {
    setUpvotedIssueIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const orgBadgeStyles = {
    emerald: "bg-emerald-50 text-emerald-900 border-emerald-200",
    blue: "bg-blue-50 text-blue-900 border-blue-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200",
    purple: "bg-purple-50 text-purple-900 border-purple-200",
    slate: "bg-slate-100 text-slate-800 border-slate-300",
  };

  return (
    <div className="bg-[#FAF8F5] text-slate-900 min-h-full font-sans selection:bg-blue-600 selection:text-white">
      {/* Top App Bar */}
      <header className="bg-white border-b border-slate-200/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            VS
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold tracking-tight text-slate-900 text-base">
              Vote Social
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              /{normalizedSlug}/summary
            </span>
          </div>
        </div>

        {/* Ward Pill */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{formattedMunicipality}</span>
            <span className="text-slate-400">•</span>
            <span>{VOTER_CONTEXT.wardName}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-emerald-300">
              {VOTER_CONTEXT.postalCode}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>1,428 Verified Neighbors in Ward 14</span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div
        className={`max-w-[1360px] mx-auto ${
          compact ? "p-4" : "p-5 lg:p-7"
        } space-y-6`}
      >
        {/* =====================================================================
            FIRST ROW OF CARDS: ALL CANDIDATES IN THE ELECTION
            - Section of badges with their Key Issues
            - Section of badges with their Organisational Supports (inc. number of voters)
            - Generic badge for number of voters independently aligned with the candidate
           ===================================================================== */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {formattedMunicipality} Election Summary •{" "}
                  {VOTER_CONTEXT.wardName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Candidates, Key Issues & Voter Alignment
              </h1>
            </div>

            <Link
              href={`/${normalizedSlug}/candidates`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition self-start lg:self-auto shrink-0"
            >
              <span>View Candidate Profiles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* First Row: Selectable Candidate Badge Tabs on Mobile / Full Candidate Cards on Desktop */}
          <div className="grid grid-cols-3 gap-0 md:gap-4 border border-slate-200/90 md:border-0 rounded-t-2xl md:rounded-none overflow-hidden md:overflow-visible bg-slate-100/70 md:bg-transparent divide-x divide-slate-200/90 md:divide-x-0">
            {CANDIDATES.map((candidate) => {
              const isSelectedCandidate = candidate.id === selectedCandidateId;
              const totalOrgVoters = candidate.orgSupports.reduce(
                (acc, org) => acc + org.voterCount,
                0
              );
              const totalAlignedVoters =
                totalOrgVoters + candidate.independentVotersCount;

              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select candidate ${candidate.name}`}
                  aria-selected={isSelectedCandidate}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedCandidateId(candidate.id);
                    }
                  }}
                  className={`p-3 md:p-4 flex flex-col items-center md:items-stretch justify-center md:justify-between transition cursor-pointer md:cursor-default md:rounded-2xl md:border ${
                    isSelectedCandidate
                      ? "bg-white ring-2 ring-inset ring-blue-600/20 md:ring-0"
                      : "bg-slate-50/70 hover:bg-white/80"
                  } ${
                    candidate.userPledged
                      ? "md:border-blue-600 md:ring-2 md:ring-blue-600/15 md:bg-white md:shadow-xs"
                      : "md:border-slate-200/90 md:hover:border-slate-300 md:bg-white"
                  }`}
                >
                  <div className="w-full flex flex-col items-center md:items-stretch md:space-y-3.5">
                    {/* Candidate Identity Header (Mobile: Badge Only | Desktop: Badge + Name + Details) */}
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-between gap-1.5 md:gap-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-11 h-11 rounded-xl ${candidate.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-2xs shrink-0 ${
                              isSelectedCandidate
                                ? "ring-2 ring-offset-2 ring-blue-600 md:ring-0 md:ring-offset-0"
                                : "opacity-80 md:opacity-100"
                            }`}
                          >
                            {candidate.initials}
                          </div>
                          {candidate.userPledged && (
                            <span
                              className="md:hidden absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-700 text-white flex items-center justify-center ring-2 ring-white shadow-2xs"
                              title="Your Vote"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="hidden md:block">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/${normalizedSlug}/candidates`}
                              className="font-bold text-base text-slate-900 hover:text-blue-700 hover:underline transition"
                            >
                              {candidate.name}
                            </Link>
                            <ShieldCheck
                              className="w-4 h-4 text-emerald-600 shrink-0"
                              aria-label="Verified Candidate Identity"
                            />
                          </div>
                          <span className="text-xs text-slate-500 block">
                            {candidate.roleTitle}
                          </span>
                        </div>
                      </div>
                      {candidate.userPledged ? (
                        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-700 text-white shadow-2xs shrink-0">
                          <Sparkles className="w-3 h-3" />
                          Your Vote
                        </span>
                      ) : (
                        <span className="hidden md:inline-flex font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                          {totalAlignedVoters.toLocaleString()} Total Aligned
                        </span>
                      )}
                    </div>

                    {/* Section 1: Badges with Candidate's Key Issues (Hidden on mobile selectable tabs) */}
                    <div className="hidden md:block">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                        Key Issues
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.topIssues.map((issueLabel, idx) => {
                          const linkedIssueId =
                            candidate.keyIssueIds[idx] || "all";
                          const isSelected = selectedIssueId === linkedIssueId;
                          return (
                            <button
                              key={issueLabel}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIssueId(
                                  isSelected ? "all" : linkedIssueId
                                );
                              }}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition inline-flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? "bg-blue-700 text-white border-blue-700"
                                  : "bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isSelected ? "bg-white" : "bg-blue-600"
                                }`}
                              />
                              <span>{issueLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 2: Badges with Organisational Supports + Unaffiliated Voters Badge (Hidden on mobile selectable tabs) */}
                    <div className="hidden md:block pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                        Organizational Supports & Unaffiliated Voters
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.orgSupports.map((org) => (
                          <span
                            key={org.orgId}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                              orgBadgeStyles[org.color]
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{org.orgName}</span>
                            <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-white/80 text-[11px]">
                              {org.voterCount.toLocaleString()} voters
                            </span>
                          </span>
                        ))}

                        {/* Generic Badge for Number of Unaffiliated Voters */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                          <Users className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>Unaffiliated Voters</span>
                          <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-white text-slate-900 text-[11px]">
                            {candidate.independentVotersCount.toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Candidate Summary Drill-Down (Always displays the active tab's candidate Name, details, issues, and affiliations) */}
          {(() => {
            const activeCandidate =
              CANDIDATES.find((c) => c.id === selectedCandidateId) ??
              CANDIDATES[0];
            const totalOrgVoters = activeCandidate.orgSupports.reduce(
              (acc, org) => acc + org.voterCount,
              0
            );
            const totalAlignedVoters =
              totalOrgVoters + activeCandidate.independentVotersCount;

            return (
              <div className="md:hidden mt-0 bg-white rounded-b-2xl border border-t-0 border-slate-200/90 p-4 shadow-2xs space-y-3.5">
                {/* Selected Candidate Name & Details */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl ${activeCandidate.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-2xs shrink-0`}
                    >
                      {activeCandidate.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/${normalizedSlug}/candidates`}
                          className="font-bold text-base text-slate-900 hover:text-blue-700 hover:underline transition"
                        >
                          {activeCandidate.name}
                        </Link>
                        <ShieldCheck
                          className="w-4 h-4 text-emerald-600 shrink-0"
                          aria-label="Verified Candidate Identity"
                        />
                      </div>
                      <span className="text-xs text-slate-500 block">
                        {activeCandidate.roleTitle} •{" "}
                        {activeCandidate.wardOrDistrict}
                      </span>
                      <p className="text-xs text-slate-600 mt-1">
                        {activeCandidate.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {activeCandidate.userPledged && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-700 text-white shadow-2xs">
                        <Sparkles className="w-3 h-3" />
                        Your Vote
                      </span>
                    )}
                    <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      {totalAlignedVoters.toLocaleString()} Total Aligned
                    </span>
                  </div>
                </div>

                {/* Selected Candidate Key Issues */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                    Key Issues
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCandidate.topIssues.map((issueLabel, idx) => {
                      const linkedIssueId =
                        activeCandidate.keyIssueIds[idx] || "all";
                      const isSelected = selectedIssueId === linkedIssueId;
                      return (
                        <button
                          key={issueLabel}
                          type="button"
                          onClick={() =>
                            setSelectedIssueId(
                              isSelected ? "all" : linkedIssueId
                            )
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition inline-flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-blue-700 text-white border-blue-700"
                              : "bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isSelected ? "bg-white" : "bg-blue-600"
                            }`}
                          />
                          <span>{issueLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Candidate Affiliations (Organizational Supports & Unaffiliated Voters) */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                    Organizational Supports & Unaffiliated Voters
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCandidate.orgSupports.map((org) => (
                      <span
                        key={org.orgId}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          orgBadgeStyles[org.color]
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{org.orgName}</span>
                        <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-white/80 text-[11px]">
                          {org.voterCount.toLocaleString()} voters
                        </span>
                      </span>
                    ))}

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                      <Users className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Unaffiliated Voters</span>
                      <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-white text-slate-900 text-[11px]">
                        {activeCandidate.independentVotersCount.toLocaleString()}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* =====================================================================
            2-COLUMN ASYMMETRIC GRID:
            - Larger Left Column (8 cols): Feed of Issues based on recent activity
            - Right Column (4 cols): Top Issues by Vote simplified down to just issue links and vote counts
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LARGER LEFT HAND COLUMN: Feed of Issues Based on Recent Activity (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search & Issue Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Issue Activity Feed
                  </h2>
                  <p className="text-xs text-slate-500">
                    Recent activity across issues in {VOTER_CONTEXT.wardName}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search issues or policies..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white w-48 sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Issue Thread</span>
                  </button>
                </div>
              </div>

              {/* Active Issue Filter Pills */}
              <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedIssueId("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedIssueId === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All Issues ({issuesForElection.length})
                </button>
                {issuesForElection.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() =>
                      setSelectedIssueId(
                        selectedIssueId === issue.id ? "all" : issue.id
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedIssueId === issue.id
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {issue.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Items Ordered by Recent Activity */}
            {feedThreadsByRecentActivity.map((thread) => {
              const isUpvoted = upvotedThreadIds[thread.id] ?? false;
              const displayVotes =
                thread.upvotes +
                (isUpvoted && !thread.userUpvoted ? 1 : 0) -
                (!isUpvoted && thread.userUpvoted ? 1 : 0);

              const attachedPolicies = SCOPED_POLICIES.filter((p) =>
                thread.scopedPolicyIds.includes(p.id)
              );

              return (
                <article
                  key={thread.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition hover:border-slate-300"
                >
                  {/* Top Issue Banner Strip */}
                  <div className="bg-slate-50/90 border-b border-slate-200/70 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedIssueId(thread.issueId)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100/90 text-blue-900 border border-blue-300/80 hover:bg-blue-200/70 transition cursor-pointer"
                      >
                        <span>Issue: {thread.issueTitle}</span>
                      </button>
                      <span className="text-xs font-mono text-slate-500">
                        • Active {thread.timestamp}
                      </span>
                    </div>

                    {thread.candidateResponded && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {thread.candidateResponsesCount} Verified Candidate
                        Responses
                      </span>
                    )}
                  </div>

                  {/* Main Post Body */}
                  <div className="p-5 flex gap-4">
                    {/* Vote Column */}
                    <div className="flex flex-col items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleThreadVote(thread.id)}
                        className={`w-12 py-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                          isUpvoted
                            ? "bg-blue-700 text-white border-blue-700 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                        title="Vote on this issue"
                      >
                        <ArrowBigUp
                          className={`w-5 h-5 ${
                            isUpvoted ? "fill-current" : ""
                          }`}
                        />
                        <span className="font-mono text-xs font-bold">
                          {displayVotes}
                        </span>
                      </button>
                      <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                        Votes
                      </span>
                    </div>

                    {/* Issue Thread Content */}
                    <div className="flex-1 min-w-0">
                      {/* Author & Voter/Org Endorsement Badge Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                          {thread.authorInitials}
                        </div>
                        <span className="font-semibold text-sm text-slate-900 inline-flex items-center gap-1">
                          <span>{thread.authorName}</span>
                          {thread.verifiedIdentity && (
                            <ShieldCheck
                              className="w-4 h-4 text-emerald-600 shrink-0"
                              aria-label="Verified Identity"
                            />
                          )}
                        </span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {thread.precinct} ({thread.postalPrefix})
                        </span>
                        <PledgeBadgePill badge={thread.pledgeBadge} />
                      </div>

                      {/* Title & Summary */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2">
                        {thread.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3.5">
                        {thread.summary}
                      </p>

                      {/* Policies */}
                      {attachedPolicies.length > 0 && (
                        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <FileText className="w-3.5 h-3.5 text-blue-700" />
                              Policies
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {attachedPolicies.map((pol) => (
                              <div
                                key={pol.id}
                                className="p-2.5 rounded-lg bg-white border border-slate-200/90 flex flex-col justify-between"
                              >
                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                    {pol.code}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-slate-600">
                                    ▲ {pol.voteCount}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 leading-snug">
                                  {pol.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-sm text-slate-900 inline-flex items-center gap-1">
                                        <span>{reply.authorName}</span>
                                        <ShieldCheck
                                          className="w-4 h-4 text-emerald-600 shrink-0"
                                          aria-label="Verified Candidate Identity"
                                        />
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-700 text-white">
                                        {reply.precinctOrTitle}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-emerald-800 font-mono">
                                    Official Response • {reply.timestamp}
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
                                      {reply.helpfulCount} Neighbors found
                                      helpful
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
                                  <span className="font-semibold text-xs text-slate-900 inline-flex items-center gap-1">
                                    <span>{reply.authorName}</span>
                                    {reply.verifiedIdentity && (
                                      <ShieldCheck
                                        className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                                        aria-label="Verified Identity"
                                      />
                                    )}
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
                            {thread.commentCount} Issue Comments
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Bell className="w-3.5 h-3.5 text-blue-600" />
                            Subscribed to issue updates
                          </span>
                        </div>
                        <span className="font-medium text-blue-700 hover:underline cursor-pointer">
                          Ask Candidates About This Issue &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* RIGHT HAND SIDE: Top Issues by Vote simplified down to just issue links and vote counts (4 cols) */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    Top Issues by Vote
                  </h3>
                </div>
                {selectedIssueId !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSelectedIssueId("all")}
                    className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Show All
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {topIssuesByVote.map((issue) => {
                  const isSelected = selectedIssueId === issue.id;
                  const isVoted = upvotedIssueIds[issue.id] ?? false;
                  const voteTotal = issue.voteCount + (isVoted ? 1 : 0);

                  return (
                    <div
                      key={issue.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIssueId(isSelected ? "all" : issue.id)
                        }
                        className={`text-left text-xs sm:text-sm font-semibold hover:text-blue-700 hover:underline transition truncate cursor-pointer ${
                          isSelected
                            ? "text-blue-700 font-bold underline"
                            : "text-slate-800"
                        }`}
                      >
                        {issue.title}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleIssueVote(issue.id)}
                        className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 transition cursor-pointer ${
                          isVoted
                            ? "bg-blue-700 text-white border-blue-700"
                            : "bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-300 hover:text-blue-700"
                        }`}
                      >
                        ▲ {voteTotal}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Organisation & Voter Guides (Migrated to Summary Page) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    Organization & Voter Guides
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {VOTING_ORGANIZATIONS.length} Verified Guides
                </span>
              </div>

              <div className="space-y-3">
                {VOTING_ORGANIZATIONS.map((org) => {
                  const endorsementBadge: EndorsementBadge =
                    org.endorsedCandidateId === "maya-lin"
                      ? {
                          label: "Endorses: Maya Lin",
                          type: "candidate",
                          color: "blue",
                        }
                      : org.endorsedCandidateId === "david-kowalski"
                      ? {
                          label: "Endorses: David Kowalski",
                          type: "candidate",
                          color: "amber",
                        }
                      : {
                          label: "Endorses: Priya Nair",
                          type: "candidate",
                          color: "emerald",
                        };

                  return (
                    <div
                      key={org.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                              {org.name}
                            </h4>
                            <ShieldCheck
                              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                              aria-label="Verified Organization Identity"
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {org.verifiedDomain} •{" "}
                            {org.subscriberCount.toLocaleString()} Ward Voters
                          </span>
                        </div>
                      </div>

                      <div>
                        <PledgeBadgePill badge={endorsementBadge} />
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {org.slateSummary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {org.keyIssues.map((issue) => (
                          <span
                            key={issue}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
