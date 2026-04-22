-- ============================================================
-- 2026-04-22-add-deal-brand-weight-columns.sql
--
-- *** NOT YET APPLIED ***
-- Apply via Supabase SQL editor after Matthew reviews. Then bump
-- this header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Unblocks two downstream workflows that both need brand + weight
-- fields on the canonical `deals` table:
--
--   1. scripts/compute-ppg-from-anchors.ts — currently fails because
--      deals.brand and deals.weight_grams don't exist yet.
--   2. scripts/ingest-scraped-deals.ts — Task 2 this session; promotes
--      deal_submissions rows to deals and needs these 4 columns to
--      round-trip the submission payload without loss.
--
-- All columns are NULLABLE so existing Apr 14 rows keep working; the
-- scraper + submission pipelines populate these going forward.
--
-- Partial index on brand is scoped to active deals with a non-null
-- brand — this is what /brand/[slug] and brand-filtered category
-- queries will hit once brand surfaces on cards.
--
-- Rollback
-- --------
-- ALTER TABLE public.deals
--   DROP COLUMN IF EXISTS brand,
--   DROP COLUMN IF EXISTS weight_grams,
--   DROP COLUMN IF EXISTS mg_thc,
--   DROP COLUMN IF EXISTS count;
-- DROP INDEX IF EXISTS deals_brand_idx;
-- ============================================================

BEGIN;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS weight_grams numeric,
  ADD COLUMN IF NOT EXISTS mg_thc numeric,
  ADD COLUMN IF NOT EXISTS count integer;

COMMENT ON COLUMN public.deals.brand IS
  'Brand name. Populated by scraper ingest + deal_submissions promotion. NULL for legacy pre-Apr-22 rows. Canonical list lives in anchor_skus.brand.';

COMMENT ON COLUMN public.deals.weight_grams IS
  'Product weight in grams. 3.5/7/14/28 for flower, 0.5/1 for concentrate, null for non-weighable (edibles/tinctures/accessories).';

COMMENT ON COLUMN public.deals.mg_thc IS
  'Total THC milligrams. Used by edibles and tinctures. Denominator for price_per_mg computations.';

COMMENT ON COLUMN public.deals.count IS
  'Unit count for multi-pack products (pre-roll packs, gummy counts). Denominator for price_per_unit computations.';

CREATE INDEX IF NOT EXISTS deals_brand_idx
  ON public.deals (brand)
  WHERE is_active IS TRUE AND brand IS NOT NULL;

COMMIT;

-- ---------- Post-apply verification ----------
-- Paste results inline as comments after applying.
--
-- (a) Confirm columns exist:
--     SELECT column_name, data_type FROM information_schema.columns
--       WHERE table_schema='public' AND table_name='deals'
--         AND column_name IN ('brand','weight_grams','mg_thc','count')
--       ORDER BY column_name;
--     expect 4 rows.
--
-- (b) Confirm partial index:
--     SELECT indexname, indexdef FROM pg_indexes
--       WHERE schemaname='public' AND tablename='deals'
--         AND indexname='deals_brand_idx';
--     expect 1 row with "WHERE ((is_active IS TRUE) AND (brand IS NOT NULL))".
--
-- (c) Legacy rows unaffected:
--     SELECT count(*) FROM public.deals WHERE brand IS NOT NULL;
--     expect 0 before any ingest run; non-zero after scrape ingest promotes.
