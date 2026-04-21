# Handoff — "🔥 Top 5% deal" badge

**From:** Cowork
**To:** Code
**Date:** 2026-04-21
**Pairs with:**
- `sql/migrations/2026-04-21-deal-ranking.sql` (NOT YET APPLIED)
- `sql/queries/refresh-deal-rankings.sql`
- `docs/audits/deal-data-freshness-20260421.md` (context)

## Why

Matthew killed the A/B/C/D letter-grade system. It implied a level of comparative rigor we don't have, and graded mediocre deals as "B+" which is misleading. Replacing it with a single badge — "🔥 Top 5% deal" — that only fires on genuinely extraordinary deals, and shows nothing otherwise.

Empty state is the goal when no deal qualifies. Silence is honest.

## What you read

A new materialized view `public.deal_rankings` keyed by `deal_id`. The column you care about is `is_top_5_percent boolean`.

```sql
SELECT is_top_5_percent FROM public.deal_rankings WHERE deal_id = $1;
```

If the row exists and `is_top_5_percent IS TRUE` → render the badge. Otherwise render nothing.

If the row does not exist for a deal_id (because the deal isn't `discount_type = 'percent_off'` and got filtered out of the ranking) → render nothing.

## What to render

```
🔥 Top 5% deal
```

Single short label. No tooltip required for v1. If you want a tooltip later, copy: "Top 5% of percent-off deals in this category right now."

## Where it goes

Everywhere the A/B/C/D grade currently renders, swap in this conditional badge. Best guess of locations to audit (Code lane to confirm; Cowork is not allowed in app/components):

- `app/page.jsx` — hero deal cards
- `app/deals/[category]/page.tsx` — deal grid
- `app/l/[id]/page.tsx` — listing detail card
- Any shared `DealCard` component under `components/`

If a category currently sorts by grade, swap to sort by `composite_rank DESC` (read from the same view).

## Ranking design (so you understand what `is_top_5_percent` actually means)

The view ranks **per category** (`category` column on `deals`), not globally. A 30%-off-flower deal is not the same thing as a 30%-off-edibles deal — edibles regularly run 50% off, flower rarely does. Comparing within category is the only honest move.

The score is composite:

- **If `price_per_gram` is known**: `(1 - ppg_percentile) * 0.6 + discount_percentile * 0.4`. Cheaper gram weighted slightly heavier than bigger discount.
- **If PPG is null** (the case for 100% of active rows today): `discount_percentile`. Pure discount-driven.

A deal is `is_top_5_percent = TRUE` when:
1. Its category contains **at least 20 active deals** (statistical floor — see below), AND
2. Its composite score is **≥ 0.95** within that category.

## What this looks like today

Active rows by category and the badge it can produce right now:

| Category | Active deals | Above floor? | Badge possible? |
|---|---|---|---|
| all | 31 | ✅ yes | yes — 1–2 deals fire |
| flower | 10 | ❌ no | none |
| edibles | 7 | ❌ no | none |
| concentrate | 5 | ❌ no | none |
| vapes | 3 | ❌ no | none |

So today the homepage will probably show one or two "🔥 Top 5%" badges, all on deals tagged `category = 'all'`. The flower / edibles / concentrate / vapes pages will show **no** badge.

That is the desired outcome. As scrapers grow coverage and per-category counts cross 20, badges will start firing on those pages too. No code change needed.

## What about deals that aren't `percent_off`?

Excluded from ranking. Three deals in the active set are `fixed_price` (e.g., "5 for $100") or `dollar_off` (e.g., "$10 off"). Comparing 25% off to "$10 off" is meaningless without knowing the base price, which we usually don't have. They never appear in `deal_rankings` at all — your `LEFT JOIN` returns NULL → no badge. Correct behavior.

When the scraper lands `original_price` and `sale_price` reliably, we can recompute an effective % discount for these and fold them in. Not today.

## Cache freshness

The view is a `MATERIALIZED VIEW` — it's a snapshot, not a live query. The daily stale-deal cron refreshes it (`REFRESH MATERIALIZED VIEW CONCURRENTLY public.deal_rankings;`) right after the staleness pass. So a deal that gets deactivated at 04:00 UTC drops out of the rankings in the same job, before the next page render.

If you ever need a manual refresh (e.g., after an emergency import), the query at `sql/queries/refresh-deal-rankings.sql` is safe to run on demand.

## Future variant — location-scoped badge ("🔥 Top deal in Peoria")

Spec only. Not implemented yet — flagged here so we don't reinvent it later.

```sql
-- in deal_rankings v2
percent_rank() OVER (
  PARTITION BY category, city
  ORDER BY composite_score DESC
) AS city_rank,
percent_rank() OVER (
  PARTITION BY category
  ORDER BY composite_score DESC
) AS state_rank
```

UI rule:
- If `state_rank ≥ 0.95` → "🔥 Top 5% in Illinois".
- Else if `city_rank ≥ 0.95` AND city has ≥ 10 deals → "🔥 Top deal in {City}".
- Else → no badge.

Statewide takes precedence over local. We're not surfacing both at once — the user only needs the strongest accurate signal.

This requires the view to know which city each listing is in, which means joining `master_listings` on `listing_slug`. Not a v1 problem. Defer.

## Acceptance for v1

- Migration applied; `\d public.deal_rankings` shows the view, indexes, and a non-zero row count.
- The query `SELECT is_top_5_percent FROM public.deal_rankings WHERE deal_id = $1` returns true/false in <5ms for a known deal_id.
- A/B/C/D letter grades are removed from the codebase entirely. `grep -rn "grade.*[ABCD]\|letterGrade\|gradeLetter" app/ components/ lib/` returns nothing user-facing.
- `🔥 Top 5% deal` renders on the deal IDs that the view flags TRUE, and on no others.
- A deal that gets deactivated by the staleness cron disappears from rankings within the next refresh cycle (same job).
- No badge shows on category pages where `category_size < 20`. The pages still render — they just don't crown anything.

## Out of scope

- The location-scoped variant above.
- Visual treatment / hover state / tooltip.
- Sorting deal grids by `composite_rank` (mentioned above as a swap from grade-sort, but if the grade-sort never existed at the SQL level, you can defer).
