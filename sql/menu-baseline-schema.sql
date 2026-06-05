-- sql/menu-baseline-schema.sql
-- ============================================================================
-- MENU BASELINE PIPELINE — schema migration
--
-- Purpose
--   PuffPrice currently scrapes daily/weekly DISCOUNTS but has no BASELINE
--   to measure them against. This schema builds the missing baseline:
--   structured per-SKU menu snapshots across Central IL dispensaries,
--   normalized so prices are comparable store-to-store, with a computed
--   local market price band per canonical product.
--
-- Pattern
--   Append-only snapshots. Mirrors sql/price-history-table.sql:
--     * Every adapter run writes a new menu_snapshots row.
--     * Every observed SKU writes a new menu_items row (snapshot-scoped).
--     * No UPDATE in place — history IS the data.
--     * Baselines also append-only → time series of baseline = free
--       "Should I Wait" feature, no separate history table.
--
-- Idempotency
--   All statements are IF NOT EXISTS / ON CONFLICT DO NOTHING. Safe to
--   re-run against a partially-applied DB. Safe to re-run after Cowork
--   commits these tables on main.
--
-- Lane
--   This migration creates DEDICATED tables; it does NOT touch
--   master_listings, deals, or deal_submissions. PuffPrice's existing
--   listing/deal layer keeps using master_listings; the menu pipeline
--   uses `dispensaries` (its own table) and references master_listings
--   only via the optional `master_listing_slug` foreign key for joins.
--
-- Run order
--   Open Supabase SQL Editor (project ref hnbjufmtmrhexmdrfubw).
--   Paste this whole file, execute. Wrapped in a transaction.
-- ============================================================================

BEGIN;

-- 1. Enum types ---------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'menu_platform') THEN
    CREATE TYPE menu_platform AS ENUM ('jane', 'dutchie', 'sweed', 'joint', 'other');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geocode_status') THEN
    CREATE TYPE geocode_status AS ENUM ('approx', 'verified', 'failed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'snapshot_status') THEN
    CREATE TYPE snapshot_status AS ENUM ('ok', 'partial', 'empty', 'error');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'thc_tier') THEN
    -- Matches the IL DOR excise tiering used in Phase 7's tax engine.
    -- non_infused_le_35 = 10% excise (flower/preroll/concentrate/vape with adj THC <=35%)
    -- non_infused_gt_35 = 25% excise (same product types with adj THC >35%)
    -- infused           = 20% excise (edibles, tinctures, topicals — flat regardless of THC)
    CREATE TYPE thc_tier AS ENUM ('non_infused_le_35', 'non_infused_gt_35', 'infused', 'unknown');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_reason') THEN
    CREATE TYPE review_reason AS ENUM (
      'unmatched_brand',
      'unmatched_unit',
      'unmatched_category',
      'low_confidence_match',
      'thc_unparseable',
      'sanity_band_violation',
      'other'
    );
  END IF;
END $$;


-- 2. dispensaries -------------------------------------------------------------
-- One row per storefront. Seeded from reference-data/dispensary_registry.json
-- by scripts/seed-dispensaries-from-registry.ts (Phase 1 acceptance).
-- Keyed by surrogate id; license_number is the natural key but VERIFY items
-- can't use it yet. slug is unique and stable.
--
-- master_listing_slug is OPTIONAL — links to the public-facing master_listings
-- row so the menu pipeline can join with deals / listing pages without
-- forcing a foreign key (master_listings is multi-tenant and slug shape can
-- drift). The join is informational; menu pipeline does NOT require it.
--
CREATE TABLE IF NOT EXISTS dispensaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  license_number text,  -- nullable until IDFPR verifies the 4 VERIFY items
  license_holder text,
  address text,
  city text NOT NULL,
  county text,
  state text NOT NULL DEFAULT 'IL',
  zip text,
  phone text,
  lat numeric,
  lng numeric,
  geocode_status geocode_status NOT NULL DEFAULT 'approx',
  geocoded_at timestamptz,
  menu_platform menu_platform NOT NULL,
  platform_store_id text,             -- e.g. Jane storeId, Dutchie dispensaryId/slug
  menu_url text,
  graphql_endpoint text,              -- Dutchie + Sweed need this
  shadow_dom boolean NOT NULL DEFAULT false,
  master_listing_slug text,           -- soft join into master_listings (no FK)
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dispensaries_city_idx ON dispensaries(city);
CREATE INDEX IF NOT EXISTS dispensaries_platform_idx ON dispensaries(menu_platform);
CREATE INDEX IF NOT EXISTS dispensaries_geo_idx ON dispensaries(lat, lng) WHERE geocode_status = 'verified';


