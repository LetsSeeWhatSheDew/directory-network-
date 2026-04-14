-- ============================================================
-- create-view.sql — active_deals_with_listings
--
-- Materializes the deals-with-dispensary-metadata JOIN that the
-- deals pages (app/deals/[category]/page.tsx,
-- app/cannabis/illinois/[slug]/deals/page.tsx) query.
--
-- Business logic:
--   - Only active deals (is_active = true)
--   - Only the 'green' project_tag (Directory Network IL cannabis)
--   - Only non-expired deals (expires_at IS NULL OR > now())
--
-- Nulls on the JOIN side are defended with COALESCE so pages that
-- read straight from this view don't crash on orphaned deals
-- (i.e. a deal whose listing_slug doesn't match any master_listings
-- row). Those still render — they just show "Illinois" as city and
-- the slug as the display name.
--
-- Run this in the Supabase SQL editor. Re-running is safe — the
-- CREATE OR REPLACE will pick up any schema changes.
-- ============================================================

CREATE OR REPLACE VIEW active_deals_with_listings AS
SELECT
  -- All deal fields (preserved verbatim so downstream code that
  -- destructures a deal object keeps working)
  d.deal_id,
  d.deal_title,
  d.deal_description,
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

  -- Listing identity — aliased so pages don't need to know about the join
  d.listing_slug                           AS slug,
  COALESCE(m.name, d.listing_slug)         AS name,
  COALESCE(m.city, 'Illinois')             AS city,

  -- Dispensary metadata (optional — may be null for orphan deals)
  m.phone,
  m.logo_url,

  -- Stats & flags with safe defaults
  COALESCE(m.google_rating, 0)             AS google_rating,
  COALESCE(m.review_count, 0)              AS review_count,
  COALESCE(m.accepts_credit, false)        AS accepts_credit,
  COALESCE(m.drive_thru, false)            AS drive_thru,
  COALESCE(m.delivery, false)              AS delivery,
  COALESCE(m.plan, 'free')                 AS plan,

  -- Derived savings — computed once at the DB so UI just reads it.
  -- NULL-safe: if either price is missing, savings_amount is 0.
  COALESCE(d.original_price - d.sale_price, 0) AS savings_amount,
  d.discount_value                             AS savings_percent

FROM deals d
LEFT JOIN master_listings m
  ON d.listing_slug = m.slug
WHERE d.is_active = true
  AND d.project_tag = 'green'
  AND (d.expires_at IS NULL OR d.expires_at > now());

-- Indexes backing the common filters.
-- Indexes live on the base tables, not the view, but listing them
-- here keeps them discoverable alongside the view definition.
CREATE INDEX IF NOT EXISTS deals_active_project_idx
  ON deals (is_active, project_tag)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS deals_listing_slug_idx
  ON deals (listing_slug);

CREATE INDEX IF NOT EXISTS deals_category_idx
  ON deals (category);

CREATE INDEX IF NOT EXISTS deals_expires_at_idx
  ON deals (expires_at)
  WHERE expires_at IS NOT NULL;

-- Grant read access to the anon + authenticated roles so the public
-- Next.js app can query the view via the Supabase REST API.
GRANT SELECT ON active_deals_with_listings TO anon, authenticated;

-- Smoke test (comment out for production). Uncomment to verify the
-- view returns rows after running the file.
-- SELECT COUNT(*) AS active_deals FROM active_deals_with_listings;
-- SELECT category, COUNT(*) FROM active_deals_with_listings GROUP BY category ORDER BY 2 DESC;
