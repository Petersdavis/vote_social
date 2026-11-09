export type GovernanceTier =
  | "Regional"
  | "Councilor"
  | "Mayoral"
  | "Provincial"
  | "Federal";

export interface GlobalIssue {
  id: string;
  slug: string;
  title: string;
  shortLabel: string;
  description: string;
  voteCount: number;
  preferenceScore: number; // 0-100 user preference alignment
  recentActivityLabel: string;
  recentActivityMinutesAgo: number;
}

export interface ScopedPolicy {
  id: string;
  issueId: string; // 1 GlobalIssue -> Many ScopedPolicies
  code: string;
  title: string;
  summary: string;
  governanceTier: GovernanceTier;
  jurisdiction: string; // Scoped to the user's slice of the federalist pie
  voteCount: number;
}

export interface CandidateOrgSupport {
  orgId: string;
  orgName: string;
  shortCode: string;
  voterCount: number;
  color: "emerald" | "blue" | "amber" | "purple" | "slate";
}

export interface EndorsementBadge {
  label: string;
  type: "candidate" | "org" | "undecided";
  color: "blue" | "emerald" | "amber" | "purple" | "slate";
}

export interface ForumReply {
  id: string;
  authorName: string;
  authorInitials: string;
  authorRole: "voter" | "candidate" | "org";
  precinctOrTitle: string;
  verifiedIdentity?: boolean;
  verifiedCandidate?: boolean;
  pledgeBadge?: EndorsementBadge;
  timestamp: string;
  content: string;
  policyCitation?: string;
  upvotes: number;
  helpfulCount?: number;
}

export interface ForumThread {
  id: string;
  issueId: string;
  issueTitle: string;
  scopedPolicyIds: string[];
  issueRank: number;
  category: "Transit & Streets" | "Housing & Zoning" | "Parks & Safety" | "Local Budget";
  title: string;
  summary: string;
  authorName: string;
  authorInitials: string;
  authorRole?: "voter" | "org" | "candidate";
  verifiedIdentity?: boolean;
  precinct: string;
  postalPrefix: string;
  timestamp: string;
  recentActivityMinutesAgo: number;
  upvotes: number;
  commentCount: number;
  userUpvoted?: boolean;
  pledgeBadge: EndorsementBadge;
  tags: string[];
  candidateResponded: boolean;
  candidateResponsesCount: number;
  replies: ForumReply[];
}

export interface CandidateSurveyAnswer {
  topic: string;
  question: string;
  stance: "Strong Support" | "Conditional Support" | "Phased Approach" | "Opposes";
  summary: string;
  quote: string;
}

export interface VotingRecordItem {
  code: string;
  title: string;
  date: string;
  vote: "YES" | "NO" | "NEW CANDIDATE";
  outcome: string;
}

export interface CandidateFile {
  id: string;
  fileName: string;
  label?: string;
  size: string;
  uploadedAt: string;
}

export interface MediaClip {
  id: string;
  title: string;
  source: string;
  duration: string;
  date: string;
  quoteSnippet: string;
}

export interface VoterTestimonial {
  id: string;
  voterName: string;
  voterInitials: string;
  precinct: string;
  postalCode: string;
  relationship: string;
  quote: string;
  verifiedNeighbor: boolean;
  upvotes: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  initials: string;
  roleTitle: string;
  raceLevel: GovernanceTier;
  wardOrDistrict: string;
  incumbent: boolean;
  verified: boolean;
  tagline: string;
  avatarBg: string;
  pledgeCountInWard: number;
  pledgeCountInPostal: number;
  independentVotersCount: number;
  yardSignsActive: number;
  userPledged?: boolean;
  topIssues: string[];
  keyIssueIds: string[];
  orgSupports: CandidateOrgSupport[];
  bioSummary: string;
  credentials: string[];
  files: CandidateFile[];
  endorsedByOrgs: string[];
  surveyAnswers: Record<string, CandidateSurveyAnswer>;
  votingRecord: VotingRecordItem[];
  mediaClips: MediaClip[];
  testimonials: VoterTestimonial[];
}

export interface VotingOrganization {
  id: string;
  name: string;
  shortCode: string;
  category: string;
  subscriberCount: number;
  verifiedDomain: string;
  endorsedCandidateId: string;
  endorsedCandidateName: string;
  slateSummary: string;
  pinnedAnnouncement: string;
  keyIssues: string[];
}

export interface CivicEvent {
  id: string;
  title: string;
  type: "Voting Window" | "Live Debate" | "Volunteer & Canvass" | "Watch Party";
  dateLabel: string;
  timeLabel: string;
  locationName: string;
  address: string;
  rsvpCount: number;
  isOfficialElectionDate?: boolean;
  userRsvped?: boolean;
}

export const VOTER_CONTEXT = {
  voterName: "Alex Mercer",
  voterInitials: "AM",
  postalCode: "M4K 1N2",
  streetAddress: "482 Logan Ave",
  wardName: "Ward 14 • Toronto–Danforth",
  precinctCode: "Subdivision 14-08 (Riverdale North)",
  municipalitySlug: "toronto",
  municipality: "City of Toronto, ON",
  federalistSlice: {
    Regional: "TDSB Ward 15 • Toronto–Danforth",
    Councilor: "Ward 14 • City of Toronto",
    Mayoral: "City of Toronto",
    Provincial: "Toronto–Danforth (Province of Ontario)",
    Federal: "Toronto–Danforth (Government of Canada)",
  },
  activeNeighborsCount: 1428,
  totalWardPledges: 3890,
  electionDate: "November 21, 2026",
  daysUntilElection: 14,
  userPledgeBadge: {
    label: "Endorses: Maya Lin",
    type: "candidate" as const,
    color: "blue" as const,
  },
  userOrgBadge: {
    label: "Endorses: More Neighbours Metro",
    type: "org" as const,
    color: "blue" as const,
  },
};

/**
 * First-order Object 1: Global Issues
 * Top-level forum subjects ranked by user preferences, popularity (voteCount), and recent activity.
 */
