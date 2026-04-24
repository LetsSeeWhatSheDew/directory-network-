-- sql/migrations/2026-04-25-central-il-orphan-cleanup.sql
-- Apply Cowork's Central IL orphan review
-- (docs/central-il-orphan-review-20260425.md).
--
-- Of the 5 Central IL rows in IN_DB_NOT_IN_STATE, only ONE needs to come
-- off the public surface tonight:
--
--   north-star-remedies-peoria-il
--     - DB id: green-004 (manually-seeded "green-0XX" series)
--     - address1/phone/website: all NULL
--     - Zero web footprint, no IDFPR license entry, no operator homepage,
--       no Leafly/Weedmaps/Yelp coverage.
--     - Cowork classified as DATA_NOISE (aspirational seed, pre-scraper).
--     - Also consistent with our Places backfill tonight — Places
--       repeatedly matched this listing to DIFFERENT Peoria dispensaries
--       (Aroma Hill, nuEra East Peoria, Trinity Cannabis on separate
--       calls), reinforcing that Places doesn't recognize the name at
--       all.
--
-- The other 4 Central IL orphans (consume-cannabis-champaign,
-- beyond-hello-peoria, ascend-cannabis-downtown-springfield,
-- ascend-cannabis-horizon-drive) are PARSER_MISS cases — real operating
-- dispensaries the IDFPR PDF parser dropped or mis-sectioned. They stay
-- is_active=true.
--
-- Applied: 2026-04-25 via REST (Supabase MCP read-only). Reversible by
-- `UPDATE master_listings SET is_active = true WHERE slug = '...'`.

BEGIN;

-- north-star-remedies-peoria-il — DATA_NOISE (aspirational seed, no evidence).
-- See docs/central-il-orphan-review-20260425.md row 3 for full rationale.
UPDATE master_listings
   SET is_active  = false,
       updated_at = now()
 WHERE slug = 'north-star-remedies-peoria-il'
   AND project_tag = 'green';

COMMIT;
