# Illinois Fallback Audit — 2026-04-20

**Goal:** distinguish (a) legitimate state references from (b) `city || "Illinois"` fallback bugs that produce "Illinois, IL" / "Illinois, IL · slug" when a master listing is missing `city`.

**Verdict legend:**
- **LEGIT** — actually means the state of Illinois. Leave alone.
- **BUG** — fallback string that becomes nonsensical when concatenated with ", IL" or rendered as a city.
- **TRACE / CODE** — comment, type annotation, or branch logic that still references "Illinois" as a sentinel; safe but tracks a fragile convention.

## BUG hits — these produce "Illinois, IL" (or worse) when listing.city is null

| # | File:Line | Snippet | Verdict | Recommended fix |
|---|---|---|---|---|
| 1 | `app/l/[id]/page.tsx:377` | `address: \`${listing.city \|\| "Illinois"}, IL\`` | **BUG** | Schema.org address should be `${listing.city}, IL` and the whole `address` field should be omitted when city is null — Google rejects "Illinois, IL" as malformed. Match the dispensary-detail fix Code is shipping in Task 4. |
| 2 | `app/claim/[slug]/page.tsx:43` | `const city = listing?.city \|\| "Illinois"` | **BUG** | Variable then used in heading copy and meta tags. Use `listing?.city` directly and conditionally render city pill instead of fabricating it. |
| 3 | `app/map/page.tsx:94` | `city: l.city \|\| "Illinois"` | **BUG** | Map pin tooltip will read "Illinois" for the 21 listings missing city. Map pin should use `null`-skip pattern; if no city, label with `state` only. |
| 4 | `app/deals/[category]/page.tsx:323` | `addressLocality: d.city \|\| "Illinois"` | **BUG** | JSON-LD addressLocality must be a city, not a state. Drop the field (or set to null) when city is missing. |
| 5 | `app/deals/[category]/page.tsx:432` | `const answerCity = city \|\| "Illinois"` | **BUG** | Drives "Open the [answerCity] deal page" copy. Reframe as `city ? \`${city} deal page\` : "this deal page"`. |
| 6 | `app/dispensary/[slug]/page.tsx:172` | `const city = listing.city \|\| "Illinois"` | **BUG** | Used downstream at lines 216, 356, 359, 454 (all branched on `city !== "Illinois"`). The whole pattern is a sentinel-string anti-pattern — works today, but every consumer has to remember to check. Refactor to `listing.city as string \| null` and let consumers branch on null. |
| 7 | `app/dispensary/[slug]/page.tsx:216` | `const city = listing.city \|\| "Illinois"` | **BUG (dup)** | Same module, second function. Same fix. |
| 8 | `app/dispensary/submit-deal/page.tsx:257` | `{form.city \|\| "Illinois"}, IL` | **BUG (UI preview)** | Submit-deal preview shows "Illinois, IL" when the form is half-filled. Render placeholder "Your city, IL" instead. |
| 9 | `app/dispensary/submit-deal/DispensaryAutocomplete.tsx:120` | `{(m.city \|\| "Illinois") + ", IL · " + m.slug}` | **BUG** | Autocomplete dropdown row says "Illinois, IL · altius-carol-stream" for any of the 21 cityless listings. Show `m.slug` only when city is null, or compute city from slug suffix (`-carol-stream`). |
| 10 | `app/components/RecentlyViewedRow.tsx:86` | `{it.city \|\| "Illinois"}` | **BUG** | Recently-viewed pill reads just "Illinois" for cityless listings. Should fall back to `""` (hide subline) or to slug-derived city. |
| 11 | `app/deal/[id]/page.tsx:155` | `const city = listing?.city \|\| "Illinois"` | **BUG** | Deal-detail header — the exact bug Matthew flagged for Ivy Hall. Code is fixing Ivy Hall in Task 4 but this `||` sentinel needs to die fleet-wide. |
| 12 | `app/deal/[id]/page.tsx:209` | `const city = listing?.city \|\| "Illinois"` | **BUG (dup)** | Same module, second consumer. Same fix. |
| 13 | `app/cannabis/illinois/[slug]/opengraph-image.tsx:14` | `const cityName = city?.name \|\| "Illinois"` | **BORDERLINE** | OG image for the IL hub itself is reasonably "Illinois" — but at the per-slug city subpage this is the wrong fallback. Decide per-route; if this file only handles `/cannabis/illinois/[slug]` for known cities, the fallback is dead code. Recommend `throw` or a 404-style image instead of pretending. |

