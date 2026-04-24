-- sql/migrations/2026-04-25-central-il-license-registry-sync.sql
-- Central Illinois subset of the 2026-04-23 IL license registry sync.
--
-- Source: IDFPR Active Adult Use Dispensing Organization Licenses (PDF),
-- via scripts/il-license-registry-audit.ts. Full 148-row file at
-- sql/migrations/2026-04-23-il-license-registry-sync.sql is DEFERRED —
-- only the 6 Central IL rows below are applied tonight per the Central
-- IL scope lock (docs/central-illinois-scope.md).
--
-- Selection
--   Filtered the parent migration by city ∈ CENTRAL_IL_CITIES plus the
--   newly-added "Peoria Heights" (lib/constants/regions.ts). "Morton
--   Grove" was explicitly excluded — it is a Chicago suburb, not the
--   Central IL "Morton".
--
-- Collision check
--   SELECT slug FROM master_listings WHERE slug IN
--     ('sunnyside-champaign','cloud-9-east-peoria','nuera-pekin',
--      'cookies-peoria-heights','aroma-hill-peoria','share-springfield');
--   → 0 rows (verified 2026-04-25 against prod).
--
-- Applied: 2026-04-25 via Supabase MCP (this run).
--
-- Post-apply
--   npx tsx scripts/backfill-logos-from-google-places.ts --live
--   (defaults to Central IL; picks up the new rows and enriches them
--    with phone/website/coords/logo/hours.)

BEGIN;

INSERT INTO master_listings (
  id, project_tag, type, name, slug, address1, city, state, postal_code, country,
  license_number, license_state, is_active, created_at, updated_at
) VALUES
  (gen_random_uuid()::text, 'green', 'dispensary', 'Sunnyside', 'sunnyside-champaign', '1704 S Neil St. C', 'Champaign', 'IL', '61820', 'US', '284.000006-AUDO', 'IL', true, now(), now()),
  (gen_random_uuid()::text, 'green', 'dispensary', 'Cloud 9 East Peoria', 'cloud-9-east-peoria', '406 W Camp St', 'East Peoria', 'IL', '61611', 'US', '284.000303-AUDO', 'IL', true, now(), now()),
  (gen_random_uuid()::text, 'green', 'dispensary', 'NuEra', 'nuera-pekin', '3249 Court St', 'Pekin', 'IL', '61554', 'US', '284.000116-AUDO', 'IL', true, now(), now()),
  (gen_random_uuid()::text, 'green', 'dispensary', 'Cookies Peoria Heights', 'cookies-peoria-heights', '1209 E War Memorial Dr', 'Peoria Heights', 'IL', '61616', 'US', '284.000319-AUDO', 'IL', true, now(), now()),
  (gen_random_uuid()::text, 'green', 'dispensary', 'Aroma Hill Peoria', 'aroma-hill-peoria', '1210 W Glen Ave', 'Peoria', 'IL', '61614', 'US', '284.000265-AUDO', 'IL', true, now(), now()),
  (gen_random_uuid()::text, 'green', 'dispensary', 'SHARE', 'share-springfield', '3600 S. 06th St.', 'Springfield', 'IL', '62703', 'US', '284.000346-AUDO', 'IL', true, now(), now());

COMMIT;
