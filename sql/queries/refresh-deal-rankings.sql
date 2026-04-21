-- Reference query — refresh deal rankings
-- Author: Cowork
-- Date: 2026-04-21
-- Called by: the daily stale-deal cron (/api/cron/mark-stale-deals), *after*
-- the staleness UPDATEs have committed. Can also be called on demand from
-- an admin action ("recompute rankings now").
--
-- Pairs with migration: sql/migrations/2026-04-21-deal-ranking.sql
--
-- Why CONCURRENTLY:
--   - Does not lock readers. The app keeps serving the old rankings snapshot
--     until the new one commits, then flips atomically.
--   - Requires a UNIQUE INDEX on the view, which the migration provides.
--
-- Failure handling in the cron:
--   If this errors with "relation public.deal_rankings does not exist",
--   the ranking migration hasn't been applied yet. Log a warning and
--   continue — staleness was the point; rankings are optional.

REFRESH MATERIALIZED VIEW CONCURRENTLY public.deal_rankings;

-- Sanity summary. Call after the refresh to log what was produced.
SELECT
  COUNT(*)                                           AS total_ranked,
  COUNT(*) FILTER (WHERE is_top_5_percent IS TRUE)   AS top_5_percent_count,
  COUNT(DISTINCT category)                           AS categories_ranked,
  COUNT(DISTINCT category) FILTER (WHERE category_size >= 20) AS categories_above_floor,
  MAX(computed_at)                                   AS last_computed_at
FROM public.deal_rankings;
