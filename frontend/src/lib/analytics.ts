/**
 * Google Tag Manager (`GTM-KHGMZV4C`) & Google Analytics 4 (`G-DBPRV51YJB`)
 * client-side event tracking helper.
 *
 * Pushes structured events to `window.dataLayer` so the GTM "Conversion Events"
 * trigger (`^(page_view|generate_lead|sign_up|login|complete_profile|share|post_message|screen_preview|subscribe|contact)$`)
 * forwards them to the GA4 Event tag.
 */

export type AnalyticsEventName =
  | "page_view"
  | "generate_lead"
  | "sign_up"
  | "login"
  | "complete_profile"
  | "share"
  | "post_message"
  | "screen_preview"
  | "subscribe"
  | "contact";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | IArguments>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  event: AnalyticsEventName,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      ...params,
    });
  } catch (error) {
    console.error("Failed to push analytics event", error);
  }
}
