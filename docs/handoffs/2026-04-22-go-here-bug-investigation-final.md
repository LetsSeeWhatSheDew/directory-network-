# GO HERE bug — final investigation (2026-04-22 afternoon)

**Status:** Both symptoms diagnosed. Maps tab needs data, not code. Deal-card GO HERE has **no active bug** in production code as of `7f39ee7`.

**Continues from:** `docs/handoffs/cowork-interrupted-2026-04-22-morning.md` (Task 4, 60%)

---

## TL;DR

| Symptom | Cause | Fix | Owner |
|---|---|---|---|
| Maps tab renders "Map view coming soon" placeholder | 60 of 61 IL/green listings have NULL `lat`/`lng`. The page falls back when `points.length < 3`. | Run `scripts/backfill-logos-from-google-places.ts --apply` (already written, dry-run-default). The Places Text Search field mask returns coords + logo in one call. | Matthew (when ready to spend ~$2 of Places credit) |
| Deal-card GO HERE 404 (the historical Matthew complaint) | **Already fixed by `2026-04-22-fix-deal-listing-joins.sql`** (which deactivated the 7 orphaned deals). All 46 currently-active deals have a valid `master_listings.slug` join. No reproducible 404 path remains. | None for now. Apply orphan-listings migration to reactivate the 7 deals — migration creates the matching `master_listings` rows in the same transaction, so GO HERE will resolve cleanly. | Matthew (apply migration), Code (no change needed) |
| Risk after orphan migration applies | The 7 reactivated deals point to 6 newly-created `master_listings` slugs. If the migration is partially applied (master_listings INSERT succeeds, deal UPDATE fails), the 7 deals stay deactivated and there's nothing to 404 on. If both succeed, all 7 GO HERE buttons resolve. | Migration is wrapped in `BEGIN/COMMIT` with abort-on-mismatch sanity check — atomic by construction. | None — already defensive |

**Bottom line for Code:** No GO HERE code change is required. If a 404 reproduces in production after the orphan migration applies, run the H1/H2 SQL below — but the most likely explanation is browser cache of an old `/deals/all` page that was rendered before the orphans were deactivated.

---

## Ground truth (verified via Supabase MCP, 2026-04-22)

```
Active deals (is_active=true):                     46
  - status_reason='imported_not_verified':         46  (the entire active feed is the Apr 14 import)
  - status_reason=NULL:                             0  (none — this is significant)
Inactive deals:                                    54
  - status_reason=NULL (deactivated regular):      44
  - status_reason='orphaned':                       7  (waiting on orphan-listings migration)
  - status_reason='expired':                        3

IL/green listings:                                 61
  - missing lat:                                   60
  - missing lng:                                   60
  - has both coords:                                1  (emerald-city-dispensary-chicago-il only)
  - missing logo_url:                              49

Active deals with broken listing_slug join:        0  ← KEY FINDING
View `active_deals_with_listings` row count:      46  (all clean — no NULL name/city/slug)
master_listings.slug UNIQUE constraint:           ✅ persists (master_listings_slug_key)
```

---

## Part A — Maps tab placeholder

### Reproduction

Visit `/map`. Page renders the "Map view coming soon" centered placeholder with a "Browse all Illinois dispensaries →" green button.

### Root cause (confirmed)

`app/map/page.tsx:91-100` filters listings to those with both `lat` AND `lng`. With 60 of 61 listings missing coords, `points.length === 1`. Lines 129-168 then render the placeholder branch when `points.length < 3`. This is the intended fallback — the page is honest about not having enough pins to be useful.

The `getListings()` PostgREST call at line 41-47 includes `&lat=not.is.null` so the database does the filter. The `points.length < 3` check is the second defense.

### Fix path

Two paths to >3 listings with coords:

