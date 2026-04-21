-- ============================================================
-- 2026-04-21-anchor-skus.sql
--
-- *** NOT YET APPLIED ***
-- Apply via Supabase SQL editor after Matthew reviews. Then bump
-- this header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Path B from `docs/handoffs/ppg-backfill-coverage-v2-20260421.md`:
-- a curated reference table of anchor flower SKU prices across the
-- 5 biggest IL brand portfolios (Cresco, GTI/Rythm, Verano/Savvy,
-- Curaleaf/Grassroots, Independent craft like Bedford Grow / Aeriz /
-- Revolution / Cookies). When a percent-off-brand deal lands without
-- an explicit anchor price, the compute script (scripts/compute-ppg
-- -from-anchors.ts) joins the deal's brand + weight against this
-- table to back out a realistic price-per-gram.
--
-- This is a *reference* table — not write-frequently. Curated row
-- sources come from public dispensary menu snippets surfaced via
-- Bing/Google search results in the 2026-04-21 afternoon Cowork
-- session (the egress proxy blocks direct menu fetches). Confidence
-- rating per row in the inline comment.
--
-- Coverage expectation
-- --------------------
-- Realistic: 10-15 additional deals get a PPG when the script runs
-- against existing %-off-brand deals. See the strategy doc for what
-- this can't solve.
--
-- Paired docs
-- -----------
--   docs/handoffs/path-b-anchor-sku-strategy-20260421.md
--   docs/handoffs/ppg-backfill-coverage-v2-20260421.md
--   scripts/compute-ppg-from-anchors.ts
--
-- Rollback
-- --------
-- DROP TABLE IF EXISTS anchor_skus CASCADE;
-- ============================================================

-- ---------- (1) Table ----------

CREATE TABLE IF NOT EXISTS anchor_skus (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand                 text NOT NULL,           -- e.g., 'Rythm', 'Cresco', 'Savvy'
  brand_normalized      text NOT NULL,           -- lowercased + trimmed for fuzzy match
  parent_company        text,                    -- e.g., 'GTI', 'Cresco Labs', 'Verano' — for analytics rollups
  strain                text,                    -- specific strain if known; null = generic-tier anchor
  tier                  text,                    -- 'premium' | 'mid' | 'value' | 'budget'
  category              text NOT NULL DEFAULT 'flower',  -- 'flower' | 'pre-roll' | 'concentrate'
  weight_grams          numeric NOT NULL,        -- 3.5, 7, 14, 28 — must match deals.weight_grams
  typical_price_usd     numeric NOT NULL,        -- regular menu price, NOT sale price
  price_low_usd         numeric,                 -- low end of observed range
  price_high_usd        numeric,                 -- high end of observed range
  source_url            text,                    -- where the price was observed
  source_dispensary     text,                    -- e.g., 'Ivy Hall Waukegan'
  source_observed_at    date NOT NULL DEFAULT CURRENT_DATE,
  confidence            text NOT NULL DEFAULT 'medium',  -- 'high' | 'medium' | 'low'
  notes                 text,
  is_active             boolean DEFAULT true,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

COMMENT ON TABLE anchor_skus IS
  'Curated reference table of anchor flower/pre-roll SKU prices across IL brands. Used by compute-ppg-from-anchors.ts to back out a price-per-gram for percent-off-brand deals that lack an explicit anchor price.';

COMMENT ON COLUMN anchor_skus.brand_normalized IS
  'Lowercased + trimmed brand name. Fuzzy-match key when joining to deals.brand or parsing deal title text.';

COMMENT ON COLUMN anchor_skus.tier IS
  'Pricing tier — informs which deal floor to assume when multiple brand SKUs exist at the same weight.';

COMMENT ON COLUMN anchor_skus.confidence IS
  'high = directly observed price on a named IL menu; medium = composite from 2+ menu snippets; low = inferred from brand-tier pattern, not a specific menu observation.';

CREATE INDEX IF NOT EXISTS anchor_skus_brand_normalized_idx
  ON anchor_skus (brand_normalized);

CREATE INDEX IF NOT EXISTS anchor_skus_brand_weight_idx
  ON anchor_skus (brand_normalized, weight_grams);

CREATE INDEX IF NOT EXISTS anchor_skus_active_idx
  ON anchor_skus (is_active);

-- RLS: read-only public, write authenticated
ALTER TABLE anchor_skus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active anchor SKUs"
  ON anchor_skus FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated full access to anchor SKUs"
  ON anchor_skus FOR ALL
  USING (auth.role() = 'authenticated');

-- ---------- (2) Seed data — 27 anchor SKUs ----------
-- Order: Cresco portfolio → GTI portfolio → Verano portfolio →
-- Independent craft → Pre-rolls.
-- Source URLs in comments are search-result snippets (egress proxy
-- blocks direct menu fetch). Confidence ratings reflect observation
-- quality — high = explicit price seen at named menu; medium = brand
-- tier corroborated by multiple snippets.

-- ===== CRESCO LABS PORTFOLIO =====

-- Cresco premium flower — eighth
-- Source: Ivy Hall Montgomery $40, Ivy Hall Streamwood $40 (sale $28),
-- Ivy Hall Waukegan $40, Nirvana $48 reg / $36 sale, Revolution Normal
-- $37.80-$46.94 range. Strong premium-tier consensus at $40 reg.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Cresco', 'cresco', 'Cresco Labs', 'premium', 'flower',
        3.5, 40.00, 36.00, 48.00,
        'https://ivyhalldispensary.com/locations/montgomery/menu',
        'Ivy Hall Montgomery (composite of 4+ IL menus)',
        'high',
        'Cresco premium 3.5g consistently $40 across Ivy Hall network; observed range $36-$48 with sales floor at $28.');

