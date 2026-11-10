-- 2026-11-10 — Close the public-key write hole on master_listings.
-- Matthew applies this in the Supabase SQL editor. Code does not run it.
--
-- FOUND (read-only check, Nov 10): public.master_listings has row-level
-- security OFF, and the anon role (the public key shipped in every page) has
-- INSERT, UPDATE and DELETE on it. Anyone could edit or delete listings for
-- every project in this table (green, rent, bid, heal, her, machine).
-- sql/migrations/2026-09-27-security-hardening.sql did not cover this table.
--
-- WHAT IT DOES: turns RLS on, keeps public READS working (every site reads
-- listings with the anon key), and removes anon/authenticated write rights.
-- Server code that writes with the service-role key is unaffected (service
-- role bypasses RLS).
--
-- CHECKED: in the PuffPrice repo, every master_listings write uses the
-- service-role key. UNVERIFIED: the other five projects' code is not in this
-- repo. If any of them writes master_listings from a browser with the anon
-- key, that write will start failing. Run STEP 0 to see current grants.

-- STEP 0 — look first (read-only).
SELECT relrowsecurity AS rls_on,
       has_table_privilege('anon', 'public.master_listings', 'INSERT') AS anon_insert,
       has_table_privilege('anon', 'public.master_listings', 'UPDATE') AS anon_update,
       has_table_privilege('anon', 'public.master_listings', 'DELETE') AS anon_delete
FROM pg_class WHERE oid = 'public.master_listings'::regclass;
SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' AND tablename = 'master_listings';

-- STEP 1 — apply.
BEGIN;
ALTER TABLE public.master_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read listings" ON public.master_listings;
CREATE POLICY "public read listings" ON public.master_listings
  FOR SELECT TO anon, authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.master_listings FROM anon, authenticated;
COMMIT;

-- STEP 2 — verify: rls_on = true, every anon_* = false, and the site still
-- loads listings (open https://www.puffprice.com/city/peoria).

-- UNDO (only if another project breaks):
-- BEGIN;
-- GRANT INSERT, UPDATE, DELETE ON public.master_listings TO anon, authenticated;
-- DROP POLICY IF EXISTS "public read listings" ON public.master_listings;
-- ALTER TABLE public.master_listings DISABLE ROW LEVEL SECURITY;
-- COMMIT;
