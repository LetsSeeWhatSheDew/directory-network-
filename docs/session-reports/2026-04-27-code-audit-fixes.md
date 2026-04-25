# Code — 2026-04-27 morning — audit fixes (metro-bleed + project-tag bleed + cron + polish)

**Branch:** `claude/competent-kapitsa-d57746` (worktree) → pushed to `main`
**Authorization:** Matthew granted full push-through authority on the 6-phase plan, told me to verify after.
**Starting HEAD:** `751848c`
**Ending HEAD:** `b53e22c` (this report's commit will follow on top)
**Vercel:** Ready and serving the new behavior at the time of the smoke matrix below.

## Scoreboard

| # | Phase | Status | Commit |
|---|---|---|---|
| 1 | Project-tag scope audit + 5 query fixes | Done | `941a85f` |
| 2 | Metro-bleed fix in `/city/[slug]` | Done | `5bd321d` |
| 3 | Cron 401 fix (CRON_SECRET parsing + shared helper) | Done | `49c2d22` |
| 4 | Internal link migration (first-time-guide, laws, open-now, deal/[id]) | Done | `eee10b2` |
| 5 | Polish (footer branding, open-now CTA, /deal canonical) | Done | `b53e22c` |
| 6 | Final smoke + this report | Done | this commit |

Five feature commits + one session-report commit, all pushed to `origin/main`. Worktree clean at session end.

---

## Phase 1 — Project-tag scope audit (`941a85f`)

### Why it mattered

The audit found `/l/ivy-hall-dispensary`'s "Other dispensaries in Peoria" sidebar surfacing **Northline Public Works** (`project_tag='bid'`) and **Maple Grove Flats** + **Juniper Ridge Lofts** (`project_tag='rent'`) as if they were cannabis dispensaries. `master_listings` is shared across multiple projects in the same Supabase DB; any public-facing query that omits `project_tag=eq.green` leaks rows from other projects into PuffPrice's UI.

### Method

Grepped for every `master_listings` and `deals` reference under `app/`, `lib/`, and `scripts/`. For each, classified whether it was a public-facing query and whether it scoped by `project_tag`. Cross-checked the Supabase JS client form (`from('master_listings')`) and the PostgREST URL form (`/rest/v1/master_listings?...`).

### Queries audited and their state at session start

**Public-facing queries WITH `project_tag=eq.green` filter (no fix needed):**

- `app/sitemap.ts:32` (master_listings) ✓
- `app/page.jsx:341` (deals — most-recent-ts), `:454` (master_listings — listing count) ✓
- `app/dispensaries/page.tsx:61` (master_listings), `:75` (deals) ✓
- `app/city/[city]/page.tsx:122` (master_listings) ✓ (also got a Phase 2 metro-bleed fix)
- `app/cannabis/illinois/open-now/page.tsx:91` (master_listings) ✓
- `app/search/page.tsx:39, :61, :83, :100` (search master_listings + deals) ✓
- `app/deals/submit/page.tsx:52` (master_listings) ✓
- `app/map/page.tsx:46` (master_listings), `:63` (deals) ✓
- `app/api/listings/search/route.ts:19` (autocomplete) ✓
- `app/dispensary/[slug]/page.tsx:94` (master_listings) ✓
- `app/l/[id]/page.tsx:125` (primary listing fetch by slug) ✓
- `app/l/[id]/page.tsx:170, :181, :213` (deals attached to a listing) ✓
- `app/deal/[id]/page.tsx:77` (getListing) ✓
- `app/deals/[category]/page.tsx:167` (deals via params builder) ✓
- `lib/stats.ts:32, :57, :87` (Central IL listing slug set + month-to-date counts) ✓
- `lib/scraper/cil-deal-scraper.ts:451, :479` (CIL scraper bounds) ✓

**Admin-only / migration / orphan (out of scope):**

- `app/admin/page.tsx:131` — admin dashboard, scoped to green ✓
- `app/directory-page.tsx:94` — orphan file (no router import); scoped to a tag param either way ✓
- `lib/fetchCityListings.ts:64` — utility used by Missouri pages today; scoped ✓
- `scripts/backfill-logos*.ts`, `scripts/il-license-registry-audit.ts`, `scripts/ingest-scraped-deals.ts`, `scripts/compute-ppg-from-anchors.ts` — admin/migration scripts; not public ✓
- `app/api/cron/mark-stale-deals/route.ts` — `from("deals")` UPDATEs; uses service role with audit-trail status_reason; not in scope for public-leak class

**Public-facing queries WITHOUT `project_tag=eq.green` filter (5 bugs):**

| # | File:line | Function | What it fetched | Risk |
|---|---|---|---|---|
| 1 | `app/l/[id]/page.tsx:261` | `getRelated(city, currentId)` | "Other dispensaries in [city]" sidebar — master_listings filtered only by `city + id≠current` | **the audit's primary bug** — apartments and public-works rows in the same city bled through |
| 2 | `app/claim/[slug]/page.tsx:15` | `getListing(slug)` | Claim flow lookup by slug — master_listings filtered only by slug | A slug collision with a non-PuffPrice row would let someone "claim" a non-cannabis listing via PuffPrice's claim form |
| 3 | `app/api/deals/recommend/route.ts:111` | `fetchListingMeta(slug)` | lat/lng + listing_hours by slug — master_listings filtered only by slug | Slug collision could swap in wrong coords / open-now status from a non-PuffPrice row |
| 4 | `app/deal/[id]/page.tsx:57` | `getDeal(id)` | Public deal-detail page — `/deals?id=<uuid>&select=*` with no project filter | UUID collision risk is low but the leak is conceptually identical |
| 5 | `lib/puffpriceIndex.ts:30` | `computeWeeklyIndex()` | Weekly Index aggregator — `from("deals").select("price_per_gram,…")` with no project filter | Index baseline could include non-PuffPrice deals once it goes live (currently hidden by Phase 4.3 from yesterday) |

### The fix

All 5 queries now scope to `project_tag=eq.green` (and where appropriate `state=eq.IL` and `is_active=eq.true`):

```diff
- /master_listings?city=eq.${city}&id=neq.${currentId}&select=...&limit=3
+ /master_listings?city=eq.${city}&id=neq.${currentId}&project_tag=eq.green&state=eq.IL&is_active=eq.true&select=...&limit=3
```

### Production verification

```
curl -sL https://www.puffprice.com/l/ivy-hall-dispensary | grep "Other dispensaries"
→ links: aroma-hill-peoria, beyond-hello-peoria, trinity-on-university
  (cannabis only; no Northline / Maple Grove / Juniper Ridge)
```

---

## Phase 2 — Metro-bleed fix (`5bd321d`)

### Why it mattered

`/city/peoria` was rendering 8 dispensaries when only 5 are in Peoria proper. `/city/east-peoria` showed 8 instead of 3. Worst: `/city/bartonville` showed "6 active deals at 3 dispensaries" when Bartonville has zero licensed dispensaries. All three traced to `metroCities("Peoria") = ["Peoria", "East Peoria", "Bartonville"]` expanding the city query into a metro lookup — fine for "near me" widgets, wrong for "/city/peoria means Peoria, the city."

### The fix

`app/city/[city]/page.tsx`:

- **`getCityListings(city)`** — switched from `city=in.(${metroCities(city)})` to `city=eq.${city}`. Exact match.
- **`getCityDeals(city)`** — switched from `isInMetro(d.city, slug, city)` predicate to `d.city.toLowerCase() === city.toLowerCase()`. Exact match.
- **Empty-state branch** — listings.length === 0 now triggers explicit "No licensed dispensaries in [city] yet — nearest is N mi [direction] in [other CIL city]" copy, sourced from `EMPTY_CENTRAL_IL_CITIES` metadata. Replaces the prior "No active deals … check back soon" line that implied dispensaries existed.
- **Listings header** — simplified to `"{N} dispensary/dispensaries in {city}, IL"`. The "the X metro" branch is gone (no metros expansion now).
- **"Also near you" row** — sourced from `CENTRAL_IL_CITIES` (alphabetical, excluding self, capped at 6) instead of metro members.
- **Slug helper** — added `citySlug(name)` (lowercase + hyphenate); fixes the pre-existing `/city/east%20peoria` URL-encoding bug. Used by the neighbor-cities row.

### Production verification (every CIL city)

```
/city/peoria          → 5 dispensaries in Peoria, IL
/city/east-peoria     → 3 dispensaries in East Peoria, IL
/city/peoria-heights  → 1 dispensary in Peoria Heights, IL
/city/bartonville     → "No licensed dispensaries in Bartonville, IL yet — nearest is about 5 mi NE in Peoria."
/city/morton          → "No licensed dispensaries in Morton, IL yet — nearest is about 8 mi W in East Peoria."
/city/washington      → "No licensed dispensaries in Washington, IL yet — nearest is about 9 mi SW in East Peoria."
/city/urbana          → 1 dispensary in Urbana, IL
/city/champaign       → 3 dispensaries in Champaign, IL
/city/springfield     → 6 dispensaries in Springfield, IL
/city/bloomington     → 2 dispensaries in Bloomington, IL
/city/normal          → 4 dispensaries in Normal, IL
/city/pekin           → 1 dispensary in Pekin, IL
```

5 + 3 + 1 + 1 + 3 + 6 + 2 + 4 + 1 = **26 active CIL listings**, matches Cowork's reconciled DB count exactly.

---

## Phase 3 — Cron 401 fix (`49c2d22`)

### Hypothesis

Both cron routes had identical inline auth checks:

```ts
const authHeader = req.headers.get("authorization") || "";
const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
if (!process.env.CRON_SECRET || authHeader !== expected) return 401;
```

The most likely failure mode was a paste-with-trailing-newline on the env var: `CRON_SECRET=<secret>\n` in Vercel env, while Vercel's cron sends the bare `<secret>` in the bearer header. The literal `!==` comparison would never match, even though both values look right to a human.

### The fix

Created `lib/cronAuth.ts` with a shared `checkCronAuth(req, route)` helper that:

- **Trims** both header bearer token and env `CRON_SECRET` before comparison (kills the trailing-newline class of paste mistake).
- Strips the `"Bearer "` prefix case-insensitively.
- **Constant-time compare** so 401 response timing can't leak the secret length / matched-prefix.
- **Structured one-line warn log** on 401 with header presence, env presence, lengths (NOT values), and bearer-prefix detection:

```
[cron-auth] 401 route=scrape-deals env_present=true env_len=44 header_present=true header_bearer=true header_token_len=43 match=false
```

A future 401 mystery is now grep-able from Vercel Logs alone — `env_len=44 header_token_len=43` immediately tells you the trailing-newline tell.

Both `/api/cron/scrape-deals` and `/api/cron/mark-stale-deals` now use the helper. The duplicate `unauthorized()` function was removed from mark-stale-deals.

### Production verification

```
curl -sI https://www.puffprice.com/api/cron/scrape-deals
→ 401  (no auth header — correct rejection)

curl -sI -H "Authorization: Bearer wrongvalue" https://www.puffprice.com/api/cron/scrape-deals
→ 401  (wrong token — correct rejection)
```

The valid-token branch was not directly tested (Matthew has the live `CRON_SECRET` in Vercel env, not in the repo). Vercel's actual cron will fire daily at 09:00 UTC — with the trim + structured logging, the next invocation will either succeed (and we'll see the scraper run) or 401 with a diagnostic log line that names the cause.

