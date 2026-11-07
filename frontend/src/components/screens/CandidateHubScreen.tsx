"use client";

import React, { useState } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  FileCheck2,
  MapPin,
  MessageSquarePlus,
  PlayCircle,
  Quote,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Video,
} from "lucide-react";
import {
  CANDIDATES,
  SURVEY_TOPICS,
  VOTER_CONTEXT,
  VOTING_ORGANIZATIONS,
} from "@/data/mockCivicData";

function StanceBadge({ stance }: { stance: string }) {
  const styles: Record<string, string> = {
    "Strong Support":
      "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold",
    "Conditional Support":
      "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
    "Phased Approach":
      "bg-blue-50 text-blue-800 border-blue-200 font-semibold",
    Opposes: "bg-rose-50 text-rose-800 border-rose-200 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${
        styles[stance] || "bg-slate-100 text-slate-800 border-slate-200"
      }`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      {stance}
    </span>
  );
}

export default function CandidateHubScreen({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [selectedTopicKey, setSelectedTopicKey] = useState<string>("all");
  const [activeCandidateId, setActiveCandidateId] = useState<string>("maya-lin");
  const [directQuestion, setDirectQuestion] = useState<string>("");
  const [questionSent, setQuestionSent] = useState<boolean>(false);

  const selectedCandidate =
    CANDIDATES.find((c) => c.id === activeCandidateId) || CANDIDATES[0];

  const visibleTopics =
    selectedTopicKey === "all"
      ? SURVEY_TOPICS.slice(0, 2)
      : SURVEY_TOPICS.filter((t) => t.key === selectedTopicKey);

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
                Screen 2 • Candidate & Ballot Intelligence Hub
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Core Value:{" "}
              <span className="font-semibold text-slate-700 italic">
                “Knowledge is power”
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ballot Race: {VOTER_CONTEXT.wardName} Councillor</span>
          </div>
          <span className="text-xs font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-full">
            3 Certified Candidates • 100% Survey Completion
          </span>
        </div>
      </header>

      <div className={`max-w-[1360px] mx-auto ${compact ? "p-4" : "p-5 lg:p-7"} space-y-6`}>
        {/* SECTION 1: Side-by-Side Platform Comparison Matrix */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-50/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                <Scale className="w-3.5 h-3.5" />
                <span>Side-by-Side Standardized Survey Matrix</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Compare Ward 14 Candidates on Local Issues
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Every candidate answered identical precinct-vetted policy prompts on housing, complete streets, public safety, and main street taxes.
              </p>
            </div>

            {/* Issue Switcher Pills */}
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTopicKey("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedTopicKey === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Top 2 Issues (Overview)
              </button>
              {SURVEY_TOPICS.map((topic) => (
                <button
                  key={topic.key}
                  type="button"
                  onClick={() => setSelectedTopicKey(topic.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedTopicKey === topic.key
                      ? "bg-blue-700 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Candidate Column Headers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
            <div className="lg:col-span-3 p-4 bg-slate-50/90 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-center">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Standardized Survey Prompt
              </span>
              <p className="text-xs text-slate-600 mt-1">
                Click any candidate header to inspect their full dossier, voting record, media clips & peer testimonials below.
              </p>
            </div>

            {CANDIDATES.map((candidate) => {
              const isSelected = candidate.id === activeCandidateId;
              return (
                <div
                  key={candidate.id}
                  onClick={() => setActiveCandidateId(candidate.id)}
                  className={`lg:col-span-3 p-4 border-b lg:border-b-0 lg:border-r last:border-r-0 border-slate-200 cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-50/50 ring-2 ring-inset ring-blue-600/30"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl ${candidate.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-2xs shrink-0`}
                      >
                        {candidate.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h2 className="font-bold text-sm text-slate-900">
                            {candidate.name}
                          </h2>
                          <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {candidate.pledgeCountInWard.toLocaleString()} Ward Pledges
                        </span>
                      </div>
                    </div>

                    {candidate.userPledged && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-700 text-white">
                        Your Pledge
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                    {candidate.tagline}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.endorsedByOrgs.slice(0, 2).map((org) => (
                      <span
                        key={org}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200"
                      >
                        ★ {org}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matrix Comparison Rows */}
          <div className="divide-y divide-slate-200">
            {visibleTopics.map((topic) => (
              <div
                key={topic.key}
                className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
              >
                {/* Prompt Column */}
                <div className="lg:col-span-3 p-4 bg-slate-50/70 lg:border-r border-slate-200">
                  <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded mb-1.5">
                    {topic.label}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                    {topic.question}
                  </p>
                </div>

                {/* Candidate Response Cells */}
                {CANDIDATES.map((candidate) => {
                  const ans = candidate.surveyAnswers[topic.key];
                  const isSelected = candidate.id === activeCandidateId;
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setActiveCandidateId(candidate.id)}
                      className={`lg:col-span-3 p-4 lg:border-r last:border-r-0 border-slate-200 flex flex-col justify-between cursor-pointer transition ${
                        isSelected ? "bg-blue-50/20" : "bg-white hover:bg-slate-50/60"
                      }`}
                    >
                      <div>
                        <div className="mb-2">
                          <StanceBadge stance={ans.stance} />
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-snug mb-2">
                          {ans.summary}
                        </p>
                      </div>
                      <blockquote className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border-l-2 border-slate-300">
                        “{ans.quote}”
                      </blockquote>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Comprehensive Candidate Profile + Organization Voter Guides + Testimonials & Direct Messaging */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Comprehensive Candidate Profile Dossier (Bio/CV, Voting Record, Media Clips) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-14 h-14 rounded-2xl ${selectedCandidate.avatarBg} text-white font-bold text-lg flex items-center justify-center shadow-xs`}
                >
                  {selectedCandidate.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
                      Comprehensive Candidate Profile
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Identity & Domain Verified
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedCandidate.name} — {selectedCandidate.wardOrDistrict}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {selectedCandidate.bioSummary}
                  </p>
                </div>
              </div>

              {/* Quick Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {CANDIDATES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCandidateId(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      c.id === activeCandidateId
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio / Civic CV & Credentials + Voting Record Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Civic CV */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span>Verified Bio & Civic CV</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-700">
                  {selectedCandidate.credentials.map((cred) => (
                    <li key={cred} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{cred}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Endorsed By Local Voting Blocks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.endorsedByOrgs.map((org) => (
                      <span
                        key={org}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100/80 text-amber-900 border border-amber-300"
                      >
                        <Award className="w-3 h-3" /> {org}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Public Voting & Deputation Record */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-700" />
                  <span>Council & Committee Record</span>
                </div>
                <div className="space-y-2.5">
                  {selectedCandidate.votingRecord.map((rec) => (
                    <div
                      key={rec.code}
                      className="bg-white p-2.5 rounded-lg border border-slate-200/90 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-mono font-bold text-[11px] text-slate-500">
                          {rec.code} • {rec.date}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900">
                          RECORD: {rec.vote}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 leading-snug">
                        {rec.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rec.outcome}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verified Media Clips */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <Video className="w-4 h-4 text-blue-700" />
                  <span>Verified Town Hall & Debate Media Clips</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Transcript-indexed • Unedited civic recordings
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedCandidate.mediaClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="group p-3.5 rounded-xl border border-slate-200 bg-slate-900 text-white flex flex-col justify-between hover:border-blue-400 transition cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300 mb-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                          <PlayCircle className="w-4 h-4" />
                          {clip.source}
                        </span>
                        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">
                          {clip.duration}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-white leading-snug mb-1.5">
                        {clip.title}
                      </h4>
                      <p className="text-xs text-slate-300 italic">
                        {clip.quoteSnippet}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Recorded {clip.date}</span>
                      <span className="text-blue-300 font-semibold group-hover:underline">
                        Watch + Transcript →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Organization Voter Guides + Peer Testimonials & Direct Candidate Messaging */}
          <div className="lg:col-span-5 space-y-5">
            {/* Organization Voter Guides & Slates */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Organization Voter Guides & Slates</span>
                </div>
                <span className="text-[11px] font-mono bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                  DNS TXT Verified Orgs
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3.5">
                Compare curated endorsements from trusted local advocacy blocks and subscribe to their ballot updates.
              </p>

              <div className="space-y-3">
                {VOTING_ORGANIZATIONS.map((org) => (
                  <div
                    key={org.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">
                            {org.name}
                          </span>
                          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {org.verifiedDomain} • {org.subscriberCount.toLocaleString()} Subscribers
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300 shrink-0">
                        Slate: {org.endorsedCandidateName.split("•")[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-2">
                      {org.slateSummary}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                      <div className="flex flex-wrap gap-1">
                        {org.keyPriorities.map((kp) => (
                          <span
                            key={kp}
                            className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600"
                          >
                            {kp}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-blue-700 cursor-pointer hover:underline">
                        Pledge Block Slate →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Candidate Messaging & Authentic Peer Testimonials */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <Quote className="w-4 h-4" />
                  <span>Peer Voter Testimonials & Direct Q&A</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Postal-Verified Neighbors
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {selectedCandidate.testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/80"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-800 text-white text-xs font-bold flex items-center justify-center">
                          {t.voterInitials}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">
                            {t.voterName}{" "}
                            <span className="font-mono font-normal text-slate-500">
                              ({t.postalCode})
                            </span>
                          </span>
                          <span className="text-[11px] text-blue-800 font-medium">
                            {t.relationship}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <ThumbsUp className="w-3 h-3 text-blue-600" /> {t.upvotes}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      “{t.quote}”
                    </p>
                  </div>
                ))}
              </div>

              {/* Direct Message Candidate Composer */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold inline-flex items-center gap-1.5 text-emerald-400">
                    <MessageSquarePlus className="w-4 h-4" />
                    Direct Message {selectedCandidate.name}’s Campaign
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Avg reply: &lt; 4 hrs
                  </span>
                </div>
                {questionSent ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/90 border border-emerald-700 text-xs text-emerald-200 flex items-center justify-between">
                    <span>
                      ✓ Question delivered to {selectedCandidate.name} with your verified M4K constituent badge.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionSent(false);
                        setDirectQuestion("");
                      }}
                      className="underline ml-2 font-semibold"
                    >
                      Send another
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={directQuestion}
                      onChange={(e) => setDirectQuestion(e.target.value)}
                      placeholder={`Ask ${selectedCandidate.name} a question or leave a constituent note...`}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => setQuestionSent(true)}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
