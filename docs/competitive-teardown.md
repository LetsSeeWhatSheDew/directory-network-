# Competitive Teardown — Cannabis Deal Presentation

**Date:** April 17, 2026
**Owner:** Matthew
**Purpose:** Document how the top 5 deal-surfacing platforms present deals to Illinois users, identify gaps PuffPrice exploits, and steal what works.

> **Source note:** Direct egress to weedmaps.com, leafly.com, iheartjane.com, and cannapages.com was blocked during this research pass. Findings below come from published reviews, help center articles, SEO/marketing breakdowns, and Google search snippets of live deal pages. For any UI detail that matters before launch, walk through the actual pages on your phone and verify.

---

## Executive Summary

The cannabis deals space breaks into three archetypes:

1. **Discovery marketplaces** (Weedmaps, Leafly) — broad directories where deals are a secondary feature. Built to drive traffic to dispensary ad buyers.
2. **E-commerce menus** (Dutchie, iHeartJane/Jane) — run the dispensary's online store itself. Deals live inside each dispensary's menu, not aggregated across stores.
3. **Couponers** (Cannasaver / CannaPages) — old-school coupon aggregators with weak UX and stale data.

**None of them are answering "what is the best cannabis deal near me, right now, in Illinois."**
- Weedmaps and Leafly have national scope and are built for dispensary ad buyers; the "best deal" question is diluted across state markets and drowned by paid placements.
- Dutchie and Jane are per-dispensary menus — you can see a store's deals, but you can't rank deals across stores.
- Cannasaver is a couponer; no GPS, no ranking, no freshness signals visible in the snippets.

PuffPrice's moat, stated plainly: **state-specific, GPS-aware deal ranking with freshness as a first-class signal.** Nobody else is doing this for Illinois.

---

## 1. Weedmaps — `weedmaps.com/deals`

### How deals appear on the homepage
- Primary entry point for deals is `/deals`, with sub-paths by state and city (e.g. `/deals/united-states/illinois/chicago`).
- Deal cards render in a grid with a hero image, discount callout (e.g. "BOGO 50% Off"), dispensary name, location, and expiration window (e.g. "02/25 – 02/28").
- Two deal types are exposed: **in-store** (show code to budtender) and **online** (auto-applies in cart).
- Paid placements dominate the top of the grid — dispensaries pay ~$495/mo base for a listing and premium tiers for top placement.

### Deal card information
- Deal title (e.g. "BOGO 50% Off Pentagon 1000mg Cartridges")
- Dispensary name + city/neighborhood
- Discount type visualized in the title, not as a structured badge
- Product photo (usually brand/dispensary-supplied)
- Expiration date range
- CTA: typically "View Deal" → dispensary page or external menu

### GO HERE / navigation flow
- Click a deal → goes to a Weedmaps-hosted dispensary page with full menu, reviews, and "Get Directions" button
- Directions open in a map panel, not immediately hand off to Apple/Google Maps — extra tap required
- No "take me there now" flow; the site assumes discovery > action

### City/location filter
- Location selector at top, typed free-text
- Once set, URL becomes `/deals/united-states/[state]/[city]`
- Separate "Near me" geolocation option, but deal grid still shows paid placements first, not proximity-first

### What PuffPrice does better
- **Freshness-first ranking.** PuffPrice's decision engine weights discount depth and time remaining. Weedmaps sorts primarily by ad tier.
- **GO HERE confirmation flow.** PuffPrice's listing page is literally a "GO HERE" confirmation screen — deal, directions, hours, instructions. Weedmaps makes you click through to get to directions.
- **Illinois-only focus.** Weedmaps dilutes across 30+ state markets. PuffPrice is a state-specific source with no dilution.
- **No account required.** Weedmaps gates some deal detail behind login prompts. PuffPrice is free and open by default.

### What to steal
- **In-store vs. online deal typing.** Weedmaps explicitly distinguishes "show this to your budtender" vs. "auto-apply in cart." PuffPrice should tag every deal with redemption type so a user knows what to do when they arrive.
- **Deal detail pages with their own URL.** Weedmaps gives each deal a permalink (`/deals/strawberry-fields-dtc-bogo-50-off-pentagon-1000mg`). Good for SEO, good for sharing. PuffPrice should do the same.
- **Expiration windows, not just end dates.** "02/25 – 02/28" is clearer than "Expires 02/28" because it signals the whole active window.

---

## 2. Leafly — `leafly.com/deals`

