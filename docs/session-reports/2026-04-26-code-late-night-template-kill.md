# Code — 2026-04-26 late-night session — kill `/cannabis/illinois/*` template tree

**Branch:** `claude/competent-kapitsa-d57746` (worktree) → pushed to `main`
**Authorization:** Matthew granted full push-through authority on the 8-phase plan, told me to verify after.
**Starting HEAD:** `ede5d22` (the previous full-day session ended here).
**Ending HEAD:** `64d2087`.
**Vercel:** Ready at the time of the smoke matrix below.

## Scoreboard

| # | Phase | Status | Commit |
|---|---|---|---|
| 1 | Diagnose template duplication + verify production state | Done | _(diagnosis only)_ |
| 2 | Middleware redirects + delete legacy template tree | Done | `3896d07` |
| 3 | Sitemap + canonical reconciliation | Done | `bff60e7` |
| 4 | Homepage scope cleanup (Illinois → Central IL, hide Index) | Done | `4f41715` |
| 5 | Deal freshness badge consistency (browse vs detail) | Done | `64d2087` |
| 6 | `/city/[slug]` template polish (metro count + freshness copy) | Done | `64d2087` |
| 7 | Pull Cowork updates | Done (no-op — origin clean) | n/a |
| 8 | Final smoke + this report | Done | this commit |

Four feature commits + one session-report commit, all pushed to `origin/main`. Worktree clean at session end.

---

## Phase 1 — Diagnosis: production was already correct

The prompt assumed `/cannabis/illinois` was still serving "270+ Licensed dispensaries · 34 Cities covered" and `/cannabis/illinois/peoria` was still rendering "approximately 10 dispensaries · We're building the Peoria dispensary directory now." **Production at session start (HEAD=`ede5d22`) was already serving the refactored Central-IL-only content** — the previous full-day session had rewritten the templates in place. WebFetch on both URLs confirmed:

- `/cannabis/illinois` h1 = "Cannabis Dispensaries in Central Illinois", 12 cities listed, no "270+" claim anywhere.
- `/cannabis/illinois/peoria` h1 = "Dispensaries in Peoria, Illinois", "5 listings — featured first", proper FAQ.

So the underlying intent of the session (consolidate the duplicate template system, redirect old URLs to the canonical `/city/[city]` template) still held — the cleanup was just less urgent than the prompt implied.

The two parallel templates that existed:

1. `app/cannabis/illinois/[slug]/page.tsx` — the dynamic catchall that shipped the inline JSX hub, FAQ schema, sidebar, and empty-state branch (Bartonville/Morton/Pekin/Washington).
2. `app/cannabis/illinois/<city>/page.tsx` × 36 cities — thin wrappers around `<CityPage config={...} listings={...} />`. The static-segment file wins over the dynamic catchall, so Peoria / East Peoria / Champaign / etc. used these.
3. `app/city/[city]/page.tsx` — the new canonical template (Cowork landed it April 25). Distinct visual style, deal-forward, metro-aware via `metroCities()`.

Plus `app/cannabis/illinois/page.tsx` (the IL hub) and the Chicago neighborhood subroutes (10 of them) under `app/cannabis/illinois/chicago/`.

---

## Phase 2 — Middleware redirects + legacy-tree deletion (commit `3896d07`)

Matthew locked Option A: redirect `/cannabis/illinois/*` → `/city/*`, kill the old files.

### 2.1 middleware.ts — added the redirect chain

- `/cannabis/illinois` and `/cannabis/illinois/` → 308 redirect to `/`. The homepage absorbed the directory function months ago; the hub's only purpose was the city grid, which now lives on the homepage and city shortcuts.
- `/cannabis/illinois/<slug>(/...)` →
  - if `slug` is in `CANNABIS_IL_NON_CITY_SLUGS` (first-time-guide, laws, open-now, plus get-listed/sitemap/robots): pass through unchanged.
  - else if `isInCentralIL(slug)`: 308 redirect to `/city/<slug>`.
  - else: `404` (Chicago, Aurora, Rockford, etc. — still gone).
- `/city/<slug>` non-CIL: 404 (preserves the existing scope gate).

