"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MailCheck, RefreshCw } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  getAuthErrorMessage,
  getVerificationResendCooldown,
  sendVerificationEmail,
  VerificationRateLimitError,
} from "@/lib/auth";

function toSeconds(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading, emailVerified, reloadUser } = useAuth();

  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace("/register");
      return;
    }
    if (emailVerified) {
      router.replace("/profile");
    }
  }, [loading, user, emailVerified, router]);

  useEffect(() => {
    if (user) {
      setCooldownMs(getVerificationResendCooldown(user));
    }
  }, [user]);

  useEffect(() => {
    if (cooldownMs <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldownMs((current) => Math.max(0, current - 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownMs]);

  const handleResend = useCallback(async () => {
    if (!user) {
      return;
    }
    setError(null);
    setStatus(null);
    setResending(true);
    try {
      await sendVerificationEmail(user);
      setCooldownMs(getVerificationResendCooldown(user));
      setStatus("Verification email sent. Check your inbox (and spam folder).");
    } catch (err) {
      if (err instanceof VerificationRateLimitError) {
        setCooldownMs(err.retryAfterMs);
        setError("Please wait before requesting another email.");
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setResending(false);
    }
  }, [user]);

  const handleCheckVerified = useCallback(async () => {
    setError(null);
    setStatus(null);
    setChecking(true);
    try {
      const refreshed = await reloadUser();
      if (refreshed?.emailVerified) {
        setStatus("Email verified! Continuing to profile setup…");
        router.replace("/profile");
      } else {
        setError(
          "We couldn't confirm verification yet. Click the link in your email, then try again.",
        );
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setChecking(false);
    }
  }, [reloadUser, router]);

  if (loading || !user || emailVerified) {
    return null;
  }

  const cooldownSeconds = toSeconds(cooldownMs);
  const resendDisabled = resending || cooldownSeconds > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-4">
        <MailCheck className="w-6 h-6" />
      </div>

      <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
        Step 2 of 3 • Email Verification
      </span>
      <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
        Verify your email address
      </h1>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
        We sent a verification link to{" "}
        <strong className="text-slate-900">{user.email}</strong>. Click the link in
        your inbox, and this page will automatically advance to your profile setup.
      </p>

      {status ? (
        <div
          role="status"
          className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold"
        >
          {status}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleCheckVerified}
          disabled={checking}
          className="w-full py-3 px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
        >
          <span>{checking ? "Checking verification…" : "I've verified my email"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs inline-flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>
            {resending
              ? "Sending…"
              : cooldownSeconds > 0
              ? `Resend available in ${cooldownSeconds}s`
              : "Resend verification email"}
          </span>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Waiting for the email to arrive?</span>
        <Link href="/profile" className="font-bold text-blue-700 hover:underline">
          Continue to Profile Setup →
        </Link>
      </div>
    </div>
  );
}
