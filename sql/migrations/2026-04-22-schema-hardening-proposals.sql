-- =========================================================================
-- 2026-04-22-schema-hardening-proposals.sql
-- =========================================================================
-- NOT YET APPLIED — review before applying.
-- Pairs with: docs/audits/schema-hardening-20260422.md
--
-- Grouped by risk tier. Apply LOW_RISK section freely. MEDIUM_RISK requires
-- the orphan-listings migration to be applied first AND a quick Code-side
-- grep for license_number references. HIGH_RISK is intentionally empty
-- this round — no destructive changes proposed.
--
-- Each block is wrapped in BEGIN/COMMIT and is independent — apply in any
-- order within a tier. Across tiers, follow the order in the audit doc.
-- =========================================================================


-- =========================================================================
-- LOW_RISK section
-- Additive changes. Safe to apply individually, no behavior change for
-- existing app code.
-- =========================================================================

-- -------------------------------------------------------------------------
-- A1. Enable RLS on the 5 public-exposed tables.
--     Each table gets a baseline "public read of intentionally public
--     fields" policy. Service-role writes already bypass RLS so existing
--     ingest/admin code is unaffected.
-- -------------------------------------------------------------------------
BEGIN;

-- master_listings — anon can read everything EXCEPT license_number.
-- This requires a column grant (Postgres column-level privileges).
ALTER TABLE public.master_listings ENABLE ROW LEVEL SECURITY;

-- Anonymous select policy: all rows are public, but column-level grant
-- below removes license_number from anon's reach.
CREATE POLICY master_listings_anon_select
  ON public.master_listings
  FOR SELECT
  TO anon
  USING (true);

-- Service role retains full access (bypasses RLS) so ingest scripts and
-- the Vercel server-side reads continue working.
CREATE POLICY master_listings_service_all
  ON public.master_listings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Revoke license_number from anon (column-level lockdown). Verify no
-- app code reads license_number via anon key first — search lib/, app/
-- for the column name. Today (2026-04-22) Cowork could not find an
-- application reference to license_number outside of admin paths.
REVOKE SELECT (license_number) ON public.master_listings FROM anon;

-- listing_hours — fully public-readable; no PII.
ALTER TABLE public.listing_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY listing_hours_anon_select ON public.listing_hours
  FOR SELECT TO anon USING (true);
CREATE POLICY listing_hours_service_all ON public.listing_hours
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- listing_attributes — empty today; future amenity tags. Public read.
ALTER TABLE public.listing_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY listing_attributes_anon_select ON public.listing_attributes
  FOR SELECT TO anon USING (true);
CREATE POLICY listing_attributes_service_all ON public.listing_attributes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- products_or_services — empty today; future menu data. Public read.
ALTER TABLE public.products_or_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_or_services_anon_select ON public.products_or_services
  FOR SELECT TO anon USING (true);
CREATE POLICY products_or_services_service_all ON public.products_or_services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- events — telemetry. Service role only. Anon should NOT read.
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_service_all ON public.events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Anon insert is allowed for client-side event firing:
CREATE POLICY events_anon_insert ON public.events
  FOR INSERT TO anon WITH CHECK (true);

COMMIT;


-- -------------------------------------------------------------------------
-- A4. Pin search_path on functions to prevent injection attacks.
-- -------------------------------------------------------------------------
BEGIN;
ALTER FUNCTION public.update_deals_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.deal_submissions_compute_ppg() SET search_path = public, pg_temp;
ALTER FUNCTION public.anchor_skus_normalize_brand() SET search_path = public, pg_temp;
COMMIT;


-- -------------------------------------------------------------------------
-- B3. Index the deal_submissions.promoted_deal_id FK column.
-- -------------------------------------------------------------------------
BEGIN;
CREATE INDEX IF NOT EXISTS deal_submissions_promoted_deal_id_idx
  ON public.deal_submissions (promoted_deal_id)
  WHERE promoted_deal_id IS NOT NULL;
COMMIT;


-- =========================================================================
-- MEDIUM_RISK section
-- Behavioral change. Apply ONLY after:
--   1. Orphan-listings migration has been applied + verified
--      (sql/migrations/2026-04-22-create-orphan-master-listings.sql)
--   2. A Code-side grep for license_number has confirmed nothing breaks
--      when anon loses read access to it.
-- =========================================================================


-- -------------------------------------------------------------------------
-- B1. Add FK from deals.listing_slug to master_listings.slug.
--     The orphan preventer. Pre-condition: ZERO unmatched listing_slug
--     values in deals (verified 2026-04-22 — orphan migration creates
--     all 6 missing master_listings rows).
-- -------------------------------------------------------------------------
BEGIN;

-- Pre-flight: this should return 0. If it returns >0, the orphan
-- migration hasn't been applied yet. Abort.
DO $$
DECLARE
  unmatched_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmatched_count
  FROM public.deals d
  LEFT JOIN public.master_listings ml ON ml.slug = d.listing_slug
  WHERE ml.slug IS NULL;

  IF unmatched_count > 0 THEN
    RAISE EXCEPTION
      'Cannot add FK: % deals have listing_slug with no master_listings.slug match. Apply orphan-listings migration first.',
      unmatched_count;
  END IF;
END $$;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_listing_slug_fkey
    FOREIGN KEY (listing_slug)
    REFERENCES public.master_listings(slug)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

COMMIT;


-- -------------------------------------------------------------------------
-- B2. Add FK from deal_price_history.listing_slug to master_listings.slug.
--     Currently empty table — no pre-conditions to check.
-- -------------------------------------------------------------------------
BEGIN;
ALTER TABLE public.deal_price_history
  ADD CONSTRAINT deal_price_history_listing_slug_fkey
    FOREIGN KEY (listing_slug)
    REFERENCES public.master_listings(slug)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
COMMIT;


-- -------------------------------------------------------------------------
-- A2. Convert SECURITY DEFINER views to SECURITY INVOKER.
--     Pre-condition: A1 RLS policies are in place AND verified that
--     anon can still SELECT from active_deals_with_listings via the
--     /api/deals/recommend endpoint in preview env.
-- -------------------------------------------------------------------------
-- Postgres requires recreating the view to change SECURITY mode.
-- These two ALTER VIEW statements assume PG 15+; for older versions
-- you'd need DROP + CREATE OR REPLACE.
--
-- Uncomment and apply ONLY after preview env confirms RLS allows the
-- anon role to read the underlying tables through the view.
--
-- BEGIN;
-- ALTER VIEW public.active_deals_with_listings SET (security_invoker = on);
-- ALTER VIEW public.deal_submissions_pending  SET (security_invoker = on);
-- COMMIT;


-- -------------------------------------------------------------------------
-- C1. Composite index for the hot active-deals query path.
--     Defer until row count > 5000. No current pain.
-- -------------------------------------------------------------------------
-- BEGIN;
-- CREATE INDEX deals_active_green_idx
--   ON public.deals (project_tag, is_active, expires_at)
--   WHERE is_active IS TRUE AND project_tag = 'green';
-- COMMIT;


-- =========================================================================
-- HIGH_RISK section
-- Destructive operations. Intentionally EMPTY this round.
--
-- The audit identified candidates for column drops (deals.raw_text,
-- deals.unit, master_listings.cash_only, master_listings.atm_onsite,
-- master_listings.online_ordering) but recommends NOT dropping them
-- until a Code-side grep confirms zero references AND Matthew explicitly
-- signs off. The carrying cost at 105 rows is essentially zero.
--
-- No SQL proposed in this section. Re-audit in 30 days.
-- =========================================================================