Matcher updated to include `/cannabis/illinois` (the bare hub path) so the hub redirect actually fires.

### 2.2 Files deleted (entire list)

- `app/cannabis/illinois/[slug]/{page,deals/page,opengraph-image,[intent]/page}.tsx`
- `app/cannabis/illinois/page.tsx` (the hub)
- `app/cannabis/illinois/_helpers.ts` (only used by the deleted `[slug]` and city-wrapper files)
- 35 city subdirectories under `app/cannabis/illinois/` (the static wrappers): addison, aurora, bloomington-normal, canton, carbondale, champaign, champaign-urbana, chicago, collinsville, danville, decatur, east-peoria, effingham, elgin, galesburg, jacksonville, joliet, litchfield, marion, moline, morris, mundelein, naperville, normal, north-aurora, ottawa, peoria, quincy, rock-island, rockford, schaumburg, springfield, sterling, sycamore, waukegan
- The 10 Chicago neighborhood pages went with the chicago/ deletion (hyde-park, lakeview, lincoln-park, logan-square, near-magnificent-mile, near-navy-pier, near-ohare, near-wrigley-field, pilsen, river-north, south-loop, west-loop, wicker-park, wrigleyville).
- `components/NeighborhoodPage.tsx` (only consumers were the deleted Chicago neighborhood pages — verified via grep before delete).
- `config/neighborhoods/chicago/*.ts` × 10 (orphaned after NeighborhoodPage deletion).

### 2.3 Files KEPT (the hard-constraint exceptions)

- `app/cannabis/illinois/first-time-guide/page.tsx`
- `app/cannabis/illinois/laws/page.tsx`
- `app/cannabis/illinois/open-now/page.tsx`
- `app/cannabis/illinois/layout.tsx` (used by all three content pages)

### 2.4 References-to-deleted-routes that I updated

- `app/components/MobileNavMenu.tsx`: "Browse by city" link → `/`.
- `app/dispensaries/page.tsx`: per-city "Deals in {city} →" link → `/city/<slug>` (was `/cannabis/illinois/<slug>/deals`).
- `app/cannabis/page.tsx` (the multi-state hub): the broken `/cannabis/illinois/chicago` link in the "Popular Guides" footer chip got swapped for `/city/peoria`. The "Illinois Dispensaries" link became "Central Illinois Dispensaries" pointing at `/`. Both `/cannabis/illinois` links in the body now point at `/` directly.

### 2.5 References I deliberately left alone

- `components/CityPage.tsx` — still used by the Missouri pages. Internal `/cannabis/illinois/<slug>` links inside it are now broken for MO consumers (after redirect, they 308 to `/city/<slug>` which 404s for non-CIL cities). This is a pre-existing latent bug in MO pages, not introduced here. Hard constraint: don't touch Missouri.
- `app/page.jsx` line 959 (`/cannabis/illinois/open-now` in the desktop nav) — points to a preserved content page, no change needed.
- `app/alerts/confirmed/page.tsx` — links to the two preserved content pages (open-now + first-time-guide).
- `config/cities/illinois/*.ts` × 36 — orphaned config files. Harmless dead code; explicit cleanup deferred.

`next build` locally: succeeded. Surviving cannabis routes are exactly first-time-guide / laws / open-now plus the missouri tree (untouched).

---

## Phase 3 — Sitemap + canonical reconciliation (commit `bff60e7`)

`app/sitemap.ts` was emitting the legacy `/cannabis/illinois/<city>` URLs as canonical, plus a per-city intent matrix (best/open-now/recreational/deals × all CIL cities). All of those are now redirects, so they shouldn't be in the sitemap.

Changes:
- Dropped `/cannabis/illinois` (the hub) from `base[]`.
- Removed `IL_CITY_PAGES`, `cityUrls`, and `intentUrls` sections entirely.
- Removed `landmarkUrls` (already an empty no-op).
- Switched `cityLandingUrls` to source from the `CENTRAL_IL_CITIES` constant directly (12 cities) instead of the DB-derived `cities` set. Means the empty cities (Bartonville, Morton, Washington) are guaranteed to be in the sitemap, not gated on having any active listings.
- Kept the 3 surviving content pages (first-time-guide, laws, open-now) under `staticPages[]`.

