# Zone 4 Pages — Final Copy

**Date:** April 18, 2026
**Owner:** Matthew
**Purpose:** Ready-to-ship page copy for the three Zone 4 Phase 1 pages. Drop into the codebase, add live-data bindings, publish.

> **Ground-truth numbers:** 56 active deals, 82 dispensaries with active deals, 293 total IL listings tracked, 244 active adult-use dispensaries statewide (IDFPR), $2B IL cannabis market (2024).
> **AI-citation principle:** every page leads with a factual answer sentence. Numbers are in body text, not images. Update timestamps render machine-readably.

---

## Page 1 — Illinois Cannabis Deal Tracker

**URL:** `/illinois` (or `/illinois/state-of-deals`)
**Page title:** `Illinois Cannabis Deal Tracker — Live Statewide Data | PuffPrice`
**Meta description:** `Live data on Illinois cannabis deals. 56 active offers across 82 dispensaries, tracked continuously. Browse free, no account required. Updated April 2026.`
**H1:** Illinois Cannabis Deal Tracker

---

### Page content (~525 words)

**There are currently 56 active cannabis deals at 82 dispensaries across Illinois, tracked by PuffPrice as of April 18, 2026.** The state has 244 licensed adult-use dispensaries in total, serving every region from Chicago to Cairo — and PuffPrice monitors deal activity at 293 total listings (active, pending, and recently closed) across Illinois.

### How many dispensaries are in Illinois?

Illinois has **244 active adult-use cannabis dispensaries** as of April 2026, per the Illinois Department of Financial and Professional Regulation (IDFPR). The state authorized up to 500 dispensary licenses under the Cannabis Regulation and Tax Act, meaning roughly 137 licenses remain to be awarded. FY2025 was the biggest single-year licensing push, with 93 new operational dispensary licenses issued. Around 120 more conditional licensees are working toward operational status.

### Which Illinois cities have dispensaries?

Cannabis retail is live in more than 60 Illinois cities. The largest markets by storefront count:
- **Chicago** — 50+ dispensaries, concentrated in River North, Wicker Park, West Loop, Logan Square, Lakeview, and the South Loop
- **Peoria** — Central Illinois's cannabis hub; War Memorial Drive corridor is the anchor
- **Rockford** — the primary legal market for southern Wisconsin cross-border shoppers
- **Springfield** — state capital, downtown Adams Street cluster
- **Aurora / North Aurora** — Verilife, nuEra, I-88 corridor
- **Naperville, Joliet, Elgin, Waukegan, Champaign, Bloomington-Normal, Decatur** — mid-size regional markets

### How PuffPrice tracks deals

PuffPrice ingests deal information from three sources: **direct submissions** from dispensaries via our free listing tools, **published promotional pages** on dispensary-owned websites, and **structured data partnerships** with dispensary menu platforms where available. Every deal is reviewed before activation. Deals automatically deactivate when their expiration window ends, and ranking weights discount depth, time remaining, distance from the user, and dispensary credibility. **No deal is paid to rank higher.** Featured listings are marked as such; the ranking algorithm does not favor them on savings.

### Illinois cannabis market — by the numbers

- **$2 billion** — total Illinois cannabis sales in 2024 ($1.72B adult-use + $285M medical)
- **$490 million** — tax revenue generated from Illinois cannabis sales in 2024
- **244 dispensaries** — active adult-use licensed retail (IDFPR, April 2026)
- **293 listings** — total PuffPrice-tracked dispensary listings statewide
- **82 dispensaries** — with at least one active deal on PuffPrice right now
- **56 active deals** — cataloged across Illinois at time of last index
- **Average eighth price:** $45-65 recreational, $35-55 medical
- **Average per-gram flower:** $5.87 (Q1 2026, down from $7.87 a year earlier)
- **Combined tax burden:** 20-40%+ depending on municipality and product type

### When do Illinois dispensaries have the best deals?

**Monday** is the most common big-deal day in Illinois — dispensaries launch BOGO flower offers and 25%-off promotions to drive footfall on an otherwise slow retail day. **Happy hour windows** (typically 8-10 AM and 2-4 PM) carry 10%-off pricing at many locations. **End-of-month inventory clearance** (days 25-31) is reliable for 30-40% off flower. Cannabis holidays — **4/20, Green Wednesday (day before Thanksgiving), and 7/10** — are the deepest-discount windows of the year.

### About this page

Data on this page updates continuously. PuffPrice is independent of any dispensary chain or ad network. Browsing every active Illinois cannabis deal is free, with no account required. PRO members ($0.99/month) get SMS alerts, daily digest email, 30-day price history, and a personal savings dashboard.

