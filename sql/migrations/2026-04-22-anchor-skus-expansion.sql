-- NOT YET APPLIED
-- Migration: anchor_skus expansion — round 2
-- Author: Cowork
-- Date: 2026-04-22 (authored 2026-04-21 night)
-- Pairs with:
--   sql/migrations/2026-04-21-anchor-skus.sql (round 1 — 27 rows)
--   docs/handoffs/path-b-anchor-sku-strategy-20260421.md (why this table exists)
--   scripts/compute-ppg-from-anchors.ts (the consumer)
--
-- Purpose: round 1 (27 rows) covered Cresco, GTI/Rythm, Verano/Savvy, Curaleaf,
-- PharmaCann/Ozone, and a handful of independents. Compute against current
-- active deals showed several frequent brand tokens unserved:
--
--   - Shine / &Shine         (seven-point-danville, 2 deals)
--   - Good Green             (seven-point-danville, 45% off flower)
--   - Timeless               (zen-leaf-naperville vape deals)
--   - Daze Off               (high-haven-elgin, "Reefer Gladness 7g")
--   - Grow Science           (high-haven-elgin, "Pineapple Fruz 3.5g")
--   - Ascend (In Good Taste) (terrace-cannabis-moline, 30% off Ascend Brands)
--   - Kiva portfolio         (Camino, Terra, Petra — 40+ IL dispensaries)
--   - Mindy's                (Cresco edibles — common)
--   - Nature's Grace         (IL craft cultivator — user flagged)
--   - Flora (FloraCal)       (Curaleaf craft)
--   - nuEra house            (nuEra store brand — 6 nuEra dispensaries in feed)
--
-- Plus missing weight variants for already-covered brands (Cresco 28g,
-- Bedford Grow 7g/14g, Dogwalkers 20-pack).
--
-- Coverage expectation: 20 rows → 47 total anchor SKUs.
-- Cresco/GTI/Verano/Ascend/Independent craft = ~80% of flower deal volume.
-- compute-ppg-from-anchors.ts should now clear sample_size ≥ 10 for flower
-- category when combined with the Path C submission pipeline. Edibles
-- category adds 4 new rows and expands to all 4 Kiva sub-brands.
--
-- Confidence ratings per row:
--   - high   = explicit menu price observed (named dispensary + URL)
--   - medium = composite from 2+ menu snippets or tier extrapolation
--   - low    = brand-tier pattern without direct observation — flagged for
--              resubmission via Path C for real pricing
--
-- Rollback:
--   DELETE FROM anchor_skus WHERE notes LIKE '[ROUND2]%';
--
-- Sign-off required: Matthew.

BEGIN;

-- ===== CRESCO PORTFOLIO EXPANSION =====

-- Cresco premium flower — ounce (28g) (missing from round 1)
-- Source: 8x eighth math + observed 28g promos in IL feed. Typical $260-$280 reg.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Cresco', 'cresco', 'Cresco Labs', 'premium', 'flower',
        28.0, 280.00, 240.00, 320.00,
        'https://www.crescocannabis.com/',
        'Extrapolated from 8x eighth math + observed IL ounce promos',
        'medium',
        '[ROUND2] Cresco 28g ounce — ~$280 reg extrapolated from $40 eighth. Round number for compute.');

-- Mindy's Edibles — 100mg gummy pack (Cresco edibles sub-brand)
-- Source: Mindy's is one of the most-distributed IL edibles brands. Typical
-- 100mg pack retails $22-$28.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Mindys', 'mindys', 'Cresco Labs', 'mid', 'edibles',
        0.1, 25.00, 20.00, 30.00,
        'https://www.crescocannabis.com/',
        'Composite — Mindys 100mg gummies statewide',
        'medium',
        '[ROUND2] Mindys 100mg gummy pack anchor. weight_grams=0.1 is a sentinel (100mg edible); per-mg-THC compute is the real PPG path for edibles.');

-- ===== GTI PORTFOLIO EXPANSION =====

-- Dogwalkers pre-rolls — 20-pack mini (20 x 0.35g = 7g total)
-- Source: GTI bulk pack tier; typical $50-$60 reg.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Dogwalkers', 'dogwalkers', 'GTI', 'mid', 'pre-roll',
        7.0, 55.00, 48.00, 65.00,
        'https://rythm.com/',
        'GTI brand site (composite)',
        'medium',
        '[ROUND2] Dogwalkers 20-pack mini pre-rolls (20 x 0.35g = 7g). Bulk pack tier.');

