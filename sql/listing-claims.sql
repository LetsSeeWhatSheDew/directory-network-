-- Listing claims — dispensary owners requesting control of their listing.
-- Pending claims are reviewed manually; we'll add a status transition later.

CREATE TABLE IF NOT EXISTS listing_claims (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_slug text NOT NULL,
  claimant_name text,
  claimant_role text,
  claimant_email text,
  claimant_phone text,
  verification_method text,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_claims_slug_idx ON listing_claims (listing_slug);
CREATE INDEX IF NOT EXISTS listing_claims_status_idx ON listing_claims (status);

-- RLS: anon can insert, only service role reads (matches deal_alerts pattern)
ALTER TABLE listing_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_claims_insert ON listing_claims;
CREATE POLICY listing_claims_insert ON listing_claims
  FOR INSERT TO anon WITH CHECK (true);
