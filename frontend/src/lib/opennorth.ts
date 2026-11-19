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

export interface OpenNorthRepresentativeRaw {
  name: string;
  elected_office: string;
  district_name: string;
  representative_set_name: string;
  email?: string;
  party_name?: string;
  photo_url?: string;
  url?: string;
  personal_url?: string;
  related?: {
    boundary_url?: string;
    representative_set_url?: string;
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
  representatives_centroid?: OpenNorthRepresentativeRaw[];
  representatives_concordance?: OpenNorthRepresentativeRaw[];
}

export type GovernanceTierSlug =
  | "municipal"
  | "regional"
  | "provincial"
  | "federal";

export interface RepresentativeOption {
  /** Deterministic ID derived from normalized email or name+boundary */
  repId: string;
  name: string;
  elected_office: string;
  district_name: string;
  representative_set_name: string;
  email: string;
  party_name: string | null;
  photo_url: string | null;
  boundary_url: string;
  tier: GovernanceTierSlug;
}

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
  regionalOptions: PoliticalBoundaryOption[];
  municipalOptions: PoliticalBoundaryOption[];
  /** Underlying city/municipality (census subdivision) and regional (census division) boundaries for Mayor / Regional Chair lookup */
  cityBoundaries: PoliticalBoundaryOption[];
  regionBoundaries: PoliticalBoundaryOption[];
  /** Representatives returned directly in the postcode lookup */
  postcodeRepresentatives: RepresentativeOption[];
}

export function repIdFromEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, "_");
}

function classifyRepresentativeTier(
  rep: OpenNorthRepresentativeRaw,
): GovernanceTierSlug {
  const set = (rep.representative_set_name || "").toLowerCase();
  const office = (rep.elected_office || "").toLowerCase();
  const bUrl = (rep.related?.boundary_url || "").toLowerCase();

  if (
    set.includes("house of commons") ||
    office === "mp" ||
    bUrl.includes("federal-electoral-districts")
  ) {
    return "federal";
  }
  if (
    set.includes("legislative assembly") ||
    set.includes("national assembly") ||
    set.includes("house of assembly") ||
    office === "mpp" ||
    office === "mla" ||
    office === "mna" ||
    office === "mha"
  ) {
    return "provincial";
  }
  if (
    set.includes("regional") ||
    set.includes("county") ||
    office.includes("regional") ||
    bUrl.includes("census-divisions") ||
    bUrl.includes("peel-wards") ||
    bUrl.includes("york-wards") ||
    bUrl.includes("durham-wards") ||
    bUrl.includes("halton-wards") ||
    bUrl.includes("niagara-wards")
  ) {
    return "regional";
  }
  return "municipal";
}

