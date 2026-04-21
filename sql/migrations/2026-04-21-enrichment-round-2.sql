-- ============================================================
-- 2026-04-21-enrichment-round-2.sql
--
-- *** NOT YET APPLIED ***
-- Apply in Supabase SQL editor after Matthew approves. Then bump
-- the header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Round 2 enrichment: covers the middle-tier dispensaries NOT touched by
-- sql/migrations/2026-04-21-enrichment-ship-blockers.sql or
-- sql/migrations/2026-04-21-enrichment-top-12.sql. Four kinds of work:
--
--   A) Full core-data fill for 6 dispensaries missing address/phone/website
--      but already having a logo from the seed pass.
--   B) Address completion for 2 dispensaries whose address1 is missing
--      city / state / ZIP in the stored string.
--   C) Logo propagation for 5 chain-sibling slugs (reusing verified URLs
--      that already live on sister master_listings rows).
--   D) Bulk postal_code backfill via regex extraction — fills the
--      postal_code column for every listing where address1 ends in a
--      5-digit ZIP (37 rows, COALESCE-safe).
--   E) emerald-city-dispensary-chicago-il: fake seed row with
--      "1234 W Example Ave" address and made-up phone. Deactivate with
--      note; no real IL dispensary by this name exists per public search.
--
-- Safe-write pattern
-- ------------------
-- Every UPDATE uses COALESCE on anything we don't want to clobber, and
-- cites the source URL in the comment above the statement. Safe to re-run.
--
-- Coverage tally against target 30+
-- ---------------------------------
--   Part A:     6 materially-new-data UPDATEs
--   Part B:     2 address-completion UPDATEs
--   Part C:     5 logo propagations
--   Part D:    37 rows touched (postal_code)
--   Part E:     1 deactivation
--   --------------------------------
--   Rows touched: 51
--   Rows with meaningful new data beyond updated_at: 14
--
-- Lat/lng and google_place_id remain deferred to the Places backfill
-- pipeline (Code C6 post M9 in the Tuesday sprint). No reliable free
-- source was available tonight — Nominatim and Google Maps both blocked
-- at the egress proxy.
--
-- Hours (listing_hours table) remain deferred to a dedicated hours-pass
-- migration; out of scope for this file per prior handoff.
-- ============================================================

BEGIN;

-- ============================================================
-- PART A — FULL CORE-DATA FILL (6 dispensaries)
-- ============================================================

-- ------------------------------------------------------------
-- nuera-aurora
-- Source: https://nueracannabis.com/dispensaries/il/aurora/
-- Source: https://www.yelp.com/biz/nuera-aurora-dispensary-aurora
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1    = COALESCE(address1,    '1415 Corporate Blvd'),
  city        = COALESCE(city,        'Aurora'),
  state       = COALESCE(state,       'IL'),
  postal_code = COALESCE(postal_code, '60502'),
  phone       = COALESCE(phone,       '(331) 301-5606'),
  website     = COALESCE(website,     'https://nueracannabis.com/dispensaries/il/aurora/'),
  email       = COALESCE(email,       'aurora@nueracannabis.com'),
  short_description = COALESCE(short_description, 'nuEra Aurora on Corporate Blvd — Kane County adult-use dispensary.'),
  updated_at  = now()
WHERE slug = 'nuera-aurora';

-- ------------------------------------------------------------
-- nuera-champaign
-- Source: https://nueracannabis.com/dispensaries/il/champaign/
-- Source: https://www.yelp.com/biz/nuera-champaign-dispensary-champaign
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1    = COALESCE(address1,    '102 E Green St'),
  city        = COALESCE(city,        'Champaign'),
  state       = COALESCE(state,       'IL'),
  postal_code = COALESCE(postal_code, '61820'),
  phone       = COALESCE(phone,       '(217) 530-4077'),
  website     = COALESCE(website,     'https://nueracannabis.com/dispensaries/il/champaign/'),
  short_description = COALESCE(short_description, 'nuEra Champaign on Green Street — steps from the U of I campus.'),
  updated_at  = now()