export const GLOBAL_ISSUES: GlobalIssue[] = [
  {
    id: "issue-transit",
    slug: "transit-complete-streets",
    title: "Transit & Complete Streets",
    shortLabel: "Transit & Streets",
    description:
      "Public transit reliability, construction mitigation, protected cycling corridors, and safe school crossings.",
    voteCount: 342,
    preferenceScore: 98,
    recentActivityLabel: "14m ago",
    recentActivityMinutesAgo: 14,
  },
  {
    id: "issue-housing",
    slug: "housing-gentle-density",
    title: "Housing & Gentle Density",
    shortLabel: "Housing & Zoning",
    description:
      "Missing middle multiplexes, transit-oriented mid-rise zoning, non-profit co-ops, and tenant protections.",
    voteCount: 289,
    preferenceScore: 95,
    recentActivityLabel: "38m ago",
    recentActivityMinutesAgo: 38,
  },
  {
    id: "issue-safety",
    slug: "parks-community-safety",
    title: "Parks & Community Safety",
    shortLabel: "Parks & Safety",
    description:
      "Vision Zero school zones, civilian mobile crisis response teams, youth recreation spaces, and park lighting.",
    voteCount: 241,
    preferenceScore: 88,
    recentActivityLabel: "1h ago",
    recentActivityMinutesAgo: 68,
  },
  {
    id: "issue-main-streets",
    slug: "main-streets-local-economy",
    title: "Main Streets & Local Budget",
    shortLabel: "Local Budget",
    description:
      "Commercial vacancy taxes, small business property tax relief, and coordinated utility/road capital works.",
    voteCount: 176,
    preferenceScore: 84,
    recentActivityLabel: "3h ago",
    recentActivityMinutesAgo: 185,
  },
  {
    id: "issue-schools",
    slug: "public-schools-student-safety",
    title: "Public Schools & Student Bus Zones",
    shortLabel: "Schools & Youth",
    description:
      "School yard greening, HVAC capital repairs, safe walk-to-school corridors, and after-hours youth hubs.",
    voteCount: 154,
    preferenceScore: 79,
    recentActivityLabel: "4h ago",
    recentActivityMinutesAgo: 240,
  },
  {
    id: "issue-healthcare",
    slug: "primary-care-hospital-access",
    title: "Healthcare & Family Doctor Access",
    shortLabel: "Healthcare Access",
    description:
      "Community health clinics, Michael Garron Hospital capacity, and provincial primary care attachment.",
    voteCount: 218,
    preferenceScore: 90,
    recentActivityLabel: "5h ago",
    recentActivityMinutesAgo: 310,
  },
  {
    id: "issue-climate",
    slug: "climate-resilience-clean-energy",
    title: "Climate Resilience & Flood Infrastructure",
    shortLabel: "Climate & Energy",
    description:
      "Don Valley flood mitigation, heat pump retrofits, green roofs, and federal-municipal infrastructure co-funding.",
    voteCount: 192,
    preferenceScore: 86,
    recentActivityLabel: "6h ago",
    recentActivityMinutesAgo: 360,
  },
];

/**
 * First-order Object 2: Jurisdiction-Scoped Policies
 * Fixed to a governance tier within the user's slice of the federalist pie.
 * Policies tag Issues (1 GlobalIssue -> Many ScopedPolicies).
 */
