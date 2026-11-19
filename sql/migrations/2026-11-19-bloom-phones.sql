-- 2026-11-19: Bloom Wellness phone numbers. NOT APPLIED. Needs one phone call.
--
-- Checked against the live master_listings table on Nov 19 (ops snapshot):
--   beyond-hello-peoria  (Bloom Wellness Peoria)       (309) 232-8134  matches RISE + Leafly. Nothing to do.
--   ayr-wellness-normal  (Bloom Wellness Normal, Bradford) (309) 571-1420  matches Leafly. Nothing to do.
--   revolution-dispensary-normal (Bloom Normal, Northbrook) (309) 260-2609 in our DB,
--     but Leafly lists (309) 210-0207. Call both; keep whichever the store answers.
--
-- Only if the call says Leafly is right:
BEGIN;
UPDATE master_listings SET phone = '(309) 210-0207'
 WHERE project_tag = 'green' AND slug = 'revolution-dispensary-normal'
   AND phone = '(309) 260-2609';
COMMIT;
