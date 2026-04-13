-- ============================================================
-- DEALS ENGINE SCHEMA
-- Directory Network / CleanList.co
-- April 13, 2026
-- ============================================================
-- This extends the existing master_listings table with a
-- full deal intelligence layer. This is the core of the pivot
-- from "directory" to "price intelligence + decision engine"
-- ============================================================

-- -------------------------------------------------------
-- TABLE: deals
-- Stores all deal/promo data per dispensary
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_slug      text NOT NULL REFERENCES master_listings(slug) ON DELETE CASCADE,
  project_tag       text NOT NULL DEFAULT 'green',

  -- Deal content
  title             text NOT NULL,           -- "30% off all vapes"
  description       text,                    -- Full deal text as written
  category          text,                    -- flower | edibles | vapes | concentrate | topicals | accessories | all
  discount_type     text,                    -- percent_off | dollar_off | bogo | fixed_price | free_item | other
  discount_value    numeric,                 -- 30 (for 30%), 5 (for $5 off), etc.
  discount_unit     text,                    -- percent | dollars

  -- Normalized pricing intel (the core of the engine)
  original_price    numeric,                 -- e.g. 40.00 (for an eighth)
  sale_price        numeric,                 -- e.g. 28.00
  unit              text,                    -- gram | eighth | quarter | half | oz | each | pack
  price_per_gram    numeric,                 -- COMPUTED: normalized for comparison across units

  -- Timing
  is_recurring      boolean DEFAULT false,
  recurring_days    text[],                  -- ['monday', 'wednesday'] for weekly specials
  starts_at         timestamptz,
  expires_at        timestamptz,
  is_active         boolean DEFAULT true,

  -- Source tracking
  source            text DEFAULT 'manual',   -- leafly | weedmaps | website | dispensary_submitted | manual
  source_url        text,                    -- URL where deal was found
  raw_text          text,                    -- Original text before normalization

  -- Metadata
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  verified_at       timestamptz,             -- When last verified as still active
  verified_by       text                     -- manual | auto
);

-- Index for fast city/location lookups
CREATE INDEX IF NOT EXISTS deals_listing_slug_idx ON deals(listing_slug);
CREATE INDEX IF NOT EXISTS deals_project_tag_idx ON deals(project_tag);
CREATE INDEX IF NOT EXISTS deals_category_idx ON deals(category);
CREATE INDEX IF NOT EXISTS deals_is_active_idx ON deals(is_active);
CREATE INDEX IF NOT EXISTS deals_recurring_idx ON deals(is_recurring);

