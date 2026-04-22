# Cowork session — INTERRUPTED — 2026-04-22 morning

**Reason for stop:** user interrupted partway through Task 4 (GO HERE bug investigation). New priorities are about to land — this doc captures state so nothing is lost.

**Time spent before interrupt:** ~70% of the 4-hour budget.

---

## Tasks completed (3 of 6) — outputs already on disk

### ✅ Task 1 — Orphan dispensary research + migration

- `sql/migrations/2026-04-22-create-orphan-master-listings.sql` — **NOT YET APPLIED.** Matthew applies in Supabase SQL editor when ready. Wrapped in BEGIN/COMMIT with a sanity-check that aborts if counts are off. Rollback commented at bottom.
  - Creates 6 master_listings rows: `green-007` through `green-012` for bisa-lina-joliet, cookies-chicago, curaleaf-morris, natures-treatment-milan, perception-cannabis-chicago, mood-shine-chicago-heights.
  - Creates 42 listing_hours rows (6 dispensaries × 7 days).
  - Reactivates the 7 orphaned deals: `is_active=true, status_reason='imported_not_verified'`.
- `docs/handoffs/2026-04-22-orphan-research.md` — full research notes with source URLs (Patch, BBB, Yelp, dispensary websites). **All 6 confirmed real.** Mood Shine is woman-owned + BBB-listed — not a scraper artifact.
- `lat`/`lng` deliberately left NULL — Google Places backfill (Task 2) covers them in one pass.

### ✅ Task 2 — Logo audit + Google Places backfill script

- Coverage audit: **49 of 61 IL/green listings missing logo (80%); 60 of 61 missing coords (98%).**
- `scripts/backfill-logos-from-google-places.ts` — dry-run-default, `--apply` flag to commit, `--slug=` for one-off, hard cap of 100 calls/run, 1 req/sec pacing, per-skip reason logging.
  - Script avoids the redundant Place Details call by widening the Text Search field mask. Estimated worst-case spend: **~$1.76 for full IL coverage.**
- `docs/handoffs/2026-04-22-logo-backfill-plan.md` — coverage numbers, expected post-run state, manual fallback spec for the admin upload form, risk register.
- **Decision needed from Matthew:** when to run the script. Recommendation: **after** the orphan-listings migration applies, so the 6 new rows backfill in the same pass.

### ✅ Task 3 — Deal freshness audit v2 + Path A scraper spec

- `docs/audits/deal-freshness-v2-20260422.md` — **52% of active feed (24 of 46 deals) has no expiry AND no recurring pattern → silently goes stale.** 15 dispensaries hold all 46 active deals; the other 46 IL listings have ZERO active deals (75% of the directory). Top-5 deal-density Path C outreach targets identified: Altius, nuEra East Peoria, nuEra Aurora, nuEra Champaign, Seven Point Danville (the last has all 4 deals destined to go stale — highest urgency).
- `docs/handoffs/path-a-scraper-spec-20260422.md` — concrete Code-ready spec for a Leafly per-dispensary scraper writing to `deal_submissions`. Covers URL mapping (recommends adding `master_listings.leafly_slug` column), HTTP behavior (UA rotation, rate limiting, retries), extraction selectors, dedup logic, error handling, cron config (`30 8 * * *` UTC = 03:30 CDT), risks, and pre-launch checklist. **Spec only — do NOT build until Matthew greenlights.**

---

## Task partially done (1 of 6) — outputs in this doc

### ⚠️ Task 4 — Maps / GO HERE bug investigation (~60% done)

What I found before the interrupt:

**4 places in production code render a `GO HERE` button:**
1. `app/deals/[category]/page.tsx:708` (DealCtaLink) — uses `listingHref(topDeal.slug || topDeal.listing_slug, city)` → `/l/{slug}`
2. `app/deal/[id]/page.tsx:386` (Link) — uses `listingHref(deal.listing_slug, city)` → `/l/{slug}`
3. `app/components/HeroDealCard.tsx:236` (TrackedLink) — *(not fully read before interrupt)*
4. `app/dispensary/[slug]/page.tsx:461` (Link) — *(not fully read before interrupt)*

**`listingHref()` in `lib/links.ts:6-15`** returns `/l/{slug}?city={city}` (or just `/l/{slug}`). It strictly requires `slug` to be a non-empty string and not the literal `"undefined"`/`"null"`.

**`/l/[id]/page.tsx` lookup at lines 121-126** queries `master_listings WHERE slug = $1`. If no row, line 375-387 renders the "Listing not found" page (which the user sees as `Listing Not Found`). So a 404 on GO HERE means the `listing_slug` from the deal does not have a matching `master_listings.slug`.

**`/map` route exists at `app/map/page.tsx`.** It pulls from `master_listings` directly with `lat=not.is.null`. Today **only 1 of 61 listings has coords** (Task 2 audit). Per lines 129-167, when `points.length < 3`, the page renders a "Map view coming soon" placeholder instead of the actual map — that's likely the "Maps tab is broken" symptom Matthew reported. The fix isn't a code change; it's running the Google Places backfill from Task 2 to populate `lat/lng`. After the backfill, ~60 listings should drop in and the map renders normally.

**Hypothesis ranking for the GO HERE 404 (still to verify):**