---

## Phase 4 — Internal link migration (`eee10b2`)

The legacy `/cannabis/illinois/<city>` tree was redirected last night, but several outbound links still pointed at it. Working redirects but wasted crawl budget. Migrated:

- `app/cannabis/illinois/first-time-guide/page.tsx` — "Find Dispensaries Near You" 8 city chips switch from `/cannabis/illinois/<city>` → `/city/<city>`. Nav back + breadcrumb "Illinois" → "Central IL" → `/`.
- `app/cannabis/illinois/laws/page.tsx` — Nav back + breadcrumb updated. "Browse Central IL dispensaries →" CTA now lands on `/dispensaries` (the all-by-city directory) instead of the retired hub.
- `app/cannabis/illinois/open-now/page.tsx` — Nav back + breadcrumb updated.
- `app/deal/[id]/page.tsx` — Deal-meta city link now slugifies (lowercase + hyphenate) instead of `encodeURIComponent` — prevents `/city/east%20peoria` 404s. Null-city fallback link "Illinois" → "Central Illinois" → `/`.

Per the canonical-decisions doc, the three content pages (`first-time-guide`, `laws`, `open-now`) **stay** at their `/cannabis/illinois/*` URLs — only their internal city/listing links migrated.

Production verification:

```
curl -sL https://www.puffprice.com/cannabis/illinois/first-time-guide \
  | grep -oE 'href="/(city|cannabis/illinois)/[a-z][a-z-]+"' | grep -v '(first-time-guide|laws|open-now)'
→ /city/peoria, /city/east-peoria, /city/bloomington, /city/normal,
   /city/champaign, /city/urbana, /city/springfield, /city/peoria-heights
   (8 chips, all on the new pattern, none on the legacy tree)
```