`lib/visibility.ts`: removed `pekin` from `EMPTY_CENTRAL_IL_CITIES`. nuera-pekin is now an active listing in the DB; the empty-state copy was wrong. (The `EMPTY_CENTRAL_IL_CITIES` helper itself is now dead code after the [slug] page was deleted, but I left the constant in place for future use — Bartonville, Morton, Washington are still genuinely empty and the metadata about nearest-city is useful.)

Sitemap diff (live): old `/cannabis/illinois/<city>` URLs go from N entries to 0; new `/city/<slug>` URLs cover all 12 CENTRAL_IL_CITIES.

---

## Phase 4 — Homepage scope cleanup (commit `4f41715`)

### 4.1 — Top-nav + footer link updates in `app/page.jsx`

- Top nav "Browse Central IL" link: `/cannabis/illinois` → `/`.
- City-shortcut row "Browse all Central IL cities →" link: `/cannabis/illinois` → `/dispensaries` (the all-by-city directory page; better fit than the homepage itself).
- Footer "Illinois" link → `/`. Label rebadged "Central Illinois".

### 4.2 — Hero deal copy: "Illinois" → "Central Illinois"

- `HeroDealCard.tsx` skeleton: "Finding the top Illinois deal…" → "Finding the top Central Illinois deal…"
- `HeroDealCard.tsx` null-city header: "Top Illinois deal right now" → "Top Central Illinois deal right now"
- `HeroDealCard.tsx` null-city CTA: "See more Illinois deals →" → "See more Central Illinois deals →"
- `SavingsCallout.tsx` null-city no-savings: "Showing the best active deal in Illinois right now." → "…Central Illinois right now."
- `SavingsCallout.tsx` null-city with-savings: "Best deal in Illinois right now saves $X." → "Best deal in Central Illinois right now saves $X."

### 4.3 — PuffPriceIndexCard: hide entirely until threshold (option a)

`PuffPriceIndexCard.tsx`: added an early return of `null` when `result.available === false`. Empty placeholders ("$—.——/g · 0 of 10 deals tracked") were doing more harm than good. The `LiveState` keeps its existing "Illinois flower average" copy because the Index is intentionally statewide per `lib/puffpriceIndex.ts` and `docs/ZONE4-strategy.md`. The `ComingSoonState` function is preserved in the file but unreachable today; commented in place so we can resurface it later if Index marketing wants the progress bar back.

### 4.4 — Footer "31 deals in April" honest framing

The query in `lib/stats.ts` (`getDealsRunThisMonth`) counts deals where `created_at` is in the current month — including deals later deactivated (NOXX false positive, the 53 Leafly/Weedmaps deals from the cutover, etc.). So 31 was technically defensible but the verb "ran" implied they were active. Per the prompt's "Honest framing wins": kept the query, changed the copy from

> "Central IL dispensaries ran **31** deals in April"

to

> "We tracked **31** Central IL deals in April"

— which is accurate to what the metric measures (April creations regardless of current active status).

---

## Phase 5 — Deal freshness badge consistency (commit `64d2087` part 1)

### Root cause of the inconsistency

`/l/[id]/page.tsx` (the listing detail page) fetched deals with this PostgREST `select`:

```
select=id,title,description,category,discount_value,discount_unit,discount_type,original_price,sale_price,expires_at,is_recurring
```

It then rendered `<DealFreshnessBadge verifiedAt={(activeDeal as any).verified_at} statusReason={(activeDeal as any).status_reason} />`. Since `verified_at` and `status_reason` were never on the wire, both props were `undefined`, and the badge fell into its `if (!verifiedAt) ...` branch and rendered "Verification pending" for every deal.

Browse views (homepage, /deals/[category], HomeDealCards) were reading from the `active_deals_with_listings` view which DOES expose `verified_at`, so they correctly showed "Verified Apr 24."

### Fix

