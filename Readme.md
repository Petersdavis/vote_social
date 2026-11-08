# Vote Social

A social media platform for elections that helps voters, candidates, and voting blocks/orgs connect around local political participation.

## Project Summary

Vote Social is a civic engagement platform centered on three core user groups:

1. **Candidates**
2. **Voting blocks / organizations**
3. **Voters**

The product combines candidate discovery, local public discussion, supporter pledges, election notifications, and direct communication tools in one place.

## Core User Capabilities

### Voters can

- Learn about candidates
- Read and write opinions in a hyper-local public forum with upvote/downvote mechanics
- Pledge voting support to a candidate or a voting block
- Receive notifications about upcoming elections, including polling locations
- Subscribe to notifications from candidates, threads, and organizations on an opt-in basis
- Communicate with candidates and organizations
- Leave candidate testimonials

### Candidates can

- Share their platform
- Answer surveys
- Share their bio / CV
- Share media
- Receive lawn sign requests
- Participate in forums

### Voting blocks / organizations can

- Send blast communications to subscribers
- Pledge voting block support to a candidate list
- Publish and pin official communication within their own forum

## Product Strategy

The launch plan should be staged so we can test market viability before investing in the heavier operational and data-maintenance work.

### Stage 1: Advanced Waitlist

Goal: validate demand, messaging, and early interest before building the full platform.

Required work:

- Build waitlist screens populated with realistic fake data to communicate the future product experience
- Establish a cohesive design language that can carry into the full app
- Set up Firebase for waitlist signup capture and basic user acquisition tracking

Success criteria:

- Users understand the product concept quickly
- Signups can be captured and measured
- We can test messaging, design, and interest without building the full backend

### Stage 2: Foundation Build

Goal: implement the minimum platform infrastructure needed for a reliable first release.

Required work:

1. Build and maintain an election-cycle database
2. Build a database of municipalities, Canadian postal codes, and polling associations
3. Pre-populate known organizations and NGOs
4. Pre-populate candidates by scraping materials from Elections Canada, Ontario, and municipal sources
5. Define admin ownership rules for candidates and organizations
6. Establish stronger verification flows for user promotion and trust

### Stage 3: Trust, Verification, and Management

Goal: ensure pages and communications are trustworthy and that ownership can be validated.

Requirements:

- Some candidates / organizations may exist without an admin user and function as unmanaged pages
- Promotion of a user to admin of a candidate campaign or organization requires stricter authentication
- DNS TXT record verification on official organization / campaign domains may be required
- User verification should include:
  - IP / geolocation checks
  - Optional identity verification
  - Email verification

### Stage 4: Engagement and Growth

Goal: expand communication, participation, and retention features.

Potential follow-up work:

- Notifications and subscription controls
- Candidate-to-voter messaging workflows
- Forum moderation tools
- Testimonials and endorsements
- Election reminders and polling location guidance

## Architecture & Diagrams

### Core Domain Abstraction: Global Issues vs. Jurisdiction-Scoped Policies

To make multi-tier federalism intuitive and allow voters to connect with relevant local peers, Vote Social separates civic topics into two first-order objects:

1. **`ISSUE` (Global Scope)**:
   - Top-level forum subjects (e.g., *Housing & Gentle Density*, *Transit & Mobility*, *Healthcare Access*, *Public Safety*, *Local Economy & Main Streets*).
   - Ranked on a user's feed via a composite function of **user preferences**, **popularity (vote counts)**, and **recent activity/relevance**.
2. **`POLICY` (Fixed Governance Scope — "Slice of the Federalist Pie")**:
   - Fixed to a specific governance tier (`Municipal` / `Regional` / `Provincial` / `Federal`) and jurisdiction (e.g., *City of Toronto*, *Province of Ontario*, *Government of Canada*).
   - Policies tag Issues (`ISSUE 1 ── * POLICY`). While similar policies may exist across different municipalities or provinces, users only ever see `POLICY` records within their verified jurisdictional slice.
   - In the **Election Summary (`/<municipality>/summary`)** and **Election Center** views, selecting a level of government automatically filters to the subset of global **Issues** that have active **Policies** attached at that tier of governance.

### 1. Entity Relationship Diagram (ERD)

The data model connects geographic divisions (municipalities, postal codes, polling subdivisions) and the `ISSUE` $\rightarrow$ `POLICY` hierarchy to election cycles, candidates, voting blocks/organizations, and voter participation primitives.