export const SCOPED_POLICIES: ScopedPolicy[] = [
  // Councilor (Ward 14 • City of Toronto)
  {
    id: "pol-ontario-line-trucks",
    issueId: "issue-transit",
    code: "MUNI-BYLAW-14-02",
    title: "Overnight Haul Truck Camera Enforcement & Noise Dashboards (Pape Station)",
    summary:
      "Mandates automated heavy-truck enforcement on residential cut-through streets (Logan/Langley) and real-time decibel monitoring.",
    governanceTier: "Councilor",
    jurisdiction: "Ward 14 • City of Toronto",
    voteCount: 218,
  },
  {
    id: "pol-danforth-complete-street",
    issueId: "issue-transit",
    code: "MUNI-INFRA-2026-09",
    title: "Danforth Complete Street Concrete Upgrade & Loading Bay Optimization",
    summary:
      "Upgrades painted bike buffers to permanent precast concrete curbs while adding 15-minute commercial loading zones.",
    governanceTier: "Councilor",
    jurisdiction: "Ward 14 • City of Toronto",
    voteCount: 124,
  },
  {
    id: "pol-six-storey-corridors",
    issueId: "issue-housing",
    code: "MUNI-ZONING-2026-114",
    title: "As-of-Right 6-Storey Mid-Rise & Multiplex Zoning on Transit Avenues",
    summary:
      "Allows 4-to-6 storey apartments within 500m of Danforth and Ontario Line stations without rezoning delays.",
    governanceTier: "Councilor",
    jurisdiction: "Ward 14 • City of Toronto",
    voteCount: 179,
  },
  {
    id: "pol-east-end-land-trust",
    issueId: "issue-housing",
    code: "MUNI-HOUS-2026-88",
    title: "$25M East End Community Land Trust & Anti-Renoviction Licensing",
    summary:
      "Acquires at-risk low-rise rental buildings for non-profit co-ops and enforces mandatory tenant relocation protections.",
    governanceTier: "Councilor",
    jurisdiction: "Ward 14 • City of Toronto",
    voteCount: 110,
  },
  {
    id: "pol-school-zone-crosswalks",
    issueId: "issue-safety",
    code: "MUNI-VISION-ZERO-18",
    title: "18 Raised Crosswalks & Community Crisis Service 24/7 East End Dispatch",
    summary:
      "Installs continuous raised intersections at Ward 14 schools and expands civilian mental health crisis teams.",
    governanceTier: "Councilor",
    jurisdiction: "Ward 14 • City of Toronto",
    voteCount: 241,
  },
  {
    id: "pol-commercial-vacancy-levy",
    issueId: "issue-main-streets",
    code: "MUNI-TAX-2026-04",
    title: "2% Commercial Storefront Vacancy Levy & Small Business Tax Subclass Cut",
    summary:
      "Penalizes long-term empty storefronts on Danforth Ave to fund a 15% municipal property tax reduction for active independent shops.",
    governanceTier: "Councilor",
    jurisdiction: "Ward 14 • City of Toronto",
    voteCount: 176,
  },
  {
    id: "pol-basement-flooding-don",
    issueId: "issue-climate",
    code: "MUNI-CLIMATE-14-07",
    title: "Riverdale & Blake-Jones Storm Sewer Upgrade & Bioswale Program",
    summary:
      "Accelerates municipal storm-water separation and green street bioswales in flood-prone East End blocks.",
    governanceTier: "Councilor",
    jurisdiction: "Ward 14 • City of Toronto",
    voteCount: 98,
  },

  // Mayoral (City of Toronto Executive)
  {
    id: "pol-mayoral-ttc-service",
    issueId: "issue-transit",
    code: "CITY-EXEC-TTC-01",
    title: "City-Wide TTC Off-Peak Fare Cap & Bus Priority Signal Pre-emption",
    summary:
      "Frees up surface transit speeds city-wide and caps monthly fares for low-income and youth riders.",
    governanceTier: "Mayoral",
    jurisdiction: "City of Toronto • Executive",
    voteCount: 280,
  },
  {
    id: "pol-mayoral-housing-plan",
    issueId: "issue-housing",
    code: "CITY-EXEC-HOUS-03",
    title: "Public Land Co-op Housing Build across 14 City-Owned Parking Lots",
    summary:
      "Dedicates municipal real estate parcels near subway stations to 100% rent-geared-to-income and co-op housing.",
    governanceTier: "Mayoral",
    jurisdiction: "City of Toronto • Executive",
    voteCount: 310,
  },
  {
    id: "pol-mayoral-budget",
    issueId: "issue-main-streets",
    code: "CITY-EXEC-BUD-02",
    title: "Coordinated Multi-Utility Road Dig Moratorium & Capital Audit",
    summary:
      "Requires Toronto Water, Hydro, and telecoms to coordinate trenching in a single window to stop repeat street closures.",
    governanceTier: "Mayoral",
    jurisdiction: "City of Toronto • Executive",
    voteCount: 195,
  },

  // Regional / School Board (TDSB Ward 15)
  {
    id: "pol-tdsb-safe-walk",
    issueId: "issue-schools",
    code: "TDSB-W15-SAFE-01",
    title: "Frankland & Earl Grey School Street Car-Free Drop-Off Zones",
    summary:
      "Creates timed pedestrian-only school streets during morning drop-off and afternoon bell windows.",
    governanceTier: "Regional",
    jurisdiction: "TDSB Ward 15 • Toronto–Danforth",
    voteCount: 154,
  },
  {
    id: "pol-tdsb-hvac-green",
    issueId: "issue-climate",
    code: "TDSB-W15-FAC-04",
    title: "Classroom Heat Pump Cooling & Shade Tree Schoolyard Revitalization",
    summary:
      "Replaces aging boilers with high-efficiency cooling heat pumps and depaves asphalt schoolyards.",
    governanceTier: "Regional",
    jurisdiction: "TDSB Ward 15 • Toronto–Danforth",
    voteCount: 112,
  },

  // Provincial (Ontario • Toronto–Danforth)
  {
    id: "pol-prov-metrolinx-comp",
    issueId: "issue-transit",
    code: "ON-BILL-108-METROLINX",
    title: "Statutory Provincial Business Compensation for Ontario Line Construction",
    summary:
      "Requires Metrolinx to provide direct rent and revenue-loss grants to Pape Village businesses impacted by station tunneling.",
    governanceTier: "Provincial",
    jurisdiction: "Province of Ontario • Toronto–Danforth",
    voteCount: 265,
  },
  {
    id: "pol-prov-rent-control",
    issueId: "issue-housing",
    code: "ON-RTA-2026-12",
    title: "Eliminate Post-2018 Rent Control Exemption & Clear LTB Backlog",
    summary:
      "Restores universal provincial guideline rent stabilization to all residential units built after November 2018.",
    governanceTier: "Provincial",
    jurisdiction: "Province of Ontario • Toronto–Danforth",
    voteCount: 334,
  },
  {
    id: "pol-prov-family-doctors",
    issueId: "issue-healthcare",
    code: "ON-HEALTH-TEAM-09",
    title: "East Toronto Family Practice Team Expansion & ER Triage Funding",
    summary:
      "Funds 4 new interdisciplinary primary care clinics in M4K/M4J to guarantee every resident a local family health team.",
    governanceTier: "Provincial",
    jurisdiction: "Province of Ontario • Toronto–Danforth",
    voteCount: 218,
  },

  // Federal (Canada • Toronto–Danforth)
  {
    id: "pol-fed-housing-accelerator",
    issueId: "issue-housing",
    code: "CAN-CMHC-HAF-2026",
    title: "Federal Housing Accelerator & Co-op Low-Interest Construction Financing",
    summary:
      "Direct federal per-door capital grants tied to municipal 6-storey transit corridor zoning reforms.",
    governanceTier: "Federal",
    jurisdiction: "Government of Canada • Toronto–Danforth",
    voteCount: 245,
  },
  {
    id: "pol-fed-pharmacare-dental",
    issueId: "issue-healthcare",
    code: "CAN-HEALTH-PHARMA-02",
    title: "Universal Essential Prescription & Community Dental Coverage",
    summary:
      "Expands federal universal coverage for essential medications and community dental care clinics.",
    governanceTier: "Federal",
    jurisdiction: "Government of Canada • Toronto–Danforth",
    voteCount: 198,
  },
  {
    id: "pol-fed-don-flood-fund",
    issueId: "issue-climate",
    code: "CAN-INFRA-ADAPT-11",
    title: "Federal Disaster Mitigation Co-Funding for Don River & Port Lands",
    summary:
      "40% federal matching capital commitment for East End flood protection and home heat-pump grants.",
    governanceTier: "Federal",
    jurisdiction: "Government of Canada • Toronto–Danforth",
    voteCount: 164,
  },
];

/**
 * Helper: Returns the subset of GlobalIssues that have ScopedPolicies attached at the requested governance tier(s).
 */
export function getIssuesWithPoliciesForTier(
  tierOrTiers: GovernanceTier | GovernanceTier[]
): Array<GlobalIssue & { scopedPolicies: ScopedPolicy[] }> {
  const tiers = Array.isArray(tierOrTiers) ? tierOrTiers : [tierOrTiers];
  return GLOBAL_ISSUES.map((issue) => {
    const matchingPolicies = SCOPED_POLICIES.filter(
      (p) => p.issueId === issue.id && tiers.includes(p.governanceTier)
    );
    return {
      ...issue,
      scopedPolicies: matchingPolicies,
    };
  }).filter((item) => item.scopedPolicies.length > 0);
}

export const TOP_ISSUES_BY_VOTE = [...GLOBAL_ISSUES].sort(
  (a, b) => b.voteCount - a.voteCount
);

