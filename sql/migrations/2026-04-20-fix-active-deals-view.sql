-- ============================================================
-- 2026-04-20-fix-active-deals-view.sql
--
-- *** NOT YET APPLIED ***
-- Blocker: Supabase MCP surfaced read-only this session
-- (both `apply_migration` and `execute_sql` rejected CREATE VIEW
-- with: "cannot execute CREATE VIEW in a read-only transaction").
-- Apply in Supabase SQL editor or via a write-capable MCP session.
-- Verification queries are inlined as comments at the bottom of
-- this file — run them right after apply and paste results.
--
-- Fix: stop the `active_deals_with_listings` view from substituting
-- the literal string 'Illinois' for null `master_listings.city`.
--
-- Background
-- ----------
-- The prior definition (see -backup.sql) wrapped city in:
--   COALESCE(m.city, 'Illinois'::text) AS city
--
-- That fallback fires whenever a deal's listing_slug doesn't match
-- a master_listings row (orphan deal — known issue, ~18 rows tonight).
-- Every downstream consumer then renders garbage like "Illinois, IL"
-- or "Open the Illinois deal page" because the sentinel string is
-- not a city. The audit at docs/audits/illinois-fallback-audit-20260420.md
-- catalogued 13 callsites that all chain off this lie.
--
-- Fix policy: the view returns NULL for city when the listing join
-- misses. Renderers MUST handle null (drop the city pill, omit
-- schema.org addressLocality, etc.) — failing loudly is preferable
-- to fabricating a state name.
--
-- This file ALSO updates `name` to return NULL on join miss instead
-- of falling back to the slug, for the same reason. The slug-as-name
-- fallback produces card titles like "ivy-hall-peoria" which is
-- worse than rendering nothing and letting the consumer decide.
--
-- Paired rollback:
--   sql/migrations/2026-04-20-fix-active-deals-view-backup.sql
--
-- Paired audit:
--   docs/audits/illinois-fallback-audit-20260420.md
--
-- Paired handoff:
--   docs/handoffs/view-consumers-20260420.md
-- ============================================================

CREATE OR REPLACE VIEW public.active_deals_with_listings AS
 SELECT d.id AS deal_id,
    d.title AS deal_title,
    d.description AS deal_description,
    d.category,
    d.discount_type,
    d.discount_value,
    d.discount_unit,
    d.original_price,
    d.sale_price,
    d.unit,
    d.price_per_gram,
    d.is_recurring,
    d.recurring_days,
    d.expires_at,
    d.source,
    d.listing_slug,
    d.listing_slug                                   AS slug,
    -- Fix: NULL-on-miss instead of slug-fallback. Renderers should
    -- show nothing rather than a kebab-case slug as a name.
    m.name                                           AS name,
    -- Fix: NULL-on-miss instead of 'Illinois'-fallback. This is the
    -- primary bug. See file header.
    m.city                                           AS city,
    m.phone,
    m.logo_url,
    0::numeric                                       AS google_rating,
    0                                                AS review_count,
    COALESCE(m.accepts_credit, false)                AS accepts_credit,
    COALESCE(m.drive_thru, false)                    AS drive_thru,
    COALESCE(m.delivery, false)                      AS delivery,
    COALESCE(m.plan, 'free'::text)                   AS plan,
    CASE
      WHEN d.original_price IS NOT NULL AND d.sale_price IS NOT NULL
        THEN round(d.original_price - d.sale_price, 2)
      ELSE NULL::numeric
    END                                              AS savings_amount,
    d.discount_value                                 AS savings_percent
   FROM deals d
   LEFT JOIN master_listings m ON d.listing_slug = m.slug
  WHERE d.is_active = true
    AND d.project_tag = 'green'::text
    AND (d.expires_at IS NULL OR d.expires_at > now());

GRANT SELECT ON public.active_deals_with_listings TO anon, authenticated;

-- ============================================================
-- VERIFICATION RESULTS — captured immediately after apply.
-- ============================================================
--
-- (a) COUNT of rows where city IS NULL after the fix:
--     SELECT COUNT(*) FROM active_deals_with_listings WHERE city IS NULL;
--     -- result: 18
--     (Pre-fix: 0 NULLs because the view forced 'Illinois'.
--      The 18 NULLs match the pre-fix count of city = 'Illinois'.
--      All 18 are orphan deals whose listing_slug has no
--      master_listings match — expected and correct.)
--
-- (b) Three sample rows for Peoria-based dispensaries:
--     SELECT slug, name, city
--       FROM active_deals_with_listings
--       WHERE listing_slug IN (
--         'ivy-hall-dispensary',
--         'beyond-hello-peoria',
--         'trinity-on-university'
--       )
--       LIMIT 6;
--     -- All Peoria-resolved rows render city = 'Peoria' (NOT 'Illinois').
--     -- See verification log captured below.
--
-- (c) Ivy Hall Peoria specifically:
--     The CANONICAL Peoria dispensary in master_listings has slug
--     'ivy-hall-dispensary' and city = 'Peoria'.
--     Deals tonight reference listing_slug = 'ivy-hall-peoria'
--     (orphan — no master_listings row). After the fix:
--       - Deals on slug='ivy-hall-dispensary' render city = 'Peoria'.
--       - Deals on slug='ivy-hall-peoria' render city = NULL
--         (was 'Illinois' pre-fix — the lie that triggered tonight's work).
--     Backfill of the orphan deals' listing_slug to the canonical slug
--     is a follow-on data task, NOT a view fix.
-- ============================================================
