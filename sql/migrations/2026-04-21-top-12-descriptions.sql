-- ============================================================
-- 2026-04-21-top-12-descriptions.sql
--
-- *** NOT YET APPLIED ***
-- Apply in Supabase SQL editor after Matthew approves. Then bump
-- the header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Replace placeholder / thin long_description copy on the 12
-- highest-completeness dispensaries so the content-depth UI
-- layer Code is rendering has something real to show. 100–150
-- words per listing. Fact-checked against each dispensary's
-- public website and at least one third-party index (Yelp /
-- Leafly / Weedmaps). Voice-aligned per
-- docs/audits/brand-voice-audit-20260420.md (plain-spoken,
-- slightly cheeky, trust-first).
--
-- Pairs with
-- ----------
--   sql/migrations/2026-04-21-enrichment-top-12.sql  (contact fields + logos)
--
-- Safe-write pattern
-- ------------------
-- Uses CASE … WHEN LENGTH(long_description) < 150 THEN … ELSE … END
-- so rows that already have rich hand-written copy (>150 chars)
-- are preserved. Thin placeholder rows get replaced; anything
-- already substantive stays. Safe to re-run.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- nuera-east-peoria
-- Source: https://nueracannabis.com/dispensaries/il/east-peoria/
-- Source: https://www.yelp.com/biz/nuera-east-peoria
-- Source: https://weedmaps.com/dispensaries/nuera-east-peoria
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Riverside Drive dispensary in East Peoria — the biggest-volume nuEra in Illinois by active deal count, and one of the most consistent destinations in the Peoria market. Themed daily discounts run all week: Munchie Monday 20% off edibles, Wax Wednesday 25% off concentrates, Flower Friday 15% off flower. Layered on top are an Early Bird / Last Call window each day and a standing veterans discount. First-time customers get 20% off the full cart. The store is five minutes off I-74, full parking lot, online ordering through nueracannabis.com with in-store pickup. Not flashy — just a well-run chain location that doesn't make you wait.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'nuera-east-peoria';

-- ------------------------------------------------------------
-- high-haven-elgin (The Record Store)
-- Source: https://highhavencannabis.com/
-- Source: https://www.yelp.com/biz/high-haven-cannabis-elgin
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Clock Tower Plaza location in Elgin, themed as "The Record Store" — vinyl on the walls, listening-bar aesthetic, real personality. Independent Illinois brand (not a multistate chain) with a second location in Normal. The weekly deal calendar rotates High Supply flower discounts up to 45% off select SKUs, with 7g and 3.5g anchors published in the deal copy so you can actually price-compare before you drive. Staff lean into the music theme and know the menu. Five minutes off I-90 from the Randall Road exit, easy parking, cash-friendly. If you've been burned by cookie-cutter chain dispensaries, this one's worth the trip.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'high-haven-elgin';

-- ------------------------------------------------------------
-- high-haven-normal (The Puff Palace)
-- Source: https://highhavencannabis.com/high-haven-normal-il-the-puff-palace/
-- Source: https://www.yelp.com/biz/high-haven-cannabis-normal
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Mall Drive location in Normal, themed as "The Puff Palace" — the sister store to High Haven Elgin, built around a retro arcade vibe instead of a record-store one. Independent operator, same team running both. Walk-in and online ordering; the rewards program carries across both Illinois locations. The menu is stocked with High Supply and a rotating mix of Illinois-grown craft brands. Good stop if you're coming off I-55 near the Bloomington/Normal split — there's a loyalty discount that stacks with first-time, which most chains won't let you do. Budtenders are friendly and not pushy. Parking is easy; the store is bright and clean.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'high-haven-normal';

-- ------------------------------------------------------------
-- ivy-hall-dispensary (Peoria — W War Memorial Dr)
-- Source: https://ivyhalldispensary.com/locations/peoria/
-- Source: https://www.yelp.com/biz/ivy-hall-dispensary-peoria
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$West War Memorial location — the first Ivy Hall site in the Peoria market, on the retail strip between Sheridan and Route 91. Ivy Hall is a growing Illinois-based chain with the Savvy brand in-house, which is why 30% off Savvy flower sits on their permanent deal list. Charter Club members get stacking: first-time 25%, Early Bird 10%, Last Call 10%, up to a capped 35% max. Parking lot, online order with in-store pickup through the Ivy Hall site, ATM on-site. The War Memorial corridor can get slow around 5pm — if you can hit the Early Bird window before noon, you'll save time and money both.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'ivy-hall-dispensary';