export const FORUM_THREADS: ForumThread[] = [
  {
    id: "thread-ontario-line-mitigation",
    issueId: "issue-transit",
    issueTitle: "Transit & Complete Streets",
    scopedPolicyIds: ["pol-ontario-line-trucks", "pol-danforth-complete-street"],
    issueRank: 1,
    category: "Transit & Streets",
    title:
      "How will the next Ward 14 Councillor hold Metrolinx accountable for overnight haul truck routing on residential streets near Pape & Riverdale?",
    summary:
      "Construction trucks have been bypassing the designated arterial route and using Langley and Logan before 6:30 AM. We need binding community benefits, live noise monitoring, and dedicated municipal bylaw enforcement at school crossings.",
    authorName: "Claire Desjardins",
    authorInitials: "CD",
    authorRole: "voter",
    verifiedIdentity: true,
    precinct: "Ward 14 • Logan Ave",
    postalPrefix: "M4K",
    timestamp: "14m ago",
    recentActivityMinutesAgo: 14,
    upvotes: 342,
    commentCount: 48,
    userUpvoted: true,
    pledgeBadge: {
      label: "Endorses: Maya Lin",
      type: "candidate",
      color: "blue",
    },
    tags: ["Ontario Line", "School Safety", "Pape Village", "Q&A"],
    candidateResponded: true,
    candidateResponsesCount: 2,
    replies: [
      {
        id: "reply-maya-lin",
        authorName: "Maya Lin",
        authorInitials: "ML",
        authorRole: "candidate",
        precinctOrTitle: "Candidate • Ward 14 City Councillor",
        verifiedIdentity: true,
        verifiedCandidate: true,
        timestamp: "14m ago",
        content:
          "Thank you Claire—I walked the Logan & Langley crossing with parents from Frankland CS on Tuesday morning at 7:15 AM. If elected, my Day 1 motion mandates automated heavy-truck camera enforcement on restricted side streets, 24/7 public decibel dashboards around Pape Station, and a funded Crossing Guard expansion paid via the Construction Mitigation Reserve.",
        policyCitation: "Policy MUNI-BYLAW-14-02: Construction Accountability & Safe School Routes",
        upvotes: 164,
        helpfulCount: 118,
      },
      {
        id: "reply-david-kowalski",
        authorName: "David Kowalski",
        authorInitials: "DK",
        authorRole: "candidate",
        precinctOrTitle: "Candidate • Ward 14 City Councillor",
        verifiedIdentity: true,
        verifiedCandidate: true,
        timestamp: "42m ago",
        content:
          "We need stricter staging coordination before permits are renewed. My plan establishes a monthly Ward 14 Resident Liaison Table with binding contractor penalties whenever haul trucks deviate from Pape or Eastern Ave corridors.",
        policyCitation: "Policy MUNI-INFRA-2026-09: Infrastructure & Traffic Flow",
        upvotes: 79,
        helpfulCount: 51,
      },
      {
        id: "reply-safe-streets-org",
        authorName: "Safe Streets Coalition",
        authorInitials: "SS",
        authorRole: "org",
        precinctOrTitle: "Verified Organization • 415 Ward Voters",
        verifiedIdentity: true,
        pledgeBadge: {
          label: "Endorses: Maya Lin",
          type: "candidate",
          color: "blue",
        },
        timestamp: "25m ago",
        content:
          "Our volunteer traffic audit recorded 38 unpermitted dump trucks on Logan Ave between 5:30 AM and 7:00 AM last week. Automated camera enforcement on residential cut-throughs is essential for student safety.",
        upvotes: 43,
      },
    ],
  },
  {
    id: "thread-missing-middle-housing",
    issueId: "issue-housing",
    issueTitle: "Housing & Gentle Density",
    scopedPolicyIds: ["pol-six-storey-corridors", "pol-east-end-land-trust"],
    issueRank: 2,
    category: "Housing & Zoning",
    title:
      "Expanding 4-to-6 storey gentle density along Danforth & Gerrard transit corridors while protecting non-profit co-op affordability",
    summary:
      "Young families and seniors downsizing in M4K have almost zero mid-rise or multiplex options within walking distance of transit. Where does each candidate stand on eliminating parking minimums and fast-tracking community land trust acquisitions?",
    authorName: "More Neighbours Metro",
    authorInitials: "MN",
    authorRole: "org",
    verifiedIdentity: true,
    precinct: "Verified Organization • Ward 14 Chapter",
    postalPrefix: "M4K",
    timestamp: "38m ago",
    recentActivityMinutesAgo: 38,
    upvotes: 289,
    commentCount: 63,
    userUpvoted: true,
    pledgeBadge: {
      label: "Endorses: Maya Lin",
      type: "candidate",
      color: "blue",
    },
    tags: ["Missing Middle", "Co-op Housing", "Zoning Reform"],
    candidateResponded: true,
    candidateResponsesCount: 3,
    replies: [
      {
        id: "reply-priya-nair",
        authorName: "Priya Nair",
        authorInitials: "PN",
        authorRole: "candidate",
        precinctOrTitle: "Candidate • Ward 14 City Councillor",
        verifiedIdentity: true,
        verifiedCandidate: true,
        timestamp: "38m ago",
        content:
          "I support as-of-right 6-storey apartment permissions within 500m of all Danforth and Ontario Line stations, paired with a dedicated $25M East End Community Land Trust acquisition fund to convert at-risk rooming houses and low-rise walkups into permanently affordable co-ops.",
        policyCitation: "Policy MUNI-HOUS-2026-88: 6-Storey Transit Corridors & Co-op Protection",
        upvotes: 132,
        helpfulCount: 97,
      },
      {
        id: "reply-tariq-voter",
        authorName: "Tariq Al-Mansoor",
        authorInitials: "TA",
        authorRole: "voter",
        precinctOrTitle: "Ward 14 • Blake-Jones",
        verifiedIdentity: true,
        pledgeBadge: {
          label: "Endorses: East End Tenants Union",
          type: "org",
          color: "emerald",
        },
        timestamp: "19m ago",
        content:
          "Pairing transit corridor upzoning with the $25M East End Community Land Trust acquisition fund is the exact balance our ward needs so existing tenants aren't displaced.",
        upvotes: 54,
      },
    ],
  },
  {
    id: "thread-school-zone-safety",
    issueId: "issue-safety",
    issueTitle: "Parks & Community Safety",
    scopedPolicyIds: ["pol-school-zone-crosswalks"],
    issueRank: 3,
    category: "Parks & Safety",
    title:
      "Installing continuous raised crosswalks at Danforth & Logan / Carlaw school zones and expanding 24/7 East End Community Crisis response",
    summary:
      "Parents walking to Frankland and Withrow Park face high-speed right-hook turns every morning. Can we fast-track raised intersections in the 2027 capital works schedule alongside non-police crisis dispatch?",
    authorName: "Riverdale Parent & Resident Council",
    authorInitials: "RP",
    authorRole: "org",
    verifiedIdentity: true,
    precinct: "Verified Organization • Ward 14",
    postalPrefix: "M4K",
    timestamp: "1h ago",
    recentActivityMinutesAgo: 68,
    upvotes: 241,
    commentCount: 37,
    userUpvoted: false,
    pledgeBadge: {
      label: "Endorses: Undecided",
      type: "undecided",
      color: "slate",
    },
    tags: ["Vision Zero", "School Zones", "Community Safety"],
    candidateResponded: true,
    candidateResponsesCount: 2,
    replies: [],
  },
  {
    id: "thread-danforth-vacant-storefronts",
    issueId: "issue-main-streets",
    issueTitle: "Main Streets & Local Budget",
    scopedPolicyIds: ["pol-commercial-vacancy-levy"],
    issueRank: 4,
    category: "Local Budget",
    title:
      "Turning speculative vacant storefronts on the Danforth into pop-up community arts, youth spaces, and local small business incubators",
    summary:
      "Twelve commercial units between Broadview and Donlands have sat empty for over 3 years. Can the city pair a Commercial Vacancy Levy with short-term lease activation grants?",
    authorName: "Elena Rostova",
    authorInitials: "ER",
    authorRole: "voter",
    verifiedIdentity: true,
    precinct: "Ward 14 • Playter Estates",
    postalPrefix: "M4K",
    timestamp: "3h ago",
    recentActivityMinutesAgo: 185,
    upvotes: 176,
    commentCount: 29,
    userUpvoted: false,
    pledgeBadge: {
      label: "Endorses: Danforth Small Business Alliance",
      type: "org",
      color: "amber",
    },
    tags: ["Main Street", "Small Business", "Commercial Tax"],
    candidateResponded: true,
    candidateResponsesCount: 2,
    replies: [],
  },
];

