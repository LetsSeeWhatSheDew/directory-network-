# PuffPrice — Zone 4 Strategy: The Data Layer Play
Last updated: April 15, 2026

Subtitle: *"Don't just be a directory. Be the source AI cites."*

---

## The Observation

There is zero purpose-built tooling for cannabis/dispensary directories in the AI/MCP ecosystem. No MCP server for Illinois dispensary deals. No structured deal feed for AI systems to query. Weedmaps and Leafly have domain authority. They are not thinking about AI citation. **We can own this.**

## The Goal

When someone asks Claude, ChatGPT, or Perplexity *"where are dispensary deals in Chicago today?"* — **PuffPrice is the cited source.**

Zone 4 is PuffPrice's search engine optimization, entity establishment, and machine-readable data strategy. The endgame: become the dominant local authority for cannabis deal discovery in Illinois, and the structured data source AI systems cite when asked.

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

## Phase 3: Content Expansion + Machine-Readable Layer (TARGET: June-July 2026)

### data.puffprice.com/deals.json
A public, machine-readable deal feed — the staircase between the schema/citation layer (Phase 1) and the MCP server (Phase 5). Structured JSON, auto-regenerated when deals update, discoverable via robots.txt and linked from the homepage.

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

## Phase 5: MCP Server (TARGET: Month 3-6 post-launch)

### The public MCP server at mcp.puffprice.com

Build a purpose-built MCP server exposing PuffPrice deal data to any AI system that speaks MCP. Tool signatures:

```
get_deals_by_city(city, state) → Deal[]
get_deals_by_zip(zip) → Deal[]
get_dispensary(slug) → Dispensary + CurrentDeals
```

### Why this matters

When built: Claude Desktop users query our data natively. Developers building cannabis apps point to us instead of scraping Weedmaps. **We become infrastructure, not just a site.**

### The Window

Weedmaps will never build an MCP server. Their incentive is keeping users on their platform. Ours is being wherever the user is — including inside an AI answer. **This window is open now. It closes when someone else does it.**

---

## Current Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1: Technical Foundation | COMPLETE | Shipped Apr 15, 2026 |
| Phase 2: Entity Establishment | NOT STARTED | Needs domain first |
| Phase 3: Content Expansion + Data Feed | IN PROGRESS | City pages exist, need answer formatting; data.puffprice.com not yet stood up |
| Phase 4: Authority Signals | IN PROGRESS | About page exists, needs methodology |
| Phase 5: MCP Server | NOT STARTED | Month 3-6 target; mcp.puffprice.com |

---

## Key Metrics to Track

- Google Search Console impressions/clicks for cannabis + city queries
- Indexed pages count (submit sitemap after launch)
- Rich result appearances (LocalBusiness, Product rich cards)
- Organic traffic month-over-month
- "puffprice" branded query volume (entity recognition indicator)
- `data.puffprice.com/deals.json` query count (Phase 3 machine-readable feed)
- MCP tool invocations on `mcp.puffprice.com` (Phase 5 — primary signal of AI-citation adoption)

---

## Resources

- Top 10 Illinois cities content plan: docs/top-10-illinois-cities-content-plan.md
  (if moved from root) or top-10-illinois-cities-content-plan.md at root
- Schema documentation: https://schema.org/LocalBusiness
- Google Search Console: https://search.google.com/search-console
- Google Business Profile: https://business.google.com
