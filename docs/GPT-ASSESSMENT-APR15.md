# PuffPrice Strategic Assessment — April 15, 2026

**Prepared by:** Cowork research/strategy pass, April 17, 2026
**Owner:** Matthew Burns · matthew@jacarandapeoria.com
**Purpose:** External-review document for GPT strategic assessment. Synthesizes findings from a 9-task competitive research + strategy sprint. Supporting detail in `docs/competitive-teardown.md`, `docs/illinois-market-research.md`, `docs/seo-keyword-research.md`, `docs/city-page-content-plan.md`, `docs/pro-tier-research.md`, `docs/user-personas.md`, `docs/zone4-content-briefs.md`, `docs/ROADMAP.md`.

---

## Product State

PuffPrice is an Illinois-focused cannabis deal aggregator, 48 hours pre-4/20 launch. It tracks **56 active deals across 82 dispensary listings** in a state with **~244 active adult-use dispensaries** (IDFPR). The core user flow — GPS detection → city filter → deal-ranked grid → one-tap **GO HERE** directions — works end-to-end and was verified clean on April 15. The tech stack is Next.js 16 on Vercel with Supabase as the data layer; Stripe is wired for a $0.99/month PRO consumer tier and a $49/month Featured dispensary tier.

What works today: the GO HERE flow (directions in one tap), GPS + city filter throughout, the human-language copy overhaul completed this sprint, the deal-ranking algorithm (discount-first, no $0 savings, no duplicate expiration labels), and the listing-page-as-GO-HERE-confirmation design. The 4/20 banner auto-deploys Friday April 17. The user journey was walked end-to-end and declared clean.

What's not yet shipping: the brand swap from CleanList to PuffPrice (domain being registered tonight), PRO payment flow in production (env vars missing), SMS alerts (infrastructure not yet wired), and the Zone 4 content pages (this sprint's briefs are ship-ready but not built). Forty-four DB-level duplicate deals are flagged and need a manual service-role run. Of the 244 state dispensaries, we have deal coverage at 82 — so coverage is ~34% of licensed retail footprint. That's a credible starting position but leaves real room.

## Market Opportunity

The Illinois cannabis market is one of the highest-taxed and highest-priced in the country. Typical recreational eighths run $45–65, and Cook County's stacked tax burden can push effective tax over 40%. Flower has fallen ~30% from early 2025 to an average $5.87/gram, but IL shoppers remain price-sensitive relative to WI-border, MO-border, and MI-import comparisons. Six MSOs (GTI/RISE, Cresco/Sunnyside, Verano/Zen Leaf, PharmaCann/Verilife, Ascend, Curaleaf) control the bulk of the market, and independents like Ivy Hall round out regional coverage.

The competitive gap is specificity and freshness. Weedmaps and Leafly dilute IL across 30-state directories and sort by ad tier, not deal quality. Dutchie and Jane are per-dispensary menu platforms that silo deals by store; cross-dispensary comparison is architecturally impossible on their products. Cannasaver and similar coupon aggregators are alive but stale — 2012-era UX, no GPS, no freshness signals. **No existing product is the state-specific, GPS-aware, freshness-ranked Illinois cannabis deal source.** That's the lane PuffPrice is moving into.

Consumer-side: there is currently no paid-subscription cannabis deal app for end users. Every incumbent is free (ad- or B2B-funded). Cannabis SMS alert services exist — but they all sell to dispensaries, not consumers. PuffPrice PRO at $0.99/month is inventing a product category rather than competing in one. That changes the pricing conversation entirely.

## User Insights

Three personas emerged from the research. **Marcus (31, Chicago, regular user)** uses PuffPrice to pick between 3-4 known dispensaries for tonight — he needs speed, trust in ranking, and GO HERE reliability. Price history is his gateway to PRO. He'll never tolerate SMS. **Sarah (27, Naperville, occasional user)** never downloads apps — she Googles "dispensary deals naperville" on Friday afternoons and needs our city pages to answer her question in the first three seconds. She's the SEO user and the organic-growth engine. **Dan (44, Bloomington-Normal, enthusiast)** juggles four apps today to do what PuffPrice should do in one. He'll pay $4.99/month instantly for brand watchlists, stock alerts, and historical deal explorers. He owns the r/ILTrees conversation; making him happy is acquisition leverage.

The common thread: every persona uses PuffPrice in a parking lot at least some of the time. None of them tolerate slow load, forced accounts, or inaccurate data. The single most dangerous failure mode is driving a user to a closed dispensary or an expired deal — Dan stops trusting us; Sarah never comes back; Marcus quietly uninstalls.

The single biggest user pain point across all personas is **menu/inventory inaccuracy**. Users see a deal on Weedmaps, drive to the store, discover the product is out of stock. This is the most common complaint in cannabis forums, and it's what PuffPrice's freshness-first design is meant to avoid. Holding the line on data quality is strategic, not cosmetic.