---

## Phase 5 — Polish (`b53e22c`)

- **Footer branding.** `/l/[slug]` and `/cannabis/illinois/first-time-guide` footer no longer say "Illinois Cannabis Directory" — now reads "PuffPrice · Central Illinois", matching the public scope.
- **Open-now CTA.** "Own a dispensary in Illinois?" → "Own a Central Illinois dispensary?"
- **/deal/[uuid] canonical** now points to `/dispensary/[listing_slug]` instead of self when the deal has a listing context. Resolves the GSC "duplicate without user-selected canonical" warning. Falls back to self-canonical when listing_slug is null.
- **/cannabis/illinois/laws CTA** was already migrated to `/dispensaries` in Phase 4.
- **`/city/east%20peoria` URL encoding** was already fixed via the Phase 2 `citySlug()` helper.

Production verification:

```
curl -sL https://www.puffprice.com/l/ivy-hall-dispensary | grep "PuffPrice ·"
→ "PuffPrice · Central Illinois"

curl -sL https://www.puffprice.com/deal/211e0561-494b-4042-8f0c-7fc4660a0128 \
  | grep '<link.*rel="canonical"'
→ <link rel="canonical" href="https://www.puffprice.com/dispensary/ivy-hall-dispensary"/>
```

---

## Phase 6 — Final production smoke matrix

