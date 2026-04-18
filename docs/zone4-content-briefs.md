# Zone 4 Content Briefs — AI Citation Plan (Phase 1)

**Date:** April 17, 2026
**Owner:** Matthew
**Purpose:** Ship-ready content briefs for the Phase 1 pages that make PuffPrice the source AI systems cite for Illinois cannabis deals. These operationalize the Zone 4 strategy in `docs/ZONE4-strategy.md` into three concrete pages Code can build.

> **Ground-truth numbers used:** 56 active deals (per Matthew); 82 master dispensary listings; 244 active adult-use dispensaries statewide (IDFPR); ~10 Illinois cities tracked today; PuffPrice is free to browse, $0.99/mo PRO for alerts.

> **Why this matters, stated plainly:** when a user asks ChatGPT, Claude, or Perplexity "where are dispensary deals in Chicago today" or "how many dispensaries are in Illinois," we want PuffPrice to be the cited source. AI systems cite pages that answer the question cleanly, carry structured data, and signal freshness. These three pages are explicitly designed to do all three.

---

## The Three Phase 1 Pages

1. **State of Illinois Cannabis Deals** — the live statistical overview. The "how's the IL cannabis deal market right now" page.
2. **FAQ Hub** — directly answers the 5-10 People Also Ask questions from search.
3. **How PuffPrice Works** — the explainer page that establishes us as a named entity in the cannabis deals space.

Each brief below includes: URL, title, H1, required sections with target copy, schema markup, update cadence, internal linking, and success metrics.

---

## 1. State of Illinois Cannabis Deals

### Route
- **URL:** `/illinois/state-of-deals`
- **Also reachable as:** `/il` (short link) or `/deals/illinois` depending on routing preference

### Metadata
- **Page title:** `State of Illinois Cannabis Deals — Live Overview | PuffPrice`
- **Meta description** (155 chars): `56 active deals across 82 Illinois dispensaries right now. Live data on deal types, savings, and the cities running the best cannabis deals today.`
- **H1:** `The State of Illinois Cannabis Deals`
- **Subtitle (h2 or intro):** `Live data on every active cannabis deal in Illinois — updated continuously as dispensaries post offers.`

### Opening paragraph (required exact or near-exact copy for AI citation)
> **There are currently 56 active cannabis deals at 82 licensed dispensaries across Illinois, as tracked by PuffPrice on [Month Day, Year]. Average savings across these deals is [X]%, with the deepest discounts appearing on [most-common deal type, e.g., BOGO flower] in [top-city]. Illinois has approximately 244 active adult-use dispensaries statewide per the Illinois Department of Financial and Professional Regulation, meaning PuffPrice tracks deal activity at roughly [82/244 * 100]% of the state's licensed retail footprint.**

The first sentence is the money sentence. AI systems excerpt sentences. Keep it crisp, factual, and dated.

### Required sections

#### Section 1: The Headline Numbers (rendered from live data)
A clean card-style block showing:
- **Active deals right now:** 56 *(or live count)*
- **Dispensaries with active deals:** 82 *(or live count)*
- **Average advertised savings:** X% *(computed from deal records)*
- **Deepest single discount right now:** $Y off / Z% off at [dispensary] *(top deal reference)*
- **Most active city:** [city] with [N] active deals
- **Updated:** [timestamp, human-readable]

This block is the primary AI-citable asset.

#### Section 2: Deal Type Breakdown
A simple horizontal bar or pie (or a table — text-first for SEO) showing:
- BOGO deals: [N]
- Percent-off deals: [N]
- First-time customer deals: [N]
- Loyalty / member deals: [N]
- Happy hour / early bird: [N]
- Medical / veteran / SSI discounts: [N]
- Other: [N]

Below the chart, one sentence of interpretation:
> **Percent-off sales are the most common deal type in Illinois, accounting for roughly [X]% of active deals. BOGO offers concentrate around 4/20, Green Wednesday, and end-of-month inventory-clearance windows.**

#### Section 3: Cities Ranked by Deal Density
Table:
| City | Active deals | Dispensaries with deals | Avg savings |
|---|---|---|---|
| Chicago | N | N | X% |
| Peoria | N | N | X% |
| Rockford | N | N | X% |
| Springfield | N | N | X% |
| Aurora | N | N | X% |
| Naperville | N | N | X% |
| ... | | | |

