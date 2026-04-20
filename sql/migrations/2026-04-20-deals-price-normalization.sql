-- ============================================================
-- 2026-04-20-deals-price-normalization.sql
--
-- *** NOT YET APPLIED ***
-- This migration changes write semantics (adds a NOTICE-raising
-- trigger on deals INSERT/UPDATE). Matthew must approve before
-- Code (or any session) applies it. Apply after this approval
-- via Supabase SQL editor; then bump the header to
--   "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Prepare the `deals` table to support the PuffPrice Index (weekly
-- $/g flower price signal) by:
--   (1) adding the four missing normalization columns the audit
--       flagged (weight_grams, brand, thc_percent, product_name)
--   (2) installing a soft-warn trigger that logs a NOTICE (not an
--       error — old-format deals still insert cleanly) when a new
--       row arrives without enough fields to derive $/g
--   (3) adding a composite index on (category, created_at) to
--       make the weekly rollup query O(log n) even at 10k+ deals
--
-- Dependencies / prior work
-- -------------------------
-- Existing `deals` columns already sufficient for base PPG:
--   price_per_gram numeric (nullable) — the fastest path, set at ingest
--   unit text           (nullable) — 'gram' | 'eighth' | 'ounce' | ...
--   sale_price numeric  (nullable)
--   original_price numeric (nullable)
--   category text       (nullable)
-- Confirmed present via information_schema, 2026-04-20. No duplicate
-- ADD COLUMN IF NOT EXISTS statements needed for those five.
--
-- Paired docs
-- -----------
--   docs/audits/puffprice-index-feasibility-20260420.md
--   sql/queries/puffprice-index-weekly.sql        (the target query)
--
-- Rollback
-- --------
-- Down migration is inlined at the bottom (commented out). The
-- trigger is the only hard-to-reverse piece — DROP TRIGGER is safe.
-- Column ADDs are additive, so rollback is purely cosmetic unless
-- external consumers start depending on the new columns.
-- ============================================================

-- ---------- (1) New normalization columns ----------

-- Weight in decimal grams, normalized from whatever unit the deal
-- originally shipped with. Scraper (or manual entry) is responsible
-- for writing this normalized value so that downstream queries never
-- need to know about eighths/quarters/ounces.
-- Example: an "eighth" deal → weight_grams = 3.5; "ounce" → 28.0.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS weight_grams numeric;

COMMENT ON COLUMN deals.weight_grams IS
  'Product weight normalized to grams (decimal). Eighth=3.5, quarter=7, half=14, ounce=28. Null when deal is %-off-floating-menu (no anchor).';

-- Brand for normalization between premium/value tiers so the Index
-- doesn't just track whichever premium SKU got discounted this week.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS brand text;

COMMENT ON COLUMN deals.brand IS
  'Brand as listed on the dispensary menu — e.g., Cresco, Verano, RISE house, Simply Herb. Free text; may be normalized into a brands table later.';

-- THC percentage as reported on the menu. Used to explain price
-- spread ("why is this eighth $25 and this one $60?") — also a
-- signal we''ll eventually surface in the UI.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS thc_percent numeric;

COMMENT ON COLUMN deals.thc_percent IS
  'THC percentage as listed on the menu (0–100). Used for price-per-percent-THC normalization in future Index versions.';

-- Product name as listed on the dispensary menu. Used to dedupe
-- deals pointing at the same SKU across dispensaries so the Index
-- doesn''t double-count.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS product_name text;

COMMENT ON COLUMN deals.product_name IS
  'Menu product name — e.g., "Kush Mints 14g Cartridge". Dedup key with (brand, weight_grams).';

-- ---------- (2) Soft warning trigger on insert/update ----------
-- Rationale: we still accept old-format deals (percent-off-no-anchor),
-- but we want to see at write-time when a deal lands without enough
-- information to contribute to the Index. NOTICE shows up in
-- Supabase logs but does not raise an exception — no writes fail.