-- 3. menu_snapshots -----------------------------------------------------------
-- One row per (dispensary, scrape run). Append-only.
-- An empty or error snapshot is RECORDED with status — never overwrites a
-- prior good snapshot with empty. This is the breakage detection ledger.
--
CREATE TABLE IF NOT EXISTS menu_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dispensary_id uuid NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  platform menu_platform NOT NULL,
  status snapshot_status NOT NULL,
  item_count integer NOT NULL DEFAULT 0,
  duration_ms integer,
  error_message text,
  adapter_version text,             -- e.g. 'jane@1.0.0' — bump on parser changes
  raw_payload_url text              -- optional pointer to stored full payload (S3 etc.)
);

CREATE INDEX IF NOT EXISTS menu_snapshots_disp_recent_idx
  ON menu_snapshots(dispensary_id, scraped_at DESC);
CREATE INDEX IF NOT EXISTS menu_snapshots_status_idx
  ON menu_snapshots(status, scraped_at DESC);


-- 4. canonical_products -------------------------------------------------------
-- The dedup target. brand + product_name + canonical_unit identity that
-- menu_items across stores point at. Baselines compute per row here.
--
-- canonical_brand_id matches brand_master.json.canonical_id (e.g. 'rythm').
-- canonical_category is one of: flower | preroll | vape | concentrate | edible | topical | tincture | other
-- canonical_unit  examples: '3.5g', '7g', '14g', '28g', '0.5g', '1g', '2g',
--                           '0.35g_10pk', '0.5g_5pk', '1g_1pk',
--                           '100mg_10pk', '100mg_20pk', '200mg_20pk'
-- thc_tier is the IL DOR excise tier (set at item normalization time).
--
CREATE TABLE IF NOT EXISTS canonical_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_brand_id text NOT NULL,
  product_name text NOT NULL,             -- normalized lowercase product name
  product_name_display text,              -- title-cased display version
  canonical_category text NOT NULL,
  canonical_unit text NOT NULL,
  unit_count integer NOT NULL DEFAULT 1,  -- pack count; 1 for singles
  default_thc_tier thc_tier NOT NULL DEFAULT 'unknown',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  -- Identity uniqueness: same brand + product + unit + pack count = same SKU
  UNIQUE (canonical_brand_id, product_name, canonical_unit, unit_count)
);

CREATE INDEX IF NOT EXISTS canonical_products_brand_idx
  ON canonical_products(canonical_brand_id);
CREATE INDEX IF NOT EXISTS canonical_products_category_unit_idx
  ON canonical_products(canonical_category, canonical_unit);


-- 5. menu_items ---------------------------------------------------------------
-- Per-SKU per-snapshot row. Stores BOTH raw (as seen on the menu) and
-- normalized (Phase 5) fields, so we never lose the original signal.
-- canonical_product_id is NULL until normalization runs; unmatched rows
-- get queued in review_queue.
--
-- price_pretax: what the customer sees on the shelf (USD, no tax).
-- price_out_the_door: computed by Phase 7 tax engine using disp.city +
--                     menu_item.thc_tier.
--
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id uuid NOT NULL REFERENCES menu_snapshots(id) ON DELETE CASCADE,
  dispensary_id uuid NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
  scraped_at timestamptz NOT NULL,        -- denormalized from snapshot for fast time-series queries

  -- Raw fields (whatever the adapter pulled)
  raw_name text NOT NULL,
  raw_brand text,
  raw_category text,
  raw_weight text,                        -- "3.5g", "eighth", "1/8 oz", etc.
  raw_price numeric NOT NULL,             -- shelf price as listed (pre-tax)
  raw_sale_price numeric,                 -- non-null when on sale
  raw_thc text,                           -- "22.5%", "20-24%", "THC: 21.8% / CBD: 0.4%"
  is_on_sale boolean NOT NULL DEFAULT false,
  raw_payload jsonb,                      -- full original record from the platform

  -- Normalized fields (Phase 5 populates; nullable until then)
  canonical_product_id uuid REFERENCES canonical_products(id) ON DELETE SET NULL,
  canonical_brand_id text,
  canonical_category text,
  canonical_unit text,
  unit_count integer,
  thc_pct numeric,                        -- single comparable %; for ranges = midpoint
  thc_pct_low numeric,                    -- preserved for ranges
  thc_pct_high numeric,
  thc_tier thc_tier NOT NULL DEFAULT 'unknown',
  price_pretax numeric,                   -- == raw_sale_price when on sale, else raw_price
  price_out_the_door numeric,             -- Phase 7
  match_confidence numeric,               -- 0..1; null until normalized

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Hot path: a baseline query asks "what's every observation of canonical X
-- in the last N days within geo Y?" → canonical + recency is the index.
CREATE INDEX IF NOT EXISTS menu_items_canonical_recent_idx
  ON menu_items(canonical_product_id, scraped_at DESC)
  WHERE canonical_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS menu_items_disp_snapshot_idx
  ON menu_items(dispensary_id, snapshot_id);

