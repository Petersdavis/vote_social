/**
 * Site-wide constants and runtime URL helpers used for SEO metadata and
 * shareable links/embeds.
 *
 * Because custom DNS is not finalized yet, client-side share links and embeds
 * resolve their hostname/origin dynamically from `window.location` at runtime,
 * while build-time static metadata falls back to `NEXT_PUBLIC_SITE_URL` or the
 * Firebase Hosting URL (`https://vote-social-pdavis.web.app`).
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vote-social.ca"
).replace(/\/+$/, "");

export const SITE_NAME = "Vote Social";

export const SITE_TITLE =
  "Vote Social — Democracy is Social. Knowledge is Power. Politics is Local.";

export const SITE_DESCRIPTION =
  "Connect with verified neighbors in your ward, compare candidates side-by-side on local policy surveys, pledge support with community voting blocks, and track Municipal, Provincial, and Federal elections in one place.";

/** Absolute canonical URL for a given path (used in build-time SEO metadata). */
export function canonicalUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/**
 * Resolve the live origin (`protocol + "//" + host`) from `window.location` in
 * the browser, falling back to `SITE_URL` during static build.
 */
export function resolveSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_URL;
}

/**
 * Resolve the live hostname from `window.location.host` in the browser.
 */
export function resolveSiteHost(): string {
  if (typeof window !== "undefined" && window.location?.host) {
    return window.location.host;
  }
  return SITE_URL.replace(/^https?:\/\//, "");
}

/**
 * Absolute URL for a path, resolved against `window.location.origin` at runtime.
 */
export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolveSiteOrigin()}${normalized}`;
}
