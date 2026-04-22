-- NOT YET APPLIED
-- Migration: repoint 3 matchable orphan listing_slugs + deactivate 6 unmatchable orphans
-- Author: Cowork
-- Date: 2026-04-22 (authored 2026-04-21 night)
-- Pairs with: docs/audits/deal-listing-join-audit-20260421.md
--
-- Context: 9 of 21 distinct active-deal listing_slugs don't join to master_listings.
-- This causes /api/deals/recommend + listing pages to render blank city/name/hours/coords/map.
-- Code flagged the symptom in [docs/session-reports/2026-04-21-evening-code.md appendix].
--
-- Three of the 9 orphans have a canonical master_listings row under a different slug
-- (audit doc has the full justification with source URLs). This migration repoints
-- their deals to the correct slug.
--
-- The other 6 orphans fall into two buckets:
--   (a) 5 likely-legitimate IL dispensaries with no master_listings row yet.
--       These need dedicated Cowork research + master_listings inserts as a follow-up,
--       NOT a slug rename. Meanwhile this migration deactivates the deals so they
--       stop rendering empty cards on the public site.
--   (b) 1 suspect row (mood-shine-chicago-heights) whose source URL doesn't clearly
--       resolve. Deactivated with the rest; flagged for Matthew's investigation.
--
-- This migration DEPENDS on `sql/migrations/2026-04-21-deal-staleness.sql` being
-- applied first (it adds the `status_reason` column used below). Apply order:
--   1. 2026-04-21-deal-staleness.sql      (adds status_reason + indexes)
--   2. 2026-04-22-fix-deal-listing-joins.sql   (this file)
--   3. 2026-04-22-add-verified-at-to-view.sql   (view refresh so verified_at projects)
--   4. 2026-04-22-verified-at-backfill.sql      (Matthew picks A/B/C first)
--
-- Rollback (copy the pre-state into a staging table first if needed):
--   UPDATE deals SET listing_slug = 'altius-dispensary-carol-stream' WHERE listing_slug = 'altius-carol-stream' AND source_url LIKE '%altius%' AND created_at::date = '2026-04-14';
--   UPDATE deals SET listing_slug = 'ivy-hall-peoria' WHERE listing_slug = 'ivy-hall-dispensary' AND source_url LIKE '%ivyhalldispensary%' AND created_at::date = '2026-04-14';
--   UPDATE deals SET listing_slug = 'natures-treatment-galesburg' WHERE listing_slug = 'nature-treatment-galesburg' AND source_url LIKE '%natures-treatment-galesburg%' AND created_at::date = '2026-04-14';
--   UPDATE deals SET is_active = true, status_reason = NULL WHERE status_reason = 'orphaned' AND created_at::date = '2026-04-14';
--
-- Sign-off required: Matthew.

BEGIN;

-- ============================================================
-- 1. Repoints (3 slug pairs, 11 deals total)
-- ============================================================

-- 1a. altius-dispensary-carol-stream → altius-carol-stream  (6 deals)
-- Evidence: master_listings.slug='altius-carol-stream', name='Altius Dispensary', city='Carol Stream'.
-- Deal source URLs use the same slug: leafly.com/dispensaries/altius-carol-stream.
-- The "dispensary" infix is a parse error on the import side.
UPDATE public.deals
SET listing_slug = 'altius-carol-stream',
    updated_at = NOW()
WHERE listing_slug = 'altius-dispensary-carol-stream'
  AND is_active = true;

-- 1b. ivy-hall-peoria → ivy-hall-dispensary  (2 deals)
-- Evidence: master_listings.slug='ivy-hall-dispensary', name='Ivy Hall Dispensary', city='Peoria'.
-- Canonical Peoria location. Both orphan deals reference ivyhalldispensary.com as source.
UPDATE public.deals
SET listing_slug = 'ivy-hall-dispensary',
    updated_at = NOW()
WHERE listing_slug = 'ivy-hall-peoria'
  AND is_active = true;

-- 1c. natures-treatment-galesburg → nature-treatment-galesburg  (3 deals)
-- Evidence: master_listings.slug='nature-treatment-galesburg' (note singular "nature" —
-- data-entry inconsistency on the master side), name='Natures Treatment', city='Galesburg'.
-- Source URLs use the plural: leafly.com/dispensaries/natures-treatment-galesburg.
-- Repointing deals to match the master slug. A later Cowork hygiene pass can
-- rename the master row to 'natures-treatment-galesburg' if we want source/master alignment.
UPDATE public.deals
SET listing_slug = 'nature-treatment-galesburg',
    updated_at = NOW()
WHERE listing_slug = 'natures-treatment-galesburg'
  AND is_active = true;

-- ============================================================
-- 2. Orphan deactivations (6 slugs, 7 deals total)
-- ============================================================

-- These 6 listing_slug values have NO matching master_listings row. Until a
-- research pass creates the master rows (or confirms they're fake), the deals
-- render broken on the live site. Deactivate to remove from public feed while
-- preserving the data for later re-activation.

-- 2a. Likely-legitimate but master_listings row doesn't exist yet:
--   - bisa-lina-joliet         — leafly URL resolves, Bisa Lina has a Joliet store
--   - cookies-chicago          — weedmaps URL resolves, Cookies has a Chicago store
--   - curaleaf-morris          — leafly URL resolves, Curaleaf Morris is a known IL location
--   - natures-treatment-milan  — leafly URL resolves, Nature's Treatment of IL has a Milan store
--   - perception-cannabis-chicago — weedmaps URL resolves, Perception is a real IL dispensary

-- 2b. Ambiguous / likely-scrape-error:
--   - mood-shine-chicago-heights — weedmaps URL is /dispensaries/mood-shine (no city); no known "Mood Shine" chain

UPDATE public.deals
SET is_active = false,
    status_reason = 'orphaned',
    updated_at = NOW()
WHERE listing_slug IN (
        'bisa-lina-joliet',
        'cookies-chicago',
        'curaleaf-morris',
        'natures-treatment-milan',
        'perception-cannabis-chicago',
        'mood-shine-chicago-heights'
      )
  AND is_active = true;

COMMIT;

-- ============================================================
-- Verification queries — run after apply
-- ============================================================

-- Expected post-apply state (active deal set, joining the view):
--   - Active count: 56 - 7 = 49 deals
--   - Orphaned count: 7 deals (status_reason = 'orphaned')
--   - Zero orphan joins: the left-join miss count should be 0.

-- (a) Count orphans after fix
--   SELECT COUNT(DISTINCT d.listing_slug) AS orphan_slugs,
--          COUNT(*) AS orphan_deals
--   FROM public.deals d
--   LEFT JOIN public.master_listings m ON d.listing_slug = m.slug
--   WHERE d.is_active = true AND m.slug IS NULL;
--   -- Expected: 0, 0.

-- (b) Count by status
--   SELECT is_active, status_reason, COUNT(*) AS n
--   FROM public.deals
--   GROUP BY is_active, status_reason
--   ORDER BY is_active DESC, status_reason NULLS FIRST;
--   -- Expected: ~49 (true, NULL), ~7 (false, 'orphaned'), plus prior inactive rows.

-- (c) Confirm the 3 repoints landed
--   SELECT listing_slug, COUNT(*) FROM public.deals
--   WHERE listing_slug IN (
--     'altius-carol-stream',
--     'ivy-hall-dispensary',
--     'nature-treatment-galesburg'
--   ) AND is_active = true
--   GROUP BY listing_slug;
--   -- Expected: 6, 2, 3.
