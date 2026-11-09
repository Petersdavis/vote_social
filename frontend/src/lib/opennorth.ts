/**
 * Client-side integration with the OpenNorth Represent API
 * (https://represent.opennorth.ca/postcodes/<POSTCODE>/?format=json).
 *
 * The Represent API includes `Access-Control-Allow-Origin: *`, so it can be
 * queried directly from the browser in our static Next.js export.
 *
 * Because a single 6-character Canadian postal code can return multiple
 * boundary matches per governance tier (e.g. across redistribution orders or
 * when a postal code straddles two wards/ridings), we group boundaries into
 * three tiers (`municipal`, `provincial`, `federal`), deduplicate identical
 * district names while prioritizing newer representation orders, and let the
 * user choose when multiple distinct districts exist at any tier.
 */

export interface OpenNorthBoundaryRaw {
  url: string;
  name: string;
  boundary_set_name: string;
  external_id?: string;
  related?: {
    boundary_set_url?: string;
  };
}

export interface OpenNorthPostcodeResponse {
  code: string;
  city?: string;
  province?: string;
  centroid?: {
    type: string;
    coordinates: [number, number];
  };
  boundaries_centroid?: OpenNorthBoundaryRaw[];
  boundaries_concordance?: OpenNorthBoundaryRaw[];
}

export type GovernanceTierSlug = "municipal" | "provincial" | "federal";

export interface PoliticalBoundaryOption {
  /** Unique boundary URL path from OpenNorth, e.g. "/boundaries/mississauga-wards/ward-1/" */
  url: string;
  /** Human-readable district name, e.g. "Mississauga—Lakeshore" or "Ward 1" */
  name: string;
  /** Boundary set descriptor, e.g. "Federal electoral district" or "Mississauga ward" */
  boundary_set_name: string;
  /** External identifier from the boundary set, if provided */
  external_id: string | null;
  /** Boundary set URL, used to rank newer representation orders first */
  boundary_set_url: string | null;
}

/**
 * Canonical ElectionSet membership stored on `users/{uid}` and aggregated in
 * the sparse `electionSets/{id}` collection.
 */
export interface UserElectionSet {
  /** Deterministic Firestore document ID derived from `url`. */
  id: string;
  /** OpenNorth canonical URL path, e.g. "/boundaries/kitchener-wards/ward-10/". */
  url: string;
  /** Human-readable boundary name, e.g. "Ward 10" or "Kitchener Centre". */
  name: string;
  /** Boundary set name, e.g. "Kitchener ward" or "Ontario electoral district". */
  boundary_set_name: string;
  /** Governance tier for grouping & filtering. */
  tier: GovernanceTierSlug;
  /** External ID from OpenNorth, if present. */
  external_id: string | null;
  /** Municipality / city name from postcode lookup, if present. */
  city: string | null;
  /** Two-letter province code, e.g. "ON". */
  province: string | null;
}

/**
 * Derive a deterministic, Firestore-safe document ID from an OpenNorth boundary URL.
 * Example: "/boundaries/kitchener-wards/ward-10/" -> "kitchener-wards__ward-10"
 */
export function electionSetIdFromUrl(url: string): string {
  const trimmed = url
    .trim()
    .replace(/^\/?boundaries\/?/i, "")
    .replace(/^\/+|\/+$/g, "");
  return trimmed.replace(/\//g, "__").replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Build the list of confirmed `UserElectionSet` objects from a user's selected
 * Municipal, Provincial, and Federal boundaries.
 */
export function buildUserElectionSets(params: {
  municipal?: PoliticalBoundaryOption | null;
  provincial?: PoliticalBoundaryOption | null;
  federal?: PoliticalBoundaryOption | null;
  city?: string | null;
  province?: string | null;
}): UserElectionSet[] {
  const sets: UserElectionSet[] = [];
  const city = params.city ?? null;
  const province = params.province ?? null;

  const entries: Array<[GovernanceTierSlug, PoliticalBoundaryOption | null | undefined]> = [
    ["municipal", params.municipal],
    ["provincial", params.provincial],
    ["federal", params.federal],
  ];

  const seenIds = new Set<string>();
  for (const [tier, option] of entries) {
    if (!option || !option.url) continue;
    const id = electionSetIdFromUrl(option.url);
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    sets.push({
      id,
      url: option.url,
      name: option.name,
      boundary_set_name: option.boundary_set_name,
      tier,
      external_id: option.external_id ?? null,
      city,
      province,
    });
  }

  return sets;
}

export interface PostcodeBoundaryResolution {
  /** Normalized 6-character Canadian postal code without spaces, e.g. "L5G4L3" */
  code: string;
  /** Formatted postal code with space, e.g. "L5G 4L3" */
  formattedPostcode: string;
  city: string | null;
  province: string | null;
  federalOptions: PoliticalBoundaryOption[];
  provincialOptions: PoliticalBoundaryOption[];
  municipalOptions: PoliticalBoundaryOption[];
}

const CANADIAN_POSTCODE_REGEX = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;

/** Strip spaces/hyphens and uppercase a Canadian postal code. */
export function normalizeCanadianPostcode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/** Format a 6-character code as "A1A 1A1" when valid. */
export function formatCanadianPostcode(raw: string): string {
  const clean = normalizeCanadianPostcode(raw);
  if (clean.length === 6) {
    return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  }
  return raw.trim().toUpperCase();
}

/** True when the input is a valid 6-character Canadian postal code. */
export function isValidCanadianPostcode(raw: string): boolean {
  return CANADIAN_POSTCODE_REGEX.test(normalizeCanadianPostcode(raw));
}

/**
 * Score a boundary option so newer representation orders sort before older ones.
 */
function scoreBoundaryFreshness(option: PoliticalBoundaryOption): number {
  const setUrl = (option.boundary_set_url ?? option.url).toLowerCase();
  if (setUrl.includes("2023")) return 100;
  if (setUrl.includes("2022") || setUrl.includes("2021")) return 95;
  if (setUrl.includes("2018") || setUrl.includes("2015")) return 90;
  if (setUrl.includes("2013")) return 80;
  if (setUrl.includes("2003") || setUrl.includes("2005")) return 20;
  // Unversioned canonical sets like `/boundary-sets/federal-electoral-districts/`
  return 85;
}

/**
 * Deduplicate boundary options by normalized district name, keeping the freshest
 * representation order for each distinct name.
 */
function deduplicateByName(
  options: PoliticalBoundaryOption[],
  includeSetNameInKey = false,
): PoliticalBoundaryOption[] {
  const sorted = [...options].sort(
    (a, b) => scoreBoundaryFreshness(b) - scoreBoundaryFreshness(a),
  );
  const seen = new Map<string, PoliticalBoundaryOption>();

  for (const opt of sorted) {
    const key = includeSetNameInKey
      ? `${opt.name.trim().toLowerCase()}::${opt.boundary_set_name.trim().toLowerCase()}`
      : opt.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, opt);
    }
  }

  return Array.from(seen.values());
}