### How deals appear on the homepage
- `/deals` shows deals filtered by location, with an ability to drill into `/deals/chicago-il-us` etc.
- Explicitly surfaces named deal types: **first-time discounts, veteran discounts, birthday deals, early bird specials, loyalty program entries.**
- Mixed with educational content — strain guides, product reviews, shop-by-effect taxonomy.

### Deal card information
- Product or deal image
- Discount type + headline
- Dispensary name, distance, star rating (3-part: service / medication / atmosphere)
- "Pickup" vs. "Delivery" badge where applicable
- Expiration or time remaining

### GO HERE / navigation flow
- Click → dispensary menu page with full product catalog hosted by Leafly
- Dispensary detail pages function more like product menus than location pages
- "Shop" buttons often lead to an integrated ordering flow (Leafly runs its own e-commerce in many states)

### City/location filter
- Location selector on every page with zip/city/state entry
- Filters include pickup/delivery, rec/medical, brand, THC %, price, deals, product category (Flower, Cartridges, Edibles)

### What PuffPrice does better
- **Speed-to-answer.** Leafly loads a lot — strain guides, editorial, reviews — before answering "where is the deal." PuffPrice's map + deal grid answers the question in one render.
- **No product-buy friction.** Leafly increasingly pushes users toward its own checkout flow (which many dispensaries don't fulfill via Leafly). PuffPrice directs users to the dispensary directly.
- **Illinois-native deal inventory.** Leafly's IL deal density is capped by who's paid for placement. Our 56 active deals are curated for the state.

### What to steal
- **3-part rating system.** Leafly splits reviews into service / product / atmosphere. This is exactly what a dispensary visitor actually cares about, and it's better than a single star score. PuffPrice should adopt something similar as social proof matures.
- **Deal type taxonomy.** Leafly's named deal types (first-time, veteran, birthday, early bird) are great SEO anchors. Each could be a filterable taxonomy + a landing page. "Illinois veteran discount cannabis" is a capturable long-tail.
- **Pickup vs. delivery badges.** Fast visual cue. PuffPrice should add these if applicable to Illinois dispensaries.

---

## 3. Dutchie — dispensary menus via `dutchie.com/dispensary/[store]`

### Context
Dutchie is **not a consumer deal-finder**. It's the e-commerce engine powering many dispensaries' "Shop Now" buttons. When a user clicks "Shop" on a dispensary's own site, the menu they see is often a Dutchie iframe. Relevant as a competitor because: Dutchie has a **"Specials" page** on each dispensary's menu, which is where many customers actually encounter deals.

### How deals appear
- Inside a dispensary's Dutchie-powered menu, "Specials" is a top-level nav item.
- Specials page shows product cards with sale badges, strike-through original price, and BOGO styling.
- Deals are product-level, not deal-level — they attach to specific SKUs in inventory.
- "Advanced discounts engine" supports complex rules: BOGO tiers, bundles, customer-group pricing.

### Deal card information
- Product photo (CDN-hosted, high quality)
- Product name, strain, weight, THC %
- Price, strike-through original, discount amount
- Sale badge ("Sale", "BOGO", "Happy Hour")
- Add to cart button

### Navigation flow
- User is **already** on a dispensary's site; "Shop" → Dutchie menu iframe → "Specials" tab.
- Checkout completes online; user picks up in-store.
- Every interaction stays within the dispensary's domain — which is good for the dispensary, terrible for cross-dispensary comparison.

### What PuffPrice does better
- **Cross-dispensary comparison.** Dutchie's architecture makes this impossible by design. A user on dispensary A's Dutchie menu can't see dispensary B's deals. PuffPrice aggregates across all 82 listings.
- **No account friction.** Dutchie menus often require age verification, location gating, and occasionally sign-in before you see prices. PuffPrice shows deals immediately.

### What to steal
- **Product-level price data + strike-through original.** When PuffPrice has a deal with a known product and original price, show the same visual language. "Was $50, now $35, save $15." This is the unit of truth a shopper cares about.
- **Sale badge taxonomy.** "BOGO" / "Sale" / "Happy Hour" as visual chips is fast. PuffPrice's deal cards already do some of this; Dutchie's execution is a reference.
- **Real product photos over stock images.** Dutchie has one of the largest product-photo libraries in cannabis. PuffPrice should build a thin layer of product-keyed photos where feasible.

---

## 4. iHeartJane (Jane) — `iheartjane.com`

### Context
Jane is Dutchie's main e-commerce competitor. Same architectural tradeoffs — Jane powers dispensary menus, and Jane Marketplace is a meta-menu across stores Jane powers.

### How deals appear
- Jane Marketplace allows browsing by location, deals, brands, effects.
- Each store menu has a "Specials" tab with sale pricing, BOGO callouts, and product-level deal cards.
- "Shop by effects" taxonomy (sleep, pain, creativity, relaxation) — more consumer-friendly than competitor deal pages.

### Deal card information
- Product photo
- Product name + brand
- Price + strike-through original
- Deal tag (BOGO, % off, $X/g)
- Distance from user's saved location
- Store name where deal applies

### Navigation flow
- Jane Marketplace → pick a location → pick a store → see deals within that store
- To go **to** the store, click "Get Directions" on the store page
- Ordering stays within Jane for stores Jane powers

### What PuffPrice does better
- **Deal-first ranking, not store-first.** Jane makes you pick a store before you see all deals. PuffPrice surfaces all 56 active deals ranked, and you choose which one to go get.
- **Illinois inventory density.** Jane Marketplace is national; Illinois results compete for pixels with 30 other states.
- **No ID/card upload required to browse.** Jane asks for one-time ID upload to purchase. PuffPrice requires zero friction to browse.

### What to steal
- **Shop by effect.** Sleep, pain, focus, relaxation. Not every deal needs an effect tag, but for edibles and tinctures especially, "deals on sleep products" could be a filterable view worth owning.
- **Brand follow + drop alerts.** Jane lets users follow brands for "exclusive offers." This is a PRO-tier feature worth copying — "Alert me when Cresco runs a deal" is a concrete value prop.
- **Personalized location save.** Jane remembers your location. PuffPrice does GPS detection; confirm we save the selected city between sessions (and if not, build it).

---

## 5. Illinois-specific deal sites — Cannasaver, CannaPages, Mint Deals, Verilife/RISE/Sunnyside own pages

### How they appear
- **Cannasaver / deals.cannapages.com** — coupon aggregator, thin UI, list of discount codes sorted by state. Deal cards are text-heavy with no photos. Very SEO-optimized but not UX-optimized.
- **Mint Deals** (mintdeals.com) — single-operator (Mint Cannabis) deals page. Looks like a dispensary chain landing page.
- **Verilife, RISE, Sunnyside** — each chain runs its own deals page, good for loyal customers but blind to cross-chain comparison.

### Deal card information
- Cannasaver: deal title, dispensary name, expiration, "view coupon" or click-to-reveal code
- Chain-owned pages: deal title, product photo, discount, valid days ("Mondays only"), fine print
- Almost no chain pages show distance from user; they assume you already know their locations

### Navigation flow
- Cannasaver: click deal → coupon reveal modal → user is expected to screenshot and show at dispensary
- Chain pages: click deal → product detail page on the chain's own e-commerce menu
- None of them do "get me there right now"

### What PuffPrice does better
- **Cross-chain aggregation.** Our 56 deals span Sunnyside, RISE, Verilife, Ivy Hall, and independents. No chain site does this.
- **GPS-aware ranking.** None of these sites meaningfully use location. Cannasaver is alphabetical.
- **Freshness as a ranking signal.** Cannasaver has dead deals in its index; we dedupe and expire aggressively.
- **Modern UI.** Cannasaver looks like 2012. Honest-to-god TouchOfGrey color palette.

### What to steal
- **Coupon codes shown inline, no modal.** Cannasaver makes users click to reveal the code — that's anti-pattern drag from the affiliate-coupon era. PuffPrice should show redemption clearly on the card.
- **Day-of-week filter.** Mint Deals' chain pages surface "Mondays only" clearly. PuffPrice should surface recurring-schedule deals distinctly from one-offs. If a dispensary does 25% off every Monday, that's worth knowing Sunday night.
- **Verilife's tier-of-customer segmentation.** Verilife exposes veteran, SSI/SSDI, medical, industry discounts cleanly. PuffPrice could filter "eligible to me" if we collect minimal profile data.

---

## Cross-Competitor Gap Matrix

| Feature | Weedmaps | Leafly | Dutchie | Jane | Cannasaver | **PuffPrice** |
|---|---|---|---|---|---|---|
| State-specific (IL) focus | No | No | N/A | No | Partial | **Yes** |
| Cross-dispensary deal ranking | Partial (ad-weighted) | Partial (ad-weighted) | No | Partial | No (alpha) | **Yes (algorithmic)** |
| GPS-aware | Yes | Yes | Per store | Yes | No | **Yes** |
| Freshness as ranking signal | No | No | No | No | No | **Yes** |
| No-account browsing | Yes | Yes | Varies | Partial | Yes | **Yes** |
| GO HERE confirmation flow | No | No | No | No | No | **Yes** |
| Price history | No | No | No | No | No | **PRO** |
| SMS alerts for deals | No (B2B only) | No (B2B only) | No | Brand follow | No | **PRO** |
| Deal detail permalinks | Yes | Yes | No | Yes | Yes | **Should add** |
| Sale badge taxonomy | Partial | Partial | Yes | Yes | No | **Should sharpen** |
| Day-of-week / recurring deals | No | No | No | No | Partial | **Should add** |
| 3-part dispensary rating | No | Yes | No | No | No | **Consider post-launch** |
| Shop-by-effect | No | Partial | No | Yes | No | **Consider for edibles/tinctures** |
| First-time / vet / birthday filter | Partial | Yes | No | No | No | **Should add** |
| Deal ownership / attribution to dispensary | Yes | Yes | Built-in | Built-in | Partial | **Yes** |
| MCP / API for AI citation | No | No | No | No | No | **Zone 4 (uncontested)** |

---

## Takeaways for Matthew

**1. The biggest competitor gap is specificity.** Weedmaps and Leafly dilute Illinois in a 30-state directory. Dutchie and Jane silo per-dispensary. Nobody is the state-specific authority. That's the position PuffPrice is trying to take, and the research confirms the lane is open.

**2. The biggest UX gap is the path from deal to door.** Every competitor makes users click through at least one intermediate page before they get directions. PuffPrice's "listing page = GO HERE confirmation screen" is a real differentiator.

**3. We should copy deal typing from Weedmaps and deal taxonomy from Leafly.** Both are low-effort additions that unlock SEO landing pages and better filtering.

**4. We should ignore Dutchie/Jane as direct competitors.** They're infrastructure. We live on top of them. The more they power dispensary menus, the more deal data we can (eventually) ingest.

**5. Cannasaver is dying.** Its SEO is legacy and its UX is broken. It's the closest direct competitor by intent, and it's beatable in 90 days with better content and data freshness.

---

## Sources

- [Weedmaps deals page overview](https://weedmaps.com/deals)
- [Weedmaps BOGO deal example — Pentagon 1000mg](https://weedmaps.com/deals/strawberry-fields-dtc-bogo-50-off-pentagon-1000mg)
- [Weedmaps Chicago deals](https://weedmaps.com/deals/united-states/illinois/chicago)
- [Weedmaps for Business — run deals and promotions](https://weedmaps.com/business/deals/)
- [Leafly deals homepage](https://www.leafly.com/deals)
- [Leafly Chicago deals](https://www.leafly.com/deals/chicago-il-us)
- [Leafly dispensary finder help](https://help.leafly.com/hc/en-us/articles/1500000621781-How-to-find-a-dispensary-near-you)
- [Leafly retail solutions overview](https://success.leafly.com/retail)
- [Weedmaps vs Leafly comparison — CannaPlanners](https://cannaplanners.com/learn/weedmaps-vs-leafly)
- [Weedmaps vs Leafly — AIQ](https://aiq.com/blog/weedmaps-vs-leafly)
- [Dutchie e-commerce overview](https://business.dutchie.com/ecommerce/ecommerce)
- [Dutchie Pro platform](https://business.dutchie.com/ecommerce/dutchie-plus)
- [Jane vs Dutchie comparison](https://hybridmarketingco.com/jane-vs-dutchie-the-battle-for-dispensary-menu-domination/)
- [iHeartJane homepage](https://www.iheartjane.com/)
- [iHeartJane marketplace app](https://iheartjane.app.link/marketplace)
- [iHeartJane G2 reviews](https://www.g2.com/products/iheartjane/reviews)
- [Cannasaver Illinois deals](https://deals.cannapages.com/weed-deals/illinois)
- [Mint Deals Illinois](https://mintdeals.com/illinois/)
- [Verilife Illinois offers](https://www.verilife.com/il/offers)
- [RISE Illinois deals](https://risecannabis.com/dispensaries/illinois/deals/)
- [Sunnyside Illinois promos](https://www.sunnyside.shop/page/promos-and-deals-sunnyside-dispensaries-illinois)