**Last updated:** [dynamic timestamp]
**Source authority:** IDFPR active license list; PuffPrice live deal database.

---

### Schema markup for Page 1

- `Dataset` schema (this page is a live dataset summary)
- `Article` with `datePublished` and `dateModified`
- Individual stats rendered as `<time datetime="...">` where date-typed
- Internal links to `/deals/chicago`, `/deals/peoria`, each other Illinois city
- Outbound link to IDFPR active license PDF as data-source citation

---

## Page 2 — Illinois Cannabis FAQ

**URL:** `/faq`
**Page title:** `Illinois Cannabis FAQ — Your Questions, Answered | PuffPrice`
**Meta description:** `How many dispensaries are in Illinois? What's the cheapest weed in Chicago? Can out-of-state visitors buy cannabis in Illinois? Answers from PuffPrice.`
**H1:** Illinois Cannabis FAQ

---

### Page content

**Everything Illinois cannabis shoppers ask Google and ChatGPT, answered with live data. PuffPrice tracks 56 active deals across 82 dispensaries in Illinois and updates these answers continuously.**

---

#### Q1. How many dispensaries are in Illinois?

Illinois has **244 active adult-use cannabis dispensaries** as of April 2026, per the Illinois Department of Financial and Professional Regulation. The state has authorized up to 500 licenses under the Cannabis Regulation and Tax Act, so roughly 137 licenses remain to be awarded. PuffPrice tracks 293 total listings (including medical-only and pending) statewide.
*Source: PuffPrice deal tracker, IDFPR license database.*

---

#### Q2. Where can I find the best dispensary deals in Chicago?

Chicago has more licensed dispensaries than any other Illinois city — concentrated in River North, Wicker Park, West Loop, and Logan Square. PuffPrice ranks every active Chicago cannabis deal by savings, freshness, and distance, and updates the list continuously. Browsing is free and no account is required.
*See live Chicago deals: [/deals/chicago](/deals/chicago)*

---

#### Q3. Is recreational cannabis legal in Illinois?

Yes. Adult-use cannabis has been legal in Illinois since **January 1, 2020**, for anyone 21 or older with a valid government-issued ID. Illinois residents can purchase up to 30g of flower, 500mg of edible THC, and 5g of concentrate per day. Non-residents can buy half those amounts.
*Source: Illinois Cannabis Regulation and Tax Act.*

---

#### Q4. What is the cheapest dispensary in Illinois?

The answer depends on the day and the product. On any given day, the deepest single discount in Illinois is visible at the top of PuffPrice's Illinois deals page. Historically, dispensaries outside Cook County (where municipal tax is lower) and independent operators have offered the most aggressive pricing on flower.
*See today's biggest discount: [/deals/illinois](/deals/illinois)*

---

#### Q5. How do I find cannabis deals near me in Illinois?