export const SURVEY_TOPICS = [
  {
    key: "housing",
    label: "Housing & Gentle Density",
    question: "Should the city allow as-of-right 6-storey mid-rise & multiplex housing along transit corridors without costly rezoning delays?",
  },
  {
    key: "transit",
    label: "Transit & Complete Streets",
    question: "Do you commit to maintaining and extending protected bike lanes on Danforth Ave and installing raised crosswalks at all Ward 14 schools?",
  },
  {
    key: "safety",
    label: "Public Safety & Crisis Response",
    question: "How should municipal budget resources be allocated between civilian Community Crisis Service teams, youth recreation, and policing?",
  },
  {
    key: "budget",
    label: "Municipal Budget & Main Streets",
    question: "Do you support a Commercial Vacancy Tax on long-term empty storefronts to fund small business tax relief and streetscape upgrades?",
  },
];

export const CANDIDATES: CandidateProfile[] = [
  {
    id: "maya-lin",
    name: "Maya Lin",
    initials: "ML",
    roleTitle: "Candidate for City Councillor",
    raceLevel: "Councilor",
    wardOrDistrict: "Ward 14 • Toronto–Danforth",
    incumbent: false,
    verified: true,
    tagline: "Urban Planner & Transit Advocate building safer streets and Missing Middle housing.",
    avatarBg: "bg-blue-700",
    pledgeCountInWard: 1640,
    pledgeCountInPostal: 214,
    independentVotersCount: 485,
    yardSignsActive: 385,
    userPledged: true,
    topIssues: ["Housing & Gentle Density", "Transit & Complete Streets", "Parks & Community Safety"],
    keyIssueIds: ["issue-housing", "issue-transit", "issue-safety"],
    orgSupports: [
      {
        orgId: "more-neighbours",
        orgName: "More Neighbours Metro",
        shortCode: "MNM",
        voterCount: 740,
        color: "blue",
      },
      {
        orgId: "safe-streets-coalition",
        orgName: "Safe Streets Coalition",
        shortCode: "SSV",
        voterCount: 415,
        color: "blue",
      },
    ],
    bioSummary:
      "12-year municipal urban planner, former Chair of the Riverdale Traffic Safety Coalition, and board advisor to the East End Community Land Trust. Lives on Withrow Ave with her partner and two kids at Frankland CS.",
    credentials: [
      "M.Pl. Urban & Regional Planning, TMU",
      "Lead Author, East End Complete Streets Audit (2024)",
      "Former Senior Planner, Non-Profit Co-op Housing Delivery",
    ],
    files: [
      {
        id: "file-ml-1",
        fileName: "maya_lin_cv.pdf",
        size: "245 KB",
        uploadedAt: "Oct 2026",
      },
      {
        id: "file-ml-2",
        fileName: "resume.pdf",
        size: "180 KB",
        uploadedAt: "Oct 2026",
      },
      {
        id: "file-ml-3",
        fileName: "east_end_complete_streets_audit_2024.pdf",
        size: "1.4 MB",
        uploadedAt: "Sep 2026",
      },
      {
        id: "file-ml-4",
        fileName: "ward14_missing_middle_housing_platform.pdf",
        size: "820 KB",
        uploadedAt: "Oct 2026",
      },
    ],
    endorsedByOrgs: [
      "More Neighbours Metro",
      "Safe Streets Coalition",
      "Green Renewal Network",
    ],
    surveyAnswers: {
      housing: {
        topic: "Housing & Gentle Density",
        question: SURVEY_TOPICS[0].question,
        stance: "Strong Support",
        summary: "Full as-of-right 6-storey permissions near transit + fast-tracked non-profit co-op permits in 45 days.",
        quote: "We cannot solve a generational housing shortage one variance battle at a time. Let's legalize gentle density by right and back our Community Land Trusts.",
      },
      transit: {
        topic: "Transit & Complete Streets",
        question: SURVEY_TOPICS[1].question,
        stance: "Strong Support",
        summary: "Permanent concrete upgrades to Danforth bike lanes + 18 raised school crosswalks funded in 2027 capital budget.",
        quote: "Every child in Ward 14 deserves a safe walk or roll to school. Concrete protection and raised intersections save lives and help Danforth patios thrive.",
      },
      safety: {
        topic: "Public Safety & Crisis Response",
        question: SURVEY_TOPICS[2].question,
        stance: "Strong Support",
        summary: "24/7 expansion of Toronto Community Crisis Service (TCCS) in the East End + extended evening community centre hours.",
        quote: "Mental health calls require trained clinical crisis workers with <10 minute response times, paired with well-lit parks and youth programming.",
      },
      budget: {
        topic: "Municipal Budget & Main Streets",
        question: SURVEY_TOPICS[3].question,
        stance: "Strong Support",
        summary: "2% Commercial Speculation Vacancy Levy ring-fenced for independent retail tax rebates on Danforth & Gerrard.",
        quote: "Speculators sitting on dark storefronts hurt every neighbouring café and bookshop. Tax vacancy and lower the burden on active local shops.",
      },
    },
    votingRecord: [
      {
        code: "BYLAW 2025-114",
        title: "City-Wide Multiplex & Sixplex Expansion Study Testimony",
        date: "May 2025",
        vote: "YES",
        outcome: "Deputed in support at Planning & Housing Committee",
      },
      {
        code: "INFRA-2025-09",
        title: "Danforth Complete Street Permanent Concrete Bollard Upgrade",
        date: "Oct 2025",
        vote: "YES",
        outcome: "Co-authored community petition (2,400+ signatures)",
      },
      {
        code: "BUDGET-2026-02",
        title: "East End Community Crisis Service 24/7 Staffing Motion",
        date: "Jan 2026",
        vote: "YES",
        outcome: "Endorsed coalition budget submission",
      },
    ],
    mediaClips: [
      {
        id: "clip-1",
        title: "Eastminster United Town Hall: Fixing Ontario Line Construction Impacts",
        source: "CivicStream Live Debate",
        duration: "03:42",
        date: "Oct 29, 2026",
        quoteSnippet: "“Metrolinx must answer to local residents with real-time noise sensors and strict haul-route enforcement.”",
      },
      {
        id: "clip-2",
        title: "Walking Tour: How Gentle Density Keeps Families in Riverdale & Blake-Jones",
        source: "Ward 14 Policy Brief",
        duration: "02:18",
        date: "Oct 18, 2026",
        quoteSnippet: "“Fourplexes and mid-rise co-ops let grandparents downsize on the same street as their grandkids.”",
      },
    ],
    testimonials: [
      {
        id: "test-1",
        voterName: "Dr. Hannah Osei",
        voterInitials: "HO",
        precinct: "Ward 14",
        postalCode: "M4K 1N2",
        relationship: "Neighbor & School Parent Council Co-Chair",
        quote:
          "When heavy construction trucks started cutting past our school yard at 7 AM, Maya didn't just send a tweet—she showed up with traffic counters, mapped the blind spots, and got temporary bollards installed within 10 days.",
        verifiedNeighbor: true,
        upvotes: 89,
      },
      {
        id: "test-2",
        voterName: "Spiros Papadopoulos",
        voterInitials: "SP",
        precinct: "Ward 14",
        postalCode: "M4K 2P8",
        relationship: "Danforth Ave Bakery Owner (22 Years)",
        quote:
          "Maya actually listens to small business owners. Her plan to reduce the small business property tax subclass while penalizing absentee commercial landlords is exactly what the Danforth needs.",
        verifiedNeighbor: true,
        upvotes: 64,
      },
    ],
  },
  {
    id: "david-kowalski",
    name: "David Kowalski",
    initials: "DK",
    roleTitle: "Candidate for City Councillor",
    raceLevel: "Councilor",
    wardOrDistrict: "Ward 14 • Toronto–Danforth",
    incumbent: false,
    verified: true,
    tagline: "Small Business Leader & CPA focused on core road maintenance, fiscal discipline, and balanced growth.",
    avatarBg: "bg-amber-600",
    pledgeCountInWard: 1210,
    pledgeCountInPostal: 112,
    independentVotersCount: 590,
    yardSignsActive: 290,
    userPledged: false,
    topIssues: ["Main Streets & Local Budget", "Transit & Complete Streets", "Housing & Gentle Density"],
    keyIssueIds: ["issue-main-streets", "issue-transit", "issue-housing"],
    orgSupports: [
      {
        orgId: "danforth-small-biz",
        orgName: "Danforth Small Business Alliance",
        shortCode: "DSBA",
        voterCount: 620,
        color: "amber",
      },
    ],
    bioSummary:
      "Chartered Professional Accountant, former Treasurer of the Gerrard India Bazaar BIA, and 20-year homeowner in East York/Danforth. Focused on capital budget accountability and practical street repairs.",
    credentials: [
      "CPA, CA — Municipal & Infrastructure Audit Specialist",
      "Former Treasurer, Gerrard St Business Improvement Area",
      "Youth Hockey Coach, Ted Reeve Arena (11 Years)",
    ],
    files: [
      {
        id: "file-dk-1",
        fileName: "resume.pdf",
        size: "210 KB",
        uploadedAt: "Oct 2026",
      },
      {
        id: "file-dk-2",
        fileName: "cpa_municipal_audit_credentials.pdf",
        size: "340 KB",
        uploadedAt: "Oct 2026",
      },
      {
        id: "file-dk-3",
        fileName: "ward14_capital_budget_accountability_plan.pdf",
        size: "950 KB",
        uploadedAt: "Oct 2026",
      },
    ],
    endorsedByOrgs: ["Danforth Small Business Alliance"],
    surveyAnswers: {
      housing: {
        topic: "Housing & Gentle Density",
        question: SURVEY_TOPICS[0].question,
        stance: "Conditional Support",
        summary: "Supports 4-6 storeys on main arterials only; requires ward infrastructure capacity review before interior multiplexes.",
        quote: "Growth belongs on transit avenues like the Danforth, provided water, hydro, and school capacity upgrades are funded upfront.",
      },
      transit: {
        topic: "Transit & Complete Streets",
        question: SURVEY_TOPICS[1].question,
        stance: "Phased Approach",
        summary: "Supports school zone speed cameras & crosswalks; proposes redesigning pinch points on Danforth to restore 42 loading/parking spaces.",
        quote: "We can keep cyclists safe while restoring short-term delivery and customer parking bays for struggling main street merchants.",
      },
      safety: {
        topic: "Public Safety & Crisis Response",
        question: SURVEY_TOPICS[2].question,
        stance: "Conditional Support",
        summary: "Pairs dedicated neighbourhood community officers on foot patrol with co-located mental health nurses.",
        quote: "Residents and shopkeepers want visible foot patrols who know the block alongside mobile crisis health support.",
      },
      budget: {
        topic: "Municipal Budget & Main Streets",
        question: SURVEY_TOPICS[3].question,
        stance: "Strong Support",
        summary: "15% Small Business Property Tax reduction funded by auditing capital contract overruns.",
        quote: "Every dollar wasted on poorly managed road resurfacing contracts is a dollar taken from local main streets.",
      },
    },
    votingRecord: [
      {
        code: "BIA-2025-04",
        title: "Main Street Small Business Tax Subclass Reduction Proposal",
        date: "Nov 2025",
        vote: "YES",
        outcome: "Presented financial model to Executive Committee",
      },
    ],
    mediaClips: [
      {
        id: "clip-dk-1",
        title: "Line-by-Line Capital Budget Breakdown for Ward 14 Roads & Parks",
        source: "East End Civic Forum",
        duration: "04:10",
        date: "Oct 26, 2026",
        quoteSnippet: "“Why do we dig up the same stretch of Pape Ave three times in two years? Coordination saves millions.”",
      },
    ],
    testimonials: [
      {
        id: "test-dk-1",
        voterName: "Arthur Pendelton",
        voterInitials: "AP",
        precinct: "Ward 14",
        postalCode: "M4K 1R4",
        relationship: "Playter Estates Resident",
        quote: "David brings rigorous financial literacy and practical common sense on road repairs and utility coordination.",
        verifiedNeighbor: true,
        upvotes: 47,
      },
    ],
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    initials: "PN",
    roleTitle: "Candidate for City Councillor",
    raceLevel: "Councilor",
    wardOrDistrict: "Ward 14 • Toronto–Danforth",
    incumbent: false,
    verified: true,
    tagline: "Housing Rights Lawyer & Climate Organizer fighting for tenant protections, green infrastructure, and fare-free transit.",
    avatarBg: "bg-emerald-700",
    pledgeCountInWard: 1040,
    pledgeCountInPostal: 86,
    independentVotersCount: 315,
    yardSignsActive: 245,
    userPledged: false,
    topIssues: ["Housing & Gentle Density", "Climate Resilience & Flood Infrastructure", "Transit & Complete Streets"],
    keyIssueIds: ["issue-housing", "issue-climate", "issue-transit"],
    orgSupports: [
      {
        orgId: "east-end-tenants",
        orgName: "East End Tenants Union",
        shortCode: "EETU",
        voterCount: 440,
        color: "emerald",
      },
      {
        orgId: "green-renewal",
        orgName: "Green Renewal Network",
        shortCode: "GRN",
        voterCount: 285,
        color: "emerald",
      },
    ],
    bioSummary:
      "Legal clinic staff lawyer representing East End tenants for 9 years, co-founder of the Don Valley Climate Action Network, and Pape Village renter.",
    credentials: [
      "J.D., Osgoode Hall Law School",
      "Lead Counsel, East End Tenant Defence Clinic",
      "Co-Founder, Don Valley Climate Resilience Project",
    ],
    files: [
      {
        id: "file-pn-1",
        fileName: "cv.pdf",
        size: "260 KB",
        uploadedAt: "Oct 2026",
      },
      {
        id: "file-pn-2",
        fileName: "tenant_protection_bylaw_brief.pdf",
        size: "610 KB",
        uploadedAt: "Oct 2026",
      },
      {
        id: "file-pn-3",
        fileName: "don_valley_flood_resilience_plan.pdf",
        size: "1.1 MB",
        uploadedAt: "Sep 2026",
      },
    ],
    endorsedByOrgs: ["East End Tenants Union", "Green Renewal Network"],
    surveyAnswers: {
      housing: {
        topic: "Housing & Gentle Density",
        question: SURVEY_TOPICS[0].question,
        stance: "Strong Support",
        summary: "6-storey as-of-right density + strict rental replacement guarantees and $25M Community Land Trust fund.",
        quote: "New supply must never displace existing renters. Combine ambitious transit-oriented zoning with ironclad anti-renoviction enforcement.",
      },
      transit: {
        topic: "Transit & Complete Streets",
        question: SURVEY_TOPICS[1].question,
        stance: "Strong Support",
        summary: "Dedicated bus lanes on Pape & Broadview + expanded Bike Share stations in every apartment complex.",
        quote: "Fast, reliable surface transit and protected bike infrastructure are climate necessities and cost-of-living relief.",
      },
      safety: {
        topic: "Public Safety & Crisis Response",
        question: SURVEY_TOPICS[2].question,
        stance: "Strong Support",
        summary: "Reallocate budget growth into 100% civilian Community Crisis Teams, supportive housing, and 24-hour youth hubs.",
        quote: "Real community safety comes from stable housing, youth jobs, and non-police crisis response teams.",
      },
      budget: {
        topic: "Municipal Budget & Main Streets",
        question: SURVEY_TOPICS[3].question,
        stance: "Strong Support",
        summary: "Progressive commercial vacancy tax + municipal community arts & cooperative grocery leases.",
        quote: "Empty commercial blocks should be activated for local food co-ops, child care spaces, and emerging entrepreneurs.",
      },
    },
    votingRecord: [
      {
        code: "HOUS-2025-88",
        title: "Toronto Renoviction Licensing & Tenant Relocation Protection Bylaw",
        date: "Jul 2025",
        vote: "YES",
        outcome: "Drafted legal framework adopted by City Council",
      },
    ],
    mediaClips: [
      {
        id: "clip-pn-1",
        title: "Protecting Affordable Rentals Along the Future Ontario Line Corridor",
        source: "Tenant Action Town Hall",
        duration: "03:15",
        date: "Oct 24, 2026",
        quoteSnippet: "“Transit investment should lift up the people who already live and work in Pape Village, not price them out.”",
      },
    ],
    testimonials: [
      {
        id: "test-pn-1",
        voterName: "Nadia Benali",
        voterInitials: "NB",
        precinct: "Ward 14",
        postalCode: "M4J 3C1",
        relationship: "Pape Ave Apartment Tenant Representative",
        quote: "Priya helped our 44-unit building organize against an unlawful above-guideline rent hike and won.",
        verifiedNeighbor: true,
        upvotes: 71,
      },
    ],
  },
];