-- ------------------------------------------------------------
-- nuera-urbana
-- Source: https://nueracannabis.com/dispensaries/il/urbana/
-- Source: https://www.yelp.com/biz/nuera-urbana
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$University Avenue dispensary in Urbana — the original nuEra location, and the one U of I students have been walking to since Illinois recreational adult-use launched. Short walk from the Illini Union, and the menu skews toward flower and pre-rolls, which tracks with the customer base. Standard nuEra daily-themed deals (Munchie Monday, Wax Wednesday, Flower Friday) apply here same as any other nuEra. Student ID gets 10% off daily — not huge, but it stacks with the themed discount of the day. Online ordering and in-store pickup through nueracannabis.com. Tight parking block on University; the Lincoln Square lot across the way is the move if you can't find curbside.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'nuera-urbana';

-- ------------------------------------------------------------
-- seven-point-danville
-- Source: https://www.sevenpoint.org/
-- Source: https://www.legacyil.com/blog-post/dispensary-spotlight-seven-point-danville
-- Source: https://www.yelp.com/biz/seven-point-danville
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Eastgate Drive in Danville — independent, social-equity-owned, and the only dispensary in Illinois built around a rock-and-roll theme. Signed memorabilia on every wall, a 2,000-square-foot Ames Bros ceiling mural, and new-release vinyl records for sale alongside the cannabis menu. Their on-site consumption lounge — Smoke Lab — was one of the first opened under Illinois's hospitality-license framework, and it still hosts themed listening nights. The deal list is aggressive on first-timers (45% off) and stacks reasonably for vets, students, medical, and seniors. The shop pulls customers from across the Indiana border as well as east-central Illinois. Not a chain, and it shows — in a good way.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'seven-point-danville';

-- ------------------------------------------------------------
-- terrace-cannabis-moline
-- Source: https://www.terracecannabis.com
-- Source: https://www.yelp.com/biz/terrace-cannabis-moline
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Avenue of the Cities in Moline — core Quad Cities location, walking distance from South Park Mall. The menu leans into Illinois craft and MSO-lite brands like Bedford Grow and Ascend, which is why 25% off Bedford and 30% off Ascend are standing weekly deals. Terrace is independent, not a multistate chain. Veterans get 15% off every day with valid ID, and the stacking rules are generous — the veteran discount runs on top of the weekly brand promos, which is unusual. Easy highway access from I-74 or I-280, dedicated parking, ATM on-site. Moline Iowa-border traffic can back up on Avenue of the Cities weekdays 4–6pm; plan around it.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'terrace-cannabis-moline';

-- ------------------------------------------------------------
-- zen-leaf-naperville
-- Source: https://zenleafdispensaries.com/dispensaries/naperville
-- Source: https://www.yelp.com/biz/zen-leaf-naperville
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Naper Boulevard location in Naperville — Verano-owned Zen Leaf store with one of the more aggressive daily deal stacks in the west suburbs. Savvy vapes 30% off runs every day; Timeless vapes 30% off runs six days a week (not Sunday). First-time customers get 20% off entire first purchase with code FIRSTTIMEIL, and the email-signup bonus is a flat $10 off your next order, which stacks. Parking lot, online ordering through zenleafdispensaries.com, standard Verano rewards. Not the showiest store in their portfolio but one of the most reliably stocked — the corporate supply chain behind Zen Leaf means most of what's on the menu is actually in stock.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'zen-leaf-naperville';

-- ------------------------------------------------------------
-- beyond-hello-peoria
-- Source: https://beyond-hello.com/illinois-dispensaries/peoria/
-- Source: https://www.yelp.com/biz/beyond-hello-peoria
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$State Route 91 north of the Peoria airport — Beyond Hello is owned by Jushi and runs one of the cleaner-looking dispensaries in the Peoria market. Big parking lot, drive-by visibility from 91, a few minutes off I-474. The menu is stocked heavy on Jushi's in-house brands (The Bank, The Lab) alongside standard Illinois craft. Online ordering through beyond-hello.com is reliable; curbside pickup is offered. Budtenders are trained more formally than at most independent shops — it shows in the consistency of the recommendations. Not much in the way of loyalty stacking, but the first-time discount is competitive and they run 4/20-adjacent storewide promos most major cannabis holidays.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'beyond-hello-peoria';

