-- NOT YET APPLIED
-- Migration: deal hygiene — verified_at hardening + day-of-week filtering
-- Author: Code (P0 deal hygiene PR)
-- Date: 2026-11-05
-- Pairs with:
--   app/components/VerifiedRow.tsx        (relative-time render in America/Chicago)
--   app/components/HomeDealCards.tsx      (stray "0" guard)
--   lib/dealActiveFilter.ts               (client-side day-of-week filter helper)
--   app/admin/deals/new/page.tsx          (manual deal entry with day-of-week picker)
--
-- Context — three production bugs surviving past the 2026-05-04 cleanup PR:
--
--   1. The 2026-05-04 deal-data-integrity migration was authored but
--      flagged "NOT YET APPLIED" in PR #2's description. This migration
--      is idempotent — if PR #2's blocks already ran, the IF NOT EXISTS
--      and DROP-then-ADD patterns make re-application safe.
--
--   2. "Munchie Monday — 25% off" rendered as an active deal on
--      Wednesday evening. Day-of-week recurrence existed in
--      `recurring_days` (text[] like 'monday') but was never used as a
--      visibility gate — only as display metadata gated on
--      `is_recurring=true`. We add `active_days` (3-letter abbreviations
--      to match the new admin picker) as the canonical filter and
--      backfill from BOTH `recurring_days` and a title regex.
--
--   3. Open-ended deals had no end date. Some deals are valid until a
--      specific calendar date (e.g. a holiday promo); we add
--      `active_until` (timestamptz, nullable) as a hard expiry separate
--      from the per-row stale sweep (`mark-stale-deals` cron).
--
-- Day key convention: lowercase 3-letter ISO-style abbreviations:
--   'mon','tue','wed','thu','fri','sat','sun'.
-- This matches the admin picker control values and the JS helper at
-- lib/dealActiveFilter.ts. The day comparison in the view uses
-- `to_char(now() AT TIME ZONE 'America/Chicago', 'Dy')` lowercased, which
-- emits exactly these tokens.
--
-- Rollback (full):
--   ALTER TABLE public.deals
--     DROP COLUMN IF EXISTS active_days,
--     DROP COLUMN IF EXISTS active_until;
--   -- Then re-run sql/migrations/2026-04-22-add-verified-at-to-view.sql
--   -- to restore the prior view.
--
-- Sign-off required: Matthew (review and apply via Supabase SQL editor).

BEGIN;

-- ============================================================
-- SECTION 1 — verified_at + discount sanity (from PR #2's
--             2026-05-04-deal-data-integrity.sql, re-stated
--             idempotently). Safe to run whether or not PR #2's
--             original migration was already applied.
-- ============================================================

ALTER TABLE public.deals
  ALTER COLUMN verified_at SET DEFAULT NOW();

UPDATE public.deals
SET verified_at = COALESCE(verified_at, updated_at, created_at, NOW())
WHERE verified_at IS NULL
  AND is_active = true;

ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_discount_unit_check;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_discount_unit_check
  CHECK (discount_unit IS NULL OR discount_unit IN ('percent', 'dollars'));

ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_discount_value_nonneg;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_discount_value_nonneg
  CHECK (discount_value IS NULL OR discount_value >= 0);

-- ============================================================
-- SECTION 2 — active_days + active_until columns
-- ============================================================

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS active_days  text[],
  ADD COLUMN IF NOT EXISTS active_until timestamptz;

-- Whitelist guard: every element must be one of the seven canonical day
-- tokens. NULL or empty array = always active.
ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_active_days_valid;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_active_days_valid
  CHECK (
    active_days IS NULL
    OR active_days <@ ARRAY['mon','tue','wed','thu','fri','sat','sun']::text[]
  );

-- ============================================================
-- SECTION 3 — backfill from `recurring_days` + title regex
--
-- Strategy:
--   (a) If `recurring_days` is populated, translate full day names
--       ('monday','mon') to canonical 3-letter tokens.
--   (b) Otherwise, infer from the title using a case-insensitive
--       regex sweep. Matches the most common Central IL specials
--       seen in production (Munchie Monday, Wax Wednesday, Sunday
--       Funday, Throwback Thursday, weekend-specific deals, etc.).
--   (c) Anything that doesn't match either source is left NULL —
--       always-active behavior is the safe default.
-- ============================================================