export const VOTING_ORGANIZATIONS: VotingOrganization[] = [
  {
    id: "more-neighbours",
    name: "More Neighbours Metro",
    shortCode: "MNM",
    category: "Housing & Urbanism Block",
    subscriberCount: 4820,
    verifiedDomain: "moreneighbours.ca",
    endorsedCandidateId: "maya-lin",
    endorsedCandidateName: "Maya Lin (Primary) • Priya Nair (Co-Endorsed)",
    slateSummary: "Endorses candidates committed to legalizing 6-storey transit corridors, multiplexes by right, and non-profit housing speedup.",
    pinnedAnnouncement: "Ward 14 Slate Alert: Why the November 21 Council vote determines our 2027 Official Plan Zoning Review.",
    keyIssues: ["6-Storey Transit Corridors", "End Parking Minimums", "Co-op Fast-Track"],
  },
  {
    id: "safe-streets-coalition",
    name: "Safe Streets & Vision Zero Coalition",
    shortCode: "SSV",
    category: "Transit & School Safety Block",
    subscriberCount: 3190,
    verifiedDomain: "safestreetsto.org",
    endorsedCandidateId: "maya-lin",
    endorsedCandidateName: "Maya Lin",
    slateSummary: "Evaluated all Ward 14 candidates on school zone speed enforcement, concrete bike lane protection, and construction truck safety.",
    pinnedAnnouncement: "Scorecard Released: Maya Lin scores 98% on our 12-point Complete Streets & School Crossing Safety audit.",
    keyIssues: ["Raised School Crosswalks", "Danforth Bike Lane Protection", "Haul Truck Cameras"],
  },
  {
    id: "danforth-small-biz",
    name: "Danforth Small Business Alliance",
    shortCode: "DSBA",
    category: "Local Merchants & BIA Block",
    subscriberCount: 1650,
    verifiedDomain: "danforthmerchants.ca",
    endorsedCandidateId: "david-kowalski",
    endorsedCandidateName: "David Kowalski & Maya Lin (Dual Qualification)",
    slateSummary: "Focused on commercial property tax reform, construction disruption compensation for Pape Ave shops, and vibrant streetscapes.",
    pinnedAnnouncement: "Read our candidate survey responses on Ontario Line small business disruption grants.",
    keyIssues: ["Small Business Tax Relief", "Construction Compensation", "Vacant Unit Activation"],
  },
];