CREATE INDEX IF NOT EXISTS menu_items_unmatched_idx
  ON menu_items(scraped_at DESC)
  WHERE canonical_product_id IS NULL;


-- 6. price_baselines ----------------------------------------------------------
-- Append-only — one row per (canonical_product, geo_scope, computed_at).
-- A new row each baseline recompute = built-in time series, the "Should I
-- Wait" series falls out for free.
--
-- geo_scope: opaque string today ('central_il', 'peoria_metro_30mi').
-- Future: per-city or per-radius. Keep flexible.
--
-- price_kind: 'pretax' (the shelf-level band) or 'otd' (out-the-door band,
-- post-tax). Store both so consumers can pick what to show.
--
CREATE TABLE IF NOT EXISTS price_baselines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_product_id uuid NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
  geo_scope text NOT NULL DEFAULT 'central_il',
  price_kind text NOT NULL DEFAULT 'pretax' CHECK (price_kind IN ('pretax', 'otd')),

  median numeric NOT NULL,
  min numeric NOT NULL,
  max numeric NOT NULL,
  p25 numeric NOT NULL,
  p75 numeric NOT NULL,
  sample_size integer NOT NULL,
  source_snapshot_window_start timestamptz NOT NULL,
  source_snapshot_window_end timestamptz NOT NULL,

  sanity_passed boolean NOT NULL DEFAULT true,
  sanity_flag text,                       -- non-null when sanity gate flagged

  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS price_baselines_lookup_idx
  ON price_baselines(canonical_product_id, geo_scope, price_kind, computed_at DESC);

CREATE INDEX IF NOT EXISTS price_baselines_recent_clean_idx
  ON price_baselines(computed_at DESC)
  WHERE sanity_passed = true;


-- 7. review_queue -------------------------------------------------------------
-- Unmatched / low-confidence / sanity-flagged items land here for human
-- review. NEVER silently drop; accuracy > coverage.
--
CREATE TABLE IF NOT EXISTS review_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  canonical_product_id uuid REFERENCES canonical_products(id) ON DELETE SET NULL,
  baseline_id uuid REFERENCES price_baselines(id) ON DELETE SET NULL,
  reason review_reason NOT NULL,
  detail text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by text,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- At least one of these must be set so we know what's being reviewed.
  CHECK (
    menu_item_id IS NOT NULL OR
    canonical_product_id IS NOT NULL OR
    baseline_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS review_queue_open_idx
  ON review_queue(reason, created_at DESC)
  WHERE resolved = false;


-- 8. updated_at trigger for dispensaries -------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_dispensaries()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispensaries_updated_at ON dispensaries;
CREATE TRIGGER trg_dispensaries_updated_at
  BEFORE UPDATE ON dispensaries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_dispensaries();


-- 9. View: latest_menu_items --------------------------------------------------
-- Convenience: most-recent menu_item per (dispensary, canonical_product).
-- Useful for "show me the current menu of dispensary X" or "what's the
-- current price of canonical X at dispensary Y?"
--
CREATE OR REPLACE VIEW latest_menu_items AS
SELECT DISTINCT ON (mi.dispensary_id, mi.canonical_product_id)
  mi.*
FROM menu_items mi
WHERE mi.canonical_product_id IS NOT NULL
ORDER BY mi.dispensary_id, mi.canonical_product_id, mi.scraped_at DESC;


-- 10. View: latest_baselines --------------------------------------------------
-- Current published baseline per (canonical_product, geo_scope, price_kind).
-- Only rows where the sanity gate passed.
--
CREATE OR REPLACE VIEW latest_baselines AS
SELECT DISTINCT ON (canonical_product_id, geo_scope, price_kind)
  *
FROM price_baselines
WHERE sanity_passed = true
ORDER BY canonical_product_id, geo_scope, price_kind, computed_at DESC;


COMMIT;

-- ============================================================================
-- Acceptance check (run after applying):
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'dispensaries', 'menu_snapshots', 'menu_items',
--     'canonical_products', 'price_baselines', 'review_queue'
--   );  -- expect 6 rows
--
-- SELECT typname FROM pg_type
-- WHERE typname IN ('menu_platform', 'geocode_status', 'snapshot_status',
--                   'thc_tier', 'review_reason');  -- expect 5 rows
-- ============================================================================
