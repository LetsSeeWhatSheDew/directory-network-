# PuffPrice Empty-State Copy — April 26, 2026

**Purpose:** exact strings Code can drop into components. Every empty state on PuffPrice should be **honest, positive, specific**, and offer a next step.

**Principles (from the deal data policy):**

1. Never pad. No fake or stale deal cards to avoid a blank feed.
2. Always tell the user *why* the surface is empty — refreshing, scope, no current promo.
3. Always offer a next step — browse listings, set an alert, check a nearby city, try a different category.
4. Own the moment. We chose this scope and this data policy; the empty state is a feature, not an apology.

**Voice:** confident, plainspoken, Central-IL-local. No exclamation points. No "oops." No "we're so sorry." A user in a parking lot needs an answer, not a mood.

**Token conventions below:**

- `{City}` — the city name, TitleCase (e.g., "Peoria").
- `{NearestCity}` — the nearest CIL city with at least one active dispensary listing.
- `{NearestDistance}` — miles to nearest CIL city with listings, integer (e.g., `7`).
- `{Category}` — the deal category singular noun lowercased (e.g., "flower," "edibles," "vape").
- `{DispensaryName}` — the full listing name as stored (e.g., "Ivy Hall Dispensary").
- `{HoursAgo}` — integer hours since last verification.
- `{DaysAgo}` — integer days since last verification.
- `{LastCheckedDate}` — short date, e.g., "Apr 23".

---

## 1. Homepage hero — zero CIL deals are live

Applies when the homepage deal query returns zero active Central IL deals. Should feel like a product that's working, not a product that's broken.

### 1A — primary

**Headline:**
> We're refreshing Central Illinois deals.

**Subheadline:**
> Every deal on PuffPrice is pulled directly from a dispensary and verified within the last 72 hours. When nothing meets that bar, we show nothing — and check again in a few hours.

**CTA (primary button):**
> Browse Central IL dispensaries

**CTA (secondary link):**
> Get an alert when deals drop →  (links to `/alerts`)

### 1B — variant, slightly warmer

**Headline:**
> No live deals in Central Illinois right now.

**Subheadline:**
> We only publish deals we can verify directly with the dispensary. Next refresh is within the next 6 hours. In the meantime, here are the 26 licensed Central IL dispensaries we track.

**CTA (primary button):**
> See all Central IL dispensaries

**CTA (secondary link):**
> Text me when a deal goes live →

### Notes for Code

- Keep the scroll structure intact — dispensary directory tiles still render below the hero. Empty state replaces the deal feed only.
- Do not remove the stats strip; switch its value to "0 active deals right now · next refresh in under 6 hours · 26 Central IL dispensaries."
- If the query actually errored (not "zero results," but "Supabase threw") — use a separate error state. These copy strings assume a successful zero-result query.

---

## 2. City page — city has 0 dispensaries (Bartonville, Morton, Washington)

Applies to CIL cities that remain in scope but currently hold zero active listings. Code has already landed copy for these — this revises it for the scope lock and the direct-source policy.

### 2A — primary

**Headline:**
> No licensed dispensaries in {City} yet.

**Body:**
> {City} is in our Central Illinois coverage area, but there are no open dispensaries inside city limits as of today. The closest option is **{NearestCity}**, about {NearestDistance} miles away.

**CTA (primary):**
> See dispensaries in {NearestCity} →  (links to `/cannabis/illinois/{nearestCitySlug}`)

**CTA (secondary, smaller):**
> Browse all Central IL cities →

### 2B — footer note (small print under the CTA)

> Own a {City} dispensary? We'll add your listing the day your license goes active. [Get listed →](/get-listed)

### Notes for Code

- The current Code-landed copy is close; this revision tightens the framing ("Central Illinois coverage area") and gets rid of any softness that makes the empty state feel apologetic.
- `{NearestCity}` and `{NearestDistance}` should pull from `config/cities/illinois/geo.ts` — the Haversine helper Code added.
- Three cities in scope: Bartonville, Morton, Washington. All sit in the Peoria metro; nearest-city lookups will resolve to Peoria, East Peoria, Peoria Heights, or Pekin.

---

## 3. City page — city has dispensaries but 0 active deals

Applies to any CIL city where `master_listings` has at least one active row but the city currently has zero active deals. As of the April 26 cutover, this covers: Bloomington, Normal, Urbana, Springfield, Peoria Heights, Pekin.

### 3A — primary

**Headline:**
> Dispensaries in {City}, Illinois — deal tracking live soon.

**Body:**
> We track {N} licensed dispensaries in {City}. Our direct-source scraper refreshes deals every 6 hours from each dispensary's own website and social channels. If you don't see deal cards yet, it means no current promotion has been verified directly at the source.

> PuffPrice never republishes deals from Leafly, Weedmaps, or other aggregators — so the trade-off is that newer markets show up here more slowly. They also show up more accurately.

**CTA (primary):**
> Browse {City} dispensaries  (anchor-link to the listing grid on the same page)

**CTA (secondary, smaller):**
> Own a {City} dispensary? Submit a deal → (links to `/dispensary/submit-deal`)

### 3B — short variant (for narrow space, e.g., above listings grid)

**Headline:**
> {N} dispensaries in {City} — deal tracking coming soon

**Body (one line):**
> We verify every {City} deal directly with the dispensary. Cards will appear here as soon as a current promotion is confirmed.

### Notes for Code

- `{N}` = count of active `master_listings` rows in `{City}` scoped to `project_tag='green'`.
- The dispensary list renders as-is below this banner; do not insert placeholder deal cards.
- For dispensary owners, the submit-deal link should carry a `?city={citySlug}` query param so the submit form can pre-fill.

