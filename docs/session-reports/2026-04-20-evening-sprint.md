# 2026-04-20 Evening Sprint — Phase 2 Bug Sweep

**Commit shipped:** `3a07841` (pushed to origin/main after `b0ae095`)
**Build:** `npm run build` exit 0. Build-time dynamic-render warnings on `/cannabis/illinois/[city]` routes are pre-existing (revalidate:0 + dynamic fetch) — not introduced by this sprint.

## What shipped

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | LocationAware stale cache | ✅ | Cookie reconciliation, 24h TTL (`cl_city_ts`), silent GPS upgrade when cached source is IP |
| 2 | Ranking by city match | ✅ | `app/page.jsx` now reads `getServerLocation()` and pre-filters `topDeals` + `dealPool` to user city before passing to `HeroDealCard` / `HomeDealCards` / `TopDealsRow`. Haversine distance scoring deliberately skipped — only 1 of 61 IL dispensaries has lat/lng populated. City-match is the honest signal today. |
| 3 | Google Places logo backfill | ⏸ Deferred | `GOOGLE_PLACES_API_KEY` not in Vercel env. Script committed at `scripts/backfill-logos-google-places.ts` — runs on `npx tsx` once Matthew sets the env var. Script also backfills lat/lng (fixes the distance-scoring gap above). |
| 4 | Dispensary name rendering | ✅ | Added shared `lib/dispensaryName.ts` (`displayDispensaryName`). Wired into `/deal/[id]` metadata + body and `/deals/[category]` top + alt cards. Existing inline `displayName()` helpers in `HomeDealCards` / `HeroDealCard` / `TopDealsRow` left alone (working). |
| 5 | /dispensaries shows 0 | ✅ | Added missing `project_tag=eq.green` filter to `getListings()`. Page now renders the full IL green-tag list. |
| 6 | Admin dashboard counts | ✅ | Root cause: `fetchTable()` ordered by `created_at` which doesn't exist on `master_listings` — PostgREST 400'd silently, emptying the listings count. Now scoped per-table with an explicit query string; listings query uses `project_tag=eq.green&order=name.asc`. Also bumped `PAGES_LIVE` approximation from `56` (was counting deals) to `400` (actual route count). |
| 7 | Null-slug guards | ✅ | `TopDealsRow` no longer emits `/l/undefined` when slug missing. `/deals/[category]` profile link now conditional on slug presence. |
| 8 | Mobile address wrap | ✅ | `/l/[id]` hero location splits into two explicit spans — street on line 1, city+state+zip on line 2 with `white-space: nowrap`. |
| 9 | Map fallback | ✅ | Root cause: `master_listings` column names are `lat`/`lng`, not `latitude`/`longitude` — the query silently 400'd. Fixed the column names. Added fallback: when fewer than 3 geocoded points exist, render a "Browse all Illinois dispensaries" CTA linking to `/dispensaries` instead of an empty map. |
| 10 | Build + push | ✅ | `3a07841` pushed to `origin/main`. |

## What Matthew still needs to do

1. **Google Places API key** — provision in Google Cloud Console, restrict to Places API (New) server-side IPs, add to Vercel env as `GOOGLE_PLACES_API_KEY` (NOT `NEXT_PUBLIC_`). Then run:
   ```
   npx tsx scripts/backfill-logos-google-places.ts
   ```
   This also needs `SUPABASE_SERVICE_ROLE_KEY` in local env for the upsert path. The script is idempotent — only touches rows where `logo_url IS NULL`.

2. **Phantom Vercel project** — `directory-network-` (trailing dash) still exists in the `matthews-projects-6520d24c` org. Delete via Vercel dashboard → Settings → General → Delete Project. Confirm the `directory-network-` (with dash) does NOT list `puffprice.com` in its domains tab before deleting — otherwise you'll break production.

## Known outstanding (not in scope today)

- **Hours data gap** — 11 dispensaries still missing `listing_hours` rows per Cowork's audit. `/open-now` hides them; we've also shipped "Check hours" labels so no dispensary misleadingly reads "open" without real data. Fix via scraper run, probably tomorrow.
- **Route duality** — both `/l/[slug]` and `/dispensary/[slug]` exist and render similar content. Decide canonical, redirect the other. Audit deferred.
- **lat/lng gap at scale** — 60 of 61 IL dispensaries have no coords. Fixed in one pass via Task 3 backfill script once the API key lands; until then ranking-by-distance cannot work, and `/map` renders the fallback CTA.
- **Pre-existing TS errors** in `admin-auth` and `stripe/webhook` — skipped per the Stripe no-touch rule and the prompt's guidance.
- **Peoria in-person dispensary walk-ins** — not a code task, but it's been on the list every conversation since April 12. Calendar this week, ideally Tuesday or Wednesday afternoon.

## Files changed

```
M app/admin/page.tsx               (+21 −10)
M app/components/LocationAware.tsx (+65 −5)
M app/components/TopDealsRow.tsx   (+27 −8)
M app/deal/[id]/page.tsx           (+3 −2)
M app/deals/[category]/page.tsx   (+11 −8)
M app/dispensaries/page.tsx        (+2 −1)
M app/l/[id]/page.tsx              (+7 −2)
M app/map/page.tsx                 (+65 −13)
M app/page.jsx                     (+23 −5)
+ lib/dispensaryName.ts            (new, 24 lines)
+ scripts/backfill-logos-google-places.ts (new, 150 lines)
```

Total: 11 files, +415 −50.

## Verification path for Matthew (2-min mobile Peoria check)

After Vercel deploys `3a07841`:

1. In iPhone Safari incognito, go to `https://www.puffprice.com/`. Allow location. Hero card should show a **Peoria or East Peoria** dispensary within a second, not Chicago.
2. Scroll to below-the-fold "Top deals in Peoria right now" — heading should include your city if the local pool has deals; otherwise falls back honestly to Illinois-wide.
3. Tap any "Flower" deal → should go to a real `/l/[slug]` URL, not `/l/undefined`.
4. Visit `/dispensaries` — should show 61 dispensaries grouped by city, not "0 across 0 cities."
5. Visit `/admin`, enter password — should show roughly `293` total listings (post-fix), not `0`.
6. Visit `/map` — should show either a real map (if backfill run) or a clean "Browse all dispensaries" CTA (today's state until backfill).