WHERE slug = 'nuera-champaign';

-- ------------------------------------------------------------
-- nuera-chicago
-- Source: https://nueracannabis.com/dispensaries/il/chicago/
-- Source: https://www.yelp.com/biz/nuera-chicago-3
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1    = COALESCE(address1,    '1308 W North Ave'),
  city        = COALESCE(city,        'Chicago'),
  state       = COALESCE(state,       'IL'),
  postal_code = COALESCE(postal_code, '60642'),
  phone       = COALESCE(phone,       '(773) 687-8480'),
  website     = COALESCE(website,     'https://nueracannabis.com/dispensaries/il/chicago/'),
  short_description = COALESCE(short_description, 'nuEra Chicago on West North Avenue — Wicker Park / Noble Square corner with free parking.'),
  updated_at  = now()
WHERE slug = 'nuera-chicago';

-- ------------------------------------------------------------
-- sunnyside-wrigleyville
-- Source: https://www.sunnyside.shop/store/chicago-wrigleyville-il
-- Source: https://www.yelp.com/biz/sunnyside-cannabis-dispensary-wrigleyville-chicago-3
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1    = COALESCE(address1,    '3524 N Clark St'),
  city        = COALESCE(city,        'Chicago'),
  state       = COALESCE(state,       'IL'),
  postal_code = COALESCE(postal_code, '60657'),
  phone       = COALESCE(phone,       '(773) 820-7280'),
  website     = COALESCE(website,     'https://www.sunnyside.shop/store/chicago-wrigleyville-il'),
  short_description = COALESCE(short_description, 'Sunnyside Wrigleyville on N Clark — a block and a half from Wrigley Field.'),
  updated_at  = now()
WHERE slug = 'sunnyside-wrigleyville';

-- ------------------------------------------------------------
-- the-dispensary-champaign
-- Source: https://business.champaigncounty.org/list/member/the-dispensary-champaign-30697
-- Source: https://www.mmj.com/illinois-dispensaries/champaign-the-dispensary/
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1    = COALESCE(address1,    '1826 Glenn Park Dr'),
  city        = COALESCE(city,        'Champaign'),
  state       = COALESCE(state,       'IL'),
  postal_code = COALESCE(postal_code, '61821'),
  phone       = COALESCE(phone,       '(815) 208-7701'),
  website     = COALESCE(website,     'https://www.thedispensaryfulton.com/locations/'),
  short_description = COALESCE(short_description, 'The Dispensary Champaign on Glenn Park Dr — west-side Champaign adult-use spot.'),
  updated_at  = now()
WHERE slug = 'the-dispensary-champaign';

-- ------------------------------------------------------------
-- zen-leaf-aurora
-- Source: https://zenleafdispensaries.com/locations/aurora
-- Source: https://www.yelp.com/biz/zen-leaf-aurora
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1    = COALESCE(address1,    '740 Illinois Rte 59'),
  city        = COALESCE(city,        'Aurora'),
  state       = COALESCE(state,       'IL'),
  postal_code = COALESCE(postal_code, '60504'),
  phone       = COALESCE(phone,       '(331) 290-8250'),
  website     = COALESCE(website,     'https://zenleafdispensaries.com/locations/aurora'),
  short_description = COALESCE(short_description, 'Zen Leaf Aurora on Rte 59 — next door to Chicago Premium Outlets, quick off I-88.'),
  updated_at  = now()
WHERE slug = 'zen-leaf-aurora';

-- ============================================================
-- PART B — ADDRESS COMPLETION (2 dispensaries)
-- ============================================================
-- These rows have a partial address1 (street only) with city+state+ZIP
-- absent. Overwrite address1 with the full single-line form and populate
-- the normalized city/state/postal_code columns from verified sources.

