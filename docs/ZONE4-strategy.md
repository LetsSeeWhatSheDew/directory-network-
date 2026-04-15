# PuffPrice — Zone 4 SEO Strategy
Last updated: April 15, 2026

Zone 4 is PuffPrice's search engine optimization and entity establishment strategy.
The goal: become the dominant local authority for cannabis deal discovery in Illinois.

---

## What Is "Zone 4"?

Zone 4 refers to the 4th phase of organic search dominance:
1. Zone 1 — Crawlable, indexed, no errors
2. Zone 2 — Relevant content, keyword targeting
3. Zone 3 — Trusted pages (backlinks, citations)
4. Zone 4 — Entity establishment (Google Knowledge Graph, E-E-A-T signals)

---

## Phase 1: Technical Foundation + Schema (COMPLETED Apr 15, 2026)

Status: DONE — shipped in commit 536d198

### What was done:
- LocalBusiness JSON-LD schema added to all /l/[slug] listing pages
  Includes: name, address, geo coordinates, telephone, url, openingHours
- Product schema on deal cards (offers, priceRange)
- SpecialAnnouncement schema for time-sensitive deals
- ItemList + BreadcrumbList schema on city/category pages
- metadataBase set to puffprice.com in app/layout.tsx
- Meta titles optimized: "[City] Cannabis Deals | PuffPrice" format
- OG images configured (og-image.png)
- sitemap.ts dynamically generates URLs for all listing pages
- robots.ts configured with correct allow/disallow rules

### Why it matters:
Schema markup tells Google exactly what each page is about — a local business,
a deal, a price. This is the prerequisite for rich results and Knowledge Graph entry.

---

## Phase 2: Entity Establishment (TARGET: May 2026)

### Goal: Make PuffPrice a recognized entity in Google's Knowledge Graph

#### Google Business Profile
- Create a Google Business Profile for PuffPrice (brand entity, not a dispensary)
- Category: "Cannabis information service" or "Online marketplace"
- Add puffprice.com, hi@puffprice.com, description, logo
- This is the single highest-ROI citation for Google entity recognition

#### NAP Citations (Name, Address, Phone)
Build consistent citations across:
- Leafly (if eligible as a deal aggregator)
- Weedmaps (directory listing)
- Illinois cannabis industry directories
- Yelp (business listing)
- BBB (Better Business Bureau)

#### Backlink strategy
Target sites:
- Illinois cannabis news sites (IllinoisCannabisNews.com, etc.)
- Local Peoria media (PJStar, CIProud)
- Dispensary partnership links (in exchange for free featured listings)
- Reddit r/ILTrees resource sidebar

---

## Phase 3: Content Expansion (TARGET: June-July 2026)

### City Landing Pages (answer-formatted)
Each major Illinois city should have a dedicated page structured as:
- H1: "Best Cannabis Deals in [City], IL"
- Answer paragraph: "Dispensaries in [City] are currently offering..."
- Live deal cards (dynamic from Supabase)
- FAQ section targeting long-tail queries

Priority cities (by population/cannabis market):
1. Chicago — highest volume, most competitive
2. Peoria — home market, strong local signal
3. Springfield — state capital, underserved
4. Champaign-Urbana — university market
5. Rockford, Aurora, Joliet, Naperville

### Category Pages
- "Best 420 Deals in Illinois"
- "First-Time Patient Deals Illinois"
- "Illinois Cannabis Flower Deals"
- "Illinois Edible Deals Under $20"

### Blog/Editorial
- "4/20 Guide: Best Cannabis Deals Near You in Illinois" (publish Apr 17)
- "How to Find Dispensary Deals Without Weedmaps" (Zone 4 anchor content)
- Weekly deal roundup posts

---

## Phase 4: Authority Signals (Ongoing)

### E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- About page with founder story and Illinois cannabis market expertise
- Methodology page: "How we verify deals and calculate savings"
- Press mentions and media outreach
- Data citations: sourced from dispensary menus (verifiable)

### User Signals
- Alert email subscriptions (social proof of engaged audience)
- Deal click tracking (signals to Google: users find this useful)
- UTM tracking for campaign attribution (already live via UtmCapture.tsx)

---

## Current Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1: Technical Foundation | COMPLETE | Shipped Apr 15, 2026 |
| Phase 2: Entity Establishment | NOT STARTED | Needs domain first |
| Phase 3: Content Expansion | IN PROGRESS | City pages exist, need answer formatting |
| Phase 4: Authority Signals | IN PROGRESS | About page exists, needs methodology |

---

## Key Metrics to Track

- Google Search Console impressions/clicks for cannabis + city queries
- Indexed pages count (submit sitemap after launch)
- Rich result appearances (LocalBusiness, Product rich cards)
- Organic traffic month-over-month
- "puffprice" branded query volume (entity recognition indicator)

---

## Resources

- Top 10 Illinois cities content plan: docs/top-10-illinois-cities-content-plan.md
  (if moved from root) or top-10-illinois-cities-content-plan.md at root
- Schema documentation: https://schema.org/LocalBusiness
- Google Search Console: https://search.google.com/search-console
- Google Business Profile: https://business.google.com
