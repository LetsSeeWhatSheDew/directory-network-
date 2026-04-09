-- seed_illinois_dispensaries.sql
-- Real licensed dispensary data for Illinois city pages.
-- Run against the master_listings table in Supabase.
--
-- Usage:  psql $DATABASE_URL < sql/seed_illinois_dispensaries.sql
--   -or-  paste into the Supabase SQL Editor

-- ================================================================
--  PEORIA
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Ivy Hall Dispensary', 'Ivy Hall Dispensary — Peoria', 'dispensary', 'Peoria', 'IL',
   'Recreational dispensary on West War Memorial Drive. Part of the Ivy Hall chain with a curated flower and edible menu.',
   'free', false),

  (gen_random_uuid(), 'green', 'Trinity on Glen', 'Trinity Dispensary — Glen Ave', 'dispensary', 'Peoria', 'IL',
   'Recreational and medical dispensary at 2301 W Glen Ave. Full-spectrum product selection from Trinity Dispensaries.',
   'free', false),

  (gen_random_uuid(), 'green', 'Trinity on University', 'Trinity Dispensary — University St', 'dispensary', 'Peoria', 'IL',
   'Recreational and medical location at 3125 N University St. Second Trinity location serving the Peoria metro.',
   'free', false),

  (gen_random_uuid(), 'green', 'Beyond Hello Peoria', 'Beyond Hello — Peoria', 'dispensary', 'Peoria', 'IL',
   'Recreational and medical dispensary at 7620 State Route 91. National chain with a strong Illinois footprint.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  EAST PEORIA
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'nuEra East Peoria', 'nuEra Cannabis — East Peoria', 'dispensary', 'East Peoria', 'IL',
   'Recreational and medical dispensary operated by nuEra Cannabis. Serving the East Peoria corridor.',
   'free', false),

  (gen_random_uuid(), 'green', 'NOXX East Peoria', 'NOXX — East Peoria', 'dispensary', 'East Peoria', 'IL',
   'Recreational dispensary at 300 S Main St with medical discounts available. Partnered with Cookies brand.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  BLOOMINGTON
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Cookies Bloomington', 'Cookies — Bloomington', 'dispensary', 'Bloomington', 'IL',
   'Recreational and medical dispensary at 1006 JC Parkway. Part of the nationally recognized Cookies brand.',
   'free', false),

  (gen_random_uuid(), 'green', 'Beyond Hello Bloomington', 'Beyond Hello — Bloomington', 'dispensary', 'Bloomington', 'IL',
   'Recreational and medical dispensary at 1515 N Veterans Parkway. Full-service location with online ordering.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  NORMAL
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Revolution Dispensary Normal', 'Revolution — Normal', 'dispensary', 'Normal', 'IL',
   'Recreational and medical dispensary at 1609 Northbrook Dr. Known for in-house flower and concentrates.',
   'free', false),

  (gen_random_uuid(), 'green', 'High Haven Normal', 'High Haven Cannabis — Normal', 'dispensary', 'Normal', 'IL',
   'Recreational and medical dispensary at 106 Mall Dr. Wide selection with competitive ISU-area pricing.',
   'free', false),

  (gen_random_uuid(), 'green', 'AYR Wellness Normal', 'AYR Wellness — Normal', 'dispensary', 'Normal', 'IL',
   'Recreational and medical dispensary at 1730 Bradford Lane. Multi-state operator with a broad product menu.',
   'free', false),

  (gen_random_uuid(), 'green', 'Beyond Hello Normal', 'Beyond Hello — Normal', 'dispensary', 'Normal', 'IL',
   'Recreational and medical dispensary at 501 N Main Street. Part of the Beyond Hello chain across Illinois.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  SPRINGFIELD
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Ascend Cannabis Downtown Springfield', 'Ascend — Downtown Springfield', 'dispensary', 'Springfield', 'IL',
   'Recreational and medical dispensary at 628 E Adams St. Walkable from the state capitol and downtown hotels.',
   'free', false),

  (gen_random_uuid(), 'green', 'Ascend Cannabis Horizon Drive', 'Ascend — Horizon Drive', 'dispensary', 'Springfield', 'IL',
   'Recreational and medical dispensary at 3201 Horizon Dr. Second Ascend location on the south side of Springfield.',
   'free', false),

  (gen_random_uuid(), 'green', 'High Profile Cannabis Springfield', 'High Profile — Springfield', 'dispensary', 'Springfield', 'IL',
   'Recreational and medical dispensary at 4211 Conestoga Dr. Part of the High Profile Cannabis chain.',
   'free', false),

  (gen_random_uuid(), 'green', 'Shangri-La Springfield', 'Shangri-La Dispensary — Springfield', 'dispensary', 'Springfield', 'IL',
   'Recreational and medical dispensary serving the greater Springfield area. Locally recognized brand.',
   'free', false),

  (gen_random_uuid(), 'green', 'Maribis Springfield', 'Maribis — Springfield', 'dispensary', 'Springfield', 'IL',
   'Recreational and medical dispensary in Springfield. Known for a curated menu and knowledgeable staff.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  CHICAGO (select notable locations — not exhaustive)
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'nuEra Chicago', 'nuEra Cannabis — West Town', 'dispensary', 'Chicago', 'IL',
   'Recreational and medical dispensary at 1308 W North Ave in West Town. Full-service nuEra location.',
   'free', false),

  (gen_random_uuid(), 'green', 'Sunnyside Wrigleyville', 'Sunnyside Cannabis — Wrigleyville', 'dispensary', 'Chicago', 'IL',
   'Recreational and medical dispensary at 3524 N Clark St near Wrigley Field. Popular with north-siders and tourists.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  NAPERVILLE
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Rise Dispensary Naperville', 'Rise — Naperville', 'dispensary', 'Naperville', 'IL',
   'Recreational and medical dispensary at 1700 Quincy Ave. Part of the Rise chain with DuPage County convenience.',
   'free', false),

  (gen_random_uuid(), 'green', 'Zen Leaf Naperville', 'Zen Leaf — Naperville', 'dispensary', 'Naperville', 'IL',
   'Recreational and medical dispensary at 1516 N Naper Blvd. Spacious retail location with online menu.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  ROCKFORD
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Lyfe Dispensary', 'Lyfe — Rockford', 'dispensary', 'Rockford', 'IL',
   'Recreational cannabis dispensary at 6774 Troy Dr. Rockford's first locally owned and operated licensed dispensary.',
   'free', false),

  (gen_random_uuid(), 'green', 'Sunnyside Rockford', 'Sunnyside — Rockford', 'dispensary', 'Rockford', 'IL',
   'Recreational and medical cannabis dispensary offering vapes, flower, edibles, and more in Rockford.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  CHAMPAIGN
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'nuEra Champaign', 'nuEra — Champaign', 'dispensary', 'Champaign', 'IL',
   'Recreational and medical dispensary serving Champaign with a top-tier cannabis selection.',
   'free', false),

  (gen_random_uuid(), 'green', 'The Dispensary Champaign', 'The Dispensary — Champaign', 'dispensary', 'Champaign', 'IL',
   'Social equity cannabis dispensary licensed as the 100th in Illinois. Adult-use recreational cannabis.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  URBANA
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'nuEra Urbana', 'nuEra — Urbana', 'dispensary', 'Urbana', 'IL',
   'Licensed medical and adult-use recreational cannabis dispensary serving the Urbana area.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  JOLIET
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'RISE Joliet Colorado', 'RISE — Joliet Colorado', 'dispensary', 'Joliet', 'IL',
   'Recreational and medical dispensary with two locations in Joliet off I-80 and I-55.',
   'free', false),

  (gen_random_uuid(), 'green', 'RISE Joliet Rock Creek', 'RISE — Joliet Rock Creek', 'dispensary', 'Joliet', 'IL',
   'Recreational and medical cannabis dispensary with online ordering and curbside pickup options.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  AURORA
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'nuEra Aurora', 'nuEra — Aurora', 'dispensary', 'Aurora', 'IL',
   'Premier licensed adult-use recreational cannabis dispensary in Aurora.',
   'free', false),

  (gen_random_uuid(), 'green', 'Zen Leaf Aurora', 'Zen Leaf — Aurora', 'dispensary', 'Aurora', 'IL',
   'Recreational and medical dispensary at 740 Illinois Route 59. Online menu and government-issued ID required.',
   'free', false),

  (gen_random_uuid(), 'green', 'AuraLight Dispensary', 'AuraLight — Aurora', 'dispensary', 'Aurora', 'IL',
   'Licensed recreational weed dispensary serving the Aurora area with premium products.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  COLLINSVILLE
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Ascend Collinsville', 'Ascend — Collinsville', 'dispensary', 'Collinsville', 'IL',
   'Recreational and medical dispensary at 1014 Eastport Plaza Drive. Online ordering and curbside pickup available.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  EFFINGHAM
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'RISE Effingham', 'RISE — Effingham', 'dispensary', 'Effingham', 'IL',
   'Recreational and medical dispensary at 1011 Ford Avenue. Premium cannabis with free pharmacist consultations.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  QUINCY
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Bloom Wellness Quincy East', 'Bloom Wellness — Quincy East', 'dispensary', 'Quincy', 'IL',
   'Licensed recreational and medical cannabis dispensary at 4440 Broadway St. Ste. 1, Quincy.',
   'free', false),

  (gen_random_uuid(), 'green', 'Bloom Wellness Quincy West', 'Bloom Wellness — Quincy West', 'dispensary', 'Quincy', 'IL',
   'Licensed recreational and medical cannabis dispensary at 1837 Broadway St, Quincy.',
   'free', false),

  (gen_random_uuid(), 'green', 'RISE Quincy', 'RISE — Quincy', 'dispensary', 'Quincy', 'IL',
   'Recreational cannabis dispensary with online ordering and in-store pickup available in Quincy.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  DANVILLE
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Sunnyside Danville', 'Sunnyside — Danville', 'dispensary', 'Danville', 'IL',
   'Recreational dispensary at 369 Lynch Dr. Expansive online menu updated daily with flower, vapes, edibles.',
   'free', false),

  (gen_random_uuid(), 'green', 'Seven Point Danville', 'Seven Point — Danville', 'dispensary', 'Danville', 'IL',
   'Cannabis dispensary at 380 Eastgate Dr featuring a consumption lounge, patio, and music-themed events.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  ELGIN
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'High Haven Elgin', 'High Haven — Elgin', 'dispensary', 'Elgin', 'IL',
   'Licensed adult-use cannabis dispensary in Elgin accepting orders via website with in-store pickup.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  SCHAUMBURG
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Verilife Schaumburg', 'Verilife — Schaumburg', 'dispensary', 'Schaumburg', 'IL',
   'Recreational dispensary at 150 Barrington Road. Licensed cannabis retailer serving the Schaumburg area.',
   'free', false),

  (gen_random_uuid(), 'green', 'Sunnyside Schaumburg', 'Sunnyside — Schaumburg', 'dispensary', 'Schaumburg', 'IL',
   'Recreational cannabis dispensary with online ordering and in-store pickup in Schaumburg.',
   'free', false),

  (gen_random_uuid(), 'green', 'Revolution Schaumburg', 'Revolution — Schaumburg', 'dispensary', 'Schaumburg', 'IL',
   'Licensed recreational marijuana dispensary at 820 E Golf Rd. Known for in-house flower and concentrates.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  WAUKEGAN
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Planet 13 Waukegan', 'Planet 13 — Waukegan', 'dispensary', 'Waukegan', 'IL',
   'Licensed dispensary at 4000 Northpoint Blvd. Open 9am-10pm daily with recreational and medical products.',
   'free', false),

  (gen_random_uuid(), 'green', 'Ivy Hall Waukegan', 'Ivy Hall — Waukegan', 'dispensary', 'Waukegan', 'IL',
   'Recreational dispensary at 996 S Waukegan Rd. Part of the Ivy Hall chain with curated flower and edible menu.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  MOLINE
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Terrace Cannabis Moline', 'Terrace Cannabis — Moline', 'dispensary', 'Moline', 'IL',
   'Recreational cannabis dispensary at 2727 Avenue of the Cities. Daily deals with knowledgeable staff.',
   'free', false),

  (gen_random_uuid(), 'green', 'Revolution Moline', 'Revolution — Moline', 'dispensary', 'Moline', 'IL',
   'Recreational and medical dispensary at 4301 44th Avenue. Second dispensary in the Quad Cities area.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  ST. LOUIS, MO
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Sunrise Dispensary St. Louis', 'Sunrise — St. Louis', 'dispensary', 'St. Louis', 'MO',
   'Licensed medical and recreational cannabis dispensary on Lindbergh Boulevard in St. Louis.',
   'free', false),

  (gen_random_uuid(), 'green', 'Current Cannabis St. Louis', 'Current Cannabis — St. Louis', 'dispensary', 'St. Louis', 'MO',
   'Licensed medical and recreational marijuana dispensary serving the St. Louis area with a curated product selection.',
   'free', false),

  (gen_random_uuid(), 'green', 'NatureMed St. Louis', 'NatureMed — St. Louis', 'dispensary', 'St. Louis', 'MO',
   'Fully licensed medical and recreational cannabis dispensary with premium products and expert guidance.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  KANSAS CITY, MO
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'NatureMed Kansas City', 'NatureMed — Kansas City', 'dispensary', 'Kansas City', 'MO',
   'Licensed medical and recreational cannabis dispensary with 5 locations across Kansas City offering premium products.',
   'free', false),

  (gen_random_uuid(), 'green', 'From The Earth Kansas City', 'From The Earth — Kansas City', 'dispensary', 'Kansas City', 'MO',
   'Licensed cannabis dispensary built with the community in mind. Personalized experience based on unique needs.',
   'free', false),

  (gen_random_uuid(), 'green', 'Verts Dispensary Kansas City', 'Verts — Kansas City', 'dispensary', 'Kansas City', 'MO',
   'Leading recreational dispensary and go-to choice for locals and visitors in Kansas City.',
   'free', false),

  (gen_random_uuid(), 'green', 'The Forest Dispensary Kansas City', 'The Forest — Kansas City', 'dispensary', 'Kansas City', 'MO',
   'Welcoming regulated cannabis dispensary in the heart of Kansas City. Easy access and knowledgeable staff.',
   'free', false),

  (gen_random_uuid(), 'green', 'Sunrise Dispensary Kansas City', 'Sunrise — Kansas City', 'dispensary', 'Kansas City', 'MO',
   'Licensed dispensary serving Kansas City with terp-rich flower, low-profile edibles, and clean vapes.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  SPRINGFIELD, MO
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Terrabis Springfield', 'Terrabis — Springfield', 'dispensary', 'Springfield', 'MO',
   'Licensed recreational and medical cannabis dispensary serving Springfield with a range of premium products.',
   'free', false),

  (gen_random_uuid(), 'green', 'Flora Farms Springfield', 'Flora Farms — Springfield', 'dispensary', 'Springfield', 'MO',
   'Premium cannabis grower and dispensary providing friendly customer experience in Springfield.',
   'free', false),

  (gen_random_uuid(), 'green', 'Key Cannabis Springfield', 'Key Cannabis — Springfield', 'dispensary', 'Springfield', 'MO',
   'Licensed medical and recreational marijuana dispensary in Springfield with expert staff.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  COLUMBIA, MO
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Hippos Cannabis Columbia', 'Hippos Cannabis — Columbia', 'dispensary', 'Columbia', 'MO',
   'Premium cannabis shop offering recreational and medical products in Columbia.',
   'free', false),

  (gen_random_uuid(), 'green', 'Green Releaf Columbia', 'Green Releaf — Columbia', 'dispensary', 'Columbia', 'MO',
   'Licensed cannabis dispensary providing quality products and expert advice to Columbia residents.',
   'free', false),

  (gen_random_uuid(), 'green', 'Greenlight Dispensary Columbia', 'Greenlight — Columbia', 'dispensary', 'Columbia', 'MO',
   'Licensed recreational and medical cannabis dispensary serving Columbia with online ordering available.',
   'free', false)
