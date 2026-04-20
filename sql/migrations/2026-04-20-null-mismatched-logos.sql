-- NULL out confirmed mismatched logo URLs (April 11 enrichment corruption)
-- Matthew must run this in Supabase SQL Editor manually
UPDATE master_listings
SET logo_url = NULL
WHERE slug = 'ivy-hall-waukegan'
  AND logo_url LIKE '%highhavencanna%';
