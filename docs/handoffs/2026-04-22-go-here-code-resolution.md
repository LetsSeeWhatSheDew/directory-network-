# GO HERE bug — Code resolution note (2026-04-22)

**From:** Code (Apr 22 morning session)
**Pairs with:** `docs/handoffs/2026-04-22-go-here-bug-investigation-final.md` (Cowork's diagnosis)

## Decision: no code change shipped.

Cowork's investigation concluded both symptoms are data-driven, not code-driven:

- **Maps tab placeholder** — `app/map/page.tsx` correctly falls back to the
  "coming soon" branch when fewer than 3 listings have `lat`/`lng`. With
  60/61 IL listings missing coords today, `points.length === 1`, so the
  placeholder renders. Running `scripts/backfill-logos-from-google-places.ts --apply`
  fills coords for the existing 61 rows in a single Places Text Search call
  (~$2 total spend). Code change unnecessary.
- **Deal-card GO HERE 404** — every call site (`app/deal/[id]/page.tsx:386`,
  `app/deals/[category]/page.tsx:708`, `app/components/HeroDealCard.tsx:236`,
  `app/dispensary/[slug]/page.tsx:461`) runs the slug through
  `lib/links.ts:listingHref`, which returns `null` for `""`/`"undefined"`/`"null"`
  and the IIFE early-returns when null. The 7 historically-orphaned deals
  are now `is_active=false` (per `2026-04-22-fix-deal-listing-joins.sql`,
  already applied) and don't surface in feeds at all.

Verified: all 4 production call sites pass through `listingHref()` defender.

## What Matthew still needs to do

1. Apply `sql/migrations/2026-04-22-create-orphan-master-listings.sql` —
   creates 6 master_listings rows + reactivates 7 deals that were
   deactivated by the join-fix migration.
2. Run `scripts/backfill-logos-from-google-places.ts --apply` — fills
   lat/lng/logo on all IL listings including the 6 new ones. Fixes the
   Maps placeholder naturally.

## What Code did not ship

- No changes to `listingHref` or any GO HERE render site.
- The optional defense-in-depth `safeListingHref(slug, city, knownSlugs)`
  described in Cowork's doc was considered and rejected — adds a
  round-trip per render without materially raising paranoia above what
  the DB invariant (`is_active=true AND listing_slug joinable`) already
  provides.

## Post-migration verification (Matthew owns)

After Matthew applies the orphan-listings migration + runs Places backfill,
spot-check in prod:

- `https://www.puffprice.com/l/curaleaf-morris` renders (new master row)
- `https://www.puffprice.com/l/natures-treatment-milan` renders (new master row)
- `https://www.puffprice.com/map` shows ≥3 pins instead of placeholder
- `https://www.puffprice.com/deals/flower` hero GO HERE resolves 200

If any of those 404 or misroute, re-run Cowork's H1/H2 SQL from the
investigation doc — but failure after this point would point at a new
bug, not the ones covered here.
