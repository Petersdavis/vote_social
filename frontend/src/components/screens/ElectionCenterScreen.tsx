"use client";

import React, { useState } from "react";
import {
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Flag,
  Home,
  IdCard,
  Layers,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import {
  CANDIDATES,
  CIVIC_CALENDAR_EVENTS,
  ELECTION_TIERS,
  POLLING_STATION_INFO,
  VOTER_CONTEXT,
} from "@/data/mockCivicData";

export default function ElectionCenterScreen({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [activeTierId, setActiveTierId] = useState<string>("Councilor");
  const [pledgedCandidateId, setPledgedCandidateId] =
    useState<string>("maya-lin");
  const [yardSignCandidateId, setYardSignCandidateId] =
    useState<string>("maya-lin");
  const [signType, setSignType] = useState<string>("Front Lawn Wire Stake");
  const [signRequested, setSignRequested] = useState<boolean>(true);
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Record<string, boolean>>(
    {
      "evt-debate": true,
      "evt-advance-poll": true,
      "evt-election-day": true,
    }
  );

  const activeTier =
    ELECTION_TIERS.find((t) => t.id === activeTierId) || ELECTION_TIERS[1];

  const toggleRsvp = (id: string) => {
    setRsvpedEventIds((prev) => ({ ...prev, [id]: !prev[id] }));
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
                Screen 3 • My Action & Election Center
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Core Value:{" "}
              <span className="font-semibold text-slate-700 italic">
                “Politics is local”
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {VOTER_CONTEXT.streetAddress} • {VOTER_CONTEXT.postalCode}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-950 px-3 py-1.5 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Election Day in 14 Days (Nov 21)</span>
          </div>
        </div>
      </header>

      <div
        className={`max-w-[1360px] mx-auto ${
          compact ? "p-4" : "p-5 lg:p-7"
        } space-y-6`}
      >
        {/* SECTION 1: Tiered Election Tabs (Regional, Councilor, Mayoral, Provincial, Federal) */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Tiered Government Ballot Navigator • Postal Code M4K 1N2</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Your Active Elections & Local Races
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ballot Readiness: 3 of 3 Municipal Races Pledged
              </span>
            </div>
          </div>

          {/* 5 Tiered Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {ELECTION_TIERS.map((tier) => {
              const isSelected = tier.id === activeTierId;
              const isActiveCycle = tier.status.includes("Active");
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setActiveTierId(tier.id)}
                  className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50/90 text-slate-800 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isSelected ? "text-blue-300" : "text-blue-700"
                        }`}
                      >
                        {tier.label}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActiveCycle ? "bg-emerald-400" : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <p
                      className={`text-xs font-semibold truncate ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {tier.jurisdiction}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/20 flex items-center justify-between text-[11px]">
                    <span
                      className={
                        isSelected ? "text-slate-300 font-mono" : "text-slate-500 font-mono"
                      }
                    >
                      {tier.candidatesCount} Candidates
                    </span>
                    <span
                      className={`font-semibold ${
                        isSelected ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      {tier.status.split("•")[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Tier Sub-banner */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900">
                Selected Race: {activeTier.label} ({activeTier.jurisdiction})
              </span>{" "}
              — {activeTier.description}
            </div>
            <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
              {VOTER_CONTEXT.totalWardPledges.toLocaleString()} Verified Ward 14 Voter Pledges Cast
            </span>
          </div>
        </section>

        {/* SECTION 2: Candidate Snapshot View + One-Click Civic Actions (Vote Pledge & Yard Sign Request) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Candidate Snapshot Cards */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Candidate Snapshot View • {activeTier.jurisdiction}
                </h2>
                <p className="text-xs text-slate-600">
                  Compare top primary issues, see neighbor pledge momentum in{" "}
                  <span className="font-mono font-semibold">M4K</span>, and pledge your vote or request a lawn sign in one click.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                <Sparkles className="w-3.5 h-3.5" /> 1-Click Pledge Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CANDIDATES.map((candidate) => {
                const isPledged = pledgedCandidateId === candidate.id;
                const isSignTarget =
                  signRequested && yardSignCandidateId === candidate.id;

                return (
                  <div
                    key={candidate.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition bg-white ${
                      isPledged
                        ? "border-blue-600 ring-2 ring-blue-600/15 shadow-xs"
                        : "border-slate-200/90 shadow-2xs hover:border-slate-300"
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-11 h-11 rounded-xl ${candidate.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-2xs shrink-0`}
                          >
                            {candidate.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <h3 className="font-bold text-sm text-slate-900">
                                {candidate.name}
                              </h3>
                              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {candidate.roleTitle}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {candidate.tagline}
                      </p>

                      {/* Top Primary Issues */}
                      <div className="mb-3.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                          Top Primary Issues
                        </span>
                        <div className="space-y-1">
                          {candidate.topIssues.map((issue) => (
                            <div
                              key={issue}
                              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                              <span className="truncate">{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Neighborhood Metrics & 1-Click Actions */}
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                        <span>
                          <strong className="text-slate-900">
                            {candidate.pledgeCountInPostal + (isPledged && !candidate.userPledged ? 1 : 0)}
                          </strong>{" "}
                          in M4K pledged
                        </span>
                        <span>
                          <strong className="text-slate-900">
                            {candidate.yardSignsActive}
                          </strong>{" "}
                          lawn signs
                        </span>
                      </div>

                      {/* One-Click Pledge Button */}
                      <button
                        type="button"
                        onClick={() => setPledgedCandidateId(candidate.id)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          isPledged
                            ? "bg-blue-700 text-white shadow-2xs"
                            : "bg-slate-900 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isPledged ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Vote Pledged (Badge Active)</span>
                          </>
                        ) : (
                          <>
                            <Flag className="w-3.5 h-3.5" />
                            <span>1-Click Pledge My Vote</span>
                          </>
                        )}
                      </button>

                      {/* One-Click Yard Sign + Full Profile Row */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setYardSignCandidateId(candidate.id);
                            setSignRequested(true);
                          }}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold border transition flex items-center justify-center gap-1 ${
                            isSignTarget
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <Home className="w-3 h-3 shrink-0" />
                          <span>
                            {isSignTarget ? "Sign Ordered ✓" : "Request Yard Sign"}
                          </span>
                        </button>
                        <span
                          className="py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer inline-flex items-center gap-1"
                          title="Full Candidate Dossier"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* One-Click Lawn Sign Delivery & Voting Slate Action Drawer */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                        One-Click Civic Action • Official Lawn & Window Sign Delivery
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900">
                        Confirmed for {VOTER_CONTEXT.streetAddress} ({VOTER_CONTEXT.postalCode})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      Volunteer Sign Drop:{" "}
                      {CANDIDATES.find((c) => c.id === yardSignCandidateId)?.name}{" "}
                      for Ward 14 Councillor
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      No forms to re-type—your verified address is shared only with the official campaign sign crew. Scheduled for Saturday Nov 14 morning run.
                    </p>
                  </div>
                </div>

                {/* Sign Display Style Selector */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {[
                    "Front Lawn Wire Stake",
                    "Window / Balcony Poster",
                    "Porch Wood Stake",
                  ].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSignType(style)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        signType === style
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Dynamic Civic Calendar */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                <Calendar className="w-4 h-4" />
                <span>Dynamic Civic Calendar</span>
              </div>
              <span className="text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                iCal / Google Sync
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Voting windows, live Ward 14 debates, volunteer sign drops, and Election Night watch parties.
            </p>

            <div className="space-y-3">
              {CIVIC_CALENDAR_EVENTS.map((evt) => {
                const isRsvped = rsvpedEventIds[evt.id] ?? false;
                const badgeColors: Record<string, string> = {
                  "Voting Window":
                    "bg-amber-100 text-amber-950 border-amber-300",
                  "Live Debate": "bg-blue-100 text-blue-900 border-blue-300",
                  "Volunteer & Canvass":
                    "bg-emerald-100 text-emerald-900 border-emerald-300",
                  "Watch Party":
                    "bg-purple-100 text-purple-900 border-purple-300",
                };

                return (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-xl border transition ${
                      evt.isOfficialElectionDate
                        ? "bg-amber-50/70 border-amber-300"
                        : "bg-slate-50 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          badgeColors[evt.type] || "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {evt.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {evt.dateLabel} • {evt.timeLabel}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug mb-1">
                      {evt.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mb-2.5">
                      📍 <strong className="text-slate-800">{evt.locationName}</strong> — {evt.address}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                      <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {evt.rsvpCount + (isRsvped && !evt.userRsvped ? 1 : 0)} Neighbors Attending
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRsvp(evt.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          isRsvped
                            ? "bg-emerald-700 text-white"
                            : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {isRsvped ? "✓ Reminder Active" : "+ Add Reminder"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: Interactive Polling Place Locator & Voter ID Requirements */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 6 Cols: Interactive Neighborhood Polling Map SVG */}
            <div className="lg:col-span-6">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <Compass className="w-4 h-4" />
                  <span>Interactive Polling Place Locator • Subdivision 14-08</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {POLLING_STATION_INFO.distanceWalk}
                </span>
              </div>

              {/* Stylized Custom SVG Street Map of Riverdale North / Danforth M4K */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-[#EEF2F6] h-64 shadow-inner">
                <svg
                  viewBox="0 0 600 260"
                  className="w-full h-full object-cover"
                  aria-label="Polling Station Walking Route Map"
                >
                  {/* Park Blocks */}
                  <rect
                    x="380"
                    y="20"
                    width="190"
                    height="95"
                    rx="12"
                    fill="#D1FAE5"
                    stroke="#A7F3D0"
                    strokeWidth="2"
                  />
                  <text
                    x="475"
                    y="68"
                    textAnchor="middle"
                    className="fill-emerald-800 text-[11px] font-bold"
                  >
                    WITHROW PARK
                  </text>

                  {/* Neighborhood Blocks */}
                  <rect x="20" y="20" width="150" height="85" rx="8" fill="#E2E8F0" />
                  <rect x="190" y="20" width="170" height="85" rx="8" fill="#E2E8F0" />
                  <rect x="20" y="130" width="150" height="110" rx="8" fill="#E2E8F0" />
                  <rect x="190" y="130" width="170" height="110" rx="8" fill="#E2E8F0" />
                  <rect x="380" y="135" width="190" height="105" rx="8" fill="#E2E8F0" />

                  {/* Major Arterial: Danforth Ave */}
                  <line
                    x1="0"
                    y1="18"
                    x2="600"
                    y2="18"
                    stroke="#CBD5E1"
                    strokeWidth="12"
                  />
                  {/* Strathcona Ave */}
                  <line
                    x1="0"
                    y1="118"
                    x2="600"
                    y2="118"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                  />
                  {/* Logan Ave */}
                  <line
                    x1="180"
                    y1="0"
                    x2="180"
                    y2="260"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                  />
                  {/* Carlaw / Pape Ave */}
                  <line
                    x1="370"
                    y1="0"
                    x2="370"
                    y2="260"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                  />

                  {/* Street Labels */}
                  <text x="275" y="122" textAnchor="middle" className="fill-slate-500 text-[10px] font-mono font-bold">
                    STRATHCONA AVE
                  </text>
                  <text
                    x="176"
                    y="215"
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono font-bold"
                  >
                    LOGAN AVE
                  </text>

                  {/* Walking Route Dashed Line */}
                  <path
                    d="M 180 195 L 180 118 L 310 118"
                    fill="none"
                    stroke="#1D4ED8"
                    strokeWidth="4"
                    strokeDasharray="7 5"
                    strokeLinecap="round"
                  />

                  {/* Origin Pin: Voter Home (482 Logan Ave) */}
                  <circle cx="180" cy="195" r="9" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
                  <rect x="62" y="180" width="106" height="28" rx="6" fill="#0F172A" />
                  <text x="115" y="198" textAnchor="middle" className="fill-white text-[10px] font-bold">
                    Home • M4K 1N2
                  </text>

                  {/* Destination Pin: Polling Station (Earl Grey Sr PS) */}
                  <circle cx="310" cy="118" r="12" fill="#047857" stroke="#FFFFFF" strokeWidth="3" />
                  <rect x="215" y="64" width="195" height="38" rx="8" fill="#047857" />
                  <text x="312" y="81" textAnchor="middle" className="fill-white text-[11px] font-bold">
                    VOTE HERE: Earl Grey Sr. PS
                  </text>
                  <text x="312" y="95" textAnchor="middle" className="fill-emerald-100 text-[9px] font-mono">
                    500 Strathcona Ave • 6 min walk
                  </text>
                </svg>

                {/* Floating Map Legend Pill */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-blue-700" />
                  <span>Turn-by-Turn Walking & Transit Directions</span>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Polling Station Details, Hours & Required ID */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase">
                    Assigned Voting Location • {POLLING_STATION_INFO.subdivision}
                  </span>
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {POLLING_STATION_INFO.waitEstimate}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {POLLING_STATION_INFO.stationName}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {POLLING_STATION_INFO.address} — {POLLING_STATION_INFO.entranceNote}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Election Day Hours
                    </span>
                    <span className="font-bold text-slate-900">
                      {POLLING_STATION_INFO.hours}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Accessibility & Support
                    </span>
                    <span className="font-bold text-emerald-800">
                      ✓ Barrier-Free Ramp & Audio Pad
                    </span>
                  </div>
                </div>
              </div>

              {/* Required Voter ID Checklist */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">
                  <IdCard className="w-4 h-4 text-blue-700" />
                  <span>Required Voter ID & Address Verification</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {POLLING_STATION_INFO.idRequirements.map((req) => (
                    <li key={req} className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