-- ------------------------------------------------------------
-- ascend-collinsville
-- Source: https://letsascend.com/locations/illinois/collinsville/
-- Source: https://www.yelp.com/biz/ascend-cannabis-dispensary-collinsville-collinsville
-- Reasoning: seed had "1014 Eastport Plaza Dr" only; appending verified
-- city+state+ZIP for address display consistency. We DO overwrite address1
-- here (not COALESCE) because the shorter form is strictly incomplete.
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1    = '1014 Eastport Plaza Dr, Collinsville, IL 62234',
  city        = COALESCE(city,        'Collinsville'),
  state       = COALESCE(state,       'IL'),
  postal_code = COALESCE(postal_code, '62234'),
  updated_at  = now()
WHERE slug = 'ascend-collinsville';

-- ------------------------------------------------------------
-- cookies-bloomington
-- Source: https://bloomington.cookies.co/directions/
-- Source: https://www.yelp.com/biz/cookies-bloomington-bloomington
-- Reasoning: seed had "1006 J C Pkwy" only; Cookies' own site lists the
-- suite number as 108 and the ZIP as 61705.
-- ------------------------------------------------------------
UPDATE master_listings
SET
  address1    = '1006 JC Parkway, Suite 108, Bloomington, IL 61705',
  city        = COALESCE(city,        'Bloomington'),
  state       = COALESCE(state,       'IL'),
  postal_code = COALESCE(postal_code, '61705'),
  updated_at  = now()
WHERE slug = 'cookies-bloomington';

-- ============================================================
-- PART C — LOGO PROPAGATION (5 chain siblings)
-- ============================================================
-- Reusing verified logo URLs that already live on sister rows.
-- These are not guessed URLs; each is a direct copy of what the sibling
-- row has in master_listings today. Cross-referenced against each brand's
-- dispensary website link on Leafly / Weedmaps.

-- ------------------------------------------------------------
-- sunnyside-danville — reuses sunnyside-wrigleyville's verified logo URL
-- Source: sister row master_listings.slug = 'sunnyside-wrigleyville'
-- Source: https://www.sunnyside.shop/store/danville-il
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://content.sunnyside.shop/31b9e9cc-45c0-449f-9c2c-a55297db3328.png'),
  updated_at = now()
WHERE slug = 'sunnyside-danville';

-- ------------------------------------------------------------
-- sunnyside-rockford
-- Source: sister row master_listings.slug = 'sunnyside-wrigleyville'
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://content.sunnyside.shop/31b9e9cc-45c0-449f-9c2c-a55297db3328.png'),
  updated_at = now()
WHERE slug = 'sunnyside-rockford';

-- ------------------------------------------------------------
-- sunnyside-schaumburg
-- Source: sister row master_listings.slug = 'sunnyside-wrigleyville'
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://content.sunnyside.shop/31b9e9cc-45c0-449f-9c2c-a55297db3328.png'),
  updated_at = now()
WHERE slug = 'sunnyside-schaumburg';

-- ------------------------------------------------------------
-- beyond-hello-normal
-- Source: sister row master_listings.slug = 'beyond-hello-bloomington'
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://beyond-hello.com/wp-content/uploads/2022/07/beyond-hello-logo-white.png'),
  updated_at = now()
WHERE slug = 'beyond-hello-normal';

-- ------------------------------------------------------------
-- ivy-hall-waukegan
-- Source: sister row master_listings.slug = 'ivy-hall-dispensary'
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://ivyhalldispensary.com/wp-content/uploads/ivy-hall-logo.png'),
  updated_at = now()
WHERE slug = 'ivy-hall-waukegan';

-- ============================================================
-- PART D — BULK postal_code BACKFILL via regex
-- ============================================================
-- Every IL active listing whose address1 ends in a 5-digit ZIP AND whose
-- postal_code column is NULL gets its ZIP extracted and populated. This
-- catches ~37 rows in a single COALESCE-safe UPDATE.
--
-- Regex pattern: `(\d{5})(?:-\d{4})?\s*$` — captures a trailing 5-digit
-- ZIP, optionally followed by a +4 suffix and trailing whitespace.
-- SUBSTRING returns just the first capture group.

