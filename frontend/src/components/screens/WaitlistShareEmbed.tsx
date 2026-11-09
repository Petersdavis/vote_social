"use client";

import React, { useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

interface WaitlistShareEmbedProps {
  /** User's confirmed local district or city name, e.g. "Ward 10" or "Kitchener" */
  communityLabel?: string | null;
  /** Optional postal code or district slug for referral attribution */
  referralSlug?: string | null;
}

export default function WaitlistShareEmbed({
  communityLabel,
  referralSlug,
}: WaitlistShareEmbedProps) {
  const [origin, setOrigin] = useState("https://vote-social-pdavis.web.app");
  const [hostname, setHostname] = useState("vote-social-pdavis.web.app");
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamically grab hostname and origin from window.location on the client
  useEffect(() => {
    if (typeof window !== "undefined" && window.location) {
      setOrigin(window.location.origin);
      setHostname(window.location.host || window.location.hostname);
    }
  }, []);

  const shareUrl = referralSlug
    ? `${origin}/?ref=${encodeURIComponent(referralSlug)}`
    : `${origin}/`;

  const locationPhrase = communityLabel ? ` for ${communityLabel}` : "";
  const shareTitle = `${SITE_NAME} — Democracy is Social. Knowledge is Power. Politics is Local.`;
  const shareText = `I just joined the ${SITE_NAME} early access waitlist${locationPhrase}! Connect with verified neighbors, compare local candidates on standardized policy surveys, and track every election in one place:`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const socialTargets = [
    {
      id: "x",
      label: "Share on X",
      iconSrc: "/assets/img/social/x.svg",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      id: "facebook",
      label: "Share on Facebook",
      iconSrc: "/assets/img/social/facebook.svg",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: "whatsapp",
      label: "Share on WhatsApp",
      iconSrc: "/assets/img/social/whatsapp.svg",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      id: "linkedin",
      label: "Share on LinkedIn",
      iconSrc: "/assets/img/social/linkedin.svg",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy share link", error);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs text-left space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Invite Neighbors{locationPhrase}
          </h3>
        </div>

        {/* Clickable Social Media Image Links + Link Chain Copy Button */}
        <div className="flex items-center gap-2.5">
          {socialTargets.map((target) => (
            <a
              key={target.id}
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              title={target.label}
              aria-label={target.label}
              className="w-8 h-8 rounded-full hover:scale-105 hover:opacity-90 transition inline-flex items-center justify-center shadow-2xs"
            >
              <img
                src={target.iconSrc}
                alt={target.label}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full block"
              />
            </a>
          ))}

          <button
            type="button"
            onClick={() => void handleCopyLink()}
            title={copiedLink ? "Link copied!" : "Copy share link"}
            aria-label={copiedLink ? "Link copied!" : "Copy share link"}
            className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition cursor-pointer shadow-2xs ${
              copiedLink
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
            }`}
          >
            {copiedLink ? (
              <Check className="w-4 h-4" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Rich Link Preview Card */}
      <div className="rounded-xl border border-slate-200 bg-[#FAF8F5] p-3.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
          <span className="truncate">{hostname}</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
            Link Preview
          </span>
        </div>
        <div className="text-sm font-extrabold text-slate-900 leading-snug">
          {shareTitle}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{SITE_DESCRIPTION}</p>
      </div>
    </div>
  );
}
