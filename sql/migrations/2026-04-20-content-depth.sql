-- ============================================================
-- 2026-04-20-content-depth.sql
--
-- *** NOT YET APPLIED ***
-- Apply in Supabase SQL editor after Matthew approves. Then bump
-- the header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Schema scaffolding for two content-upgrade sections from the
-- listing-page inventory audit:
--   1. User-submitted tips (the "Report outdated info" mailto ships
--      today; a first-class tips table is the next step)
--   2. Google Places photos (JSONB cache column on master_listings)
--
-- Also adds the `google_place_id` column required for the Places
-- backfill pipeline — without it, the photo JSONB has no source.
--
-- Trade-off rationale
-- -------------------
-- See docs/handoffs/content-depth-schema-rationale.md for the full
-- write-up. Short version:
--   - Tips: NORMALIZED TABLE (not JSONB). Moderation workflow,
--     per-tip timestamps, GDPR deletion, multi-listing queries all
--     require row semantics.
--   - Photos: JSONB COLUMN on master_listings (not a table). Photos
--     are a cache of the Places API response, always read with the
--     listing, rarely mutated, structured as Google returns them.
--
-- Paired audit
-- ------------
--   docs/audits/listing-page-content-inventory-20260420.md
-- ============================================================

-- ---------- (1) Google Place ID column on master_listings ----------
-- Required before photos or Google reviews can backfill.

ALTER TABLE master_listings
  ADD COLUMN IF NOT EXISTS google_place_id text;

COMMENT ON COLUMN master_listings.google_place_id IS
  'Google Places API place_id. Backfill via scripts/backfill-logos-google-places.ts. Unique per physical location. Null until matched.';

CREATE UNIQUE INDEX IF NOT EXISTS master_listings_google_place_id_unique
  ON master_listings (google_place_id)
  WHERE google_place_id IS NOT NULL;

-- ---------- (2) Photos JSONB cache column on master_listings ----------
-- Shape: { "refreshed_at": "2026-04-20T18:00:00Z",
--          "photos": [ { "url": "...", "width": 4032, "height": 3024,
--                        "attribution": "Photo by Jane Doe (Google)" }, ... ] }
-- Nightly cron refreshes; TTL ~30 days (photos don't change often).

ALTER TABLE master_listings
  ADD COLUMN IF NOT EXISTS photos jsonb;

COMMENT ON COLUMN master_listings.photos IS
  'Cached Google Places photo payload. JSONB with { refreshed_at, photos: [{ url, width, height, attribution }] }. Refreshed nightly; staleness tolerable.';

-- Index on refreshed_at timestamp for the refresh-cron pull
-- ("find the 50 oldest-cached photo sets"). GIN on whole jsonb
-- is overkill for this shape — we only query the top-level key.
CREATE INDEX IF NOT EXISTS master_listings_photos_refreshed_idx
  ON master_listings (((photos->>'refreshed_at')::timestamptz))
  WHERE photos IS NOT NULL;

-- ---------- (3) Google review cache column (paired with photos) ----------
-- Photos + reviews come from the same Places API call, so we cache
-- them alongside each other. Same staleness rules apply.

ALTER TABLE master_listings
  ADD COLUMN IF NOT EXISTS google_reviews jsonb;

COMMENT ON COLUMN master_listings.google_reviews IS
  'Cached Google Places reviews + rating summary. JSONB with { refreshed_at, rating, user_rating_count, reviews: [{ rating, text, author, published_at }] }.';

-- ---------- (4) dispensary_tips table ----------
-- User-submitted short-form tips. Moderation-gated. Displayed under
-- the listing's "About" card once status='approved'.

CREATE TABLE IF NOT EXISTS dispensary_tips (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_slug text NOT NULL,
  body         text NOT NULL,
  author_name  text,
  author_email text,
  -- moderation state: pending | approved | rejected | flagged
  status       text NOT NULL DEFAULT 'pending',
  -- Pro-tier users may get light auto-approval; tracked here
  auto_approved      boolean DEFAULT false,
  -- Set when moderated
  moderated_by       text,
  moderated_at       timestamptz,
  moderation_note    text,
  -- Source tracking
  source_ip    inet,
  user_agent   text,
  -- Timestamps
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  -- Guardrails
  CONSTRAINT dispensary_tips_body_length      CHECK (length(body) BETWEEN 5 AND 500),
  CONSTRAINT dispensary_tips_status_valid     CHECK (status IN ('pending','approved','rejected','flagged')),
  CONSTRAINT dispensary_tips_listing_slug_fmt CHECK (listing_slug ~ '^[a-z0-9][a-z0-9-]*$')
);

COMMENT ON TABLE dispensary_tips IS
  'User-submitted short tips on dispensaries (budtender names, parking, ambience). Moderation-gated.';

CREATE INDEX IF NOT EXISTS dispensary_tips_listing_status_idx
  ON dispensary_tips (listing_slug, status, created_at DESC);

CREATE INDEX IF NOT EXISTS dispensary_tips_moderation_queue_idx
  ON dispensary_tips (status, created_at ASC)
  WHERE status = 'pending';

-- ---------- RLS on dispensary_tips ----------
ALTER TABLE dispensary_tips ENABLE ROW LEVEL SECURITY;

-- Public read: only APPROVED tips
CREATE POLICY dispensary_tips_public_read_approved
  ON dispensary_tips
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Public insert: anyone can submit (rate-limiting is an app-layer concern)
-- Default status='pending' — trigger blocks any submission trying to
-- insert with status != 'pending'.
CREATE POLICY dispensary_tips_public_insert_pending
  ON dispensary_tips
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND auto_approved = false);

-- ---------- Post-apply verification ----------
-- (a) columns landed:
--   SELECT column_name, data_type FROM information_schema.columns
--     WHERE table_name='master_listings'
--       AND column_name IN ('google_place_id','photos','google_reviews')
--     ORDER BY column_name;
--   expected: 3 rows (google_place_id text, photos jsonb, google_reviews jsonb)
--
-- (b) dispensary_tips table landed with RLS on:
--   SELECT relname, relrowsecurity
--     FROM pg_class WHERE relname='dispensary_tips';
--   expected: 1 row, relrowsecurity=true.
--
-- (c) indexes landed:
--   SELECT indexname FROM pg_indexes
--     WHERE tablename IN ('master_listings','dispensary_tips')
--       AND indexname LIKE ANY (ARRAY[
--         'master_listings_google_place_id_unique',
--         'master_listings_photos_refreshed_idx',
--         'dispensary_tips_listing_status_idx',
--         'dispensary_tips_moderation_queue_idx'
--       ])
--     ORDER BY indexname;
--   expected: 4 rows.
--
-- ---------- Rollback ----------
-- DROP TABLE IF EXISTS dispensary_tips;
-- ALTER TABLE master_listings DROP COLUMN IF EXISTS google_reviews;
-- ALTER TABLE master_listings DROP COLUMN IF EXISTS photos;
-- DROP INDEX IF EXISTS master_listings_google_place_id_unique;
-- ALTER TABLE master_listings DROP COLUMN IF EXISTS google_place_id;
