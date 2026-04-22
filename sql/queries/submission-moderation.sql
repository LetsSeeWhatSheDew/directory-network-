-- ============================================================
-- sql/queries/submission-moderation.sql
--
-- Reference queries for the daily deal_submissions moderator pass.
-- Ship alongside docs/ops/index-data-workflow-20260422.md.
--
-- These are query templates. Do not batch-run this file blind —
-- each block is meant to be pasted into Supabase SQL Editor (or
-- run via MCP one query at a time) with the moderator inspecting
-- output between steps.
-- ============================================================


-- ------------------------------------------------------------
-- (1) Pending queue — oldest first (SLA-ordered).
-- ------------------------------------------------------------
-- Use deal_submissions_pending view (joins master_listings for
-- dispensary name + city; falls back to freetext fields when the
-- dispensary isn't in the directory yet).
SELECT
  id,
  submitted_at,
  EXTRACT(EPOCH FROM (NOW() - submitted_at)) / 3600 AS hours_in_queue,
  dispensary_name,
  dispensary_city,
  deal_title,
  category,
  price_per_gram_computed,
  price_per_mg_computed,
  price_per_unit_computed,
  regular_price_usd,
  sale_price_usd,
  source_url,
  submitter_email,
  submitter_role
FROM public.deal_submissions_pending
ORDER BY submitted_at ASC;


-- ------------------------------------------------------------
-- (2) Detail view for a single submission the moderator is triaging.
-- ------------------------------------------------------------
SELECT *
FROM public.deal_submissions
WHERE id = $1 /* submission UUID */;


-- ------------------------------------------------------------
-- (3) Duplicate check — before approving, is there already an
--     active deal that looks the same?
-- ------------------------------------------------------------
SELECT d.id, d.listing_slug, d.title, d.is_active, d.created_at, d.expires_at
FROM public.deals d
WHERE d.listing_slug = (
  SELECT COALESCE(dispensary_slug,
         (SELECT slug FROM public.master_listings
          WHERE LOWER(name) = LOWER(dispensary_name_freetext)
          LIMIT 1))
  FROM public.deal_submissions
  WHERE id = $1
)
  AND d.is_active = true
  AND LOWER(d.title) LIKE '%' || LOWER((SELECT deal_title FROM public.deal_submissions WHERE id = $1)) || '%'
ORDER BY d.created_at DESC;


-- ------------------------------------------------------------
-- (4) APPROVE — 2-statement transaction.
--     Copies submission into deals, then marks submission approved
--     with a pointer back.
-- ------------------------------------------------------------
-- Usage: replace $1 with submission UUID, $moderator with email,
--        $verified_method with one of ('auto-source-match',
--        'manual-call', 'manual-menu', 'unverified').
BEGIN;

WITH new_deal AS (
  INSERT INTO public.deals (
    listing_slug, title, description, category,
    discount_type, discount_value,
    original_price, sale_price, price_per_gram, unit,
    is_recurring, recurring_days, expires_at, source, source_url,
    is_active, verified_at, project_tag, created_at, updated_at
  )
  SELECT
    -- Prefer the joined master slug; fall back to slugifying the freetext
    -- name if the moderator has already created the master row since submit.
    COALESCE(
      dispensary_slug,
      (SELECT slug FROM public.master_listings
        WHERE LOWER(name) = LOWER(dispensary_name_freetext)
        LIMIT 1)
    ),
    deal_title,
    deal_description,
    category,
    CASE
      WHEN regular_price_usd IS NOT NULL AND sale_price_usd IS NOT NULL
        THEN 'price_off'
      ELSE 'percent_off'
    END,
    NULL,                        -- discount_value: moderator fills only if it's an explicit % off
    regular_price_usd,
    sale_price_usd,
    price_per_gram_computed,
    CASE
      WHEN weight_grams IS NOT NULL THEN 'gram'
      WHEN mg_thc IS NOT NULL THEN 'mg'
      WHEN count IS NOT NULL THEN 'each'
      ELSE NULL
    END,
    is_recurring,
    recurring_days,
    end_date::timestamptz,
    'submission',
    source_url,
    true,
    NOW(),                       -- verified_at = moment of approval (real verification)
    'green',
    NOW(),
    NOW()
  FROM public.deal_submissions
  WHERE id = $1
  RETURNING id
)
UPDATE public.deal_submissions
SET approved = true,
    approved_at = NOW(),
    approved_by = $moderator,
    verified = true,
    verified_method = $verified_method,
    promoted_deal_id = (SELECT id FROM new_deal)
WHERE id = $1;

-- Inspect before commit.
SELECT 'approved' AS action,
       id,
       approved,
       approved_at,
       promoted_deal_id,
       verified_method
FROM public.deal_submissions
WHERE id = $1;

COMMIT;


-- ------------------------------------------------------------
-- (5) REJECT — single statement.
-- ------------------------------------------------------------
-- $1 = submission UUID
-- $reason = one of: duplicate, source_url_dead, price_implausible,
--                   unknown_dispensary, already_expired, spam, other
-- $moderator = moderator email
UPDATE public.deal_submissions
SET rejected_at = NOW(),
    rejected_reason = $reason,
    approved = false,
    approved_by = $moderator
WHERE id = $1;


-- ------------------------------------------------------------
-- (6) HOLD — neither approve nor reject, tag for follow-up.
--     Used when master_listings row needs to be created first.
-- ------------------------------------------------------------
UPDATE public.deal_submissions
SET notes = COALESCE(notes, '') ||
            CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE E'\n' END ||
            '[HELD ' || NOW()::date || ' by ' || $moderator ||
            '] ' || $hold_reason
WHERE id = $1;


-- ------------------------------------------------------------
-- (7) Rolling SLA metrics (last 30 days).
--     For the moderator dashboard / weekly review.
-- ------------------------------------------------------------
SELECT
  COUNT(*)                                                AS total_submissions,
  COUNT(*) FILTER (WHERE approved = true)                 AS approved_count,
  COUNT(*) FILTER (WHERE rejected_at IS NOT NULL)         AS rejected_count,
  COUNT(*) FILTER (WHERE approved = false AND rejected_at IS NULL) AS pending_count,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (approved_at - submitted_at)) / 3600)
      FILTER (WHERE approved = true), 1
  )                                                        AS avg_approve_hours,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (rejected_at - submitted_at)) / 3600)
      FILTER (WHERE rejected_at IS NOT NULL), 1
  )                                                        AS avg_reject_hours,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE rejected_at IS NOT NULL)
          / NULLIF(COUNT(*) FILTER (WHERE approved = true OR rejected_at IS NOT NULL), 0), 1
  )                                                        AS rejection_pct