-- (a) Translate recurring_days where it exists. Both 'monday' and 'mon'
--     conventions seen in seed data; we map both.
UPDATE public.deals
SET active_days = (
  SELECT ARRAY(
    SELECT DISTINCT CASE
      WHEN lower(rd) IN ('mon','monday')      THEN 'mon'
      WHEN lower(rd) IN ('tue','tues','tuesday') THEN 'tue'
      WHEN lower(rd) IN ('wed','wednesday')   THEN 'wed'
      WHEN lower(rd) IN ('thu','thur','thurs','thursday') THEN 'thu'
      WHEN lower(rd) IN ('fri','friday')      THEN 'fri'
      WHEN lower(rd) IN ('sat','saturday')    THEN 'sat'
      WHEN lower(rd) IN ('sun','sunday')      THEN 'sun'
      ELSE NULL
    END
    FROM unnest(recurring_days) AS rd
    WHERE rd IS NOT NULL
  )
)
WHERE active_days IS NULL
  AND recurring_days IS NOT NULL
  AND array_length(recurring_days, 1) > 0;

-- Drop empty arrays that resulted from unmappable tokens.
UPDATE public.deals
SET active_days = NULL
WHERE active_days IS NOT NULL
  AND array_length(active_days, 1) IS NULL;

-- (b) Title regex pass — only fires where (a) didn't already set days.
--     Order matters: weekend before single-day matches so "Weekend"
--     wins over a stray "Friday" in long titles.
UPDATE public.deals
SET active_days = ARRAY['fri','sat','sun']
WHERE active_days IS NULL
  AND title ~* '\mweekend\M';

UPDATE public.deals
SET active_days = ARRAY['mon']
WHERE active_days IS NULL
  AND title ~* '\m(munchie\s+monday|monday)\M';

UPDATE public.deals
SET active_days = ARRAY['tue']
WHERE active_days IS NULL
  AND title ~* '\m(twosday|tuesday)\M';

UPDATE public.deals
SET active_days = ARRAY['wed']
WHERE active_days IS NULL
  AND title ~* '\m(wax\s+wednesday|wednesday)\M';

UPDATE public.deals
SET active_days = ARRAY['thu']
WHERE active_days IS NULL
  AND title ~* '\m(throwback\s+thursday|thursday)\M';

UPDATE public.deals
SET active_days = ARRAY['fri']
WHERE active_days IS NULL
  AND title ~* '\mfriday\M';

UPDATE public.deals
SET active_days = ARRAY['sat']
WHERE active_days IS NULL
  AND title ~* '\msaturday\M';

UPDATE public.deals
SET active_days = ARRAY['sun']
WHERE active_days IS NULL
  AND title ~* '\m(sunday\s+funday|sunday)\M';

-- ============================================================
-- SECTION 4 — index for the new visibility filter
--
-- A GIN index on `active_days` makes the per-request filter
-- (`active_days @> ARRAY[<today>]` and contains-checks in the view)
-- index-backed instead of full-scan. Tiny table today (~10 active
-- deals); future-proofing for when manual entry expands the set.
-- ============================================================

CREATE INDEX IF NOT EXISTS deals_active_days_gin
  ON public.deals USING GIN (active_days);

CREATE INDEX IF NOT EXISTS deals_active_until_idx
  ON public.deals (active_until)
  WHERE active_until IS NOT NULL;