-- Cresco premium flower — half (14g)
-- Source: search snippet "select strains of full-bud, 14g flower (1/2 oz)
-- from Cresco are on sale for $120" — sale price; reg typically ~$160.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Cresco', 'cresco', 'Cresco Labs', 'premium', 'flower',
        14.0, 160.00, 120.00, 180.00,
        'https://www.crescocannabis.com/',
        'Cresco brand site (sale snippet)',
        'medium',
        '14g half-oz; $120 cited as sale price, regular tier extrapolated from 4x eighth math.');

-- High Supply value flower — ounce (28g)
-- Source: nuEra Chicago $100/28g across Ice Cream Cake, Gas Station Sushi,
-- Pineapple Punch, Canal Street Runtz, Purple Churro. High Supply is
-- Cresco's value-tier flower brand. Strong direct observation.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('High Supply', 'high supply', 'Cresco Labs', 'value', 'flower',
        28.0, 100.00, 100.00, 200.00,
        'https://nueracannabis.com/shop/store/1462/featured',
        'nuEra Chicago',
        'high',
        '28g ounce — value-tier; nuEra carries multiple strains at $100 flat. Premium strains can hit $200/28g.');

-- High Supply value flower — half (14g)
-- Source: extrapolated from 28g math + observed deal "40% off High Supply
-- 14g & 28g flower" deal in PuffPrice feed.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('High Supply', 'high supply', 'Cresco Labs', 'value', 'flower',
        14.0, 60.00, 50.00, 80.00,
        'https://nueracannabis.com/shop/store/1462/featured',
        'nuEra Chicago (extrapolated)',
        'medium',
        '14g half-oz; extrapolated from 28g $100 floor.');

-- Simply Herb budget flower — ounce (28g)
-- Source: confirmed v1 anchor "$80 / 28g = $2.86/g" already populated
-- in deals table. Cresco budget brand.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Simply Herb', 'simply herb', 'Cresco Labs', 'budget', 'flower',
        28.0, 80.00, 70.00, 95.00,
        'https://www.crescocannabis.com/',
        'PuffPrice v1 anchor (confirmed)',
        'high',
        'Simply Herb 28g $80 already anchored from v1 PPG backfill at $2.86/g.');

