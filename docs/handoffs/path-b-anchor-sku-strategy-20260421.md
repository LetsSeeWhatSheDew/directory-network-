# Path B — Anchor-SKU Lookup Strategy (2026-04-21 afternoon Cowork)

> **Pairs with:** `sql/migrations/2026-04-21-anchor-skus.sql` (NOT YET APPLIED), `scripts/compute-ppg-from-anchors.ts`.
> **Background:** `docs/handoffs/ppg-backfill-coverage-v2-20260421.md` enumerated three paths to expand PPG coverage. This document operationalizes Path B.

## TL;DR

Path B ships a curated reference table of 27 IL flower / pre-roll anchor SKUs across 8 parent companies. A node script joins percent-off-brand deals to that table and back-computes a price-per-gram. Realistic coverage gain: **10–15 additional deals get a PPG** on first run (from 2 → 12–17), enough to flip the PuffPrice Index endpoint from `available:false` to `available:true` (threshold is 10).

This is the **stopgap** between today (egress proxy blocks live menu fetch, Path A scraper is a Month-2 build) and the eventual Path A automated scraper.

## When to run

After Matthew applies these in order:

1. `sql/migrations/2026-04-20-deals-price-normalization.sql` (adds `weight_grams`, `brand`, `thc_percent`, `product_name` columns)
2. `sql/migrations/2026-04-21-anchor-skus.sql` (creates `anchor_skus` table + 27-row seed)

Then run:

```
# Dry run (safe, no writes — read with anon key only):
npx tsx scripts/compute-ppg-from-anchors.ts

# After review of dry-run output, apply to DB (service role required):
SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/compute-ppg-from-anchors.ts --apply
```

The script is idempotent (only touches deals where `price_per_gram IS NULL`), so re-running after adding new anchor rows or new deals is safe.

## What it can resolve

A deal is resolvable if **all three** are true:

1. **Brand resolvable:** either `deals.brand` is populated, or the title/description contains a recognized brand token (Cresco, Rythm, High Supply, Savvy, Bedford Grow, Aeriz, Revolution, Cookies, Dogwalkers, Ozone, Grassroots, Verano Reserve, Encore, Good News, Common Goods, Simply Herb, Incredibles, Select).
2. **Weight resolvable:** either `deals.weight_grams` is populated, or the title/description contains a weight token (1g, 3.5g/eighth, 7g/quarter, 14g/half, 28g/ounce).
3. **Discount computable:** `discount_type` is `percent_off` (with `discount_unit='percent'`) or `dollar_off`, with a numeric `discount_value`.

The script tries hard at parsing — explicit columns first, then title text, then description. It uses a longer-token-wins approach so "Verano Reserve" beats "Verano" and "Ozone Reserve" beats "Ozone".

## What it can't resolve (honest skips)

| Skip reason | Example deal | Why blocked |
|---|---|---|
| No brand token | "First-time 20% off" | No anchor exists |
| Brand but no weight | "30% off Cresco edibles" | Edibles aren't in this table; weight not parseable from edibles |
| Weight but no brand | "Wax Wednesday 25% off concentrates" | Concentrates need their own anchor table |
| Storewide percent-off | "20% off everything in store" | No product to anchor against |
| Unknown brand | "$5 off Local Grow LLC" | Not in the curated 27 |
| Loyalty / demographic | "Veterans 10% off" | Not a price-bearing discount |
| BOGO | "Buy 1 get 1 50%" | Multi-item math; future enhancement |

The script logs every skip with a bucketed reason so the next-curation pass can target the highest-volume miss bucket.

## Coverage expectations

Pre-Path-B state (as of 2026-04-21):

- 56 active deals total
- 2 deals have `price_per_gram` populated (from v1 explicit-anchor sweep)
- 53 deals are in the candidate pool (PPG-null, flower or pre-roll category — minus the 2 v1 hits and ~1 deactivated)

Realistic Path B yield based on a manual scan of the deal feed:

| Bucket | Est. deals | Resolvable by Path B? |
|---|---|---|
| Brand + weight + percent_off in title | 8–12 | ✅ Direct hit |
| Brand + weight in description (no title) | 4–6 | ✅ Description parse |
| Brand only (e.g., "30% off Rythm flower") | 6–8 | ⚠️ Generic eighth fallback |
| Storewide / category-wide | 12–15 | ❌ Skip |
| Demographic / loyalty | 8–10 | ❌ Skip |
| BOGO / multi-item | 3–5 | ❌ Future enhancement |