CREATE OR REPLACE FUNCTION deals_ppg_ready_warning() RETURNS trigger AS $$
BEGIN
  -- Only warn for flower / pre-roll categories — other categories
  -- are not part of the Index.
  IF NEW.category IS NULL OR NEW.category NOT IN ('flower', 'pre-roll') THEN
    RETURN NEW;
  END IF;

  -- Acceptable if direct PPG is set
  IF NEW.price_per_gram IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Acceptable if we can derive PPG from sale_price + weight_grams
  IF NEW.sale_price IS NOT NULL AND NEW.weight_grams IS NOT NULL AND NEW.weight_grams > 0 THEN
    RETURN NEW;
  END IF;

  -- Acceptable if we can derive from original_price + percent-off + weight_grams
  IF NEW.original_price IS NOT NULL
     AND NEW.discount_unit = 'percent'
     AND NEW.discount_value IS NOT NULL
     AND NEW.weight_grams IS NOT NULL
     AND NEW.weight_grams > 0 THEN
    RETURN NEW;
  END IF;

  RAISE NOTICE 'deals_ppg_ready_warning: deal id=% category=% has no price-per-gram path. Index will skip this row.',
    NEW.id, NEW.category;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deals_ppg_ready_warning_trigger ON deals;
CREATE TRIGGER deals_ppg_ready_warning_trigger
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION deals_ppg_ready_warning();

-- ---------- (3) Weekly-query performance index ----------
-- The weekly Index query filters by category and groups by
-- date_trunc('week', created_at). A composite index on
-- (category, created_at) keeps the rollup O(log n) even as the
-- deals table grows past 10k rows.

CREATE INDEX IF NOT EXISTS deals_category_created_at_idx
  ON deals (category, created_at DESC);

-- ---------- Post-apply verification queries ----------
-- Paste results as comments below after apply.
--
-- (a) Confirm the 4 new columns landed:
--     SELECT column_name FROM information_schema.columns
--       WHERE table_name='deals'
--         AND column_name IN ('weight_grams','brand','thc_percent','product_name')
--       ORDER BY column_name;
--     expected: 4 rows.
--
-- (b) Confirm the trigger is live:
--     SELECT trigger_name, event_manipulation
--       FROM information_schema.triggers
--       WHERE event_object_table='deals'
--         AND trigger_name='deals_ppg_ready_warning_trigger';
--     expected: 2 rows (INSERT and UPDATE).
--
-- (c) Confirm the index is live:
--     SELECT indexname FROM pg_indexes
--       WHERE tablename='deals' AND indexname='deals_category_created_at_idx';
--     expected: 1 row.
--
-- (d) Quick ingest-time NOTICE sanity check (in a harmless test deal):
--     INSERT INTO deals (id, listing_slug, project_tag, title, category,
--                        is_active, source, discount_type, discount_value, discount_unit)
--       VALUES (gen_random_uuid(), 'altius-dispensary-carol-stream', 'green',
--               '[TEST] PPG trigger smoke test', 'flower',
--               false, 'test', 'percent_off', 20, 'percent');
--     Expected: NOTICE in the SQL editor log saying "Index will skip this row."
--     Clean up: DELETE FROM deals WHERE title LIKE '[TEST]%' AND source='test';
--
-- ---------- Rollback (commented out) ----------
-- DROP TRIGGER IF EXISTS deals_ppg_ready_warning_trigger ON deals;
-- DROP FUNCTION IF EXISTS deals_ppg_ready_warning();
-- DROP INDEX IF EXISTS deals_category_created_at_idx;
-- ALTER TABLE deals DROP COLUMN IF EXISTS product_name;
-- ALTER TABLE deals DROP COLUMN IF EXISTS thc_percent;
-- ALTER TABLE deals DROP COLUMN IF EXISTS brand;
-- ALTER TABLE deals DROP COLUMN IF EXISTS weight_grams;
