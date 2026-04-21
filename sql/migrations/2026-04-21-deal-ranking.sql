-- NOT YET APPLIED
-- Migration: deal_rankings materialized view + top-5% computation
-- Author: Cowork
-- Date: 2026-04-21
-- Pairs with:
--   sql/queries/refresh-deal-rankings.sql
--   docs/handoffs/top-5-badge-spec-20260421.md
--
-- Context: Matthew killed the A/B/C/D letter-grade system. Replacing it with
-- a single "🔥 Top 5% deal" badge that only shows on genuinely extraordinary
-- deals. This view does the ranking. The app reads is_top_5_percent per
-- deal_id to decide whether to render the badge.
--
-- Design decisions (see top-5-badge-spec-20260421.md for full rationale):
--   1. Rank only `discount_type = 'percent_off'` deals — the 3 dollar-denominated
--      deals in the active set can't be compared apples-to-apples against %
--      off and are excluded from ranking. They simply never get a badge.
--   2. Rank within `category`, not globally. A 30%-off-flower deal and a
--      30%-off-edibles deal are not the same thing.
--   3. Minimum sample size = 20 deals per category. Below that, "top 5%"
--      is statistical noise; no badge fires. Today (n=31 in 'all', n<20
--      elsewhere) only the 'all' category can produce a badge. That's
--      honest — if only one category has enough density, only that category
--      can flag deals. The floor drops automatically as coverage grows.
--   4. Composite score = (1 - ppg_percentile) * 0.6 + (1 - discount_percentile) * 0.4
--      when price_per_gram is known. Fall back to 1 - discount_percentile when
--      PPG is null. Today PPG is null for 100% of active rows, so the fallback
--      is what actually runs. Once Path A/B scrapers land PPG, composite kicks
--      in automatically with no code change.
--   5. MATERIALIZED view, not regular view. Keeps reads cheap. Refreshed by
--      the daily stale-deal cron after it runs (see refresh-deal-rankings.sql).
--   6. REFRESH CONCURRENTLY requires a UNIQUE INDEX on the view, which the
--      migration creates.
--
-- Rollback:
--   DROP MATERIALIZED VIEW IF EXISTS public.deal_rankings;

BEGIN;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.deal_rankings AS
WITH base AS (
  SELECT
    id,
    listing_slug,
    category,
    price_per_gram,
    discount_type,
    discount_value
  FROM public.deals
  WHERE is_active IS TRUE
    AND discount_type = 'percent_off'
    AND discount_value IS NOT NULL
),
ranked AS (
  SELECT
    id,
    listing_slug,
    category,
    price_per_gram,
    discount_value,
    -- PPG percentile within category (lower PPG = better, so ASC).
    -- NULL when no PPG data.
    CASE WHEN price_per_gram IS NOT NULL THEN
      percent_rank() OVER (
        PARTITION BY category
        ORDER BY price_per_gram ASC
      )
    ELSE NULL END AS ppg_percentile,
    -- Discount percentile within category (higher % off = better, so DESC).
    -- Always populated because we filtered to percent_off with non-null value.
    percent_rank() OVER (
      PARTITION BY category
      ORDER BY discount_value DESC
    ) AS discount_percentile,
    COUNT(*) OVER (PARTITION BY category) AS category_size
  FROM base
),
scored AS (
  SELECT
    id AS deal_id,
    listing_slug,
    category,
    ppg_percentile,
    discount_percentile,
    category_size,
    -- percent_rank gives 0 to the worst and 1 to the best within partition
    -- (DESC on discount_value means the biggest % off gets percent_rank = 1).
    -- We keep the raw percentiles above for transparency, and compute one
    -- composite "goodness" number between 0 (worst) and 1 (best) for gating.
    CASE
      WHEN ppg_percentile IS NOT NULL THEN
        -- PPG is ASC so low = good → (1 - ppg_percentile) makes high = good
        (1 - ppg_percentile) * 0.6 + discount_percentile * 0.4
      ELSE
        discount_percentile
    END AS composite_score
  FROM ranked
)
SELECT
  deal_id,
  listing_slug,
  category,
  ppg_percentile,
  discount_percentile,
  composite_score AS composite_rank,
  category_size,
  -- Top 5% gate: composite >= 0.95 AND category has enough deals to
  -- meaningfully talk about "top 5%".
  CASE
    WHEN category_size >= 20 AND composite_score >= 0.95 THEN TRUE
    ELSE FALSE
  END AS is_top_5_percent,
  NOW() AS computed_at
FROM scored;

-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY.
CREATE UNIQUE INDEX IF NOT EXISTS deal_rankings_deal_id_uq
  ON public.deal_rankings (deal_id);

-- Fast lookup for the badge render path (app asks "is this deal top 5%?").
CREATE INDEX IF NOT EXISTS deal_rankings_top5_idx
  ON public.deal_rankings (deal_id)
  WHERE is_top_5_percent IS TRUE;

COMMIT;

-- After migration: the daily cron (see stale-deal-job-spec-20260421.md)
-- will call REFRESH MATERIALIZED VIEW CONCURRENTLY public.deal_rankings;
-- after every staleness pass, so rankings stay in sync with the active set.
--
-- Initial state post-migration, today (2026-04-21): one category ('all', n=31)
-- passes the sample-size floor. Expected top-5% badges site-wide: 1-2 deals.
-- That's the floor, and it's honest.