Net: **10–15 deals get a PPG**, taking the PuffPrice Index from `sample_size:2` to `sample_size:12–17`. Crosses the 10-row threshold for `available:true`.

## What this can't solve

Even with perfect Path B execution:

- **Concentrates / vapes / edibles / topicals** stay unresolved. Path B is flower + pre-roll only. Vapes deserve a separate anchor table (1g cart pricing varies wildly by hardware). Edibles need a per-mg-THC framework, not per-gram.
- **Brand-tier accuracy.** A deal that says "30% off Rythm flower" and matches the Rythm 3.5g anchor at $45 produces $9/g. But the actual deal might be on a 14g Rythm bag at a $140 anchor → $7/g. Without the deal text specifying weight, we default to eighth pricing. This is honestly directional, not exact.
- **Anchor freshness.** The 27 seed rows reflect April 2026 menu observations. IL prices drift quarterly. The `source_observed_at` column is the freshness signal — when it goes stale (>90 days), trigger a re-curation pass.
- **Deals with no menu attribution at all.** "First-time 20% off" doesn't anchor to anything, anywhere.

## Maintenance

- **Weekly:** spot-check 5 random anchor rows against current dispensary menu pricing (when egress unblocks, or via WebSearch snippets). Update `typical_price_usd` and bump `source_observed_at` to today.
- **Monthly:** scan the script's skip-bucket output for new high-volume reasons. Add anchors for the brands that show up most often.
- **As needed:** when Code adds new fields to `deals` (e.g., `mg_thc`), extend the script's resolve logic to cover edibles / vapes via separate anchor tables.

## Migration onto Path A

When Matthew unblocks egress to dispensary domains (or moves the scraper to a hosted environment with open egress), the Path A automated scraper supersedes Path B for live menu price fetching. Path B's anchor_skus table stays useful for:

- Validation: "this scraped $48 / 3.5g matches our $45 anchor — confidence high."
- Fallback: "menu fetch failed for this dispensary today — use anchor."
- Brand intelligence: aggregate anchor pricing trends over time (`source_observed_at` history).

Don't delete the table when Path A ships. It's a long-term asset.

## Honest source-quality breakdown

Of the 27 seed rows:

- **High confidence (10 rows):** directly observed price at a named IL menu (Ivy Hall, RISE, Revolution, nuEra). Cresco eighth, Rythm eighth, High Supply 28g, Simply Herb 28g, Savvy 14g, Bedford Grow eighth, Aeriz eighth, Aeriz quarter, Revolution eighth.
- **Medium confidence (10 rows):** corroborated across 2+ menu snippets, or extrapolated via consistent within-brand math from a high-confidence row. Cresco 14g, Rythm 14g, Rythm 28g, Dogwalkers 5/10-pack, Savvy 7g, Savvy 28g, Cookies eighth, Grassroots eighth, Ozone 14g, all 3 generic fallbacks.
- **Low confidence (7 rows):** brand-tier-pattern extrapolation only, no direct menu observation. Good News flower, Encore eighth, Verano Reserve eighth, Incredibles eighth, Common Goods eighth, Select 1g vape, Ozone Reserve eighth.

The script doesn't currently weight by confidence — every match returns the same `inferred_ppg`. Future enhancement: surface `confidence` to the UI as a "high / medium / low" badge on the deal card so consumers can self-calibrate.

## Files in this drop

| File | Purpose |
|---|---|
| `sql/migrations/2026-04-21-anchor-skus.sql` | Schema + 27-row seed (NOT YET APPLIED) |
| `scripts/compute-ppg-from-anchors.ts` | Dry-run + apply CLI |
| `docs/handoffs/path-b-anchor-sku-strategy-20260421.md` | This document |

## Next session pickups

After Matthew applies the migration and runs the script in dry-run, expected next steps:

1. Code-lane: review the dry-run output, confirm the 10–15 hits look right, then service-role-execute `--apply`.
2. Code-lane: update `lib/puffpriceIndex.ts` to weight inferred-PPG entries differently than direct-PPG entries (or surface the confidence in the UI).
3. Cowork-lane next session: scan the skip-bucket output, identify the top 3 unresolved brands, add anchor rows for them. Loop.