-- -------------------------------------------------------
-- TABLE: deal_alerts
-- Consumer subscriptions for price/deal notifications
-- This is the "notify me when Blue Dream drops below $30"
-- feature — retention engine for the product
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_alerts (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email         text NOT NULL,
  phone         text,                    -- For SMS alerts (future)
  city          text,                    -- Alert me for deals in this city
  zip_code      text,                    -- Or by zip
  radius_miles  integer DEFAULT 15,      -- How far to search

  -- What they want alerts for
  categories    text[],                  -- ['flower', 'edibles'] or empty for all
  max_price     numeric,                 -- Only alert if price is below this
  min_discount  numeric,                 -- Only alert if discount is >= this %

  -- Frequency
  frequency     text DEFAULT 'daily',    -- daily | instant | weekly
  is_active     boolean DEFAULT true,

  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_alerts_city_idx ON deal_alerts(city);
CREATE INDEX IF NOT EXISTS deal_alerts_zip_idx ON deal_alerts(zip_code);

-- -------------------------------------------------------
-- TABLE: deal_clicks
-- Track when users click through to a dispensary via a deal
-- This is how we prove value to dispensaries
-- ("we sent you 47 customers this month")
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_clicks (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id         uuid REFERENCES deals(id),
  listing_slug    text,
  user_city       text,
  user_zip        text,
  referrer        text,                  -- What page they came from
  device_type     text,                  -- mobile | desktop
  clicked_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_clicks_deal_id_idx ON deal_clicks(deal_id);
CREATE INDEX IF NOT EXISTS deal_clicks_listing_slug_idx ON deal_clicks(listing_slug);
CREATE INDEX IF NOT EXISTS deal_clicks_clicked_at_idx ON deal_clicks(clicked_at);

-- -------------------------------------------------------
-- FUNCTION: calculate_price_per_gram
-- Normalizes all cannabis pricing to price-per-gram
-- so we can compare across different units and quantities
-- This is the algorithm core — what makes "cheapest near you"
-- actually work
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_price_per_gram(
  price numeric,
  unit text
) RETURNS numeric AS $$
BEGIN
  RETURN CASE
    WHEN unit = 'gram'    THEN price
    WHEN unit = 'eighth'  THEN price / 3.5
    WHEN unit = 'quarter' THEN price / 7.0
    WHEN unit = 'half'    THEN price / 14.0
    WHEN unit = 'oz'      THEN price / 28.0
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -------------------------------------------------------
-- VIEW: active_deals_with_listings
-- The main query the homepage decision engine uses
-- Joins deals with dispensary data for the full recommendation
-- -------------------------------------------------------
CREATE OR REPLACE VIEW active_deals_with_listings AS
SELECT
  d.id                          AS deal_id,
  d.title                       AS deal_title,
  d.description                 AS deal_description,
  d.category,
  d.discount_type,
  d.discount_value,
  d.discount_unit,
  d.original_price,
  d.sale_price,
  d.unit,
  d.price_per_gram,
  d.is_recurring,
  d.recurring_days,
  d.expires_at,
  d.source,

  -- Dispensary data
  m.slug,
  m.name,
  m.city,
  m.state,
  m.address1,
  m.phone,
  m.website,
  m.google_rating,
  m.review_count,
  m.delivery,
  m.drive_thru,
  m.accepts_credit,
  m.cash_only,
  m.logo_url,
  m.plan,

  -- Computed savings display
  CASE
    WHEN d.original_price IS NOT NULL AND d.sale_price IS NOT NULL
    THEN ROUND(d.original_price - d.sale_price, 2)
    ELSE NULL
  END AS savings_amount,

  CASE
    WHEN d.original_price IS NOT NULL AND d.sale_price IS NOT NULL
    THEN ROUND(((d.original_price - d.sale_price) / d.original_price) * 100)
    ELSE d.discount_value
  END AS savings_percent

FROM deals d
JOIN master_listings m ON d.listing_slug = m.slug
WHERE d.is_active = true
  AND d.project_tag = 'green'
  AND m.project_tag = 'green'
  AND (d.expires_at IS NULL OR d.expires_at > now());

-- -------------------------------------------------------
-- RLS POLICIES
-- -------------------------------------------------------
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_clicks ENABLE ROW LEVEL SECURITY;

-- Public can read active deals
CREATE POLICY "Public can view active deals"
  ON deals FOR SELECT
  USING (is_active = true);

-- Public can insert deal alerts (subscribe to notifications)
CREATE POLICY "Public can subscribe to alerts"
  ON deal_alerts FOR INSERT
  WITH CHECK (true);

-- Public can log deal clicks (for analytics)
CREATE POLICY "Public can log clicks"
  ON deal_clicks FOR INSERT
  WITH CHECK (true);

-- Authenticated operators get full access
CREATE POLICY "Authenticated full access to deals"
  ON deals FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to alerts"
  ON deal_alerts FOR ALL
  USING (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- SEED DATA: recurring deal patterns
-- Based on common Illinois dispensary sale day patterns
-- These are placeholders until Chrome returns real data
-- -------------------------------------------------------
-- Common patterns seen across IL dispensaries:
-- Monday: "Munchie Monday" — edibles discounts
-- Tuesday: "Topical Tuesday" or general 10% off
-- Wednesday: "Wax Wednesday" — concentrate deals
-- Thursday: "Throwback Thursday" — pre-roll deals
-- Friday: "Feel Good Friday" — flower deals
-- Sunday: "Sunday Funday" — storewide deals

-- -------------------------------------------------------
-- NOTES FOR IMPLEMENTATION
-- -------------------------------------------------------
-- 1. Run this migration in Supabase SQL editor
-- 2. The price_per_gram field should be auto-computed on insert
--    via a trigger (add trigger after validating schema)
-- 3. The deal_clicks table powers the dispensary dashboard:
--    "cleanlist.co sent you 47 visitors this month"
--    That's the proof of value that converts free → paid
-- 4. deal_alerts is the retention engine —
--    users who subscribe come back when deals match
-- -------------------------------------------------------
