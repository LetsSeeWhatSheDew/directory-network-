-- sql/add-phone-to-deal-alerts.sql
-- Infrastructure for SMS alerts. Not Twilio-integrated yet — this just
-- adds the columns so we can capture intent before the Twilio env vars
-- land in Vercel.
--
-- STATUS: deal_alerts.phone already exists (verified via Supabase MCP).
-- This migration adds the two opt-in/verified flags and a partial
-- index. Idempotent — safe to rerun.
--
-- Run in the Supabase SQL Editor when ready.

BEGIN;

ALTER TABLE deal_alerts
  ADD COLUMN IF NOT EXISTS phone             text,
  ADD COLUMN IF NOT EXISTS sms_opted_in      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_verified      boolean DEFAULT false;

-- Partial index — only rows where phone is non-null matter for SMS
-- delivery lookups.
CREATE INDEX IF NOT EXISTS deal_alerts_phone_idx
  ON deal_alerts (phone) WHERE phone IS NOT NULL;

COMMIT;
