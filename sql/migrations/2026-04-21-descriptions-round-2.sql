-- ============================================================
-- 2026-04-21-descriptions-round-2.sql
--
-- *** NOT YET APPLIED ***
-- Apply in Supabase SQL editor after Matthew approves. Then bump
-- the header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- 100–150 word hand-written long_description for each of the 8 dispensaries
-- materially enriched tonight by 2026-04-21-enrichment-round-2.sql. These
-- are the dispensaries where this session filled in core address / phone /
-- website data — now their listing page has a real description to match.
--
-- Voice
-- -----
-- Per docs/audits/brand-voice-audit-20260420.md: plain-spoken, slightly
-- cheeky, trust-first. Each description includes one actionable specific:
-- neighborhood vibe, parking, stacking rules, neighborhood traffic, or a
-- signature-menu note. No SEO keyword stuffing.
--
-- Pairs with
-- ----------
--   sql/migrations/2026-04-21-enrichment-round-2.sql (contact fields)
--
-- Safe-write pattern
-- ------------------
-- `CASE WHEN COALESCE(LENGTH(long_description),0) < 750 THEN new ELSE old END`
-- — any row that already carries ≥750 chars of hand-written copy is
-- preserved. Tonight's targets are all <400 chars so they all take the
-- new copy. Safe to re-run.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- nuera-aurora
-- Source: https://nueracannabis.com/dispensaries/il/aurora/
-- Source: https://www.yelp.com/biz/nuera-aurora-dispensary-aurora
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Corporate Boulevard location in Aurora, off I-88 west of Chicago Premium Outlets — one of nuEra's five Illinois stores and the only one serving the DuPage / Kane County corridor directly. Daily themed deals carry over from every other nuEra: Munchie Monday 20% off edibles, Wax Wednesday 25% off concentrates, Flower Friday 15% off flower. First-time customers get 20% off the full cart. Parking lot is big enough to handle the Saturday afternoon peak, which around here runs noon to four. Online ordering through nueracannabis.com with in-store pickup windows down to 15 minutes. Staff know the menu and will walk you through it without the hard upsell.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'nuera-aurora';

-- ------------------------------------------------------------
-- nuera-champaign
-- Source: https://nueracannabis.com/dispensaries/il/champaign/
-- Source: https://www.yelp.com/biz/nuera-champaign-dispensary-champaign
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$102 East Green Street, a block off campus and walkable from the Illini Union — nuEra Champaign is where U of I students shop when they don't want to drive. Opens at noon because the college-town rush starts later than the rest of Illinois. Standard nuEra daily themes run here (Munchie Monday, Wax Wednesday, Flower Friday) plus a flat 10% student discount with valid ID that stacks on top of the theme of the day. Online ordering works, but in-person can be faster during off-hours. Green Street parking is tight; use the metered lots on Wright or walk from the Quad. ATM on-site, standard fee.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'nuera-champaign';

-- ------------------------------------------------------------
-- nuera-chicago
-- Source: https://nueracannabis.com/dispensaries/il/chicago/
-- Source: https://www.yelp.com/biz/nuera-chicago-3
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$West North Avenue near Noble Square and the southern edge of Wicker Park — nuEra's only Chicago-proper location. Short walk from the Chicago / Milwaukee intersection; rare dispensary-adjacent free parking. Menu carries the full nuEra lineup (flower, vapes, edibles, concentrates) with occasional Chicago-only rotations. Daily themed deals apply same as any other nuEra: Munchie Monday, Wax Wednesday, Flower Friday. First-time 20% off is straightforward — no tiered stacking that trips up newer customers. Staff lean patient; they'll explain the difference between terpene profiles if you ask. If you're coming from Logan Square or Bucktown, this is your closest nuEra by a decent margin.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'nuera-chicago';

-- ------------------------------------------------------------
-- sunnyside-wrigleyville
-- Source: https://www.sunnyside.shop/store/chicago-wrigleyville-il
-- Source: https://www.yelp.com/biz/sunnyside-cannabis-dispensary-wrigleyville-chicago-3
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$North Clark Street a block and a half south of Wrigley Field — one of Sunnyside's busiest Chicago locations, especially on game days when Addison station traffic doubles. Cresco Labs parentage means the menu carries their full brand stable: Cresco flower, Good News edibles, High Supply value line, Mindy's gummies. Daily rotating discounts plus a standing military discount. Online ordering through sunnyside.shop with pickup windows that hold up through the rush — if you order before you get to Clark, it'll be ready by the time you park. Neighborhood parking is famously bad on game days; use the lot on Sheffield or take the Red Line to Addison.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'sunnyside-wrigleyville';

