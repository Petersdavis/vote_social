"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Camera, EyeOff, Home, Layers } from "lucide-react";

export default function ScreenshotToolbar({
  activeScreen,
}: {
  activeScreen: 1 | 2 | 3;
}) {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        className="fixed bottom-3 right-3 z-50 px-2.5 py-1.5 rounded-full bg-slate-900/20 hover:bg-slate-900 text-white text-[11px] font-mono transition opacity-30 hover:opacity-100"
        title="Show Screen Switcher"
      >
        Show Controls
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-2xl px-3.5 py-2.5 shadow-xl flex flex-wrap items-center gap-2 text-xs">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Waitlist Page</span>
      </Link>

      <div className="h-4 w-px bg-slate-700" />

      <span className="text-[11px] font-mono text-slate-400 inline-flex items-center gap-1">
        <Camera className="w-3.5 h-3.5 text-emerald-400" />
        <span>Screens:</span>
      </span>

      <Link
        href="/screens/community-feed"
        className={`px-2.5 py-1.5 rounded-xl font-semibold transition ${
          activeScreen === 1
            ? "bg-blue-600 text-white"
            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
        }`}
      >
        1. Community Feed
      </Link>
      <Link
        href="/screens/candidate-hub"
        className={`px-2.5 py-1.5 rounded-xl font-semibold transition ${
          activeScreen === 2
            ? "bg-blue-600 text-white"
            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
        }`}
      >
        2. Candidate Hub
      </Link>
      <Link
        href="/screens/election-center"
        className={`px-2.5 py-1.5 rounded-xl font-semibold transition ${
          activeScreen === 3
            ? "bg-blue-600 text-white"
            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
        }`}
      >
        3. Election Center
      </Link>

      <div className="h-4 w-px bg-slate-700" />

      <button
        type="button"
        onClick={() => setHidden(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition"
        title="Hide toolbar for clean full-window screenshot"
      >
        <EyeOff className="w-3.5 h-3.5" />
        <span>Clean Screenshot Mode</span>
      </button>
    </div>
  );
}