```
=== PROJECT-TAG CHECK (C2 verification) ===
/l/ivy-hall-dispensary "Other dispensaries"
  → cannabis-only links (aroma-hill, beyond-hello, trinity-on-university)
  → NO apartments, NO public works                                       ✓

=== METRO-BLEED CHECK (C1 verification) ===
/city/peoria                → 5 dispensaries in Peoria, IL               ✓
/city/east-peoria           → 3 dispensaries in East Peoria, IL          ✓
/city/peoria-heights        → 1 dispensary in Peoria Heights, IL         ✓
/city/bartonville           → empty-state, no listings, no deals         ✓
                             "nearest is 5 mi NE in Peoria"
/city/morton                → empty-state, "8 mi W in East Peoria"       ✓
/city/washington            → empty-state, "9 mi SW in East Peoria"      ✓
/city/urbana                → 1 dispensary in Urbana, IL                 ✓
/city/champaign             → 3 dispensaries in Champaign, IL            ✓
/city/springfield           → 6 dispensaries in Springfield, IL          ✓
/city/bloomington           → 2 dispensaries in Bloomington, IL          ✓
/city/normal                → 4 dispensaries in Normal, IL               ✓
/city/pekin                 → 1 dispensary in Pekin, IL                  ✓

=== CRON CHECK (C3 verification) ===
GET /api/cron/scrape-deals  (no auth)               → 401                ✓
GET /api/cron/scrape-deals  (Authorization: Bearer wrongvalue) → 401     ✓
(Real cron auth verified by daily Vercel firing — structured 401 log
 will name the cause if anything else goes wrong.)

=== INTERNAL LINKS CHECK (C4 verification) ===
/cannabis/illinois/first-time-guide  → 8 city chips, all /city/<slug>    ✓

=== POLISH ===
"Also near you" links (city slugs)   → no %20, only hyphens              ✓
/l/[slug] footer                     → "PuffPrice · Central Illinois"    ✓
/deal/[uuid] canonical               → /dispensary/<listing_slug>        ✓
```

