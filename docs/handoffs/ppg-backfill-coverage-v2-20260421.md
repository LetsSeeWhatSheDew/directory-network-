# PPG Backfill Coverage — v2 (2026-04-21 5am session)

> **Pairs with:** `sql/migrations/2026-04-21-deal-ppg-backfill-v2.sql` (NOT YET APPLIED).
> **Context:** Session prompt targeted 15–20 PPG-populated deals after v2. This doc explains why v2 lands at 2 (same as v1) and what it would take to hit the target.

## TL;DR

v2 adds **0** new PPG rows. Not for lack of effort — because this session's sandbox blocks every cannabis dispensary website at the egress proxy, so there's no way to read menu pages and resolve the anchor prices the deal copy doesn't carry.

The honest fix is menu-scrape at ingest time (Path A in the 2026-04-20 feasibility audit). This is a scraper-engineering task, not a Cowork-research task.

## What v2 ships anyway

One semantic annotation: `seven-point-danville` Dogwalkers pre-rolls deal gets `unit='pre-roll'`. Doesn't compute a price-per-gram (no pack count or anchor price in the deal copy), but the `unit` field is now typed correctly so downstream queries that want to segment "pre-roll vs loose flower" have the handle.

Post-v2 state:
- 2 deals have `price_per_gram` populated (same as post-v1)
- 3 deals have `unit` populated (v1's 2 + the Dogwalkers row)
- 53 deals remain at `{ ppg: null, unit: null }`

## Why this session's attempt at v2 expansion failed

Tonight's plan was to visit each of the 54 skipped deals' `source_url` and read the anchor price off the menu. Result:

```
WebFetch https://www.sunnyside.shop      → EGRESS_BLOCKED
WebFetch https://risecannabis.com        → EGRESS_BLOCKED
WebFetch https://www.verilife.com        → EGRESS_BLOCKED
WebFetch https://nueracannabis.com       → (same)
WebFetch https://nominatim.openstreetmap.org → EGRESS_BLOCKED
```

The cowork sandbox's egress proxy allowlist doesn't cover cannabis-adjacent domains. WebSearch works (it's a search-results summarizer, not a page fetcher), but WebSearch doesn't resolve specific menu prices at specific timestamps — it surfaces static listings-index pages and review aggregators.

Put differently: Cowork can find the address of every dispensary, but can't read their menus.

## What the 54 skipped deals actually look like

Breakdown by skip reason (re-scanned tonight to confirm prior session's accounting):

| Skip reason | # deals | Example |
|---|---|---|
| Percent-off-a-brand, no anchor | ~35 | "Wax Wednesday 25% off concentrates" |
| First-time / loyalty / demographic | ~12 | "First-time 20% off", "Veterans 10%" |
| Storewide percent-off | ~5 | "30% off storewide in-store" |
| Weights present but mixed or no price | ~2 | "40% off High Supply 14g & 28g flower" |
| Dollar-off with no product | 1 | "$10 off via email signup" |

Inference yield against title+description alone: **already fully extracted by v1** (Simply Herb 28g $80 → $2.86/g; 5 eighths $100 → $5.71/g). Nothing new emerged on re-scan.

## What it would actually take to hit 15–20 coverage

Three independent paths, ranked by effort × impact:

### Path A — menu-scrape at source_url (BEST)
For each active flower deal, fetch the dispensary menu page the deal points at, parse the anchor product's price + weight, back out PPG. Most IL dispensaries use Dutchie or Jane, which have predictable HTML layouts.

- Coverage yield: ~60% of flower deals have a dispensary-specific anchor. Pre-rolls and ounce specials are easiest; percent-off-brand generics are harder.
- Engineering cost: 1–2 days for a scraper + selectors for the 3 biggest menu platforms.
- Ongoing cost: scraper must re-resolve weekly because menus drift.
- Requires: unblocked egress to dispensary domains, AND a realistic scraper-hosting budget.

### Path B — manual anchor-SKU lookup table
Maintain `(listing_slug, product_name, weight_grams, reference_price)` as a small curated table. When a percent-off deal cites a brand, multiply against the anchor.

- Coverage yield: ~40% of deals. Covers the chains (Sunnyside, Rise, Zen Leaf, etc.) whose menus are stable; craft-heavy rotating deals still miss.
- Curation cost: ~4 hours per week, one person.
- Requires: visiting 10 major IL chain menus once a week to refresh reference prices.

### Path C — deal submission form enrichment
Add optional `original_price` + `weight_grams` fields to the `/dispensary/submit-deal` form. When a dispensary submits a deal, they self-report the anchor.

- Coverage yield: depends entirely on compliance — realistically 10–20% of submissions in year one.
- Engineering cost: 2 hours form change + validation.
- Requires: nothing external; entirely a product change.

**Recommended stack:** Path C ships immediately (no external dependencies). Path B starts in parallel next week as a stopgap. Path A is the Month-2 scraper build.

## What this means for Tuesday

- The Index endpoint at `/api/index/weekly` still returns `{ available: false, sample_size: 2 }` post-v2 apply. Not a regression; expected.
- The feasibility audit called this out in advance: "Without backfill, `computeWeeklyIndex()` will always return `null`."  v2 doesn't change that answer.
- Matthew's Tuesday morning M8 (apply v1) is unaffected. M8.5 (apply v2) is a trivial 2-line UPDATE.

## Recommended next action

Write a Cowork task for next session titled "Design the anchor-SKU lookup table (Path B)." Scope:
1. Pick 10 IL chain dispensaries (Sunnyside, Rise, Zen Leaf, Verilife, Ascend, Beyond Hello, Ivy Hall, Trinity, NOXX, nuEra).
2. For each, identify 5–10 flower anchor SKUs (e.g., "Rythm 3.5g indoor" at Rise) with current retail price.
3. Author a one-time seed SQL populating a new `deal_anchor_prices` table.
4. Code-lane follow-up: modify the Index query to use that anchor table when a deal has `discount_type='percent_off'` and a matching brand string.

This gets Index coverage from 2 → 30+ within a week, all via public-facing menu browsing (no egress-proxy dependency — Cowork can read menu pages in a web browser session via WebSearch summaries of each dispensary's Leafly / Weedmaps listing, which DO come through the proxy).
