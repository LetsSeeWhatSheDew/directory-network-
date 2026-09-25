-- 2026-09-25-website-fixes.sql
-- Corrects master_listings.website for Central IL stores whose website field
-- points at the wrong store, a chain root, a dead redirect, or nothing.
-- Evidence per store: docs/ops/2026-09-25-scraper-coverage.md
--
-- NOT APPLIED. Review, then run in the Supabase SQL editor.
-- Every statement is scoped to project_tag='green' + one slug (see
-- docs/architecture/db-scope-discipline.md).

BEGIN;

-- Beyond Hello Peoria (7620 State Route 91) is now Green Thumb's
-- "Bloom Wellness Peoria". beyond-hello.com/illinois-dispensaries/peoria
-- redirects to the chain index, which no longer lists a Peoria store.
UPDATE master_listings
   SET website = 'https://risecannabis.com/dispensaries/illinois/bloom-wellness-peoria/'
 WHERE project_tag = 'green' AND slug = 'beyond-hello-peoria';

-- AYR Normal (1730 Bradford Ln) is now "Bloom Wellness Normal (Bradford)".
-- bloom-wellness.com redirects to a Minnesota store; its IL store pages
-- 301 to risecannabis.com.
UPDATE master_listings
   SET website = 'https://risecannabis.com/dispensaries/illinois/bloom-wellness-normal-bradford/'
 WHERE project_tag = 'green' AND slug = 'ayr-wellness-normal';

-- Revolution Normal (1609 Northbrook Dr) is now "Bloom Wellness Normal
-- Northbrook": revcanna.com/locations/revolution-dispensary-normal/ 301s to
-- bloom-wellness.com/stores/bloom-il-normal-northbrook, which 301s to RISE.
UPDATE master_listings
   SET website = 'https://risecannabis.com/dispensaries/illinois/bloom-wellness-normal-northbrook/'
 WHERE project_tag = 'green' AND slug = 'revolution-dispensary-normal';

-- Shangri-La Springfield had no website. shangriladispensaries.com/illinois/
-- redirects to its Illinois storefront.
UPDATE master_listings
   SET website = 'https://www.shangrila-springfield.shop/'
 WHERE project_tag = 'green' AND slug = 'shangri-la-springfield';

-- The Dispensary Champaign: the website on file is The Dispensary FULTON.
-- The chain lists only Fulton and East Dubuque; thedispensarychampaign.com
-- redirects to the Fulton site, and the phone on file is Fulton's. Clear the
-- field so no scraper attributes Fulton deals to Champaign. Separately
-- confirm the Champaign store is still operating (only a Facebook page,
-- facebook.com/profile.php?id=61556213019408, was found).
UPDATE master_listings
   SET website = NULL
 WHERE project_tag = 'green' AND slug = 'the-dispensary-champaign';

-- Trinity: both stores pointed at the shared homepage. Use each store's own page.
UPDATE master_listings
   SET website = 'https://www.trinitydispensaries.com/dispensary/trinity-glen'
 WHERE project_tag = 'green' AND slug = 'trinity-on-glen';
UPDATE master_listings
   SET website = 'https://www.trinitydispensaries.com/dispensary/trinity-university'
 WHERE project_tag = 'green' AND slug = 'trinity-on-university';

-- High Profile: the chain root covers 20+ stores in 5 states. Use the
-- Springfield store page.
UPDATE master_listings
   SET website = 'https://highprofilecannabis.com/il/springfield/'
 WHERE project_tag = 'green' AND slug = 'high-profile-cannabis-springfield';

-- SHARE: http -> https (the site redirects).
UPDATE master_listings
   SET website = 'https://everyoneshares.com/'
 WHERE project_tag = 'green' AND slug = 'share-springfield';

-- OPTIONAL (business decision, not run by default): the three former
-- Beyond Hello / AYR / Revolution stores now trade as Bloom Wellness.
-- UPDATE master_listings SET name = 'Bloom Wellness Peoria'
--  WHERE project_tag = 'green' AND slug = 'beyond-hello-peoria';
-- UPDATE master_listings SET name = 'Bloom Wellness Normal (Bradford)'
--  WHERE project_tag = 'green' AND slug = 'ayr-wellness-normal';
-- UPDATE master_listings SET name = 'Bloom Wellness Normal (Northbrook)'
--  WHERE project_tag = 'green' AND slug = 'revolution-dispensary-normal';

COMMIT;

-- Verify:
-- SELECT slug, name, website FROM master_listings
--  WHERE project_tag = 'green' AND slug IN (
--    'beyond-hello-peoria','ayr-wellness-normal','revolution-dispensary-normal',
--    'shangri-la-springfield','the-dispensary-champaign','trinity-on-glen',
--    'trinity-on-university','high-profile-cannabis-springfield','share-springfield');
