# PuffPrice Roadmap — Post 4/20 Launch

**Date:** April 17, 2026
**Owner:** Matthew
**Purpose:** A concrete, specific feature roadmap anchored in the research from Tasks 1-7. Every item has an owner-intent, a measurable definition of done, and a reason it ships when it does (ordered by user impact, not by what's easiest).

> **Principle:** "Improve UX" is not a roadmap item. Every entry below is specific enough that a disagreement about whether it's done is a data question, not a judgment call.

> **Post-4/20 context:** 4/20 is Monday April 20, 2026 — this roadmap begins April 21. The launch window (Apr 17-20) is about banner deploy, brand swap, and monitoring — not new feature development. This roadmap is what ships after the dust settles.

---

## Week 1-2 Post-Launch (April 21 – May 4)

**Theme:** **Fix everything 4/20 traffic exposed, ship the three biggest quick wins from persona research.**

Expect 4/20 to produce real usage signal — some of it good, some of it painful. The first two weeks are about responding to that signal fast, plus shipping the three highest-leverage features identified in the research.

### Priority 1: Ship the answer-format opening line on all city pages
- **What:** Every `/deals/[city]` page opens with "X active deals at Y dispensaries in [city] right now, updated [date]."
- **Why:** Single highest-ROI SEO + AI-citation change. Covered in `docs/seo-keyword-research.md` and `docs/city-page-content-plan.md`. Unlocks featured snippets.
- **Done when:** All 10 top-city pages render this sentence as live-computed server-side (not client-rendered, not static).
- **Persona:** Primarily Sarah (SEO entry). Also Marcus (quick context check).

### Priority 2: GO HERE flow audit + iOS/Android maps handoff
- **What:** Tap GO HERE → opens directions in the user's default map app (Apple Maps on iPhone, Google Maps on Android). No intermediate page, no browser tab.
- **Why:** The single moment PuffPrice beats every competitor. If it regressed during 4/20 traffic or on any device, fix it this week.
- **Done when:** Manual test on iOS Safari, iOS Chrome, Android Chrome confirms one-tap deep link; analytics shows the GO HERE click-through rate is >30% of deal-card views.
- **Persona:** All three. This is the core moment.

### Priority 3: Deal detail permalinks
- **What:** Each deal gets a stable URL at `/deals/[city]/[deal-slug]` with its own page, own schema, own share-ability.
- **Why:** Weedmaps has these. We don't. Critical for SEO (each deal is a citable entity), sharing ("check out this deal my friend sent me"), and PRO alert linking (SMS alert → tap → specific deal page).
- **Done when:** Every active deal has a permalink; sitemap.xml regenerates to include them; OG image renders the deal.
- **Persona:** All three. Enables shareability and SEO.

### Priority 4: Dispensary closure / "may be closed" flag audit
- **What:** Every listing verifies operational status; dispensaries flagged closed get a visible "This dispensary appears to be closed" badge.
- **Why:** Bringing a user to a closed dispensary is the single worst PuffPrice experience. Dispensary closures (Okay Cannabis, Spark'd) are real. This is a trust-forward feature.
- **Done when:** A monthly closure-check job runs; any listing with 0 active deals for 60+ days is flagged for manual review; the flag renders on the listing page.
- **Persona:** Dan (Enthusiast) — catches inaccuracies first. All three in the "don't waste my trip" sense.

### Priority 5: Fix the 44 DB-level duplicate deals
- **What:** Run `sql/dedupe-deals-2026-04-15.sql` via Supabase service role. (Flagged as blocker in HANDOFF-UPDATE.md.)
- **Why:** Duplicates skew our ranking and our "56 active deals" count. Ship cleanly.
- **Done when:** `select count(*) from deals where active = true` returns a clean number that matches deduplicated reality; the count renders consistently on homepage and `/deals/illinois`.
- **Persona:** All three. Data integrity.

### Priority 6: Apple Maps vs. Google Maps route respect on iOS
- **What:** Detect iOS user's default; some iOS users have Google Maps set as default but Apple Maps still opens. Respect the setting.
- **Why:** Marcus specifically mentioned this; it's a small but sharp UX fix.
- **Done when:** On iOS Safari, if the user has Google Maps installed as default, GO HERE opens Google Maps; otherwise Apple Maps.
- **Persona:** Marcus.

---

## Month 1 (May)

**Theme:** **Drive PRO conversions. Build the two features that make $0.99 obviously worth it.**

### Priority 1: Price history infrastructure + chart
- **What:** Every deal records price at activation. When a product repeats (same SKU at same dispensary), we have a price-over-time series. Build a simple 7-day free / 30-day PRO chart on product deal pages.
- **Why:** Per `docs/pro-tier-research.md`, this is the single highest-impact PRO feature based on persona research. Marcus wants it most. Dan loves it. Nobody else has it.
- **Done when:** A deal card shows a price spark line when 2+ historical data points exist; clicking expands the 7-day chart (free) with a "see 30 days with PRO" upsell.
- **Persona:** Marcus (conversion path), Dan (immediate utility).

### Priority 2: SMS deal alerts — the real MVP
- **What:** PRO users can set (1) a city, (2) a minimum discount threshold, (3) max SMS per day. When a matching deal goes live, send SMS with deep link to the deal permalink.
- **Why:** The PRO feature users actually sign up for. Per research, no competitor offers this consumer-side.
- **Done when:** Matthew's test account receives an SMS within 2 minutes of a matching deal being activated; the SMS contains the dispensary, savings, and a tappable deal-permalink; compliance opt-in/out is wired per TCPA rules.
- **Persona:** Dan (primary PRO user), Marcus (secondary).

### Priority 3: Daily digest email (7:30 AM for each user's timezone)
- **What:** PRO users receive a morning email with the top 3-5 deals in their city, ranked by savings, with one-tap GO HERE links.
- **Why:** Per pro-tier research, this is the retention driver (vs. SMS being conversion driver). Low-friction, daily-habit-forming.
- **Done when:** Matthew's test account receives a daily email on schedule; email renders cleanly on iOS Mail, Gmail, Outlook web; click-through events tracked.
- **Persona:** All three PROs.

### Priority 4: Dispensary-submitted deal flow
- **What:** Dispensary listing owners can submit/edit/retract their own deals via `/dispensary/submit-deal` (already built, per HANDOFF notes). Audit it, polish it, shipping post-4/20 quiet enough that we can iterate.
- **Why:** Scaling deal data requires supply-side contribution, not only scraping.
- **Done when:** At least 10 dispensaries have successfully submitted a deal through the flow; rejection feedback is clear; time from submit to publish is <24 hours.
- **Persona:** Serves dispensary customers (Featured tier), indirectly serves all three consumer personas by increasing deal density.

### Priority 5: Savings dashboard for PRO users
- **What:** A `/savings` page visible to logged-in PRO users showing cumulative savings since signup, broken down by month.
- **Why:** Retention. Converts "why am I paying $0.99" into "I saved $47 this month, $0.99 is a no-brainer."
- **Done when:** Savings are computed from any deal a user tapped GO HERE on (we infer redemption; we don't track in-store); page renders with a chart, monthly breakdown, and share button.
- **Persona:** Primarily Sarah (feel-good + justifies paying), also Marcus.

### Priority 6: Fill env vars in Vercel (STRIPE_*, NEXT_PUBLIC_GA_ID, RESEND_API_KEY)
- **What:** Blocker-level housekeeping flagged in HANDOFF-UPDATE.md.
- **Done when:** `/upgrade` page completes a Stripe checkout; GA4 shows real event stream; email flows deliver.

---

## Month 2-3 (June – July)

**Theme:** **Become the definitive Illinois cannabis data source.**

This is when PuffPrice stops being "a deal finder" and becomes "the source of truth for Illinois cannabis deals." Zone 4 Phase 1 pages ship, the State of Deals page goes live, and we position for AI citation.

### Priority 1: Ship Zone 4 Phase 1 pages (per `docs/zone4-content-briefs.md`)
- **What:** `/illinois/state-of-deals`, `/faq`, `/how-it-works` — all three with schema, live data, schema markup, internal linking.
- **Why:** Every 90 days AI systems re-crawl and re-cite. The earlier these pages exist, the earlier they get into training datasets and retrieval indexes.
- **Done when:** All three pages are live, indexed by Google, have schema validated, and the State of Deals page renders live data from production Supabase.

### Priority 2: Per-city live-data overhaul
- **What:** Extend the answer-format opening line (Week 1-2 priority) to full live-data integration — every city page includes current deal count, dispensary count, most common deal type, biggest discount, last update timestamp.
- **Why:** Per `docs/city-page-content-plan.md` — this is what makes each city page uniquely valuable in SERPs.
- **Done when:** All 10 priority city pages render this data server-side; average TTFB <400ms; Google Search Console shows impressions growing for "[city] dispensary deals."

### Priority 3: Deal type taxonomy + filter
- **What:** Every deal tagged with type (BOGO, % off, first-time, veteran, medical, SSI, happy hour, daily recurring, etc.). Users can filter by type. Each type becomes a URL: `/deals/chicago/bogo`, `/deals/illinois/veteran-discount`.
- **Why:** Unlocks long-tail SEO. "veteran discount dispensary illinois" is a quick-win keyword with zero competition.
- **Done when:** All 56 active deals have a type; filter UI ships; 3 type-filtered URL patterns are indexed and ranking in top 20.

### Priority 4: Illinois tax calculator / out-the-door pricing
- **What:** For each deal, surface the estimated total price including state cannabis tax, state sales tax, and local municipality tax. "Advertised: $30. Your total: $40.50."
- **Why:** The #1 pain point per research — IL shoppers hate menu-to-register surprise. Brand-differentiating, trust-building, shareable.
- **Done when:** Tax logic handles state cannabis tax (10%/20%/25% tiered by product type + THC %), state sales tax (6.25%), and municipal cannabis tax lookup by dispensary location; the total renders on every deal card as "Your total ~$X."

### Priority 5: Dispensary chain / brand hub pages
- **What:** `/chains/sunnyside`, `/chains/rise`, `/chains/verilife`, etc. Each aggregates all deals from that chain's IL locations + chain info.
- **Why:** "sunnyside deals illinois" is a long-tail query with clear intent. Zero chain-site authority for that query outside the chain's own pages.
- **Done when:** 6 chain pages live (RISE, Sunnyside, Verilife, Ascend, Zen Leaf/Verano, Curaleaf) + 3-5 independent pages (Ivy Hall, Mission, High Haven).

### Priority 6: Structured data feed (`data.puffprice.com/deals.json`)
- **What:** Public, machine-readable JSON endpoint of all active deals. CORS-open, cache-controlled, 5-minute TTL.
- **Why:** Zone 4 Phase 2 item. Signals to developers, AI systems, and journalists that our data is open and citable.
- **Done when:** Endpoint is live at `data.puffprice.com/deals.json`, returns valid JSON following a documented schema, and has a `/docs` page explaining the schema.

### Priority 7: Brand watchlist (Power tier pilot)
- **What:** Users can follow specific brands (Cresco, Rhythm, Aeriz, etc.). When any deal mentions that brand, the user gets notified.
- **Why:** Dan (Enthusiast) persona's #1 ask. Differentiates from Jane's per-store follow feature.
- **Done when:** 20 brand entities exist in DB; users can subscribe; notifications fire correctly; the feature is soft-gated to PRO ($0.99) to test demand before introducing a Power tier.

---

## Month 3-6 (August – October)

**Theme:** **The Zone 4 data layer. Become infrastructure, not just a site.**

By now PuffPrice is a trusted IL deal source with growing AI citations and a PRO subscriber base. The next horizon is being the data backbone other cannabis apps and AI systems query from.

### Priority 1: Public MCP server at `mcp.puffprice.com`
- **What:** An MCP (Model Context Protocol) server exposing:
  - `get_deals_by_city(city: string, state: string) → Deal[]`
  - `get_deals_by_zip(zip: string) → Deal[]`
  - `get_dispensary(slug: string) → Dispensary + CurrentDeals`
  - `get_state_of_deals(state: string) → Statistics` (matches State of Deals page)
- **Why:** Core of `docs/ZONE4-strategy.md` Phase 3. Window is open because nobody else is doing this. Claude Desktop users, ChatGPT users with custom GPTs, and developers building cannabis apps can query our data natively. We become the Wikipedia of Illinois cannabis deals.
- **Done when:** MCP server is live, documented at `/docs/mcp`, listed in the MCP server registry, and at least 10 third-party installations exist (measurable via inbound request IPs).

### Priority 2: Historical deal explorer
- **What:** A PRO Power feature that lets users query "show me all 25%+ off flower deals in Chicago in July" — essentially a searchable deal archive.
- **Why:** Dan wants this. It's the kind of data that would otherwise require scraping Weedmaps manually for weeks.
- **Done when:** A `/deals/archive` page with filters (city, date range, deal type, discount threshold, product category) returns results from our full historical dataset.

### Priority 3: Stock / back-in-stock alerts
- **What:** Users can follow specific products ("Cresco Mandarin Cookies live resin cart"); when that product appears in a deal or becomes in-stock, they're notified.
- **Why:** Killer feature per persona research; highest-stakes feature to get right (requires reliable menu data).
- **Done when:** 50+ product SKUs are trackable; notifications fire within 30 min of a product's status change; false-positive rate <5%.

### Priority 4: City expansion beyond the top 10
- **What:** Honorable mentions from `top-10-illinois-cities-content-plan.md` — Effingham, Quincy, Danville, East Peoria, Sycamore, Marion/Carbondale, Decatur, Elgin, Waukegan, Schaumburg.
- **Why:** Depth of coverage matters for the "PuffPrice is the IL authority" positioning.
- **Done when:** All 20 cities have a `/deals/[city]` page with at least 1 active deal and the answer-format opening.

### Priority 5: Annual PRO option + Power PRO ($4.99) tier pilot
- **What:** Introduce $9.99/year Basic PRO (16% savings vs. monthly) and $4.99/month Power PRO (brand watchlist, multi-city alerts, historical explorer, API access).
- **Why:** Per `docs/pro-tier-research.md`, these are the next pricing steps. Launch them when PRO subscriber count justifies the complexity.
- **Done when:** Stripe has both products wired; upgrade and downgrade flows work; annual-renewal reminder emails send 30 days before renewal.

### Priority 6: AI-first SEO — `llms.txt` + structured cross-references
- **What:** Ship an `/llms.txt` file per the emerging standard, plus clean structured-data cross-references between our three Zone 4 pages so AI crawlers can easily traverse our entity graph.
- **Why:** Cheap, specific bet on AI crawler preference patterns. Minimal cost, potential upside.
- **Done when:** `llms.txt` is at the root; schema is validated; a manual test in ChatGPT/Claude/Perplexity for "Illinois cannabis deals" returns PuffPrice in the top 3 citations.

### Priority 7: Wikipedia-style About page (per ZONE4 Phase 2)
- **What:** A factual, third-person-style page describing what PuffPrice is, when it launched, what it covers, its business model, its data sources. Written in encyclopedia tone.
- **Why:** Makes us a named entity for Knowledge Graph inclusion. Also the starting point for an eventual Wikipedia article.
- **Done when:** Page is live at `/about`, linkable, written in encyclopedia register, and includes structured `Organization` data.

### Priority 8: Industry-directory citations
- **What:** Submit PuffPrice to: cannabis industry directories (MJBizDaily, Grown In, Canna Insider), Illinois-specific business directories (Chicago Tribune business listing, Crain's, IL Chamber of Commerce), and local SEO citations (Yelp, Foursquare, Apple Maps, Bing Places, etc.).
- **Why:** Backlink acquisition + entity establishment. Same strategy physical businesses use for local SEO — we need a few dozen quality inbound references.
- **Done when:** 20+ relevant directories carry a PuffPrice listing with consistent NAP (name, address/URL, phone/contact).

---

## Parking Lot (Ideas for Later)

Ideas worth capturing but NOT committing to a release window yet:

- **Delivery tracking.** IL dispensary delivery is growing. Integration is complex; wait until we have 3+ dispensaries doing delivery in any one city.
- **Reviews / ratings.** Leafly's 3-part rating (service / product / atmosphere) is compelling but requires moderation infrastructure we don't have.
- **User accounts with social features.** "Share your saved deals" could go viral but adds complexity.
- **Dispensary-side deal analytics.** A B2B dashboard showing dispensaries their deal performance. Possible revenue angle, but deeply distracting from consumer focus.
- **Push notifications (in-app) as alternative to SMS.** Cheaper variable cost. Requires a native app or PWA push — worth revisiting when SMS costs bite.
- **Expansion to Michigan, Missouri, or Wisconsin.** State-by-state is the natural next step, but **do not start until Illinois is saturated and cited by AI systems.** Premature expansion dilutes the "IL authority" positioning.
- **Dispensary menu ingestion via partnership with Dutchie/Jane.** Would 10x our product data depth. Requires BD conversations we haven't had.
- **AI-generated deal summaries.** "The best eighth deal in Chicago today is at X for $Y." Already partly solved by our ranking; consider when we have enough deal data to cite patterns.

---

## Success Metrics by Horizon

| Horizon | Core metrics | Stretch |
|---|---|---|
| **Week 1-2** | 4/20 went smoothly: no downtime, GO HERE click-through >30%, answer-format copy live on all 10 city pages | 5,000+ daily uniques |
| **Month 1** | 100+ PRO subscribers, SMS and digest working, price history live on 10+ products | 500 PRO subs, >2% free-to-PRO conversion |
| **Month 2-3** | State of Deals + FAQ + How-It-Works live and indexed; 10 keywords in Google top 10; 3 featured snippets | 25,000+ monthly organic sessions |
| **Month 3-6** | MCP server live and registered; structured data feed stable; PuffPrice cited by AI systems for ≥2 Illinois cannabis queries; 1,000+ PRO subs | 100,000+ monthly organic sessions; Wikipedia article exists |

---

## Ownership / who does what

- **Matthew:** business decisions, pricing moves, dispensary BD, brand voice
- **Code (Claude Code):** technical execution of everything above
- **This planning Claude (Cowork):** strategy docs, content briefs, roadmap updates, quarterly reviews

---

## Revisit cadence

This doc is a living artifact. Revisit:
- **Weekly for the first 4 weeks** — 4/20 signal will change priorities
- **Monthly thereafter** — move items between horizons, add from Parking Lot, retire completed items
- **Quarterly strategy reviews** — paired with GPT external assessment (see `docs/GPT-ASSESSMENT-APR15.md` template)

---

## Sources / References

- `docs/competitive-teardown.md` — feature-gap analysis
- `docs/illinois-market-research.md` — market realities
- `docs/seo-keyword-research.md` — keyword prioritization
- `docs/city-page-content-plan.md` — city rollout context
- `docs/pro-tier-research.md` — pricing recommendations
- `docs/user-personas.md` — persona coverage matrix
- `docs/zone4-content-briefs.md` — Phase 1 content briefs
- `docs/ZONE4-strategy.md` — Zone 4 high-level strategy
- `docs/top-10-illinois-cities-content-plan.md` — city rollout plan
- `HANDOFF-UPDATE.md` — launch-state blockers