---

## 4. Individual listing page — no active deals

Applies to `/l/[slug]` where the listing has zero active deals.

**Treatment: quiet absence.** No empty deal card. No "0 deals" state. The deal section of the page simply does not render.

If the page layout needs *something* in that slot for visual balance (design call), use this minimum microcopy, rendered small, muted:

### 4A — minimum line (only if design requires)

> No verified deals today at {DispensaryName}.
> *Subline (smaller, muted):* We check every 6 hours directly with the dispensary. [Set an alert →](/alerts?listing={slug})

### Notes for Code

- Default: render nothing. Do not build an empty deal card.
- Option 4A is only for cases where the page's vertical rhythm looks broken with the deal section gone — ask design first, don't default to it.
- The alert link should carry the listing slug so the alert form can prefill.

---

## 5. Category page — zero deals match

Applies to `/deals/[category]` pages when the CIL-filtered query for that category returns zero active deals.

### 5A — primary

**Headline:**
> No {Category} deals in Central Illinois right now.

**Body:**
> Our scraper checks every Central IL dispensary every 6 hours and only publishes deals we can verify directly at the source. Nothing is live in this category today. Check back soon, or try a related category.

**CTA (primary):**
> See all active Central IL deals  (links to the full deals page)

**CTA (secondary — adjacency suggestions, one-liner):**
> Try **{AdjacentCategory1}** or **{AdjacentCategory2}** instead.

### Category adjacency map (for `{AdjacentCategory1}` / `{AdjacentCategory2}`)

| Requested category | Suggest 1 | Suggest 2 |
|---|---|---|
| flower | pre-rolls | concentrates |
| pre-rolls | flower | vape |
| vape | concentrates | flower |
| edibles | beverages | tinctures |
| concentrates | vape | flower |
| beverages | edibles | tinctures |
| tinctures | edibles | topicals |
| topicals | tinctures | edibles |
| accessories | flower | vape |

If no adjacency match exists, fall back to "See all active Central IL deals" as the only CTA.

### Notes for Code

- `{Category}` lowercased singular ("flower," "edible," "concentrate"). The URL slug (e.g., `/deals/edibles`) is plural; the copy is singular for readability.
- Page metadata (title + description) in the zero-state should still read positively — "Central IL cannabis {Category} deals" — not "no deals" — so the page still indexes cleanly when deals return.
- Do not render the empty-category page as a 404. Return 200 with the empty-state body.

---

# Deal Card Microcopy

Exact strings for every deal card state. Applies across every surface where a deal card renders — homepage, category pages, city pages, listing pages, search results.

## 6.1 Fresh deal — verified within last 24 hours

**Label (on card, small, close to timestamp):**

If `{HoursAgo} === 0`:
> Verified just now

If `1 ≤ {HoursAgo} ≤ 23`:
> Verified {HoursAgo}h ago

At the day boundary (`{HoursAgo}` would be `24`), flip to the "recent" pattern below. Never render "24h ago."

**Visual:** no special treatment. Standard card.

## 6.2 Recent deal — verified 24 to 72 hours ago

**Label:**

If `{DaysAgo} === 1`:
> Verified yesterday

If `{DaysAgo} === 2` or `{DaysAgo} === 3`:
> Verified {DaysAgo} days ago

**Visual:** standard card. No muting, no badge.

## 6.3 Stale deal — verified more than 72 hours ago, still active

**Label (two lines, close to timestamp):**

Line 1:
> Last checked {LastCheckedDate}

Line 2 (smaller, muted):
> Verification pending

**Visual:** reduce card opacity to ~85%. Do not hide. Do not remove the price. Add a small "verification pending" pill in the corner (muted background, no color).

**Behavior:** deal still clicks through to the dispensary. The user decides whether it's worth the drive.

## 6.4 Expired deal — scraper confirmed the deal is gone

**Treatment:** not shown. Row remains in DB (`is_active=false`, `deactivation_reason='source_removed'`) but the card never renders to users.

## 6.5 Inactive dispensary — `master_listings.is_active=false`

**Treatment:** not shown. Neither the dispensary's detail page nor any deal associated with that dispensary renders publicly. Applies whether or not the deal row itself is active.

## 6.6 Beyond 7 days without re-verification

A deal that sits in state 6.3 ("verification pending") for a full 7 days without a successful re-verification is automatically deactivated on the next scrape cycle with `deactivation_reason='source_unreachable'`. No user-facing state — the card simply disappears.

## 6.7 Verification level indicator (optional, per card)

If design wants to surface the verification tier visibly (discussion still open):

- `scraped_direct_source`: no label (this is the default; don't add visual noise for the standard state).
- `verified_direct_contact`: small badge — "Verified by PuffPrice."
- `imported_not_verified`: not shown publicly at all. This tier is being deprecated April 26.

Default position: do not render a verification-level badge on the standard card. Reserve it for the detail page if the design warrants.

---

# Handoff Notes

- Code owns implementation. All copy above is final unless otherwise noted; any rewrite that shortens or reframes should run past Matthew first.
- All copy is compatible with the scope doc (`docs/central-illinois-scope.md`) and the deal data policy (`docs/deal-data-policy.md`). If any string here contradicts either doc, the docs win.
- Stale-state opacity reduction (section 6.3) is a design choice — the pill is the semantic signal; opacity is belt-and-suspenders. If opacity interacts badly with the card background, drop it and keep the pill.
- All CTA links reference existing routes; none of this requires new routing work from Code.
