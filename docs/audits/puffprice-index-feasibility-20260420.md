# PuffPrice Index Feasibility — 2026-04-20

## TL;DR

**The schema is ready. The data is not.** All columns required to compute a per-gram index exist in `deals`, but **0 of 100 deals** have any of them populated. The Index can ship as API scaffolding today (Code Task 6) but will return `null`/`404 sparse` until a scraping or normalization pass backfills `price_per_gram`, `unit`, `sale_price`, `original_price`.

## Schema audit — `public.deals` (100 rows, 56 active)

| Column | Purpose for Index | Populated? |
|---|---|---|
| `category` | Segment index by flower / edibles / concentrate / vapes | **100 / 100** |
| `discount_value` | % off or $ off | 100 / 100 |
| `discount_unit` | `percent` or `dollars` | 100 / 100 |
| `discount_type` | `percent_off`, `fixed_price`, `bogo`, etc. | 100 / 100 |
| `original_price` | Pre-deal price (needed to compute effective $/g) | **0 / 100** |
| `sale_price` | Post-deal price (needed to compute effective $/g) | **0 / 100** |
| `unit` | "gram", "eighth", "ounce" — the denominator | **0 / 100** |
| `price_per_gram` | Pre-computed $/g (fastest path if backfilled at ingest) | **0 / 100** |
| `raw_text` | Free-form source text (LLM re-extraction input) | unchecked, assumed partial |
| `source`, `source_url` | Provenance for audit | populated ("manual" default) |

### Active-deals category distribution

| Category | Active deals |
|---|---|
| `all` | 31 |
| `flower` | 10 |
| `edibles` | 7 |
| `concentrate` | 5 |
| `vapes` | 3 |

Only 10 active flower deals exist today. Even if all 10 had clean price/weight fields, that's below the `sample_size >= 10` threshold Code is scaffolding for `computeWeeklyIndex()` (Task 6). The Index needs >10× the flower-deal volume we currently have before a weekly number is meaningful. That's a scraping-cadence and corpus-size problem, not an algorithm problem.

## The target query (ready to run the moment the data lands)

```sql
-- Monthly average price-per-gram for a standard eighth across IL.
-- Only runs against "flower" deals with derivable $/g.
WITH flower_with_ppg AS (
  SELECT
    d.id,
    d.listing_slug,
    date_trunc('month', d.created_at) AS month,
    CASE
      -- Direct $/g field wins
      WHEN d.price_per_gram IS NOT NULL
        THEN d.price_per_gram
      -- Explicit eighth-unit sale price
      WHEN d.unit = 'eighth' AND d.sale_price IS NOT NULL
        THEN d.sale_price / 3.5
      -- Gram-unit sale price
      WHEN d.unit = 'gram' AND d.sale_price IS NOT NULL
        THEN d.sale_price
      -- Ounce-unit sale price
      WHEN d.unit = 'ounce' AND d.sale_price IS NOT NULL
        THEN d.sale_price / 28
      -- Percent-off against a known original_price eighth
      WHEN d.discount_unit = 'percent'
           AND d.unit = 'eighth'
           AND d.original_price IS NOT NULL
        THEN (d.original_price * (1 - d.discount_value / 100.0)) / 3.5
      ELSE NULL
    END AS ppg
  FROM deals d
  WHERE d.project_tag = 'green'
    AND d.is_active = true
    AND d.category = 'flower'
)
SELECT
  month,
  ROUND(AVG(ppg)::numeric, 2) AS avg_ppg,
  COUNT(*) AS sample_size
FROM flower_with_ppg
WHERE ppg IS NOT NULL
GROUP BY month
ORDER BY month DESC;
```

Today this returns zero rows. Once `price_per_gram` (or `unit` + `sale_price` / `original_price`) is backfilled, it returns the Index time-series directly.

## What needs to change to make this real

### Path A — scraping layer captures structured price data (recommended)

Modify the scraper / deal-ingest pipeline to extract four fields from every flower (and pre-roll) deal:

1. `unit` (`gram` | `pre-roll` | `eighth` | `quarter` | `half` | `ounce` | `package`)
2. `original_price` (numeric USD)
3. `sale_price` (numeric USD, post-discount)
4. `price_per_gram` (numeric USD, pre-computed at ingest so reads are O(1))

The current 10 flower deals' `raw_text` and `description` fields often contain enough signal. Example from DB:
- `"28 grams of Simply Herb brand flower for $80"` → unit=ounce, sale_price=80, ppg=$2.86/g
- `"5 eighths for $100"` → unit=eighth×5, sale_price=20/eighth, ppg=$5.71/g
- `"Flower Friday — 15% off all flower"` → unit=null, **unclassifiable** (no anchor price)

**Rule of thumb:** ~60% of current flower deals have enough text anchor to extract $/g automatically; ~40% are percent-off-a-floating-menu with no anchor (they need the store's menu to resolve). Those 40% can be marked `ppg = null` and excluded from the Index.

### Path B — manual catalog of "anchor SKUs" per store (stopgap)

Maintain a tiny lookup table: `(listing_slug, product_name, weight_grams, reference_price)`. Every time we see a percent-off deal, we multiply against the anchor. Gets us usable numbers much faster but requires weekly hand-curation. Suitable while the scraper matures.

### Path C — if neither, the Index is dead

Without backfill, `computeWeeklyIndex()` will always return `null`, and the `/api/index/weekly` endpoint will always 404 sparse. Scaffolding is still worth shipping to freeze the contract; public launch of the Index is blocked on data capture.

## Additional fields that should exist but don't

The current schema doesn't capture these and they're needed for a defensible public Index:

- `brand` (Cresco, Verano, RISE house brand, etc.) — needed to normalize between premium and value tiers so the Index isn't just "whoever discounted the most premium flower this week"
- `thc_percent` — needed to explain why one eighth is $25 and another is $60 (the current customer objection)
- `product_name` (as listed on menu) — needed to dedupe deals pointing at the same SKU across dispensaries
- `weight_grams` (normalized to decimal grams regardless of unit label) — removes the eighth/quarter/ounce conversion risk

Add as nullable columns in a migration file for tomorrow; do not block launch on full backfill.

## Recommended next actions

1. **Ship Code Task 6 scaffolding as planned** — `computeWeeklyIndex()` + `/api/index/weekly` contract. Returns 404 until sample >= 10.
2. **This week: start capturing `sale_price` + `unit`** during deal ingest — for the 10 existing flower deals, manual entry would produce a measurable Index by next Monday.
3. **Next week: add the four missing fields** (`brand`, `thc_percent`, `product_name`, `weight_grams`) in a migration scaffold — do NOT apply in production yet, per CLAUDE.md "don't run database migrations" tonight.
4. **Month 1 target:** 30+ active flower deals per week with `price_per_gram` populated → the Index can surface as a number the homepage shows publicly.
5. **Month 3 target:** Index crosses into the PMF-cited-by-other-AI-systems moment (per ZONE4 strategy) — that requires ~100 weekly flower data points and daily recomputation.

## Status

**Blocking:** Index is a scaffolding-now, data-later feature. The Supabase shape is right; the ingest pipeline is the gap. Not a Matthew-input item; a pipeline-work item. Matthew just needs to approve spending next session's time on extraction tooling versus more listing enrichment.
