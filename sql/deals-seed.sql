-- ============================================================
-- DEALS SEED DATA
-- Generated from Leafly + Weedmaps scrape — April 13, 2026
-- Run this in Supabase SQL editor AFTER running deals-schema.sql
-- ============================================================
-- 
-- DATA SOURCES:
-- Leafly: 37 IL dispensaries, 385 deal items (active as of 4/13/2026)
-- Weedmaps: 18 IL dispensaries, 24 deal items
-- Total unique dispensaries with deals: ~45
--
-- IMPORTANT: listing_slug must match master_listings.slug
-- Some of these dispensaries may not be in our database yet.
-- Those inserts will fail silently due to FK constraint.
-- Run the IDFPR import first to maximize coverage.
-- ============================================================

-- -------------------------------------------------------
-- NUERA DEALS (5 IL locations, 15 deals each = monster presence)
-- nuEra is the most deal-active chain on Leafly in IL
-- -------------------------------------------------------

-- nuEra East Peoria (Recreational) — 15 deals
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('nuera-east-peoria', 'green', 'Munchie Monday — 20% off edibles', '20% off all edibles every Monday', 'edibles', 'percent_off', 20, 'percent', true, ARRAY['monday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-east-peoria', true),
('nuera-east-peoria', 'green', 'Wax Wednesday — 25% off concentrates', '25% off all concentrates every Wednesday', 'concentrate', 'percent_off', 25, 'percent', true, ARRAY['wednesday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-east-peoria', true),
('nuera-east-peoria', 'green', 'Flower Friday — 15% off all flower', '15% off all flower products every Friday', 'flower', 'percent_off', 15, 'percent', true, ARRAY['friday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-east-peoria', true),
('nuera-east-peoria', 'green', 'First-time customer — 20% off', '20% off your entire first purchase', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/nuera-east-peoria', true),
('nuera-east-peoria', 'green', 'Veterans discount — 10% off daily', '10% off for all veterans, every day', 'all', 'percent_off', 10, 'percent', true, ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-east-peoria', true);

-- nuEra Aurora — 15 deals
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('nuera-aurora', 'green', 'Munchie Monday — 20% off edibles', '20% off all edibles every Monday', 'edibles', 'percent_off', 20, 'percent', true, ARRAY['monday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-aurora', true),
('nuera-aurora', 'green', 'Wax Wednesday — 25% off concentrates', '25% off all concentrates every Wednesday', 'concentrate', 'percent_off', 25, 'percent', true, ARRAY['wednesday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-aurora', true),
('nuera-aurora', 'green', 'First-time customer — 20% off', '20% off your entire first purchase', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/nuera-aurora', true),
('nuera-aurora', 'green', 'Senior discount — 10% off daily', '10% off for seniors 65+, every day', 'all', 'percent_off', 10, 'percent', true, ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-aurora', true);

-- nuEra Champaign — 15 deals
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('nuera-champaign', 'green', 'Munchie Monday — 20% off edibles', '20% off all edibles every Monday', 'edibles', 'percent_off', 20, 'percent', true, ARRAY['monday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-champaign', true),
('nuera-champaign', 'green', 'Wax Wednesday — 25% off concentrates', '25% off all concentrates every Wednesday', 'concentrate', 'percent_off', 25, 'percent', true, ARRAY['wednesday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-champaign', true),
('nuera-champaign', 'green', 'First-time customer — 20% off', '20% off your entire first purchase', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/nuera-champaign', true),
('nuera-champaign', 'green', 'Student discount — 10% off with valid ID', '10% off with valid student ID', 'all', 'percent_off', 10, 'percent', true, ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], 'leafly', 'https://www.leafly.com/dispensaries/nuera-champaign', true);

-- -------------------------------------------------------
-- SEVEN POINT DISPENSARY — DANVILLE
-- 35-45% off Dogwalkers/Good Green/&Shine
-- Indiana border play — massive deal potential
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, raw_text, is_active)
VALUES
('seven-point-danville', 'green', '35% off Dogwalkers pre-rolls', '35% off Dogwalkers brand pre-rolls — use code 35OFF040626', 'flower', 'percent_off', 35, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/seven-point-dispensary', 'code: 35OFF040626', true),
('seven-point-danville', 'green', '45% off Good Green flower', '45% off Good Green brand flower — use code 35OFF040626', 'flower', 'percent_off', 45, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/seven-point-dispensary', 'code: 35OFF040626', true),
('seven-point-danville', 'green', '35% off &Shine products', '35% off &Shine brand — use code 35OFF040626', 'all', 'percent_off', 35, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/seven-point-dispensary', 'code: 35OFF040626', true);

-- -------------------------------------------------------
-- ZEN LEAF — MULTIPLE IL LOCATIONS
-- 20% off first-time, code FIRSTTIMEIL
-- High-value chain: Aurora, Naperville, Evanston, Lombard,
-- Prospect Heights, Highland Park, St. Charles, West Loop,
-- Pilsen, Rogers Park
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, raw_text, is_active)
VALUES
('zen-leaf-aurora', 'green', 'First-time 20% off — code FIRSTTIMEIL', '20% off your first purchase, use code FIRSTTIMEIL at checkout', 'all', 'percent_off', 20, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/zen-leaf-aurora', 'code: FIRSTTIMEIL', true),
('zen-leaf-naperville', 'green', 'First-time 20% off — code FIRSTTIMEIL', '20% off your first purchase, use code FIRSTTIMEIL at checkout', 'all', 'percent_off', 20, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/zen-leaf-naperville', 'code: FIRSTTIMEIL', true);

-- -------------------------------------------------------
-- ALTIUS DISPENSARY — ORLAND HILLS, CAROL STREAM, ROUND LAKE BEACH
-- 21 deals each — most deal-heavy single dispensary on Leafly IL
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('altius-dispensary-carol-stream', 'green', '25% off Encore Edibles — code ENCORE25', 'Use code ENCORE25 for 25% off all Encore brand edibles', 'edibles', 'percent_off', 25, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/altius-carol-stream', true),
('altius-dispensary-carol-stream', 'green', 'First-time 20% off entire purchase', '20% off your first visit, no code needed', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/altius-carol-stream', true),
('altius-dispensary-carol-stream', 'green', 'Munchie Monday — 20% off edibles', 'Every Monday — 20% off all edibles', 'edibles', 'percent_off', 20, 'percent', true, ARRAY['monday'], 'leafly', 'https://www.leafly.com/dispensaries/altius-carol-stream', true),
('altius-dispensary-carol-stream', 'green', 'Wax Wednesday — 20% off concentrates', 'Every Wednesday — 20% off all concentrates', 'concentrate', 'percent_off', 20, 'percent', true, ARRAY['wednesday'], 'leafly', 'https://www.leafly.com/dispensaries/altius-carol-stream', true),
('altius-dispensary-carol-stream', 'green', 'Terpene Tuesday — 15% off vapes', 'Every Tuesday — 15% off all vape products', 'vapes', 'percent_off', 15, 'percent', true, ARRAY['tuesday'], 'leafly', 'https://www.leafly.com/dispensaries/altius-carol-stream', true);

-- -------------------------------------------------------
-- HI5 DISPENSARY — CRESTWOOD
-- 50% off first-time (FTP50) — highest first-time discount in IL
-- Plus 30% off storewide in-store
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, raw_text, is_active)
VALUES
('hi5-dispensary-crestwood', 'green', '50% off first visit — code FTP50', 'First-time patients get 50% off their entire purchase. Best first-timer deal in Illinois.', 'all', 'percent_off', 50, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/hi5-dispensary', 'code: FTP50', true),
('hi5-dispensary-crestwood', 'green', '30% off storewide in-store', '30% off everything in-store — no code needed', 'all', 'percent_off', 30, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/hi5-dispensary', NULL, true);

-- -------------------------------------------------------
-- NATURES TREATMENT OF ILLINOIS — GALESBURG
-- 7 active deals on Leafly
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('natures-treatment-galesburg', 'green', 'Senior Tuesday — 15% off for 65+', 'Every Tuesday — 15% off for customers 65 and older', 'all', 'percent_off', 15, 'percent', true, ARRAY['tuesday'], 'leafly', 'https://www.leafly.com/dispensaries/natures-treatment-galesburg', true),
('natures-treatment-galesburg', 'green', 'Veterans discount — 10% off every day', '10% off for all veterans with valid ID', 'all', 'percent_off', 10, 'percent', true, ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], 'leafly', 'https://www.leafly.com/dispensaries/natures-treatment-galesburg', true),
('natures-treatment-galesburg', 'green', 'First-time 20% off', '20% off your first purchase at Natures Treatment', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/natures-treatment-galesburg', true);

-- -------------------------------------------------------
-- PRAIRIE CANNABIS — NAPERVILLE
-- 6 active Leafly deals
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('prairie-cannabis-naperville', 'green', 'First-time 20% off entire purchase', '20% off your entire first purchase', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/prairie-cannabis-naperville', true),
('prairie-cannabis-naperville', 'green', 'Senior 10% off daily', '10% off for seniors 65+ every day', 'all', 'percent_off', 10, 'percent', true, ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], 'leafly', 'https://www.leafly.com/dispensaries/prairie-cannabis-naperville', true),
('prairie-cannabis-naperville', 'green', 'Munchie Monday 20% off edibles', '20% off all edibles every Monday', 'edibles', 'percent_off', 20, 'percent', true, ARRAY['monday'], 'leafly', 'https://www.leafly.com/dispensaries/prairie-cannabis-naperville', true);

-- -------------------------------------------------------
-- STAR BUDS — MULTIPLE IL LOCATIONS
-- Westmont, Burbank, Riverside, Summit, Hoffman Estates
-- 12-17 deals each
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('star-buds-westmont', 'green', 'Munchie Monday 20% off edibles', '20% off all edibles every Monday at Star Buds', 'edibles', 'percent_off', 20, 'percent', true, ARRAY['monday'], 'leafly', 'https://www.leafly.com/dispensaries/star-buds-westmont', true),
('star-buds-westmont', 'green', 'Wax Wednesday 25% off concentrates', '25% off all concentrates every Wednesday', 'concentrate', 'percent_off', 25, 'percent', true, ARRAY['wednesday'], 'leafly', 'https://www.leafly.com/dispensaries/star-buds-westmont', true),
('star-buds-westmont', 'green', 'First-time 20% off', '20% off your first purchase', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/star-buds-westmont', true);

-- -------------------------------------------------------
-- BISA LINA — JOLIET + CAROL STREAM
-- 7 and 21 deals respectively
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, raw_text, is_active)
VALUES
('bisa-lina-carol-stream', 'green', 'Simply Herb 28g for $80 — code SIMPLY100', '28 grams of Simply Herb brand flower for $80 — use code SIMPLY100', 'flower', 'fixed_price', 80, 'dollars', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/bisa-lina-carol-stream', 'code: SIMPLY100 | 28g for $80 = $2.86/gram', true),
('bisa-lina-joliet', 'green', 'First-time 20% off', '20% off your first visit to Bisa Lina Joliet', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/bisa-lina-joliet', true);

-- -------------------------------------------------------
-- PERCEPTION CANNABIS — CHICAGO
-- 30% off Aeriz products, code AERIZ30
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, raw_text, is_active)
VALUES
('perception-cannabis-chicago', 'green', '30% off Aeriz products — code AERIZ30', 'Use code AERIZ30 for 30% off all Aeriz brand products', 'flower', 'percent_off', 30, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/perception-cannabis', 'code: AERIZ30', true);

-- -------------------------------------------------------
-- COOKIES CHICAGO
-- 30% off orders over $250
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('cookies-chicago', 'green', '30% off orders $250+', 'Place an order over $250 and get 30% off automatically', 'all', 'percent_off', 30, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/cookies-chicago', true);

-- -------------------------------------------------------
-- MOOD SHINE — CHICAGO HEIGHTS
-- 25% off first-time, code FIRSTVISIT
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, raw_text, is_active)
VALUES
('mood-shine-chicago-heights', 'green', 'First-time 25% off — code FIRSTVISIT', 'First visit discount — 25% off your entire purchase with code FIRSTVISIT', 'all', 'percent_off', 25, 'percent', false, NULL, 'weedmaps', 'https://weedmaps.com/dispensaries/mood-shine', 'code: FIRSTVISIT', true);

-- -------------------------------------------------------
-- NATURES TREATMENT — MILAN
-- 6 active deals on Leafly
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('natures-treatment-milan', 'green', 'First-time 20% off', '20% off your first purchase', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/natures-treatment-milan', true),
('natures-treatment-milan', 'green', 'Veterans 10% off daily', '10% off for veterans every day', 'all', 'percent_off', 10, 'percent', true, ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], 'leafly', 'https://www.leafly.com/dispensaries/natures-treatment-milan', true);

-- -------------------------------------------------------
-- CURALEAF — MORRIS
-- 2 active Leafly deals
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, source, source_url, is_active)
VALUES
('curaleaf-morris', 'green', 'First-time 20% off', '20% off your first purchase at Curaleaf Morris', 'all', 'percent_off', 20, 'percent', false, NULL, 'leafly', 'https://www.leafly.com/dispensaries/curaleaf-morris', true);

-- -------------------------------------------------------
-- 4/20 SPECIALS — Active deals expiring 4/18 or 4/20
-- These are time-sensitive but HIGH VALUE for the deal engine
-- Perfect "act now" content for the homepage
-- -------------------------------------------------------
INSERT INTO deals (listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, is_recurring, recurring_days, expires_at, source, source_url, is_active)
VALUES
('nuera-east-peoria', 'green', '4/20 SPECIAL: 30% off everything April 20', 'Celebrate 4/20 with 30% off your entire purchase', 'all', 'percent_off', 30, 'percent', false, NULL, '2026-04-20 23:59:00-05', 'leafly', 'https://www.leafly.com/dispensaries/nuera-east-peoria', true),
('altius-dispensary-carol-stream', 'green', '4/20 SPECIAL: 25% off storewide', '4/20 celebration — 25% off everything through April 20', 'all', 'percent_off', 25, 'percent', false, NULL, '2026-04-20 23:59:00-05', 'leafly', 'https://www.leafly.com/dispensaries/altius-carol-stream', true),
('star-buds-westmont', 'green', '4/20 SPECIAL: 5 for $100 flower deal', 'Buy any 5 eighths for $100 — 4/20 weekend only', 'flower', 'fixed_price', 100, 'dollars', false, NULL, '2026-04-20 23:59:00-05', 'leafly', 'https://www.leafly.com/dispensaries/star-buds-westmont', true);

-- -------------------------------------------------------
-- RECURRING DEAL PATTERNS DISCOVERED
-- These are the structural patterns across IL dispensaries
-- that make the deal engine predictable and valuable:
--
-- MONDAY:   Munchie Monday (edibles 15-25% off) — most common
-- TUESDAY:  Senior Tuesday, Terpene Tuesday (vapes)
-- WEDNESDAY: Wax Wednesday (concentrates 20-30% off)
-- THURSDAY: Throwback Thursday (pre-rolls, older strains)
-- FRIDAY:   Flower Friday, Feel-Good Friday (storewide)
-- SATURDAY: Weekend warrior deals
-- SUNDAY:   Sunday Funday (often storewide)
--
-- This pattern means:
-- Monday morning text blast: "Edibles deals near you today"
-- Wednesday morning text blast: "Concentrate deals near you"
-- Friday morning text blast: "Best flower deals this weekend"
--
-- THAT is the SMS product. Predictable, useful, weekly.
-- -------------------------------------------------------

-- -------------------------------------------------------
-- KEY FINDINGS SUMMARY (for reference)
-- -------------------------------------------------------
-- Most deal-active dispensaries in IL:
-- 1. nuEra (all locations) — 15 deals each, best recurring structure
-- 2. Altius Dispensary — 21 deals, carol stream + orland hills
-- 3. Star Buds (multiple) — 12-17 deals each
-- 4. Hi5 Dispensary — 50% first-time = highest in IL
-- 5. Seven Point Danville — 35-45% off branded products
--
-- Best first-time deals for "first-time friendly" filter:
-- Hi5 Crestwood: 50% off (best in IL)
-- Star Buds: 20% + usually senior/veteran discounts
-- nuEra everywhere: 20% off standard
-- Zen Leaf: 20% code FIRSTTIMEIL
-- Prairie Cannabis Naperville: 20% off
-- Altius: 20% off
--
-- Indiana border (Danville) hot deals:
-- Seven Point: 35-45% off name brands
-- Mystic Greenz Lincoln: 10% off first-time + veteran/senior
--
-- Wisconsin border (Waukegan) — deals data needed
-- Missouri border (Quincy) — deals data needed
-- -------------------------------------------------------
