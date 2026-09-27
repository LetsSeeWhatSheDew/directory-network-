# 2026-09-27 — Code: deal of the day, route deals, deal accuracy, price watch, sale-day hubs

Branch `claude/jolly-edison-xam4d4`, one PR against `main`. A parallel session was
rebuilding motion and the deal card UI, so this session added new routes, components
and lib files, and edited existing files only to wire them in. It did not touch deal
cards, the orb, exhale, haze or firefly components, global CSS, motion tokens, or
scraper code.

## Searched before building (what already existed and how it was reused)

| Asked for | Already there | What this session did |
|---|---|---|
| Deal of the day image | `/og/today` ("today's longest exhale"), `app/og/shared.tsx` kit, `lib/exhale` eligibility | New `lib/dealOfTheDay.ts` built on the same eligibility + `isFreshFeatured` + `capPerStore`; new `/og/deal-of-the-day` uses the shared kit (Backdrop, Orb, Wordmark, fonts) |
| Route deals | `/on-the-way` (town-by-town, hand-coded road graph) | Replaced by `/route` (store-by-store corridor, all 12 cities). `/on-the-way` now 308s to `/route/<from>-to-<to>`, mapping its old town slugs; nav, footer, guides and sitemap relinked |
| Accuracy score | `deal_reports` Yes/No (`/api/feedback`), `lib/confirmations.ts`, `deals.verified_at` | New `lib/dealAccuracy.ts` reads them with the service key, same pattern as `lib/confirmations.ts` |
| Price watch | `lib/dealWatch.ts` (deal_alerts + tags, HMAC confirm, one-tap stop, `sent:` claim), `/api/alerts/*`, `/api/cron/deal-alerts`, `lib/menuPrices.ts` | Added `price_watch` and `event_watch` kinds to the same table, API, confirm/unsubscribe routes, email shell and cron. No new table |
| Green Wednesday | `/green-wednesday` had the date, the explanation and how the day is tracked; it lacked a day-of signup | Added "email me that morning" (event watch) and an FAQ. New `/420` and `/710` share `components/EventHub.tsx` + `lib/events.ts` |
| AI visibility | `/llms.txt`, `/llms-full.txt`, `/mcp` (5 tools), sitemap, IndexNow | New lines/sections everywhere; MCP gains `deal_of_the_day`, `deals_on_route`, and `deal_accuracy` on `list_dispensaries` |

## Judgment calls
- **No migration.** `deal_alerts` was designed for "notify me when X drops below $30" and already stores watch bookkeeping as tags in `categories` (`lib/dealWatch.ts`). Price watches store `item:<slug>:<ref>`, `ref:<cents>`, optional `max:<cents>`; sale-day watches store `event:<id>`. The `max_price` column was not used because `sql/deals-schema.sql` might not match production. `lib/alertSubscribers.ts` now excludes all four watch types from the weekly report.
- **Deal of the day** ranks percent-off by percent, and ranks dollars-off as a share of `AVG_SPEND_BY_CATEGORY` (ordering only, never displayed). Ties rotate daily by an FNV hash of day + store. Runners-up are one per store. The 7-day featured-slot freshness rule applies.
- **Corridor**: 5 miles from the straight segment between city centers, measured on an equirectangular projection. Mile markers and detours are labeled as straight-line approximations. There are no paid map APIs: the Google Maps `dir` URLs need no key.
- **Accuracy**: 80% people (Yes share over 90 days, deduped per deal/browser/CT day) + 20% freshness (live deals re-found within 48h). Needs 5 taps before a score is shown. Page-level reports (`wrong_info`, `other`) don't count.
- **Price drops**: email when the out-the-door price falls ≥ $1.00 below the reference price (and under the optional ceiling). A rise raises the reference. At most one email a day.
- **Sale-day email** is one-shot. The watch is deactivated after sending, or quietly after the day passes.

## Verification
- `npm run test:unit` (new; `node --test` via tsx): 28 pass.
- `tsc --noEmit`: clean except the 4 pre-existing errors in `scripts/`.
- `eslint .`: 97 errors / 42 warnings, identical to the baseline before this work; none come from new code.
- `next build`: passes; the four common route pairs prerender.
- Screenshots in `docs/screenshots/features/` were rendered against `tests/fixtures/supabase-fixture.mjs`, which uses **SAMPLE data only** ("Sample …" stores). The sandbox could not reach Supabase or production.

## Not done / follow-ups
- The cron's price and event run was only exercised through unit tests and the API's validation and save path. A live `?dry=1` run after deploy would confirm it against real rows.
- `/og/today` still uses `longestExhale` without the freshness gate or tie rotation, so on rare days it can lead with a different deal than `/deal-of-the-day`. It was left untouched to stay out of the share-image/motion lane.
- Deal accuracy is shown on `/dispensary/[slug]` only (not `/l/`, which redirects there).