- **H1 (most likely):** A deal card on a deals listing or homepage hero pulls from the `active_deals_with_listings` view, where some rows still have a `listing_slug` that doesn't match `master_listings.slug` post-Apr-22-morning migrations. The 7 orphan deals WERE deactivated by `2026-04-22-fix-deal-listing-joins.sql`, so they shouldn't appear in `is_active=true` queries. **However**, if any homepage component (e.g., HeroDealCard) is fed by a list NOT scoped by `is_active=true`, the orphan deals could still surface.
- **H2:** Slug casing mismatch on a particular deal — Code should run:
  ```sql
  SELECT d.id, d.listing_slug, d.title
  FROM deals d
  LEFT JOIN master_listings ml ON ml.slug = d.listing_slug
  WHERE d.is_active = true AND ml.slug IS NULL;
  ```
  If this returns rows, those are the GO HERE 404 sources.
- **H3:** Something is constructing the URL by concatenating `/l/` + a wrong field (e.g., `name` instead of `slug`). Less likely — `listingHref()` is the central helper.
- **H4 (the Maps part):** Maps tab is empty because `lat/lng` is NULL on 60/61 listings. Fix = run Task-2 backfill.

**What's left to do (Code can pick this up):**

1. Run the H2 SQL above. If it returns rows, that's the bug — those deals are visible somewhere outside the `is_active=true` filter.
2. Open `app/components/HeroDealCard.tsx` (lines around 234-238) and the homepage hero data fetch — verify it filters on `is_active=true`.
3. Open `app/dispensary/[slug]/page.tsx` around line 461 — check what `href` resolves to (it's inside an IIFE I didn't unwrap).
4. The Maps fix is data, not code: run Task 2's backfill script with `--apply` and 60 listings will start showing pins.

**Files Code should read to pick up the thread:**

- `lib/links.ts` — the listingHref helper, central to all 4 GO HERE buttons
- `app/l/[id]/page.tsx` lines 121-126, 360-387 — the lookup + 404 path
- `app/map/page.tsx` lines 80-181 — the "Map view coming soon" fallback
- `app/components/HeroDealCard.tsx` line 236 (and the deal-fetch above it)
- `app/dispensary/[slug]/page.tsx` lines 455-465 — unfinished read

---

## Tasks not started (2 of 6)

### ❌ Task 5 — Tier 1 Monday outreach readiness — NOT STARTED

The 15 Tier-1 dispensaries are listed in `docs/ops/sales-playbook-20260422.md` (read during Task 3, table at lines 58-74). Per-dispensary readiness check (master_listings row, ≥1 active deal, hours, logo plan) was not run. Recommended SQL when picking this back up:

```sql
SELECT
  ml.slug,
  ml.name,
  ml.city,
  ml.phone,
  ml.website,
  COUNT(d.id) FILTER (WHERE d.is_active = true) AS active_deals,
  ml.logo_url IS NOT NULL AS has_logo,
  EXISTS (SELECT 1 FROM listing_hours WHERE listing_id = ml.id) AS has_hours
FROM master_listings ml
LEFT JOIN deals d ON d.listing_slug = ml.slug
WHERE ml.slug IN (
  -- the 15 Tier 1 slugs
  'nuera-east-peoria','nuera-urbana','seven-point-danville',
  'zen-leaf-naperville','terrace-cannabis-moline','high-haven-elgin',
  'revolution-dispensary-normal','ivy-hall-dispensary',
  'trinity-on-university','trinity-on-glen','noxx-east-peoria',
  'ayr-wellness-normal','beyond-hello-peoria',
  'lyfe-dispensary','shangri-la-springfield'
)
GROUP BY ml.slug, ml.name, ml.city, ml.phone, ml.website, ml.logo_url, ml.id
ORDER BY active_deals DESC, ml.name ASC;
```

The output goes into `docs/ops/tier-1-monday-outreach-ready-20260422.md` with a ✅/⚠️/❌ readiness table.

### ❌ Task 6 — Commit + push + session report

This handoff doc (`cowork-interrupted-2026-04-22-morning.md`) substitutes for the planned full session report. Commit + push happens immediately after this file is written.

---

## Files written this session (committable)

- `sql/migrations/2026-04-22-create-orphan-master-listings.sql`
- `scripts/backfill-logos-from-google-places.ts`
- `docs/handoffs/2026-04-22-orphan-research.md`
- `docs/handoffs/2026-04-22-logo-backfill-plan.md`
- `docs/audits/deal-freshness-v2-20260422.md`
- `docs/handoffs/path-a-scraper-spec-20260422.md`
- `docs/handoffs/cowork-interrupted-2026-04-22-morning.md` (this file)

Six task-output artifacts, plus this handoff = seven files. All ready to commit in one atomic commit.

---

## Decisions Matthew owes before next Cowork run

1. **Apply the orphan-listings migration?** It re-enables 7 deals and unblocks 6 listing pages. SQL is in `sql/migrations/2026-04-22-create-orphan-master-listings.sql`.
2. **Run the Google Places backfill?** Costs ~$2. Pre- or post- the orphan migration? (Recommendation: post.) Script is `scripts/backfill-logos-from-google-places.ts`.
3. **Greenlight the Path A scraper spec?** Or hold and double down on Path C dispensary outreach? Spec is in `docs/handoffs/path-a-scraper-spec-20260422.md`.
