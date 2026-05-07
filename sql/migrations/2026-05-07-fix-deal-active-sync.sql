-- Phase 2 of fix/site-integrity-2026-05-07
-- Sync is_active with not_seen_last_scrape; backfill recurring_days
-- from titles for existing scraped day-named deals.

BEGIN;

-- (a) Patch mis-flagged active rows.
UPDATE deals
   SET is_active = false
 WHERE is_active = true
   AND status_reason = 'not_seen_last_scrape';

-- (b) Backfill recurring_days for existing scraped deals whose titles
-- contain a day name. We only touch deals from the scraper to avoid
-- overwriting any manually-curated rows.
WITH day_match AS (
  SELECT id,
    CASE
      WHEN title ILIKE '%sunday%'    THEN ARRAY['sunday']
      WHEN title ILIKE '%monday%'    THEN ARRAY['monday']
      WHEN title ILIKE '%tuesday%'   THEN ARRAY['tuesday']
      WHEN title ILIKE '%wednesday%' THEN ARRAY['wednesday']
      WHEN title ILIKE '%thursday%'  THEN ARRAY['thursday']
      WHEN title ILIKE '%friday%'    THEN ARRAY['friday']
      WHEN title ILIKE '%saturday%'  THEN ARRAY['saturday']
      ELSE NULL
    END AS days
  FROM deals
  WHERE recurring_days IS NULL
    AND status_reason IN ('scraped_direct_source','not_seen_last_scrape')
)
UPDATE deals d
   SET recurring_days = dm.days,
       is_recurring   = true
  FROM day_match dm
 WHERE d.id = dm.id
   AND dm.days IS NOT NULL;

-- (c) Verification queries (read-only; will appear in migration log).
DO $$
DECLARE
  bad_active INT;
  view_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_active
    FROM deals
   WHERE is_active = true
     AND status_reason = 'not_seen_last_scrape';
  IF bad_active <> 0 THEN
    RAISE EXCEPTION 'Migration failed: % rows still mis-flagged', bad_active;
  END IF;

  SELECT COUNT(*) INTO view_count FROM active_deals_with_listings;
  RAISE NOTICE 'active_deals_with_listings now returns % rows', view_count;
END $$;

COMMIT;
