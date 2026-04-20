-- ============================================================
-- 2026-04-20-fix-active-deals-view-backup.sql
--
-- ROLLBACK ARTIFACT — verbatim `pg_get_viewdef` output of
-- `public.active_deals_with_listings` as it existed BEFORE the
-- 2026-04-20 fix that removed the `COALESCE(m.city, 'Illinois')`
-- fallback.
--
-- Captured: 2026-04-20 (via Supabase MCP).
-- Apply this file if the city-null-propagation fix needs to be
-- reverted (e.g., if a downstream renderer panics on NULL city).
--
-- Paired migration:
--   sql/migrations/2026-04-20-fix-active-deals-view.sql
-- ============================================================

CREATE OR REPLACE VIEW public.active_deals_with_listings AS
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
    d.listing_slug,
    d.listing_slug AS slug,
    COALESCE(m.name, d.listing_slug) AS name,
    COALESCE(m.city, 'Illinois'::text) AS city,
    m.phone,
    m.logo_url,
    0::numeric AS google_rating,
    0 AS review_count,
    COALESCE(m.accepts_credit, false) AS accepts_credit,
    COALESCE(m.drive_thru, false) AS drive_thru,
    COALESCE(m.delivery, false) AS delivery,
    COALESCE(m.plan, 'free'::text) AS plan,
        CASE
            WHEN d.original_price IS NOT NULL AND d.sale_price IS NOT NULL THEN round(d.original_price - d.sale_price, 2)
            ELSE NULL::numeric
        END AS savings_amount,
    d.discount_value AS savings_percent
   FROM deals d
     LEFT JOIN master_listings m ON d.listing_slug = m.slug
  WHERE d.is_active = true
    AND d.project_tag = 'green'::text
    AND (d.expires_at IS NULL OR d.expires_at > now());

GRANT SELECT ON public.active_deals_with_listings TO anon, authenticated;
