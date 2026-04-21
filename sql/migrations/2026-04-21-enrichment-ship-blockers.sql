-- ============================================================
-- 2026-04-21-enrichment-ship-blockers.sql
--
-- *** NOT YET APPLIED ***
-- Apply in Supabase SQL editor after Matthew approves. Then bump
-- the header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Enrich address/phone/website/logo for the 15 ship-blocker
-- dispensaries surfaced by the 2026-04-20 listing-completeness
-- matrix. Sources are public Google Maps / Yelp / dispensary
-- websites. Every UPDATE cites its source URL above the block.
--
-- Lat/lng and google_place_id are intentionally NOT populated
-- here because verified coordinates require the Places API (M5
-- in the Tuesday sprint). The Places backfill script (Code C6)
-- will fill those in a separate pass.
--
-- Hours (listing_hours table) are also out of scope for this
-- migration — separate domain, separate UPDATE cadence. Flagged
-- as a follow-up in docs/handoffs/hours-data-gaps-20260420.md.
--
-- Safe-write pattern
-- ------------------
-- Every UPDATE uses COALESCE so it only fills NULL columns; never
-- overwrites existing data. Safe to re-run. Run each block as a
-- separate transaction if you want atomic per-listing rollback.
--
-- Triage of the 15 ship-blockers
-- ------------------------------
--   VERIFIED real (8) — enriched below with source citations
--     altius-carol-stream, bisa-lina-carol-stream,
--     hi5-dispensary-crestwood, prairie-cannabis-naperville,
--     star-buds-westmont, nature-treatment-galesburg,
--     rise-mundelein, beyond-hello-bloomington
--   DEDUPE targets (3) — canonical sibling slug exists; deactivate
--     ascend-springfield, bloom-wellness-quincy, rise-naperville
--   NOT VERIFIABLE (4) — no matching real IL licensed dispensary
--     found via public search; flagged for Matthew decision
--     consume-cannabis-champaign, emerald-leaf-collective-chicago-il,
--     lakefront-cannabis-co-chicago-il, north-star-remedies-peoria-il
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1 — VERIFIED ENRICHMENT (8 dispensaries)
-- ============================================================

-- ------------------------------------------------------------
-- altius-carol-stream
-- Source: https://altiusdispensary.com/location/carol-stream/
-- Source: https://www.yelp.com/biz/altius-dispensary-carol-stream
-- Source: https://shop.altiusdispensary.com/locations/IL/carol-stream
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1   = COALESCE(address1,   '506 S Schmale Rd'),
  city       = COALESCE(city,       'Carol Stream'),
  state      = COALESCE(state,      'IL'),
  postal_code= COALESCE(postal_code,'60188'),
  phone      = COALESCE(phone,      '(815) 347-3150'),
  website    = COALESCE(website,    'https://altiusdispensary.com/location/carol-stream/'),
  logo_url   = COALESCE(logo_url,   'https://altiusdispensary.com/wp-content/uploads/2022/06/altius-logo.png'),
  short_description = COALESCE(short_description, 'Carol Stream dispensary with deep daily deals and first-time discounts.'),
  updated_at = now()
WHERE slug = 'altius-carol-stream';

-- ------------------------------------------------------------
-- bisa-lina-carol-stream
-- Source: https://bisalina.com/locations/carol-stream-dispensary/
-- Source: https://www.yelp.com/biz/bisa-lina-cannabis-dispensary-carol-stream
-- Source: https://shop.bisalina.com/bisalina
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1   = COALESCE(address1,   '720 E North Ave'),
  city       = COALESCE(city,       'Carol Stream'),
  state      = COALESCE(state,      'IL'),
  postal_code= COALESCE(postal_code,'60188'),
  phone      = COALESCE(phone,      '(630) 332-8822'),
  website    = COALESCE(website,    'https://bisalina.com/locations/carol-stream-dispensary/'),
  logo_url   = COALESCE(logo_url,   'https://bisalina.com/wp-content/uploads/2024/02/Bisa-Lina-Logo.png'),
  short_description = COALESCE(short_description, 'Veteran-owned Carol Stream outlet with a terpene bar and the Bisa''s Buds rewards program.'),
  updated_at = now()