ON CONFLICT DO NOTHING;

-- ================================================================
--  JOPLIN, MO
-- ================================================================

INSERT INTO master_listings (id, project_tag, listing_name, listing_title, listing_type, city, state, short_description, plan_tier, is_featured)
VALUES
  (gen_random_uuid(), 'green', 'Missouri Made Marijuana Joplin', 'Missouri Made Marijuana — Joplin', 'dispensary', 'Joplin', 'MO',
   '24/7 licensed cannabis dispensary at 1502 S Rangeline Road. Order online or walk in for immediate pickup.',
   'free', false),

  (gen_random_uuid(), 'green', 'Verts Dispensary Joplin', 'Verts — Joplin', 'dispensary', 'Joplin', 'MO',
   'Licensed medical and recreational marijuana dispensary in Joplin serving the local community.',
   'free', false),

  (gen_random_uuid(), 'green', 'Good Day Farm Joplin', 'Good Day Farm — Joplin', 'dispensary', 'Joplin', 'MO',
   'Licensed cannabis dispensary with 30+ premium flower strains, edibles, award-winning gummies, and concentrates.',
   'free', false),

  (gen_random_uuid(), 'green', 'Greenlight Dispensary Joplin', 'Greenlight — Joplin', 'dispensary', 'Joplin', 'MO',
   'Licensed dispensary at 1729 E 7th Street. Located off Historic U.S. Route 66 with easy access.',
   'free', false)
ON CONFLICT DO NOTHING;
