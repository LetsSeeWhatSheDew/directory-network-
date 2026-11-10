-- 2026-11-10 — One live row per deal (PuffPrice, project_tag='green').
-- Matthew applies this in the Supabase SQL editor. Code does not run it.
--
-- WHY: the morning scraper re-inserted live deals every day (its read of
-- existing deals was capped at 500 rows) and the daily verification sweep kept
-- every copy active. On Nov 10: 110 active rows for 37 real deals
-- (nuEra East Peoria showed "42 offers" for 9). The code fix (branch
-- claude/trust-fixes-2026-11-10) stops new copies and retires leftovers on the
-- next run; this file cleans up today without waiting for the cron.
--
-- WHAT IT DOES: among ACTIVE green deals with the same store + title (case and
-- spaces ignored) + discount value + source family, keeps the NEWEST row and
-- sets the rest is_active=false, status_reason='duplicate_of_newer'.
-- Nothing is deleted. Reversible: see the UNDO block at the bottom.
--
-- STEP 1 — preview (read-only). Expect about 73 rows to retire on Nov 10.
WITH ranked AS (
  SELECT id, listing_slug, title, discount_value, source, created_at,
         row_number() OVER (
           PARTITION BY listing_slug,
                        lower(regexp_replace(trim(title), '\s+', ' ', 'g')),
                        coalesce(discount_value, -1),
                        (source = 'website_rendered')
           ORDER BY created_at DESC, id
         ) AS rn
  FROM public.deals
  WHERE project_tag = 'green' AND is_active = true
)
SELECT listing_slug, title, discount_value, count(*) FILTER (WHERE rn > 1) AS to_retire
FROM ranked
GROUP BY 1, 2, 3
HAVING count(*) FILTER (WHERE rn > 1) > 0
ORDER BY to_retire DESC;

-- STEP 2 — apply. Run this after the preview looks right.
BEGIN;
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY listing_slug,
                        lower(regexp_replace(trim(title), '\s+', ' ', 'g')),
                        coalesce(discount_value, -1),
                        (source = 'website_rendered')
           ORDER BY created_at DESC, id
         ) AS rn
  FROM public.deals
  WHERE project_tag = 'green' AND is_active = true
)
UPDATE public.deals d
SET is_active = false,
    status_reason = 'duplicate_of_newer',
    updated_at = now()
FROM ranked r
WHERE d.id = r.id AND r.rn > 1;
-- Check before COMMIT: active rows should equal distinct deals (37 on Nov 10).
SELECT count(*) AS active_rows,
       count(DISTINCT (listing_slug, lower(trim(deal_title)), discount_value)) AS distinct_deals
FROM public.active_deals_with_listings;
COMMIT;

-- UNDO (only if needed): reactivate what this file retired today.
-- UPDATE public.deals SET is_active = true, status_reason = 'holding_pattern_within_48h', updated_at = now()
-- WHERE project_tag = 'green' AND status_reason = 'duplicate_of_newer' AND updated_at::date = '2026-11-10';