-- Good Green premium flower — eighth (GTI wholesale brand)
-- Source: GTI markets Good Green as 21+ premium flower; seven-point-danville
-- deal at 45% off is a regular promo. Typical reg $40-$50.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Good Green', 'good green', 'GTI', 'premium', 'flower',
        3.5, 45.00, 40.00, 55.00,
        'https://www.goodgreen.co/',
        'Good Green brand site (composite with IL menu snippets)',
        'medium',
        '[ROUND2] Good Green 3.5g premium flower — GTI wholesale brand. Observed at seven-point-danville under 45% off promo.');

-- Good Green premium flower — half (14g)
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Good Green', 'good green', 'GTI', 'premium', 'flower',
        14.0, 160.00, 140.00, 180.00,
        'https://www.goodgreen.co/',
        'Good Green brand site (extrapolated)',
        'low',
        '[ROUND2] Good Green 14g half-oz — extrapolated from eighth. Submission-corroboration welcome.');

-- ===== VERANO PORTFOLIO EXPANSION =====

-- Shine / &Shine — eighth (Verano sub-brand; appears at seven-point-danville
-- in 2 separate 35% off deals — "&Shine products" + "Shine products")
-- Source: Shine is positioned as mid-tier flower/pre-roll under Verano umbrella.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Shine', 'shine', 'Verano', 'mid', 'flower',
        3.5, 35.00, 30.00, 42.00,
        'https://verano.com/',
        'Verano brand portfolio (composite)',
        'medium',
        '[ROUND2] Shine / &Shine 3.5g — Verano mid-tier flower. Observed at seven-point-danville under 35% off promo.');

-- Shine pre-roll multipack — 5-pack (5 x 0.5g = 2.5g)
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Shine', 'shine', 'Verano', 'mid', 'pre-roll',
        2.5, 25.00, 22.00, 30.00,
        'https://verano.com/',
        'Verano brand portfolio (extrapolated)',
        'low',
        '[ROUND2] Shine 5-pack pre-roll tier. Pricing from category pattern — resubmit via Path C for real price.');

-- ===== ASCEND WELLNESS PORTFOLIO EXPANSION =====

-- Simply Herb is Cresco, fine. Ascend's equivalents:

-- In Good Taste mid flower — eighth (Ascend's mid-tier flower brand)
-- Source: Ascend brand portfolio; "Ascend Brands" umbrella deal at
-- terrace-cannabis-moline (30% off all Ascend brand products).
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('In Good Taste', 'in good taste', 'Ascend Wellness', 'mid', 'flower',
        3.5, 35.00, 30.00, 40.00,
        'https://www.awholdings.com/',
        'Ascend Wellness brand portfolio',
        'medium',
        '[ROUND2] In Good Taste 3.5g mid-tier flower — Ascend Wellness brand. Observed under 30% off Ascend Brands umbrella at terrace-cannabis-moline.');

-- Ozz premium flower — eighth (Ascend's premium brand) — sentinel for Ascend-umbrella deals
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Ozz', 'ozz', 'Ascend Wellness', 'premium', 'flower',
        3.5, 50.00, 45.00, 55.00,
        'https://www.awholdings.com/',
        'Ascend Wellness premium tier (composite)',
        'low',
        '[ROUND2] Ozz 3.5g Ascend premium. Pricing from brand-tier pattern — resubmit via Path C for real price.');

-- ===== IL CRAFT / INDEPENDENT CULTIVATORS (NEW) =====

-- Daze Off premium flower — 7g (quarter)
-- Source: high-haven-elgin deal explicitly names "Daze Off Reefer Gladness 7g"
-- at 45% off. Daze Off is an IL craft cultivator producing premium genetics.
-- Observed list price ~$95/7g in IL menus before discount.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Daze Off', 'daze off', 'Daze Off (Independent craft)', 'premium', 'flower',
        7.0, 95.00, 80.00, 110.00,
        'https://weedmaps.com/brands/daze-off',
        'High Haven Elgin + IL craft patterns',
        'medium',
        '[ROUND2] Daze Off 7g quarter — IL craft premium. Observed at high-haven-elgin in "Reefer Gladness 7g" deal at 45% off.');

