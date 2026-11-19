-- 2026-11-19: Bloom Wellness phone numbers (the three former Beyond Hello /
-- AYR / Revolution stores). FOR MATTHEW TO REVIEW AND APPLY. Not applied by Code.
-- Source: RISE directory + Leafly search snippets (docs/strategy/
-- 2026-11-19-store-ownership-and-open-items.md). Call each store to confirm
-- before applying; Peoria's number is the old Beyond Hello line.
-- Read first:
--   SELECT slug, name, phone FROM master_listings
--    WHERE project_tag = 'green'
--      AND slug IN ('beyond-hello-peoria','ayr-wellness-normal','revolution-dispensary-normal');

BEGIN;
UPDATE master_listings SET phone = '(309) 232-8134'
 WHERE project_tag = 'green' AND slug = 'beyond-hello-peoria';          -- Bloom Wellness Peoria, 7620 State Route 91 Ste A
UPDATE master_listings SET phone = '(309) 571-1420'
 WHERE project_tag = 'green' AND slug = 'ayr-wellness-normal';          -- Bloom Wellness Normal (Bradford), 1730 Bradford Ln
UPDATE master_listings SET phone = '(309) 210-0207'
 WHERE project_tag = 'green' AND slug = 'revolution-dispensary-normal'; -- Bloom Wellness Normal (Northbrook), 1609 Northbrook Dr Ste 3
COMMIT;
