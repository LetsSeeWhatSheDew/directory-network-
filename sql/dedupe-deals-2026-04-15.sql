-- sql/dedupe-deals-2026-04-15.sql
-- Deactivate duplicate active deals — keep only the newest row for each
-- (listing_slug, title, project_tag) combination.
--
-- An anon-key audit on April 15, 2026 found 44 duplicate groups across
-- 100 active green deals. Most dispensaries had their Wave 1 seed rows
-- re-inserted when the 4/20 seed pass ran, producing pairs with the
-- exact same slug + title.
--
-- Run this in the Supabase SQL editor (matthew@jacarandapeoria.com has
-- the appropriate service-role access). Safe to re-run — it's a no-op
-- after the first successful execution.
--
-- Expected effect on production:
--   UPDATE 44 rows
--   SELECT count(*) FROM deals WHERE is_active = true  → 56

BEGIN;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY listing_slug, title, project_tag
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM deals
  WHERE is_active = true
    AND project_tag = 'green'
)
UPDATE deals
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Quick verification — should return 0 after dedup
SELECT
  listing_slug,
  title,
  COUNT(*) AS dupes
FROM deals
WHERE is_active = true
  AND project_tag = 'green'
GROUP BY listing_slug, title
HAVING COUNT(*) > 1;

COMMIT;