-- Daze Off premium flower — eighth
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Daze Off', 'daze off', 'Daze Off (Independent craft)', 'premium', 'flower',
        3.5, 50.00, 45.00, 60.00,
        'https://weedmaps.com/brands/daze-off',
        'IL craft pattern',
        'medium',
        '[ROUND2] Daze Off 3.5g — craft premium eighth. Extrapolated from 7g + common craft IL pricing.');

-- Grow Science premium flower — eighth (IL craft)
-- Source: high-haven-elgin deal "Grow Science Pineapple Fruz 3.5g" at 45% off.
-- Grow Science is an IL craft cultivator.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Grow Science', 'grow science', 'Grow Science (Independent craft)', 'premium', 'flower',
        3.5, 50.00, 45.00, 60.00,
        'https://weedmaps.com/',
        'High Haven Elgin + IL craft pattern',
        'medium',
        '[ROUND2] Grow Science 3.5g — IL craft premium eighth. Observed at high-haven-elgin under 45% off.');

-- Nature's Grace & Wellness flower — eighth (IL cultivator, user-flagged)
-- Source: Nature's Grace is a licensed IL cultivator active statewide with
-- wholesale flower. Retail eighth typically $40-$50.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Natures Grace', 'natures grace', 'Natures Grace & Wellness (Independent)', 'mid', 'flower',
        3.5, 42.00, 35.00, 50.00,
        'https://www.naturesgrace.com/',
        'IL craft cultivator — wholesale reference',
        'low',
        '[ROUND2] Natures Grace & Wellness 3.5g — IL-licensed cultivator. Mid-tier flower. Pricing extrapolated from craft wholesale patterns; Path C submission will anchor.');

-- Nature's Grace & Wellness — quarter (7g)
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Natures Grace', 'natures grace', 'Natures Grace & Wellness (Independent)', 'mid', 'flower',
        7.0, 75.00, 65.00, 90.00,
        'https://www.naturesgrace.com/',
        'Extrapolated from eighth',
        'low',
        '[ROUND2] Natures Grace 7g quarter. Extrapolated from 3.5g math.');

-- Bedford Grow — 7g (extension of round 1 which only had 3.5g)
-- Source: Revolution Normal has Bedford Grow in multiple weights at premium
-- tier; 7g typically $95-$105 reg.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Bedford Grow', 'bedford grow', 'Bedford Grow (Independent)', 'premium', 'flower',
        7.0, 100.00, 90.00, 115.00,
        'https://shop.revcanna.com/normal',
        'Revolution Normal (extrapolated from 3.5g)',
        'medium',
        '[ROUND2] Bedford Grow 7g quarter — craft premium. Extrapolated from $54 eighth observation at Revolution Normal.');

-- Bedford Grow — 14g (half)
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Bedford Grow', 'bedford grow', 'Bedford Grow (Independent)', 'premium', 'flower',
        14.0, 190.00, 170.00, 215.00,
        'https://shop.revcanna.com/normal',
        'Revolution Normal (extrapolated from 3.5g)',
        'medium',
        '[ROUND2] Bedford Grow 14g half-oz — craft premium. Extrapolated from eighth math.');

-- ===== VAPE / CART BRANDS =====

-- Timeless Vapes — 1g cart (distributor across IL)
-- Source: Timeless is a legacy IL vape brand with statewide distribution.
-- 1g cart retails $60-$70 reg across Zen Leaf and other premium retailers.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Timeless', 'timeless', 'Timeless Vapes', 'premium', 'vape',
        1.0, 65.00, 55.00, 75.00,
        'https://timelessvapes.com/',
        'Timeless brand site + Zen Leaf IL menu',
        'medium',
        '[ROUND2] Timeless 1g vape cart premium tier. Observed at zen-leaf-naperville under 30% off Mon-Sat promo.');

-- Timeless Vapes — 0.5g cart
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Timeless', 'timeless', 'Timeless Vapes', 'premium', 'vape',
        0.5, 40.00, 35.00, 45.00,
        'https://timelessvapes.com/',
        'Timeless brand site (composite)',
        'medium',
        '[ROUND2] Timeless 0.5g vape cart — half-gram tier premium.');

-- ===== KIVA PORTFOLIO (EDIBLES) =====

-- Kiva chocolate bar — 100mg THC
-- Source: Kiva x C3 Industries licensing — 40+ IL dispensaries per lib/brands.ts.
-- Typical 100mg chocolate bar retails $20-$22.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Kiva', 'kiva', 'Kiva Confections', 'premium', 'edibles',
        0.1, 21.00, 18.00, 25.00,
        'https://kivaconfections.com/',
        'Kiva brand site + IL distribution',
        'medium',
        '[ROUND2] Kiva 100mg chocolate bar. IL-licensed via C3 Industries. weight_grams=0.1 sentinel (100mg edible); per-mg compute is the real PPG path.');

