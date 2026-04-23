# Google Places backfill — master_listings logo + lat/lng

Script: [scripts/backfill-logos-from-google-places.ts](backfill-logos-from-google-places.ts)

Backfills `master_listings.logo_url` and `master_listings.lat / .lng` using the
Google Places API (New). Default scope is the 11 Central Illinois cities defined
in [lib/constants/regions.ts](../lib/constants/regions.ts).

Safe by default: **dry-run unless you explicitly pass `--live`**. Dry-runs
write a JSON report to `/tmp/places-backfill-dryrun-YYYYMMDD.json` for human
review before any DB writes.

---

## 1. One-time setup

### 1a. Pull Supabase keys locally

```
vercel env pull .env.local
```

This populates `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### 1b. Manually add the Places key

`GOOGLE_PLACES_API_KEY` is marked **Sensitive** in Vercel, so `vercel env pull`
will NOT include it. Copy it from the Vercel project Environment Variables page
and append to `.env.local`:

```
GOOGLE_PLACES_API_KEY=AIza...
```

The Places key is server-side only (never `NEXT_PUBLIC_`) and restricted to
the Places API in Google Cloud, so it is safe to keep locally.

---

## 2. Run a dry-run (default)

```
npx tsx scripts/backfill-logos-from-google-places.ts
```

What you'll see on stdout:

- Cost estimate **at the start** (projected Places calls × $32 / 1,000).
- Per-listing log line: `WOULD-WRITE`, `SKIP no-match`, `SKIP no-data`, or
  `SKIP already-complete`.
- Summary block at the end.
- Path to the JSON report: `/tmp/places-backfill-dryrun-YYYYMMDD.json`.

The JSON includes, per listing:

- `status` — one of `would-write`, `no-match`, `no-data`, `already-complete`,
  `capped`, `ambiguous-city`.
- `match.placeId`, `match.displayName`, `match.formattedAddress`,
  `match.location.latitude/longitude`.
- `wouldUpdate` — the exact `{ logo_url?, lat?, lng? }` patch that would be
  sent to Supabase.
- `additionalPhotoRefs` — up to 3 Places photo references beyond `photos[0]`,
  captured for future use (there is no `photo_gallery` column today, so these
  are NOT written to Supabase).

---

## 3. Scope flags

| Flag | Default | Effect |
|---|---|---|
| _(none)_ | Central IL (11 cities) | Targets IL/green listings whose `city` matches a Central IL city name. |
| `--cities=slug1,slug2` | — | Comma-separated city slugs. Use slugs from `lib/constants/regions.ts` (e.g., `--cities=peoria,normal`). |
| `--slug=<listing-slug>` | — | Backfill one specific listing. Overrides `--cities`. |
| `--live` (or `--apply`) | off | Actually write PATCH requests to Supabase. Without this, the script is a dry-run. |

Examples:

```
# Dry-run Central IL (default)
npx tsx scripts/backfill-logos-from-google-places.ts

# Dry-run only Peoria + East Peoria
npx tsx scripts/backfill-logos-from-google-places.ts --cities=peoria,east-peoria

# Live run against one listing
npx tsx scripts/backfill-logos-from-google-places.ts --slug=nuera-east-peoria --live

# Live run against Central IL (after reviewing the dry-run JSON)
npx tsx scripts/backfill-logos-from-google-places.ts --live
```

---

## 4. What the script writes

| Field | Behavior |
|---|---|
| `logo_url` | **Fallback only.** If the row already has a `logo_url`, it is left alone. Places returns a storefront image that makes a decent logo only when nothing else is available. |
| `lat` | **Always updated** when Places returns coordinates. Only 1 of 111 listings has coords today, so overwriting is a net gain. |
| `lng` | Same as lat. |
| Additional photos | **Not written.** Captured in the dry-run JSON only (no `photo_gallery` column exists yet). |

---

## 5. Cost envelope

- Text Search (New, Pro tier): $32 / 1,000 calls — the main cost.
- Place Photos: $7 / 1,000 calls — we construct the media URL ourselves from
  `photos[].name` and store that URL in `logo_url`. Google serves the bytes
  on demand when a user views the listing, not when the script runs, so the
  script itself does NOT pay Photo-call charges.

Central IL scope (~30 listings × 1 Text Search each) ≈ **$0.96**. Against the
$300 Google Cloud free-trial credit (expires 2026-07-23), this is negligible.

The script hard-caps at **100 Places calls per run** and paces at 1 req/sec.

---

## 6. Graceful handling

- Missing `GOOGLE_PLACES_API_KEY` → exits with guidance (see §1b).
- Missing `SUPABASE_SERVICE_ROLE_KEY` → exits (the key is required for
  PATCHing `master_listings`).
- Places API timeout or error → logs warning, skips the listing, continues.
- No Places match for a listing → records `status: "no-match"` and moves on;
  never fabricates coordinates.
- Ambiguous match (Places returned the wrong storefront in another state) →
  we record all 3 top results in the dry-run JSON so you can eyeball before
  going live. The write logic uses result 0 only.

---

## 7. After a live run

- Spot-check a random handful of listings in Supabase:
  `SELECT slug, name, city, lat, lng, logo_url FROM master_listings WHERE city = 'Peoria';`
- Verify a logo URL loads in a browser (copy the `logo_url` into a tab).
- Verify map pins appear correctly on `/cannabis/illinois/[slug]` pages.

If a logo looks wrong, clear it:
`UPDATE master_listings SET logo_url = NULL WHERE slug = '...';` — then re-run
the script with `--slug=...` to try again. The fallback rule means it will
attempt Places again; if Places still returns the wrong photo, better to keep
it null and let Matthew hand-assign a proper logo later.

---

## 8. Related files

- [scripts/backfill-logos-google-places.ts](backfill-logos-google-places.ts) —
  older, simpler, no dry-run — superseded by this script. Left in place for
  reference; do not run.
- [lib/constants/regions.ts](../lib/constants/regions.ts) — Central IL scope
  definitions.
