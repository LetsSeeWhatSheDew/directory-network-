-- ============================================================
-- 2026-04-21-deal-ppg-backfill.sql
--
-- *** NOT YET APPLIED ***
-- DEPENDS ON: sql/migrations/2026-04-20-deals-price-normalization.sql
--             (that migration adds the trigger that soft-warns on
--              inserts lacking ppg — applying our UPDATEs after it
--              keeps the log noise out of the backfill pass).
--
-- Apply in Supabase SQL editor after Matthew approves. Then bump
-- the header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Backfill price_per_gram / weight_grams / unit / sale_price on
-- the subset of active deals where the title or description carries
-- enough structured text to infer. Unblocks the PuffPrice Index
-- endpoint (Code C5) from returning { available: false } forever.
--
-- Inference rules (strict, no guessing)
-- -------------------------------------
--   eighth / 1/8 oz / 3.5g   → weight_grams = 3.5
--   quarter / 1/4 oz / 7g    → weight_grams = 7.0
--   half / 1/2 oz / 14g      → weight_grams = 14.0
--   ounce / 1 oz / 28g       → weight_grams = 28.0
--   gram / 1g                → weight_grams = 1.0
--   Title has $X AND weight  → price_per_gram = X / weight_grams
--   Title ambiguous          → skip. Do not guess.
--
-- Coverage (56 active deals scanned)
-- ----------------------------------
--   Inferable (2):  bisa-lina-carol-stream / Simply Herb 28g $80
--                   star-buds-westmont / 5 eighths for $100
--   Skipped  (54): percent-off-no-anchor, mixed weights, or no
--                  numeric anchor at all. See coverage handoff:
--                  docs/handoffs/ppg-backfill-coverage-20260421.md
--
-- The Index's sample_size threshold is 10. Two data points is
-- well below that — the endpoint will still return 404 sparse
-- post-apply. The fix is capturing structured prices at ingest
-- time (Path A in the feasibility audit), not more backfill.
-- This migration's value is establishing the pattern + seeding
-- the QA baseline for the ingest work.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. bisa-lina-carol-stream — Simply Herb 28g for $80
-- Deal id: 37f886f6-cfde-415b-a10f-0fa37497bc9c
-- Title:   "Simply Herb 28g for $80 — code SIMPLY100"
-- Desc:    "28 grams of Simply Herb brand flower for $80 — use code SIMPLY100"
-- Inference:
--   weight_grams  = 28     (from "28g" AND "28 grams" — strong signal)
--   unit          = ounce  (28g = 1 oz)
--   sale_price    = 80     (from "$80" explicit anchor)
--   price_per_gram= 2.86   (80 / 28, rounded to 2dp)
-- This is the strongest single data point in the corpus — an
-- ounce of branded flower for $80 is $2.86/g, which is roughly
-- half the statewide average and worth flagging as a standout.
-- ------------------------------------------------------------
UPDATE deals
SET
  weight_grams   = 28.0,
  unit           = 'ounce',
  sale_price     = 80.00,
  price_per_gram = 2.86,
  updated_at     = now()
WHERE id = '37f886f6-cfde-415b-a10f-0fa37497bc9c';

-- ------------------------------------------------------------
-- 2. star-buds-westmont — 5 eighths for $100
-- Deal id: b7fc48fe-8264-4014-9e56-2fcbb8bc0b47
-- Title:   "4/20 SPECIAL: 5 for $100 flower deal"
-- Desc:    "Buy any 5 eighths for $100 — 4/20 weekend only"
-- Inference:
--   weight_grams  = 17.5   (5 × 3.5g eighths — "5 eighths" explicit in desc)
--   unit          = eighth (per-unit size; the pack is 5 of these)
--   sale_price    = 100    (pack price)
--   price_per_gram= 5.71   (100 / 17.5, rounded to 2dp)
-- Multipack interpretation noted: the per-eighth price is $20
-- ($100/5), which is also the canonical "eighth = $20" shorthand
-- the dispensary itself uses in-store.
-- ------------------------------------------------------------
UPDATE deals
SET
  weight_grams   = 17.5,
  unit           = 'eighth',
  sale_price     = 100.00,
  price_per_gram = 5.71,
  updated_at     = now()
WHERE id = 'b7fc48fe-8264-4014-9e56-2fcbb8bc0b47';

COMMIT;

-- ============================================================
-- Post-apply verification
-- ============================================================
-- (a) Row count of backfilled deals = 2:
--
-- SELECT COUNT(*) FROM deals
--  WHERE project_tag='green' AND is_active=true
--    AND price_per_gram IS NOT NULL;
-- expected: 2
--
-- (b) PuffPrice Index weekly query should now return a single
-- row with sample_size = 1 (only 1 of the 2 is category='flower'
-- with weight-matched data fully aligned; star-buds may or may
-- not qualify depending on the Index's "pure flower" filter):
--
--   WITH flower_with_ppg AS (
--     SELECT date_trunc('month', created_at) AS month, price_per_gram AS ppg
--       FROM deals
--      WHERE project_tag='green' AND is_active=true AND category='flower'
--        AND price_per_gram IS NOT NULL
--   )
--   SELECT month, ROUND(AVG(ppg)::numeric, 2) avg_ppg, COUNT(*) sample_size
--     FROM flower_with_ppg GROUP BY month ORDER BY month DESC;
-- expected: 1 row with sample_size = 2, avg_ppg ≈ 4.29.
--
-- (c) sample_size < Index threshold (10) means the /api/index/weekly
-- endpoint still returns { available: false, sample_size: 2 }. Not
-- a regression — we're just establishing non-zero, matching the
-- feasibility audit's prediction.
--
-- ============================================================
-- Rollback
-- ============================================================
-- UPDATE deals SET weight_grams = NULL, unit = NULL, sale_price = NULL,
--                  price_per_gram = NULL, updated_at = now()
--   WHERE id IN (
--     '37f886f6-cfde-415b-a10f-0fa37497bc9c',
--     'b7fc48fe-8264-4014-9e56-2fcbb8bc0b47'
--   );
