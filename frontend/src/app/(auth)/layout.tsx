"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOutUser } from "@/lib/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const isProfileStep = pathname?.startsWith("/profile");
  const isAuthStep =
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/verify-email");

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-[#FAF8F5]/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-bold text-sm flex items-center justify-center shadow-xs group-hover:bg-blue-800 transition">
              VS
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Vote Social
              </span>
              <span className="hidden sm:inline-block ml-2.5 text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold">
                Early Access Waitlist
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            {user ? (
              <>
                <span className="hidden sm:inline text-slate-600 font-medium truncate max-w-[200px]">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition"
              >
                ← Back to Home
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Stepper Header */}
      <div className="w-full mx-auto px-4 pt-8 pb-12 flex-1">
        <div className="max-w-xl mx-auto mb-6 bg-white rounded-2xl border border-slate-200/90 px-4 py-3 shadow-2xs">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="truncate">1. Email Address</span>
            </div>

            <div
              className={`flex items-center gap-2 font-semibold ${
                isProfileStep
                  ? "text-emerald-700"
                  : isAuthStep
                  ? "text-blue-700"
                  : "text-slate-400"
              }`}
            >
              {isProfileStep ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
              )}
              <span className="truncate">2. Google / Auth</span>
            </div>

            <div
              className={`flex items-center gap-2 font-semibold ${
                profile?.profileComplete
                  ? "text-emerald-700"
                  : isProfileStep
                  ? "text-blue-700"
                  : "text-slate-400"
              }`}
            >
              {profile?.profileComplete ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isProfileStep
                      ? "bg-blue-700 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  3
                </span>
              )}
              <span className="truncate">3. Profile Setup</span>
            </div>
          </div>
        </div>

        <div
          className={
            isProfileStep ? "max-w-[1400px] mx-auto" : "max-w-xl mx-auto"
          }
        >
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Vote Social • Verified Civic Identity & Neighborhood Forums</span>
        </div>
      </footer>
    </div>
  );
}