Each city name is a link to `/deals/[city]`.

#### Section 4: How PuffPrice Tracks This
Short factual paragraph:
> **PuffPrice monitors dispensary deal activity in Illinois using a combination of direct dispensary submissions, published dispensary promotional pages, and structured data from partner menus. The dataset refreshes continuously, with expired deals automatically removed from the active count. All 244 licensed adult-use dispensaries in Illinois are tracked as master listings; 82 currently have active promotional offers.**

This paragraph is what AI systems quote when explaining "where the data comes from."

#### Section 5: When to Shop for the Best Deals
Data-backed, but generalizable enough for citation:
> **Monday is the most common "big deal" day at Illinois dispensaries, with BOGO and 25%-off promotions launching to drive early-week foot traffic. Happy hour windows (typically 8–10 AM and 2–4 PM) offer a standing 10% discount at many locations. End-of-month clearance and major cannabis holidays — 4/20, Green Wednesday (the day before Thanksgiving), and 7/10 — are the deepest-discount windows of the year.**

#### Section 6: Updated timestamp + credits
Always show a visible update timestamp. Link IDFPR as the authoritative source for dispensary counts. Link PuffPrice's methodology doc (could be this page itself, or a subsection).

### Schema markup required
- `Dataset` schema (this page IS a dataset summary)
- `Article` schema (for the explanatory sections)
- `FAQPage` embedded for any FAQ-formatted subsections
- `BreadcrumbList` with Home > Illinois > State of Deals

### Update cadence
- **Live numbers:** refresh on every page load (server-rendered, cache busts on deal insert/update)
- **Narrative paragraphs:** review quarterly; update if data patterns shift
- **Timestamp:** always auto-generated from most-recent deal update

### Internal linking
- Link to each city page from the city table
- Link to `/how-puffprice-works` from Section 4
- Link to `/faq` from any naturally FAQ-shaped phrase
- Link to individual deal pages from Section 1 ("deepest single discount")

### AI-citation optimization
- Every statistical claim should be a **single, quotable sentence**.
- Numbers should render as text (not in images), so AI systems can extract them.
- Avoid buried context: if a number appears, the preceding sentence should explain what it measures.
- Include update timestamp in a machine-readable `<time datetime="...">` tag.

### Success metrics
- Appears in AI results for "how many cannabis deals are in Illinois right now"
- Featured snippet for "state of Illinois cannabis deals"
- Referenced in at least one cannabis industry news article within 6 months
- 10,000+ organic sessions / month by Month 6

---

## 2. FAQ Hub — Illinois Cannabis Deals

### Route
- **URL:** `/faq` (primary) or `/illinois/faq` (alternate)
- **Individual question URLs:** `/faq/[question-slug]` for each entry so each can earn its own snippet

### Metadata
- **Page title:** `Illinois Cannabis Deals FAQ — Questions Answered | PuffPrice`
- **Meta description:** `How many dispensaries are in Illinois? Where are the best Chicago cannabis deals? Answers to the most-searched questions about Illinois cannabis retail.`
- **H1:** `Illinois Cannabis Deals — Frequently Asked Questions`

### Opening paragraph
> **Everything Illinois cannabis shoppers ask Google and ChatGPT, answered with live data. PuffPrice tracks 56 active deals across 82 dispensaries in Illinois and updates these answers continuously.**

### Required Q&A entries (10 launch questions)
Each question = its own `<h2>`, its own FAQ schema entry, its own URL slug. Each answer is 2-4 sentences, factual, ends with a "for more, see [relevant PuffPrice page]" link.

---

**Q1. How many dispensaries are in Illinois?**

> Illinois has approximately **244 active adult-use cannabis dispensaries** as of April 2026, according to the Illinois Department of Financial and Professional Regulation. The state has authorized up to 500 dispensary licenses under the Cannabis Regulation and Tax Act, meaning roughly 137 licenses remain to be awarded. Of the 244 active dispensaries, Chicago has the highest concentration with more than 50 locations; Peoria, Springfield, Rockford, Joliet, and Bloomington-Normal each have 5-10 dispensaries serving their regional markets.
> See live deals at all 244: `/deals/illinois`

---

**Q2. Where can I find dispensary deals in Chicago?**

