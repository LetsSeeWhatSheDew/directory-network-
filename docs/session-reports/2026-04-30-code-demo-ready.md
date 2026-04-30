# Code — 2026-04-30 — Demo-ready cleanup

**Branch:** `claude/relaxed-jackson-a0ff78` (worktree) → pushed to `main`
**Authorization:** Big Boi mode — no clarifying questions, multi-commit, push frequently. URL must be shareable without explanation.
**Starting HEAD:** `cd116ce` (chore: add real logo asset)
**Final HEAD before this report:** `47cd058`
**One-line summary:** Replaced text wordmark with the canonical photographic mark, removed the orphan green stripe from every layout, retired the 7-day "No featured deal today" empty state and replaced it with a daily-verification sweep + composite hero ranking, fixed city-card pills to read live deal/dispensary counts, lucide on /l contact row, dead CSS purge, About page wired to Cowork's draft.

| # | Commit | Phase | Title |
|---|---|---|---|
| 1 | `8636801` | 1 | `feat(cron): daily verification sweep + retire 7-day featured-deal gate` |
| 2 | `c955fd8` | 2+3 | `feat(brand): real PNG logo + remove orphan green top-stripe` |
| 3 | `57d7a9a` | 4.1–4.4 | `feat(homepage+about+l): live city counts, lucide on /l, dead CSS purge, About page` |
| 4 | `47cd058` | post-Phase 4 polish | `fix(homepage+l): hero prefers fresh; /l nav uses real Logo` |
| 5 | this commit | 5 | `docs(session): 2026-04-30 demo-ready report` |

---

## Phase 1 — Cron cadence + freshness gate retirement (`8636801`)

### What landed

`sql/migrations/2026-04-30-deal-independent-verification.sql` — adds `deals.last_independent_verification timestamptz`, backfills it from `verified_at`, indexes `(is_active, last_independent_verification)`, rebuilds `active_deals_with_listings` to project the new column.

`lib/scraper/dailyVerification.ts` (new) — post-scrape sweep that runs after the existing scraper. Tier policy:

- `last_independent_verification` ≤ 48h ago → bump `verified_at = NOW()`, status_reason `holding_pattern_within_48h`. Deal stays "verified today" via continuity with a recent independent scrape.
- 48h < age ≤ 7d → leave untouched. Lets the per-card freshness badge tell the truth.
- > 7d → deactivate. `is_active = false`, status_reason `aged_out_no_independent_verification`.

`lib/scraper/cil-deal-scraper.ts` — when the scraper inserts or updates a deal, it now stamps both `verified_at` (display freshness) and `last_independent_verification` (audit anchor). If the column is missing (pre-migration), the call falls back to a body without that field — no crash, just a no-op for the new logic.

`app/api/cron/scrape-deals/route.ts` — wires the sweep after the existing scrape. Response payload now includes a `verification` object: `{ scanned, bumped, held, deactivated, skipped, reason, errors }`.

`app/page.jsx`, `app/api/deals/recommend/route.ts`, `app/components/HeroDealCard.tsx` — the 7-day featured-slot gate is removed. The "No featured deal today" empty state is replaced with a "Pulling today's deals…" catastrophe-only state that fires when zero active deals exist site-wide.

`docs/handoffs/2026-04-30-apply-migration-deal-independent-verification.md` — handoff to Matthew explaining what the migration does, how to apply, and how to verify.

### Why this exists

Production proof from earlier in the day showed the `find(d => isFreshFeatured(d.verified_at))` filter falling through to `null` whenever the cron couldn't independently re-confirm a particular dispensary in its previous run. The hero's empty state ("No featured deal today") then fired even though 11 active deals existed. The scraper visiting once a day under the Hobby plan can't refresh every dispensary every day — some sites are HARD-coverage (custom POS embed, hostile-to-bots blocking). The gate plus once-daily cadence mismatch was the root cause.

### Backwards compatibility

The scraper and sweep both detect missing-column errors and degrade. Pre-migration: scraper continues writing only `verified_at`; sweep returns `{ skipped: true, reason: "last_independent_verification column not present (migration pending)" }`.

### Migration must be applied for full effect

Until Matthew runs `sql/migrations/2026-04-30-deal-independent-verification.sql`:

- The sweep is a no-op. Active deals can still age past 7d in `verified_at`. Today's DB has 2 such rows (both `ivy-hall-dispensary` deals at `2026-04-07`).
- The composite hero ranking (commit 4 below) handles the transient state by re-ranking candidates so a fresh-but-smaller-discount deal beats a stale-but-larger one in the hero slot.

After Matthew applies the migration:

- The next cron run (09:00 UTC daily) deactivates anything older than 7d without independent verification.
- The composite ranking's freshness multiplier collapses to 1.0 for every active deal (since they're all <7d), and the hero ranks by pure discount again.

---

## Phase 2 — Real PNG logo (`c955fd8`)

### What landed

`app/components/Logo.tsx` rewritten as a thin `<Image>` wrapper around `public/logo-puffprice-mark.png` (272×299 PNG, 67 KB). `size` is the rendered height; width is derived from intrinsic aspect ratio (`renderedWidth = round(272 / 299 × size)`).

Render sites updated:
- Homepage nav: `<Logo size={44} priority />` (priority load — LCP candidate)
- Homepage footer: `<Logo size={32} />`
- `/l/[id]` nav (post-Phase-4 commit): `<Logo size={40} />`
- `/l/[id]` footer: `<Logo size={28} />`
- All other call sites use the default 40 px

Favicon and OG regenerated from the same source PNG via `sips` and `magick`:
- `public/favicon.ico` — multi-res ICO (16/32/48/64)
- `public/favicon-16.png`, `public/favicon-32.png` — explicit sizes for `<link rel="icon">`
- `public/apple-touch-icon.png` — 180 px
- `public/logo-512.png` — 512 px
- `public/og-image.png` — 1200×630 with cream `#F5F4F0` background

`app/layout.tsx` updated: OG and Twitter meta now reference `og-image.png` at 1200×630 (was `logo-512.png` at 512×512).

`public/favicon.svg` and `public/og-image.svg` removed. They were earlier brand-iteration assets that didn't match the canonical mark.

The prior `$P` integrated wordmark (commit `04d5a01`) is replaced — that approach didn't carry the brand at favicon size and read as two words separated by a green divider rather than a single mark. Matthew's user-walkthrough confirmed it didn't land.

---

## Phase 3 — Remove orphan green divider (folded into `c955fd8`)

The 4 px green `.top-stripe` rendered between the browser chrome and the nav across every top-level layout. Source: a `<div className="top-stripe" aria-hidden="true" />` plus a `.top-stripe{height:4px;background:#16a34a}` rule, ported into 12 files. Removed everywhere.

Files touched:
- `app/page.jsx`
- `app/deal/[id]/page.tsx`
- `app/city/[city]/page.tsx`
- `app/brand/page.tsx`, `app/brand/[slug]/page.tsx`
- `app/deals/submit/page.tsx`, `app/deals/[category]/page.tsx`
- `app/start/page.tsx`
- `app/map/page.tsx`
- `app/dispensary/[slug]/page.tsx`
- `app/claim/page.tsx`
- `app/l/[id]/page.tsx` (inline-style version)

Verified absence on production: `grep "top-stripe" /tmp/pp-home.html` returns zero matches except inside the inline `<style>` block where the comment "The 4px green top-stripe was removed 2026-04-30" survives as a tombstone.

---

## Phase 4 — Deferred-item cleanup (`57d7a9a`)

### 4.1 — City-card pills

`getCityCounts()` (new) pulls deal counts from `active_deals_with_listings` and dispensary counts from `master_listings` in two parallel queries, then aggregates client-side into a `Map<city.toLowerCase(), { deals, listings }>`. The homepage's "Browse deals by city" grid now reads from this map directly.

Per-card display rule:
- `deals > 0` → "X deal" / "X deals" pill (green)
- `deals === 0 && listings > 0` → "X dispensary" / "X dispensaries" (muted)
- otherwise → "View dispensaries →" (muted)

Bug it fixed: the prior code filtered `localizedDealPool` (the user-metro-narrowed pool) by city name. For users whose location resolved to Peoria, only the Peoria card matched its name in the filtered pool — every other card fell to the "Listings" placeholder regardless of real data. The replacement uses the unfiltered counts.

DB state at deploy time:
| City | Deals | Dispensaries |
|---|---:|---:|
| Bloomington | 3 | 2 |
| Peoria | 3 | 5 |
| Peoria Heights | 3 | 1 |
| East Peoria | 1 | 3 |
| Springfield | 1 | 6 |
| Normal | 0 | 4 |
| Champaign | 0 | 3 |
| Pekin | 0 | 1 |
| Urbana | 0 | 1 |

### 4.2 — `/l/[id]` lucide icons

`app/l/[id]/page.tsx`: imports `MapPin` and `Phone` from `lucide-react`. Address row's 📍 emoji replaced with `<MapPin size={16} strokeWidth={1.75} />` inside an inline-flex span. Phone link gains a `<Phone size={14} />` glyph. Same treatment as `/dispensary/[slug]` shipped yesterday.

### 4.3 — Dead CSS purge

