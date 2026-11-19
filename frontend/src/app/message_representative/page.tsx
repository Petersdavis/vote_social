"use client";

import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import {
  resolveRepresentativesForTierSelection,
  sendConstituentCommsMessage,
  subscribeToRecentPublicComms,
  unsubscribeRepresentativeViaLink,
  type PublicCommsPost,
  type RecipientDeliveryOutcome,
  type ResolvedRepresentative,
} from "@/lib/message_representative";
import {
  fetchBoundariesForPostcode,
  isValidCanadianPostcode,
  normalizeCanadianPostcode,
  type GovernanceTierSlug,
  type PoliticalBoundaryOption,
  type PostcodeBoundaryResolution,
} from "@/lib/opennorth";
import {
  getSavedWaitlistProfile,
  saveLocalWaitlistProfile,
  saveWaitlistUserIdentity,
} from "@/lib/waitlist";

export default function CommsPage() {
  return (
    <Suspense fallback={null}>
      <CommsFeatureView />
    </Suspense>
  );
}

const TIER_LABELS: Record<GovernanceTierSlug, string> = {
  municipal: "Municipal / Local Ward",
  regional: "Regional Municipality",
  provincial: "Provincial Riding",
  federal: "Federal Riding",
};

const MAX_MESSAGE_BODY_LENGTH = 1000;

/**
 * Reject HTML tags, script injections, dangerous URI schemes (`javascript:`,
 * `data:`, `vbscript:`), HTML entity-encoded tags/schemes, and inline event
 * handlers while allowing plain text and standard `http://` / `https://` links.
 */
function containsXssVector(input: string): boolean {
  const htmlTagPattern = /<\/?[a-zA-Z!/?][^>]*>/;
  const dangerousSchemePattern = /\b(?:javascript|vbscript|data)\s*:/i;
  const eventHandlerPattern = /\bon[a-z]{2,}\s*=/i;
  const encodedEntityVectorPattern = /&(?:#x0*3c|#0*60|lt)\b/i;
  return (
    htmlTagPattern.test(input) ||
    dangerousSchemePattern.test(input) ||
    eventHandlerPattern.test(input) ||
    encodedEntityVectorPattern.test(input)
  );
}

/**
 * Safely auto-link standard `http://` and `https://` URLs inside plain text
 * without using `dangerouslySetInnerHTML`. All non-URL text remains pure
 * React text nodes, preventing any XSS execution.
 */
function renderSafeTextWithLinks(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, idx) => {
    if (/^https?:\/\//i.test(part)) {
      // Strip trailing sentence punctuation (.,!?;:)) from the clickable URL
      const trailingMatch = part.match(/^(.*?)([.,!?;:)]+)?$/);
      const cleanUrl = trailingMatch?.[1] ?? part;
      const trailingPunct = trailingMatch?.[2] ?? "";

      try {
        const parsed = new URL(cleanUrl);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return (
            <React.Fragment key={idx}>
              <a
                href={parsed.toString()}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-blue-700 hover:text-blue-900 underline break-all font-medium"
              >
                {cleanUrl}
              </a>
              {trailingPunct}
            </React.Fragment>
          );
        }
      } catch {
        // Fall through to plain text if invalid URL
      }
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function CommsDemoWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute top-3 right-3 z-20"
    >
      <div className="px-2.5 py-0.5 rounded-md bg-amber-100/90 border border-amber-300 text-amber-900 font-mono text-[10px] font-extrabold uppercase tracking-widest shadow-2xs">
        DEMO
      </div>
    </div>
  );
}

