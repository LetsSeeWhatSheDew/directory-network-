-- deal_price_history
-- Append-only log of observed prices per listing. Lets us show "better
-- than last week" / "not as good as last week" context on deal cards,
-- and power the Pro price-history timeline later.

CREATE TABLE IF NOT EXISTS deal_price_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_slug text NOT NULL,
  category text,
  product_name text,
  price numeric,
  unit text,
  discount_value numeric,
  recorded_at timestamptz DEFAULT now(),
  source text,
  project_tag text DEFAULT 'green'
);

CREATE INDEX IF NOT EXISTS idx_price_history_slug ON deal_price_history(listing_slug);
CREATE INDEX IF NOT EXISTS idx_price_history_time ON deal_price_history(recorded_at);

ALTER TABLE deal_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read price history" ON deal_price_history;
CREATE POLICY "Public read price history" ON deal_price_history
  FOR SELECT USING (true);
