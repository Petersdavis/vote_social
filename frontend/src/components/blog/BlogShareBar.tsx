"use client";

import React, { useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface BlogShareBarProps {
  slug: string;
  title: string;
  subtitle: string;
}

export default function BlogShareBar({
  slug,
  title,
  subtitle,
}: BlogShareBarProps) {
  const [origin, setOrigin] = useState(SITE_URL);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location) {
      setOrigin(window.location.origin);
    }
  }, []);

  function buildShareUrl(utmSource: string): string {
    const params = new URLSearchParams({
      utm_source: utmSource,
      utm_medium: "social",
      utm_campaign: "blog_share",
      utm_content: slug,
    });
    return `${origin}/blog/${encodeURIComponent(slug)}/?${params.toString()}`;
  }

  const shareText = `${title} — ${subtitle} (${SITE_NAME})`;

  const socialTargets = [
    {
      id: "x",
      label: "Share on X",
      iconSrc: "/assets/img/social/x.svg",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(buildShareUrl("x"))}`,
    },
    {
      id: "facebook",
      label: "Share on Facebook",
      iconSrc: "/assets/img/social/facebook.svg",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildShareUrl("facebook"))}`,
    },
    {
      id: "whatsapp",
      label: "Share on WhatsApp",
      iconSrc: "/assets/img/social/whatsapp.svg",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${buildShareUrl("whatsapp")}`)}`,
    },
    {
      id: "linkedin",
      label: "Share on LinkedIn",
      iconSrc: "/assets/img/social/linkedin.svg",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(buildShareUrl("linkedin"))}`,
    },
  ];

  async function handleCopyLink() {
    const copyUrl = buildShareUrl("copy_link");
    try {
      await navigator.clipboard.writeText(copyUrl);
      setCopiedLink(true);
      trackEvent("share", {
        method: "copy_link",
        content_type: "blog_post",
        item_id: slug,
      });
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy blog share link", error);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
      <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
        <Share2 className="w-3.5 h-3.5 text-blue-700" />
        <span>Share this article</span>
      </div>

      <div
        role="group"
        aria-label={`Share article: ${title}`}
        className="flex items-center gap-2"
      >
        {socialTargets.map((target) => (
          <a
            key={target.id}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("share", {
                method: target.id,
                content_type: "blog_post",
                item_id: slug,
              })
            }
            title={target.label}
            aria-label={`${target.label}: ${title} (opens in a new tab)`}
            className="w-8 h-8 rounded-full hover:scale-105 hover:opacity-90 transition inline-flex items-center justify-center shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <img
              src={target.iconSrc}
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full block"
            />
          </a>
        ))}

        <button
          type="button"
          onClick={() => void handleCopyLink()}
          title={copiedLink ? "Link copied!" : "Copy article link"}
          aria-label={
            copiedLink
              ? "Article link copied to clipboard"
              : `Copy link to article: ${title}`
          }
          className={`px-3 h-8 rounded-full inline-flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
            copiedLink
              ? "bg-emerald-700 text-white"
              : "bg-slate-200 hover:bg-slate-300 text-slate-700"
          }`}
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <span role="status" aria-live="polite" className="sr-only">
          {copiedLink ? "Article link copied to clipboard." : ""}
        </span>
      </div>
    </div>
  );
}
