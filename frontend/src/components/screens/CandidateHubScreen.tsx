"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Bell,
  Download,
  ExternalLink,
  FileText,
  Flag,
  MapPin,
  MessageSquareQuote,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Users,
  Video,
} from "lucide-react";
import { CANDIDATES, VOTER_CONTEXT } from "@/data/mockCivicData";

export default function CandidateHubScreen({
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

  const [selectedCandidateId, setSelectedCandidateId] =
    useState<string>("maya-lin");
  const [pledgedCandidateIds, setPledgedCandidateIds] = useState<
    Record<string, boolean>
  >({
    "maya-lin": true,
  });
  const [lawnSignRequestedIds, setLawnSignRequestedIds] = useState<
    Record<string, boolean>
  >({
    "maya-lin": true,
  });
  const [subscribedCandidateIds, setSubscribedCandidateIds] = useState<
    Record<string, boolean>
  >({
    "maya-lin": true,
  });
  const [questionDraft, setQuestionDraft] = useState<string>("");
  const [submittedQuestions, setSubmittedQuestions] = useState<
    Array<{
      id: string;
      candidateName: string;
      question: string;
      timestamp: string;
    }>
  >([]);

  const selectedCandidate =
    CANDIDATES.find((c) => c.id === selectedCandidateId) ?? CANDIDATES[0];

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionDraft.trim()) return;
    setSubmittedQuestions((prev) => [
      {
        id: `q-${Date.now()}`,
        candidateName: selectedCandidate.name,
        question: questionDraft.trim(),
        timestamp: "Just now • Public on Ward 14 Feed",
      },
      ...prev,
    ]);
    setQuestionDraft("");
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
      {/* Top App Header */}
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
              /{normalizedSlug}/candidates
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formattedMunicipality}</span>
            <span className="text-slate-400">•</span>
            <span>{VOTER_CONTEXT.wardName}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-emerald-300">
              {VOTER_CONTEXT.postalCode}
            </span>
          </div>
        </div>
      </header>

      <div
        className={`max-w-[1360px] mx-auto ${
          compact ? "p-4" : "p-5 lg:p-7"
        }`}
      >
        {/* =====================================================================
            CANDIDATE CARDS + ZERO-MARGIN CANDIDATE SUMMARY
            - Each candidate is a card with Issue badges, Organisation badges + Unaffiliated voter# badge
            - "Your Vote" badge (replaces "Your Pledge")
            - Zero margin between the candidate cards and the candidate summary container below
           ===================================================================== */}
        <section>
          {/* Candidate Cards Row (Zero bottom margin) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 mb-0 border border-slate-200/90 rounded-t-2xl overflow-hidden bg-slate-100/70 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/90">
            {CANDIDATES.map((candidate) => {
              const isSelected = candidate.id === selectedCandidateId;
              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedCandidateId(candidate.id);
                    }
                  }}
                  className={`p-5 text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-white ring-2 ring-inset ring-blue-600/20"
                      : "bg-slate-50/70 hover:bg-white/80"
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Candidate Identity & "Your Vote" Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl ${candidate.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0`}
                        >
                          {candidate.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h2 className="font-bold text-base text-slate-900">
                              {candidate.name}
                            </h2>
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

                      {(pledgedCandidateIds[candidate.id] ??
                        candidate.userPledged) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-700 text-white shadow-2xs shrink-0">
                          <Sparkles className="w-3 h-3" />
                          Your Vote
                        </span>
                      )}
                    </div>

                    {/* Issue Badges */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                        Key Issues
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.topIssues.map((issue) => (
                          <span
                            key={issue}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 inline-flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                            <span>{issue}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Organisation Badges + Unaffiliated Voter# Badge */}
                    <div className="pt-3 border-t border-slate-200/70">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                        Organizations & Unaffiliated Voters
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
                              {org.voterCount.toLocaleString()}
                            </span>
                          </span>
                        ))}

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

                  {/* Active Card Indicator Bar */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        isSelected ? "text-blue-700" : "text-slate-500"
                      }`}
                    >
                      {isSelected
                        ? "Viewing Candidate Summary Below"
                        : "Select to View Summary"}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-600">
                      {candidate.pledgeCountInWard.toLocaleString()} Ward Votes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =====================================================================
              ZERO-MARGIN CANDIDATE SUMMARY CONTAINER
              - Left 7 cols: Candidate Files, Council & Committee Record, Media
              - Right 5 cols: Peer Voter Testimonials & Direct Q&A shifted up
             ===================================================================== */}
          <div className="mt-0 bg-white rounded-b-2xl border border-t-0 border-slate-200/90 p-5 lg:p-6 shadow-2xs">
            {/* Candidate Summary Top Bar + Row of CTAs under Tagline */}
            <div className="pb-5 mb-5 border-b border-slate-200/80">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-13 h-13 rounded-2xl ${selectedCandidate.avatarBg} text-white font-bold text-lg flex items-center justify-center shadow-xs shrink-0`}
                >
                  {selectedCandidate.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      {selectedCandidate.name}
                    </h2>
                    <ShieldCheck
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      aria-label="Verified Candidate Identity"
                    />
                    <span className="text-xs font-mono text-slate-500">
                      {selectedCandidate.roleTitle} •{" "}
                      {selectedCandidate.wardOrDistrict}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {selectedCandidate.tagline}
                  </p>

                  {/* Row of Candidate CTAs under Tagline */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPledgedCandidateIds((prev) => ({
                          ...prev,
                          [selectedCandidate.id]: !prev[selectedCandidate.id],
                        }))
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        pledgedCandidateIds[selectedCandidate.id]
                          ? "bg-blue-700 text-white shadow-xs"
                          : "bg-slate-900 text-white hover:bg-blue-700"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {pledgedCandidateIds[selectedCandidate.id]
                          ? "Support Pledged (Your Vote)"
                          : "Pledge your support"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setLawnSignRequestedIds((prev) => ({
                          ...prev,
                          [selectedCandidate.id]: !prev[selectedCandidate.id],
                        }))
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        lawnSignRequestedIds[selectedCandidate.id]
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                          : "bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:text-blue-700"
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {lawnSignRequestedIds[selectedCandidate.id]
                          ? "Lawn Sign Requested"
                          : "Lawn Sign Request"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSubscribedCandidateIds((prev) => ({
                          ...prev,
                          [selectedCandidate.id]: !prev[selectedCandidate.id],
                        }))
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        subscribedCandidateIds[selectedCandidate.id]
                          ? "bg-blue-50 text-blue-900 border-blue-200"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {subscribedCandidateIds[selectedCandidate.id]
                          ? "Subscribed to Updates"
                          : "Subscribe to Updates"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Candidate Summary Content (Files/Record/Media + Shifted-Up Testimonials/Q&A) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT 7 COLUMNS: Candidate Files, Council & Committee Record, Media */}
              <div className="lg:col-span-7 space-y-5">
                {/* Candidate Files (User-Generated Filenames) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>Files</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      {selectedCandidate.files.length} Candidate Documents
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCandidate.files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between gap-2.5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-700 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-bold text-slate-900 truncate group-hover:text-blue-700">
                              {file.fileName}
                            </p>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {file.size} • {file.uploadedAt}
                            </span>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official Voting / Civic Record */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Council & Committee Record
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      Verified Clerk Roll-Call Log
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedCandidate.votingRecord.map((rec) => (
                      <div
                        key={rec.code}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                              {rec.code}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {rec.date}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                            {rec.title}
                          </p>
                          <p className="text-xs text-slate-600">{rec.outcome}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                          {rec.vote}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-blue-700" />
                    <span>Media</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCandidate.mediaClips.map((clip) => (
                      <div
                        key={clip.id}
                        className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col justify-between gap-2 group cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded">
                            {clip.source} • {clip.duration}
                          </span>
                          <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition shrink-0">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm leading-snug mb-1">
                            {clip.title}
                          </h4>
                          <p className="text-xs text-slate-300 italic line-clamp-2">
                            {clip.quoteSnippet}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT 5 COLUMNS: Peer Voter Testimonials & Direct Q&A (Shifted Up) */}
              <div className="lg:col-span-5 bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold block">
                      Neighbor Social Proof
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Peer Voter Testimonials & Direct Q&A
                    </h3>
                  </div>
                  <MessageSquareQuote className="w-5 h-5 text-blue-700 shrink-0" />
                </div>

                {/* Verified Neighbor Testimonials */}
                <div className="space-y-3">
                  {selectedCandidate.testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                            {t.voterInitials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-900">
                                {t.voterName}
                              </span>
                              <ShieldCheck
                                className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                                aria-label="Verified Neighbor Identity"
                              />
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {t.relationship} •{" "}
                              <span className="font-mono">{t.postalCode}</span>
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <ThumbsUp className="w-3 h-3 text-blue-600" />
                          {t.upvotes}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        “{t.quote}”
                      </p>
                    </div>
                  ))}
                </div>

                {/* Submitted Questions List */}
                {submittedQuestions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-bold block">
                      Your Public Questions Sent
                    </span>
                    {submittedQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-blue-800 font-semibold">
                          <span>To: {q.candidateName}</span>
                          <span>{q.timestamp}</span>
                        </div>
                        <p className="text-slate-900 font-medium">
                          “{q.question}”
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ask Candidate Form */}
                <form
                  onSubmit={handleAskQuestion}
                  className="pt-3 border-t border-slate-200/80 space-y-2"
                >
                  <label className="block text-xs font-bold text-slate-800">
                    Ask {selectedCandidate.name} a On-The-Record Question
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={questionDraft}
                      onChange={(e) => setQuestionDraft(e.target.value)}
                      placeholder={`Ask ${selectedCandidate.name} about Ward 14...`}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Verified responses appear in the Ward 14 Summary Feed.
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                      Public Q&A Log <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