```mermaid
erDiagram
    MUNICIPALITY ||--o{ POSTAL_ZONE : "contains"
    MUNICIPALITY ||--o{ POLLING_SUBDIVISION : "divides_into"
    POSTAL_ZONE }o--|| POLLING_SUBDIVISION : "maps_to"
    POLLING_SUBDIVISION ||--|| POLLING_STATION : "assigned_to"

    ISSUE ||--o{ POLICY : "tags_one_to_many"
    MUNICIPALITY ||--o{ POLICY : "scopes_local_slice"
    ELECTION_RACE ||--o{ POLICY : "debates_at_tier"
    ISSUE ||--o{ USER_ISSUE_PREFERENCE : "weighted_by"
    USER ||--o{ USER_ISSUE_PREFERENCE : "configures"

    ELECTION_CYCLE ||--o{ ELECTION_RACE : "includes"
    MUNICIPALITY ||--o{ ELECTION_RACE : "hosts"
    ELECTION_RACE ||--o{ CANDIDATE_PROFILE : "contested_by"
    POLICY ||--o{ SURVEY_QUESTION : "standardizes"
    ELECTION_RACE ||--o{ CIVIC_EVENT : "schedules"

    USER ||--o| CANDIDATE_PROFILE : "claims_and_manages"
    USER }o--o{ VOTING_ORGANIZATION : "administers"
    USER }o--|| POSTAL_ZONE : "verified_in"

    CANDIDATE_PROFILE ||--o{ SURVEY_ANSWER : "submits"
    SURVEY_QUESTION ||--o{ SURVEY_ANSWER : "answered_by"
    CANDIDATE_PROFILE ||--o{ MEDIA_CLIP : "publishes"
    CANDIDATE_PROFILE ||--o{ VOTING_RECORD : "has_history"

    VOTING_ORGANIZATION ||--o{ ORG_ENDORSEMENT : "publishes_slate"
    CANDIDATE_PROFILE ||--o{ ORG_ENDORSEMENT : "receives"

    USER ||--o{ VOTER_PLEDGE : "casts"
    CANDIDATE_PROFILE ||--o{ VOTER_PLEDGE : "receives_independent_support"
    VOTING_ORGANIZATION ||--o{ VOTER_PLEDGE : "receives_org_support"

    USER ||--o{ LAWN_SIGN_REQUEST : "requests"
    CANDIDATE_PROFILE ||--o{ LAWN_SIGN_REQUEST : "fulfills"

    USER ||--o{ TESTIMONIAL : "writes"
    CANDIDATE_PROFILE ||--o{ TESTIMONIAL : "featured_on"

    ISSUE ||--o{ FORUM_THREAD : "categorizes"
    POLICY ||--o{ FORUM_THREAD : "grounds_in_jurisdiction"
    POLLING_SUBDIVISION ||--o{ FORUM_THREAD : "scopes"
    USER ||--o{ FORUM_THREAD : "authors"
    FORUM_THREAD ||--o{ FORUM_REPLY : "contains"
    USER ||--o{ FORUM_REPLY : "posts"
    CANDIDATE_PROFILE ||--o{ FORUM_REPLY : "answers_officially"
    ISSUE ||--o{ ISSUE_VOTE : "ranked_by"
    USER ||--o{ ISSUE_VOTE : "votes_on"

    USER ||--o{ SUBSCRIPTION : "opts_into"
    CANDIDATE_PROFILE ||--o{ SUBSCRIPTION : "notifies"
    VOTING_ORGANIZATION ||--o{ SUBSCRIPTION : "broadcasts_to"
    FORUM_THREAD ||--o{ SUBSCRIPTION : "alerts"

    ISSUE {
        uuid id PK
        string slug
        string title "Global in scope"
        int global_popularity_score
        int local_vote_count
        timestamp last_activity_at
    }

    POLICY {
        uuid id PK
        uuid issue_id FK "Tags parent global Issue"
        string governance_tier "Regional | Councilor | Mayoral | Provincial | Federal"
        string jurisdiction_id "Scoped to user federalist slice"
        string code
        string title
        string summary
    }

    USER {
        uuid id PK
        string email
        string full_name
        string postal_code FK
        string verification_tier "email | geo_ip | id_verified | dns_admin"
        string active_pledge_badge
    }

    CANDIDATE_PROFILE {
        uuid id PK
        uuid election_race_id FK
        uuid claimed_by_user_id FK "nullable for unmanaged pages"
        string name
        string bio_cv
        string platform_summary
        string verified_domain
        int independent_voter_count
        boolean is_claimed
    }

    VOTING_ORGANIZATION {
        uuid id PK
        string name
        string category
        string verified_domain "DNS TXT verified"
        string pinned_announcement
        int subscriber_count
    }

    ELECTION_RACE {
        uuid id PK
        uuid election_cycle_id FK
        string tier "Regional | Councilor | Mayoral | Provincial | Federal"
        string district_name
        date election_date
    }

    FORUM_THREAD {
        uuid id PK
        uuid issue_id FK
        uuid policy_id FK
        uuid subdivision_id FK
        uuid author_user_id FK
        string title
        int vote_score
        timestamp recent_activity_at
    }
```

---

### 2. Sitemap & User Actions