`app/l/[id]/page.tsx`:
- Added `verified_at?: string | null` and `status_reason?: string | null` to the `ActiveDeal` type.
- Added `,verified_at,status_reason` to BOTH `select` strings (`getTopActiveDeal` line 168, `getAllActiveDeals` line 179).

DealFreshnessBadge component itself is untouched — it was already a single shared component and the bug was strictly upstream in the data query.

### Production verification

```
$ curl -sL https://www.puffprice.com/l/noxx-east-peoria | sed 's/<!--[^>]*-->//g' | grep -oE "(Verified [A-Z][a-z]{2} [0-9]+|Verification pending)"
Verified Apr 24

$ curl -sL https://www.puffprice.com/deals/all | grep -oE "Verified [A-Z][a-z]{2} [0-9]+" | sort | uniq -c
   2 Verified Apr 24
```

Browse and detail views agree. The NOXX deal that was said to flip-flop now reads "Verified Apr 24" in both places.

---

## Phase 6 — `/city/[slug]` template polish (commit `64d2087` part 2)

### 6.1 — Metro count labeling

`/city/peoria` was rendering "8 dispensaries in Peoria" because `metroCities("Peoria")` expands to `["Peoria", "East Peoria", "Bartonville"]` and the listings query covered all three. Decision (a) per the prompt: label the metro instead of unwinding the query.

`app/city/[city]/page.tsx`, the listings section header:

```jsx
{listings.length} dispensar{listings.length === 1 ? "y" : "ies"} in
{metros.length > 1 ? ` the ${city} metro` : ` ${city}, IL`}
```

Production check:
- `/city/peoria` → "8 dispensaries in the Peoria metro" ✓
- `/city/peoria-heights` → "1 dispensary in Peoria Heights, IL" ✓ (no metro alias for Peoria Heights, so the metros array is just `[city]` — singular city wording fires)

### 6.2 — Homepage freshness copy

`app/components/HomeDealCards.tsx` `freshnessLabel()`:
- Old: `< 24h → "Updated today"`, `< 72h → "Updated Xh ago"`, `≥ 72h → null`.
- New: `< 24h → "Last verified today"`, `< 72h → "Last verified {Mon Day}"` (absolute date), `≥ 72h → null`.

Matches the per-deal `DealFreshnessBadge` wording so the labels reinforce instead of competing. Production check: `Last verified Apr 24` is now the live text.

---

## Phase 7 — Cowork sync

`git fetch origin` showed nothing new on origin/main between `ede5d22` and the start of this session. No conflicts to resolve.

---

## Phase 8 — Final production smoke matrix

Run after `64d2087` flipped Vercel Ready.

```
=== Status code matrix ===
/cannabis/illinois                                                 308 → /
/cannabis/illinois/peoria                                          308 → /city/peoria
/cannabis/illinois/east-peoria                                     308 → /city/east-peoria
/cannabis/illinois/peoria-heights                                  308 → /city/peoria-heights
/cannabis/illinois/bloomington                                     308 → /city/bloomington
/cannabis/illinois/normal                                          308 → /city/normal
/cannabis/illinois/champaign                                       308 → /city/champaign
/cannabis/illinois/urbana                                          308 → /city/urbana
/cannabis/illinois/springfield                                     308 → /city/springfield
/cannabis/illinois/pekin                                           308 → /city/pekin
/cannabis/illinois/chicago                                         404
/cannabis/illinois/laws                                            200
/cannabis/illinois/first-time-guide                                200
/cannabis/illinois/open-now                                        200
/city/peoria                                                       200
/city/east-peoria                                                  200
/city/bartonville                                                  200
/city/morton                                                       200
/city/washington                                                   200
/city/pekin                                                        200
/city/peoria-heights                                               200
/city/chicago                                                      404
/                                                                  200
/sitemap.xml                                                       200

=== Content checks ===
homepage hero copy                  : "Top Central Illinois deal", "Central Illinois cannabis deal finder"
homepage savings callout            : "Showing the best active deal in Central Illinois right now"
homepage live-stats footer          : "We tracked <strong>31</strong>" (was "ran <strong>31</strong>")
homepage PuffPrice Index            : hidden (no .ppi-card, no "$—.——/g", no "0 of 10 deals tracked")
homepage freshness label            : "Last verified Apr 24" (was "Updated 26h ago")

/city/peoria section header         : "8 dispensaries in the Peoria metro"
/city/peoria-heights section header : "1 dispensary in Peoria Heights, IL"
/city/pekin                         : nuera-pekin in dlist (no longer empty-state)
/city/bartonville                   : empty-state copy ("No active deals in Bartonville…")

/l/noxx-east-peoria deal badge      : "Verified Apr 24"
/deals/all deal badge counts        : 2× "Verified Apr 24" (no "Verification pending" rows)

=== Sitemap diff ===
Old /cannabis/illinois/<city> URLs in sitemap : 0 (was 11+)
New /city/<slug> URLs in sitemap              : 12 (every CENTRAL_IL_CITIES entry, including the 3 empty cities)
Surviving /cannabis/illinois/* URLs           : first-time-guide, laws, open-now (3, as designed)
```