function CommsCardAttributionFooter() {
  return (
    <div className="pt-4 mt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
      <a
        href="https://opennorth.ca/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Powered by Open North"
        className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition group"
      >
        <span>Powered by</span>
        <img
          src="/assets/img/social/open_north.svg"
          alt="Open North"
          className="h-4 sm:h-4.5 w-auto opacity-85 group-hover:opacity-100 transition"
        />
      </a>

      <a
        href="https://vote-social.ca"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Vote Social — vote-social.ca"
        className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 hover:text-blue-700 transition group"
      >
        <img
          src="/assets/img/vote_social/icon.svg"
          alt="Vote Social VS Logo"
          className="w-6 h-6 rounded-md shadow-2xs group-hover:scale-105 transition"
        />
        <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-blue-700">
          vote-social.ca
        </span>
      </a>
    </div>
  );
}

function CommsFeatureView() {
  const searchParams = useSearchParams();

  // Optional unsubscribe query parameters (when a representative clicks Unsubscribe in SES email)
  const unsubRepId = searchParams.get("unsubscribe_rep") ?? "";
  const unsubEmail = searchParams.get("email") ?? "";
  const unsubName = searchParams.get("name") ?? "";
  const unsubSig = searchParams.get("sig") ?? "";

  const [unsubStatus, setUnsubStatus] = useState<
    "idle" | "processing" | "done" | "error"
  >("idle");
  const [unsubError, setUnsubError] = useState<string | null>(null);

  // 3-Slide Carousel State: 0 = Postal Code, 1 = Choose Political Region, 2 = Message Representative(s)
  const [activeSlide, setActiveSlide] = useState<0 | 1 | 2>(0);
  const [carouselHeight, setCarouselHeight] = useState<number | undefined>(
    undefined,
  );
  const slide0Ref = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);

  const [postcode, setPostcode] = useState("");
  const [boundaryResolution, setBoundaryResolution] =
    useState<PostcodeBoundaryResolution | null>(null);
  const [boundaryLoading, setBoundaryLoading] = useState(false);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);

  // Chosen political region & level from Slide 1
  const [chosenTier, setChosenTier] = useState<GovernanceTierSlug | null>(null);
  const [chosenBoundary, setChosenBoundary] =
    useState<PoliticalBoundaryOption | null>(null);
  const [loadingBoundaryUrl, setLoadingBoundaryUrl] = useState<string | null>(
    null,
  );

  // Resolved representatives for the single clicked political region
  const [representatives, setRepresentatives] = useState<
    ResolvedRepresentative[]
  >([]);
  const [selectedRepKeys, setSelectedRepKeys] = useState<
    Record<string, boolean>
  >({});

  // Message composer state
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deliveryOutcomes, setDeliveryOutcomes] = useState<
    RecipientDeliveryOutcome[] | null
  >(null);

  // Public constituent messages feed
  const [publicComms, setPublicComms] = useState<PublicCommsPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    const saved = getSavedWaitlistProfile();
    if (saved) {
      if (saved.postcode) setPostcode(saved.postcode);
      if (saved.uname) setSenderName(saved.uname);
      if (saved.email) setSenderEmail(saved.email);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeToRecentPublicComms({
      limitCount: 15,
      onUpdate: (posts) => {
        setPublicComms(posts);
        setLoadingFeed(false);
      },
      onError: () => {
        setLoadingFeed(false);
      },
    });
    return () => unsub();
  }, []);

  // Measure active carousel slide height dynamically so the viewport animates smoothly
  useEffect(() => {
    const activeEl =
      activeSlide === 0
        ? slide0Ref.current
        : activeSlide === 1
        ? slide1Ref.current
        : slide2Ref.current;
    if (!activeEl) return;

    const updateHeight = () => {
      setCarouselHeight(activeEl.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(activeEl);

    return () => {
      observer.disconnect();
    };
  }, [activeSlide, boundaryResolution, representatives, deliveryOutcomes, sendError]);

  async function handleUnsubscribeConfirm() {
    if (
      !unsubRepId ||
      !unsubEmail ||
      !unsubSig ||
      unsubStatus === "processing"
    ) {
      return;
    }
    setUnsubStatus("processing");
    setUnsubError(null);
    try {
      await unsubscribeRepresentativeViaLink({
        repId: unsubRepId,
        email: unsubEmail,
        name: unsubName || "Representative",
        sig: unsubSig,
      });
      setUnsubStatus("done");
    } catch (err) {
      setUnsubStatus("error");
      setUnsubError(
        err instanceof Error
          ? err.message
          : "Could not verify unsubscribe link. Please contact support.",
      );
    }
  }

  async function handlePostcodeSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBoundaryError(null);
    setDeliveryOutcomes(null);

    const trimmed = postcode.trim();
    if (!isValidCanadianPostcode(trimmed)) {
      setBoundaryError(
        "Please enter a valid 6-character Canadian postal code (e.g., M4K 1N2).",
      );
      return;
    }

    setBoundaryLoading(true);
    try {
      const clean = normalizeCanadianPostcode(trimmed);
      const res = await fetchBoundariesForPostcode(clean);
      setBoundaryResolution(res);
      setPostcode(res.formattedPostcode);

      const existing = getSavedWaitlistProfile();
      saveLocalWaitlistProfile({
        email: existing?.email ?? senderEmail,
        uname: existing?.uname ?? senderName,
        postcode: res.formattedPostcode,
        city: res.city,
        province: res.province,
        municipal_district: existing?.municipal_district ?? null,
        provincial_district: existing?.provincial_district ?? null,
        federal_district: existing?.federal_district ?? null,
        profileComplete: Boolean(existing?.profileComplete),
      });

      setActiveSlide(1);
    } catch (err) {
      setBoundaryError(
        err instanceof Error
          ? err.message
          : "Could not look up political districts for this postal code.",
      );
    } finally {
      setBoundaryLoading(false);
    }
  }

  async function handleSelectRegionAndProgress(
    tier: GovernanceTierSlug,
    boundary: PoliticalBoundaryOption,
  ) {
    if (!boundaryResolution || loadingBoundaryUrl) return;

    setBoundaryError(null);
    setDeliveryOutcomes(null);
    setSendError(null);
    setChosenTier(tier);
    setChosenBoundary(boundary);
    setLoadingBoundaryUrl(boundary.url);

    try {
      const resolved = await resolveRepresentativesForTierSelection({
        resolution: boundaryResolution,
        tier,
        boundary,
      });

      setRepresentatives(resolved);

      // Pre-select all active (non-unsubscribed) representatives for this region if <= 2, or the first active one
      const initialSelection: Record<string, boolean> = {};
      const activeReps = resolved.filter((r) => !r.unsubscribed);
      if (activeReps.length <= 2) {
        for (const r of activeReps) {
          initialSelection[repSelectionKey(r)] = true;
        }
      } else if (activeReps[0]) {
        initialSelection[repSelectionKey(activeReps[0])] = true;
      }
      setSelectedRepKeys(initialSelection);
      setActiveSlide(2);
    } catch (err) {
      setBoundaryError(
        err instanceof Error
          ? err.message
          : "Could not load representatives for this district.",
      );
    } finally {
      setLoadingBoundaryUrl(null);
    }
  }

  function repSelectionKey(rep: ResolvedRepresentative): string {
    return `${rep.repId}::${rep.boundary_url}`;
  }

  function toggleRepresentative(rep: ResolvedRepresentative) {
    const key = repSelectionKey(rep);
    setSelectedRepKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function handleSendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending || !boundaryResolution) return;

    setSendError(null);
    setDeliveryOutcomes(null);

    const chosenReps = representatives.filter(
      (r) => selectedRepKeys[repSelectionKey(r)],
    );
    if (chosenReps.length === 0) {
      setSendError(
        "Please select at least one representative above to receive your message.",
      );
      return;
    }

    const trimmedName = senderName.trim();
    const trimmedEmail = senderEmail.trim();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setSendError(
        "Please enter your name or username (at least 2 characters).",
      );
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setSendError("Please enter a valid email address.");
      return;
    }
    if (!trimmedSubject || trimmedSubject.length < 3) {
      setSendError("Please enter a subject line for your message.");
      return;
    }
    if (!trimmedBody || trimmedBody.length < 10) {
      setSendError("Please write a message of at least 10 characters.");
      return;
    }
    if (trimmedBody.length > MAX_MESSAGE_BODY_LENGTH) {
      setSendError(
        `Please keep your message under ${MAX_MESSAGE_BODY_LENGTH} characters.`,
      );
      return;
    }
    if (
      containsXssVector(trimmedName) ||
      containsXssVector(trimmedSubject) ||
      containsXssVector(trimmedBody)
    ) {
      setSendError(
        "HTML tags and script expressions are not allowed. Plain text and standard http:// or https:// links are supported.",
      );
      return;
    }

    setSending(true);
    try {
      await saveWaitlistUserIdentity({
        uname: trimmedName,
        email: trimmedEmail,
      });

      const response = await sendConstituentCommsMessage({
        senderName: trimmedName,
        senderEmail: trimmedEmail,
        postcode: boundaryResolution.formattedPostcode,
        subject: trimmedSubject,
        body: trimmedBody,
        visibility,
        recipients: chosenReps.map((r) => ({
          boundaryUrl: r.boundary_url,
          repName: r.name,
          electedOffice: r.elected_office,
        })),
      });

      setDeliveryOutcomes(response.results);

      const blockedIds = new Set(
        response.results
          .filter((o) => o.status === "blocked_unsubscribed")
          .map((o) => o.repId),
      );
      if (blockedIds.size > 0) {
        setRepresentatives((prev) =>
          prev.map((r) =>
            blockedIds.has(r.repId) ? { ...r, unsubscribed: true } : r,
          ),
        );
      }

      const anyDelivered = response.results.some(
        (o) => o.status !== "blocked_unsubscribed",
      );
      if (anyDelivered) {
        setSubject("");
        setBody("");
      }
    } catch (err) {
      setSendError(
        err instanceof Error
          ? err.message
          : "Could not send your message right now. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  const tierEntries: Array<{
    tier: GovernanceTierSlug;
    label: string;
    options: PoliticalBoundaryOption[];
  }> = boundaryResolution
    ? [
        {
          tier: "municipal" as const,
          label: TIER_LABELS.municipal,
          options: boundaryResolution.municipalOptions,
        },
        {
          tier: "regional" as const,
          label: TIER_LABELS.regional,
          options: boundaryResolution.regionalOptions,
        },
        {
          tier: "provincial" as const,
          label: TIER_LABELS.provincial,
          options: boundaryResolution.provincialOptions,
        },
        {
          tier: "federal" as const,
          label: TIER_LABELS.federal,
          options: boundaryResolution.federalOptions,
        },
      ].filter((entry) => entry.options.length > 0)
    : [];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-bold text-sm flex items-center justify-center shadow-xs group-hover:bg-blue-800 transition">
              VS
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Vote Social
              </span>
              <span className="hidden sm:inline-block ml-2.5 text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-semibold">
                Constituent Comms
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 text-xs">
            <Link
              href="/blog/"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition"
            >
              Dev Blog
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {/* Representative Unsubscribe Banner (when arriving via signed SES unsubscribe link) */}
        {unsubRepId && unsubEmail && unsubSig && (
          <section className="rounded-2xl bg-white border-2 border-amber-300 p-6 sm:p-8 shadow-md space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
                  Representative Notification Preferences
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  Opt out of constituent email notifications from vote-social.ca
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Confirming below will add{" "}
                  <strong className="text-slate-900">{unsubEmail}</strong> (
                  {unsubName || "Representative"}) to our blocklist. Constituents
                  in your district who attempt to message you on Vote Social will
                  be informed that you have rejected platform emails and will be
                  directed to email your office directly instead.
                </p>
              </div>
            </div>

            {unsubStatus === "done" ? (
              <div
                role="status"
                className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-semibold flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Confirmed. <strong>{unsubEmail}</strong> has been unsubscribed
                  and added to the Vote Social blocklist.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={unsubStatus === "processing"}
                  onClick={() => void handleUnsubscribeConfirm()}
                  className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {unsubStatus === "processing"
                    ? "Processing…"
                    : `Confirm Unsubscribe for ${unsubEmail}`}
                </button>
                {unsubError && (
                  <p role="alert" className="text-xs text-rose-600 font-semibold">
                    {unsubError}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ==================== 3-SLIDE CONSTITUENT COMMS CAROUSEL ==================== */}
        <div>
          {/* Carousel Top Pill Switcher */}
          <div
            role="group"
            aria-label="Constituent Comms Step Switcher"
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="inline-flex flex-wrap items-center justify-center rounded-full bg-slate-200/80 p-1 border border-slate-300/60 gap-1">
              <button
                type="button"
                aria-pressed={activeSlide === 0}
                onClick={() => setActiveSlide(0)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeSlide === 0
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                1 • Postal Code
              </button>
              <button
                type="button"
                disabled={!boundaryResolution}
                aria-pressed={activeSlide === 1}
                onClick={() => boundaryResolution && setActiveSlide(1)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                  activeSlide === 1
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                2 • Choose Region
              </button>
              <button
                type="button"
                disabled={!chosenBoundary}
                aria-pressed={activeSlide === 2}
                onClick={() => chosenBoundary && setActiveSlide(2)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                  activeSlide === 2
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                3 • Send Message
              </button>
            </div>
          </div>

          {/* Horizontal Sliding Carousel Viewport */}
          <div
            className="overflow-hidden transition-[height] duration-500 ease-in-out"
            style={
              carouselHeight !== undefined
                ? { height: `${carouselHeight}px` }
                : undefined
            }
          >
            <div
              className="flex items-start transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {/* ==================== SLIDE 0: POSTAL CODE ==================== */}
              <div
                ref={slide0Ref}
                aria-hidden={activeSlide !== 0}
                inert={activeSlide !== 0 ? true : undefined}
                className="w-full shrink-0 px-1 py-1"
              >
                <div className="relative overflow-hidden max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
                  <CommsDemoWatermark />
                  <div className="mb-5">
                    <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
                      Step 1 of 3 • Constituent Lookup
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      Message your elected representatives
                    </h1>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                      Enter your 6-character Canadian postal code to find your{" "}
                      <strong className="text-slate-800">
                        Municipal, Regional, Provincial, and Federal
                      </strong>{" "}
                      political regions.
                    </p>
                  </div>

                  <form
                    onSubmit={handlePostcodeSubmit}
                    noValidate
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="comms-postcode"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                      >
                        Canadian Postal Code *
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="comms-postcode"
                          type="text"
                          required
                          maxLength={7}
                          autoComplete="postal-code"
                          value={postcode}
                          onChange={(e) => {
                            setPostcode(e.target.value);
                            if (boundaryError) setBoundaryError(null);
                          }}
                          placeholder="M4K 1N2"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono uppercase text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                      {boundaryError && (
                        <p
                          role="alert"
                          className="mt-1.5 text-xs text-rose-600 font-semibold"
                        >
                          {boundaryError}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={boundaryLoading}
                      className="w-full py-3.5 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
                    >
                      {boundaryLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Resolving Political Regions…</span>
                        </>
                      ) : (
                        <>
                          <span>Find My Political Regions</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <CommsCardAttributionFooter />
                </div>
              </div>

              {/* ==================== SLIDE 1: CLICK A REGION TO PROGRESS ==================== */}
              <div
                ref={slide1Ref}
                aria-hidden={activeSlide !== 1}
                inert={activeSlide !== 1 ? true : undefined}
                className="w-full shrink-0 px-1 py-1"
              >
                <div className="relative overflow-hidden max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
                  <CommsDemoWatermark />
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pr-14">
                    <button
                      type="button"
                      onClick={() => setActiveSlide(0)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-blue-700" />
                      <span>Change Postal Code</span>
                    </button>

                    {boundaryResolution && (
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900">
                        {boundaryResolution.formattedPostcode}
                        {boundaryResolution.city
                          ? ` • ${boundaryResolution.city}${
                              boundaryResolution.province
                                ? `, ${boundaryResolution.province}`
                                : ""
                            }`
                          : ""}
                      </span>
                    )}
                  </div>

                  <div className="mb-5">
                    <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
                      Step 2 of 3 • Select Governance Level
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                      Click a political region to message
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Choose which level of government you want to contact to view
                      the representatives for that region.
                    </p>
                  </div>

                  {boundaryError && (
                    <div
                      role="alert"
                      className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold"
                    >
                      {boundaryError}
                    </div>
                  )}

                  <div className="space-y-3">
                    {tierEntries.map(({ tier, label, options }) => (
                      <div key={tier} className="space-y-2">
                        <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold">
                          {label}
                        </span>

                        <div
                          className={
                            options.length > 1
                              ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                              : "space-y-2"
                          }
                        >
                          {options.map((opt) => {
                            const isLoadingThis =
                              loadingBoundaryUrl === opt.url;
                            const isCurrentChosen =
                              chosenBoundary?.url === opt.url;

                            return (
                              <button
                                key={opt.url}
                                type="button"
                                disabled={Boolean(loadingBoundaryUrl)}
                                onClick={() =>
                                  void handleSelectRegionAndProgress(tier, opt)
                                }
                                className={`w-full p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 group disabled:opacity-60 ${
                                  isCurrentChosen
                                    ? "bg-blue-50/70 border-blue-600 text-slate-900"
                                    : "bg-slate-50/80 hover:bg-blue-50/50 border-slate-200/90 hover:border-blue-400 text-slate-900"
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-extrabold text-slate-900 group-hover:text-blue-800 transition">
                                    {opt.name}
                                  </div>
                                  {opt.boundary_set_name && (
                                    <div className="text-xs text-slate-600 mt-0.5">
                                      {opt.boundary_set_name}
                                    </div>
                                  )}
                                </div>

                                <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 group-hover:bg-blue-700 group-hover:border-blue-700 group-hover:text-white text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition shadow-2xs">
                                  {isLoadingThis ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Loading…</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Select</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <CommsCardAttributionFooter />
                </div>
              </div>

              {/* ==================== SLIDE 2: SINGLE UNIFIED CARD (REPS + COMPOSER) ==================== */}
              <div
                ref={slide2Ref}
                aria-hidden={activeSlide !== 2}
                inert={activeSlide !== 2 ? true : undefined}
                className="w-full shrink-0 px-1 py-1"
              >
                <div className="relative overflow-hidden max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-md space-y-5">
                  <CommsDemoWatermark />
                  {/* Top Bar: Back to Regions + Active Region Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 pr-14 border-b border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setActiveSlide(1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-blue-700" />
                      <span>Choose Another Region</span>
                    </button>

                    {chosenTier && chosenBoundary && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        <span>
                          {TIER_LABELS[chosenTier]} • {chosenBoundary.name}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Compact Representatives Selector for this Region */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Recipient Representative(s)
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Click to toggle recipient
                      </span>
                    </div>

                    {representatives.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                        No representatives with public email addresses were
                        returned for this district.
                      </div>
                    ) : (
                      <div
                        className={
                          representatives.length > 1
                            ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                            : "space-y-2"
                        }
                      >
                        {representatives.map((rep) => {
                          const key = repSelectionKey(rep);
                          const isSelected = Boolean(selectedRepKeys[key]);

                          return (
                            <div
                              key={key}
                              onClick={() => toggleRepresentative(rep)}
                              role="checkbox"
                              aria-checked={isSelected}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === " " || e.key === "Enter") {
                                  e.preventDefault();
                                  toggleRepresentative(rep);
                                }
                              }}
                              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                                rep.unsubscribed
                                  ? "bg-rose-50/40 border-rose-200"
                                  : isSelected
                                  ? "bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-2xs"
                                  : "bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-white"
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                    {rep.name}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800 text-[10px] font-bold">
                                    {rep.elected_office}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-600 truncate">
                                  {rep.district_name}
                                  {rep.party_name ? ` • ${rep.party_name}` : ""}
                                </div>

                                <div className="pt-0.5 flex items-center gap-1 text-[11px] font-mono text-blue-800 break-all">
                                  <Mail className="w-3 h-3 text-blue-700 shrink-0" />
                                  <span>{rep.email}</span>
                                </div>

                                {rep.unsubscribed && (
                                  <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>
                                      Rejected vote-social.ca emails —{" "}
                                      <a
                                        href={`mailto:${rep.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="underline font-bold"
                                      >
                                        email directly
                                      </a>
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected
                                    ? "bg-blue-700 border-blue-700 text-white"
                                    : "bg-white border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Delivery Outcomes / Unsubscribed Rep Rejection Banner */}
                  {deliveryOutcomes && (
                    <div className="space-y-2.5">
                      {deliveryOutcomes
                        .filter((o) => o.status === "blocked_unsubscribed")
                        .map((blocked) => (
                          <div
                            key={blocked.repId}
                            role="alert"
                            className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-1"
                          >
                            <div className="font-extrabold flex items-center gap-1.5 text-rose-900">
                              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                              <span>
                                {blocked.repName} ({blocked.electedOffice}) has
                                rejected emails from vote-social.ca
                              </span>
                            </div>
                            <p className="text-rose-900 leading-relaxed">
                              Please email them directly at{" "}
                              <a
                                href={`mailto:${blocked.officialEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                                className="font-mono font-bold underline"
                              >
                                {blocked.officialEmail}
                              </a>
                              .
                            </p>
                          </div>
                        ))}

                      {deliveryOutcomes
                        .filter((o) => o.status !== "blocked_unsubscribed")
                        .map((ok) => (
                          <div
                            key={ok.repId}
                            role="status"
                            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold">
                                Message recorded for {ok.repName} (
                                {ok.electedOffice} • {ok.districtName})
                              </div>
                              <p className="text-emerald-800 mt-0.5">
                                {ok.status === "notified_email_sent"
                                  ? `Notification sent to ${ok.officialEmail} to verify their email on vote-social.ca.`
                                  : `Added to ${ok.repName}'s constituent queue on Vote Social (max 1 email notification per day).`}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {sendError && (
                    <div
                      role="alert"
                      className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold"
                    >
                      {sendError}
                    </div>
                  )}

                  {/* Compact Message Composer Form Inside the Same Card */}
                  <form
                    onSubmit={handleSendMessage}
                    className="pt-3 border-t border-slate-200/80 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Your Message
                      </span>

                      {/* Public vs. Private Toggle */}
                      <div
                        role="group"
                        aria-label="Message visibility mode"
                        className="inline-flex rounded-lg bg-slate-200/80 p-1"
                      >
                        <button
                          type="button"
                          aria-pressed={visibility === "public"}
                          onClick={() => setVisibility("public")}
                          className={`px-3 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                            visibility === "public"
                              ? "bg-white text-blue-700 shadow-2xs"
                              : "text-slate-700 hover:text-slate-900"
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Public</span>
                        </button>
                        <button
                          type="button"
                          aria-pressed={visibility === "private"}
                          onClick={() => setVisibility("private")}
                          className={`px-3 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                            visibility === "private"
                              ? "bg-white text-emerald-700 shadow-2xs"
                              : "text-slate-700 hover:text-slate-900"
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Private</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="comms-sender-name"
                          className="sr-only"
                        >
                          Your Name or Username
                        </label>
                        <input
                          id="comms-sender-name"
                          type="text"
                          required
                          minLength={2}
                          maxLength={80}
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="Your name or @username"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="comms-sender-email"
                          className="sr-only"
                        >
                          Your Email Address
                        </label>
                        <input
                          id="comms-sender-email"
                          type="email"
                          required
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          placeholder="Your email (you@example.com)"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="comms-subject" className="sr-only">
                        Subject Line
                      </label>
                      <input
                        id="comms-subject"
                        type="text"
                        required
                        minLength={3}
                        maxLength={200}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject line..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="comms-body" className="sr-only">
                        Message Body
                      </label>
                      <textarea
                        id="comms-body"
                        rows={4}
                        required
                        minLength={10}
                        maxLength={MAX_MESSAGE_BODY_LENGTH}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your message to your selected representative(s)... (http:// and https:// links are auto-detected)"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white resize-y"
                      />
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Plain text &amp; https:// links only</span>
                        <span
                          className={
                            body.length >= MAX_MESSAGE_BODY_LENGTH
                              ? "text-rose-600 font-bold"
                              : ""
                          }
                        >
                          {body.length} / {MAX_MESSAGE_BODY_LENGTH}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-slate-600">
                        {visibility === "public"
                          ? "Visible on the public constituent board below (your email stays private)"
                          : "Private to your selected representative(s)"}
                      </span>

                      <button
                        type="submit"
                        disabled={sending}
                        className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                          visibility === "public"
                            ? "bg-blue-700 hover:bg-blue-800"
                            : "bg-emerald-700 hover:bg-emerald-800"
                        }`}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending…</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {visibility === "public"
                                ? "Send Public Letter"
                                : "Send Private Message"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <CommsCardAttributionFooter />
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Step 1: Postal Code"
              aria-pressed={activeSlide === 0}
              onClick={() => setActiveSlide(0)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                activeSlide === 0
                  ? "w-7 bg-blue-700"
                  : "w-2.5 bg-slate-400 hover:bg-slate-500"
              }`}
            />
            <button
              type="button"
              disabled={!boundaryResolution}
              aria-label="Step 2: Choose Political Region"
              aria-pressed={activeSlide === 1}
              onClick={() => boundaryResolution && setActiveSlide(1)}
              className={`h-2.5 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeSlide === 1
                  ? "w-7 bg-blue-700"
                  : "w-2.5 bg-slate-400 hover:bg-slate-500"
              }`}
            />
            <button
              type="button"
              disabled={!chosenBoundary}
              aria-label="Step 3: Send Message"
              aria-pressed={activeSlide === 2}
              onClick={() => chosenBoundary && setActiveSlide(2)}
              className={`h-2.5 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeSlide === 2
                  ? "w-7 bg-blue-700"
                  : "w-2.5 bg-slate-400 hover:bg-slate-500"
              }`}
            />
          </div>
        </div>

        {/* ==================== RECENT PUBLIC CONSTITUENT LETTERS ==================== */}
        <section className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold">
                Public Constituent Feed
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                Recent Open Letters to Representatives
              </h2>
            </div>
          </div>

          {loadingFeed ? (
            <div className="py-8 text-center text-xs text-slate-600">
              Loading recent constituent letters…
            </div>
          ) : publicComms.length === 0 ? (
            <div className="py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-600">
              No public constituent letters yet. Enter your postal code above to
              send the first open letter in your riding!
            </div>
          ) : (
            <div className="space-y-3">
              {publicComms.map((item) => (
                <article
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        To: {item.repName} ({item.electedOffice})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-mono text-[11px]">
                        {item.districtName}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600">
                      From @{item.senderName} ({item.postcode})
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {item.subject}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {renderSafeTextWithLinks(item.body)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-600">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Vote Social • Constituent Communications &amp; Verified Civic Identity
          </span>
        </div>
      </footer>
    </div>
  );
}
