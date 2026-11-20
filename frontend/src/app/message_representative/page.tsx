"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Code2,
  Copy,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import ContactRepresentativeWidget, {
  renderSafeTextWithLinks,
} from "@/components/comms/ContactRepresentativeWidget";
import {
  subscribeToRecentPublicComms,
  unsubscribeRepresentativeViaLink,
  type PublicCommsPost,
} from "@/lib/message_representative";
import type { GovernanceTierSlug } from "@/lib/opennorth";

export default function CommsPage() {
  return (
    <Suspense fallback={null}>
      <CommsFeatureView />
    </Suspense>
  );
}

const VALID_TIERS = new Set<GovernanceTierSlug>([
  "municipal",
  "regional",
  "provincial",
  "federal",
]);

function CommsFeatureView() {
  const searchParams = useSearchParams();

  // Optional unsubscribe query parameters (when a representative clicks Unsubscribe in SES email)
  const unsubRepId = searchParams.get("unsubscribe_rep") ?? "";
  const unsubEmail = searchParams.get("email") ?? "";
  const unsubName = searchParams.get("name") ?? "";
  const unsubSig = searchParams.get("sig") ?? "";

  // Optional campaign query parameters
  const rawQueryTier = (searchParams.get("tier") ?? "").trim().toLowerCase();
  const queryTier = VALID_TIERS.has(rawQueryTier as GovernanceTierSlug)
    ? (rawQueryTier as GovernanceTierSlug)
    : null;
  const querySubject = searchParams.get("subject") ?? "";
  const queryBody = searchParams.get("body") ?? "";
  const queryPostcode = searchParams.get("postcode") ?? "";

  const [unsubStatus, setUnsubStatus] = useState<
    "idle" | "processing" | "done" | "error"
  >("idle");
  const [unsubError, setUnsubError] = useState<string | null>(null);

  // Public constituent messages feed
  const [publicComms, setPublicComms] = useState<PublicCommsPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Embed Code Generator state
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedTab, setEmbedTab] = useState<"html" | "npm">("html");
  const [embedTier, setEmbedTier] = useState<"" | GovernanceTierSlug>("");
  const [embedSubject, setEmbedSubject] = useState("");
  const [embedBody, setEmbedBody] = useState("");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

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

  // Build dynamic embed URL & snippets
  const embedParams = new URLSearchParams();
  if (embedTier) embedParams.set("tier", embedTier);
  if (embedSubject.trim()) embedParams.set("subject", embedSubject.trim());
  if (embedBody.trim()) embedParams.set("body", embedBody.trim());
  const embedQuery = embedParams.toString();
  const iframeSrc = `https://vote-social.ca/embed/contact-rep/${
    embedQuery ? `?${embedQuery}` : ""
  }`;

  const htmlEmbedSnippet = `<!-- Vote Social: Contact Your Representative Widget -->
<div class="vote-social-embed" style="max-width:640px;margin:0 auto;">
  <iframe
    src="${iframeSrc}"
    title="Contact Your Elected Representative — Vote Social"
    loading="lazy"
    style="width:100%;border:0;overflow:hidden;min-height:430px;"
  ></iframe>
</div>
<script async src="https://vote-social.ca/embed.js"></script>`;

  const npmEmbedSnippet = `// 1. Install the package:
// npm install @vote-social/contact-rep

import { VoteSocialContactRep } from "@vote-social/contact-rep";

export default function CampaignActionSection() {
  return (
    <VoteSocialContactRep${embedTier ? `\n      tier="${embedTier}"` : ""}${
    embedSubject.trim()
      ? `\n      defaultSubject=${JSON.stringify(embedSubject.trim())}`
      : ""
  }${
    embedBody.trim()
      ? `\n      defaultBody=${JSON.stringify(embedBody.trim())}`
      : ""
  }
    />
  );
}`;

  const activeSnippet = embedTab === "html" ? htmlEmbedSnippet : npmEmbedSnippet;

  async function handleCopySnippet() {
    try {
      await navigator.clipboard.writeText(activeSnippet);
      setCopiedSnippet(true);
      window.setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  }

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

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setEmbedOpen((open) => !open)}
              className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Embed Widget</span>
            </button>
            <Link
              href="/blog/"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition"
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

        {/* ==================== 3-SLIDE CONSTITUENT COMMS WIDGET ==================== */}
        <ContactRepresentativeWidget
          defaultTier={queryTier}
          defaultSubject={querySubject}
          defaultBody={queryBody}
          defaultPostcode={queryPostcode}
        />

        {/* ==================== EMBED WIDGET GENERATOR FOR ACTIVIST ORGS & DEVELOPERS ==================== */}
        <section className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold">
                  For Campaigns, Non-Profits &amp; Developers
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Embed This “Contact Your Representative” Widget
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEmbedOpen((open) => !open)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
            >
              {embedOpen ? "Hide Embed Code" : "Get Embed Code"}
            </button>
          </div>

          {embedOpen && (
            <div className="pt-3 border-t border-slate-200/80 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Drop this widget onto any campaign page via an auto-resizing{" "}
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                  &lt;iframe&gt;
                </code>{" "}
                or install the{" "}
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                  @vote-social/contact-rep
                </code>{" "}
                React package.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="embed-tier-select"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Target Level of Government
                  </label>
                  <select
                    id="embed-tier-select"
                    value={embedTier}
                    onChange={(e) =>
                      setEmbedTier(e.target.value as "" | GovernanceTierSlug)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">All Levels (Constituent Chooses)</option>
                    <option value="federal">Federal MP Only</option>
                    <option value="provincial">
                      Provincial Riding (MPP / MLA) Only
                    </option>
                    <option value="regional">Regional Council Only</option>
                    <option value="municipal">
                      Municipal (Mayor &amp; Councillor) Only
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="embed-subject-input"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Pre-filled Campaign Subject (Optional)
                  </label>
                  <input
                    id="embed-subject-input"
                    type="text"
                    maxLength={120}
                    value={embedSubject}
                    onChange={(e) => setEmbedSubject(e.target.value)}
                    placeholder="e.g. Support Affordable Housing"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="embed-body-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Pre-filled Campaign Message Body (Optional)
                </label>
                <textarea
                  id="embed-body-input"
                  rows={3}
                  maxLength={1000}
                  value={embedBody}
                  onChange={(e) => setEmbedBody(e.target.value)}
                  placeholder="Optional template message that constituents can personalize before sending..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-y"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-lg bg-slate-200/80 p-1">
                  <button
                    type="button"
                    onClick={() => setEmbedTab("html")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      embedTab === "html"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    HTML / CMS Iframe
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmbedTab("npm")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      embedTab === "npm"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    React / NPM Package
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCopySnippet()}
                  className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                <code>{activeSnippet}</code>
              </pre>
            </div>
          )}
        </section>

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