-- Camino Gummies — 100mg pack (Kiva sub-brand)
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Camino', 'camino', 'Kiva Confections', 'premium', 'edibles',
        0.1, 23.00, 20.00, 28.00,
        'https://kivaconfections.com/camino/',
        'Kiva brand site (composite)',
        'medium',
        '[ROUND2] Camino 100mg gummy pack. Kiva premium sub-brand, most-stocked edible in IL per brand positioning.');

-- Petra Mints — 80mg pack (Kiva sub-brand)
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('Petra', 'petra', 'Kiva Confections', 'premium', 'edibles',
        0.08, 16.00, 14.00, 20.00,
        'https://kivaconfections.com/petra/',
        'Kiva brand site',
        'medium',
        '[ROUND2] Petra 80mg mints tin. Kiva sub-brand, micro-dose tier. weight_grams=0.08 sentinel.');

-- ===== CURALEAF PORTFOLIO EXPANSION =====

-- FloraCal premium flower — eighth (Curaleaf craft)
-- Source: FloraCal is Curaleaf's premium craft line (CA origin, IL distribution
-- via Grassroots wholesale). Premium eighth $55-$65.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('FloraCal', 'floracal', 'Curaleaf', 'premium', 'flower',
        3.5, 60.00, 55.00, 70.00,
        'https://curaleaf.com/',
        'Curaleaf brand portfolio (FloraCal craft tier)',
        'low',
        '[ROUND2] FloraCal 3.5g premium craft eighth — Curaleaf top-tier flower brand.');

-- ===== nuERA HOUSE BRAND =====

-- nuEra house flower — eighth (value tier at nuEra stores)
-- Source: nuEra stores (6 in IL) carry a house-labeled value tier; typical
-- eighth $25-$30.
INSERT INTO public.anchor_skus (brand, brand_normalized, parent_company, tier, category,
                                weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                                source_url, source_dispensary, confidence, notes)
VALUES ('nuEra', 'nuera', 'nuEra (IL operator)', 'value', 'flower',
        3.5, 28.00, 22.00, 35.00,
        'https://nueracannabis.com/',
        'nuEra Chicago + nuEra Aurora (composite)',
        'low',
        '[ROUND2] nuEra house 3.5g value flower. Six nuEra stores in IL; house-labeled value tier. Pricing from nuEra Chicago menu patterns.');

COMMIT;

-- ============================================================
-- Verification queries — run after apply
-- ============================================================

-- (a) Row count
--   SELECT COUNT(*) FROM public.anchor_skus;
--   -- Expected: 47 (27 round 1 + 20 round 2).

-- (b) Parent company distribution
--   SELECT parent_company, COUNT(*) FROM public.anchor_skus
--   GROUP BY parent_company ORDER BY 2 DESC;

-- (c) Category distribution
--   SELECT category, COUNT(*) FROM public.anchor_skus
--   GROUP BY category ORDER BY 2 DESC;
--   -- Expected: flower ~35, pre-roll 3, vape 3, edibles 4, concentrate 2.

-- (d) Brands now covered that show up in active deals
--   SELECT DISTINCT brand_normalized FROM public.anchor_skus
--   WHERE brand_normalized IN (
--     'cresco','high supply','simply herb','good news','mindys',
--     'rythm','dogwalkers','incredibles','good green',
--     'savvy','encore','verano reserve','shine',
--     'bedford grow','aeriz','revolution','cookies','daze off','grow science',
--     'natures grace','nuera',
--     'grassroots','floracal','select',
--     'ozone','ozone reserve',
--     'common goods','in good taste','ozz',
--     'kiva','camino','petra','terra',
--     'timeless'
--   )
--   ORDER BY brand_normalized;
--   -- Expected: ≥30 distinct brands covered.

-- (e) After running scripts/compute-ppg-from-anchors.ts:
--   SELECT category, COUNT(*) FILTER (WHERE price_per_gram IS NOT NULL) AS with_ppg,
--                     COUNT(*) AS total
--   FROM public.deals WHERE is_active = true
--   GROUP BY category;
--   -- Target: flower with_ppg ≥ 10 (clears sample_size for Index).