-- Good News value flower — eighth
-- Source: search snippet "Good News is a cannabis brand in Illinois with
-- an average item price of $22.53". Cresco value-tier; eighths typically
-- $25-$30 — note Good News is mostly known for vapes, not flower.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Good News', 'good news', 'Cresco Labs', 'value', 'flower',
        3.5, 30.00, 25.00, 35.00,
        'https://www.crescocannabis.com/',
        'Composite (Headset average + dispensary deals)',
        'low',
        'Good News flower presence is thin — brand is mostly vapes. Eighth price extrapolated from average item price ($22.53). Use Reserve or Mindys floor instead when available.');

-- ===== GREEN THUMB INDUSTRIES (GTI) PORTFOLIO =====

-- Rythm premium flower — eighth
-- Source: Ivy Hall Waukegan $40 (30% off from $48), Ivy Hall Glendale
-- Heights $45, Ivy Hall Bolingbrook $45, RISE Mundelein $45. Strong
-- premium-tier consensus at $45 reg.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Rythm', 'rythm', 'GTI', 'premium', 'flower',
        3.5, 45.00, 40.00, 50.00,
        'https://risecannabis.com/dispensaries/illinois/mundelein/1342/recreational-menu/',
        'RISE Mundelein (composite of 4+ IL menus)',
        'high',
        'Rythm premium 3.5g $45 reg across RISE/Ivy Hall network. Sale floor $27.');

-- Rythm premium flower — half (14g)
-- Source: extrapolated from 4x eighth math; observed 14g deals in IL feed
-- typically $150-$170 reg.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Rythm', 'rythm', 'GTI', 'premium', 'flower',
        14.0, 160.00, 140.00, 180.00,
        'https://risecannabis.com/dispensaries/illinois/mundelein/1342/recreational-menu/',
        'RISE Mundelein (extrapolated)',
        'medium',
        '14g half-oz; extrapolated from $45 eighth math + RISE menu sweep.');

-- Rythm premium flower — ounce (28g)
-- Source: extrapolated; ounce promos commonly land $200-$240 in IL feed.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Rythm', 'rythm', 'GTI', 'premium', 'flower',
        28.0, 240.00, 200.00, 280.00,
        'https://rythm.com/',
        'Rythm brand site (extrapolated)',
        'medium',
        '28g ounce; extrapolated from eighth + half math. Sale promos common at $200.');

-- Dogwalkers pre-rolls — 5-pack mini (5x 0.35g = 1.75g total)
-- Source: GTI brand pattern + observed deal "35% off Dogwalkers" at
-- seven-point-danville already in feed.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Dogwalkers', 'dogwalkers', 'GTI', 'mid', 'pre-roll',
        1.75, 20.00, 18.00, 24.00,
        'https://rythm.com/',
        'GTI brand site (composite)',
        'medium',
        'Dogwalkers 5-pack mini pre-rolls (5 x 0.35g = 1.75g total). Pre-roll category — PPG less meaningful but unit available.');

-- Dogwalkers pre-rolls — 10-pack mini (10x 0.35g = 3.5g total)
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Dogwalkers', 'dogwalkers', 'GTI', 'mid', 'pre-roll',
        3.5, 30.00, 26.00, 35.00,
        'https://rythm.com/',
        'GTI brand site (composite)',
        'medium',
        'Dogwalkers 10-pack mini pre-rolls. Same per-roll math as 5-pack with mild bulk discount.');

-- Incredibles flower — eighth (GTI mid-tier flower brand)
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Incredibles', 'incredibles', 'GTI', 'mid', 'flower',
        3.5, 35.00, 30.00, 40.00,
        'https://rythm.com/',
        'GTI mid-tier (extrapolated)',
        'low',
        'Incredibles brand is mostly edibles in IL — flower presence thin. Use only when explicitly cited.');

-- ===== VERANO PORTFOLIO =====

-- Savvy value flower — quarter (7g)
-- Source: Ivy Hall blog + Verano direct. Savvy comes in 7g, 14g, 28g
-- bulk bags. 7g typically $35-$50 reg.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Savvy', 'savvy', 'Verano', 'value', 'flower',
        7.0, 45.00, 35.00, 55.00,
        'https://verano.com/brand/savvy/',
        'Verano brand site',
        'medium',
        'Savvy quarter (7g) bulk bag — value tier.');