function toRepresentativeOption(
  raw: OpenNorthRepresentativeRaw,
): RepresentativeOption | null {
  const email = (raw.email || "").trim();
  const boundaryUrl = (raw.related?.boundary_url || "").trim();
  if (!raw.name || !email || !boundaryUrl) {
    return null;
  }
  return {
    repId: repIdFromEmail(email),
    name: raw.name.trim(),
    elected_office: (raw.elected_office || "Representative").trim(),
    district_name: (raw.district_name || "").trim(),
    representative_set_name: (raw.representative_set_name || "").trim(),
    email,
    party_name: raw.party_name ? raw.party_name.trim() : null,
    photo_url: raw.photo_url ? raw.photo_url.trim() : null,
    boundary_url: boundaryUrl,
    tier: classifyRepresentativeTier(raw),
  };
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
 * Extract the `/boundaries/<set-slug>/` prefix from a boundary URL.
 */
function getBoundarySetPrefix(url: string): string {
  const match = /^(\/boundaries\/[^/]+\/)/i.exec(url.trim());
  return match ? match[1].toLowerCase() : url.trim().toLowerCase();
}

/**
 * Score a boundary option so boundary sets with active sitting representatives
 * and newer representation orders sort before older/retired ones.
 */
function scoreBoundaryFreshness(
  option: PoliticalBoundaryOption,
  activeRepBoundaryUrls?: Set<string>,
  activeRepSetPrefixes?: Set<string>,
): number {
  let score = 85;
  const setUrl = (option.boundary_set_url ?? option.url).toLowerCase();
  if (setUrl.includes("2023") || setUrl.includes("2024")) score = 100;
  else if (setUrl.includes("2022") || setUrl.includes("2021")) score = 95;
  else if (setUrl.includes("2018") || setUrl.includes("2015")) score = 90;
  else if (setUrl.includes("2013")) score = 70;
  else if (
    setUrl.includes("2003") ||
    setUrl.includes("2005") ||
    setUrl.includes("2010")
  ) {
    score = 20;
  }

  const normalizedUrl = option.url.trim().toLowerCase();
  const prefix = getBoundarySetPrefix(option.url);

  if (activeRepBoundaryUrls?.has(normalizedUrl)) {
    score += 1000;
  } else if (activeRepSetPrefixes?.has(prefix)) {
    score += 500;
  }

  return score;
}

/**
 * Filter a list of boundaries in a governance tier so retired historical
 * boundary sets (e.g. 2003 Federal, 2005 Ontario, 2010 Toronto Wards) are
 * excluded when an active boundary set with sitting representatives exists,
 * then deduplicate by normalized district name.
 */
function filterAndDeduplicateTierBoundaries(
  options: PoliticalBoundaryOption[],
  activeRepBoundaryUrls: Set<string>,
  activeRepSetPrefixes: Set<string>,
  includeSetNameInKey = false,
): PoliticalBoundaryOption[] {
  if (options.length === 0) return [];

  // 1. If any options belong to a boundary set that has active representatives,
  //    keep only options from active representative boundary sets.
  const matchingActiveSet = options.filter((opt) =>
    activeRepSetPrefixes.has(getBoundarySetPrefix(opt.url)),
  );
  let pool = matchingActiveSet.length > 0 ? matchingActiveSet : options;

  // 2. Otherwise, discard explicitly retired historical orders (score <= 70)
  //    whenever newer boundary sets exist in the pool.
  const modernPool = pool.filter(
    (opt) =>
      scoreBoundaryFreshness(opt, activeRepBoundaryUrls, activeRepSetPrefixes) >
      75,
  );
  if (modernPool.length > 0) {
    pool = modernPool;
  }

  // 3. Sort freshest / rep-backed first and deduplicate by district name
  const sorted = [...pool].sort(
    (a, b) =>
      scoreBoundaryFreshness(b, activeRepBoundaryUrls, activeRepSetPrefixes) -
      scoreBoundaryFreshness(a, activeRepBoundaryUrls, activeRepSetPrefixes),
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
  const regionalRaw: PoliticalBoundaryOption[] = [];
  const wardRaw: PoliticalBoundaryOption[] = [];
  const censusSubdivisionRaw: PoliticalBoundaryOption[] = [];
  const censusDivisionRaw: PoliticalBoundaryOption[] = [];

  for (const item of allRaw) {
    const setName = (item.boundary_set_name || "").toLowerCase();
    const setUrl = (
      item.related?.boundary_set_url ||
      item.url ||
      ""
    ).toLowerCase();
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
      setName.includes("regional") ||
      setUrl.includes("peel-wards") ||
      setUrl.includes("york-wards") ||
      setUrl.includes("halton-wards") ||
      setUrl.includes("durham-wards") ||
      setUrl.includes("niagara-wards")
    ) {
      regionalRaw.push(option);
    } else if (
      setName.includes("ward") ||
      setName.includes("borough") ||
      setName.includes("arrondissement") ||
      setName.includes("council district")
    ) {
      wardRaw.push(option);
    } else if (setName.includes("census subdivision")) {
      censusSubdivisionRaw.push(option);
    } else if (setName.includes("census division")) {
      censusDivisionRaw.push(option);
    }
  }

  const allRepsRaw: OpenNorthRepresentativeRaw[] = [
    ...(data.representatives_centroid ?? []),
    ...(data.representatives_concordance ?? []),
  ];
  const seenRepKeys = new Set<string>();
  const postcodeRepresentatives: RepresentativeOption[] = [];
  for (const rawRep of allRepsRaw) {
    const parsed = toRepresentativeOption(rawRep);
    if (!parsed) continue;
    const dedupKey = `${parsed.repId}::${parsed.representative_set_name.toLowerCase()}`;
    if (!seenRepKeys.has(dedupKey)) {
      seenRepKeys.add(dedupKey);
      postcodeRepresentatives.push(parsed);
    }
  }

  const hasRegionalReps = postcodeRepresentatives.some(
    (r) => r.tier === "regional",
  );

  const activeRepBoundaryUrls = new Set<string>(
    postcodeRepresentatives.map((r) => r.boundary_url.trim().toLowerCase()),
  );
  const activeRepSetPrefixes = new Set<string>(
    postcodeRepresentatives.map((r) => getBoundarySetPrefix(r.boundary_url)),
  );

  const federalOptions = filterAndDeduplicateTierBoundaries(
    federalRaw,
    activeRepBoundaryUrls,
    activeRepSetPrefixes,
    false,
  );
  const provincialOptions = filterAndDeduplicateTierBoundaries(
    provincialRaw,
    activeRepBoundaryUrls,
    activeRepSetPrefixes,
    false,
  );
  const cityBoundaries = filterAndDeduplicateTierBoundaries(
    censusSubdivisionRaw,
    activeRepBoundaryUrls,
    activeRepSetPrefixes,
    false,
  );
  const regionBoundaries = filterAndDeduplicateTierBoundaries(
    censusDivisionRaw,
    activeRepBoundaryUrls,
    activeRepSetPrefixes,
    false,
  );

  const regionalOptions =
    regionalRaw.length > 0
      ? filterAndDeduplicateTierBoundaries(
          regionalRaw,
          activeRepBoundaryUrls,
          activeRepSetPrefixes,
          true,
        )
      : hasRegionalReps
      ? regionBoundaries
      : [];

  // For municipal boundaries, prefer explicit municipal wards when present;
  // otherwise fall back to Census Subdivision (municipality).
  const municipalOptions =
    wardRaw.length > 0
      ? filterAndDeduplicateTierBoundaries(
          wardRaw,
          activeRepBoundaryUrls,
          activeRepSetPrefixes,
          true,
        )
      : cityBoundaries;

  return {
    code: cleanCode,
    formattedPostcode: formatCanadianPostcode(cleanCode),
    city: data.city ?? null,
    province: data.province ?? null,
    federalOptions,
    provincialOptions,
    regionalOptions,
    municipalOptions,
    cityBoundaries,
    regionBoundaries,
    postcodeRepresentatives,
  };
}

/**
 * Fetch representatives for a specific OpenNorth boundary URL (used when a
 * user selects an alternate concordance boundary not covered by centroid reps).
 */
export async function fetchRepresentativesForBoundary(
  boundaryUrl: string,
  signal?: AbortSignal,
): Promise<RepresentativeOption[]> {
  const cleanUrl = boundaryUrl.startsWith("/")
    ? boundaryUrl
    : `/${boundaryUrl}`;
  const normalizedUrl = cleanUrl.endsWith("/") ? cleanUrl : `${cleanUrl}/`;

  const response = await fetch(
    `https://represent.opennorth.ca${normalizedUrl}representatives/?format=json`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    objects?: OpenNorthRepresentativeRaw[];
  };
  const results: RepresentativeOption[] = [];
  for (const raw of data.objects ?? []) {
    const withBoundary: OpenNorthRepresentativeRaw = {
      ...raw,
      related: {
        ...raw.related,
        boundary_url: raw.related?.boundary_url || normalizedUrl,
      },
    };
    const parsed = toRepresentativeOption(withBoundary);
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
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