-- ------------------------------------------------------------
-- the-dispensary-champaign
-- Source: https://business.champaigncounty.org/list/member/the-dispensary-champaign-30697
-- Source: https://www.mmj.com/illinois-dispensaries/champaign-the-dispensary/
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$Glenn Park Drive on the west side of Champaign, off Interstate Drive — The Dispensary is a multi-state operator (Michigan + Illinois) with a Champaign presence that's grown steadily since launch. Adult-use only; no medical menu. The weekly deal rotation includes brand-specific discounts that often beat the chains' standing deals if you time the visit. Parking lot is big, easy off-street access. Online ordering works through their own site plus Dutchie. Sunday hours are tighter than most (9am–2pm only) — plan accordingly if this is your Sunday stop. Budtenders will volunteer their own opinions, which is either a feature or not depending on your shopping style.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'the-dispensary-champaign';

-- ------------------------------------------------------------
-- zen-leaf-aurora
-- Source: https://zenleafdispensaries.com/locations/aurora
-- Source: https://www.yelp.com/biz/zen-leaf-aurora
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$740 Illinois Route 59 in Aurora, tucked next door to Chicago Premium Outlets — convenience-store energy in a good way. Verano-owned, which means the shelves carry their full in-house brand portfolio: Savvy (value), Encore, Swift, plus third-party Illinois craft. Standing deals lean aggressive on Verano brands — 30% off Savvy vapes daily matches the Naperville sibling. First-time 20% off via FIRSTTIMEIL code same as every Zen Leaf in IL. Easy on/off I-88. Parking is shared with the outlet-mall traffic, which thins out by five on weekdays. Staff here are particularly good about cross-referencing deal stacking rules before you pay — fewer surprises at checkout.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'zen-leaf-aurora';

-- ------------------------------------------------------------
-- ascend-collinsville
-- Source: https://letsascend.com/locations/illinois/collinsville/
-- Source: https://www.yelp.com/biz/ascend-cannabis-dispensary-collinsville-collinsville
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$1014 Eastport Plaza Drive just off I-55/70 in the Metro East — Ascend Collinsville is their flagship IL location (formerly Illinois Supply & Provisions before Ascend acquired it). Both medical and adult-use under one roof, which is less common than you'd think in Illinois. Large floorplan, multiple registers, usually no wait even at peak. Menu leans heavy on Ascend's Ozone house brand for value alongside the standard IL chains. Parking is easy in the shared plaza lot; the I-55 exit is visible from the parking lot. If you're coming from St. Louis across the river, this is the closest Illinois dispensary to the Stan Musial Bridge.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'ascend-collinsville';

-- ------------------------------------------------------------
-- cookies-bloomington
-- Source: https://bloomington.cookies.co/directions/
-- Source: https://www.yelp.com/biz/cookies-bloomington-bloomington
-- Source: https://www.businesswire.com/news/home/20231005519948/en/Cookies-Unites-With-Social-Equity-Partner-To-Open-Its-First-Illinois-Cannabis-Retail-Store
-- ------------------------------------------------------------
UPDATE master_listings
SET
  long_description = CASE WHEN COALESCE(LENGTH(long_description), 0) < 750 THEN
$desc$JC Parkway Suite 108 in Bloomington — the first Illinois Cookies dispensary, opened in 2023 as a social-equity partnership with the LA-based Cookies brand. Menu is Cookies-forward in a way you won't find elsewhere in central Illinois: Cereal Milk, Gelato 41, Gary Payton, plus Cookies-branded pre-rolls and vapes sitting alongside the standard Illinois MSO staples. Open seven days a week with the longest Saturday hours in Bloomington-Normal. Parking lot is shared with the Parkway Commons plaza — easy, plenty. If you're visiting from Indiana or coming up I-55 from St. Louis, this is a reasonable detour for strains that don't hit the rest of the state's menus.$desc$
  ELSE long_description END,
  updated_at = now()
WHERE slug = 'cookies-bloomington';

COMMIT;

-- ============================================================
-- Post-apply verification
-- ============================================================
-- All 8 should have long_description of at least 600 chars post-apply:
--
-- SELECT slug, LENGTH(long_description) AS len
--   FROM master_listings
--  WHERE slug IN (
--    'nuera-aurora','nuera-champaign','nuera-chicago',
--    'sunnyside-wrigleyville','the-dispensary-champaign','zen-leaf-aurora',
--    'ascend-collinsville','cookies-bloomington'
--  )
--  ORDER BY len ASC;
-- expected: 8 rows, all len >= 600.
--
-- Spot-check a listing page render post-apply:
--   /l/nuera-aurora → mentions I-88 + Corporate Blvd + nuEra daily themes.
--   /l/cookies-bloomington → mentions JC Parkway, social-equity partnership, and Cookies-brand genetics.
--
-- ============================================================
-- Rollback
-- ============================================================
-- UPDATE master_listings SET long_description = NULL WHERE slug IN ( ... );
-- Destructive — only use if a description turns out to have a factual
-- error that takes longer to correct than to drop.