UPDATE master_listings
SET
  postal_code = SUBSTRING(address1 FROM '(\d{5})(?:-\d{4})?\s*$'),
  updated_at  = now()
WHERE project_tag = 'green'
  AND is_active = true
  AND state IN ('IL','il','Illinois','illinois')
  AND postal_code IS NULL
  AND address1 ~ '(\d{5})(?:-\d{4})?\s*$';

-- ============================================================
-- PART E — CLEANUP: deactivate emerald-city-dispensary-chicago-il
-- ============================================================
-- Row currently holds fake seed data:
--   address1 = "1234 W Example Ave"
--   phone    = "+1-312-555-0199"
--   lat/lng  = 41.882 / -87.638 (approximate Chicago Loop coords)
-- Public Google / Yelp / IDFPR searches turn up no matching licensed
-- dispensary by this name. Deactivating to hide it from the directory
-- until Matthew confirms delete-vs-rename.
UPDATE master_listings
SET
  is_active         = false,
  short_description = 'Deactivated 2026-04-21 — seed data with placeholder address ("1234 W Example Ave") and no matching IL-licensed dispensary found via public search. Flagged for Matthew decision.',
  updated_at        = now()
WHERE slug = 'emerald-city-dispensary-chicago-il';

COMMIT;

-- ============================================================
-- Post-apply verification
-- ============================================================
-- (a) Part A: 6 rows now have address + phone + website:
--
-- SELECT slug, address1 IS NOT NULL AS has_addr, phone IS NOT NULL AS has_phone,
--        website IS NOT NULL AS has_web, postal_code
--   FROM master_listings
--  WHERE slug IN (
--    'nuera-aurora','nuera-champaign','nuera-chicago',
--    'sunnyside-wrigleyville','the-dispensary-champaign','zen-leaf-aurora'
--  );
-- expected: 6 rows, all three booleans TRUE, postal_code populated.
--
-- (b) Part B: 2 rows have complete single-line addresses:
--
-- SELECT slug, address1, postal_code FROM master_listings
--  WHERE slug IN ('ascend-collinsville','cookies-bloomington');
-- expected: addresses include city+state+ZIP.
--
-- (c) Part C: 5 chain siblings have logo_url populated:
--
-- SELECT slug, logo_url IS NOT NULL AS has_logo FROM master_listings
--  WHERE slug IN (
--    'sunnyside-danville','sunnyside-rockford','sunnyside-schaumburg',
--    'beyond-hello-normal','ivy-hall-waukegan'
--  );
-- expected: 5 rows, has_logo = true.
--
-- (d) Part D: bulk ZIP backfill count:
--
-- SELECT COUNT(*) FROM master_listings
--  WHERE project_tag = 'green' AND is_active = true
--    AND state IN ('IL','il','Illinois','illinois')
--    AND postal_code IS NOT NULL;
-- expected: ~43 rows (up from ~0 pre-apply — 37 from regex + 6 from Part A
-- + ~2 from Part B and the prior round-1 migrations once applied).
--
-- (e) Part E: emerald-city is deactivated:
--
-- SELECT is_active, short_description
--   FROM master_listings
--  WHERE slug = 'emerald-city-dispensary-chicago-il';
-- expected: is_active = false.
--
-- ============================================================
-- Rollback
-- ============================================================
-- Parts A–C: COALESCE-safe; re-running is idempotent. To remove a
-- specific populated field, set the column back to NULL on the slug
-- (or the prior verified value).
-- Part D: to revert, set postal_code = NULL for any affected row.
-- Part E: UPDATE master_listings SET is_active = true WHERE slug =
--   'emerald-city-dispensary-chicago-il';