## Gaps vs. Competitors

We beat every direct competitor on **state specificity, freshness signal, GO HERE flow, and no-account access.** We're uncontested on **Zone 4 — MCP/API data feed for AI citation.** We also beat Weedmaps and Leafly on decision speed: our answer is visible before theirs has finished rendering paid placements.

Where competitors currently do something we don't:

- **Deal detail permalinks.** Weedmaps and Leafly give each deal its own URL. We should ship this in Week 1-2 post-launch — it's low-effort, high-leverage for SEO and sharing.
- **In-store vs. online deal typing.** Weedmaps explicitly flags "show this to your budtender" vs. "apply at checkout." We should add a redemption-type field on every deal.
- **Deal type taxonomy landing pages.** Leafly has named deal types (first-time, veteran, birthday, happy hour) that each become an SEO anchor. We should build these as filterable landing pages — low volume each, high aggregate.
- **3-part review ratings.** Leafly splits reviews into service / product / atmosphere. Worth copying as social-proof infrastructure matures.
- **Shop-by-effect for edibles/tinctures.** Jane does this well. Worth a category-specific version for IL.
- **Product-level price + strike-through original.** Dutchie shows "was $50, now $35." When our deal metadata supports it, we should mirror the visual language.
- **Real product photos.** Dutchie has the best product-image library in cannabis. We should build a thin product-keyed photo layer where feasible.

Where we should deliberately NOT match competitors:

- Don't add account-gated browsing. Competitors do this because they want ad targeting; we don't.
- Don't weight ranking by paid placement. It erodes trust — our whole differentiation.
- Don't expand to multiple states before IL is saturated. Dilutes positioning.

## Recommended Priorities (Next 30 Days)

1. **Ship the answer-format opening line on every city page.** "X active deals at Y dispensaries in [city] right now, updated [date]." This one sentence is the single highest-ROI change for SEO + AI citation. Every city page already exists; this is a copy + server-render change.
2. **Deal detail permalinks + deal type taxonomy.** `/deals/[city]/[deal-slug]` per deal, plus `/deals/illinois/bogo`, `/deals/chicago/veteran-discount`, etc. Low effort, unlocks long-tail ranking + AI-citable per-deal pages.
3. **Ship price history infrastructure + 7-day free / 30-day PRO chart.** This is the PRO conversion feature per persona research. Marcus and Dan both cite it as their #1 unmet need. No competitor has it.
4. **Ship SMS alerts for PRO.** Geofenced, price-threshold, brand-match. The flagship PRO feature. $0.99/month makes zero sense without this working.
5. **Ship Zone 4 Phase 1 pages per `docs/zone4-content-briefs.md`.** State of Illinois Cannabis Deals, FAQ Hub, How PuffPrice Works. These are the pages AI systems will cite, and the sooner they exist the sooner they enter training datasets and retrieval indexes.

A worthy #6 if capacity permits: run the duplicate-deal dedupe SQL, finalize env vars in Vercel, wire Stripe, and deploy the updated CLAUDE.md / HANDOFF-UPDATE.md references to the public brand.

## PRO Tier Recommendation

**Keep $0.99/month through the first 90 days.** Do not raise it pre-launch.

The research is clear: cannabis has **no consumer-paid deal app competition today.** Every incumbent is free. That means PuffPrice is creating the price, not meeting a market price. $0.99 is psychologically sub-impulse and makes "should I try this?" a trivial yes; the brand voice (pro-consumer, anti-rip-off) is reinforced by the low price; word-of-mouth works better at "it's a dollar" than at any other price point.

The case against $0.99 is real but second-order: Stripe eats ~33% of each transaction at that price, and SMS variable costs could erode the margin on heavy users. Both are real, neither outweighs the category-creation strategic value at launch.

**Plan for $4.99/month Power PRO** (brand watchlist, multi-city alerts, historical explorer, API access) as a Month 3+ addition when the base tier proves demand. **Plan for $9.99/year annual Basic PRO** at Day 60-90 for cash flow and retention lock-in. Do not bundle annual into launch — users need to experience monthly before they trust annual.

Two features are non-negotiable for PRO at any price: SMS alerts that actually fire correctly, and price history that nobody else has. Without those, $0.99 is also too much.

## Zone 4 Progress

Phase 1 (seeding) from `docs/ZONE4-strategy.md`: ready to ship. `docs/zone4-content-briefs.md` contains ship-ready content briefs for the three Phase 1 pages — State of Illinois Cannabis Deals, FAQ Hub, How PuffPrice Works. Each has the required schema markup, opening copy, live-data hooks, and success metrics. These should land in Month 1-2 and are the AI-citation cornerstone.

Phase 2 (entity): Wikipedia-style About page, industry directory submissions, and `data.puffprice.com/deals.json` public feed. Each is a Month 2-3 target.

