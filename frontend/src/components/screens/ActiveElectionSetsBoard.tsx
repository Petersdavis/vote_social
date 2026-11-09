"use client";

import React, { useEffect, useState } from "react";
import { MapPin, RefreshCw, Users } from "lucide-react";
import {
  fetchActiveElectionSets,
  type ActiveElectionSetCounter,
} from "@/lib/leaderboard";
import type { GovernanceTierSlug } from "@/lib/opennorth";

interface ActiveElectionSetsBoardProps {
  /** Optional list of ElectionSet IDs belonging to the current user to highlight */
  highlightIds?: string[];
  compact?: boolean;
}

const TIER_BADGE_STYLES: Record<
  GovernanceTierSlug,
  { label: string; className: string }
> = {
  municipal: {
    label: "Municipal",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  provincial: {
    label: "Provincial",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  federal: {
    label: "Federal",
    className: "bg-purple-50 text-purple-800 border-purple-200",
  },
};

export default function ActiveElectionSetsBoard({
  highlightIds = [],
  compact = false,
}: ActiveElectionSetsBoardProps) {
  const [sets, setSets] = useState<ActiveElectionSetCounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<GovernanceTierSlug>("municipal");

  async function loadSets() {
    setLoading(true);
    try {
      const active = await fetchActiveElectionSets();
      setSets(active);
    } catch (error) {
      console.error("Failed to fetch active election sets", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSets();
  }, []);

  const filtered = sets.filter((s) => s.tier === tierFilter);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold">
            Community Waitlist
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Leaderboard
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {(["municipal", "provincial", "federal"] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setTierFilter(tier)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                tierFilter === tier
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tier}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void loadSets()}
            title="Refresh counts"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Loading active electoral districts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-6 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
          No electoral districts with pending waitlist users in this view yet. Complete your profile with a Canadian postal code to initialize your local districts!
        </div>
      ) : (
        <div
          className={`divide-y divide-slate-100 ${
            compact ? "max-h-64 overflow-y-auto" : ""
          }`}
        >
          {filtered.map((item) => {
            const isHighlighted = highlightIds.includes(item.id);
            const badge = TIER_BADGE_STYLES[item.tier] ?? TIER_BADGE_STYLES.municipal;

            return (
              <div
                key={item.id}
                className={`py-2.5 px-3 flex items-center justify-between gap-3 rounded-lg ${
                  isHighlighted ? "bg-blue-50/70" : ""
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-xs font-mono font-bold text-slate-400">
                    #{item.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      {isHighlighted && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-700 text-white">
                          Your District
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {item.boundary_set_name}
                        {item.city
                          ? ` • ${item.city}${item.province ? `, ${item.province}` : ""}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 font-mono text-xs font-bold shrink-0">
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                  <span>{item.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
