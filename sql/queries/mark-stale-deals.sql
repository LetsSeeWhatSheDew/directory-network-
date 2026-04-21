-- Reference query — mark stale deals
-- Author: Cowork
-- Date: 2026-04-21
-- Called by: the daily cron endpoint /api/cron/mark-stale-deals (to be built by Code)
-- Pairs with migration: sql/migrations/2026-04-21-deal-staleness.sql
--
-- What this does:
--   1. Deactivate deals whose expires_at is in the past     (status_reason = 'expired')
--   2. Deactivate deals with no expires_at that are >30 days old (status_reason = 'stale')
--   3. Record the timestamp of the pass on changed rows via verified_at
--      (i.e. "we looked at you, and we updated your status"). Unchanged rows
--      are not touched, so verified_at only moves when we act.
--   4. Never DELETE — preserve history for audits + price history joins.
--
-- Transaction: yes. Either both deactivation steps commit or neither does.
-- Concurrency: safe. The WHERE clauses filter by is_active = TRUE, so a
-- second run immediately after the first is a no-op.
--
-- Expected row counts (2026-04-21, pre-cron):
--   expired    → 3 rows (the 4/20 specials)
--   stale      → 0 rows today; will climb as the 53 null-expires rows age past day 30.
--                First real deactivations hit on 2026-05-14 when the
--                2026-04-14 import crosses the 30-day threshold.

BEGIN;

-- Step 1. Real expirations first — these are unambiguous.
UPDATE public.deals
SET
  is_active = FALSE,
  status_reason = 'expired',
  verified_at = NOW(),
  updated_at = NOW()
WHERE is_active IS TRUE
  AND expires_at IS NOT NULL
  AND expires_at < NOW();

-- Step 2. Stale-by-age fallback for deals with no expires_at.
--   30 days is a conservative default. Revisit once we have scraper data on
--   how often Illinois dispensary promos actually rotate (feels like ~7–10
--   days, but we need evidence). Tightening to 14 days later is a one-line
--   change; loosening to 60 is equally cheap.
UPDATE public.deals
SET
  is_active = FALSE,
  status_reason = 'stale',
  verified_at = NOW(),
  updated_at = NOW()
WHERE is_active IS TRUE
  AND expires_at IS NULL
  AND created_at < NOW() - INTERVAL '30 days';

COMMIT;

-- Return a summary for the cron handler to log / alert on.
-- Run this *after* the commit above so Code can fetch the counts and include
-- them in the response body.
SELECT
  COUNT(*) FILTER (WHERE status_reason = 'expired' AND verified_at >= NOW() - INTERVAL '2 minutes') AS newly_expired,
  COUNT(*) FILTER (WHERE status_reason = 'stale'   AND verified_at >= NOW() - INTERVAL '2 minutes') AS newly_stale,
  (SELECT COUNT(*) FROM public.deals WHERE is_active IS TRUE) AS remaining_active
FROM public.deals;