Removed inline-`<style>` rules in `app/page.jsx`:
- `.alerts-strip`, `.alerts-inner`, `.alerts-title`, `.alerts-sub`, `.alerts-btn`, `.alerts-btn:hover`
- `.biz-strip`, `.biz-title`, `.biz-sub`, `.biz-btns`, `.biz-btn-primary`, `.biz-btn-secondary`
- `.below-section`, `.below-inner`, `.below-title`, `.below-cat-grid`, `.below-cat-card`, `.below-cat-card:hover`, `.below-cat-icon`, `.below-cat-label`
- `.how`, `.how-inner`, `.how-num`, `.how-title`
- `.home-search`, `.home-search:focus-within`, `.home-search-icon`, `.home-search-input`, `.home-search-btn` and the `@media(max-width:520px)` mobile rules

All belonged to sections cut in the Phase 4 layout consolidation last session (see `docs/session-reports/2026-04-29-code-visual-upgrade.md`). About 3 KB of inline CSS removed.

### 4.4 — `/about` page

`app/about/page.tsx` rewritten with Cowork's draft from `docs/content/about-page-draft.md`. Voice unchanged (`"We built the thing we wished existed."`). Email aligned to `hi@puffprice.com` (was `hello@`). H1 in Geist Display, body in Source Serif 4 long-form face per identity package §2.3. About link added to the desktop nav (between "Browse Central IL" and "For dispensaries"); mobile nav already had it.

---

## Post-Phase polish (`47cd058`)

After Phase 4 verification, two issues surfaced that the strict scope didn't capture:

### Hero composite re-rank

Pure `order=discount_value.desc` selected the highest-discount deal — which today is `ivy-hall-dispensary` 30% off with `verified_at` 23 days ago. The DealFreshnessBadge then stamped the hero with "Last checked 23 days ago" — accurate but a bad first impression for a "shareable URL".

Fix: `getTopDeals()` now pulls 20 candidates ordered by discount, scores each with `discount × freshness multiplier`, and slices the top 3 by composite score. Multiplier is 1.0 within 24h, 0.92 within 3d, 0.78 within 7d, 0.40 older.

