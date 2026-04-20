# Listing Page Content Inventory — 2026-04-20

**Scope:** both customer-facing dispensary templates:
- `app/l/[id]/page.tsx` — "GO HERE" confirmation screen (core flow, 887 lines)
- `app/dispensary/[slug]/page.tsx` — SEO profile bookmark page (525 lines)

## Fields currently rendered

### `app/l/[id]` — `Listing` type pulls 25 columns. Rendered:

| Field | Rendered? | Where | Notes |
|---|---|---|---|
| `name` | yes | `<h1>` + logo fallback initial + schema.org | |
| `slug` | indirect | used for OG url and back-link to `/dispensary/[slug]` | |
| `type` | yes | type badge ("DISPENSARY") | defaults to "Dispensary" if null |
| `plan` | yes | "★ Featured" badge when boost/featured | |
| `claimed` | yes | claim banner toggle + claim card state | |
| `logo_url` | yes | hero logo, related-card logo, schema.org `image`, OG image | falls back to first-letter tile when null |
| `hero_image_url` | partial | only as OG image fallback — never rendered in the page body | **dead data in UI** (see Opportunity #3) |
| `city`, `state` | yes | hero location line, schema.org `addressLocality/Region`, related cards subtitle | "Illinois" fallback bug (see illinois-fallback-audit-20260420.md) |
| `address1` | yes | hero location line + `mapsHref` | |
| `phone` | yes | contact button | |
| `website` | yes | "Visit website →" link | |
| `short_description` | yes | hero tagline + schema.org description + meta fallback | |
| `long_description` | yes | "About" card (full text, no typography polish) | see Opportunity #1 |
| `meta_title`, `meta_description` | yes | `<head>` only | |
| `delivery`, `drive_thru`, `online_ordering`, `accepts_credit`, `cash_only`, `atm_onsite`, `wheelchair_accessible`, `parking`, `loyalty_program` | yes | "Amenities" chips | **100% of listings have all 9 flags null** — chips always empty |
| `listing_hours` (7 rows) | yes | "Hours" card + open-now status + schema `openingHoursSpecification` | |
| `listing_attributes` | yes | "Features" chips | **0 rows in table today — always empty** |
| `products_or_services` | yes | "Products & Services" grouped by category | **0 rows in table today — always empty** |
| `deals` (top 10 by discount) | yes | big "Active deal" card up top, expandable `<details>` for rest | |
| related listings (same city, 3 rows) | yes | "Other dispensaries in {city}" | breaks when city is null |

### `app/dispensary/[slug]` — more focused, renders:

Everything `/l/[id]` renders **except**: the claim form card (replaced by subtle "Own {name}? Claim →" footer), related dispensaries, and the product/attributes cards. Additionally renders:

| Extra field | Source | Rendered |
|---|---|---|
| `menu_url` | `Listing.menu_url` (defined in TS type) | **Column does NOT exist in `master_listings` schema** — TS type extends a field that Supabase doesn't store. The page gracefully skips, but the button never appears. See Opportunity #2. |
| "Deal details →" link per deal | routes to `/deal/[id]` | |
| Open-now status row | same logic as `/l/[id]` | |

## Fields in Supabase schema but NOT rendered on either page

Pulled from `mcp__supabase__list_tables` for `master_listings`:

| Column | Reason not rendered | Recommendation |
|---|---|---|
| `hero_image_url` | Only used as OG fallback; no in-page hero image strip | Render as banner image above hero card if present. Most listings are null. |
| `address2` | Not in TS type, not rendered | Low priority — only matters for suite numbers. Include in `mapsHref`. |
| `postal_code` | Not in TS type | Include in schema.org address for better Google Maps match. |
| `email` | Not rendered | Intentional? A public email is spam bait for owners — leave hidden. |
| `license_number`, `license_state`, `license_expires_on` | Not rendered | **Strong trust signal** — "Licensed IL dispensary #R-7xxxxxxx" is free credibility. Add a small "Verified license" badge. |
| `verified_on` | Not rendered | Paired with `license_expires_on`, gives us a "Last verified Apr 2026" line. Trust signal. |
| `owner_user_id` | Internal | Skip. |
| `lat`, `lng` | Not rendered (only 1/61 populated) | Once backfill lands: embed a 100×100 static map thumbnail with a "tap for directions" CTA. |
| `schema_org_json` | Not used in UI | Pre-built JSON-LD override — could swap in when non-null instead of rebuilding on each render. Premature. |
| `project_tag` | Internal | Skip. |

## Fields that would make the page useful but don't exist yet

| Proposed field / section | Why | What it costs |
|---|---|---|
| `google_place_id` + `google_rating` + `google_review_count` | Users don't trust our reviews; they trust Google's. One line ("4.6 ★ on Google · 412 reviews") outranks any prose we write. | Column add + Places API backfill (Chrome Wave 2 / Code Task 5). Cheap after Places key is live. |
| `price_per_gram_index` (pre-computed per listing, updated nightly) | Turns every listing into a PuffPrice Index data point — "This store averages $8.20/g on flower, $0.40 below IL average". Unique to us. | See puffprice-index-feasibility-20260420.md. |
| `user_tips[]` (short user-submitted tips like "budtender Sarah is great / parking is tight") | Recreates the Google Maps "tips" UX, differentiates from Leafly. | New table + claim-aware submission + moderation. Meaningful cost. Defer until there's traffic to generate submissions. |
| `photo_gallery[]` (list of image URLs) | Every competitor has this. We have logos and that's it. | Scrape from Places API `photos[]` — already paid for in Wave 2 budget. |
| `recent_price_drops[]` (last 30d deal history for this listing) | The data already exists in `deals` table — this is a query, not a column. Code Task 7 ships part of this. | Cheap; trivial query. |
| `latest_verified_label` ("Hours verified Apr 3, 2026 by owner") | Users always wonder if hours are real. Pairing `listing_hours.updated_at` with `verified_on` answers that without needing the `menu_url` scrape. | One SELECT max(updated_at) join. Cheap. |
| `owner_note` / "Message from {Name}" | Lets claimed owners post a live note ("We're closed Sunday 4/20 for inventory"). Strongest conversion tool for getting claim sign-ups. | New column, simple markdown textarea, cache-bust on edit. Cheap. |
| `open_late_flag` / `sunday_hours_flag` (derived) | Huge filter opportunity for "where can I go right now." | Zero cost — derivable from `listing_hours`. |

## Three concrete content-upgrade sections shippable this week

### Upgrade A — "Last verified" + license + hours-freshness trust strip

**Schema gap:** none. All columns already exist.

**Query:**
```sql
SELECT
  license_number, license_state, license_expires_on, verified_on,
  (SELECT MAX(id) FROM listing_hours WHERE listing_id = m.id) AS hours_last_id
FROM master_listings m
WHERE slug = $1;
```
(Use `listing_hours` row-id as freshness proxy, or add `updated_at` column to that table.)

**UI pattern:** Thin horizontal strip directly under the hero status pill:
```
🪪 IL license R-72194 · ⏰ Hours verified 3 days ago · 🔒 Verified by owner
```
Render each chip conditionally on the data's presence. Gray when absent ("Hours not yet verified"). Answers "is this real?" in one glance. Zero cost — pure UI assembly from existing columns.

### Upgrade B — Google reviews embed + photo strip

**Schema gap:** `master_listings.google_place_id` (add text column, backfill via Places API).

**Query:** per-page Server Component fetch to
```
GET https://places.googleapis.com/v1/places/{place_id}?fields=rating,userRatingCount,reviews,photos
  Authorization: Bearer $GOOGLE_PLACES_API_KEY
```
Cache the result in a new `listing_google_cache` table keyed by `place_id`, TTL 24h. Check cache first. Keeps page load < 200ms and avoids per-request API calls.

**UI pattern:** New card under "About," before "Related dispensaries":
```
┌── 4.6 ★ Google (412 reviews) ───────────────────────┐
│  ★★★★★ "Budtender was amazing..." — G.K., 2w ago    │
│  ★★★★☆ "Line was long but worth it..." — M.R., 1m   │
│  See all 412 →                                       │
└───────────────────────────────────────────────────────┘
📷 [photo] [photo] [photo] [photo] [+24 more]
```
One card, one API call, unblocks the #1 trust question.

### Upgrade C — "Recent price drops at this store" (30-day deal history)

**Schema gap:** none. `deals` table has `created_at`, `discount_value`, `is_active`.

**Query:**
```sql
SELECT title, discount_value, discount_unit, created_at, expires_at
FROM deals
WHERE listing_slug = $1
  AND created_at >= now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 10;
```

**UI pattern:** New card under the active-deal card (or inside the expandable `<details>`):
```
┌── Deal history · 6 drops in last 30 days ──────────┐
│  Apr 12  15% off flower            (expired)         │
│  Apr 05  $10 off any eighth         (expired)         │
│  Mar 28  BOGO 50% cartridges        (expired)         │
│  …                                                    │
│  This store runs a deal about every 5 days.           │
└────────────────────────────────────────────────────────┘
```
Signals "this store actually runs deals" to user, gives Google more page content with timestamps (SEO), and lays pipe for the PuffPrice Index roll-up. Code's Task 7 scaffolds part of this already.

## Summary

What's rendered today: hero (name/city/address/logo/status/phone/website), deals, hours, about, amenity chips, attribute chips (empty), product chips (empty), claim card, related-city dispensaries.

What's wasted: 9 amenity flags + 2 child tables always empty. Features/Products cards render as empty containers on most listings.

What's missing that competitors have: Google reviews/rating, photos, last-verified date, license number, price index, deal history, owner note. None of these require speculative infrastructure; they require either a Places API backfill (already scoped) or pure SQL over the `deals` table.
