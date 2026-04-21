-- ============================================================
-- 2026-04-21-deal-ppg-backfill-v2.sql
--
-- *** NOT YET APPLIED ***
-- DEPENDS ON: sql/migrations/2026-04-20-deals-price-normalization.sql
--             sql/migrations/2026-04-21-deal-ppg-backfill.sql (v1)
--
-- Apply in Supabase SQL editor after Matthew approves. Then bump
-- the header to "APPLIED YYYY-MM-DD HH:MM".
--
-- Purpose
-- -------
-- Round 2 of the PPG backfill. ADDITIVE to v1: only updates deals still
-- null after v1 applies. Session prompt targeted 15–20 of 56 for total
-- PPG coverage; honest answer is that without menu-scrape access to each
-- deal's `source_url`, v2 cannot materially expand coverage via title /
-- description parsing alone.
--
-- What this migration actually does
-- ---------------------------------
-- 1. Adds a semantic `unit` annotation on one flower deal that v1 skipped
--    because the title didn't carry enough PPG signal but the description
--    clearly identifies the format (pre-rolls).
-- 2. NOTHING ELSE. See docs/handoffs/ppg-backfill-coverage-v2-20260421.md
--    for the full accounting of why v2 cannot hit the target without a
--    menu-scrape pass.
--
-- Why the v2 target of 15–20 is unreachable tonight
-- -------------------------------------------------
-- The 54 deals v1 skipped are overwhelmingly percent-off-a-floating-menu
-- with zero anchor price in the deal copy. Extracting PPG from these
-- requires reading the dispensary's menu page (price × weight) at the
-- time the deal was active. This session's egress proxy blocks all
-- cannabis dispensary websites (confirmed: sunnyside.shop, risecannabis.com,
-- verilife.com, nueracannabis.com, etc. — all blocked), so WebFetch
-- cannot resolve source_urls. Without menu access, only the 2 deals v1
-- already caught (explicit "28g for $80", "5 eighths for $100") have
-- enough in-copy signal to derive PPG without guessing.
--
-- Instead of padding false data, this migration is a semantic-only
-- schema touch + a detailed coverage gap doc. Matthew's Tuesday plan is
-- unaffected: the Index remains at sample_size = 2 until the scraper
-- layer lands PPG-at-ingest.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- seven-point-danville — Dogwalkers pre-rolls
-- Deal id: fd13ec99-262a-4e5c-8488-de3695e3bb91
-- Title:   "35% off Dogwalkers pre-rolls"
-- Desc:    "35% off Dogwalkers brand pre-rolls — use code 35OFF040626"
--
-- Inference:
--   category stays 'flower' (pre-rolls are flower-category in the schema)
--   unit = 'pre-roll' — schema-level annotation that this is pack-based,
--   not weight-based. weight_grams / sale_price / ppg stay NULL because
--   the title doesn't carry pack count or anchor price.
--
-- Source: https://www.sevenpoint.org/  (Dogwalkers carried per public menu)
-- Source: https://greenthumbindustries.com/our-brands/dogwalkers/  (brand spec)
-- ------------------------------------------------------------
UPDATE deals
SET
  unit       = COALESCE(unit, 'pre-roll'),
  updated_at = now()
WHERE id = 'fd13ec99-262a-4e5c-8488-de3695e3bb91';

COMMIT;

-- ============================================================
-- Post-apply verification
-- ============================================================
-- (a) Count of deals with PPG post-v2 should stay at 2 (same as v1):
--
-- SELECT COUNT(*) FROM deals
--  WHERE project_tag='green' AND is_active=true
--    AND price_per_gram IS NOT NULL;
-- expected: 2 (unchanged — v2 adds no PPG values, only a unit annotation).
--
-- (b) Count of deals with any structured unit should be 3 (v1's 2 + this 1):
--
-- SELECT COUNT(*) FROM deals
--  WHERE project_tag='green' AND is_active=true
--    AND unit IS NOT NULL;
-- expected: 3.
--
-- (c) The Dogwalkers deal should carry unit='pre-roll':
--
-- SELECT id, title, unit, price_per_gram, weight_grams
--   FROM deals
--  WHERE id = 'fd13ec99-262a-4e5c-8488-de3695e3bb91';
-- expected: unit='pre-roll', ppg/weight null.
--
-- ============================================================
-- Rollback
-- ============================================================
-- UPDATE deals SET unit = NULL, updated_at = now()
--   WHERE id = 'fd13ec99-262a-4e5c-8488-de3695e3bb91';
