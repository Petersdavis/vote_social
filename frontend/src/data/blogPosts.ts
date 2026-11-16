export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
  };
  readingTimeMinutes: number;
  tags: string[];
  markdown: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-local-elections-need-public-digital-infrastructure",
    title: "Why Local Elections Need Public Digital Infrastructure",
    subtitle:
      "TLDR; When running for office requires a web agency, thousands of plastic lawn signs, and ad spend on opaque social algorithms, local democracy stops being a level playing field.",
    publishedAt: "2026-11-16",
    author: {
      name: "Vote Social Editorial",
      role: "Civic Mission & Policy",
    },
    readingTimeMinutes: 5,
    tags: [
      "Civic Infrastructure",
      "Local Democracy",
      "Campaign Equity",
      "Voter Information",
    ],
    markdown: `### The Missing Public Square for Elections

Voting is a constitutional right, and the physical ballot box is treated as essential public infrastructure. Elections Canada, provincial agencies, and municipal clerks go to extraordinary lengths to ensure that every polling station is accessible, neutral, and standardized.

Yet the moment we step back from the physical ballot to ask the most basic civic question—**"Who is running in my ward, and what do they actually stand for?"**—that public infrastructure disappears.

Especially in municipal council and school board races, voters want to make a thoughtful, informed decision without spending an entire weekend piecing together dead links, partisan mailers, and fragmented social threads. Because there is no neutral digital commons where every candidate on a local ballot starts on equal footing, communicating a platform is left entirely to private campaign budgets.

### Barrier #1: The "Build Your Own Website" Tax on Candidates

Consider what happens the day a qualified community leader—a parent council chair, a transit advocate, or a small business owner—decides to run for local office.

Before they can share a single policy proposal or answer a resident's question, they are forced to act like a software startup:
* **Purchasing domains, hosting, and SSL certificates**
* **Hiring a web agency or wrestling with website templates**
* **Wiring up volunteer signups, lawn sign request forms, and compliance disclosures**
* **Competing for search engine visibility just to appear when neighbors search their ward**

Career politicians and well-funded campaign machines launch polished digital storefronts on Day 1, while grassroots candidates without technical teams or early fundraising networks remain practically invisible online.

---

### Barrier #2: Economics of Name Recognition & the Lawn Sign Arms Race

Why do local elections still revolve around hammering thousands of corrugated plastic lawn signs into neighborhood boulevards?

Because voters lack a central, trusted place to discover and compare their ward's candidates, campaigns fall back on brute-force **name recognition**. If a voter walks into the polling booth having seen only two names repeated on street corners for six weeks, those two names hold an overwhelming advantage—even if the voter knows nothing about their policy positions.

That visibility comes at a steep financial and environmental price:
1. **Upfront Capital:** Ordering, printing, staking, and distributing thousands of weatherproof signs costs thousands of dollars upfront—turning basic visibility into an early fundraising test.
2. **Zero Policy Substance:** A lawn sign communicates a name and a color scheme, not where a candidate stands on housing density, transit reliability, or school budgets.
3. **Post-Election Waste:** Days after the polls close, tons of single-use corrugated plastic are hauled straight to municipal landfills.

**From Name Recognition to Issue Recognition:**  1-click candidate summaries for local races means a voter can, in 10 seconds or less a voter, see who a candidate is,  what they stand for, and who is standing behind them.

---

### Barrier #3: The Paid Social Media Trap

To bridge the visibility gap, modern campaigns pour the remainder of their budgets into paid direct marketing on social media platforms. Centering politics on social media platforms is harmful to democracy because the interests of these for-profit companies rarely align with any true social good. 

Either:

### A. Algorithmic Bias Toward Extremism & Outrage
Commercial social feeds are engineered around a single metric: maximizing attention and time-on-site to serve more advertisements.
* Nuanced, practical local governance—debating stormwater infrastructure, bus lane priority, or municipal audit committees—does not trigger viral dopamine loops.
* Outrage, polarization, and extreme soundbites do.
* As a result, engagement algorithms systematically amplify the most divisive voices while burying substantive local policy, rewarding candidates who provoke anger over those who offer workable solutions.

### B. The Multibillion-Dollar Platform as a Vested Interest Group
Beyond how their algorithms rank content, global social media companies are not impartial referees—they are among the largest, most aggressive corporate interest groups in modern politics.
* These platforms hold direct, multibillion-dollar financial stakes in **opposing regulation**, fighting data-privacy laws, resisting algorithmic transparency, and shaping tax and competition policy.
* When democratic elections depend on their proprietary ad networks and opaque distribution rules for voter reach, the very corporations lobbying against public oversight control the megaphone of political campaigns.

Democratic elections should never have to rent attention from compromised algorithms or corporate lobbies with a vested interest in the outcome.

---

### 5. Building the Commons Together

When we treat digital election information as public infrastructure rather than a commercial ad market, both candidates and voters win:

| Dimension | Status Quo Campaigning | Vote Social Civic Commons |
| :--- | :--- | :--- |
| **Candidate Entry Cost** | High upfront spend for custom websites, SEO, and print runs | Free, standardized profile for every candidate on the ballot |
| **Primary Signal** | Paid name recognition (lawn signs & boosted posts) | Side-by-side issue stances, track records & local Q&A |
| **Information Feed** | Engagement algorithms that reward outrage & extremism | Non-partisan, ward-verified directory sorted by local issues |
| **Platform Incentives** | Multibillion-dollar ad monopolies opposing public regulation | Public-interest civic platform with zero political ad sales |

We are building **Vote Social** to give every Canadian municipality, provincial riding, and federal district a clean, non-partisan digital public square—launching full Stage 2 development as soon as our community waitlist reaches **2,500 verified signups**.
`,
  },
];
