-- sql/menu-deal-scores-schema.sql
-- ============================================================================
-- Deal scoring layer: joins existing `deals` rows to the menu baseline.
--
-- Append-only -- a fresh score per (deal, baseline) so we can answer
-- "what did this deal look like vs the market last week?"
--
-- Score semantics
--   discount_vs_median: (median - sale_price) / median  in [0..1]
--   score_label:
--     'great_deal'   - sale_price < p25 of band (below the bottom quartile)
--     'fair_deal'    - p25 <= sale_price <= median
--     'weak_deal'    - median < sale_price <= p75
--     'no_real_savings' - sale_price > p75 (anchor fakery suspect)
--     'unknown'      - no baseline available for the matched canonical_product
--
-- The match between a `deals` row and a `canonical_product` is by
-- (listing_slug -> dispensary.slug) + naive product_name match. The
-- pipeline doesn't try to be clever here; an unmatched deal is logged
-- with reason 'no_canonical_match' rather than scored.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS deal_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  canonical_product_id uuid REFERENCES canonical_products(id) ON DELETE SET NULL,
  baseline_id uuid REFERENCES price_baselines(id) ON DELETE SET NULL,

  observed_price numeric NOT NULL,    -- the deal's sale_price (or fixed_price)
  baseline_median numeric,            -- snapshot of the band at scoring time
  baseline_p25 numeric,
  baseline_p75 numeric,

  discount_vs_median numeric,         -- (median - observed_price)/median, can be negative
  score_label text NOT NULL CHECK (score_label IN (
    'great_deal', 'fair_deal', 'weak_deal', 'no_real_savings', 'unknown'
  )),
  reason text,                        -- 'no_canonical_match', 'baseline_sanity_failed', etc.
  scored_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_scores_deal_recent_idx
  ON deal_scores(deal_id, scored_at DESC);

CREATE INDEX IF NOT EXISTS deal_scores_label_idx
  ON deal_scores(score_label, scored_at DESC);

-- Latest score per deal
CREATE OR REPLACE VIEW latest_deal_scores AS
SELECT DISTINCT ON (deal_id) *
FROM deal_scores
ORDER BY deal_id, scored_at DESC;

COMMIT;