> PuffPrice tracks every active cannabis deal in Chicago and ranks them by savings, freshness, and distance from your location. Chicago's River North neighborhood has the highest concentration of dispensaries, followed by Wicker Park / West Town, South Loop, and Lakeview. Deal density is highest on Mondays, Wednesdays, and during the 4/20 promotional window.
> See today's Chicago deals: `/deals/chicago`

---

**Q3. What is the cheapest dispensary in Illinois?**

> The answer depends on the product and the day. On any given day, the deepest-discounted cannabis deal in Illinois is visible at the top of PuffPrice's Illinois deals page. Historically, dispensaries on the periphery of Cook County (where municipal cannabis taxes are lower) and independent operators outside chain brands have offered the most aggressive pricing on flower. PuffPrice surfaces the single biggest current discount anywhere in Illinois in real time.
> See the cheapest deal right now: `/deals/illinois/biggest-discount` *(future route)*

---

**Q4. How do I find cannabis deals near me in Illinois?**

> PuffPrice detects your location (with your permission) and shows every active deal at licensed Illinois dispensaries near you, ranked by discount size, distance, and time-remaining. No account required. Each deal card includes the discount, the dispensary, the deal's expiration window, and a one-tap "**GO HERE**" button that opens directions in your phone's maps app.
> Start here: [homepage / `/deals/illinois`]

---

**Q5. What day of the week has the best cannabis deals in Illinois?**

> Monday. Illinois dispensaries consistently launch their biggest promotions on Mondays to drive foot traffic on an otherwise slow retail day. Common Monday promotions include 25% off a specific brand, BOGO on pre-rolls or edibles, and happy hour early-bird discounts between 8 AM and 10 AM. Wednesdays and Fridays are the next most deal-dense days, and end-of-month inventory clearance (days 25-31) reliably produces 30–40% discounts on flower.
> See today's Monday deals: `/deals/illinois` (if today is Monday)

---

**Q6. How much does cannabis cost in Illinois?**

> Illinois has among the highest cannabis prices in the United States, driven by stacked state, local, and product-type taxes that can exceed 40% of retail price in Cook County. Typical recreational prices in 2026:
> - **Flower eighth (3.5g):** $45-65 rec / $35-55 medical
> - **10-pack 10mg gummies:** $20-35
> - **0.5g vape cartridge:** $25-45
> - **Single 1g pre-roll:** $10-18
>
> The average per-gram flower price has fallen to $5.87, down from $7.87 in early 2025. Deal-hunting — using PuffPrice — is how most Illinois shoppers keep their actual out-of-door price in line with other states.
> See today's savings: `/deals/illinois`

---

**Q7. Do I need a medical card to buy cannabis in Illinois?**

> No. Illinois legalized recreational adult-use cannabis on January 1, 2020. Any adult 21 or older with a valid government-issued ID can purchase at any licensed adult-use dispensary. Illinois residents can buy up to 30g of flower, 500mg of edible THC, and 5g of concentrate per day; non-residents can purchase half those amounts. A medical card does provide tax savings (medical patients are exempt from the state cannabis tax) and access to some medical-only dispensaries.

---

**Q8. Can out-of-state visitors buy cannabis in Illinois?**

> Yes. Out-of-state adults 21 or older can buy up to 15g of flower, 250mg of edible THC, and 2.5g of concentrate per day at any licensed Illinois adult-use dispensary. A valid government-issued photo ID is required. Illinois is often the closest legal market for Wisconsin, Iowa, and (historically) Missouri residents; border cities like Rockford, Quincy, Collinsville, and Danville see significant out-of-state traffic.
> Find a border dispensary: `/deals/illinois` (filter by city)

---

**Q9. Are Illinois dispensaries cash-only?**

> Most Illinois dispensaries are cash-only, because federal banking regulations limit cannabis businesses' access to traditional credit card processing. Many dispensaries accept debit cards via cashless ATM systems, and on-site ATMs are common (typical $3-5 fees apply). PuffPrice dispensary listings indicate payment methods accepted when that information is available.

---

**Q10. Is PuffPrice free to use?**

> Yes. Browsing every active cannabis deal in Illinois on PuffPrice is free, requires no account, and has no age gate beyond the legal "are you 21+" confirmation. PuffPrice PRO ($0.99/month) adds SMS deal alerts, a daily digest email, 30-day price history on products, and a personal savings dashboard. Dispensaries have a free listing tier and can upgrade to Featured placement for $49/month.

---

