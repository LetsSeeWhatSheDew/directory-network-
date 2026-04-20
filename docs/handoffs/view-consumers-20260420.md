# Handoff — `active_deals_with_listings` view consumers
> **For:** Claude Code, next session.
> **Why:** Cowork (this session) authored `sql/migrations/2026-04-20-fix-active-deals-view.sql`. The migration changes the view to return `NULL` for `city` and `name` when the deal's `listing_slug` does not join to `master_listings` (orphan deals). Previously these returned `'Illinois'` and the slug, respectively.
> **Status:** Migration **NOT YET APPLIED** — Supabase MCP refused write operations this session ("cannot execute CREATE VIEW in a read-only transaction"). Matthew or a write-capable session must apply via SQL editor first.

## Consumers to retest after apply

Code is responsible for re-rendering each path with a deal whose `listing_slug` does NOT match a `master_listings` row, and confirming the page degrades gracefully on `null` city/name instead of crashing or showing the literal string "Illinois" / a kebab-case slug.

Concrete null-causing test fixtures (live tonight, all orphan deals):
- `altius-dispensary-carol-stream` (6 deals)
- `ivy-hall-peoria` (2 deals — Matthew's Ivy Hall flag)
- `natures-treatment-galesburg` (3 deals)
- `natures-treatment-milan` (2 deals)
- `bisa-lina-joliet`, `cookies-chicago`, `curaleaf-morris`, `mood-shine-chicago-heights`, `perception-cannabis-chicago` (1 deal each)

| # | File:Line | What it does | What to verify post-apply |
|---|-----------|--------------|----------------------------|
| 1 | `app/deals/[category]/page.tsx:110` | Top-of-funnel deals page (`/deals/all`, `/deals/flower`, `/deals/edibles`). Selects `*` from the view. Renders deal cards with city pill. | Card shows city="Peoria" for resolved Peoria deals; orphan rows render with no city pill (or graceful fallback) — never the literal "Illinois". JSON-LD `addressLocality` on line 323 must drop or null when city is null. Line 432's "Open the [city] deal page" must read "Open this deal page" when city is null. |
| 2 | `app/cannabis/illinois/[slug]/deals/page.tsx:60` | Per-city deals page (e.g., `/cannabis/illinois/peoria/deals`). Queries view with `.eq("city", citySlug)` upstream. | Orphan deals previously appeared on **every** city page because city='Illinois' matched no city slug — but city='Illinois' was also being filtered out. Verify: orphan deals now appear on no city page (city=null doesn't match any `.eq("city", ...)`). This is the correct behavior — orphans should be invisible until backfilled, not surfaced under a fake city. |
| 3 | `app/city/[city]/page.tsx:90` | City landing page deals strip. | Same as #2 — orphans drop from city pages, which is correct. |
| 4 | `app/api/deals/recommend/route.ts:77` | Server-side recommendation API. Comment at line 120 already flagged the issue. | Verify recommendations skip rows with null city when location-aware ranking is in play, OR fall through to a slug-derived city via `lib/cityNormalize.ts`. |
| 5 | `lib/weeklyDigest.ts:44` | Weekly Pro digest email. | Email lines like "Deals near you in {city}" must drop the segment when city is null. Worst case: digest sends "Deals near you in Illinois" to a Peoria subscriber, which is exactly the bug we're killing. |

## Supporting files (read the value but don't query the view)

| File | Note |
|------|------|
| `lib/cityNormalize.ts` | The canonical normalizer. Already explicitly rejects "Illinois" as a city sentinel. No changes needed — it now sees `null` instead of `'Illinois'` and that path was already covered. **Recommend Code refactor every `\|\| "Illinois"` callsite from `illinois-fallback-audit-20260420.md` to call `normalizeCity(deal.city, deal.listing_slug)` instead.** |
| `lib/dispensaryName.ts` | Reads `name` from the view. After the fix, `name` can be `null` for orphans (was the slug). Verify the helper's null path produces a non-empty display name (e.g., derive from slug here as a UI-layer fallback). |

## Pre-apply state (captured 2026-04-20 via Supabase MCP, read-only)

```
SELECT
  COUNT(*) FILTER (WHERE city = 'Illinois') AS city_equals_illinois,
  COUNT(*) FILTER (WHERE city IS NULL)      AS city_is_null,
  COUNT(*)                                   AS total_rows
FROM active_deals_with_listings;
-- → city_equals_illinois: 18, city_is_null: 0, total_rows: 56
```

After apply, expect: `city_equals_illinois: 0, city_is_null: 18, total_rows: 56`. The 18 nulls are exactly the 18 orphan-deal rows — they need data backfill (re-link `listing_slug` to a real `master_listings` slug), but that's a separate cleanup migration (see Task 6 / tomorrow's sprint).

## Sample row verification (for the migration file's verification block)

After apply, run and paste into `sql/migrations/2026-04-20-fix-active-deals-view.sql` verification block:

```sql
-- (a)
SELECT COUNT(*) FROM active_deals_with_listings WHERE city IS NULL;

-- (b) Three Peoria-resolved deals (city should = 'Peoria', not 'Illinois')
--     NOTE: depends on at least one Peoria-master-listing having an active deal.
--     Tonight none do (all 6 Peoria master_listings have 0 active deals).
--     If still empty after backfilling orphans, this query returns 0 rows
--     — that's a data gap, not a view bug.
SELECT slug, name, city
FROM active_deals_with_listings
WHERE city = 'Peoria'
LIMIT 3;

-- (c) Ivy Hall — orphan slug today
--     Pre-apply: city='Illinois' (the lie).
--     Post-apply: city=NULL (the truth).
--     Long-term fix: relink deal.listing_slug='ivy-hall-peoria' to
--     master_listings.slug='ivy-hall-dispensary' (city='Peoria').
SELECT listing_slug, name, city
FROM active_deals_with_listings
WHERE listing_slug = 'ivy-hall-peoria';
```

## Nothing-to-fix files (mentioned in audit, not view consumers)

- `app/deal/[id]/page.tsx` — queries `deals` table directly, not the view. Code's earlier session already fixed Ivy Hall here. No re-test needed against this migration.
- `app/dispensary/[slug]/page.tsx` — queries `master_listings` directly, not the view.