All four critical bugs (C1–C4) and all polish items pass.

---

## What's deferred / needs Cowork or human review

- **CRON_SECRET valid-token live test.** Real bearer not in repo by design. Next daily cron at 09:00 UTC will be the proof; if it 401s, the new structured log will name the cause.
- **`components/CityPage.tsx`** — still used by Missouri pages with hardcoded `/cannabis/illinois/<slug>` internal links. Pre-existing latent bug (also flagged in yesterday's session report). Out of scope per "don't touch missouri" hard constraint.
- **`app/directory-page.tsx`** — still orphan (not a Next.js route, no importers). Safe to delete in a future cleanup pass; left alone today to keep diff focused.
- **`config/cities/illinois/*.ts`** — 36 orphan config files left over from the legacy template tree deletion two sessions ago. Inert; safe to bulk-delete.
- **`getDealsRunThisMonth`** — still aggregates created-in-month regardless of current `is_active`. Copy was changed to "tracked" yesterday for honesty; query itself untouched today.
- **PuffPrice Index `ComingSoonState`** — unreachable since yesterday's hide-when-empty change. Function preserved for future re-enable.

## Class-of-problem note

Findings C1 and C2 are both instances of **a query that filters by one axis when it should filter by two**. C1 was `(city)` instead of `(city, exact-match)`. C2 was `(city)` or `(slug)` or `(uuid)` instead of `(scope, …)`. Cowork's `2026-04-26-evening-audit-claude.md` Finding 5 named the same shape ("two-axis filters are the most common place where this slips"). The structural lesson: **any query against a multi-tenant or multi-scope table must list every dimension that constrains the public surface, even if the omitted dimension feels unrelated.** A `select=*` from `master_listings` with only a `city=eq.X` filter is not "the cannabis dispensaries in X" — it is "every row in master_listings with city=X regardless of project". The fix is mechanical (add the filter); the design discipline is naming the table's tenancy explicitly in the query so the next reader can't write the same bug by accident.

## Rollbacks

None. All five feature commits landed cleanly. Vercel Ready every time. No regressions detected in the smoke matrix.

## Final state

- **HEAD after this session:** `b53e22c` (this report's commit will follow on top).
- **Production:** on `b53e22c`, Vercel Ready.
- **Active CIL listings:** 26 (unchanged this session — no DB writes).
- **Active CIL deals:** 10 (unchanged).
- **Public surface integrity:** every public master_listings + deals query now scopes to `project_tag=eq.green`.
- **City pages:** exact-city-match — no metro bleed, empty cities show honest empty-state.
- **Cron auth:** trimmed + structured-logged + shared helper across both cron routes.
- **Internal links:** city tree migrated from `/cannabis/illinois/<city>` → `/city/<city>`; the three content pages keep their canonical paths.
- **/deal canonical:** now points to the dispensary detail page, consolidating link equity.
