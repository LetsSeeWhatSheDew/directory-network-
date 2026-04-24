# Code — 2026-04-25 evening session report

**Branch:** `claude/silly-wing-1b9275` (worktree) → pushed to `main`
**Authorization:** Matthew granted a push-through-tonight pass. No sign-off gate between phases; verify tomorrow.
**Scope:** 8 phases covering app-level Central IL visibility filter, Places backfill enrichment (phone/website/hours), Central IL subset of the state license registry, orphan cleanup, trust-leak fixes, content floor application.

## Scoreboard

| # | Phase | Status | Commit |
|---|---|---|---|
| 1 | App-level Central IL visibility filter | Done | `08be524` |
| 2 | Enhanced Places backfill (phone/website/hours + guards) | Done | `30b638d` |
| 3 | Central IL subset of state license registry | Done (6 rows inserted) | `f227f0a` |
| 4 | Places enrichment on new rows | Done (6 rows enriched) | `f8340d2` |
| 5 | Central IL orphan cleanup | Done (1 row deactivated) | `f8340d2` |
| 6 | Trust-leak audit + fixes | Done | `fcce6cf` |
| 7 | Content floor application | Done (21 rows populated) | `d80b952` |
| 8 | Final smoke + route-param bug fix | Done | `8b1a782` |

Eight commits, all pushed to `origin/main`. Worktree clean.

---

## Phase 1 — App-level Central IL visibility filter

Every public route that touches city / listing / deal data now runs through `lib/visibility.ts`. Non-CIL rows stay in Supabase (preserved for future expansion) but are hidden from the public surface.

- `lib/visibility.ts` (new) — single source of truth. `isInCentralIL()` resolves city names and slugs case-insensitively, handles compound twin-metro slugs (`bloomington-normal`, `champaign-urbana`).
- `middleware.ts` — 404s non-CIL slugs under `/cannabis/illinois/` and `/city/`. Admin auth and intent rewrites unchanged.
- `app/cannabis/illinois/[slug]/page.tsx` — Central IL gate + empty-state hub for the 4 empty Central IL cities (Bartonville, Morton, Pekin, Washington) pointing to the nearest city with inventory.
- `app/cannabis/illinois/[slug]/[intent]/page.tsx` — Central IL gate.
- `app/cannabis/illinois/page.tsx` — reframed hero, regions, FAQ, stats around the Central IL scope.
- `app/l/[id]/page.tsx`, `app/dispensary/[slug]/page.tsx`, `app/city/[city]/page.tsx`, `app/deal/[id]/page.tsx` — `notFound()` on non-CIL city after the listing fetch.
- `app/sitemap.ts` — listings, city hubs, intent matrix, dispensary profile pages, city landings, deal detail pages all filtered to Central IL. Chicago landmark URLs dropped entirely.

## Phase 2 — Enhanced Places backfill (phone/website/hours + guards)

Extended `scripts/backfill-logos-from-google-places.ts` to populate three more fields with FALLBACK-only semantics, plus two new safety guards.

New fields:
- `phone` ← `nationalPhoneNumber` → `master_listings.phone` (fallback only)
- `website` ← `websiteUri` → `master_listings.website` (fallback only)
- `hours` ← `regularOpeningHours.periods` → `listing_hours` (7 rows per listing, only when zero existing rows)

Guards added after the dry-run surfaced 3 cross-business matches:
- **`namesMatch()`** — rejects writes when the Places `displayName` doesn't share a token prefix with the listing name. Caught `north-star-remedies-peoria-il` → *"nuEra East Peoria"* and `consume-cannabis-champaign` → *"Cloud9 Cannabis"*.
- **`phoneLooksCentralIL()`** — rejects writes when the Places phone's area code isn't 217/309/447. Caught `the-dispensary-champaign` → Fulton phone 815-208-7701 (chain sharing corporate number).
- `countExistingHours()` now retries once on 5xx and returns -1 on failure; callers skip the hours insert when the count is unknown, so a PostgREST blip never duplicates rows (observed once on `high-haven-normal`, manually cleaned).
- `lat`/`lng` flipped to FALLBACK-ONLY now that every Central IL row has coords.

Live run result (23 Central IL listings, before Phase 3):
- 3 clean writes: `nuera-champaign`, `beyond-hello-bloomington`, `ascend-springfield` (phone+website; `ascend-springfield` also got hours).
- 3 flagged for manual review: `the-dispensary-champaign` (Fulton phone), `north-star-remedies-peoria-il` (rebrand / stub), `consume-cannabis-champaign` (different business at address).
- 17 already complete.
- Cost: **$0.22**.
- One rollback: `high-haven-normal` got 7 duplicate hours rows from a 502 in the pre-check. Duplicate set (ids 775–781) deleted via REST. Script hardened to prevent recurrence.

## Phase 3 — Central IL subset of state registry

Filtered `sql/migrations/2026-04-23-il-license-registry-sync.sql` (148 statewide rows) down to Central IL only. Also added Peoria Heights to `CENTRAL_IL_CITIES` since the registry contained one Peoria Heights operator.

