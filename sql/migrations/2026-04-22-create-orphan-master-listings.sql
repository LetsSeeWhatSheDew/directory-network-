-- 2026-04-22-create-orphan-master-listings.sql
-- =========================================================================
-- NOT YET APPLIED — Matthew applies in Supabase SQL editor.
-- =========================================================================
--
-- Purpose
--   The Apr 22 morning migration (2026-04-22-fix-deal-listing-joins.sql)
--   deactivated 7 deals tagged status_reason='orphaned' because their
--   listing_slug had no matching master_listings.slug row. Six dispensary
--   slugs are involved.
--
--   Web research (cannabis.illinois.gov, dispensary websites, Patch,
--   Yelp, BBB; full source URLs in docs/handoffs/2026-04-22-orphan-research.md)
--   confirmed all 6 are real, currently-operating Illinois adult-use
--   dispensaries. None are scraper artifacts.
--
--   This migration:
--     1. INSERTs 6 master_listings rows (project_tag='green', state='IL').
--     2. INSERTs 7-day listing_hours coverage for each.
--        Weekday convention: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
--        (verified against existing green-001 row).
--     3. Re-activates the 7 orphaned deals: sets is_active=true and
--        status_reason='imported_not_verified' (not yet a verified deal,
--        but no longer orphaned).
--
-- Idempotency
--   Uses ON CONFLICT (slug) DO NOTHING on master_listings.
--   listing_hours uses an explicit DELETE + INSERT pattern keyed on
--   listing_id to avoid duplicate weekday rows on re-runs.
--   Deal UPDATEs are scoped by id (UUIDs are stable).
--
-- =========================================================================
BEGIN;

-- ---------------------------------------------------------------------------
-- 1. master_listings INSERTs
-- ---------------------------------------------------------------------------
INSERT INTO public.master_listings
  (id, project_tag, type, name, slug, website, phone,
   address1, city, state, postal_code, country,
   license_state, is_active)