Phase 3 (MCP / API layer): the public MCP server at `mcp.puffprice.com` is the Month 3-6 ambition. No competitor is building toward this. The window is genuinely open. Weedmaps has no incentive — their business model is keeping users on-platform; our business model is being wherever the user is, including inside an AI answer.

One structural change to flag for Zone 4 readiness: we need to finalize a deal-type taxonomy (BOGO, % off, first-time, vet, medical, SSI, happy hour, daily-recurring, clearance, dollar-off) and a redemption-type field (in-store, online, loyalty-coded, auto-by-segment) on every deal. This is what AI systems want structured. The Month 1 roadmap calls for it explicitly.

---

## Questions for GPT Review

1. **Does the $0.99 PRO price make sense given the market?** The case for keeping it is strategic (category creation, impulse threshold, brand voice). The case against is economic (Stripe fees + SMS variable cost). Is there a framing in which raising to $2.99 or $4.99 at launch is clearly correct, or is holding at $0.99 through the first 90 days the right call?

2. **Are we missing any obvious features for the core use case?** The core user is in a parking lot choosing between 3-4 dispensaries or searching "dispensary deals [city]" on Friday. Given that, is there a feature we should be shipping that isn't in the 30-day priority list or the Month 1-3 roadmap? Be blunt — we have more capacity than we have perspective.

3. **What's the fastest path to being cited by AI systems for Illinois cannabis deals?** Zone 4 Phase 1 pages + schema + freshness are our working hypothesis. Is there a lower-cost / higher-yield tactic we're missing — e.g., an `llms.txt` convention, structured press placements, direct submission to a specific AI provider's data program, or a specific type of linkable artifact that AI crawlers preferentially cite?

4. **Is "Illinois-only" the right geographic constraint, or should we start building the multi-state architecture now so we can drop in Michigan or Wisconsin in Month 6?** Arguments both ways — the focus is our strength, but a data layer that only handles one state is harder to be "the cited AI source" for the broader category.

5. **On the personas — are we underweighting anyone?** Specifically: the medical cannabis patient persona, the elderly / caregiver persona, the daily microdose / wellness persona. Do those warrant distinct product consideration, or are they served adequately by Marcus/Sarah/Dan framing?

6. **What's the biggest risk to this strategy we haven't named?** Regulatory change (more than hypothetical — IL cannabis law is still politically contested), MSO pushback (dispensary chains could lean on ad platforms to deprioritize us), Google algorithm change (could wipe SEO gains), or AI-citation patterns evolving away from structured pages? Rank these or add what we're missing.

---

## Appendix: Key Numbers

- **56** active cannabis deals tracked by PuffPrice (April 15, 2026 snapshot)
- **82** dispensary listings with active deals
- **244** active adult-use dispensaries statewide (IDFPR)
- **~34%** of IL licensed retail covered by our active-deal data
- **$0.99/month** current PRO price
- **$49/month** current Featured dispensary tier
- **$45-65** typical IL eighth price (rec)
- **$5.87/gram** IL flower average (Q1 2026)
- **20-40%+** IL combined cannabis tax burden
- **Monday** most common big-deal day
- **4/20 in 2026 = Monday April 20** (launch window is 4/17 Fri → 4/20 Mon)
- **Next milestone:** register puffprice.com domain, brand swap, PRO payment flow live

---

## Appendix: Doc Index

| Doc | Contents |
|---|---|
| `docs/competitive-teardown.md` | Weedmaps, Leafly, Dutchie, iHeartJane, IL-specific sites — UX breakdowns + gap matrix |
| `docs/illinois-market-research.md` | Dispensary counts, MSO landscape, deal types, prices, timing |
| `docs/seo-keyword-research.md` | Keyword clusters, competitive SERP analysis, 90-day / 6-month / 12-month prioritization |
| `docs/city-page-content-plan.md` | Chicago, Peoria, Rockford, Springfield, Aurora — answer lines, landmarks, neighborhoods |
| `docs/pro-tier-research.md` | Pricing recommendation, feature-by-feature analysis, Reddit sentiment themes |
| `docs/user-personas.md` | Marcus, Sarah, Dan — with persona coverage matrix and anti-personas |
| `docs/zone4-content-briefs.md` | Phase 1 content briefs for State of Deals, FAQ, How It Works |
| `docs/ROADMAP.md` | Week 1-2, Month 1, Month 2-3, Month 3-6 specific deliverables |
| `docs/ZONE4-strategy.md` | Existing 3-phase Zone 4 plan (pre-existing doc) |
| `docs/top-10-illinois-cities-content-plan.md` | Existing city prioritization doc (pre-existing) |
| `HANDOFF-UPDATE.md` | Sprint state, blockers, stack, launch plan (pre-existing) |