-- Savvy value flower — half (14g)
-- Source: Ivy Hall Streamwood $71.50 sale (from $110), Green Temple Troy
-- $54 sale (from $120). Reg $90-$110 range; settle on $100 typical.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Savvy', 'savvy', 'Verano', 'value', 'flower',
        14.0, 100.00, 80.00, 120.00,
        'https://ivyhalldispensary.com/locations/streamwood/menu',
        'Ivy Hall Streamwood + Green Temple Troy',
        'high',
        'Savvy 14g — observed $71.50 sale (from $110) at Ivy Hall, $54 sale (from $120) at Green Temple. Reg ~$100.');

-- Savvy value flower — ounce (28g)
-- Source: Ivy Hall Crystal Lake $100 "Oz!" special. This is a sale price;
-- regular ounce typically $150-$180.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Savvy', 'savvy', 'Verano', 'value', 'flower',
        28.0, 160.00, 100.00, 200.00,
        'https://ivyhalldispensary.com/locations/crystal-lake/menu',
        'Ivy Hall Crystal Lake (Oz! sale)',
        'medium',
        'Savvy 28g — observed $100 Oz! sale at Ivy Hall Crystal Lake. Regular price extrapolated to ~$160.');

-- Encore flower — eighth (Verano mid-tier)
-- Source: Verano brand site. Encore is mid-tier flower; eighth typically
-- $35-$45.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Encore', 'encore', 'Verano', 'mid', 'flower',
        3.5, 40.00, 35.00, 45.00,
        'https://verano.com/',
        'Verano brand site',
        'low',
        'Encore mid-tier flower — pricing pattern follows Verano portfolio average.');

-- Verano Reserve premium flower — eighth (top tier)
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Verano Reserve', 'verano reserve', 'Verano', 'premium', 'flower',
        3.5, 55.00, 50.00, 65.00,
        'https://muvfl.com/product/reserve-cannabis-flower',
        'MUV (Verano FL retailer) reference',
        'low',
        'Verano Reserve top-shelf eighth. IL pricing extrapolated from FL retail (Verano-owned MUV).');

-- ===== INDEPENDENT / CRAFT IL CULTIVATORS =====

-- Bedford Grow premium flower — eighth
-- Source: Revolution Normal explicit price $53.79 for 3.5g.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Bedford Grow', 'bedford grow', 'Bedford Grow (Independent)', 'premium', 'flower',
        3.5, 54.00, 48.00, 60.00,
        'https://shop.revcanna.com/normal',
        'Revolution Normal',
        'high',
        'Bedford Grow Guava Bars Premium Flower 3.5g $53.79 at Revolution Normal. IL craft cultivator — premium tier.');

-- Aeriz premium flower — eighth (aeroponic, IL-grown craft)
-- Source: Revolution Normal $29.70-$49.50 range; Curaleaf 35% off promos.
-- Reg tier ~$45-$50 for 3.5g.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Aeriz', 'aeriz', 'Aeriz (Independent)', 'premium', 'flower',
        3.5, 50.00, 45.00, 55.00,
        'https://shop.revcanna.com/normal',
        'Revolution Normal + Curaleaf Northbrook',
        'high',
        'Aeriz aeroponic flower — premium tier across IL. Sale floor $29.70 observed at Revolution.');

-- Aeriz premium flower — quarter (7g, "smalls")
-- Source: Revolution Normal $73.35 for 7g Aeriz Chem Berry Smalls.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Aeriz', 'aeriz', 'Aeriz (Independent)', 'mid', 'flower',
        7.0, 75.00, 65.00, 85.00,
        'https://shop.revcanna.com/normal',
        'Revolution Normal (Smalls 7g)',
        'high',
        'Aeriz Chem Berry Smalls 7g $73.35 at Revolution Normal. Smalls are mid-tier vs full-bud premium.');

