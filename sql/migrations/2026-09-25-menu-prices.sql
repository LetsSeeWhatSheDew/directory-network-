-- 2026-09-25-menu-prices.sql
-- ============================================================================
-- Menu prices (/cheapest) — OPTIONAL. Nothing here is required for the code
-- to work. Written by Code, NOT applied. Matthew reviews and runs it.
--
-- What the code does without this file (verified 2026-09-25 with the anon key):
--   * /cheapest reads the `latest_menu_items` view with the ANON key. The view
--     is a plain (owner-rights) view, so anon can already read it even though
--     menu_items itself has RLS on and no anon policy. If that ever changes,
--     lib/menuPrices.ts falls back to SUPABASE_SERVICE_ROLE_KEY server-side.
--   * Store identity does NOT need `dispensaries` (RLS, no anon policy): each
--     menu_items row the scraper writes carries raw_payload.listing_slug (the
--     master_listings slug), and names/cities come from master_listings.
--   * The scraper (service key, --apply) looks up / creates the store's
--     `dispensaries` row and sets dispensaries.master_listing_slug — a column
--     that already exists in sql/menu-baseline-schema.sql.
--
-- What this file adds:
--   1. An index for the page's read (menu rows by reference unit, newest
--      first). Worth it once a few weeks of twice-daily snapshots pile up.
--   2. A read-only check you can run first to confirm the schema the code
--      expects (enum values, the soft-join column).
-- ============================================================================

-- 0. Pre-flight (read-only) --------------------------------------------------
-- Expect: menu_platform has dutchie, sweed, joint; snapshot_status has
-- ok, partial, empty, error; thc_tier has non_infused_le_35,
-- non_infused_gt_35, infused; dispensaries.master_listing_slug exists.
--
-- SELECT t.typname, e.enumlabel
--   FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
--  WHERE t.typname IN ('menu_platform','snapshot_status','thc_tier')
--  ORDER BY 1, e.enumsortorder;
--
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'dispensaries' AND column_name = 'master_listing_slug';

BEGIN;

-- 1. Reader index -------------------------------------------------------------
-- lib/menuPrices.ts filters latest_menu_items on
--   raw_payload->>'puffprice_ref' IN ('eighth','cart_1g','gummies_100mg')
--   AND scraped_at >= now() - 36h
CREATE INDEX IF NOT EXISTS menu_items_ref_recent_idx
  ON menu_items ((raw_payload->>'puffprice_ref'), scraped_at DESC)
  WHERE raw_payload ? 'puffprice_ref';

COMMIT;

-- ============================================================================
-- After the first --apply run on the Mac, spot-check:
--
-- SELECT d.master_listing_slug, s.status, s.item_count, s.error_message, s.scraped_at
--   FROM menu_snapshots s JOIN dispensaries d ON d.id = s.dispensary_id
--  WHERE s.adapter_version LIKE 'rendered-%'
--  ORDER BY s.scraped_at DESC LIMIT 20;
--
-- SELECT raw_payload->>'listing_slug' AS store, raw_payload->>'puffprice_ref' AS ref,
--        min(price_pretax) AS cheapest_shelf, min(price_out_the_door) AS cheapest_otd, count(*)
--   FROM menu_items
--  WHERE scraped_at > now() - interval '1 day' AND raw_payload ? 'puffprice_ref'
--  GROUP BY 1, 2 ORDER BY 1, 2;
-- ============================================================================
