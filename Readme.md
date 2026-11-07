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
