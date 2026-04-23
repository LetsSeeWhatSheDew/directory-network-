-- Migration: 2026-04-23-stripe-events-processed.sql
-- Purpose: idempotency ledger for the Stripe webhook at
--          app/api/stripe/webhook/route.ts.
--
--          Stripe redelivers webhook events aggressively when our endpoint
--          is slow or returns non-2xx. Without a processed-events ledger
--          we'd double-upsert pro_users on every retry (harmless for the
--          row but noisy in logs) and double-log events that are meant to
--          fire once. This table gives the handler a cheap "have I seen
--          this event.id before?" check.
--
-- Scope:   one row per Stripe event.id we've successfully dispatched.
--          The webhook inserts AFTER a clean handler run, so a retry of a
--          crashed run will re-dispatch — which is exactly what we want,
--          because our actual state mutations (upsert pro_users) are
--          themselves idempotent.
--
-- Safety:  CREATE TABLE IF NOT EXISTS is safe to re-run.
--
-- NOT YET APPLIED. Matthew reviews; Code applies via Supabase SQL Editor
-- or mcp__supabase__apply_migration in the Phase 2 Stripe cutover
-- (alongside sql/migrations/2026-04-18-pro-users.sql — the webhook depends
-- on both tables existing).

CREATE TABLE IF NOT EXISTS stripe_events_processed (
  id text PRIMARY KEY,              -- Stripe event.id, e.g., "evt_1P..."
  event_type text NOT NULL,         -- e.g., "customer.subscription.created"
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Lookup by id is the primary key; other indexes support ad-hoc queries
-- ("what did we process in the last hour?", "how many subscription
--  events have we handled this month?").
CREATE INDEX IF NOT EXISTS stripe_events_processed_processed_at_idx
  ON stripe_events_processed (processed_at DESC);
CREATE INDEX IF NOT EXISTS stripe_events_processed_event_type_idx
  ON stripe_events_processed (event_type);
