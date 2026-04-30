-- Migration: add deals.last_independent_verification + view projection
-- Date: 2026-04-30
-- Authors: Code (per Matthew's Phase 1 directive in 2026-04-30 demo-ready session)
--
-- Why this exists
-- ---------------
-- Until now, `deals.verified_at` carried two responsibilities:
--   (a) "When did the scraper last actually see this deal at the source?"
--   (b) "How fresh should we display this deal as on the site?"
--
-- These two are about to diverge. The cron's new daily-touch logic needs
-- to bump (b) for deals it didn't independently re-scrape today, so the
-- hero card stops showing the empty state on days when the scraper
-- couldn't reach a particular dispensary. But we still need (a) for the
-- 48h / 7d trust tiers — within 48h of an actual scrape we treat the deal
-- as confirmed; past 7d without an independent scrape we deactivate.
--
-- Solution: split (a) into its own column. `verified_at` keeps doing (b);
-- `last_independent_verification` carries (a). The scraper updates BOTH
-- when it actually sees a deal at the source. The cron's post-pass only
-- updates `verified_at` (display-side), reading `last_independent_verification`
-- as the trust signal.
--
-- Backfill: existing rows get their `verified_at` copied as the seed for
-- `last_independent_verification` (the scraper was the only thing
-- touching `verified_at` until now, so the two are equivalent today).
--
-- View update: project the new column from `active_deals_with_listings`
-- so the cron post-pass code (and any future surface that wants to show
-- the trust tier) can read it without a second roundtrip.

BEGIN;

-- 1. Column add (no NOT NULL — backfill below populates, future inserts
--    via the scraper will set it explicitly).
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS last_independent_verification timestamptz;

-- 2. Backfill: every existing row's last_independent_verification is the
--    same as its verified_at (the scraper has been the only writer until
--    now, and it stamps both moments simultaneously).
UPDATE public.deals
   SET last_independent_verification = verified_at
 WHERE last_independent_verification IS NULL
   AND verified_at IS NOT NULL;

-- For rows where verified_at is also NULL (legacy imports never seen by
-- the scraper), seed last_independent_verification = created_at so the
-- 7d deactivation rule has a sane anchor and won't deactivate everything
-- immediately after this migration applies.
UPDATE public.deals
   SET last_independent_verification = created_at
 WHERE last_independent_verification IS NULL;

-- 3. Index for the cron's post-pass lookup
--    (find active deals not touched today, ordered by last_independent_verification).
CREATE INDEX IF NOT EXISTS idx_deals_active_last_indep_verif
  ON public.deals (is_active, last_independent_verification)
  WHERE is_active = true;

-- 4. Update active_deals_with_listings to project the new column. We
--    rebuild the view from the same definition as
--    sql/migrations/2026-04-22-add-verified-at-to-view.sql plus the new
--    field. Same NULL-on-miss semantics, same coords projection, same
--    grants — only the projected column list grows by one.
DROP VIEW IF EXISTS public.active_deals_with_listings;

CREATE VIEW public.active_deals_with_listings AS
 SELECT d.id AS deal_id,
    d.title AS deal_title,
    d.description AS deal_description,
    d.category,
    d.discount_type,
    d.discount_value,
    d.discount_unit,
    d.original_price,
    d.sale_price,
    d.unit,
    d.price_per_gram,
    d.is_recurring,
    d.recurring_days,
    d.expires_at,
    d.source,
    d.source_url,
    d.listing_slug,
    d.listing_slug                                   AS slug,
    d.verified_at,
    d.last_independent_verification,
    d.status_reason,
    m.name                                           AS name,
    m.city                                           AS city,
    m.phone,
    m.logo_url,
    m.lat                                            AS lat,
    m.lng                                            AS lng,
    0::numeric                                       AS google_rating,
    0                                                AS review_count,
    COALESCE(m.accepts_credit, false)                AS accepts_credit,
    COALESCE(m.drive_thru, false)                    AS drive_thru,
    COALESCE(m.delivery, false)                      AS delivery,
    COALESCE(m.plan, 'free'::text)                   AS plan,
    CASE
      WHEN d.original_price IS NOT NULL AND d.sale_price IS NOT NULL
        THEN round(d.original_price - d.sale_price, 2)
      ELSE NULL::numeric
    END                                              AS savings_amount,
    d.discount_value                                 AS savings_percent
   FROM public.deals d
   LEFT JOIN public.master_listings m ON d.listing_slug = m.slug
  WHERE d.is_active = true
    AND d.project_tag = 'green'::text
    AND (d.expires_at IS NULL OR d.expires_at > now());

GRANT SELECT ON public.active_deals_with_listings TO anon, authenticated;

COMMIT;

-- ============================================================
-- Verification queries — run after apply
-- ============================================================

-- (a) Column exists and is populated
--   SELECT COUNT(*) FILTER (WHERE last_independent_verification IS NOT NULL) AS populated,
--          COUNT(*) AS total
--   FROM public.deals
--   WHERE project_tag = 'green';
--   -- Expected: populated == total.

-- (b) View projects the new column
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='active_deals_with_listings'
--     AND column_name='last_independent_verification';
--   -- Expected: 1 row.
