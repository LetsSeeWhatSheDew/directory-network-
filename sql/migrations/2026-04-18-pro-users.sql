-- Migration: 2026-04-18-pro-users.sql
-- Purpose: Phase 2 infrastructure for PuffPrice Pro ($0.99/mo)
-- Scope:
--   1. pro_users — canonical table of active Pro subscribers. Populated by
--      the Stripe webhook handler at app/api/stripe/webhook/route.ts on
--      checkout.session.completed and kept in sync on subscription events.
--   2. pro_alerts_sent — ledger of SMS/email alerts actually delivered.
--      Prevents duplicate sends across runs of the alert cron and feeds
--      the Pro savings dashboard.
-- Safety: CREATE TABLE IF NOT EXISTS is idempotent — re-running this
-- migration after partial application will not drop data.
-- NOT RUN YET. Matthew reviews; Code applies via mcp__supabase__apply_migration
-- in Phase 2 cutover.

-- Pro subscribers — populated by Stripe webhook
CREATE TABLE IF NOT EXISTS pro_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text UNIQUE NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text,
  zip text,
  categories text[] DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_users_email_idx ON pro_users(email);
CREATE INDEX IF NOT EXISTS pro_users_status_idx ON pro_users(status);
CREATE INDEX IF NOT EXISTS pro_users_zip_idx ON pro_users(zip);

-- Track what Pro users actually got alerted about (prevents duplicate sends + feeds savings dashboard)
CREATE TABLE IF NOT EXISTS pro_alerts_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_user_id uuid REFERENCES pro_users(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms','email')),
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_alerts_sent_user_idx ON pro_alerts_sent(pro_user_id);
CREATE INDEX IF NOT EXISTS pro_alerts_sent_deal_idx ON pro_alerts_sent(deal_id);
