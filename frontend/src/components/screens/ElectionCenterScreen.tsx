"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Flame,
  Globe,
  IdCard,
  Layers,
  MapPin,
  Navigation,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  POLLING_STATION_INFO,
  VOTER_CONTEXT,
  type EndorsementBadge,
} from "@/data/mockCivicData";

interface DashboardCalendarEvent {
  id: string;
  title: string;
  dayOfMonth: number; // Nov 2026 (Nov 1, 2026 is Sunday)
  dateLabel: string;
  timeLabel: string;
  locationName: string;
  description: string;
  hostLabel: string;
  color: "emerald" | "blue" | "amber" | "purple";
  rsvpCount: number;
  isPollingEvent?: boolean;
  isOfficialElectionDate?: boolean;
}

const DASHBOARD_EVENTS: DashboardCalendarEvent[] = [
  {
    id: "evt-debate",
    title: "Ward 14 All-Candidates Debate: Housing, Transit & Ontario Line",
    dayOfMonth: 10,
    dateLabel: "Tue, Nov 10",
    timeLabel: "7:00 PM – 9:00 PM",
    locationName: "Eastminster United Church (310 Danforth Ave)",
    description:
      "Live moderated debate covering 6-storey transit corridor zoning, Ontario Line construction truck enforcement, and small business property tax reform.",
    hostLabel: "Maya Lin",
    color: "blue",
    rsvpCount: 412,
  },
  {
    id: "evt-advance-poll",
    title: "Advance Voting Window Open (Ward 14 • Subdivision 14-08)",
    dayOfMonth: 12,
    dateLabel: "Thu, Nov 12 – Sun, Nov 15",
    timeLabel: "10:00 AM – 8:00 PM",
    locationName: "Jimmie Simpson Recreation Centre (870 Queen St E)",
    description:
      "Early voting open daily for all registered Ward 14 voters. Bring your Voter Notification Card and 1 piece of address ID.",
    hostLabel: "Early Polls",
    color: "emerald",
    rsvpCount: 689,
    isPollingEvent: true,
  },
  {
    id: "evt-org-townhall",
    title: "6-Storey Transit Corridor & Co-op Housing Policy Briefing",
    dayOfMonth: 13,
    dateLabel: "Fri, Nov 13",
    timeLabel: "6:30 PM – 8:00 PM",
    locationName: "Riverdale Hub (1326 Gerrard St E)",
    description:
      "Walkthrough of the 2026 Municipal Housing Policy scorecard and East End Community Land Trust acquisition targets.",
    hostLabel: "More Neighbours Metro",
    color: "blue",
    rsvpCount: 164,
  },
  {
    id: "evt-canvass",
    title: "Riverdale & Blake-Jones Neighbor Canvass + Lawn Sign Run",
    dayOfMonth: 14,
    dateLabel: "Sat, Nov 14",
    timeLabel: "10:30 AM – 1:00 PM",
    locationName: "Withrow Park Clubhouse South (725 Logan Ave)",
    description:
      "Neighborhood door-knocking and volunteer lawn sign delivery run across M4K blocks.",
    hostLabel: "Maya Lin",
    color: "blue",
    rsvpCount: 94,
  },
  {
    id: "evt-safe-streets-audit",
    title: "Danforth & Logan School Zone Crosswalk Safety Walk",
    dayOfMonth: 15,
    dateLabel: "Sun, Nov 15",
    timeLabel: "2:00 PM – 3:30 PM",
    locationName: "Frankland Community School Yard",
    description:
      "Resident & parent audit of school zone intersections and proposed raised crosswalk locations.",
    hostLabel: "Safe Streets Coalition",
    color: "amber",
    rsvpCount: 128,
  },
  {
    id: "evt-election-day",
    title: "Official Municipal Election Day — Polling Hours",
    dayOfMonth: 21,
    dateLabel: "Sat, Nov 21",
    timeLabel: "10:00 AM – 8:00 PM",
    locationName: "Earl Grey Senior Public School (500 Strathcona Ave)",
    description:
      "Official Municipal Election Day for Ward 14. Polls are open from 10:00 AM to 8:00 PM EST.",
    hostLabel: "Official Election Day",
    color: "emerald",
    rsvpCount: 1240,
    isPollingEvent: true,
    isOfficialElectionDate: true,
  },
];

