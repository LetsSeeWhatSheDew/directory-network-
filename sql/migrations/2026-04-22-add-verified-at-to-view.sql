-- NOT YET APPLIED
-- Migration: add verified_at + lat/lng projection to active_deals_with_listings view
-- Author: Cowork
-- Date: 2026-04-22 (authored 2026-04-21 night)
-- Pairs with: docs/verification/CHROME-MAKEUP-SESSION-20260421.md (P2 follow-up)
--
-- Context: Code flagged in the chrome-makeup verification that the current
-- `active_deals_with_listings` view definition (see
-- sql/migrations/2026-04-20-fix-active-deals-view.sql:49) does NOT project
-- `d.verified_at`. Consumers that read the view (HomeDealCards feed, the
-- recommend-API top-pick payload, deals/[category] lists, l/[id] ad slot)
-- therefore pass an undefined `verified_at` to <DealFreshnessBadge />, which
-- always renders "Verification pending" regardless of actual data.
--
-- Fix: project `d.verified_at` explicitly. Also project `m.lat` and `m.lng`
-- so the hero card's haversine-distance helper and the map iframe stop
-- double-fetching master_listings just to get coords — a perf/RTT win at
-- zero schema cost.
--
-- All other fields preserved from the 2026-04-20 definition — same
-- NULL-on-miss semantics for name/city (the "Illinois substitution lie"
-- fix), same COALESCE defaults for accepts_credit/drive_thru/delivery/plan,
-- same savings_amount computation, same anon+authenticated SELECT grant.
--
-- Rollback:
--   \i sql/migrations/2026-04-20-fix-active-deals-view.sql
--
-- Sign-off required: Matthew.

BEGIN;

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
    -- NEW: the freshness signal the DealFreshnessBadge needs.
    d.verified_at,
    -- NEW: status_reason so consumers can tell "imported, not individually verified"
    -- apart from "actually verified N days ago" — used by DealFreshnessBadge copy tweak
    -- (see docs/handoffs/verified-at-strategy-20260422.md).
    d.status_reason,
    -- Fix from 2026-04-20: NULL-on-miss for name/city rather than sentinel strings.
    m.name                                           AS name,
    m.city                                           AS city,
    m.phone,
    m.logo_url,
    -- NEW: coords — lets the hero-card distance calc skip its secondary fetch.
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

-- (a) Column list includes verified_at, status_reason, lat, lng
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'active_deals_with_listings'
--   ORDER BY ordinal_position;
--   -- Expected: 28 rows, all of (verified_at, status_reason, lat, lng) present.

-- (b) Count of rows with verified_at set (pre-backfill: 0 is correct)
--   SELECT COUNT(*) FILTER (WHERE verified_at IS NOT NULL) AS with_verified,
--          COUNT(*) AS total
--   FROM public.active_deals_with_listings;
--   -- Expected today (pre-backfill): 0 with_verified out of ~49 total.
--   -- After 2026-04-22-verified-at-backfill.sql (Option C): ~49 with_verified.

-- (c) Spot-check the NULL-on-miss contract still holds
--   SELECT deal_id, listing_slug, name, city
--   FROM public.active_deals_with_listings
--   WHERE name IS NULL OR city IS NULL
--   ORDER BY listing_slug;
--   -- Expected after 2026-04-22-fix-deal-listing-joins.sql: 0 rows.
--   -- (Before that migration: 18 rows — the orphan set this audit surfaced.)

-- (d) Spot-check coords populate where master_listings has them
--   SELECT deal_id, listing_slug, lat, lng
--   FROM public.active_deals_with_listings
--   WHERE lat IS NOT NULL AND lng IS NOT NULL
--   LIMIT 5;
--   -- Expected: depends on master_listings coord coverage. Today lat/lng is null
--   -- for every green row we verified (altius-carol-stream, ivy-hall-dispensary,
--   -- nature-treatment-galesburg all null), so this query may return 0 rows until
--   -- Cowork's coord-backfill pass lands. The projection is still correct.