function toBoundaryOption(raw: OpenNorthBoundaryRaw): PoliticalBoundaryOption {
  return {
    url: raw.url,
    name: raw.name,
    boundary_set_name: raw.boundary_set_name,
    external_id: raw.external_id ?? null,
    boundary_set_url: raw.related?.boundary_set_url ?? null,
  };
}

/**
 * Classify and deduplicate OpenNorth postcode boundaries into Federal,
 * Provincial, and Municipal / Ward options.
 */
export function parseOpenNorthPostcode(
  data: OpenNorthPostcodeResponse,
): PostcodeBoundaryResolution {
  const cleanCode = normalizeCanadianPostcode(data.code || "");
  const allRaw: OpenNorthBoundaryRaw[] = [
    ...(data.boundaries_centroid ?? []),
    ...(data.boundaries_concordance ?? []),
  ];

  const federalRaw: PoliticalBoundaryOption[] = [];
  const provincialRaw: PoliticalBoundaryOption[] = [];
  const wardRaw: PoliticalBoundaryOption[] = [];
  const censusSubdivisionRaw: PoliticalBoundaryOption[] = [];

  for (const item of allRaw) {
    const setName = (item.boundary_set_name || "").toLowerCase();
    const setUrl = (item.related?.boundary_set_url || item.url || "").toLowerCase();
    const option = toBoundaryOption(item);

    if (
      setName.includes("federal electoral district") ||
      setUrl.includes("federal-electoral-districts")
    ) {
      federalRaw.push(option);
    } else if (
      setName.includes("electoral district") ||
      setName.includes("provincial") ||
      setName.includes("legislative")
    ) {
      provincialRaw.push(option);
    } else if (
      setName.includes("ward") ||
      setName.includes("borough") ||
      setName.includes("arrondissement") ||
      setName.includes("council district")
    ) {
      wardRaw.push(option);
    } else if (setName.includes("census subdivision")) {
      censusSubdivisionRaw.push(option);
    }
  }

  const federalOptions = deduplicateByName(federalRaw, false);
  const provincialOptions = deduplicateByName(provincialRaw, false);
  // For municipal boundaries, prefer explicit municipal/regional wards when present;
  // otherwise fall back to Census Subdivision (municipality).
  const municipalOptions =
    wardRaw.length > 0
      ? deduplicateByName(wardRaw, true)
      : deduplicateByName(censusSubdivisionRaw, false);

  return {
    code: cleanCode,
    formattedPostcode: formatCanadianPostcode(cleanCode),
    city: data.city ?? null,
    province: data.province ?? null,
    federalOptions,
    provincialOptions,
    municipalOptions,
  };
}

/**
 * Fetch political boundaries for a Canadian postal code from OpenNorth Represent API.
 */
export async function fetchBoundariesForPostcode(
  rawPostcode: string,
  signal?: AbortSignal,
): Promise<PostcodeBoundaryResolution> {
  const cleanCode = normalizeCanadianPostcode(rawPostcode);
  if (!CANADIAN_POSTCODE_REGEX.test(cleanCode)) {
    throw new Error("Please enter a valid 6-character Canadian postal code (e.g. N2H 4P2).");
  }

  const response = await fetch(
    `https://represent.opennorth.ca/postcodes/${encodeURIComponent(cleanCode)}/?format=json`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  if (response.status === 404) {
    throw new Error(`No postal code found matching "${formatCanadianPostcode(cleanCode)}".`);
  }
  if (!response.ok) {
    throw new Error("Could not look up political boundaries right now. Please try again.");
  }

  const data = (await response.json()) as OpenNorthPostcodeResponse;
  return parseOpenNorthPostcode(data);
}
