-- NOT YET APPLIED
-- Migration: verified_at backfill — Option C (imported-not-verified marker)
-- Author: Cowork
-- Date: 2026-04-22 (authored 2026-04-21 night)
-- Pairs with: docs/handoffs/verified-at-strategy-20260422.md
--
-- Context: All active deals today have verified_at = NULL. Once the view fix
-- makes the column visible to the UI, every deal card shows
-- "Verification pending" — killing the badge signal before it can ever earn
-- its keep.
--
-- Option C: set verified_at = created_at - INTERVAL '7 days' AND tag with
-- status_reason = 'imported_not_verified'. The UI reads the status_reason
-- to render "Imported Apr 14" instead of "Verified N days ago" or
-- "Verification pending."
--
-- See the handoff doc for the A/B/C comparison. Matthew picks A/B/C in the
-- morning. Alternative bodies are provided in comments at the bottom of this
-- file — delete the active body and uncomment the chosen variant before apply.
--
-- DEPENDS ON: sql/migrations/2026-04-21-deal-staleness.sql (status_reason column).
-- APPLY AFTER: sql/migrations/2026-04-22-fix-deal-listing-joins.sql
--              (so the 7 orphaned deals are already marked and excluded).
--
-- Rollback:
--   UPDATE deals
--   SET verified_at = NULL,
--       status_reason = NULL
--   WHERE status_reason = 'imported_not_verified';
--
-- Sign-off required: Matthew (pick A/B/C).

BEGIN;

-- ============================================================
-- Option C — the recommended path
-- ============================================================

UPDATE public.deals
SET verified_at = created_at - INTERVAL '7 days',
    status_reason = 'imported_not_verified',
    updated_at = NOW()
WHERE verified_at IS NULL
  AND is_active = true
  AND status_reason IS NULL              -- don't touch rows already marked
                                         -- (orphaned, expired, stale, etc.)
  AND created_at::date = '2026-04-14';   -- only the known import batch

COMMIT;

-- ============================================================
-- Verification queries — run after apply
-- ============================================================

-- (a) Coverage
--   SELECT COUNT(*) FILTER (WHERE verified_at IS NOT NULL) AS verified,
--          COUNT(*) FILTER (WHERE verified_at IS NULL) AS pending,
--          COUNT(*) AS total
--   FROM public.deals
--   WHERE is_active = true;
--   -- Expected: ~49 verified, 0 pending, ~49 total.

-- (b) Confirm the marker landed on the right rows
--   SELECT status_reason, COUNT(*) FROM public.deals GROUP BY status_reason;
--   -- Expected: 'imported_not_verified' ≈ 49
--                'orphaned'              ≈ 7 (from Task 1 migration)
--                (and other historical reasons, if any)

-- (c) Spot check the computed date on the hero card's likely top pick
--   SELECT deal_id, deal_title, listing_slug, verified_at, status_reason,
--          (verified_at + INTERVAL '7 days')::date AS displayed_import_date
--   FROM public.active_deals_with_listings
--   WHERE listing_slug = 'nuera-east-peoria'
--   LIMIT 3;
--   -- Expected: verified_at ~ 2026-04-07 (i.e., 2026-04-14 minus 7d),
--   --           displayed_import_date = 2026-04-14.


-- ============================================================
-- Option A — mass-set verified_at = created_at (UNCOMMENT IF CHOSEN)
-- ============================================================
-- -- Sets "Verified 7–8 days ago" on every active deal. Fastest to UX completeness,
-- -- but claims verification that didn't happen. See strategy doc.
--
-- UPDATE public.deals
-- SET verified_at = created_at,
--     updated_at = NOW()
-- WHERE verified_at IS NULL
--   AND is_active = true
--   AND status_reason IS NULL;


-- ============================================================
-- Option B — do nothing (DELETE THE ENTIRE MIGRATION IF CHOSEN)
-- ============================================================
-- -- No SQL. UI continues to render "Verification pending" on every card.
-- -- Accept the UX cost; wait for real scraper/manual verification to
-- -- organically fill verified_at over time.
