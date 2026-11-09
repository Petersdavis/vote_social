"use client";

import React, { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { getAuthErrorMessage, sendVerificationEmail, signUpWithEmail } from "@/lib/auth";
import { isValid, validateRegisterForm, type FieldErrors } from "@/lib/validation";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, emailVerified } = useAuth();

  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail((curr) => curr || initialEmail);
    }
  }, [initialEmail]);

  // Once authenticated: Google users (emailVerified=true) go directly to /profile;
  // password users go to /verify-email first.
  useEffect(() => {
    if (!loading && user) {
      if (emailVerified) {
        router.replace("/profile");
      } else {
        router.replace("/verify-email");
      }
    }
  }, [loading, user, emailVerified, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validation = validateRegisterForm({ email, password, confirmPassword });
    setErrors(validation);
    if (!isValid(validation)) {
      return;
    }

    setSubmitting(true);
    try {
      const credential = await signUpWithEmail(email.trim(), password);
      try {
        await sendVerificationEmail(credential.user);
      } catch (error) {
        console.error("Failed to send verification email", error);
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
          Step 2 of 3 • Authenticate Account
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Verify your identity to join the waitlist
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Continue instantly with Google{email ? ` (${email})` : ""}, or set a password below to verify via email.
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold"
        >
          {formError}
        </div>
      ) : null}

      {/* Primary Step 2 option: 1-click Google OAuth */}
      <div className="mb-6">
        <OAuthButtons
          loginHint={email}
          label={email ? `Continue with Google (${email})` : "Continue with Google"}
          onError={setFormError}
        />
      </div>

      <div className="relative flex py-2 items-center mb-6">
        <div className="flex-grow border-t border-slate-200" />
        <span className="flex-shrink mx-3 text-xs font-mono uppercase text-slate-400">
          or use email & password
        </span>
        <div className="flex-grow border-t border-slate-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          {errors.email ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          {errors.password ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
        >
          <span>{submitting ? "Creating account…" : "Continue with Email"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-600">
        Already registered?{" "}
        <Link
          href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
          className="font-bold text-blue-700 hover:underline"
        >
          Sign in to your account
        </Link>
      </p>
    </div>
  );
}
