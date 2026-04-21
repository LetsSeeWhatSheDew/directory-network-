-- ============================================================
-- 2026-04-21-deal-submissions.sql
--
-- *** NOT YET APPLIED ***
-- Apply via Supabase SQL editor after Matthew reviews. Then bump
-- this header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Path C from `docs/handoffs/ppg-backfill-coverage-v2-20260421.md`:
-- a structured dispensary deal submission table that lets dispensaries
-- self-report deals via a public form with enough fields to compute
-- price-per-gram on submission. Ships immediately as the unblock for
-- the PuffPrice Index PPG gap.
--
-- This is the WRITE side. The form (Code's lane) lives at
-- /deals/submit and PATCH-INSERTs into this table. Moderation queue
-- is a Supabase admin SELECT against approved_at IS NULL.
--
-- Coverage expectation
-- --------------------
-- Year-1 realistic: 10-20% of submitting dispensaries fill the optional
-- price fields. Of those, 100% have a computable PPG at insert.
--
-- Paired docs
-- -----------
--   docs/handoffs/deal-submission-ui-spec-20260421.md
--   docs/handoffs/ppg-backfill-coverage-v2-20260421.md
--
-- Rollback
-- --------
-- DROP TRIGGER IF EXISTS deal_submissions_compute_ppg_trigger ON deal_submissions;
-- DROP FUNCTION IF EXISTS deal_submissions_compute_ppg();
-- DROP TABLE IF EXISTS deal_submissions CASCADE;
-- ============================================================

-- ---------- (1) Table ----------

CREATE TABLE IF NOT EXISTS deal_submissions (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who submitted
  dispensary_slug          text REFERENCES master_listings(slug) ON DELETE SET NULL,
  -- nullable in case the submitter is a dispensary not yet in the
  -- directory; in that case we capture text-only fields below and add
  -- the dispensary at moderation time.
  dispensary_name_freetext text,
  dispensary_city_freetext text,
  submitter_email          text NOT NULL,
  submitter_role           text,                    -- 'owner' | 'manager' | 'budtender' | 'marketing' | 'other'

  -- Deal content
  deal_title               text NOT NULL,           -- "30% off Cresco eighths Wax Wednesday"
  deal_description         text,
  category                 text,                    -- flower | edibles | vapes | concentrate | topicals | accessories | all
  strain_or_product        text,                    -- "Blue Dream" or "Live Resin Cart"
  brand                    text,                    -- "Cresco" / "Rythm" / etc.

  -- Pricing — at minimum one of (weight_grams, mg_thc, count) MUST
  -- be non-null so PPG/PPmg/per-unit compute has a denominator.
  weight_grams             numeric,                 -- for flower / pre-roll / concentrate
  mg_thc                   numeric,                 -- for edibles / tinctures
  count                    integer,                 -- for pre-roll packs / gummy counts

  regular_price_usd        numeric,
  sale_price_usd           numeric,

  -- Computed at INSERT/UPDATE via trigger
  price_per_gram_computed  numeric,
  price_per_mg_computed    numeric,
  price_per_unit_computed  numeric,

  -- Timing
  start_date               date,
  end_date                 date,
  is_recurring             boolean DEFAULT false,
  recurring_days           text[],                  -- ['monday', 'wednesday']

  -- Provenance
  source_url               text,                    -- menu URL / dispensary IG post / etc.
  notes                    text,                    -- freeform additions from submitter

  -- Moderation
  verified                 boolean DEFAULT false,
  verified_method          text,                    -- 'auto-source-match' | 'manual-call' | 'manual-menu' | 'unverified'
  approved                 boolean DEFAULT false,
  approved_at              timestamptz,
  approved_by              text,                    -- moderator email or system tag
  rejected_at              timestamptz,
  rejected_reason          text,
  promoted_deal_id         uuid REFERENCES deals(id) ON DELETE SET NULL,
  -- once approved, the moderator promotes the submission into the deals
  -- table; this column captures the resulting deals.id for traceability

  -- Audit
  submitted_at             timestamptz DEFAULT now(),
  submitter_ip             text,                    -- captured at submission for spam triage
  submitter_user_agent     text,

  -- Constraint: at least one denominator
  CONSTRAINT at_least_one_denominator CHECK (
    weight_grams IS NOT NULL
    OR mg_thc IS NOT NULL
    OR count IS NOT NULL
  )
);

COMMENT ON TABLE deal_submissions IS
  'Public dispensary deal submission inbox. Form posts here. Moderator promotes approved rows into deals table via promoted_deal_id link.';

COMMENT ON COLUMN deal_submissions.dispensary_slug IS
  'Foreign key to master_listings.slug. Nullable for dispensaries not yet in directory.';

COMMENT ON COLUMN deal_submissions.weight_grams IS
  'Required for flower / pre-roll / concentrate. Constraint: at least one of (weight_grams, mg_thc, count) must be non-null.';

COMMENT ON COLUMN deal_submissions.price_per_gram_computed IS
  'Auto-computed at INSERT/UPDATE if weight_grams and sale_price_usd are both present. Read-only — do not write directly.';

COMMENT ON COLUMN deal_submissions.verified_method IS
  'How the submission was verified: auto = matches a public URL the moderator confirmed; manual-call = phoned the dispensary; manual-menu = visited the menu; unverified = approved on submitter trust alone.';

COMMENT ON COLUMN deal_submissions.promoted_deal_id IS
  'Once approved, moderator inserts row into deals table and links back via this column. Lets us audit which submissions made it to production.';

CREATE INDEX IF NOT EXISTS deal_submissions_dispensary_slug_idx
  ON deal_submissions (dispensary_slug);

CREATE INDEX IF NOT EXISTS deal_submissions_approved_idx
  ON deal_submissions (approved, submitted_at DESC);

CREATE INDEX IF NOT EXISTS deal_submissions_pending_moderation_idx
  ON deal_submissions (submitted_at DESC)
  WHERE approved = false AND rejected_at IS NULL;

-- ---------- (2) Trigger: auto-compute price_per_* fields on write ----------

CREATE OR REPLACE FUNCTION deal_submissions_compute_ppg() RETURNS trigger AS $$
BEGIN
  -- Reset all computed fields each write so we never leak stale values.
  NEW.price_per_gram_computed := NULL;
  NEW.price_per_mg_computed   := NULL;
  NEW.price_per_unit_computed := NULL;

  -- Per-gram (flower / pre-roll / concentrate)
  IF NEW.weight_grams IS NOT NULL
     AND NEW.weight_grams > 0
     AND NEW.sale_price_usd IS NOT NULL
     AND NEW.sale_price_usd > 0 THEN
    NEW.price_per_gram_computed := ROUND((NEW.sale_price_usd / NEW.weight_grams)::numeric, 2);
  END IF;

  -- Per-mg-THC (edibles / tinctures)
  IF NEW.mg_thc IS NOT NULL
     AND NEW.mg_thc > 0
     AND NEW.sale_price_usd IS NOT NULL
     AND NEW.sale_price_usd > 0 THEN
    NEW.price_per_mg_computed := ROUND((NEW.sale_price_usd / NEW.mg_thc)::numeric, 4);
  END IF;

  -- Per-unit (count-based: gummy packs, pre-roll multipacks)
  IF NEW.count IS NOT NULL
     AND NEW.count > 0
     AND NEW.sale_price_usd IS NOT NULL
     AND NEW.sale_price_usd > 0 THEN
    NEW.price_per_unit_computed := ROUND((NEW.sale_price_usd / NEW.count)::numeric, 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deal_submissions_compute_ppg_trigger ON deal_submissions;
CREATE TRIGGER deal_submissions_compute_ppg_trigger
  BEFORE INSERT OR UPDATE ON deal_submissions
  FOR EACH ROW
  EXECUTE FUNCTION deal_submissions_compute_ppg();

-- ---------- (3) Row Level Security ----------

ALTER TABLE deal_submissions ENABLE ROW LEVEL SECURITY;

-- Anonymous users (the public form) can INSERT only.
-- Cannot SELECT submissions (privacy: protect submitter_email).
-- Cannot UPDATE / DELETE (moderation is service-role only).
CREATE POLICY "Anonymous can submit deals"
  ON deal_submissions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users (admin tools) — full access for moderation queue.
CREATE POLICY "Authenticated full access for moderation"
  ON deal_submissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role bypasses RLS (default Supabase behavior). The moderator
-- script connects with service-role to read pending submissions and
-- write back the approved/rejected state.

-- ---------- (4) View: pending moderation queue ----------
-- Convenience view for the admin tool to read.

CREATE OR REPLACE VIEW deal_submissions_pending AS
SELECT
  ds.id,
  ds.dispensary_slug,
  COALESCE(ml.name, ds.dispensary_name_freetext) AS dispensary_name,
  COALESCE(ml.city, ds.dispensary_city_freetext) AS dispensary_city,
  ds.submitter_email,
  ds.submitter_role,
  ds.deal_title,
  ds.deal_description,
  ds.category,
  ds.strain_or_product,
  ds.brand,
  ds.weight_grams,
  ds.mg_thc,
  ds.count,
  ds.regular_price_usd,
  ds.sale_price_usd,
  ds.price_per_gram_computed,
  ds.price_per_mg_computed,
  ds.price_per_unit_computed,
  ds.start_date,
  ds.end_date,
  ds.is_recurring,
  ds.recurring_days,
  ds.source_url,
  ds.notes,
  ds.submitted_at,
  ds.submitter_ip
FROM deal_submissions ds
LEFT JOIN master_listings ml ON ds.dispensary_slug = ml.slug
WHERE ds.approved = false
  AND ds.rejected_at IS NULL
ORDER BY ds.submitted_at DESC;

COMMENT ON VIEW deal_submissions_pending IS
  'Moderation queue. Service-role only read. Joined to master_listings to surface dispensary name + city when slug is set.';

-- ---------- (5) Post-apply verification ----------
-- Paste results inline as comments after applying.
--
-- (a) Confirm table + columns:
--     SELECT column_name, data_type FROM information_schema.columns
--       WHERE table_name='deal_submissions' ORDER BY ordinal_position;
--     expect ~30 columns.
--
-- (b) Confirm constraint:
--     INSERT INTO deal_submissions (submitter_email, deal_title)
--       VALUES ('test@example.com', 'no denominator test');
--     expect: ERROR: new row violates check constraint "at_least_one_denominator"
--
-- (c) Confirm trigger computes PPG:
--     INSERT INTO deal_submissions
--       (submitter_email, deal_title, weight_grams, sale_price_usd)
--       VALUES ('test@example.com', '[TEST] eighth at $30',
--               3.5, 30.00) RETURNING price_per_gram_computed;
--     expect: 8.57
--     Then DELETE FROM deal_submissions WHERE deal_title LIKE '[TEST]%';
--
-- (d) Confirm RLS policies:
--     SELECT polname FROM pg_policy WHERE polrelid='deal_submissions'::regclass;
--     expect: 2 rows (Anonymous can submit deals + Authenticated full access).
--
-- (e) Confirm pending view:
--     SELECT COUNT(*) FROM deal_submissions_pending;
--     expect: 0 (post-apply, before any submissions).
--
-- ---------- Rollback ----------
-- DROP VIEW IF EXISTS deal_submissions_pending;
-- DROP TRIGGER IF EXISTS deal_submissions_compute_ppg_trigger ON deal_submissions;
-- DROP FUNCTION IF EXISTS deal_submissions_compute_ppg();
-- DROP TABLE IF EXISTS deal_submissions CASCADE;