1. **Recommended — run the Google Places backfill.** `scripts/backfill-logos-from-google-places.ts` populates `lat`, `lng`, AND `logo_url` in the same Text Search call (single API hit per dispensary, no Place Details follow-up). Worst-case spend: ~$1.76 for full IL coverage. After this run, 50-60 listings should have coords and the map renders normally with one pin per dispensary plus deal pins overlaid.

2. **Stop-gap — manually populate 3-5 high-traffic listings.** Not worth it — backfill is dry-run-safe and cheap.

### Sequencing

Apply the orphan-listings migration FIRST so the 6 new `master_listings` rows backfill in the same Places sweep. (This is the recommendation already in `docs/handoffs/2026-04-22-logo-backfill-plan.md`.)

### Code change required

**None.** The placeholder is correct behavior. After backfill, the `points.length >= 3` branch renders `MapClient` normally.

---

## Part B — Deal-card GO HERE button

### All 4 GO HERE button locations in production code

Grep confirmed exactly four `"GO HERE"` strings rendered in components:

| File | Line | Component | Slug source | Helper |
|---|---|---|---|---|
| `app/deal/[id]/page.tsx` | 386 | `<Link>` inside an IIFE | `deal.listing_slug` (single deal page) | `listingHref(deal.listing_slug, city)` |
| `app/deals/[category]/page.tsx` | 708 | `<DealCtaLink>` | `topDeal.slug \|\| topDeal.listing_slug` | `listingHref(...)` |
| `app/components/HeroDealCard.tsx` | 236 | `<TrackedLink>` | `deal.slug \|\| deal.listing_slug` (from `/api/deals/recommend`) | `listingHref(slug, city)` at line 195 |
| `app/dispensary/[slug]/page.tsx` | 461 | `<Link>` inside an IIFE | The page's own `slug` (it IS the dispensary page — by definition valid) | `listingHref(slug, city)` |

All four call sites:

* Run the slug through `listingHref()` (`lib/links.ts:6-15`)
* `listingHref` rejects empty / `"undefined"` / `"null"` strings and returns `null`
* If `listingHref` returns `null`, the IIFE/conditional returns `null` and no link renders

So the button is **structurally defended** against an empty/garbage slug. The only path to a 404 is a slug string that LOOKS valid but has no row in `master_listings`.

### Data path verification

`/l/[id]/page.tsx` lines 121-126 (per previous handoff) queries `master_listings WHERE slug = $1`. If no row, lines 360-387 render "Listing not found".

So GO HERE → 404 requires: a deal whose `listing_slug` does not exist in `master_listings.slug`. Tested via:

```sql
-- H2 from previous session
SELECT d.id, d.listing_slug, d.title, d.status_reason
FROM deals d
LEFT JOIN master_listings ml ON ml.slug = d.listing_slug
WHERE d.is_active = true AND ml.slug IS NULL;
```

**Result: zero rows.** Every active deal has a matching listing.

### Why the bug existed historically

Before `2026-04-22-fix-deal-listing-joins.sql` applied, the 7 deals now tagged `status_reason='orphaned'` were `is_active=true` and pointed at 6 dispensary slugs that didn't exist in `master_listings` (`bisa-lina-joliet`, `cookies-chicago`, `curaleaf-morris`, `mood-shine-chicago-heights`, `natures-treatment-milan`, `perception-cannabis-chicago`). Those would have surfaced in deal feeds and 404'd on click.

That migration deactivated them. Symptom resolved retroactively.

### Why the bug stays fixed after the orphan-listings migration applies

`sql/migrations/2026-04-22-create-orphan-master-listings.sql` (NOT YET APPLIED):

* INSERTs 6 master_listings rows with the **exact same slugs** the orphaned deals reference
* INSERTs 42 listing_hours rows
* UPDATEs the 7 deals back to `is_active=true, status_reason='imported_not_verified'`
* Wrapped in `BEGIN/COMMIT` — atomic
* Unique constraint on `master_listings.slug` (verified: `master_listings_slug_key`) prevents accidental dupes if re-run after partial apply (`ON CONFLICT (slug) DO NOTHING`)

