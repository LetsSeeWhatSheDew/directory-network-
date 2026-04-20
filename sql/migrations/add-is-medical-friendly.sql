-- NOT YET APPLIED — scaffolding only.
--
-- Cowork 2026-04-20 late-late attempt: blocked.
-- Supabase MCP surfaced read-only this session (both
-- `apply_migration` and `execute_sql` rejected DDL with
-- "cannot execute ALTER TABLE in a read-only transaction").
-- Verified via information_schema that the column does NOT yet
-- exist on master_listings (107 rows, unchanged schema as of tonight).
-- Apply via Supabase SQL editor. Once applied, bump the header to
-- "APPLIED <timestamp>" and leave this comment trail.
--
-- Purpose: expose whether a dispensary charges the lower medical tax
-- rate (1% IL state tax + local) vs. the recreational rate (10–25%
-- depending on product). "Medical-friendly" here means the dispensary
-- accepts IL medical cards AND honors the medical tax when presented.
--
-- BEFORE APPLYING:
--   1. Confirm source for per-dispensary medical status (IDFPR list,
--      each dispensary website, or owner self-report via claim flow).
--   2. Decide whether to seed from automated scrape or leave NULL and
--      let owners fill in during claim.
--   3. Update app/l/[id]/page.tsx type Listing and master_listings RLS
--      if public read required.
--
-- Run via Supabase SQL editor OR:
--   supabase migration new add_is_medical_friendly
--   supabase db push
--
-- Column is nullable: NULL = unknown, true = medical tax honored,
-- false = recreational only. Nullable is deliberate — we'd rather show
-- "unknown" than lie.

ALTER TABLE master_listings
  ADD COLUMN IF NOT EXISTS is_medical_friendly boolean;

COMMENT ON COLUMN master_listings.is_medical_friendly IS
  'NULL = unknown, true = honors IL medical tax rate for cardholders, false = recreational only';

-- Optional helper index if we end up filtering on it in hot paths:
-- CREATE INDEX IF NOT EXISTS idx_master_listings_medical
--   ON master_listings (is_medical_friendly)
--   WHERE is_medical_friendly IS TRUE;