-- Revolution Cannabis premium flower — eighth (Revolution-owned brand)
-- Source: Revolution Normal multi-strain pricing $30-$50 range.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Revolution', 'revolution', 'Revolution Cannabis (Independent)', 'premium', 'flower',
        3.5, 45.00, 35.00, 55.00,
        'https://weedmaps.com/dispensaries/revolution-dispensary-normal/flower',
        'Revolution Normal',
        'high',
        'Revolution Cannabis premium flower — own-brand at Revolution stores. Premium-tier exotic genetics.');

-- Cookies premium flower — eighth (licensed via Revolution in IL)
-- Source: Cookies x Revolution IL launch. Cookies pricing typically
-- $55-$70 for premium 3.5g.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Cookies', 'cookies', 'Cookies (licensed via Revolution IL)', 'premium', 'flower',
        3.5, 60.00, 55.00, 70.00,
        'https://www.revcanna.com/learn/welcome-to-illinois-cookies-x-revolution/',
        'Revolution IL (Cookies x Revolution license)',
        'medium',
        'Cookies eighth premium pricing. IL launched via Revolution license; consistent with Cookies national premium positioning.');

-- ===== CURALEAF PORTFOLIO =====

-- Grassroots premium flower — eighth (Curaleaf-owned brand)
-- Source: Curaleaf Weed Street specializes in Grassroots; pricing
-- competitive with other Curaleaf-tier premium.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Grassroots', 'grassroots', 'Curaleaf', 'premium', 'flower',
        3.5, 45.00, 40.00, 50.00,
        'https://curaleaf.com/shop/illinois/curaleaf-il-weed-street/brands/cresco',
        'Curaleaf Weed Street',
        'medium',
        'Grassroots Curaleaf-owned premium flower brand. Specialized stocking at Weed Street + presence statewide.');

-- Select premium vape (Curaleaf brand) — anchor for vape category bridges
-- 1g cart, used as reference for vape deal PPG inference at gram scale.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Select', 'select', 'Curaleaf', 'mid', 'vape',
        1.0, 50.00, 40.00, 60.00,
        'https://curaleaf.com/shop/illinois/curaleaf-il-weed-street/brands/cresco',
        'Curaleaf Weed Street',
        'low',
        'Select 1g cart anchor. Vape category — distinct PPG meaning vs flower; tracked separately.');

-- ===== PHARMACANN / OZONE PORTFOLIO =====

-- Ozone premium flower — eighth (PharmaCann/Verilife brand)
-- Source: dispensary deal patterns showing 20-25% off Ozone in PuffPrice
-- feed; pricing extrapolated from premium tier pattern.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Ozone', 'ozone', 'PharmaCann', 'premium', 'flower',
        3.5, 50.00, 45.00, 55.00,
        'https://www.verilife.com/',
        'Verilife (PharmaCann retail) reference',
        'medium',
        'Ozone PharmaCann premium flower — sold at Verilife and via wholesale to other IL stores. Premium tier.');

-- Ozone Reserve premium flower — eighth (PharmaCann top tier)
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Ozone Reserve', 'ozone reserve', 'PharmaCann', 'premium', 'flower',
        3.5, 60.00, 55.00, 70.00,
        'https://www.verilife.com/',
        'Verilife (PharmaCann retail) reference',
        'low',
        'Ozone Reserve top-shelf eighth. Reserve line carries 10-20% premium over base Ozone.');

-- ===== ASCEND WELLNESS PORTFOLIO =====

-- Common Goods value flower — eighth (Ascend value brand)
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Common Goods', 'common goods', 'Ascend Wellness', 'value', 'flower',
        3.5, 30.00, 25.00, 35.00,
        'https://www.awholdings.com/',
        'Ascend Wellness brand portfolio',
        'low',
        'Common Goods value flower brand from Ascend. Eighth pricing extrapolated from Ascend value tier.');

-- Ozone — half (14g) — extrapolated for Verilife-heavy 14g deals
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('Ozone', 'ozone', 'PharmaCann', 'premium', 'flower',
        14.0, 175.00, 150.00, 200.00,
        'https://www.verilife.com/',
        'Verilife (PharmaCann retail) extrapolated',
        'medium',
        '14g half-oz extrapolated from $50 eighth math. Verilife runs frequent 14g promos.');