VALUES
  ('green-007', 'green', 'dispensary',
   'Bisa Lina',
   'bisa-lina-joliet',
   'https://bisalina.com/locations/joliet-illinois-dispensary/',
   '+1-815-418-0200',
   '2121 W Jefferson St', 'Joliet', 'IL', '60435', 'US',
   'IL', true),
  ('green-008', 'green', 'dispensary',
   'Cookies Chicago',
   'cookies-chicago',
   'https://cookieschicago.co/',
   '+1-312-313-7374',
   '215 N Clinton St', 'Chicago', 'IL', '60661', 'US',
   'IL', true),
  ('green-009', 'green', 'dispensary',
   'Curaleaf Morris',
   'curaleaf-morris',
   'https://curaleaf.com/dispensary/illinois/curaleaf-il-morris',
   '+1-815-513-0124',
   '2400 Hiawatha Pioneer Trail', 'Morris', 'IL', '60450', 'US',
   'IL', true),
  ('green-010', 'green', 'dispensary',
   'Nature''s Treatment of Illinois',
   'natures-treatment-milan',
   'https://www.ntillinois.com/',
   '+1-309-283-7642',
   '973 Tech Dr', 'Milan', 'IL', '61264', 'US',
   'IL', true),
  ('green-011', 'green', 'dispensary',
   'Perception Cannabis',
   'perception-cannabis-chicago',
   'https://www.perceptioncannabis.com/',
   '+1-872-302-4920',
   '7000 N Clark St', 'Chicago', 'IL', '60626', 'US',
   'IL', true),
  ('green-012', 'green', 'dispensary',
   'Mood Shine',
   'mood-shine-chicago-heights',
   'https://www.moodshine.com/',
   '+1-708-833-8474',
   '628 W Lincoln Hwy', 'Chicago Heights', 'IL', '60411', 'US',
   'IL', true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. listing_hours — wipe-and-replace pattern (idempotent across re-runs)
--    Weekday: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun.
-- ---------------------------------------------------------------------------
DELETE FROM public.listing_hours
WHERE listing_id IN ('green-007','green-008','green-009','green-010','green-011','green-012');

-- Bisa Lina Joliet — Mon-Sun 6:00–22:00 (per Patch coverage)
INSERT INTO public.listing_hours (project_tag, listing_id, weekday, opens_at, closes_at, is_closed) VALUES
  ('green','green-007',0,'06:00:00','22:00:00',false),
  ('green','green-007',1,'06:00:00','22:00:00',false),
  ('green','green-007',2,'06:00:00','22:00:00',false),
  ('green','green-007',3,'06:00:00','22:00:00',false),
  ('green','green-007',4,'06:00:00','22:00:00',false),
  ('green','green-007',5,'06:00:00','22:00:00',false),
  ('green','green-007',6,'06:00:00','22:00:00',false);

-- Cookies Chicago — Mon-Sat 9:00–21:00, Sun 10:00–20:00 (per Yelp/site)
INSERT INTO public.listing_hours (project_tag, listing_id, weekday, opens_at, closes_at, is_closed) VALUES
  ('green','green-008',0,'09:00:00','21:00:00',false),
  ('green','green-008',1,'09:00:00','21:00:00',false),
  ('green','green-008',2,'09:00:00','21:00:00',false),
  ('green','green-008',3,'09:00:00','21:00:00',false),
  ('green','green-008',4,'09:00:00','21:00:00',false),
  ('green','green-008',5,'09:00:00','21:00:00',false),
  ('green','green-008',6,'10:00:00','20:00:00',false);

-- Curaleaf Morris — Mon-Thu 9-19, Fri 9-20, Sat 9-19, Sun 10-18 (per Curaleaf site)
INSERT INTO public.listing_hours (project_tag, listing_id, weekday, opens_at, closes_at, is_closed) VALUES
  ('green','green-009',0,'09:00:00','19:00:00',false),
  ('green','green-009',1,'09:00:00','19:00:00',false),
  ('green','green-009',2,'09:00:00','19:00:00',false),
  ('green','green-009',3,'09:00:00','19:00:00',false),
  ('green','green-009',4,'09:00:00','20:00:00',false),
  ('green','green-009',5,'09:00:00','19:00:00',false),
  ('green','green-009',6,'10:00:00','18:00:00',false);

-- Nature's Treatment of Illinois Milan — Mon-Sat 6:30–21:45, Sun 8:00–21:00
INSERT INTO public.listing_hours (project_tag, listing_id, weekday, opens_at, closes_at, is_closed) VALUES
  ('green','green-010',0,'06:30:00','21:45:00',false),
  ('green','green-010',1,'06:30:00','21:45:00',false),
  ('green','green-010',2,'06:30:00','21:45:00',false),
  ('green','green-010',3,'06:30:00','21:45:00',false),
  ('green','green-010',4,'06:30:00','21:45:00',false),
  ('green','green-010',5,'06:30:00','21:45:00',false),
  ('green','green-010',6,'08:00:00','21:00:00',false);

-- Perception Cannabis Chicago — Mon-Sun 9-21
INSERT INTO public.listing_hours (project_tag, listing_id, weekday, opens_at, closes_at, is_closed) VALUES
  ('green','green-011',0,'09:00:00','21:00:00',false),
  ('green','green-011',1,'09:00:00','21:00:00',false),
  ('green','green-011',2,'09:00:00','21:00:00',false),
  ('green','green-011',3,'09:00:00','21:00:00',false),
  ('green','green-011',4,'09:00:00','21:00:00',false),
  ('green','green-011',5,'09:00:00','21:00:00',false),
  ('green','green-011',6,'09:00:00','21:00:00',false);

-- Mood Shine Chicago Heights — Mon-Sat 9-21, Sun 10-17
INSERT INTO public.listing_hours (project_tag, listing_id, weekday, opens_at, closes_at, is_closed) VALUES
  ('green','green-012',0,'09:00:00','21:00:00',false),
  ('green','green-012',1,'09:00:00','21:00:00',false),
  ('green','green-012',2,'09:00:00','21:00:00',false),
  ('green','green-012',3,'09:00:00','21:00:00',false),
  ('green','green-012',4,'09:00:00','21:00:00',false),
  ('green','green-012',5,'09:00:00','21:00:00',false),
  ('green','green-012',6,'10:00:00','17:00:00',false);

-- ---------------------------------------------------------------------------
-- 3. Re-activate the 7 orphaned deals.
--    Targeting by id (UUIDs are immutable) — safer than slug equality
--    because someone could re-introduce orphan rows in the future.
-- ---------------------------------------------------------------------------
UPDATE public.deals
SET is_active = true,
    status_reason = 'imported_not_verified',
    updated_at = now()
WHERE id IN (
  '6dd2ca37-2dc0-438f-89b7-0eb351732c9c', -- bisa-lina-joliet — First-time 20% off
  '493ad150-0e3f-4ee8-a5f4-89293b16ff8f', -- cookies-chicago — 30% off orders $250+
  'c82a664b-332e-4d26-b4bf-8ad7ecacf549', -- curaleaf-morris — First-time 20% off
  '692ae6cd-99fe-4b1a-b217-5fa36b02dd3e', -- mood-shine-chicago-heights — First-time 25% off
  '26b34899-84ca-4640-8775-cc1b4e249c1e', -- natures-treatment-milan — First-time 20% off
  '050232a5-3e86-4e3e-8b91-5c39e57fcf16', -- natures-treatment-milan — Veterans 10% off daily
  '0c8a21a0-1b1b-40b9-b80b-d091717aad0e'  -- perception-cannabis-chicago — 30% off Aeriz
);

-- Sanity check — inside the transaction so a bad count rolls everything back.
DO $$
DECLARE
  inserted_listings int;
  hours_rows        int;
  reactivated_deals int;
BEGIN
  SELECT COUNT(*) INTO inserted_listings
    FROM public.master_listings
    WHERE id IN ('green-007','green-008','green-009','green-010','green-011','green-012');
  SELECT COUNT(*) INTO hours_rows
    FROM public.listing_hours
    WHERE listing_id IN ('green-007','green-008','green-009','green-010','green-011','green-012');
  SELECT COUNT(*) INTO reactivated_deals
    FROM public.deals
    WHERE is_active = true
      AND status_reason = 'imported_not_verified'
      AND listing_slug IN (
        'bisa-lina-joliet','cookies-chicago','curaleaf-morris',
        'natures-treatment-milan','perception-cannabis-chicago',
        'mood-shine-chicago-heights'
      );
  IF inserted_listings <> 6 THEN
    RAISE EXCEPTION 'Expected 6 master_listings, found %', inserted_listings;
  END IF;
  IF hours_rows <> 42 THEN
    RAISE EXCEPTION 'Expected 42 listing_hours rows (6 listings x 7 days), found %', hours_rows;
  END IF;
  IF reactivated_deals <> 7 THEN
    RAISE EXCEPTION 'Expected 7 reactivated deals, found %', reactivated_deals;
  END IF;
  RAISE NOTICE 'OK: % listings, % hours rows, % reactivated deals',
    inserted_listings, hours_rows, reactivated_deals;
END $$;

COMMIT;

-- =========================================================================
-- Rollback
-- =========================================================================
-- BEGIN;
--   UPDATE public.deals
--   SET is_active = false,
--       status_reason = 'orphaned',
--       updated_at = now()
--   WHERE id IN (
--     '6dd2ca37-2dc0-438f-89b7-0eb351732c9c',
--     '493ad150-0e3f-4ee8-a5f4-89293b16ff8f',
--     'c82a664b-332e-4d26-b4bf-8ad7ecacf549',
--     '692ae6cd-99fe-4b1a-b217-5fa36b02dd3e',
--     '26b34899-84ca-4640-8775-cc1b4e249c1e',
--     '050232a5-3e86-4e3e-8b91-5c39e57fcf16',
--     '0c8a21a0-1b1b-40b9-b80b-d091717aad0e'
--   );
--   DELETE FROM public.listing_hours
--     WHERE listing_id IN ('green-007','green-008','green-009','green-010','green-011','green-012');
--   DELETE FROM public.master_listings
--     WHERE id IN ('green-007','green-008','green-009','green-010','green-011','green-012');
-- COMMIT;
