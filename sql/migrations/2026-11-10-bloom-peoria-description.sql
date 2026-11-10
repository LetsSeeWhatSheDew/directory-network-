-- 2026-11-10 — Bloom Wellness Peoria shows Beyond Hello's description.
-- Matthew applies this in the Supabase SQL editor. Code does not run it.
--
-- FOUND: master_listings slug 'beyond-hello-peoria' is named "Bloom Wellness
-- Peoria" and its website points to risecannabis.com/…/bloom-wellness-peoria,
-- but short_description and long_description still describe "Beyond Hello
-- Peoria" (Jushi chain, Hello Club, Beyond Hello discounts, hours, phone).
-- The rename changed the name only.
--
-- UNVERIFIED: the store's current hours, phone, discounts and owner. The RISE
-- page returned a 5 KB shell to an automated read on Nov 10, so nothing beyond
-- the name and street address is restated here. Check the store page in a
-- browser and add details after.
--
-- This replaces both descriptions with facts already in the row (name +
-- address). Slug unchanged (URLs keep working).

-- STEP 0 — look first.
SELECT slug, name, website, address1, phone, left(short_description, 80) AS short_now, left(long_description, 80) AS long_now
FROM public.master_listings WHERE project_tag = 'green' AND slug = 'beyond-hello-peoria';

-- STEP 1 — apply.
UPDATE public.master_listings
SET short_description = 'Bloom Wellness Peoria is a cannabis dispensary on State Route 91 in northern Peoria.',
    long_description  = 'Bloom Wellness Peoria is at 7620 State Route 91, Suite A, in northern Peoria, just off War Memorial Drive. Hours, phone and current deals: check the store''s own page before you go.'
WHERE project_tag = 'green' AND slug = 'beyond-hello-peoria';
-- Also check the phone: (309) 232-8134 dates from the Beyond Hello listing (UNVERIFIED).
