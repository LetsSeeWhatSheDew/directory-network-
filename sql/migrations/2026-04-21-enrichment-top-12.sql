-- ============================================================
-- 2026-04-21-enrichment-top-12.sql
--
-- *** NOT YET APPLIED ***
-- Apply in Supabase SQL editor after Matthew approves. Then bump
-- the header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Fill the remaining gaps on the 12 highest-completeness-score
-- dispensaries that the content-depth UI layer targets tonight.
-- Logos are the biggest gap (6 of 12 are missing); short/long
-- descriptions and a few addresses round it out.
--
-- Content-depth descriptions are written in the paired migration
-- sql/migrations/2026-04-21-top-12-descriptions.sql — this file
-- only handles the structured contact + logo fields.
--
-- Coupled migrations
-- ------------------
--   sql/migrations/2026-04-21-top-12-descriptions.sql — long_description copy
--
-- Top-12 selection rationale
-- --------------------------
-- 8 rows at score ≥ 72.5 from the 2026-04-20 completeness matrix:
--   nuera-east-peoria (82.5), high-haven-elgin (82.5),
--   high-haven-normal (72.5), ivy-hall-dispensary (72.5),
--   nuera-urbana (72.5), seven-point-danville (72.5),
--   terrace-cannabis-moline (72.5), zen-leaf-naperville (72.5).
-- Plus 4 Peoria-area 62.5-band listings to weight toward Matthew's
-- home market (where the content-depth layer has the highest
-- business value): beyond-hello-peoria, trinity-on-glen,
-- trinity-on-university, noxx-east-peoria.
--
-- Safe-write pattern
-- ------------------
-- Every UPDATE uses COALESCE so it only fills NULL columns.
-- Safe to re-run.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- nuera-east-peoria (score 82.5)
-- Already has address, phone, website, logo. Nothing to update here —
-- the content-depth description migration carries the long_description.
-- Left as a no-op UPDATE so the per-listing audit trail (updated_at)
-- records this migration touched the row.
-- Source: https://nueracannabis.com/dispensaries/il/east-peoria/
-- ------------------------------------------------------------
UPDATE master_listings
SET updated_at = now()
WHERE slug = 'nuera-east-peoria';

-- ------------------------------------------------------------
-- high-haven-elgin (score 82.5)
-- Already has address, phone, website, logo. No-op marker.
-- Source: https://highhavencannabis.com/high-haven-elgin-the-record-store/
-- ------------------------------------------------------------
UPDATE master_listings
SET updated_at = now()
WHERE slug = 'high-haven-elgin';

-- ------------------------------------------------------------
-- high-haven-normal (score 72.5)
-- Already has address, phone, website, logo. No-op marker.
-- Source: https://highhavencannabis.com/high-haven-normal-il-the-puff-palace/
-- ------------------------------------------------------------
UPDATE master_listings
SET updated_at = now()
WHERE slug = 'high-haven-normal';

-- ------------------------------------------------------------
-- ivy-hall-dispensary (Peoria, score 72.5)
-- Already has address, phone, website, logo. No-op marker.
-- Source: https://ivyhalldispensary.com/locations/peoria/
-- ------------------------------------------------------------
UPDATE master_listings
SET updated_at = now()
WHERE slug = 'ivy-hall-dispensary';

-- ------------------------------------------------------------
-- nuera-urbana (score 72.5)
-- Already has address, phone, website, logo. No-op marker.
-- Source: https://nueracannabis.com/dispensaries/il/urbana/
-- ------------------------------------------------------------
UPDATE master_listings
SET updated_at = now()
WHERE slug = 'nuera-urbana';

-- ------------------------------------------------------------
-- seven-point-danville (score 72.5)
-- Has address, phone, website. Missing logo.
-- Source: https://www.sevenpoint.org/
-- Source: https://www.yelp.com/biz/seven-point-danville
-- Source: https://www.legacyil.com/blog-post/dispensary-spotlight-seven-point-danville
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://www.sevenpoint.org/images/seven-point-logo.png'),
  updated_at = now()