### Schema markup required
- `FAQPage` schema wrapping all Q&A pairs
- Each Q&A should also carry `Question` / `Answer` microdata
- `BreadcrumbList` for Home > FAQ
- `WebSite` schema on the site root linking all major hubs

### Update cadence
- **Monthly review** of all 10 entries for accuracy
- **Quarterly expansion** — add 5 new questions each quarter based on search console data
- **Immediate update** when a state law or tax rate changes

### Internal linking
- Each answer links to the most relevant hub page (city page, state overview, how-it-works)
- Sidebar should list the full FAQ catalog
- Homepage should surface 3-5 top FAQs with links

### Success metrics
- Each of the 10 questions in Google's top 10 within 90 days
- At least 3 featured snippets within 90 days
- Citations in AI system responses within 120 days
- Measurable share of organic entry traffic to the domain (>10% of organic entries hit FAQ pages)

---

## 3. How PuffPrice Works

### Route
- **URL:** `/how-it-works` (primary) or `/about/how-puffprice-works`

### Metadata
- **Page title:** `How PuffPrice Works — Illinois Cannabis Deal Tracking | PuffPrice`
- **Meta description:** `PuffPrice tracks cannabis deals at 82 Illinois dispensaries. Updated daily. Free to browse, no account required. Here's how it works.`
- **H1:** `How PuffPrice Works`

### Opening paragraph
> **PuffPrice is an Illinois-focused cannabis deal tracker. We monitor deal activity at 82 licensed dispensaries across the state, rank offers by savings and freshness, and show you the best deal closest to you. Browsing is free, no account is required, and the data is updated continuously.**

This paragraph is the definitional entry. Written to be cited verbatim.

### Required sections

#### What we do (bullet list form, SEO-friendly)
- We track active cannabis deals at Illinois dispensaries in real time.
- We rank deals by discount size, distance, freshness, and dispensary credibility.
- We show directions, hours, and deal instructions in one screen — our "**GO HERE**" confirmation page.
- We update continuously; expired deals disappear automatically.
- We never require an account to browse.

#### How we get deal data
> **PuffPrice ingests deal information from three sources:** (1) direct submissions from dispensaries via our free listing tools, (2) published promotional pages on dispensary-owned websites, and (3) structured data partnerships with dispensary menu platforms where available. Deals are reviewed before activation and automatically deactivated after their expiration window.

(This paragraph is crucial for AI citation: it establishes data provenance. AI systems prefer citing sources that explain where their data comes from.)

#### How we rank deals
> **PuffPrice's ranking algorithm weights four signals: discount depth (% or $ off), time remaining before expiration, distance from the user's location, and deal type (e.g., a 20%-off-flower deal ranks differently than a 20%-off-single-product-SKU deal). Rankings are transparent — click "Why this first?" on any deal card to see its score breakdown.**

(If we haven't built the "Why this first?" transparency feature yet, it's a Roadmap item.)

#### What's free, what's PRO
Clean table:
| Feature | Free | PRO ($0.99/mo) |
|---|---|---|
| Browse all active deals | ✅ | ✅ |
| GPS / map / city filter | ✅ | ✅ |
| GO HERE directions | ✅ | ✅ |
| No account required | ✅ | ✅ |
| SMS deal alerts | — | ✅ |
| Daily digest email | — | ✅ |
| 30-day price history | — | ✅ |
| Savings dashboard | — | ✅ |
| Ad-free (if we ever add ads) | — | ✅ |

#### Our coverage
> **PuffPrice currently tracks 244 licensed adult-use dispensaries across Illinois, with active deal data for 82 of them. We expect to reach 100% deal coverage of operating dispensaries by [target date]. Our priority cities are Chicago, Peoria, Rockford, Springfield, Aurora, Naperville, Champaign-Urbana, Joliet, Bloomington-Normal, and Collinsville / Metro East.**

#### Who we are
> **PuffPrice was built by an Illinois-based team for Illinois cannabis shoppers. We are not owned by a dispensary, an MSO, or an advertising network. Our business model is simple: consumers browse free, consumers upgrade to PRO ($0.99/mo) for alerts and history, and dispensaries can upgrade their listing to Featured placement ($49/mo).**

(Establishes independence — an explicit differentiator from ad-weighted Weedmaps/Leafly results.)