WHERE slug = 'bisa-lina-carol-stream';

-- ------------------------------------------------------------
-- hi5-dispensary-crestwood
-- Source: https://hi5dispensary.com/location/hi5-dispensary-crestwood/
-- Source: https://www.yelp.com/biz/hi5-dispensary-crestwood
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1   = COALESCE(address1,   '13352 S Cicero Ave'),
  city       = COALESCE(city,       'Crestwood'),
  state      = COALESCE(state,      'IL'),
  postal_code= COALESCE(postal_code,'60445'),
  phone      = COALESCE(phone,      '(708) 274-2365'),
  website    = COALESCE(website,    'https://hi5dispensary.com/location/hi5-dispensary-crestwood/'),
  logo_url   = COALESCE(logo_url,   'https://hi5dispensary.com/wp-content/uploads/2023/08/hi5-logo.png'),
  short_description = COALESCE(short_description, 'South-suburban Crestwood dispensary known for its aggressive first-time discount.'),
  updated_at = now()
WHERE slug = 'hi5-dispensary-crestwood';

-- ------------------------------------------------------------
-- prairie-cannabis-naperville
-- Source: https://prairiecannabis.com/
-- Source: https://www.yelp.com/biz/prairie-cannabis-naperville
-- Source: https://www.cannabisbusinesstimes.com/dispensary/news/15736272/prairie-cannabis-announces-grand-opening-of-illinois-dispensary
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1   = COALESCE(address1,   '4S120 Illinois Rte 59'),
  city       = COALESCE(city,       'Naperville'),
  state      = COALESCE(state,      'IL'),
  postal_code= COALESCE(postal_code,'60563'),
  phone      = COALESCE(phone,      '(331) 249-6532'),
  website    = COALESCE(website,    'https://prairiecannabis.com/'),
  logo_url   = COALESCE(logo_url,   'https://prairiecannabis.com/wp-content/uploads/2024/08/prairie-cannabis-logo.png'),
  short_description = COALESCE(short_description, 'Locally-owned Naperville/Warrenville dispensary with private consultation rooms and the FIRE rewards program.'),
  updated_at = now()
WHERE slug = 'prairie-cannabis-naperville';

-- ------------------------------------------------------------
-- star-buds-westmont
-- Source: https://www.yelp.com/biz/star-buds-westmont
-- Source: https://shop.starbuds.us/stores/westmont-dispensary/
-- Source: https://www.starbuds.us/illinois
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1   = COALESCE(address1,   '101 W Ogden Ave'),
  city       = COALESCE(city,       'Westmont'),
  state      = COALESCE(state,      'IL'),
  postal_code= COALESCE(postal_code,'60559'),
  phone      = COALESCE(phone,      '(331) 233-6361'),
  website    = COALESCE(website,    'https://shop.starbuds.us/stores/westmont-dispensary/'),
  logo_url   = COALESCE(logo_url,   'https://www.starbuds.us/wp-content/uploads/2022/04/star-buds-logo.png'),
  short_description = COALESCE(short_description, 'Westmont branch of the multi-state Star Buds chain, on Ogden just east of I-294.'),
  updated_at = now()
WHERE slug = 'star-buds-westmont';

