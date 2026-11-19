/**
 * Google Tag Manager (`GTM-KHGMZV4C`) & Google Analytics 4 (`G-DBPRV51YJB`)
 * client-side event tracking helper (Cookieless Consent Mode v2 compatible).
 *
 * Pushes structured events to `window.dataLayer` so the GTM "Conversion Events"
 * trigger (`^(page_view|generate_lead|sign_up|login|complete_profile|share|post_message|screen_preview|subscribe|contact)$`)
 * forwards them to the GA4 Event tag, automatically attaching any session-level
 * UTM / referral parameters captured on the landing page.
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

export interface AttributionParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ref?: string;
  landing_page?: string;
}

const ATTRIBUTION_STORAGE_KEY = "vs_attribution";
const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
] as const;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | IArguments>;
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Read UTM and referral parameters from the current URL (if present) or from
 * ephemeral tab `sessionStorage` captured when the visitor first landed on the
 * site. Uses zero cookies so Consent Mode v2 (`analytics_storage: 'denied'`)
 * still attributes multi-step conversions (`/blog` -> `/` -> `/register` -> `/profile`)
 * back to the originating UTM campaign.
 */
export function getAttributionParams(): AttributionParams {
  if (typeof window === "undefined") {
    return {};
  }

  let stored: AttributionParams = {};
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw) as AttributionParams;
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }

  try {
    const sp = new URLSearchParams(window.location.search);
    let updated = false;
    for (const key of ATTRIBUTION_KEYS) {
      const val = sp.get(key);
      if (val) {
        stored[key] = val;
        updated = true;
      }
    }
    if (updated) {
      if (!stored.landing_page) {
        stored.landing_page = window.location.pathname;
      }
      window.sessionStorage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(stored),
      );
    }
  } catch {
    // Ignore URL parsing errors
  }

  return stored;
}

export function trackEvent(
  event: AnalyticsEventName,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const attribution = getAttributionParams();
    const campaignFields: Record<string, string> = {};
    if (attribution.utm_source) {
      campaignFields.utm_source = attribution.utm_source;
      campaignFields.campaign_source = attribution.utm_source;
    }
    if (attribution.utm_medium) {
      campaignFields.utm_medium = attribution.utm_medium;
      campaignFields.campaign_medium = attribution.utm_medium;
    }
    if (attribution.utm_campaign) {
      campaignFields.utm_campaign = attribution.utm_campaign;
      campaignFields.campaign_name = attribution.utm_campaign;
    }
    if (attribution.utm_content) {
      campaignFields.utm_content = attribution.utm_content;
      campaignFields.campaign_content = attribution.utm_content;
    }
    if (attribution.utm_term) {
      campaignFields.utm_term = attribution.utm_term;
      campaignFields.campaign_term = attribution.utm_term;
    }
    if (attribution.ref) {
      campaignFields.referral_code = attribution.ref;
    }
    if (attribution.landing_page) {
      campaignFields.landing_page = attribution.landing_page;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      ...campaignFields,
      ...params,
    });
  } catch (error) {
    console.error("Failed to push analytics event", error);
  }
}