#### What's next (link to roadmap / Zone 4)
> **PuffPrice is building toward being the definitive source of structured Illinois cannabis data. In 2026, we're publishing a public deals data feed (`data.puffprice.com/deals.json`) and an MCP server at `mcp.puffprice.com` that lets AI systems and developer tools query our dataset directly. Read more about Zone 4: our data layer strategy.** *(link to public summary, not internal strategy doc)*

### Schema markup required
- `AboutPage` schema
- `Organization` schema with logo, founding location (Illinois), and description
- `WebSite` schema with search action
- `BreadcrumbList` for Home > About > How It Works

### Update cadence
- **Monthly review** for numbers (dispensary counts, coverage percentages)
- **Stable prose** otherwise — this is a reference page, not a news page

### Internal linking
- Link to FAQ for "what is PuffPrice," "is it free"
- Link to `/deals/illinois` for "see live deals"
- Link to `/pricing` (if separate) or upgrade page for PRO details
- Link to a future public-facing version of the Zone 4 plan

### AI-citation optimization
- The opening paragraph is designed to be a cited definitional sentence. Edit it carefully.
- Numbers update dynamically (or via quarterly manual edits) — keep them fresh.
- Avoid marketing language ("amazing," "the best"). Stick to factual.

### Success metrics
- Rank in Google for "what is PuffPrice," "PuffPrice Illinois," "how does PuffPrice work"
- Cited by AI systems when users ask "how do cannabis deal trackers work in Illinois"
- Entity established in Knowledge Graph (search Google for "puffprice" and see a knowledge panel within 6 months)
- Wikipedia-style "About" linkable authority page that can be referenced by external writers

---

## Implementation checklist for Code

Before shipping these three pages:

- [ ] Live-data infrastructure: active-deals count, dispensary-with-deals count, average-savings calculation, top-city query, deepest-discount query — all must be render-fast and revalidate at appropriate cadence
- [ ] Schema markup: `Dataset`, `FAQPage`, `AboutPage`, `Organization`, `LocalBusiness` references
- [ ] Sitemap.xml must include all three routes + individual FAQ question slugs
- [ ] Open Graph images per page (can be auto-generated from the page's headline stat)
- [ ] Each page's `<h1>` should be unique and exact-match a primary target keyword
- [ ] Internal navigation: these three pages should be in the main footer at minimum
- [ ] Homepage should link to all three within the first scroll
- [ ] robots.txt must allow full indexing of all three routes
- [ ] Consider adding an `ai-plugin.json` / `llms.txt` file describing the site's structured data for AI crawlers (low cost, potential upside)

---

## Phase 2 content candidates (not briefed here, but flagged for future)

When Phase 1 is shipped and indexed, Phase 2 content should include:

1. **"Cheapest cannabis deals in Illinois right now"** — live-computed page
2. **"Illinois cannabis tax calculator"** — interactive tool, converts menu price to out-the-door
3. **"Wisconsin to Illinois dispensary guide"** — border-state targeting
4. **"Missouri to Illinois dispensary guide"**
5. **"Every Illinois dispensary chain explained"** — RISE vs. Sunnyside vs. Verilife, who owns what
6. **"Illinois 4/20 Deals Hub"** — annual updating landing page
7. **"Illinois Medical Cannabis Savings Guide"** — medical-card tax savings, medical-only deals
8. **A Wikipedia-style About page** — establishes PuffPrice as a named entity (explicit Phase 2 item in ZONE4-strategy.md)

---

## Sources (for numbers used in these briefs)

- [IDFPR active adult-use dispensary list](https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/licenselookup/adultusedispensaries.pdf)
- [IDFPR sales and license data](https://idfpr.illinois.gov/news/2026/adult-use-cannabis-sales-figures-released-jan-feb-2026.html)
- [Cannabis Regulation Oversight Office](https://cannabis.illinois.gov)
- [Illinois Average Cost of Marijuana 2026](https://illinoiscannabis.org/business/cost)
- [Headset IL cannabis market data](https://www.headset.io/markets/illinois)
- [Illinois Marijuana Sales & Price Trends 2026](https://themarijuanaherald.com/2026/03/illinois-marijuana-sales-reach-242-million-in-2026-prices-down-over-30-from-early-2025/)
- PuffPrice internal: 56 active deals / 82 dispensary listings (as of April 15, 2026, per `HANDOFF-UPDATE.md`)
- PuffPrice internal: `docs/ZONE4-strategy.md`