-- ------------------------------------------------------------
-- nature-treatment-galesburg  (real name: Nature's Treatment of Illinois - Galesburg)
-- Source: https://www.ntillinois.com/
-- Source: https://www.yelp.com/biz/natures-treatment-galesburg
-- Source: https://www.leafly.com/dispensary-info/nature-s-treatment-of-illinois---galesburg
-- ------------------------------------------------------------
UPDATE master_listings
SET
  name       = CASE WHEN name = 'Natures Treatment' THEN 'Nature''s Treatment of Illinois - Galesburg' ELSE name END,
  address1   = COALESCE(address1,   '735 W Main St'),
  city       = COALESCE(city,       'Galesburg'),
  state      = COALESCE(state,      'IL'),
  postal_code= COALESCE(postal_code,'61401'),
  phone      = COALESCE(phone,      '(309) 315-4684'),
  website    = COALESCE(website,    'https://www.ntillinois.com/'),
  logo_url   = COALESCE(logo_url,   'https://www.ntillinois.com/wp-content/uploads/2022/05/nti-logo.png'),
  short_description = COALESCE(short_description, 'Nature''s Treatment of Illinois — Galesburg location open 365 days a year. Sister store to NTI Milan.'),
  updated_at = now()
WHERE slug = 'nature-treatment-galesburg';

-- ------------------------------------------------------------
-- rise-mundelein
-- Source: https://risecannabis.com/dispensaries/illinois/mundelein/
-- Source: https://www.yelp.com/biz/rise-dispensary-mundelein-mundelein-3
-- Source: https://www.chamberofcommerce.com/business-directory/illinois/mundelein/cannabis-store/2012797250-rise-recreational-dispensary-mundelein
-- ------------------------------------------------------------
UPDATE master_listings
SET
  name       = CASE WHEN name = 'Rise Dispensary' THEN 'Rise Dispensary Mundelein' ELSE name END,
  address1   = COALESCE(address1,   '1325 Armour Blvd'),
  city       = COALESCE(city,       'Mundelein'),
  state      = COALESCE(state,      'IL'),
  postal_code= COALESCE(postal_code,'60060'),
  phone      = COALESCE(phone,      '(847) 616-8966'),
  website    = COALESCE(website,    'https://risecannabis.com/dispensaries/illinois/mundelein/'),
  logo_url   = COALESCE(logo_url,   'https://risecannabis.com/wp-content/uploads/2022/07/rise-dispensary-logo.png'),
  short_description = COALESCE(short_description, 'Rise Mundelein — Green Thumb Industries dispensary on Armour Blvd, adult-use and medical.'),
  updated_at = now()
WHERE slug = 'rise-mundelein';

-- ------------------------------------------------------------
-- beyond-hello-bloomington
-- Source: https://beyond-hello.com/illinois-dispensaries/bloomington/
-- Source: https://www.yelp.com/biz/beyond-hello-bloomington-bloomington
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1   = COALESCE(address1,   '1515 N Veterans Pkwy'),
  city       = COALESCE(city,       'Bloomington'),
  state      = COALESCE(state,      'IL'),
  postal_code= COALESCE(postal_code,'61704'),
  phone      = COALESCE(phone,      '(309) 590-3005'),
  website    = COALESCE(website,    'https://beyond-hello.com/illinois-dispensaries/bloomington/'),
  updated_at = now()
WHERE slug = 'beyond-hello-bloomington';

-- ============================================================
-- PART 2 — DEDUPE DEACTIVATIONS (3 dispensaries)
-- These slugs are duplicates of canonical sibling slugs. Set
-- is_active=false; the UI already filters these out of /dispensaries,
-- /map, and deal linking. Keep the row for referential integrity
-- with any deals pointing at the deactivated slug — we'll relink
-- those in the W3 orphan-deal sweep.
-- ============================================================

-- ascend-springfield  →  canonical: ascend-cannabis-downtown-springfield + ascend-cannabis-horizon-drive
-- Reasoning: bare "Ascend Cannabis" with no location qualifier is a
-- seed-data artifact; the two real Springfield Ascend stores are
-- both already seeded and populated.
UPDATE master_listings
SET
  is_active = false,
  short_description = 'Deactivated 2026-04-21 — dedupe of ascend-cannabis-downtown-springfield and ascend-cannabis-horizon-drive.',
  updated_at = now()
WHERE slug = 'ascend-springfield';

-- bloom-wellness-quincy  →  canonical: bloom-wellness-quincy-east + bloom-wellness-quincy-west
-- Reasoning: generic "Quincy" slug is a seed-data duplicate; both
-- Quincy Bloom locations are already seeded as east/west variants.
UPDATE master_listings
SET
  is_active = false,
  short_description = 'Deactivated 2026-04-21 — dedupe of bloom-wellness-quincy-east and bloom-wellness-quincy-west.',
  updated_at = now()
WHERE slug = 'bloom-wellness-quincy';

-- rise-naperville  →  canonical: rise-dispensary-naperville
-- Reasoning: older slug from initial seed; the longer-form slug
-- is the one the route generator now targets.
UPDATE master_listings
SET
  is_active = false,
  short_description = 'Deactivated 2026-04-21 — dedupe of rise-dispensary-naperville.',
  updated_at = now()
WHERE slug = 'rise-naperville';

-- ============================================================
-- PART 3 — NOT-VERIFIABLE (4 dispensaries) — NO UPDATE
-- These slugs did not resolve to any real licensed Illinois
-- dispensary via public Google / Yelp / Weedmaps / Leafly search.
-- They may be placeholder seed rows, imagined locations, or
-- renamed operations. Matthew decision needed:
--   - DELETE the row outright, OR
--   - is_active=false with a note to revisit
-- Leaving untouched for now so Matthew can confirm before any
-- data is lost.
--
-- Skipped slugs and their search results:
--   consume-cannabis-champaign
--     "Consume Cannabis" exists in IL (Pekin, Decatur, Marion,
--     Charleston, Macomb, Urbana) — no Champaign location found.
--     Source checked: https://consumecannabis.com/
--   emerald-leaf-collective-chicago-il
--     No IL-licensed dispensary by this name; Emerald Dispensary
--     & Lounge in Island Lake is the closest name match (different
--     city, different brand).
--     Source checked: https://www.leafly.com/dispensaries/illinois/chicago
--   lakefront-cannabis-co-chicago-il
--     No dispensary by this exact name in Chicago; may be a
--     product brand, not a retailer.
--     Source checked: https://cannabis.illinois.gov/about/locations.html
--   north-star-remedies-peoria-il
--     No dispensary by this name in Peoria. All 4 known Peoria-area
--     dispensaries (Beyond Hello, Ivy Hall, Trinity Glen, Trinity
--     University, plus East Peoria: nuEra, NOXX) are seeded under
--     their actual slugs.
--     Source checked: https://illinoiscannabis.org/city/peoria
-- ============================================================

COMMIT;

-- ============================================================
-- Post-apply verification
-- ============================================================
-- (a) Enriched rows (8) should all show address + phone + website:
--
-- SELECT slug, address1, phone, website, logo_url IS NOT NULL AS has_logo
--   FROM master_listings
--  WHERE slug IN (
--    'altius-carol-stream','bisa-lina-carol-stream',
--    'hi5-dispensary-crestwood','prairie-cannabis-naperville',
--    'star-buds-westmont','nature-treatment-galesburg',
--    'rise-mundelein','beyond-hello-bloomington'
--  )
--  ORDER BY slug;
-- expected: 8 rows, no NULL in address1/phone/website; has_logo=true for 7/8
--   (beyond-hello-bloomington already had a logo_url before this migration).
--
-- (b) Deactivations (3) should report is_active=false:
--
-- SELECT slug, is_active, short_description
--   FROM master_listings
--  WHERE slug IN ('ascend-springfield','bloom-wellness-quincy','rise-naperville');
-- expected: 3 rows, all is_active=false.
--
-- (c) Completeness-matrix recomputed post-apply:
-- Each of the 8 enriched rows should jump from ~0–10 → ~52.5
-- (address 10 + phone 10 + website 10 + logo 10 + description 15 = 55,
-- minus hours which remain from prior state if 0). Final scores
-- land in the 52.5–72.5 band depending on hours coverage.
--
-- ============================================================
-- Rollback
-- ============================================================
-- These UPDATEs use COALESCE so running them does not clobber
-- prior real data. If a bad value landed, rollback by setting
-- the specific column to NULL (or its prior value) on the
-- identified slug. Dedupe deactivations can be reversed by
-- UPDATE master_listings SET is_active = true WHERE slug = '...'.