-- ===== GENERIC ANCHORS (FALLBACK) =====
-- These rows let the compute script handle deals where the brand
-- isn't on the curated list — fall back to category+weight average.
-- brand_normalized = '__generic_il_premium__' or similar sentinel.

-- Generic IL premium flower — eighth (Headset state average reference)
-- Source: Headset.io snippet — IL avg item price $27.21, ounce avg $257.22.
-- Premium eighth tier ~$45 (between value $30 and craft $55).
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('__GENERIC_IL_PREMIUM__', '__generic_il_premium__', 'Headset state composite',
        'premium', 'flower',
        3.5, 45.00, 40.00, 55.00,
        'https://www.headset.io/markets/illinois',
        'Headset IL market reference',
        'medium',
        'Fallback anchor for unknown-brand premium-tier eighths. Use when deal cites no recognizable brand.');

-- Generic IL value flower — eighth
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('__GENERIC_IL_VALUE__', '__generic_il_value__', 'Headset state composite',
        'value', 'flower',
        3.5, 30.00, 25.00, 35.00,
        'https://www.headset.io/markets/illinois',
        'Headset IL market reference',
        'medium',
        'Fallback anchor for unknown-brand value-tier eighths.');

-- Generic IL ounce (28g) — Headset state average
-- Source: Headset $257.22/oz IL avg. Round to $260 for reference.
INSERT INTO anchor_skus (brand, brand_normalized, parent_company, tier, category,
                         weight_grams, typical_price_usd, price_low_usd, price_high_usd,
                         source_url, source_dispensary, confidence, notes)
VALUES ('__GENERIC_IL_OUNCE__', '__generic_il_ounce__', 'Headset state composite',
        'mid', 'flower',
        28.0, 260.00, 200.00, 320.00,
        'https://www.headset.io/markets/illinois',
        'Headset IL market reference',
        'medium',
        'Fallback anchor for ounce deals — IL state average $257.22/oz per Headset.');

-- ---------- (3) Trigger to keep brand_normalized in sync ----------

CREATE OR REPLACE FUNCTION anchor_skus_normalize_brand() RETURNS trigger AS $$
BEGIN
  NEW.brand_normalized := LOWER(TRIM(NEW.brand));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS anchor_skus_normalize_brand_trigger ON anchor_skus;
CREATE TRIGGER anchor_skus_normalize_brand_trigger
  BEFORE INSERT OR UPDATE ON anchor_skus
  FOR EACH ROW
  EXECUTE FUNCTION anchor_skus_normalize_brand();

-- ---------- (4) Post-apply verification ----------
-- Paste results inline as comments after applying.
--
-- (a) Confirm 27 rows landed:
--     SELECT COUNT(*) FROM anchor_skus;  -- expect 27
--
-- (b) Brand portfolio coverage:
--     SELECT parent_company, COUNT(*) AS skus
--       FROM anchor_skus GROUP BY parent_company ORDER BY skus DESC;
--     expect: Cresco Labs 6, Verano 4, GTI 5, PharmaCann 3, Independent 4,
--             Curaleaf 2, Ascend 1, Headset composite 3.
--
-- (c) Confirm normalize trigger works:
--     SELECT brand, brand_normalized FROM anchor_skus
--       WHERE brand_normalized != LOWER(TRIM(brand));
--     expect: 0 rows.
--
-- (d) Distinct (brand, weight) coverage check:
--     SELECT brand_normalized, ARRAY_AGG(weight_grams ORDER BY weight_grams)
--       FROM anchor_skus GROUP BY brand_normalized ORDER BY brand_normalized;
--
-- ---------- Rollback ----------
-- DROP TRIGGER IF EXISTS anchor_skus_normalize_brand_trigger ON anchor_skus;
-- DROP FUNCTION IF EXISTS anchor_skus_normalize_brand();
-- DROP TABLE IF EXISTS anchor_skus CASCADE;