## LEGIT hits — these correctly reference the state

| File:Line | Snippet | Verdict |
|---|---|---|
| `config/directories/project-green.ts:24` | `region: "Illinois"` | LEGIT — directory config, names the project's region. |
| `components/CityPage.tsx:18` | `/** State display name — e.g. "Illinois" */` | LEGIT — JSDoc comment. |
| `components/CityPage.tsx:76` | `name: "Illinois"` | LEGIT — schema.org `addressRegion` for a city's parent state. |
| `components/NeighborhoodPage.tsx:63` | `name: "Illinois"` | LEGIT — same, neighborhood under Chicago. |
| `config/cities/illinois/*.ts:16` (×34 files) | `state: "Illinois"` | LEGIT — city config records the state. |
| `config/neighborhoods/chicago/*.ts:9` (×9 files) | `state: "Illinois"` | LEGIT — neighborhood config, parent state. |

## TRACE / CODE hits — branching on the sentinel string

| File:Line | Snippet | Verdict | Note |
|---|---|---|---|
| `lib/cityNormalize.ts:4-60` | comment + `if (c && c !== "Illinois") return c; ... return fromSlug \|\| "Illinois";` | **TRACE** | This is the canonical normalizer the rest of the app should use — it explicitly rejects "Illinois" as a city sentinel and falls back to slug-derived city before defaulting. Good. Recommend: route every `\|\| "Illinois"` BUG fix through `normalizeCity(listing.city, listing.slug)` from this file instead of inlining a different fallback at each callsite. |
| `app/deals/[category]/page.tsx:97` | `// as "Illinois". Both are awkward to express in a PostgREST` | TRACE | Comment about a known DB-view fallback (`active_deals_with_listings`) returning "Illinois" when the listing join misses. Real source of the bug — when this view is fixed, every BUG hit upstream stops misbehaving. |
| `app/dispensary/[slug]/page.tsx:356,359,454` | `city !== "Illinois" ? ...` | TRACE | Branch logic relying on the sentinel. Will become dead code once the `||` fallback is removed and `city` is allowed to be `null`. |
| `app/deal/[id]/page.tsx:277,280` | `city !== "Illinois" ? ...` | TRACE | Same pattern. |
| `app/api/deals/recommend/route.ts:120` | `// returned generic "Illinois" because the listing wasn't joined.` | TRACE | Comment. Suggests deeper fix is at the view layer, not the consumer. |

## Root cause + recommended fix sequence

1. **Stop creating new `\|\| "Illinois"` callsites.** Add an ESLint rule or a CI grep that fails on `\|\| "Illinois"` and `\|\| 'Illinois'`.
2. **Fix the data view.** `active_deals_with_listings` evidently joins to `master_listings` and substitutes `'Illinois'` when city is null. Change the view to return `NULL` for city instead, so consumers fail loudly rather than silently.
3. **Centralize through `lib/cityNormalize.ts`.** Replace each BUG-row fallback with `normalizeCity(listing.city, listing.slug)`. That function already does the right thing — slug-derive first, then `null`.
4. **Remove the `city !== "Illinois"` branches** in `app/dispensary/[slug]/page.tsx` and `app/deal/[id]/page.tsx` once #3 ships — they become `city ? ... : ...`.
5. **Backfill the 21 cityless listings** (per listing-completeness-matrix-20260420.md). Most are dedupe shells (e.g., `rise-naperville` → `rise-dispensary-naperville`) that should be deactivated rather than enriched.

## Counts

- **BUG callsites:** 13 (12 inside `app/`, 1 borderline OG image)
- **LEGIT callsites:** ~46 (mostly per-city/neighborhood config)
- **TRACE callsites:** 5 branches + 3 comments