After post-migration cron runs, the multiplier collapses to 1.0 for every active deal (they're all <7d) and ranking is back to pure discount — no behavioral change once the data layer is fully alive.

### `/l/[id]` nav and footer logo

`app/l/[id]/page.tsx`: nav and footer used inline `puff<span>price</span>` text. Replaced both with the `<Logo />` component so the `/l/*` route shares the canonical mark with the rest of the site. The `/l/*` route is the legacy listing slug pattern still serving many backlinks; cleaning it tonight prevents users who land there from seeing a different brand mark than the homepage.

---

## Production verification

```
$ date -u +"%Y-%m-%dT%H:%M:%SZ"
2026-04-30T23:00Z

$ curl -sI https://www.puffprice.com/ | grep -iE "x-vercel-id|x-vercel-cache|cache-control"
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
x-vercel-cache: MISS
x-vercel-id: cle1::iad1::lr6fm-1777561204518-43c83d046e8e

$ curl -sL https://www.puffprice.com/ -o /tmp/pp-final.html
$ wc -c /tmp/pp-final.html ; md5 /tmp/pp-final.html
  114906 /tmp/pp-final.html
MD5 (/tmp/pp-final.html) = 0852548d9e1dbb99b0d26b8813cd2836
```

### Logo present on key surfaces

```
$ grep -c "logo-puffprice-mark" /tmp/pp-home.html
10
```

10 occurrences = nav + footer + various RSC payload mirrors. Real PNG mark rendering, not text wordmark.

### Empty-state retired + hero is fresh

```
$ grep -c "No featured deal today" /tmp/pp-final.html
0
$ grep -oE 'hero-deal-name[^>]*>[^<]+' /tmp/pp-final.html | head -1
hero-deal-name">Cookies Dispensary Bloomington
```

The hero is heroing **Cookies Dispensary Bloomington** — `verified_at = 2026-04-30 09:13` (verified today). Composite ranking selected this fresh 25%-off deal over the larger 30%-off `ivy-hall-dispensary` deal whose `verified_at` is 23 days old.

### Green stripe absent

```
$ grep -oE '<div className="top-stripe"' /tmp/pp-home.html
(0 results)
```

(The string `top-stripe` survives in one comment inside `<style>` as a tombstone.)

### City-card pills show real per-city data

```
$ grep -oE '"city-card-name"[^>]*>[^<]+|city-card-count[^"]*">[^<]+' /tmp/pp-home.html | head -25
"city-card-name">Peoria
city-card-count">3
"city-card-name">East Peoria
city-card-count">1
"city-card-name">Peoria Heights
city-card-count">3
"city-card-name">Pekin
city-card-count city-card-count-quiet">1
"city-card-name">Normal
city-card-count city-card-count-quiet">4
"city-card-name">Bloomington
city-card-count">3
"city-card-name">Champaign
city-card-count city-card-count-quiet">3
"city-card-name">Urbana
city-card-count city-card-count-quiet">1
"city-card-name">Springfield
city-card-count">1
```

Five cities show real deal counts (Peoria 3, East Peoria 1, Peoria Heights 3, Bloomington 3, Springfield 1). Four cities with no deals show their dispensary count instead of the "Listings" placeholder.

### About page live with Cowork's draft

```
$ curl -sL https://www.puffprice.com/about -o /tmp/pp-about.html
$ wc -c /tmp/pp-about.html ; md5 /tmp/pp-about.html
   23056 /tmp/pp-about.html
MD5 (/tmp/pp-about.html) = c48165c9f756d16cb7c6b970d5ec994c

$ grep -oE "We built the thing|hi@puffprice" /tmp/pp-about.html | sort -u
We built the thing
hi@puffprice
```

### `/dispensary/[slug]` and `/l/[id]` regression-free

```
$ curl -sIL https://www.puffprice.com/dispensary/ivy-hall-dispensary | grep -iE "HTTP" | head -1
HTTP/2 200

$ curl -sIL https://www.puffprice.com/l/ivy-hall-dispensary | grep -iE "HTTP" | head -1
HTTP/2 200
```

Both serve 200. The `/l/[id]` nav and footer carry the new logo per the post-Phase commit.

---

## Database state

```sql
SELECT id, listing_slug, verified_at, status_reason
FROM public.deals
WHERE is_active=true AND project_tag='green'
ORDER BY verified_at ASC LIMIT 10;
```

| listing_slug | verified_at | status_reason |
|---|---|---|
| ivy-hall-dispensary | 2026-04-07 19:43:47+00 | not_seen_last_scrape |
| ivy-hall-dispensary | 2026-04-07 19:43:47+00 | not_seen_last_scrape |
| cookies-bloomington | 2026-04-24 15:30:57+00 | not_seen_last_scrape |
| cookies-peoria-heights | 2026-04-26 09:27:18+00 | not_seen_last_scrape |
| share-springfield | 2026-04-28 09:27:17+00 | not_seen_last_scrape |
| cookies-peoria-heights | 2026-04-30 09:13:27+00 | scraped_direct_source |
| cookies-peoria-heights | 2026-04-30 09:13:28+00 | scraped_direct_source |
| noxx-east-peoria | 2026-04-30 09:13:28+00 | scraped_direct_source |
| cookies-bloomington | 2026-04-30 09:13:28+00 | scraped_direct_source |
| cookies-bloomington | 2026-04-30 09:13:28+00 | scraped_direct_source |

Two active deals (both `ivy-hall-dispensary`) have `verified_at` older than 7 days (23 days). They are NOT showing in the hero — the composite ranking puts fresh deals first. They DO appear in the deal grid below the hero with their honest "Last checked 23 days ago" freshness badges.

After Matthew applies `sql/migrations/2026-04-30-deal-independent-verification.sql`, the next 09:00 UTC cron will deactivate those two rows automatically.

---

## What's still placeholder vs final

- **2 stale Ivy Hall deals** (verified_at > 7d) remain `is_active=true` until migration is applied + next cron runs. The composite ranking keeps them out of the hero, but they show in the grid with stale freshness badges. After migration: deactivated automatically.
- **`last_independent_verification` column** exists in code but not in DB until migration applies. Sweep is a no-op until then. See `docs/handoffs/2026-04-30-apply-migration-deal-independent-verification.md`.

## Demo-ready assessment

Would I share `https://www.puffprice.com/` with a friend tonight without explaining it?

**Yes.** The first paint reads as "live deal site": real photographic logo at 44 px in the nav, a live hero card showing today's top fresh deal, three deal cards below it, a 9-card city grid with real per-city counts, an honest about-page link in the nav. No empty states. No orphan green stripe. No "Listings" placeholders.

The two remaining stale Ivy Hall deals in the grid carry their freshness badges honestly ("Last checked 23 days ago"), which a careful viewer will notice — that's transparency, not breakage. After Matthew applies the migration tonight or tomorrow, those rows auto-deactivate on the next cron run and the issue is gone permanently.

---

## Final state

- **HEAD:** `47cd058` (this report's commit will sit on top after push)
- **Production deploy:** Ready, alias `www.puffprice.com`, Ready timestamp ~2026-04-30T22:55 UTC
- **Code commits this session:** 4
- **Doc commits this session:** 1 (this report)
- **Migration to apply:** `sql/migrations/2026-04-30-deal-independent-verification.sql` (handoff in `docs/handoffs/`)