export const ELECTION_TIERS = [
  {
    id: "Regional",
    label: "Regional / School Board",
    jurisdiction: "TDSB Ward 15 • Toronto–Danforth",
    status: "Active Election • Nov 21",
    candidatesCount: 4,
    userPledgedName: "Sonia Patel (Trustee)",
    description: "Oversees local public schools, school yard revitalization, and safe student transportation.",
  },
  {
    id: "Councilor",
    label: "Councilor",
    jurisdiction: "Ward 14 • Toronto–Danforth",
    status: "Active Election • Nov 21",
    candidatesCount: 3,
    userPledgedName: "Maya Lin",
    description: "Direct vote on zoning, local roads, bike lanes, parks, libraries, and the $17B municipal budget.",
  },
  {
    id: "Mayoral",
    label: "Mayoral",
    jurisdiction: "City of Toronto • Executive",
    status: "Active Election • Nov 21",
    candidatesCount: 5,
    userPledgedName: "Oli Chow-Chen",
    description: "Sets city-wide budget priorities, housing targets, transit expansion, and executive committee leadership.",
  },
  {
    id: "Provincial",
    label: "Provincial",
    jurisdiction: "MPP • Toronto–Danforth (Ontario)",
    status: "Next General Cycle • 2027",
    candidatesCount: 4,
    userPledgedName: "Incumbent Monitoring Mode",
    description: "Responsible for Metrolinx/Ontario Line, healthcare, education funding, and provincial housing tribunals.",
  },
  {
    id: "Federal",
    label: "Federal",
    jurisdiction: "MP • Toronto–Danforth (Canada)",
    status: "Next General Cycle • 2027",
    candidatesCount: 4,
    userPledgedName: "Incumbent Monitoring Mode",
    description: "Federal Housing Accelerator grants, national transit co-funding, child benefit, and climate policy.",
  },
];

