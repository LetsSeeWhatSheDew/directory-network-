-- =========================================================================
-- scrape-collision-detection.sql
-- =========================================================================
-- Diagnostic queries to run AFTER Code's ingest dry-run lands rows in
-- public.deal_submissions. Each query prints what Matthew needs to know
-- before deciding to promote (`--apply --auto-approve` vs. abort).
--
-- Run all 5 in sequence in Supabase SQL editor. Read-only — no writes.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Q1. New submissions by dispensary
-- -------------------------------------------------------------------------
-- Goal: how many deals did the scraper pull per dispensary?
-- Sanity floor: every scraped dispensary should yield >= 1, < 30. A 0
-- means the scraper failed silently for that store. A 50+ means the
-- scraper double-counted recurring days as separate deals.
-- -------------------------------------------------------------------------
SELECT
  COALESCE(s.dispensary_slug, '<no-slug>') AS dispensary_slug,
  s.dispensary_name_freetext,
  COUNT(*)                              AS total_submissions,
  COUNT(*) FILTER (WHERE s.approved)    AS already_approved,
  COUNT(*) FILTER (WHERE s.rejected_at IS NOT NULL) AS already_rejected,
  COUNT(*) FILTER (WHERE s.approved IS FALSE AND s.rejected_at IS NULL) AS pending_review,
  MIN(s.submitted_at)                   AS earliest_submission,
  MAX(s.submitted_at)                   AS latest_submission
FROM public.deal_submissions s
WHERE s.submitted_at > now() - interval '24 hours'
GROUP BY s.dispensary_slug, s.dispensary_name_freetext
ORDER BY total_submissions DESC, s.dispensary_slug;

-- -------------------------------------------------------------------------
-- Q2. Strict-dedup rejections within last 24 hours
-- -------------------------------------------------------------------------
-- Goal: did the ingest correctly catch deals that already exist as
-- pending submissions from a previous run? Each row here is a deal the
-- ingest should NOT have re-inserted.
-- If this returns 0, either the dedup logic worked or the scraper found
-- entirely net-new deals (both fine). If it returns > 100, dedup is broken.
-- -------------------------------------------------------------------------
SELECT
  s.dispensary_slug,
  lower(trim(s.deal_title)) AS norm_title,
  s.sale_price_usd,
  COUNT(*)                  AS duplicate_count,
  array_agg(s.id ORDER BY s.submitted_at) AS submission_ids,
  array_agg(s.submitted_at ORDER BY s.submitted_at) AS submitted_at_seq
FROM public.deal_submissions s
WHERE s.submitted_at > now() - interval '7 days'
GROUP BY s.dispensary_slug, lower(trim(s.deal_title)), s.sale_price_usd
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, s.dispensary_slug;

-- -------------------------------------------------------------------------
-- Q3. Apr 14 UPDATE-in-place candidates
-- -------------------------------------------------------------------------
-- Goal: identify pending submissions that match an existing
-- imported_not_verified deal in `deals`. These should promote via
-- UPDATE-in-place, NOT a new INSERT. Each row tells Code's promote
-- step "here's the existing deal_id to refresh".
--
-- Match key: (dispensary_slug, lower-trimmed title). Tighter than the
-- fuzzy dedup because exact title equality means it's the same deal,
-- not a variant.
-- -------------------------------------------------------------------------
SELECT
  s.id                       AS submission_id,
  s.dispensary_slug,
  s.deal_title               AS submission_title,
  s.sale_price_usd           AS submission_sale_price,
  d.id                       AS existing_deal_id,
  d.title                    AS existing_title,
  d.sale_price               AS existing_sale_price,
  d.status_reason            AS existing_status_reason,
  d.verified_at              AS existing_verified_at,
  -- pricing-divergence guard for the price_conflict edge case
  CASE
    WHEN s.sale_price_usd IS NULL OR d.sale_price IS NULL THEN NULL
    WHEN d.sale_price = 0 THEN NULL
    ELSE round(((s.sale_price_usd - d.sale_price) / d.sale_price * 100)::numeric, 1)
  END AS price_delta_pct
FROM public.deal_submissions s
INNER JOIN public.deals d
  ON d.listing_slug = s.dispensary_slug
 AND lower(trim(d.title)) = lower(trim(s.deal_title))
 AND d.is_active = true
WHERE s.submitted_at > now() - interval '24 hours'
  AND s.approved = false
  AND s.rejected_at IS NULL
ORDER BY s.dispensary_slug, s.deal_title;

-- -------------------------------------------------------------------------
-- Q4. Brand coverage delta (scraped brands not in anchor_skus)
-- -------------------------------------------------------------------------
-- Goal: surface new brands the scraper found that aren't yet in our
-- anchor SKU list. Each row is a candidate to add to anchor_skus
-- after the run, expanding our PuffPrice Index brand vocabulary.
-- -------------------------------------------------------------------------
SELECT
  lower(trim(s.brand))      AS brand_normalized,
  COUNT(*)                  AS submission_count,
  COUNT(DISTINCT s.dispensary_slug) AS dispensaries_carrying,
  array_agg(DISTINCT s.dispensary_slug ORDER BY s.dispensary_slug) AS dispensary_list,
  MIN(s.sale_price_usd)     AS min_price_seen,
  MAX(s.sale_price_usd)     AS max_price_seen
FROM public.deal_submissions s
WHERE s.submitted_at > now() - interval '24 hours'
  AND s.brand IS NOT NULL
  AND lower(trim(s.brand)) NOT IN (
    SELECT lower(brand_normalized) FROM public.anchor_skus
  )
GROUP BY lower(trim(s.brand))
ORDER BY submission_count DESC;

-- -------------------------------------------------------------------------
-- Q5. PPG distribution sanity check
-- -------------------------------------------------------------------------
-- Goal: catch outliers before promotion. Anything outside $2-$50/g is
-- almost certainly a unit mix-up (eighth flagged as gram, half-oz
-- flagged as gram, etc.). Each row here should be Matthew-reviewed
-- against the source URL before approving.
--
-- Healthy IL flower PPG today: $5-$18/g. Distillate / live resin
-- typically $30-$60/g but they shouldn't surface here unless category
-- is misclassified.
-- -------------------------------------------------------------------------
SELECT
  s.id,
  s.dispensary_slug,
  s.deal_title,
  s.brand,
  s.category,
  s.weight_grams,
  s.sale_price_usd,
  s.price_per_gram_computed,
  s.source_url,
  CASE
    WHEN s.price_per_gram_computed < 2 THEN 'PPG_TOO_LOW (likely unit mix-up)'
    WHEN s.price_per_gram_computed > 50 THEN 'PPG_TOO_HIGH (likely premium misclassified)'
    WHEN s.price_per_gram_computed BETWEEN 2 AND 4 THEN 'suspicious-low — verify'
    WHEN s.price_per_gram_computed BETWEEN 30 AND 50 THEN 'high but plausible for premium'
    ELSE 'normal'
  END AS ppg_assessment
FROM public.deal_submissions s
WHERE s.submitted_at > now() - interval '24 hours'
  AND s.price_per_gram_computed IS NOT NULL
  AND (
    s.price_per_gram_computed < 5
    OR s.price_per_gram_computed > 25
  )
ORDER BY s.price_per_gram_computed ASC;

-- =========================================================================
-- After running: read the output of all 5 queries and use the decision
-- matrix in docs/handoffs/2026-04-22-post-scrape-matthew-review.md to
-- decide whether to run Code's promote step with --apply, --apply
-- --auto-approve, or to abort the run.
-- =========================================================================