-- ============================================================
-- SECTION 5 — rebuild the active_deals_with_listings view
--
-- Adds two filters at the DB level so every consumer of the view
-- (homepage, /city/[city], /deals/[category], /api/deals/recommend,
-- /brand/[slug]) inherits the day-of-week and active_until gates
-- without per-call query-string surgery:
--
--   • active_until IS NULL OR active_until > now()
--   • active_days  IS NULL OR active_days  @> ARRAY[<today_chicago>]
--
-- `<today_chicago>` is computed inline as
--   lower(to_char(now() AT TIME ZONE 'America/Chicago', 'Dy'))
-- which yields one of 'mon'..'sun'. Postgres re-evaluates `now()` per
-- query, so the view honors the calendar boundary in Chicago even
-- across midnight.
--
-- Also exposes the two new columns to the view so the
-- /deal/[id] page (which still reads from `public.deals` directly)
-- and admin tooling can rely on the same shape.
--
-- Everything else preserved from the 2026-04-22 definition: same
-- NULL-on-miss for name/city, same lat/lng projection, same
-- savings_amount computation, same anon+authenticated SELECT grant.
--
-- KNOWN CARRY-OVER: `0::numeric AS google_rating` and `0 AS review_count`
-- are preserved here intentionally — fixing the regression to project
-- m.google_rating is a separate audit (the React side now guards strictly
-- on `> 0` so the stray "0" is gone from the UI either way).
-- ============================================================

DROP VIEW IF EXISTS public.active_deals_with_listings;

CREATE VIEW public.active_deals_with_listings AS
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
    d.active_days,
    d.active_until,
    d.expires_at,
    d.source,
    d.source_url,
    d.listing_slug,
    d.listing_slug                                   AS slug,
    d.verified_at,
    d.status_reason,
    m.name                                           AS name,
    m.city                                           AS city,
    m.phone,
    m.logo_url,
    m.lat                                            AS lat,
    m.lng                                            AS lng,
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
   FROM public.deals d
   LEFT JOIN public.master_listings m ON d.listing_slug = m.slug
  WHERE d.is_active = true
    AND d.project_tag = 'green'::text
    AND (d.expires_at  IS NULL OR d.expires_at  > now())
    AND (d.active_until IS NULL OR d.active_until > now())
    AND (
      d.active_days IS NULL
      OR d.active_days = ARRAY[]::text[]
      OR lower(to_char(now() AT TIME ZONE 'America/Chicago', 'Dy'))
         = ANY(d.active_days)
    );

GRANT SELECT ON public.active_deals_with_listings TO anon, authenticated;

COMMIT;

-- ============================================================
-- Verification queries — run after apply
-- ============================================================

-- (a) Confirm columns landed on `deals`
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='deals'
--     AND column_name IN ('active_days','active_until');
--   -- Expected: 2 rows.

-- (b) Confirm the active_days CHECK constraint
--   SELECT conname FROM pg_constraint
--   WHERE conrelid='public.deals'::regclass
--     AND conname='deals_active_days_valid';
--   -- Expected: 1 row.

-- (c) Backfill audit — counts by day-of-week
--   SELECT unnest(active_days) AS day, COUNT(*)
--   FROM public.deals
--   WHERE is_active = true AND project_tag = 'green'
--   GROUP BY 1 ORDER BY 1;
--   -- Inspect: confirm at least one Monday-only deal exists where the
--   -- title says Monday.

-- (d) View now includes both new columns
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='active_deals_with_listings'
--     AND column_name IN ('active_days','active_until');
--   -- Expected: 2 rows.

-- (e) Live spot-check — what does the view return for today?
--   SELECT deal_id, deal_title, active_days, active_until
--   FROM public.active_deals_with_listings
--   ORDER BY discount_value DESC NULLS LAST
--   LIMIT 20;
--   -- Confirm the result set excludes any deal whose `active_days`
--   -- doesn't include today's Chicago day key.

-- (f) Negative test — if today is Wednesday in Chicago, a Monday-only
--     deal in the underlying table should NOT appear in the view.
--   SELECT d.title, d.active_days, v.deal_id IS NOT NULL AS visible_in_view
--   FROM public.deals d
--   LEFT JOIN public.active_deals_with_listings v ON v.deal_id = d.id
--   WHERE d.is_active = true
--     AND 'mon' = ANY(d.active_days)
--     AND lower(to_char(now() AT TIME ZONE 'America/Chicago','Dy')) <> 'mon';
--   -- Expected on a non-Monday: visible_in_view = false for every row.
