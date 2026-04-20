-- ============================================================
-- puffprice-index-weekly.sql
--
-- Reference query: the weekly PuffPrice Index rollup.
-- Code consumes this logic from `lib/puffpriceIndex.ts` (server
-- helper + `useWeeklyIndex` hook, per Code's Task 3 scaffolding).
-- Keep this file in sync with that TS implementation — the SQL here
-- is the source of truth.
--
-- When to run
--   - Weekly cron (Sunday night) to recompute the index.
--   - On demand via /api/index/weekly.
--
-- Sparse behavior
--   If COUNT(*) < 10 for a given week × category, the endpoint
--   returns { available: false, reason: 'sample_too_small', sample_size: N }
--   rather than 404. See Code Task 3 rationale.
--
-- Prerequisites
--   - sql/migrations/2026-04-20-deals-price-normalization.sql applied.
--     Specifically needs: weight_grams, plus the existing columns
--     price_per_gram, unit, sale_price, original_price, category,
--     discount_unit, discount_value, created_at, is_active,
--     project_tag.
--
-- Paired audit
--   docs/audits/puffprice-index-feasibility-20260420.md
-- ============================================================

WITH flower_with_ppg AS (
  SELECT
    d.id,
    d.listing_slug,
    d.brand,
    d.thc_percent,
    date_trunc('week', d.created_at) AS week,
    CASE
      -- 1. Direct $/g set at ingest — fastest path, always wins
      WHEN d.price_per_gram IS NOT NULL THEN d.price_per_gram

      -- 2. Sale price + normalized weight_grams — the canonical path
      WHEN d.sale_price IS NOT NULL
           AND d.weight_grams IS NOT NULL
           AND d.weight_grams > 0
        THEN d.sale_price / d.weight_grams

      -- 3. Legacy `unit` enum — keeps pre-migration rows countable
      --    until weight_grams is backfilled
      WHEN d.unit = 'gram'   AND d.sale_price IS NOT NULL THEN d.sale_price
      WHEN d.unit = 'eighth' AND d.sale_price IS NOT NULL THEN d.sale_price / 3.5
      WHEN d.unit = 'quarter'AND d.sale_price IS NOT NULL THEN d.sale_price / 7.0
      WHEN d.unit = 'half'   AND d.sale_price IS NOT NULL THEN d.sale_price / 14.0
      WHEN d.unit = 'ounce'  AND d.sale_price IS NOT NULL THEN d.sale_price / 28.0

      -- 4. Percent-off an anchor original_price with known weight
      WHEN d.discount_unit = 'percent'
           AND d.original_price IS NOT NULL
           AND d.weight_grams IS NOT NULL
           AND d.weight_grams > 0
        THEN (d.original_price * (1 - d.discount_value / 100.0)) / d.weight_grams

      -- 5. Percent-off an eighth-unit original_price (legacy)
      WHEN d.discount_unit = 'percent'
           AND d.original_price IS NOT NULL
           AND d.unit = 'eighth'
        THEN (d.original_price * (1 - d.discount_value / 100.0)) / 3.5

      ELSE NULL
    END AS ppg
  FROM deals d
  WHERE d.project_tag = 'green'
    AND d.is_active = true
    AND d.category IN ('flower', 'pre-roll')
    -- The composite index on (category, created_at) backs this filter.
    AND d.created_at >= now() - interval '90 days'
)
SELECT
  week,
  ROUND(AVG(ppg)::numeric, 2)                          AS avg_ppg,
  ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY ppg)::numeric, 2) AS median_ppg,
  ROUND(MIN(ppg)::numeric, 2)                          AS min_ppg,
  ROUND(MAX(ppg)::numeric, 2)                          AS max_ppg,
  COUNT(*)                                             AS sample_size,
  COUNT(DISTINCT listing_slug)                         AS distinct_dispensaries,
  COUNT(DISTINCT brand) FILTER (WHERE brand IS NOT NULL) AS distinct_brands
FROM flower_with_ppg
WHERE ppg IS NOT NULL
  AND ppg > 0            -- guard against bad data
  AND ppg < 100          -- guard against outliers (nothing costs $100/g legitimately today)
GROUP BY week
ORDER BY week DESC;

-- ============================================================
-- Example use from code (pseudocode):
--   const rows = await sql(readFileSync('sql/queries/puffprice-index-weekly.sql'));
--   const current = rows[0];
--   if (current.sample_size < 10) return { available: false, reason: 'sample_too_small', sample_size: current.sample_size };
--   return { available: true, ...current };
-- ============================================================
