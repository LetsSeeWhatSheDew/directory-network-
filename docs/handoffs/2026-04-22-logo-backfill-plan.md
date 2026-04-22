# Logo + Coords Backfill Plan — 2026-04-22

## Current coverage (IL, project_tag='green')

| Field      | Missing | Have | Total | % missing |
|-----------|---------|------|-------|-----------|
| `logo_url` | 49      | 12   | 61    | 80%       |
| `lat`/`lng`| 60      | 1    | 61    | 98%       |

After Matthew applies `2026-04-22-create-orphan-master-listings.sql`, these numbers become **55 missing logo / 12 have, 66 missing coords / 1 have, 67 total** (the 6 new orphan rows are inserted with both fields NULL).

## Why coords matter as much as logos

The decision engine in `lib/decisionEngine.ts` ranks deals partly by distance from the user. With only 1/61 dispensaries having coordinates today, the GPS-aware angle of "built for a real person in a parking lot" is effectively broken outside that one dispensary's neighborhood. The same Google Places call that returns a photo also returns `location.latitude` / `location.longitude` — backfilling logos without coords would waste 80% of the API value.

## Script: `scripts/backfill-logos-from-google-places.ts`

- **Dry-run by default** — writes nothing without `--apply`.
- `--apply` to commit.
- `--slug=<slug>` for one-off backfills (handy after the orphan migration applies).
- 1 req/sec pacing, hard cap of 100 calls/run.
- Skips rows that already have both `logo_url` and `lat/lng`.
- Per-skip log line with reason code (`no-match`, `no-data`, `already-complete`, `cap-hit`).
- Returns logo_url and lat/lng from a single `places:searchText` call (field-mask:`places.id,displayName,photos,location,formattedAddress`) — no separate Place Details call needed; that saves $0.85 vs. the spec's two-call estimate.

## Cost (Google Places API New, April 2026 pricing)

| Surface | Per-call | Calls per run (worst case) | Cost |
|--------|---------:|---------------------------:|------|
| Text Search (Pro) | $0.032 | 49 (today) → 55 (post-orphan migration) | ~$1.57 → ~$1.76 |
| Place Details | $0.017 | 0 (not needed) | $0 |

**Total worst-case spend: under $2** for full IL coverage.

(Original spec estimated $0.034/listing × 50 = ~$1.70 assuming a Text Search + Details combo. The script avoids Details by widening the Text Search field mask.)

## Run sequence

1. `vercel env pull .env.local` → grabs `GOOGLE_PLACES_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` locally.
2. `npx tsx scripts/backfill-logos-from-google-places.ts` (dry-run; eyeball the WOULD-WRITE log).
3. Spot-check a handful of `WOULD-WRITE` rows by clicking the logo URL or pasting coords into Google Maps. If a dispensary has a similarly-named restaurant nearby, Places might return the wrong row.
4. `npx tsx scripts/backfill-logos-from-google-places.ts --apply`
5. Re-query coverage:
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE logo_url IS NULL) AS missing_logo,
     COUNT(*) FILTER (WHERE lat IS NULL) AS missing_coords,
     COUNT(*) AS total
   FROM master_listings WHERE state='IL' AND project_tag='green';
   ```
6. For any remaining `no-match` skips, fall through to manual entry (see below).

## Expected post-run coverage

Based on the existing `backfill-logos-google-places.ts` (older sibling) experience and Places' coverage of cannabis retail in IL, expect:

- Logo coverage: **55 → 8–12 missing** (~80–85% hit rate; misses are usually delivery-only or micro-licensee rebrands that haven't been Verified on Google Maps yet)
- Coords coverage: **66 → 3–5 missing** (Places carries coords for almost everything with an address)

## Manual fallback for misses

For rows that come back `no-match` or `no-data`:

- **Short-term:** add an admin-side upload field on `/admin/listings/[slug]` that POSTs to `/api/admin/listings/[slug]/logo` (multipart/form-data → Supabase Storage bucket `master-listings-logos`, then patches `logo_url` to the public URL).
- **Spec for that admin upload form:**
  - **File constraints:** PNG/JPEG/WebP only, ≤500KB, ideally square ≥200x200.
  - **Storage path:** `master-listings-logos/{slug}/logo.png` (overwrite on re-upload).
  - **Persisted URL:** Supabase public bucket URL (no signed URLs — logos are public).
  - **Validation:** server-side reject if MIME doesn't match extension; resize anything > 400px wide to 400px wide via `sharp` before write.
  - **Auth:** restrict the route to `owner_user_id == session.user.id` OR a Matthew-only admin email allowlist.
- **Coords fallback:** for the rare `no-data` coord miss, use a one-off Geocoding API call (`https://maps.googleapis.com/maps/api/geocode/json?address={street},{city},IL`) — same $5/1k pricing.

## Risk register

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Wrong-business match (e.g., a restaurant with same name) | Medium | Dry-run review before --apply; addr printed in skip log so reviewer can sanity-check |
| Photo URL embeds API key — leaks if logged | Low | API key is restricted in Google Cloud Console to specific domains/IPs (Matthew confirmed Apr 21). Server-side use only. |
| Hot-linking to Google's CDN long-term | Medium | Acceptable for now; spec a future job that downloads and rehosts in Supabase Storage if Places URL stability becomes an issue |
| Hitting Places quota during run | Low | Hard cap of 100/run; current need is ~55 |

## Decision needed from Matthew

> When do we spend the ~$2 of Places quota? Pre- or post- the orphan-listings migration apply?

Recommendation: **post.** Run once, after the migration is applied, so the 6 new rows pick up logo + coords in the same pass.