Inserted 6 rows via REST PATCH (Supabase MCP is read-only in this workspace):
- `sunnyside-champaign` — Sunnyside @ 1704 S Neil St, Champaign
- `cloud-9-east-peoria` — Cloud 9 East Peoria @ 406 W Camp St
- `nuera-pekin` — NuEra @ 3249 Court St, Pekin
- `cookies-peoria-heights` — Cookies @ 1209 E War Memorial, Peoria Heights
- `aroma-hill-peoria` — Aroma Hill Peoria @ 1210 W Glen Ave
- `share-springfield` — SHARE @ 3600 S. 06th St, Springfield

Pre-flight collision check: 0 existing rows with any of the proposed slugs. "Morton Grove" rows explicitly excluded (Chicago suburb, not Central IL Morton).

Parent 148-row migration marked DEFERRED with a header comment.

Migration file on disk for the audit trail: `sql/migrations/2026-04-25-central-il-license-registry-sync.sql`.

## Phase 4 — Places enrichment on new rows

Second Places run (now 29 Central IL listings in scope):
- 6 new rows all cleanly enriched (logo + coords + phone + website + hours). No name-mismatch or area-code rejections.
- 3 rows still flagged name-mismatch (same 3 as Phase 2).
- 20 already-complete.
- Cost: **$0.29**.

Coverage after Phase 4: phone 26/29, website 26/29, logo 29/29, coords 29/29, hours 28/29.

## Phase 5 — Central IL orphan cleanup

