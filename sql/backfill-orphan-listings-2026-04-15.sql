-- sql/backfill-orphan-listings-2026-04-15.sql
--
-- The April 15 data audit found 13 listing_slugs in `deals` that have
-- no matching row in `master_listings`. The view
-- `active_deals_with_listings` falls back to city='Illinois' for these,
-- which is why:
--   * 54 / 100 active deals display city = "Illinois"
--   * A Chicago user filtering /deals/all?city=Chicago sees 0 results
--     even though cookies-chicago and perception-cannabis-chicago
--     have active deals
--   * Ivy Hall Peoria deals don't match city=Peoria
--
-- This script inserts minimal rows for the missing dispensaries.
-- Names and cities are derived from the slug pattern — Matthew
-- should review/correct the `name` column post-insert (the slug→name
-- heuristic isn't perfect: "hi5-dispensary-crestwood" becomes
-- "Hi5 Dispensary Crestwood" which is fine, but fancier brand names
-- with mixed casing need manual touchup).
--
-- Safe to re-run — uses ON CONFLICT DO NOTHING keyed on slug.

BEGIN;

INSERT INTO master_listings
  (slug, name, city, state, project_tag, type, claimed)
VALUES
  ('altius-dispensary-carol-stream', 'Altius Dispensary Carol Stream', 'Carol Stream', 'IL', 'green', 'Dispensary', false),
  ('bisa-lina-carol-stream',         'Bisa Lina Carol Stream',          'Carol Stream', 'IL', 'green', 'Dispensary', false),
  ('bisa-lina-joliet',               'Bisa Lina Joliet',                'Joliet',       'IL', 'green', 'Dispensary', false),
  ('cookies-chicago',                'Cookies Chicago',                 'Chicago',      'IL', 'green', 'Dispensary', false),
  ('curaleaf-morris',                'Curaleaf Morris',                 'Morris',       'IL', 'green', 'Dispensary', false),
  ('hi5-dispensary-crestwood',       'Hi5 Dispensary Crestwood',        'Crestwood',    'IL', 'green', 'Dispensary', false),
  ('ivy-hall-peoria',                'Ivy Hall Peoria',                 'Peoria',       'IL', 'green', 'Dispensary', false),
  ('mood-shine-chicago-heights',     'Mood Shine Chicago Heights',      'Chicago Heights','IL','green', 'Dispensary', false),
  ('natures-treatment-galesburg',    'Nature''s Treatment Galesburg',   'Galesburg',    'IL', 'green', 'Dispensary', false),
  ('natures-treatment-milan',        'Nature''s Treatment Milan',       'Milan',        'IL', 'green', 'Dispensary', false),
  ('perception-cannabis-chicago',    'Perception Cannabis Chicago',     'Chicago',      'IL', 'green', 'Dispensary', false),
  ('prairie-cannabis-naperville',    'Prairie Cannabis Naperville',     'Naperville',   'IL', 'green', 'Dispensary', false),
  ('star-buds-westmont',             'Star Buds Westmont',              'Westmont',     'IL', 'green', 'Dispensary', false)
ON CONFLICT (slug) DO NOTHING;

-- Verification: expected 0 orphans after this runs
SELECT DISTINCT d.listing_slug
FROM deals d
LEFT JOIN master_listings m ON m.slug = d.listing_slug
WHERE d.is_active = true
  AND d.project_tag = 'green'
  AND m.slug IS NULL;

COMMIT;