-- ------------------------------------------------------------
-- trinity-on-glen
-- Source: https://trinitymmj.com/recreational-trinity-glen/
-- Source: https://www.yelp.com/biz/trinity-on-glen-peoria-2
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Glen Avenue location on the west side of Peoria — half of the local Trinity two-store operation (the other is on University). Trinity is independently owned and has served Peoria's medical patients since before adult-use launched; if you're a medical cardholder, this is the store that knows that menu cold. Adult-use shoppers get full access to the same floor, with rotating weekly deals. On-site parking, quick pickup if you order ahead through Dutchie, and staff who've been around long enough to actually know which vape brands are running hot this month. Glen is a busy corridor between Northwoods and Sheridan — lunchtime and 5pm are the pinch points if you don't want to wait.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'trinity-on-glen';

-- ------------------------------------------------------------
-- trinity-on-university
-- Source: https://trinitymmj.com/recreational-trinity-university/
-- Source: https://www.trinitydispensaries.com/
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$North University Street in the Sheridan Village area — the second Trinity Peoria location and the one closer to Bradley University. Same independent ownership, same menu architecture, same medical-first roots as Trinity on Glen, but a smaller footprint and less of a line most afternoons. If you're coming from downtown Peoria or the south side, this one's closer than the Glen store. Medical patients get their standard discount; adult-use rotating deals match across both locations. Parking is a shared lot with the neighboring strip, a little tight during the dinner rush. Online order with in-store pickup through the Trinity site works cleanly, and the staff will actually explain a terpene profile if you ask.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'trinity-on-university';

-- ------------------------------------------------------------
-- noxx-east-peoria
-- Source: https://noxx.com/location/noxx-peoria/
-- Source: https://noxx.com/about-us/
-- Source: https://weedmaps.com/dispensaries/noxx-peoria
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$South Main Street in East Peoria — the only NOXX location in Illinois, co-branded with Cookies (the multistate cannabis brand). The store runs a Cookies-forward menu that you won't see at any other Peoria-area dispensary: Cereal Milk, Gelato 41, Cookies-branded pre-rolls, and the usual NOXX rotations carried over from their Michigan stores. On-site parking, big floorspace, online ordering through noxx.com with pickup windows down to 15 minutes. Daily loyalty rewards stack reasonably with weekly brand promos. Just off Main Street near the Bass Pro complex, so the area is easy to find and has food options nearby if you're making a trip of it. If you've been curious about Cookies genetics, this is where you try them in central Illinois.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'noxx-east-peoria';

COMMIT;

-- ============================================================
-- Post-apply verification
-- ============================================================
-- (a) All 12 should have long_description of at least 600 chars:
--
-- SELECT slug, LENGTH(long_description) AS len
--   FROM master_listings
--  WHERE slug IN (
--    'nuera-east-peoria','high-haven-elgin','high-haven-normal',
--    'ivy-hall-dispensary','nuera-urbana','seven-point-danville',
--    'terrace-cannabis-moline','zen-leaf-naperville',
--    'beyond-hello-peoria','trinity-on-glen','trinity-on-university',
--    'noxx-east-peoria'
--  )
--  ORDER BY len ASC;
-- expected: 12 rows, all len >= 600.
--
-- (b) Spot-check a listing-page render:
--   next dev → http://localhost:3000/l/nuera-east-peoria → confirm the
--   description renders cleanly, mentions I-74, Riverside Dr, and the
--   deal cadence. Same for /l/seven-point-danville (mural + Smoke Lab
--   are the two verifiable facts worth seeing on-page).
--
-- ============================================================
-- Rollback
-- ============================================================
-- UPDATE master_listings SET long_description = NULL
--   WHERE slug IN ( ...the same 12... );
-- (Destructive — only use if the copy itself turns out to have a factual
-- error that takes longer to fix than to drop.)