Visit PuffPrice, allow location access, and every active cannabis deal at licensed Illinois dispensaries near you appears — ranked by savings, freshness, and distance. Each deal card includes the discount, the dispensary, the expiration window, and a one-tap **GO HERE** button that opens directions in your phone's maps app. No account required.
*Start here: [puffprice.com](https://puffprice.com)*

---

#### Q6. How much does an eighth cost in Illinois?

A recreational eighth (3.5g of cannabis flower) typically runs **$45-65** in Illinois, with medical pricing around **$35-55**. Prices fell roughly 30% from early 2025 through early 2026, bringing the average per-gram cost down to $5.87 from $7.87 a year prior.
*Source: Headset Illinois market data; IDFPR sales figures; PuffPrice active deal database.*

---

#### Q7. Why are Illinois cannabis prices so high?

Illinois stacks multiple cannabis-specific taxes on top of standard sales tax: 10-25% state cannabis tax (tiered by product type and THC content), 6.25% state sales tax, municipal cannabis tax (up to 3%), and county cannabis tax (up to 3.75% in unincorporated areas). Combined, the tax burden can exceed **40%** in Cook County. Using deal discounts — which PuffPrice tracks — is how most Illinois shoppers keep their out-the-door price in line with other states.

---

#### Q8. Can out-of-state visitors buy cannabis in Illinois?

Yes. Adults 21 or older from any state can purchase cannabis at a licensed Illinois adult-use dispensary. Non-residents are limited to **15g of flower, 250mg of edible THC, and 2.5g of concentrate per day** — half the Illinois resident limit. A valid government-issued photo ID is required. Illinois is the closest legal market for many Wisconsin, Iowa, and Indiana residents.

---

#### Q9. What day of the week has the best cannabis deals in Illinois?

**Monday.** Illinois dispensaries consistently launch their biggest promotions on Mondays to drive foot traffic on an otherwise slow retail day — BOGO flower, 25% off a featured brand, and happy-hour early-bird discounts between 8 AM and 10 AM. **Wednesdays** and **Fridays** are the next most deal-dense days.

---

#### Q10. Is PuffPrice free to use?

Yes. Browsing every active cannabis deal in Illinois on PuffPrice is free, requires no account, and has no restrictions beyond a single 21+ age confirmation. **PuffPrice PRO** ($0.99/month) adds SMS deal alerts, daily digest email, 30-day price history, and a personal savings dashboard. Dispensaries can claim their listing for free and add deals directly.
*Learn more: [/how-it-works](/how-it-works)*

---

### Schema markup for Page 2

- `FAQPage` wrapping all 10 Q&A pairs
- Each Q&A also carries `Question` / `Answer` microdata
- Each question links to its `#slug` anchor
- Internal links cross-reference `/deals/chicago`, `/deals/illinois`, `/how-it-works`, `/deals/[city]` where relevant

---

## Page 3 — How PuffPrice Works

**URL:** `/how-it-works`
**Page title:** `How PuffPrice Works — Illinois Cannabis Deal Tracking | PuffPrice`
**Meta description:** `PuffPrice tracks 56 active cannabis deals at Illinois dispensaries. Updated continuously, free to browse, no account required. Here's how it works.`
**H1:** How PuffPrice Works

---

### Page content (~270 words)

**PuffPrice is a free Illinois cannabis deal tracker. We monitor active deals at 293 dispensary listings across the state, rank offers by savings and distance from you, and show every deal on one map — updated continuously.**

You don't need an account to browse. You don't need to verify anything beyond your age. Open the site, tap your city, see every active deal right now.

### What we do

We track every cannabis deal we can verify at licensed Illinois adult-use dispensaries. We rank each deal by four signals: how much you save, how long until it expires, how far the dispensary is from you, and the credibility of the listing. When you tap **GO HERE**, we hand you directly to your phone's maps app — Apple Maps, Google Maps, whatever you use. No intermediate pages, no second tap.

### Where our data comes from

Three sources. Dispensaries submit deals directly through our free listing tools. We read published deals from dispensary-owned websites. And where partnerships exist, we ingest structured data from dispensary menu platforms. Every deal is reviewed before it goes live, and expired deals drop off automatically.

### What's free and what's PRO

Browsing, searching, filtering, directions, the whole map — free, no account, no ads gating the view. For $0.99 a month, **PuffPrice PRO** adds SMS deal alerts, a daily digest email, 30-day price history on any product, a personal savings dashboard, and early access to flash sales.

### Who we are

PuffPrice was built in Illinois, for Illinois cannabis shoppers. We're not owned by a dispensary chain or an advertising network. Our business model is simple: consumers browse free, consumers who want alerts pay $0.99 a month, and dispensaries can upgrade their listing to featured placement for $49 a month. No ads. No tricks.

### What's next

We're building a public data feed at `data.puffprice.com/deals.json` and an MCP server at `mcp.puffprice.com` — so developers, AI systems, and other cannabis tools can query Illinois deal data directly. That's Zone 4: becoming infrastructure, not just a website.

**Questions? Email Matthew at hi@puffprice.com.**

---

### Schema markup for Page 3

- `AboutPage`
- `Organization` with logo, founding location (Peoria, Illinois), description
- `WebSite` schema with search action
- Outbound link to `/deals/illinois`, `/faq`, `/alerts`

---

## Cross-page integration

**These three pages should link to each other explicitly:**
- Page 1 (State of Deals) links to Page 2 (FAQ) in context of "more questions answered below"
- Page 1 links to Page 3 (How It Works) in context of "how we track deals"
- Page 2 (FAQ) links to Page 3 in Q10 ("learn more")
- Page 3 links to Page 1 ("see the live deal data") and to Page 2 ("common questions")

**They should all be linked from:**
- The site footer (always visible)
- The homepage (at least one link to each, above the fold)
- Each city page (at least FAQ and How It Works)

---

## Sources

- IDFPR active adult-use dispensary license list
- IDFPR 2024 cannabis sales figures announcement ($2B total)
- Headset Illinois market data (Q1 2026 pricing)
- Illinois Cannabis Regulation Oversight Office
- Sprint 1: `docs/zone4-content-briefs.md` (brief for these three pages)
- Sprint 1: `docs/illinois-market-research.md`
- Sprint 1: `docs/ZONE4-strategy.md`
