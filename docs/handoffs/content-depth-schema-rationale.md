# Handoff — Content Depth Schema Rationale
> **Pairs with:** `sql/migrations/2026-04-20-content-depth.sql` (NOT YET APPLIED).
> **Why it matters:** the listing-page inventory audit flagged seven content gaps; two of them need schema support before Code can build the UI. This doc records the trade-offs so the choices don't get re-litigated next sprint.

## Decision summary

| Section | Storage choice | Alternative considered | Why we picked it |
|---------|---------------|------------------------|------------------|
| User tips | **Normalized table** `dispensary_tips` | JSONB array on `master_listings` | Moderation workflow + GDPR + cross-listing queries all require row semantics. |
| Google photos | **JSONB column** `master_listings.photos` | Separate `listing_photos` table | Read-only cache of an external API; always read with the listing; rarely mutated. |
| Google reviews | **JSONB column** `master_listings.google_reviews` | Separate table | Same reasoning as photos — same source, same access pattern. |

## Tips: why a table beats JSONB

A tip needs:

- **Per-row moderation state** — pending/approved/rejected/flagged. Updating one tip's status inside a JSONB array means rewriting the whole array; concurrent moderation actions race.
- **Per-tip timestamps** — `created_at`, `moderated_at`. JSONB requires hand-rolled timestamp objects with no DB defaults.
- **GDPR / takedown workflow** — when a user requests deletion of one tip, the operation is `DELETE FROM dispensary_tips WHERE id = $1`, not "UPDATE master_listings SET tips = jsonb_array_remove_at(...)".
- **Cross-listing reporting** — "show me all tips submitted in the last 7 days" is a scan-the-table query. Inside JSONB it's a full master_listings scan with jsonb expansion per row.
- **RLS by status** — Postgres RLS on a column is awkward. RLS on a row ("anon can SELECT only `WHERE status = 'approved'`") is one line, ships safely day one.
- **Volume risk** — if even 5% of dispensaries get 20 tips, we're at ~1KB × 20 × 0.05 × 107 = ~107KB on master_listings alone. Negligible today, but every read of master_listings then pulls all the tips, including pending and rejected ones the public can't see. RLS would need to filter inside a generated column. Not worth the complexity.

## Photos: why JSONB beats a table

Photos are different:

- **Read-only cache** — Google owns the truth, we just memoize. We never UPDATE a photo row; we replace the cache wholesale on the nightly refresh.
- **Always read with the listing** — every listing-page render needs the photo strip. A separate table forces a JOIN per page load. JSONB is one column already in the row.
- **Rarely mutated** — refresh cycle is 24h–30d; mutation rate is essentially zero for serving traffic.
- **Naturally structured by source** — Places API returns a structured array of `{ name, widthPx, heightPx, authorAttributions }`. Storing it as JSONB is closer to the source format than fitting it into table columns.
- **Bounded size** — Places returns up to 10 photos per place. ~5KB per row max; trivial.
- **TTL behavior is one column** — `photos->>'refreshed_at'` is the staleness marker. Indexed expression backs the "find oldest 50" query for the refresh cron.

## When this trade-off would flip

Move photos to a table when **any** of these become true:

- Users start uploading their own photos (now we need per-photo ownership, moderation, auth, deletion workflow — all the things tips need).
- Photo count per listing exceeds 30 (storage starts to matter).
- We start reading photos independent of the listing (e.g., a "photo grid across all dispensaries" page).

Until any of those land, JSONB stays.

Move tips to JSONB when… well, never. The trade-offs above are stable for any UGC workflow.

## Why `google_reviews` lives on `master_listings`, not a separate cache table

Considered a `listing_google_cache` table keyed by `place_id`. Rejected because:

- Same source and same TTL as photos — splitting them adds a JOIN with no benefit.
- We never need reviews without the parent listing.
- One row = one cache entry is simpler to refresh atomically: `UPDATE master_listings SET photos = ?, google_reviews = ?, ... WHERE id = ?`.

If we ever need to share Google data across multiple master listings for the same physical location (e.g., a chain that has two slug variants for the same store), then a normalized cache keyed on `place_id` makes sense. We have zero such cases today.

## Implications for Code

- The Places backfill script (`scripts/backfill-logos-google-places.ts`) needs to write to three new columns now, not just `logo_url`. Suggested per-row update:
  ```ts
  await supabase
    .from('master_listings')
    .update({
      google_place_id: place.id,
      photos: { refreshed_at: new Date().toISOString(), photos: place.photos.map(...) },
      google_reviews: { refreshed_at: new Date().toISOString(), rating: place.rating, ... },
    })
    .eq('id', listing.id);
  ```
- The tips submission form is a new route — recommend `app/l/[id]/tips/submit/page.tsx` plus a server action that inserts with `status='pending'`. The existing "Report outdated info" mailto can stay; tips and corrections are different content types.
- Moderation UI lives under `/admin/tips` — list pending tips ordered by `created_at ASC`, approve/reject actions update `status` and `moderated_at`.

## Implications for Cowork

- Once the migration applies, Cowork can manually insert canonical tips for the top-12 listings (e.g., "ATM inside, $3 fee — not all cards accepted") to seed the section before user submissions trickle in. Use `status='approved'` directly with `auto_approved=true` and `moderated_by='cowork-seed'` for audit.
- Same for Google review pull: once `google_place_id` is populated for the top-12 listings (manual or via the script), Cowork can prime the `google_reviews` JSONB by hand for visual QA without waiting on the cron.

## Non-goals tonight

- No UI work — that's Code's lane next session.
- No migration apply — Matthew approves first, then a write-capable session runs it.
- No backfill — both Places API key and column existence are prerequisites.
