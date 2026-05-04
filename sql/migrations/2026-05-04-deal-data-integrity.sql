-- NOT YET APPLIED
-- Migration: deal data integrity for the cleanup PR's Verified row pattern
-- Author: Code (via cleanup PR)
-- Date: 2026-05-04
-- Pairs with: app/components/VerifiedRow.tsx
--
-- Context: the cleanup PR introduces the "✓ Verified [discount]% · [time]"
-- pattern at the foot of every deal card and below the hero deal headline.
-- That pattern needs two pieces of data on every row:
--
--   1. A trustworthy `verified_at` timestamp.
--   2. A discount percent the UI can render verbatim.
--
-- Audit findings before this migration:
--
--   `verified_at`     — column exists (added by 2026-04-22-add-verified-at-to-view.sql).
--                       Backfill ran via 2026-04-22-verified-at-backfill.sql,
--                       so most active rows have a value. Some recurring
--                       deals inserted by the daily cron sweep can land
--                       with NULL verified_at if the cron path forgets to
--                       set it. We harden the default here.
--
--   `discount_value`  — column exists. Stores the percent number when
--                       discount_unit='percent' (e.g. 25 for "25% off")
--                       and the dollar number when discount_unit='dollars'
--                       (e.g. 10 for "$10 off"). The VerifiedRow component
--                       already reads these two columns together; no new
--                       column is required.
--
--   `discount_unit`   — column exists. Constrained to ('percent','dollars')
--                       in app code; not in the DB. Cleanup PR adds a
--                       CHECK constraint here so a typo can't smuggle in
--                       a third unit.
--
-- Rollback:
--   ALTER TABLE public.deals
--     ALTER COLUMN verified_at DROP DEFAULT,
--     DROP CONSTRAINT IF EXISTS deals_discount_unit_check;
--
-- Sign-off required: Matthew (review before apply).

BEGIN;

-- ------------------------------------------------------------
-- 1. verified_at default — every new deal row gets NOW() unless
--    the caller (scraper, manual insert) sets it explicitly.
--    NOT NULL is intentionally NOT enforced yet because there
--    are historical inactive rows with NULL verified_at; flipping
--    NOT NULL on those would block the migration. Set the default
--    so future inserts are safe; backfill the historical nulls
--    only if/when we want to enforce NOT NULL.
-- ------------------------------------------------------------

ALTER TABLE public.deals
  ALTER COLUMN verified_at SET DEFAULT NOW();

-- Backfill any active deals that still slipped through with NULL
-- (e.g. a recurring deal inserted by an older code path). Only
-- touches rows where the column is null AND the deal is active —
-- we do NOT rewrite history on inactive rows.
UPDATE public.deals
SET verified_at = COALESCE(verified_at, updated_at, created_at, NOW())
WHERE verified_at IS NULL
  AND is_active = true;

-- ------------------------------------------------------------
-- 2. discount_unit constraint — guards against silent typos in
--    scraper / manual insert paths. The Verified row pattern
--    only knows how to render "percent" and "dollars"; a third
--    unit would silently drop the discount label.
-- ------------------------------------------------------------

ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_discount_unit_check;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_discount_unit_check
  CHECK (discount_unit IS NULL OR discount_unit IN ('percent', 'dollars'));

-- ------------------------------------------------------------
-- 3. discount_value sanity check — non-negative numbers only.
--    Caught by the UI today (Number(d.discount_value) || 0)
--    but a DB-level guard is cheap insurance.
-- ------------------------------------------------------------

ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_discount_value_nonneg;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_discount_value_nonneg
  CHECK (discount_value IS NULL OR discount_value >= 0);

COMMIT;

-- ============================================================
-- Verification queries — run after apply
-- ============================================================

-- (a) Confirm the default landed
--   SELECT column_default FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='deals' AND column_name='verified_at';
--   -- Expected: now()

-- (b) Confirm no active deal still has NULL verified_at
--   SELECT COUNT(*) FROM public.deals
--   WHERE verified_at IS NULL AND is_active = true;
--   -- Expected: 0

-- (c) Confirm both check constraints are in place
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.deals'::regclass
--     AND conname IN ('deals_discount_unit_check', 'deals_discount_value_nonneg');
--   -- Expected: 2 rows.
