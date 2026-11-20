import React, { useEffect, useRef, useState } from "react";

export type VoteSocialGovernanceTier =
  | "municipal"
  | "regional"
  | "provincial"
  | "federal";

export interface VoteSocialContactRepProps {
  /**
   * Optional governance tier filter. When set (e.g. `"federal"`), the widget
   * resolves the constituent's representative for that level directly from their
   * 6-character Canadian postal code.
   */
  tier?: VoteSocialGovernanceTier;
  /** Optional pre-filled campaign subject line */
  defaultSubject?: string;
  /** Optional pre-filled campaign message body */
  defaultBody?: string;
  /** Optional pre-filled 6-character Canadian postal code */
  defaultPostcode?: string;
  /** Optional custom base URL (defaults to "https://vote-social.ca") */
  baseUrl?: string;
  /** Optional container className */
  className?: string;
}

/**
 * Embeddable Canadian "Contact Your Elected Representative" widget for React
 * and Next.js applications.
 *
 * Renders an auto-resizing Vote Social constituent carousel along with a
 * native host-DOM attribution bar linking to Open North and Vote Social.
 */
export function VoteSocialContactRep({
  tier,
  defaultSubject,
  defaultBody,
  defaultPostcode,
  baseUrl = "https://vote-social.ca",
  className,
}: VoteSocialContactRepProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(440);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        !event.data ||
        typeof event.data !== "object" ||
        event.data.type !== "vote-social:resize"
      ) {
        return;
      }
      if (
        iframeRef.current &&
        event.source &&
        iframeRef.current.contentWindow !== event.source
      ) {
        return;
      }
      const nextHeight = Number(event.data.height);
      if (nextHeight >= 240 && nextHeight <= 2400) {
        setIframeHeight(Math.ceil(nextHeight));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (tier) params.set("tier", tier);
  if (defaultSubject) params.set("subject", defaultSubject);
  if (defaultBody) params.set("body", defaultBody);
  if (defaultPostcode) params.set("postcode", defaultPostcode);

  const query = params.toString();
  const src = `${cleanBase}/embed/contact-rep/${query ? `?${query}` : ""}`;

  return (
    <div
      className={className}
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <iframe
        ref={iframeRef}
        src={src}
        title="Contact Your Elected Representative — Vote Social"
        loading="lazy"
        style={{
          width: "100%",
          height: `${iframeHeight}px`,
          border: "0",
          overflow: "hidden",
          transition: "height 0.25s ease",
        }}
      />
    </div>
  );
}

export default VoteSocialContactRep;