FROM public.deal_submissions
WHERE submitted_at > NOW() - INTERVAL '30 days';


-- ------------------------------------------------------------
-- (8) Rejection reason breakdown (last 30 days).
--     Feeds the "is the form failing dispensaries?" question.
-- ------------------------------------------------------------
SELECT rejected_reason, COUNT(*)
FROM public.deal_submissions
WHERE rejected_at > NOW() - INTERVAL '30 days'
GROUP BY rejected_reason
ORDER BY 2 DESC;


-- ------------------------------------------------------------
-- (9) Approvals that led to live deals (audit trail).
-- ------------------------------------------------------------
SELECT
  ds.id                         AS submission_id,
  ds.submitted_at,
  ds.approved_at,
  ds.approved_by,
  ds.verified_method,
  d.id                          AS live_deal_id,
  d.title,
  d.listing_slug,
  d.price_per_gram,
  d.is_active                   AS still_active
FROM public.deal_submissions ds
LEFT JOIN public.deals d ON ds.promoted_deal_id = d.id
WHERE ds.approved = true
ORDER BY ds.approved_at DESC;


-- ------------------------------------------------------------
-- (10) SLA breach list — submissions >24h old, still pending.
-- ------------------------------------------------------------
SELECT
  id,
  submitted_at,
  ROUND(EXTRACT(EPOCH FROM (NOW() - submitted_at)) / 3600, 1) AS hours_waiting,
  dispensary_name,
  dispensary_city,
  deal_title,
  submitter_email
FROM public.deal_submissions_pending
WHERE submitted_at < NOW() - INTERVAL '24 hours'
ORDER BY submitted_at ASC;