After apply: 7 deals reactivate and their `listing_slug` joins resolve to the 6 new `master_listings` rows. GO HERE → `/l/{slug}` → 200, listing page renders. **No code change needed.**

### One residual consideration: 404 risk window

There's a microsecond between `master_listings INSERT` commit and `deals UPDATE` commit where, if a request arrives with an old `is_active=true` cache of an orphaned deal (impossible given current state, but possible if Vercel caches a stale page after migration), the deal points to a slug that DOES exist but the listing has minimal data. That's still a 200, not a 404 — the listing page renders with sparse data (no description, no real hours filled in unless `listing_hours` rows landed). Nothing to fix.

### What COULD still cause GO HERE 404 in the wild

Three theoretical paths, all low-probability:

1. **Hand-typed URL by a user**: someone types `/l/wrong-slug` directly. Out of scope.
2. **External link from an old SEO snapshot**: Google indexed a deal-card page before the orphan deactivation, the user clicks through. Already mitigated — orphans are now `is_active=false`, the underlying deal-card page returns 404 itself before the user ever sees a GO HERE button.
3. **A new code path landing that bypasses `listingHref()`**: would have to be deliberate. Test before merge.

### Fix recommendation for Code

**Do nothing for the bug itself.** Optional defense-in-depth:

```ts
// lib/links.ts — add an optional "validate against known set" path
// for ranking/feed code that can afford the round-trip:
export async function safeListingHref(
  slug: string | null | undefined,
  city: string | null | undefined,
  knownSlugs: Set<string>
): Promise<string | null> {
  const href = listingHref(slug, city);
  if (!href) return null;
  if (!knownSlugs.has(slug as string)) return null;
  return href;
}
```

Probably not worth the complexity. The structural defense at `listingHref()` plus the DB-side `is_active=true AND listing_slug joinable` invariant is the right level of paranoia.

---

## Are Maps and GO HERE the same root cause?

**No.** They share the symptom shape ("data quality propagating to UX") but the cause is different:

* **Maps**: missing `lat`/`lng` columns on master_listings rows that DO exist
* **GO HERE**: was missing `master_listings` rows entirely for 6 dispensaries (now resolved by deactivating the orphans, fully resolved by the pending migration)

The Google Places backfill closes BOTH gaps in one pass — populates lat/lng for the existing 61 rows AND fills lat/lng/logo for the 6 newly-inserted rows from the orphan migration. That's why the recommended sequence is **migration first, then backfill**.

---

## Decision points for Matthew

1. **Apply `2026-04-22-create-orphan-master-listings.sql`?** Yes — reactivates 7 deals, eliminates the orphan tail, makes the active feed 53 deals (46 + 7).
2. **Run `scripts/backfill-logos-from-google-places.ts --apply` after the migration?** Yes — fixes Maps tab, fills 49 logo gaps, costs ~$2.
3. **Spend any Code time on a GO HERE patch?** No. The ranking, defense, and DB invariants are correctly aligned.

---

## Files referenced

* `app/map/page.tsx` (lines 91-181 — placeholder branch)
* `app/deal/[id]/page.tsx` (line 386)
* `app/deals/[category]/page.tsx` (line 708)
* `app/components/HeroDealCard.tsx` (lines 195, 236)
* `app/dispensary/[slug]/page.tsx` (line 461)
* `app/api/deals/recommend/route.ts` (the data path for HeroDealCard)
* `lib/links.ts` (the `listingHref` defender)
* `sql/migrations/2026-04-22-create-orphan-master-listings.sql` (NOT YET APPLIED)
* `sql/migrations/2026-04-22-fix-deal-listing-joins.sql` (already applied — deactivated the orphans)
* `scripts/backfill-logos-from-google-places.ts` (dry-run-default)