24 of 24 status codes match expectations. All content assertions pass.

---

## What changed by the numbers

- **Files deleted:** 70 (4 [slug] subroute files + 1 hub + 1 helper + 35 static city wrappers + 1 NeighborhoodPage component + 10 chicago neighborhood configs + 18 chicago + neighborhood pages — `git diff --stat` reports 70 files changed in commit `3896d07`).
- **Lines removed:** -3066. Lines added: +37 (the middleware redirect logic + a few link updates).
- **Sitemap entries removed (per category):** 1 hub URL + 12 CIL city URLs + 36 intent URLs + 0 landmark URLs = 49 stale URLs.
- **Sitemap entries added:** 0 (the `/city/<slug>` section already existed; it now sources from CENTRAL_IL_CITIES so it covers all 12 cities deterministically).

## What's still polish-only for Matthew

1. **`config/cities/illinois/*.ts` orphan files.** 36 config files (one per IL city) are now unimported. `next build` doesn't care; they're inert. Safe to delete in a future cleanup pass — I deferred to keep this session's diff focused on the routing change.
2. **`components/CityPage.tsx` is now Missouri-only.** The internal nearby-city links inside it still hardcode `/cannabis/illinois/<slug>`; for Missouri consumers those links 308-redirect to `/city/<slug>` and then 404 (because non-CIL slugs aren't in scope for `/city/`). Pre-existing latent bug in MO pages — making it strictly worse only if MO ever ships. Out of session scope per hard constraint.
3. **`app/directory-page.tsx` is fully orphaned** (no importers anywhere) and Next.js doesn't route `directory-page.tsx` since it's not named `page.tsx`. Dead file. Safe to delete.
4. **PuffPriceIndex `ComingSoonState` is now unreachable** after Phase 4.3 returns `null` early. Function preserved with a comment for future re-enable. Dead-code lint may flag it; ignore-build-errors masks any TS warning.
5. **`getDealsRunThisMonth` could optionally filter `is_active=true`** if you want the "tracked" count to reflect only currently-active deals (which would read 10 today instead of 31). Current copy is honest with the broader count, but happy to switch if you prefer.

## Rollbacks

None. All four feature commits + the sitemap fix landed on the first try. Vercel Ready every time. The redirect chain works as designed (308 plain text, no infinite loops detected).

## Final state

- **HEAD after this session:** `64d2087` (this report's commit will follow on top).
- **Production:** on `64d2087`, Vercel Ready.
- **Active CIL listings:** unchanged at 26 (no DB writes this session).
- **Active CIL deals:** unchanged at 10 (NOXX BOGO false-positive remains deactivated from previous session).
- **Routes:** legacy `/cannabis/illinois/*` city tree gone, redirected to `/city/*`. Three content pages preserved.
- **Sitemap:** Central-IL canonical URLs only (`/city/<slug>` × 12), zero legacy `/cannabis/illinois/<city>` URLs, zero intent matrix.
- **Homepage:** every "Illinois" reference scoped to "Central Illinois". Empty PuffPrice Index hidden. Live-stats footer reads "tracked" not "ran".
- **Deal freshness badges:** consistent across browse and detail views.