const ACTIVE_ELECTION_CARDS: Array<{
  id: string;
  title: string;
  jurisdiction: string;
  dateStatus: string;
  summaryHref: string;
  candidatesCount: number;
  endorsementBadge?: EndorsementBadge;
}> = [
  {
    id: "toronto_2026",
    title: "City of Toronto Election (2026)",
    jurisdiction: "Ward 14 • Toronto–Danforth",
    dateStatus: "Election Day: Nov 21, 2026",
    summaryHref: "/toronto_2026/summary",
    candidatesCount: 3,
    endorsementBadge: {
      label: "Endorses: Maya Lin",
      type: "candidate",
      color: "blue",
    },
  },
  {
    id: "ontario_2026",
    title: "Province of Ontario Election",
    jurisdiction: "Toronto–Danforth Provincial Riding",
    dateStatus: "Active Riding Summary",
    summaryHref: "/ontario_2026/summary",
    candidatesCount: 4,
    endorsementBadge: {
      label: "Endorses: More Neighbours Metro",
      type: "org",
      color: "blue",
    },
  },
  {
    id: "canada_2026",
    title: "Government of Canada Election",
    jurisdiction: "Toronto–Danforth Federal Riding",
    dateStatus: "Active Riding Summary",
    summaryHref: "/canada_2026/summary",
    candidatesCount: 4,
    endorsementBadge: {
      label: "Endorses: Green Renewal Network",
      type: "org",
      color: "emerald",
    },
  },
];

