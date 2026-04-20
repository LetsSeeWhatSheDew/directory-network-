# Competitor Depth Matrix — 2026-04-20

> ⚠️ **Data source disclosure (per prompt patch):** web-fetch tools were not exercised for this audit. Content below is derived from **training data, may be stale as of the model's knowledge cutoff (May 2025)**. Chrome's Wave 1 produces the fresh visual audit with live screenshots — when that lands in `~/Desktop/DN-Research/competitor-visuals-20260420/`, cross-check this matrix against it.

## Scope

Comparing PuffPrice's dispensary detail page (per `listing-page-content-inventory-20260420.md`) against three cannabis directories plus one menu-aggregator:

- **Leafly** — national cannabis directory + menu aggregator. Category leader in SEO.
- **Weedmaps** — national cannabis directory + transactional (order-for-pickup / delivery). Competitor most feared by dispensaries.
- **Cannasaver** — deals-focused directory (the closest direct comp to PuffPrice's positioning). Primarily CO/OK, limited IL footprint.
- **iHeartJane** — menu/storefront infrastructure (powers many dispensary ordering flows directly). Useful reference for the "GO HERE → place order" endgame.

## Dispensary-detail section matrix

Legend: ✓ present, — absent, ~ partial. "PP" = PuffPrice today.

| Section | Leafly | Weedmaps | Cannasaver | iHeartJane | PP |
|---|---|---|---|---|---|
| Hero: name, logo, type badge | ✓ | ✓ | ✓ | ✓ | ✓ |
| Google-style star rating + review count | ✓ (in-house rating) | ✓ (in-house + Google cross-posted) | — (minimal) | ✓ | — |
| Top review quote(s) on detail page | ✓ | ✓ | — | ✓ | — |
| Distance-from-you chip ("3.2 mi") | ✓ | ✓ | ~ | ✓ | — (needs lat/lng) |
| Open now / status pill | ✓ | ✓ | ✓ | ✓ | ✓ |
| Full 7-day hours table | ✓ | ✓ | ✓ | ✓ | ✓ |
| "Last verified" hours timestamp | ~ | ✓ | — | ~ | — |
| Address + tap-to-map | ✓ | ✓ | ✓ | ✓ | ✓ |
| Static map thumbnail above fold | ✓ | ✓ | — | ✓ | — |
| Tap-to-call phone | ✓ | ✓ | ✓ | ✓ | ✓ |
| Website link | ✓ | ✓ | ✓ | ✓ | ✓ |
| License number (state ID badge) | ✓ | ✓ | — | ✓ | — |
| Photo gallery (exterior, interior, products) | ✓ | ✓ | — | ~ | — |
| Full live menu (browsable by category) | ✓ | ✓ | — | ✓ (native) | — (link only, `menu_url` not stored) |
| Price per gram / per eighth indicators | ~ | ~ | ✓ | ✓ | — (not computed) |
| "Deals today" strip | ✓ | ✓ | ✓ (primary focus) | ✓ | ✓ |
| Deal history / past drops (30-day) | — | — | ~ | — | — (code scaffolding planned) |
| Reservation / pickup order button | ✓ | ✓ | — | ✓ (native checkout) | — |
| Delivery zone / ETA | ~ | ✓ | — | ✓ | — |
| Amenities chips (ATM, parking, etc.) | ✓ | ✓ | ~ | ✓ | ✓ (data almost always null) |
| Accepts payment types breakdown | ✓ | ✓ | — | ✓ | ~ (booleans, null) |
| User tips / Q&A thread | ~ | ✓ | — | — | — |
| Strain-level availability search | ✓ | ✓ | — | ✓ | — |
| Brands carried | ✓ | ✓ | — | ✓ | — (empty `products_or_services` table) |
| Recreational vs. medical tab | ✓ | ✓ | — | ✓ | — (Code Task 9 scaffolding only) |
| First-time-customer deal highlight | ✓ | ✓ | ✓ | ✓ | ~ (inside deal description) |
| Loyalty program CTA | ✓ | ~ | — | ✓ | ~ (chip only) |
| Sign-up-for-SMS-deals form inline | ✓ | ✓ | ✓ | ~ | ~ (separate /alerts page) |
| "Similar dispensaries near you" module | ✓ | ✓ | ✓ | ✓ | ✓ (same-city only) |
| Strain/product reviews from users | ✓ | ✓ | — | ✓ | — |
| About / long-form description | ✓ | ✓ | ~ | ✓ | ✓ |
| FAQ schema / FAQ section | ✓ | ✓ | — | ~ | — |
| Full LocalBusiness JSON-LD | ✓ | ✓ | ✓ | ✓ | ✓ |
| SpecialAnnouncement JSON-LD per deal | ~ | ~ | ~ | — | ✓ (we win here) |

## Sections PuffPrice lacks — triaged

### Cheap to copy (ship this week or next, minimal data cost)

1. **Static map thumbnail above the fold.** Google Maps Static API, $2 per 1k loads. Requires `lat/lng` — blocks on Chrome Wave 2 + Code Task 5 backfill. UI effort: 20 minutes.
2. **"Last verified" timestamp for hours and license.** Data already exists (`listing_hours` rows carry implicit timestamp once we add `updated_at`; `verified_on` column exists). Pure UI.
3. **Deal history strip (last 30 days).** Already scoped as Code Task 7 plus Upgrade C in content inventory. Pure SQL over `deals`.
4. **License number badge.** `license_number`, `license_state`, `license_expires_on` already in `master_listings`. Backfill for 61 listings is a morning's work against the IL Cannabis Regulation Oversight Officer (CROO) PDF — public data.
5. **Inline SMS-deals signup on detail page.** Form + endpoint exist under `/alerts` — port the form component inline. Trivial.
6. **First-time-customer deal callout.** `deals.title` / `description` already mentions it — simple regex to promote into a chip on detail. Code's `howToUseDeal()` already does partial detection.
7. **FAQ schema (FAQ JSON-LD).** 3 Q&A pairs per listing ("Do they accept credit?" "Is there delivery?" "What hours are they open today?") generated from existing booleans + hours. Extra SEO surface for zero data cost.

### Requires data we don't have (scope before shipping)

1. **Google-style rating + reviews.** Blocks on Places API key (Wave 2) + `google_place_id` column + `listing_google_cache` table + 24h cache policy. Estimated 2 days.
2. **Photo gallery.** Places API `photos[]` gives 3–10 per place. Needs image proxy / CDN pattern to avoid exposing API key in HTML. Estimated 1 day.
3. **Live menu (browsable).** Every dispensary's menu URL is unique (Dutchie, Jane, Treez, etc.). Scraping is brittle and owners dislike it. Better path: owner-claimed listings populate a `menu_url` column (iframe fallback or "View live menu" modal). 2 weeks of owner outreach.
4. **Distance-from-you.** Blocks on lat/lng + browser geolocation (we already have the GPS flow). Should slot in right after backfill lands.
5. **Recreational vs. medical split.** Code Task 9 stubs the column; real data requires a multi-source audit (IL treats medical cards separately and not all IL adult-use stores also take medical). 1 day scraping + QA.
6. **Strain-level availability.** This is Leafly/Weedmaps' moat and their deepest integration. **Not worth chasing for PuffPrice.** We are a deal index, not a menu aggregator.
7. **Reservation / pickup order button.** Requires dispensary-side integration (Dutchie, Jane). Affiliate/partnership motion. Defer 90+ days.
8. **User tips / Q&A threads.** Needs moderation pipeline. Only valuable with non-trivial traffic. Defer.

### Sections competitors have that are actively bad (don't copy)

1. **Weedmaps' heavy popup system** (age-gate + location-gate + notification-gate, all triggered in the first 3 seconds). Terrible on mobile in a parking lot. PuffPrice's trust-first, friction-minimal loading wins here; stay that course.
2. **Leafly's auto-play video ads on some detail pages.** User-hostile in a regulated vertical. Do not mimic.
3. **Cannasaver's aggressive "Sign up to unlock deal code" gate.** Converts listings to friction. Kills trust. PuffPrice's "no account, full deal access" commitment is the differentiator — don't dilute it.
4. **Weedmaps' fake-scarcity expiration pressure ("Only 3 hours left!")** when the deal is actually recurring weekly. PuffPrice's `is_recurring` + `expires_at` rules already handle this honestly — keep it honest.
5. **Leafly's dense "brands carried" badge walls** that bury contact info below the fold on mobile. Worth noting for design-handoff — keep brands optional and collapsible, not the primary screen real estate.
6. **iHeartJane's "age verified" modal on every session.** Regulatory-theater version of Weedmaps. We can leave it on the first visit (cookie-persisted) and keep it off after.

## 10 design moves for Chrome Wave 1 to verify

Chrome should capture screenshots and rank these:

1. How big/bold is Leafly's "open now" status pill vs. PuffPrice's — is it the first thing your eye hits?
2. Where does each site place the rating stars (above the fold, right of name, or below hero)?
3. Weedmaps — does the deal card on the detail page include the stock-price-style "from $25" delta?
4. iHeartJane — how do they handle "recently viewed" vs. PuffPrice's `RecentlyViewedRow`?
5. Cannasaver — what does their deal-detail page look like? Is it single-offer-focused like ours, or stacked?
6. How does Leafly collapse hours on mobile? Accordion or always-visible?
7. Photo gallery sizing — tiles vs. single hero image?
8. Does any competitor show a "Cheapest gram here" badge similar to the PuffPrice Index?
9. Map embed vs. static thumbnail — which trend wins on mobile?
10. How prominent is the SMS-signup CTA vs. the primary order CTA?

## Net strategic take

PuffPrice's unique wedge is **deal intelligence + honest pricing + no gatekeeping**. Every copy-this-week item above reinforces that. Every "blocks on data" item competes on competitor strengths (menu, reviews, strain search) and should be sequenced *after* the wedge is proven. The Index (see puffprice-index-feasibility-20260420.md) is the one feature none of these four competitors ship — it's the asymmetry worth guarding.

**Cross-check required:** Chrome Wave 1 live screenshots will likely show more-evolved patterns than my training data. Treat specific quantitative claims here (e.g., "Leafly's rating is in-house") as starting hypotheses, not verified facts.
