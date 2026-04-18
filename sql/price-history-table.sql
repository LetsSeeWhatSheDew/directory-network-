-- sql/price-history-table.sql
-- Price history tracking for PuffPrice PRO features:
--   • "Beat my last price" alerts
--   • Trend lines on listing pages ("$45 last week, $28 today")
--   • Monthly savings report ("you saved $84 this month")
--
-- STATUS: deal_price_history already exists in production (verified via
-- Supabase MCP on 2026-04-17) with: id, listing_slug, category,
-- product_name, price, unit, discount_value, recorded_at, source,
-- project_tag. This migration is ADDITIVE and IDEMPOTENT — safe to run
-- against the existing table. It:
--   1. Creates deal_price_history if missing (won't overwrite).
--   2. Adds any missing columns we use for PRO features.
--   3. Creates helpful indexes if missing.
--   4. Creates/refreshes the best_prices_30d aggregate view.
--
-- Run in the Supabase SQL Editor when ready. Do NOT run blindly against
-- a DB that hasn't been backed up.

BEGIN;

-- 1. Base table (idempotent — exists on production as of Apr 2026)
CREATE TABLE IF NOT EXISTS deal_price_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_slug text NOT NULL REFERENCES master_listings(slug) ON DELETE CASCADE,
  category text,
  product_name text NOT NULL,
  price numeric NOT NULL,
  unit text,
  discount_value numeric,
  recorded_at timestamptz DEFAULT now(),
  source text DEFAULT 'manual',
  project_tag text DEFAULT 'green'
);

-- 2. Additive columns for PRO features. Uses IF NOT EXISTS so reruns
-- are no-ops on production where these may or may not exist already.
ALTER TABLE deal_price_history
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES deals(id) ON DELETE SET NULL;

-- `savings` as a STORED generated column. If the column already exists
-- (e.g. from a previous migration attempt) we leave it alone; otherwise
-- add it. Postgres won't let us use IF NOT EXISTS on a generated column
-- in some versions, so guard with a DO block.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deal_price_history'
      AND column_name = 'savings'
  ) THEN
    EXECUTE 'ALTER TABLE deal_price_history
             ADD COLUMN savings numeric
             GENERATED ALWAYS AS (COALESCE(original_price, price) - price) STORED';
  END IF;
END $$;

-- 3. Helpful indexes for PRO-feature queries
CREATE INDEX IF NOT EXISTS deal_price_history_slug_idx
  ON deal_price_history(listing_slug);
CREATE INDEX IF NOT EXISTS deal_price_history_product_idx
  ON deal_price_history(listing_slug, product_name);
CREATE INDEX IF NOT EXISTS deal_price_history_recorded_idx
  ON deal_price_history(recorded_at DESC);

-- 4. Aggregate view: lowest/highest/avg price per (slug, product) in
-- the last 30 days. Drives the "you saved $84 this month" feature
-- and the "this eighth was $45 last week, $28 today" comparison.
CREATE OR REPLACE VIEW best_prices_30d AS
SELECT
  listing_slug,
  product_name,
  MIN(price)                     AS lowest_price,
  MAX(price)                     AS highest_price,
  AVG(price)::numeric(10, 2)     AS avg_price,
  COUNT(*)                       AS data_points,
  MAX(recorded_at)               AS last_seen
FROM deal_price_history
WHERE recorded_at > now() - interval '30 days'
GROUP BY listing_slug, product_name;

COMMIT;