The sitemap below outlines the navigation hierarchy from the Stage 1 Waitlist through the 3 core product hubs and role-specific actions for **Voters**, **Candidates**, and **Voting Blocks / Organizations**.

```mermaid
flowchart TD
    subgraph Public["Public & Stage 1 Waitlist"]
        Landing["/ — Waitlist Landing Page"]
        ActWaitlist["Action: Select Role, Enter Postal Code + Email"]
        AuthVerify["/onboarding — Geo/IP, Email & Postal Verification"]
        Landing --> ActWaitlist
        ActWaitlist --> AuthVerify
    end

    subgraph CoreApp["Core Civic Application (Scoped by Federalist Slice & Postal Code)"]
        direction TB

        subgraph Screen1["1. Election Summary & Issue Feed (/<municipality>/summary)"]
            CandidateRow["Top Row: Candidate Summary Cards (Key Issues, Org Supports + Voter Counts, Independent Voters Badge)"]
            IssueActivityFeed["Left Column: Searchable Feed of Issues by Recent Activity & Scoped Policies"]
            TopIssuesByVote["Right Column: Simplified Top Issues by Vote (Issue Links & Vote Counts)"]
            CandidateQA["Verified Candidate Q&A & Policy Citations"]
        end

        subgraph Screen2["2. Candidate & Ballot Intelligence Hub (/screens/candidate-hub)"]
            SurveyMatrix["Side-by-Side Issue & Policy Survey Matrix"]
            CandidateDossier["Candidate Profile (Bio/CV, Voting Record, Media)"]
            OrgGuides["Organization Voter Guides & Slates"]
            TestimonialsDM["Peer Voter Testimonials & Direct Messaging"]
        end

        subgraph Screen3["3. My Action & Election Center (/screens/election-center)"]
            TierTabs["Tiered Race Tabs (Regional, Councilor, Mayoral, Prov, Fed)"]
            TierIssues["Subset of Global Issues with Policies at Selected Governance Tier"]
            CandidateSnaps["Candidate Snapshots & Key Issues"]
            CivicActions["1-Click Civic Actions (Vote Pledge & Yard Sign Request)"]
            CivicCalendar["Dynamic Civic Calendar (Debates, Advance Polls, Watch Parties)"]
            PollLocator["Interactive Polling Place Map, Hours & Voter ID Guide"]
        end
    end

    subgraph RoleActions["User Group Actions & Workflows"]
        direction TB
        VoterActor["Voter Actions"]
        CandidateActor["Candidate Actions (DNS / ID Verified)"]
        OrgActor["Voting Block / Org Actions (DNS TXT Verified)"]
    end

    AuthVerify --> Screen1
    AuthVerify --> Screen2
    AuthVerify --> Screen3

    %% Voter Actions
    VoterActor -->|"Browse candidate cards, filter issue feed, vote on issues"| IssueActivityFeed
    VoterActor -->|"Jump to top issues by vote count"| TopIssuesByVote
    VoterActor -->|"Compare stances, watch clips, write testimonials, DM candidate"| SurveyMatrix
    VoterActor -->|"Subscribe to org slates & thread alerts"| OrgGuides
    VoterActor -->|"Pledge vote, request lawn sign, RSVP to debate, locate poll"| CivicActions

    %% Candidate Actions
    CandidateActor -->|"Claim unmanaged profile via domain/ID verification"| CandidateDossier
    CandidateActor -->|"Submit standardized survey answers, bio/CV & media clips"| SurveyMatrix
    CandidateActor -->|"Post highlighted Official Candidate Q&A replies on local policies"| CandidateQA
    CandidateActor -->|"Fulfill neighborhood lawn sign delivery queue"| CivicActions

    %% Voting Block / Organization Actions
    OrgActor -->|"Verify official domain via DNS TXT record"| OrgGuides
    OrgActor -->|"Publish endorsed candidate slate & voter alignment counts"| CandidateRow
    OrgActor -->|"Pin official announcements & send opt-in subscriber blasts"| OrgGuides
```

## Roadmap

### Near term

- Define the visual system and UX patterns for the waitlist experience
- Create high-fidelity mock screens using fake data
- Stand up Firebase signups and basic analytics

### Mid term

- Design the election data model
- Define geo/polling-location lookup data structures
- Build import and maintenance workflows for municipalities, candidates, and organizations

### Longer term

- Build verification and admin-claim flows
- Add communication and subscription features
- Add moderation, trust, and safety tooling
- Expand candidate, voter, and organization participation features

## Open Questions

- What is the initial geographic scope: one municipality, one province, or all of Canada?
- What data sources will be authoritative for election cycles and polling information?
- What level of moderation will the public forum require at launch?
- Which features are required for the first public beta versus later releases?

## Notes

Further issues will likely emerge downstream as the product, data model, and trust systems mature.
