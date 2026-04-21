# PPG Backfill Coverage — 2026-04-21

> **Pairs with:** `sql/migrations/2026-04-21-deal-ppg-backfill.sql` (NOT YET APPLIED).
> **Context:** Per the feasibility audit, 0/100 deals have `price_per_gram` today. This pass backfills what's inferable from deal titles/descriptions alone, so the Index endpoint has a non-zero baseline and so we know exactly where the scraping work has to close the remaining gap.

## TL;DR

Only **2 of 56 active deals** have enough structured text in their title/description to infer price-per-gram without guessing. The other 54 are percent-off-a-floating-menu, meaning the anchor price lives on the dispensary's own menu page, not in the deal copy itself.

Translation: a pure "read the deal title" pass gets us 3.6% coverage. The remaining 96.4% is a scraping-pipeline problem, not a manual-entry problem.

## Coverage by category

| Category | Active deals | Inferable PPG | Hit rate |
|---|---|---|---|
| flower | 10 | 2 | 20% |
| edibles | 7 | 0 | 0% |
| concentrate | 5 | 0 | 0% |
| vapes | 3 | 0 | 0% |
| all (storewide) | 31 | 0 | 0% |
| **Total** | **56** | **2** | **3.6%** |

Only flower currently has a meaningful hit rate because flower deals occasionally quote explicit weights ("28 grams", "5 eighths"). Edibles, concentrates, and vapes deals in the current corpus are all percent-off-brand with no quantity anchor.

## The 2 inferable deals

### Deal 1 — bisa-lina-carol-stream / Simply Herb 28g for $80
- Title: `"Simply Herb 28g for $80 — code SIMPLY100"`
- Description: `"28 grams of Simply Herb brand flower for $80 — use code SIMPLY100"`
- Derivation: explicit "28g" AND "$80" in both fields. One of the cleanest data points in the corpus.
- Result: `weight_grams = 28`, `unit = 'ounce'`, `sale_price = 80`, `price_per_gram = 2.86`
- Note: $2.86/g is well below the statewide average for named-brand flower. If this price is accurate and sustainable, it's a standout deal and worth flagging on the homepage once the Index exists.

### Deal 2 — star-buds-westmont / 5 eighths for $100
- Title: `"4/20 SPECIAL: 5 for $100 flower deal"`
- Description: `"Buy any 5 eighths for $100 — 4/20 weekend only"`
- Derivation: "5 eighths" + "$100" → 17.5g for $100.
- Result: `weight_grams = 17.5`, `unit = 'eighth'`, `sale_price = 100`, `price_per_gram = 5.71`
- Caveat: this is a 4/20 promo; it will roll off after 4/20 and should be excluded from the Index's rolling average during the weekend spike week.

## Why we skipped the other 54

### Skip reason A — Percent-off-brand, no anchor price in copy (~35 deals)
Examples:
- `"Wax Wednesday — 25% off concentrates"` — the anchor is whatever price concentrates carry on that store's menu that Wednesday. Without a join to a menu snapshot, no computation possible.
- `"30% off Aeriz products — code AERIZ30"` — Aeriz products span multiple SKUs and weights; no single PPG.
- `"45% off Good Green flower"` — no weight anchor.
- `"30% off Ascend Brands — all categories"` — spans categories.

### Skip reason B — First-time / loyalty / demographic discounts (~12 deals)
Examples: `"First-time 20% off"`, `"Veterans 10% off"`, `"Senior Tuesday 15% off"`, `"Student discount 10% off"`. These are percentage discounts off whatever the customer buys — no specific product, no derivable PPG.

### Skip reason C — Storewide percent-off without weight (~5 deals)
Examples: `"30% off storewide"`, `"25% off entire first purchase"`. Same pattern as B.

### Skip reason D — Weights present but mixed / no price (~2 deals)
- `"40% off High Supply 14g & 28g flower"` — two different weights in one deal; ambiguous single PPG.
- `"45% off select flower — Daze Off Reefer Gladness 7g, Grow Science Pineapple Fruz 3.5g"` — mixed weights, percent-off, no anchor prices.

These would resolve with original_price backfill from the store's menu; that's Path B (anchor-SKU lookup table) in the feasibility audit.

### Skip reason E — Dollar-off with no anchor (~1 deal)
- `"New subscriber — $10 off via email signup"`. $10 off something — but off what? Not derivable.

## What the Index returns post-apply

Pre-apply: `{ available: false, sample_size: 0 }`.
Post-apply: `{ available: false, sample_size: 2 }` — still below the `sample_size >= 10` threshold, still returns 404 sparse at `/api/index/weekly`.

The threshold is there for a reason (2 data points is not a statistically meaningful average), so this is the expected outcome. The migration's value is:
1. Proving the end-to-end pipeline works (column → UPDATE → Index query → response).
2. Establishing the QA baseline so when the scraper starts populating at ingest time, we know what "healthy" looks like.
3. Documenting the exact gap so Matthew can prioritize the scraping-extraction work.

## What needs to change to get the Index to a meaningful number

Ranked by effort × impact:

1. **Ingest-time extraction** (recommended). Every new flower deal that lands in the scraper pipeline should have `price_per_gram` computed at ingest, not post-hoc. Target: next 2 weeks of new deals land with PPG populated. Based on Leafly/Weedmaps deal templates, ~60% will have an anchor price.

2. **Anchor-SKU lookup table** (stopgap). A `(listing_slug, product_name, weight_grams, reference_price)` table — when a percent-off deal cites a brand we know, multiply against the anchor. Gets us to ~40% coverage for the existing backlog. Hand-curation cost: maybe 4 hours for the 10 chains we actually care about (Rise, Sunnyside, Zen Leaf, Verilife, Ascend, Beyond Hello, Ivy Hall, Trinity, NOXX, nuEra).

3. **Menu-page scrape on URL resolve**. When a deal has `source_url` pointing at a Dutchie/Jane/Leafly menu, fetch the page once at ingest, extract the anchor price, persist to `original_price`. Highest coverage (~95%) but biggest engineering investment.

## Decision needed from Matthew

Pick one of:
- **A.** Go straight to ingest-time extraction. Accept the 2-week latency before the Index looks healthy.
- **B.** Build the anchor-SKU table this week. Faster to a number; more manual labor upfront.
- **C.** Defer the Index entirely until the scraper can reliably extract structured prices. Ship the scaffolding (Code Task 6) and revisit in Month 2.

Recommended: **A**, plus this migration as the baseline. Rationale: the scraper has to do this work eventually for every new deal, and doing it once — correctly — at ingest beats doing it twice (at ingest + in a backfill).