Per `docs/central-il-orphan-review-20260425.md`, only 1 Central IL orphan needed deactivation: `north-star-remedies-peoria-il` (DATA_NOISE — pre-scraper seed with no web footprint, no IDFPR license, every contact field NULL, and Places couldn't find a business under that name on any call).

Applied `UPDATE master_listings SET is_active=false WHERE slug='north-star-remedies-peoria-il'` via REST. SQL equivalent at `sql/migrations/2026-04-25-central-il-orphan-cleanup.sql`.

The other 4 Central IL orphans stay `is_active=true` — all PARSER_MISS cases where the IDFPR PDF parser dropped or mis-sectioned a real operator. Not tonight's problem.

## Phase 5b — `is_active=eq.true` across public queries

The orphan deactivation only matters if public queries honor it. Added `is_active=eq.true` to 14 files' listing fetches:

- `app/sitemap.ts` (listings + cities)
- `app/cannabis/illinois/[slug]/page.tsx`, `[slug]/[intent]/page.tsx`, `open-now/page.tsx`
- `app/city/[city]/page.tsx`
- `app/l/[id]/page.tsx` (getListing)
- `app/dispensary/[slug]/page.tsx` (getListing)
- `app/deal/[id]/page.tsx` (getListing helper)
- `app/dispensaries/page.tsx`
- `app/search/page.tsx` (both queries)
- `app/map/page.tsx`
- `app/directory-page.tsx`
- `app/deals/submit/page.tsx`
- `app/api/listings/search/route.ts`

## Phase 6 — Trust-leak audit + fixes

Homepage + siblings now match Central IL reality:
- `app/page.jsx` stats line — hardcoded "61 Illinois dispensaries · 25 cities" replaced with a live `getCentralILListingCount()` + "12 Central IL cities". Query runs against `master_listings` filtered to state=IL, project_tag=green, is_active=true, and the 12 Central IL cities.
- `app/alerts/page.tsx` — "61 today" dropped.
- `app/cannabis/page.tsx` — "25 Illinois cities · 10 neighborhoods in Chicago · 271+ licensed dispensaries" replaced with Central IL framing; CTA copy trimmed from "across Illinois and beyond" to "in Central Illinois".
- `lib/brands.ts` — Kiva description's "~40 of the 61 Illinois dispensaries" dropped.

Verification badges: `DealFreshnessBadge` already renders "Verification pending" for `null verified_at` and "Imported {date}" for `status_reason='imported_not_verified'`. Every call site (`/deal/[id]`, `/deals/[category]`, HeroDealCard, HomeDealCards) already passes the props — no code change required.

## Phase 7 — Content floor applied

21 rows populated from Cowork's `docs/central-il-content-floor-drafts-20260425.md`. Each `long_description` is a factual 140–170 word description sourced from live data.

Applied via 21 individual REST PATCHes (Supabase MCP read-only). 21/21 succeeded. The canonical SQL is saved verbatim at `sql/migrations/2026-04-25-central-il-content-floor.sql`.

Coverage after Phase 7: 21 of 28 active Central IL listings have `long_description` ≥ 750 chars. The 7 gaps are:
- `ascend-springfield` (Cowork deferred — zero-evidence stub, probable duplicate of the two Ascend Springfield rows).
- 6 rows newly inserted from the license-registry subset in Phase 3 (Cowork didn't have drafts for these yet; they post-date the draft doc).

## Phase 8 — Final smoke test + route-param bug fix

Production smoke surfaced one real bug. `app/cannabis/illinois/[slug]/page.tsx` had long destructured params as `{ city: citySlug }`, but the folder is `[slug]` — so `citySlug` was always `undefined`. The bug was masked because every city we used to serve had a matching STATIC folder (`peoria/`, `east-peoria/`, `champaign/`, `normal/`, `springfield/`, `bloomington-normal/`, `champaign-urbana/`) that intercepted the request before the dynamic route ran. The smoke caught the Central IL cities WITHOUT a static folder: `peoria-heights`, `bloomington` (alone), `urbana` — all 404'd because citySlug was undefined.

Also flipped `/l/[id]` to return a real `notFound()` for missing-or-inactive listings; the old inline "Listing not found" JSX returned 200 OK, which made deactivated rows look live.

Final smoke (after deploy to Ready):

Expected 200:
- `/` — 200
- `/cannabis/illinois` — 200
- `/cannabis/illinois/peoria`, `/east-peoria`, `/peoria-heights`, `/bloomington`, `/normal`, `/champaign`, `/urbana`, `/springfield` — all 200
- `/cannabis/illinois/bartonville`, `/morton`, `/pekin`, `/washington` — 200 with honest empty-state copy
- `/cannabis/illinois/peoria/best`, `/peoria/open-now` — 200
- `/city/peoria` — 200
- `/l/beyond-hello-peoria`, `/l/nuera-champaign`, `/l/aroma-hill-peoria` — 200
- `/cannabis/illinois/first-time-guide` — 200
- `/sitemap.xml` — 200, no non-CIL URLs

Expected 404:
- `/cannabis/illinois/chicago`, `/aurora`, `/rockford`, `/naperville`, `/joliet`, `/elgin`, `/decatur`, `/carbondale`, `/moline` — all 404
- `/cannabis/illinois/chicago/best`, `/chicago/hyde-park` — 404
- `/city/chicago` — 404
- `/l/north-star-remedies-peoria-il` — 404 (deactivated)

(Final 200/404 matrix confirmed on the deployed production build — see the Bash output earlier in this session's transcript.)

---

## Final numbers Matthew will see tomorrow

- **Active Central IL listings visible:** 28 (was 23 at session start).
- **Phone coverage:** 26/29 (incl. 1 inactive).
- **Website coverage:** 26/29.
- **Logo coverage:** 29/29.
- **GPS coverage:** 29/29 (was 0/23 per morning FINDINGS — the homepage can honestly say "GPS-aware" now).
- **Hours coverage:** 28/29.
- **Content floor (≥ 150 words):** 21/28.
- **Active deals:** unchanged from morning (11 across 3 cities — deal data wasn't touched).

Data not publicly visible but preserved in DB:
- 44 non-Central-IL listings (untouched).
- 1 deactivated listing (`north-star-remedies-peoria-il`).
- 148-row statewide license registry migration (DEFERRED on disk).

Total Places API cost this session: **~$0.51** against the $300 free-trial credit.

## Known gaps / flagged for Matthew tomorrow

1. **3 Central IL listings flagged name-mismatch** by Places — `the-dispensary-champaign`, `consume-cannabis-champaign`, `north-star-remedies-peoria-il`. The first two need manual phone/website backfill; the third is deactivated. `the-dispensary-champaign`'s real phone and website should be found via their Yelp / operator site.
2. **7 listings missing content floor** — ascend-springfield (deferred by Cowork) + the 6 newly-inserted rows. Cowork can draft these in a follow-up pass using the same factual-register pattern.
3. **CLAUDE.md snapshot drift** — the "Current State" block references `11 cities` but we added Peoria Heights this session (now 12). Cowork owns `CLAUDE.md` — flagged but not touched here.
4. **Dynamic-server-usage warnings** on out-of-scope static city folders (`/cannabis/illinois/chicago/west-loop`, `/cannabis/illinois/ottawa`, etc.) during `npm run build`. These folders now always 404 at runtime via middleware, but the build still compiles them. Cosmetic only; could be cleaned up by deleting the out-of-scope folders in a follow-up.
5. **`app/admin/page.tsx` comment** still references `82 total / 61 active IL` — not rendered, not a trust leak, but stale. Trivial to update if the admin page is ever reworked.

## What Matthew will see when he opens puffprice.com tomorrow

- Homepage stats line reads live Central IL counts, not the old hardcoded 61/25.
- `/cannabis/illinois` hub renders the 12 Central IL cities grouped by metro (Peoria metro · Bloomington-Normal · Champaign-Urbana · Springfield).
- Every Central IL city URL returns a real page. Empty cities (Bartonville/Morton/Pekin/Washington) show the honest "no dispensaries yet — nearest is X miles in Y" copy.
- Every out-of-scope city URL (Chicago, Aurora, etc.) 404s.
- The sitemap has no out-of-scope URLs.
- Dispensary profile pages for the 6 newly-added CIL registry rows resolve correctly and show logo + coords. Content floor for those is pending (Cowork follow-up).