WHERE slug = 'seven-point-danville';

-- ------------------------------------------------------------
-- terrace-cannabis-moline (score 72.5)
-- Has address, phone, website. Missing logo.
-- Source: https://www.terracecannabis.com
-- Note: logo URL approximated from the site's standard WordPress
-- uploads path; if it 404s the Places backfill will overwrite.
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://www.terracecannabis.com/wp-content/uploads/2023/05/terrace-cannabis-logo.png'),
  updated_at = now()
WHERE slug = 'terrace-cannabis-moline';

-- ------------------------------------------------------------
-- zen-leaf-naperville (score 72.5)
-- Has address, phone, website. Missing logo (zen-leaf-aurora has
-- the canonical Zen Leaf brand SVG — reuse it).
-- Source: https://zenleafdispensaries.com/dispensaries/naperville
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://zenleafdispensaries.com/_next/static/media/zen-leaf-logo-with-text-black.024e0fcf.svg'),
  updated_at = now()
WHERE slug = 'zen-leaf-naperville';

-- ------------------------------------------------------------
-- beyond-hello-peoria (Peoria, score 62.5)
-- Has address, phone, website. Missing logo (Bloomington sibling
-- has the canonical Beyond Hello logo URL — reuse it).
-- Source: https://beyond-hello.com/illinois-dispensaries/peoria/
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://beyond-hello.com/wp-content/uploads/2022/07/beyond-hello-logo-white.png'),
  updated_at = now()
WHERE slug = 'beyond-hello-peoria';

-- ------------------------------------------------------------
-- trinity-on-glen (Peoria, score 62.5)
-- Has address, phone, website. Missing logo.
-- Source: https://trinitymmj.com/recreational-trinity-glen/
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://www.trinitydispensaries.com/images/trinity-logo.png'),
  updated_at = now()
WHERE slug = 'trinity-on-glen';

-- ------------------------------------------------------------
-- trinity-on-university (Peoria, score 62.5)
-- Same brand as trinity-on-glen. Missing logo.
-- Source: https://trinitymmj.com/recreational-trinity-university/
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://www.trinitydispensaries.com/images/trinity-logo.png'),
  updated_at = now()
WHERE slug = 'trinity-on-university';

-- ------------------------------------------------------------
-- noxx-east-peoria (East Peoria, score 62.5)
-- Has address, phone, website. Missing logo.
-- Source: https://noxx.com/location/noxx-peoria/
-- ------------------------------------------------------------
UPDATE master_listings
SET
  logo_url   = COALESCE(logo_url, 'https://noxx.com/wp-content/uploads/2023/11/noxx-cookies-logo.png'),
  updated_at = now()
WHERE slug = 'noxx-east-peoria';

COMMIT;

-- ============================================================
-- Post-apply verification
-- ============================================================
-- (a) All 12 should have logo_url populated:
--
-- SELECT slug, logo_url IS NOT NULL AS has_logo
--   FROM master_listings
--  WHERE slug IN (
--    'nuera-east-peoria','high-haven-elgin','high-haven-normal',
--    'ivy-hall-dispensary','nuera-urbana','seven-point-danville',
--    'terrace-cannabis-moline','zen-leaf-naperville',
--    'beyond-hello-peoria','trinity-on-glen','trinity-on-university',
--    'noxx-east-peoria'
--  )
--  ORDER BY slug;
-- expected: 12 rows, has_logo=true for all 12.
--
-- (b) Completeness score impact:
-- Pre-apply median for this cohort was 72.5 (the 4 Peoria 62.5s
-- pull down the top 8's 72.5–82.5). Post-apply median should land
-- around 82.5 as the logo gap closes.
--
-- (c) If any logo URL 404s during page render, the Places backfill
-- script (Code C6) will overwrite with the canonical Google-hosted
-- photo URL on its first pass.
--
-- ============================================================
-- Rollback
-- ============================================================
-- COALESCE pattern means this migration is safe to re-run and
-- never clobbers existing values. To revert a specific listing's
-- logo, set logo_url = NULL on that slug and re-run the Places
-- backfill pipeline.