export const CIVIC_CALENDAR_EVENTS: CivicEvent[] = [
  {
    id: "evt-debate",
    title: "Ward 14 All-Candidates Debate: Housing, Transit & Ontario Line",
    type: "Live Debate",
    dateLabel: "Tue, Nov 10",
    timeLabel: "7:00 PM – 9:00 PM",
    locationName: "Eastminster United Church Auditorium",
    address: "310 Danforth Ave (at Jackman Ave) + Live Q&A on Vote Social",
    rsvpCount: 412,
    userRsvped: true,
  },
  {
    id: "evt-advance-poll",
    title: "Advance Voting Window Open (Subdivision 14-08 Voters)",
    type: "Voting Window",
    dateLabel: "Nov 12 – Nov 15",
    timeLabel: "10:00 AM – 8:00 PM Daily",
    locationName: "Jimmie Simpson Recreation Centre",
    address: "870 Queen St E • Wheelchair Accessible • Free Childcare On-Site",
    rsvpCount: 689,
    userRsvped: true,
  },
  {
    id: "evt-canvass",
    title: "Riverdale & Blake-Jones Neighbor Canvass + Lawn Sign Delivery Run",
    type: "Volunteer & Canvass",
    dateLabel: "Sat, Nov 14",
    timeLabel: "10:30 AM – 1:00 PM",
    locationName: "Withrow Park Clubhouse South",
    address: "725 Logan Ave • Hosted by More Neighbours & Maya Lin Team",
    rsvpCount: 94,
    userRsvped: false,
  },
  {
    id: "evt-election-day",
    title: "Municipal Election Day — Official Polling Hours",
    type: "Voting Window",
    dateLabel: "Sat, Nov 21",
    timeLabel: "10:00 AM – 8:00 PM EST",
    locationName: "Earl Grey Senior Public School (Gymnasium)",
    address: "500 Strathcona Ave • Assigned Station for M4K 1N2",
    rsvpCount: 1240,
    isOfficialElectionDate: true,
    userRsvped: true,
  },
  {
    id: "evt-watch-party",
    title: "Ward 14 Community Results Night & Civic Watch Party",
    type: "Watch Party",
    dateLabel: "Sat, Nov 21",
    timeLabel: "8:00 PM – 11:30 PM",
    locationName: "The Danforth Social Hall",
    address: "642 Danforth Ave • Live Ward Turnout Tracker",
    rsvpCount: 278,
    userRsvped: false,
  },
];

export const POLLING_STATION_INFO = {
  stationName: "Earl Grey Senior Public School — Main Gymnasium",
  subdivision: "Ward 14 • Polling Subdivision 14-08",
  address: "500 Strathcona Ave, Toronto, ON M4J 1G3",
  entranceNote: "Enter via barrier-free double doors on Playter Blvd (North Courtyard)",
  distanceWalk: "6 min walk (450m from 482 Logan Ave • M4K 1N2)",
  distanceBike: "2 min ride (Bike Share dock at Strathcona & Blake)",
  hours: "10:00 AM – 8:00 PM EST (Nov 21, 2026)",
  waitEstimate: "Est. < 5 min wait (Off-peak: 11 AM – 4 PM)",
  accessibility: [
    "Barrier-Free Ramp & Power Door",
    "Audio Tactile Voting Pad Available",
    "Magnifiers & ASL Interpretation on Request",
  ],
  idRequirements: [
    "Option A: Your Voter Notification Card (sent by mail) + 1 piece of ID showing your name and M4K qualifying address",
    "Option B: 1 piece of government or utility documentation showing both your full name and qualifying Ward 14 address (Driver's Licence, Ontario Photo Card, Hydro/Enbridge bill, or Lease Agreement)",
  ],
};
