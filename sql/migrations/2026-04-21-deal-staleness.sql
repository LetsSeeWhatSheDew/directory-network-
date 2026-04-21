-- NOT YET APPLIED
-- Migration: deal staleness columns + indexes
-- Author: Cowork
-- Date: 2026-04-21
--
-- Context: The current deals table has no column recording *why* a deal was
-- deactivated, and no column recording the last time we confirmed the deal
-- was still real. The daily stale-deal job (see
-- docs/handoffs/stale-deal-job-spec-20260421.md) needs both.
--
-- Naming note: the Cowork task spec referred to "status" and "end_date" and
-- "last_verified_at". The live schema uses `is_active boolean` (no `status`
-- column) and `expires_at timestamptz` (no `end_date` column), and already
-- has `verified_at timestamptz`. This migration keeps the existing names —
-- we set `is_active = false` to deactivate, `status_reason` to record why,
-- and reuse `verified_at` as the "last confirmed real" timestamp. No new
-- `last_verified_at` column is added — that would duplicate `verified_at`.
--
-- Rollback:
--   ALTER TABLE public.deals DROP COLUMN IF EXISTS status_reason;
--   DROP INDEX IF EXISTS public.deals_active_expires_idx;
--   DROP INDEX IF EXISTS public.deals_active_created_idx;

BEGIN;

-- 1. Record why a deal was deactivated (nullable — active deals leave this null).
--   Expected values (enforced in application code, not a CHECK, to avoid
--   locking us in while we learn what categories matter):
--     'expired'        — expires_at is in the past
--     'stale'          — no expires_at and older than staleness threshold
--     'dispensary_closed' — master listing went inactive
--     'manual'         — hand-deactivated in admin
--     'duplicate'      — dedup pass
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS status_reason text;

COMMENT ON COLUMN public.deals.status_reason IS
  'Reason the deal was deactivated. NULL on active deals. Expected values: expired, stale, dispensary_closed, manual, duplicate. Application-enforced (no CHECK).';

-- 2. Indexes to keep the daily job cheap.
--    Note: the stale-deal job's WHERE clause is
--      WHERE is_active = TRUE AND expires_at < NOW()
--    and
--      WHERE is_active = TRUE AND expires_at IS NULL AND created_at < threshold
--    Both are well-served by partial indexes restricted to active rows, which
--    stay small because inactive rows dominate over time.

CREATE INDEX IF NOT EXISTS deals_active_expires_idx
  ON public.deals (expires_at)
  WHERE is_active IS TRUE;

CREATE INDEX IF NOT EXISTS deals_active_created_idx
  ON public.deals (created_at)
  WHERE is_active IS TRUE;

-- 3. Nothing to backfill — status_reason is nullable and active rows stay
--    null until a job deactivates them.

COMMIT;

-- Apply via Supabase SQL Editor or MCP apply_migration.
-- Sign-off required: Matthew.