function EndorsementBadgePill({ badge }: { badge: EndorsementBadge }) {
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

export default function ElectionCenterScreen({
  compact = false,
}: {
  compact?: boolean;
}) {
  // Calendar defaults to "weekly", togglable to "monthly"
  const [calendarView, setCalendarView] = useState<"weekly" | "monthly">(
    "weekly"
  );
  // Selected calendar event for the accordion drilldown below the calendar
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    "evt-advance-poll"
  );
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Record<string, boolean>>(
    {
      "evt-debate": true,
      "evt-advance-poll": true,
      "evt-org-townhall": true,
      "evt-election-day": true,
    }
  );
  const [showNotificationSettings, setShowNotificationSettings] =
    useState<boolean>(false);

  // Followed Issues, Candidates, and Organisations state
  const [followedIssues, setFollowedIssues] = useState<Record<string, boolean>>(
    {
      "Housing & Gentle Density": true,
      "Transit & Complete Streets": true,
      "Parks & Community Safety": true,
      "Main Streets & Local Budget": false,
    }
  );
  const [followedCandidates, setFollowedCandidates] = useState<
    Record<string, boolean>
  >({
    "Maya Lin": true,
    "Priya Nair": true,
    "David Kowalski": false,
  });
  const [followedOrgs, setFollowedOrgs] = useState<Record<string, boolean>>({
    "More Neighbours Metro": true,
    "Safe Streets Coalition": true,
    "East End Tenants Union": false,
  });

  // Granular notification settings toggles
  const [notifSettings, setNotifSettings] = useState({
    candidateEvents: true,
    orgSlatesAndEvents: true,
    issuePolicyUpdates: true,
    globalPollReminders: true,
    emailDigest: false,
  });

  const toggleRsvp = (id: string) => {
    setRsvpedEventIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Weekly view days (Nov 9 - Nov 15, 2026)
  const weeklyDays = [
    { dayName: "Mon", dayNum: 9, label: "Nov 9" },
    { dayName: "Tue", dayNum: 10, label: "Nov 10" },
    { dayName: "Wed", dayNum: 11, label: "Nov 11" },
    { dayName: "Thu", dayNum: 12, label: "Nov 12" },
    { dayName: "Fri", dayNum: 13, label: "Nov 13" },
    { dayName: "Sat", dayNum: 14, label: "Nov 14" },
    { dayName: "Sun", dayNum: 15, label: "Nov 15" },
  ];

  // November 2026 has 30 days and starts on Sunday (Nov 1, 2026)
  const monthDays = Array.from({ length: 30 }, (_, i) => i + 1);

  const eventColorStyles = {
    emerald: "bg-emerald-50 text-emerald-950 border-emerald-300",
    blue: "bg-blue-50 text-blue-950 border-blue-300",
    amber: "bg-amber-50 text-amber-950 border-amber-300",
    purple: "bg-purple-50 text-purple-950 border-purple-300",
  };

  const eventDotStyles = {
    emerald: "bg-emerald-600",
    blue: "bg-blue-600",
    amber: "bg-amber-500",
    purple: "bg-purple-600",
  };

  return (
    <div className="bg-[#FAF8F5] text-slate-900 min-h-full font-sans selection:bg-blue-600 selection:text-white">
      {/* Top App Bar */}
      <header className="bg-white border-b border-slate-200/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            VS
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-slate-900 text-base">
              Vote Social
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Voter Dashboard
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {VOTER_CONTEXT.wardName} • {VOTER_CONTEXT.postalCode}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-950 px-3 py-1.5 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Election Day: Nov 21</span>
          </div>
        </div>
      </header>

      <div
        className={`max-w-[1360px] mx-auto ${
          compact ? "p-4" : "p-5 lg:p-7"
        } space-y-6`}
      >
        {/* =====================================================================
            TOP ROW: YOUR ACTIVE ELECTIONS
            - Cards linking to each election's summary page with Endorses badge
           ===================================================================== */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Ballots for {VOTER_CONTEXT.postalCode}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Your Active Elections
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACTIVE_ELECTION_CARDS.map((election) => (
              <Link
                key={election.id}
                href={election.summaryHref}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/20 transition group bg-slate-50/60 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {election.title}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium">
                      {election.jurisdiction}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 shrink-0 group-hover:translate-x-0.5 transition">
                    <span>Summary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                  {election.endorsementBadge ? (
                    <EndorsementBadgePill badge={election.endorsementBadge} />
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No endorsement badge selected
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-500">
                    {election.dateStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================================
            SECTION 2: ELECTION CALENDAR (DEFAULTS TO WEEKLY, TOGGLABLE TO MONTHLY)
            - Shows campaign events from followed candidates & organisations
            - Shows public events (Early Polls, Official Election Day) in green
           ===================================================================== */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Personalized Civic Schedule • November 2026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Election Calendar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Campaign events from your followed candidates & organizations alongside public election dates.
              </p>
            </div>

            {/* Weekly / Monthly Toggle */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCalendarView("weekly")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    calendarView === "weekly"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Weekly View
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarView("monthly")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    calendarView === "monthly"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monthly View
                </button>
              </div>
            </div>
          </div>

          {calendarView === "weekly" ? (
            /* 7-Day Weekly Strip (Default View — Click any event to open drilldown accordion below) */
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {weeklyDays.map((day) => {
                const dayEvents = DASHBOARD_EVENTS.filter(
                  (e) =>
                    e.dayOfMonth === day.dayNum ||
                    (e.id === "evt-advance-poll" &&
                      day.dayNum >= 12 &&
                      day.dayNum <= 15)
                );
                return (
                  <div
                    key={day.dayNum}
                    className={`rounded-xl border p-3 flex flex-col justify-between min-h-[136px] ${
                      dayEvents.length > 0
                        ? "bg-white border-slate-300 shadow-2xs"
                        : "bg-slate-50/70 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                      <span className="text-xs font-bold text-slate-600 uppercase">
                        {day.dayName}
                      </span>
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-900">
                        {day.label}
                      </span>
                    </div>

                    {dayEvents.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic my-auto">
                        No scheduled events
                      </span>
                    ) : (
                      <div className="space-y-1.5">
                        {dayEvents.map((evt) => {
                          const isSelected = selectedEventId === evt.id;
                          return (
                            <button
                              key={`${day.dayNum}-${evt.id}`}
                              type="button"
                              onClick={() =>
                                setSelectedEventId((prev) =>
                                  prev === evt.id ? null : evt.id
                                )
                              }
                              className={`w-full text-left p-1.5 rounded-lg border text-[10px] leading-tight transition cursor-pointer ${
                                eventColorStyles[evt.color]
                              } ${
                                isSelected
                                  ? "ring-2 ring-slate-900 shadow-xs"
                                  : "hover:brightness-95"
                              }`}
                            >
                              <div className="font-semibold flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1 truncate">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      eventDotStyles[evt.color]
                                    }`}
                                  />
                                  <span className="truncate">{evt.hostLabel}</span>
                                </span>
                                {isSelected ? (
                                  <ChevronUp className="w-3 h-3 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
                                )}
                              </div>
                              <div className="font-bold text-slate-900 mt-0.5 line-clamp-2">
                                {evt.title}
                              </div>
                              <div className="font-mono text-[9px] opacity-80 mt-0.5">
                                {evt.timeLabel}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Monthly View (November 2026 Grid) */
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-mono font-bold uppercase text-slate-500 pb-1">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {monthDays.map((dayNum) => {
                  const eventsForDay = DASHBOARD_EVENTS.filter(
                    (e) =>
                      e.dayOfMonth === dayNum ||
                      (e.id === "evt-advance-poll" &&
                        dayNum >= 12 &&
                        dayNum <= 15)
                  );
                  const isElectionDay = dayNum === 21;

                  return (
                    <div
                      key={dayNum}
                      className={`min-h-[84px] p-2 rounded-xl border text-left flex flex-col justify-between ${
                        isElectionDay
                          ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30"
                          : eventsForDay.length > 0
                          ? "bg-white border-slate-300"
                          : "bg-slate-50/60 border-slate-200/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isElectionDay
                              ? "text-white bg-emerald-700 px-1.5 py-0.2 rounded"
                              : "text-slate-700"
                          }`}
                        >
                          {dayNum}
                        </span>
                        {isElectionDay && (
                          <span className="text-[9px] font-mono font-bold uppercase text-emerald-800">
                            Election Day
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        {eventsForDay.map((evt) => {
                          const isSelected = selectedEventId === evt.id;
                          return (
                            <button
                              key={`${dayNum}-${evt.id}`}
                              type="button"
                              onClick={() =>
                                setSelectedEventId((prev) =>
                                  prev === evt.id ? null : evt.id
                                )
                              }
                              className={`w-full text-left px-1.5 py-0.5 rounded text-[9px] font-semibold truncate border transition cursor-pointer ${
                                eventColorStyles[evt.color]
                              } ${
                                isSelected
                                  ? "ring-2 ring-slate-900"
                                  : "hover:brightness-95"
                              }`}
                              title={`${evt.hostLabel}: ${evt.title}`}
                            >
                              {evt.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =====================================================================
              ACCORDION DRILLDOWN BELOW THE CALENDAR
              - Opens when any event on the calendar is selected
              - Renders Voter Polling Location Card when a polling date card is selected
              - Renders Event Details Card when a candidate/org event card is selected
             ===================================================================== */}
          {selectedEventId &&
            (() => {
              const selectedEvt = DASHBOARD_EVENTS.find(
                (e) => e.id === selectedEventId
              );
              if (!selectedEvt) return null;
              const isRsvped = rsvpedEventIds[selectedEvt.id] ?? false;

              return (
                <div className="pt-4 border-t border-slate-200/90">
                  <div className="rounded-2xl border border-slate-300 bg-slate-50/80 p-4 sm:p-5 space-y-4 shadow-xs">
                    {/* Accordion Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            eventColorStyles[selectedEvt.color]
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              eventDotStyles[selectedEvt.color]
                            }`}
                          />
                          {selectedEvt.hostLabel}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {selectedEvt.title}
                        </h3>
                        <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                          {selectedEvt.dateLabel} • {selectedEvt.timeLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRsvp(selectedEvt.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isRsvped
                              ? "bg-emerald-700 text-white"
                              : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          {isRsvped ? "✓ In My Calendar" : "+ Add to Calendar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedEventId(null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                        >
                          <span>Close</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {selectedEvt.isPollingEvent ? (
                      /* POLLING DATE DRILLDOWN: Voter Polling Location Card & Voter ID Requirements */
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        {/* Left 6 Cols: Interactive Neighborhood Polling Map SVG */}
                        <div className="lg:col-span-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                              <Compass className="w-4 h-4" />
                              <span>
                                Assigned Polling Location •{" "}
                                {POLLING_STATION_INFO.subdivision}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                              {POLLING_STATION_INFO.distanceWalk}
                            </span>
                          </div>

                          <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-[#EEF2F6] h-60 shadow-inner">
                            <svg
                              viewBox="0 0 600 260"
                              className="w-full h-full object-cover"
                              aria-label="Polling Station Walking Route Map"
                            >
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

                              <rect
                                x="20"
                                y="20"
                                width="150"
                                height="85"
                                rx="8"
                                fill="#E2E8F0"
                              />
                              <rect
                                x="190"
                                y="20"
                                width="170"
                                height="85"
                                rx="8"
                                fill="#E2E8F0"
                              />
                              <rect
                                x="20"
                                y="130"
                                width="150"
                                height="110"
                                rx="8"
                                fill="#E2E8F0"
                              />
                              <rect
                                x="190"
                                y="130"
                                width="170"
                                height="110"
                                rx="8"
                                fill="#E2E8F0"
                              />
                              <rect
                                x="380"
                                y="135"
                                width="190"
                                height="105"
                                rx="8"
                                fill="#E2E8F0"
                              />

                              <line
                                x1="0"
                                y1="18"
                                x2="600"
                                y2="18"
                                stroke="#CBD5E1"
                                strokeWidth="12"
                              />
                              <line
                                x1="0"
                                y1="118"
                                x2="600"
                                y2="118"
                                stroke="#FFFFFF"
                                strokeWidth="12"
                              />
                              <line
                                x1="180"
                                y1="0"
                                x2="180"
                                y2="260"
                                stroke="#FFFFFF"
                                strokeWidth="12"
                              />
                              <line
                                x1="370"
                                y1="0"
                                x2="370"
                                y2="260"
                                stroke="#FFFFFF"
                                strokeWidth="12"
                              />

                              <text
                                x="275"
                                y="122"
                                textAnchor="middle"
                                className="fill-slate-500 text-[10px] font-mono font-bold"
                              >
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

                              <path
                                d="M 180 195 L 180 118 L 310 118"
                                fill="none"
                                stroke="#1D4ED8"
                                strokeWidth="4"
                                strokeDasharray="7 5"
                                strokeLinecap="round"
                              />

                              <circle
                                cx="180"
                                cy="195"
                                r="9"
                                fill="#0F172A"
                                stroke="#FFFFFF"
                                strokeWidth="3"
                              />
                              <rect
                                x="62"
                                y="180"
                                width="106"
                                height="28"
                                rx="6"
                                fill="#0F172A"
                              />
                              <text
                                x="115"
                                y="198"
                                textAnchor="middle"
                                className="fill-white text-[10px] font-bold"
                              >
                                Home • M4K 1N2
                              </text>

                              <circle
                                cx="310"
                                cy="118"
                                r="12"
                                fill="#047857"
                                stroke="#FFFFFF"
                                strokeWidth="3"
                              />
                              <rect
                                x="215"
                                y="64"
                                width="195"
                                height="38"
                                rx="8"
                                fill="#047857"
                              />
                              <text
                                x="312"
                                y="81"
                                textAnchor="middle"
                                className="fill-white text-[11px] font-bold"
                              >
                                VOTE HERE: Earl Grey Sr. PS
                              </text>
                              <text
                                x="312"
                                y="95"
                                textAnchor="middle"
                                className="fill-emerald-100 text-[9px] font-mono"
                              >
                                500 Strathcona Ave • 6 min walk
                              </text>
                            </svg>

                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs flex items-center gap-2">
                              <Navigation className="w-3.5 h-3.5 text-blue-700" />
                              <span>
                                Turn-by-Turn Walking & Transit Directions
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right 6 Cols: Polling Station Details, Hours & Required ID */}
                        <div className="lg:col-span-6 space-y-3.5">
                          <div className="p-4 rounded-xl bg-white border border-slate-200/90">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-mono font-bold text-emerald-800 uppercase">
                                {selectedEvt.locationName}
                              </span>
                              <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {POLLING_STATION_INFO.waitEstimate}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900">
                              {POLLING_STATION_INFO.stationName}
                            </h4>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {POLLING_STATION_INFO.address} —{" "}
                              {POLLING_STATION_INFO.entranceNote}
                            </p>

                            <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                                  Polling Hours
                                </span>
                                <span className="font-bold text-slate-900">
                                  {selectedEvt.dateLabel} •{" "}
                                  {selectedEvt.timeLabel}
                                </span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                                  Accessibility & Support
                                </span>
                                <span className="font-bold text-emerald-800">
                                  ✓ Barrier-Free Ramp & Audio Pad
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">
                              <IdCard className="w-4 h-4 text-blue-700" />
                              <span>
                                Required Voter ID & Address Verification
                              </span>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-700">
                              {POLLING_STATION_INFO.idRequirements.map(
                                (req) => (
                                  <li
                                    key={req}
                                    className="flex items-start gap-2"
                                  >
                                    <Check className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                                    <span>{req}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* CAMPAIGN / ORG EVENT DRILLDOWN */
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200/90">
                        <div className="md:col-span-8 space-y-1.5">
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {selectedEvt.description}
                          </p>
                          <p className="text-xs font-semibold text-slate-800 pt-1">
                            📍 Location:{" "}
                            <span className="font-normal text-slate-600">
                              {selectedEvt.locationName}
                            </span>
                          </p>
                        </div>
                        <div className="md:col-span-4 flex md:justify-end">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-blue-700 shrink-0" />
                            <div>
                              <span className="font-mono font-bold text-slate-900 block">
                                {selectedEvt.rsvpCount + (isRsvped ? 1 : 0)}{" "}
                                Ward Voters Attending
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Verified neighbors RSVP’d
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
        </section>

        {/* =====================================================================
            SECTION 3: FOLLOWED ISSUES, CANDIDATES & ORGANISATIONS + NOTIFICATION SETTINGS
           ===================================================================== */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Personalized Feed & Calendar Subscriptions</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Followed Issues, Candidates & Organizations
                </h2>
                <p className="text-xs text-slate-500">
                  Events and updates from items you follow populate your Election Calendar and Summary Feed.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowNotificationSettings((prev) => !prev)
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  showNotificationSettings
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-800 border-slate-300 hover:border-blue-500 hover:text-blue-700"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Notification Settings</span>
              </button>
            </div>

            {/* Granular Notification Settings Drawer (Toggled by Notification Settings Link) */}
            {showNotificationSettings && (
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Granular Notification Settings
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotificationSettings(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    {
                      key: "candidateEvents" as const,
                      label: "Followed Candidate Campaign Events & Debates",
                    },
                    {
                      key: "orgSlatesAndEvents" as const,
                      label: "Followed Organization Voter Guides & Town Halls",
                    },
                    {
                      key: "issuePolicyUpdates" as const,
                      label: "New Policies & Official Q&A on Followed Issues",
                    },
                    {
                      key: "globalPollReminders" as const,
                      label: "Global Election Alerts (Early Polls & Election Day)",
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-800/90 border border-slate-700 cursor-pointer"
                    >
                      <span className="text-slate-200 font-medium">
                        {item.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={notifSettings[item.key]}
                        onChange={() =>
                          setNotifSettings((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 3 Columns: Issues, Candidates, Organizations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Followed Issues */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    Issues
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {Object.values(followedIssues).filter(Boolean).length} Following
                  </span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(followedIssues).map(([issue, isFollowing]) => (
                    <button
                      key={issue}
                      type="button"
                      onClick={() =>
                        setFollowedIssues((prev) => ({
                          ...prev,
                          [issue]: !prev[issue],
                        }))
                      }
                      className={`w-full p-2 rounded-lg text-left text-xs font-semibold border flex items-center justify-between gap-2 transition cursor-pointer ${
                        isFollowing
                          ? "bg-white text-slate-900 border-blue-300 shadow-2xs"
                          : "bg-slate-100/70 text-slate-500 border-slate-200"
                      }`}
                    >
                      <span className="truncate">{issue}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          isFollowing
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isFollowing ? "Following" : "+ Follow"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: Followed Candidates */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-700" />
                    Candidates
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {Object.values(followedCandidates).filter(Boolean).length} Following
                  </span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(followedCandidates).map(
                    ([candName, isFollowing]) => (
                      <button
                        key={candName}
                        type="button"
                        onClick={() =>
                          setFollowedCandidates((prev) => ({
                            ...prev,
                            [candName]: !prev[candName],
                          }))
                        }
                        className={`w-full p-2 rounded-lg text-left text-xs font-semibold border flex items-center justify-between gap-2 transition cursor-pointer ${
                          isFollowing
                            ? "bg-white text-slate-900 border-blue-300 shadow-2xs"
                            : "bg-slate-100/70 text-slate-500 border-slate-200"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1 truncate">
                          <span className="truncate">{candName}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            isFollowing
                              ? "bg-blue-50 text-blue-700 font-bold"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isFollowing ? "Following" : "+ Follow"}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Column 3: Followed Organizations */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    Organizations
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {Object.values(followedOrgs).filter(Boolean).length} Following
                  </span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(followedOrgs).map(([orgName, isFollowing]) => (
                    <button
                      key={orgName}
                      type="button"
                      onClick={() =>
                        setFollowedOrgs((prev) => ({
                          ...prev,
                          [orgName]: !prev[orgName],
                        }))
                      }
                      className={`w-full p-2 rounded-lg text-left text-xs font-semibold border flex items-center justify-between gap-2 transition cursor-pointer ${
                        isFollowing
                          ? "bg-white text-slate-900 border-emerald-300 shadow-2xs"
                          : "bg-slate-100/70 text-slate-500 border-slate-200"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1 truncate">
                        <span className="truncate">{orgName}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          isFollowing
                            ? "bg-emerald-50 text-emerald-800 font-bold"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isFollowing ? "Following" : "+ Follow"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
      </div>
    </div>
  );
}
