-- =========================================================================
-- 2026-09-27-security-hardening.sql
-- =========================================================================
--
--   ███  NOT APPLIED — OWNER APPLIES  ███
--
--   Written by Code (security + robustness review, Sept 27 2026). Nothing
--   in this file has been run against Supabase. Matthew reviews and runs it
--   in the Supabase SQL Editor (project hnbjufmtmrhexmdrfubw).
--
-- WHY
--   The public anon key ships in every page (that's expected — it's the
--   "public" key). Whatever the anon role can do through PostgREST, anyone
--   can do. Supabase's default grants give anon (and `authenticated`) full
--   SELECT/INSERT/UPDATE/DELETE on every new table in `public`, so a table
--   that was created without RLS, or with a loose policy, is open to the
--   world. Reading sql/ shows several of those (some depend on which earlier
--   "NOT YET APPLIED" files were eventually run, which this file can't see):
--
--   1. "Authenticated full access" policies on deals, deal_alerts,
--      directory_leads, deal_submissions and anchor_skus. PuffPrice never
--      uses Supabase Auth, but Auth sign-up is ON by default, so anyone can
--      POST /auth/v1/signup with the anon key, become `authenticated`, and
--      then read every subscriber email (deal_alerts), every lead (name,
--      email, phone), every deal submission, and rewrite or delete deals.
--   2. Tables created with no RLS at all: pro_users (emails, phones, ZIPs),
--      pro_alerts_sent, stripe_events_processed (inserting fake event ids
--      would make the Stripe webhook skip real events), scraper_runs.
--      Probably also `leads` and `events` (no CREATE for them in sql/).
--   3. deal_alerts and deal_clicks allow anon INSERT with CHECK (true).
--      The app now writes both only with the service key, so the anon
--      INSERT only lets a stranger add rows (e.g. an
--      already-active weekly subscriber row for someone else's email)
--      straight through PostgREST, skipping double opt-in.
--   4. deal_submissions_pending is a plain (owner-rights) view over
--      deal_submissions that includes submitter_email. Supabase's default
--      grants make it readable by anon, which bypasses the table's RLS.
--   5. Public-read tables (deals, listing_hours, …) may still carry the
--      default anon INSERT/UPDATE/DELETE grants; if RLS is off on any of
--      them, anon can rewrite them.
--
-- WHAT THIS DOES — and why it can't break a page
--   Every SELECT the site makes with the anon key keeps working: this file
--   never revokes SELECT on a table or view the site reads with anon, never
--   touches an existing SELECT policy, and never removes the anon INSERT
--   paths the site uses (deal_reports ← /api/feedback, listing_reviews ←
--   /api/reviews, listing_claims ← /api/claim, deal_submissions ←
--   /api/deals/submit, directory_leads ← lib/submitLead.ts, dispensary_tips).
--   Service-role writes bypass RLS and are unaffected.
--
--   A. Drop the "authenticated full access" policies (hole 1).
--   B. Private tables: RLS on, anon/authenticated privileges revoked (hole 2).
--   C. deal_alerts / deal_clicks: drop the anon INSERT policies (hole 3).
--   D. Insert-only intake tables: keep INSERT, drop anon UPDATE/DELETE
--      (and SELECT where nothing reads with anon).
--   E. Public-read tables: drop anon/authenticated write privileges (hole 5).
--      master_listings / listing_hours / listing_attributes /
--      products_or_services are shared with the other directory projects
--      (rent, bid, heal, her, machine), so they only lose UPDATE, DELETE and
--      TRUNCATE; INSERT and SELECT are left exactly as they are in case
--      another project's public form inserts with the anon key.
--   F. deal_submissions_pending view: anon/authenticated revoked, and the
--      view switched to security_invoker (hole 4).
--   G. refresh_deal_rankings(): not callable by anon (it's an expensive
--      REFRESH MATERIALIZED VIEW; only the cron calls it, with the service key).
--
--   Idempotent: every statement is guarded by "does this table/view/policy
--   exist" and uses IF EXISTS, so it's safe to run twice or on a database
--   where some earlier migrations were never applied.
--
-- BEFORE YOU RUN IT (2 minutes)
--   1. Run the PRE-CHECK query below and keep the output (it's the "before").
--   2. Confirm no other project (rent / bid / heal / her / machine) UPDATEs
--      or DELETEs master_listings / listing_hours with the anon key from a
--      browser. (Inserting is left alone.) If one does, delete those two
--      names from the array in section E-shared before running.
--   3. Separately, in Supabase → Authentication → Providers: turn OFF
--      "Allow new users to sign up" unless another project uses Supabase
--      Auth. PuffPrice doesn't.
--
-- PRE-CHECK (read-only):
--   SELECT c.relname, c.relkind, c.relrowsecurity AS rls_on,
--          has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
--          has_table_privilege('anon', c.oid, 'INSERT') AS anon_insert,
--          has_table_privilege('anon', c.oid, 'UPDATE') AS anon_update,
--          has_table_privilege('anon', c.oid, 'DELETE') AS anon_delete
--     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--    WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m')
--    ORDER BY 1;
--   SELECT tablename, policyname, roles, cmd, qual, with_check
--     FROM pg_policies WHERE schemaname = 'public' ORDER BY 1, 2;
--
-- AFTER: re-run the PRE-CHECK and the VERIFY block at the bottom, then load
--   puffprice.com, a /dispensary page, /deals/all, /cheapest, /map and
--   /illinois-cannabis-delivery; tap a deal's "Was this right?"; open /mcp
--   in an MCP client. All of those read or write with the anon key.
--
-- ROLLBACK: see the end of this file.
-- =========================================================================

BEGIN;

-- Helpers (session-local, gone when the connection closes).
CREATE OR REPLACE FUNCTION pg_temp.is_table(t text) RETURNS boolean
LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = t AND c.relkind IN ('r', 'p')
  );
$$;
CREATE OR REPLACE FUNCTION pg_temp.is_view(t text) RETURNS boolean
LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'v'
  );
$$;

-- -------------------------------------------------------------------------
-- A. "Authenticated full access" policies → gone.
--    The service role (every server-side write and admin read) bypasses RLS,
--    so nothing in the app relies on these.
-- -------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('deals',            'Authenticated full access to deals'),
    ('deal_alerts',      'Authenticated full access to alerts'),
    ('directory_leads',  'authenticated full access'),
    ('deal_submissions', 'Authenticated full access for moderation'),
    ('anchor_skus',      'Authenticated full access to anchor SKUs')
  ) AS v(tbl, pol)
  LOOP
    IF pg_temp.is_table(r.tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol, r.tbl);
    END IF;
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- B. Private tables: RLS on, no anon/authenticated access at all.
--    Every reader/writer is server-side with the service key:
--      pro_users, pro_alerts_sent, stripe_events_processed → Stripe webhook
--      scraper_runs → cron + /admin/scrapers
--      leads        → /api/leads, /admin
--      events       → /api/track (writes), /admin/traffic (reads)
--      delivery_waitlist → /api/waitlist (public counts come from the
--                          delivery_waitlist_by_zip view, which is untouched)
-- -------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pro_users', 'pro_alerts_sent', 'stripe_events_processed', 'scraper_runs', 'leads', 'events', 'delivery_waitlist']
  LOOP
    IF pg_temp.is_table(t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
  -- From the 2026-04-22 hardening proposals, if it was applied: /api/track
  -- writes with the service key, so anon never needs to insert events.
  IF pg_temp.is_table('events') THEN
    EXECUTE 'DROP POLICY IF EXISTS events_anon_insert ON public.events';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- C. deal_alerts / deal_clicks: no more anon INSERT.
--    deal_alerts: signups, watches, confirms and unsubscribes all write with
--      the service key (lib/alertSubscribers.ts, lib/dealWatch.ts). SELECT
--      stays granted (RLS still returns anon zero rows) so the subscriber
--      count on /alerts keeps answering instead of erroring.
--    deal_clicks: written only by /api/track with the service key.
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF pg_temp.is_table('deal_alerts') THEN
    ALTER TABLE public.deal_alerts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can subscribe to alerts" ON public.deal_alerts;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_alerts FROM anon, authenticated;
  END IF;
  IF pg_temp.is_table('deal_clicks') THEN
    ALTER TABLE public.deal_clicks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can log clicks" ON public.deal_clicks;
    REVOKE ALL ON public.deal_clicks FROM anon, authenticated;
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- D. Insert-only intake tables. INSERT (and its policy) stays; nobody
--    outside the service role may change or delete what was submitted.
--    SELECT is also revoked where the site never reads with anon.
-- -------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  -- Anon inserts, never reads.
  FOREACH t IN ARRAY ARRAY['deal_reports', 'listing_claims', 'directory_leads']
  LOOP
    IF pg_temp.is_table(t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE SELECT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
  -- Anon inserts and has a read path: listing_reviews (approved only, by
  -- policy), dispensary_tips (approved only, by policy), deal_submissions
  -- (/api/deals/submit probes it with a HEAD select; RLS returns no rows).
  FOREACH t IN ARRAY ARRAY['listing_reviews', 'dispensary_tips', 'deal_submissions']
  LOOP
    IF pg_temp.is_table(t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- E. Public-read tables: anon/authenticated keep SELECT, lose writes.
-- -------------------------------------------------------------------------
-- E-green: PuffPrice-only data. Nothing writes these with the anon key
-- (scrapers, cron and admin all use the service key).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['deals', 'deal_price_history', 'deal_observations', 'anchor_skus', 'listing_features', 'dispensaries', 'menu_items']
  LOOP
    IF pg_temp.is_table(t) THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

-- E-shared: multi-tenant tables (project_tag green / rent / bid / heal /
-- her / machine). SELECT and INSERT untouched; UPDATE/DELETE/TRUNCATE by
-- the public key removed. See "BEFORE YOU RUN IT" step 2.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['master_listings', 'listing_hours', 'listing_attributes', 'products_or_services']
  LOOP
    IF pg_temp.is_table(t) THEN
      EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- F. deal_submissions_pending (includes submitter_email). Only
--    /admin/submissions reads it, with the service key.
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF pg_temp.is_view('deal_submissions_pending') THEN
    REVOKE ALL ON public.deal_submissions_pending FROM anon, authenticated;
    ALTER VIEW public.deal_submissions_pending SET (security_invoker = on);
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- G. refresh_deal_rankings(): cron-only (service key).
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.refresh_deal_rankings()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.refresh_deal_rankings() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

COMMIT;

-- =========================================================================
-- VERIFY (read-only). Expected results in comments.
-- =========================================================================
-- (1) No "authenticated full access" policies left → 0 rows
--   SELECT tablename, policyname FROM pg_policies
--    WHERE schemaname = 'public' AND policyname ILIKE 'authenticated full access%';
--
-- (2) Private tables: RLS on and anon can't read → rls_on = true, anon_select = false
--   SELECT c.relname, c.relrowsecurity AS rls_on, has_table_privilege('anon', c.oid, 'SELECT') AS anon_select
--     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--    WHERE n.nspname = 'public'
--      AND c.relname IN ('pro_users','pro_alerts_sent','stripe_events_processed','scraper_runs','leads','events','delivery_waitlist','deal_clicks');
--
-- (3) The site's anon reads still work (run as anon in the SQL editor's
--     role picker, or just load the pages listed above) → rows come back
--   SELECT count(*) FROM active_deals_with_listings;
--   SELECT count(*) FROM master_listings WHERE project_tag = 'green' AND is_active;
--   SELECT count(*) FROM listing_hours WHERE project_tag = 'green';
--
-- (4) The anon intake inserts still work → both return true
--   SELECT has_table_privilege('anon', 'public.deal_reports', 'INSERT'),
--          has_table_privilege('anon', 'public.listing_reviews', 'INSERT');
--
-- (5) deal_submissions_pending hidden from anon → false
--   SELECT has_table_privilege('anon', 'public.deal_submissions_pending', 'SELECT');
--
-- =========================================================================
-- ROLLBACK (only if something that reads with the anon key breaks).
-- Re-grant just the piece that broke, e.g.:
--   GRANT SELECT ON public.<table> TO anon;
--   GRANT INSERT ON public.<table> TO anon;
--   ALTER VIEW public.deal_submissions_pending SET (security_invoker = off);
-- The dropped policies are defined in sql/deals-schema.sql,
-- sql/directory_leads.sql, sql/migrations/2026-04-21-deal-submissions.sql
-- and sql/migrations/2026-04-21-anchor-skus.sql if one ever needs restoring
-- (it shouldn't: nothing in the app uses Supabase Auth).
-- =========================================================================
