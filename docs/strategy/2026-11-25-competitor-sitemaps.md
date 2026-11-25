# Competitor sitemap check (Nov 25, 2026)

GitHub Actions run 45698680051 (`scripts/competitor-sitemaps.mjs`, read-only). The cloud session's network can't reach these sites, so the check runs on GitHub.

- **Ascend** (letsascend.com, 854 URLs): nearby-town landing pages that point at its stores, e.g. `/local/illinois/springfield-downtown-chatham/`, `-lincoln/`, `-taylorville/` (all updated Nov 12).
  - **Gap for us:** searches like "dispensary near Chatham / Lincoln / Taylorville / Morton / Washington" go unanswered. A small "nearest deals from <town>" set built on the town data we already have would be one honest page each. Proposed; not built.
- **High Profile** (144 URLs): `/high-vibes/green-wednesday-black-friday-cannabis-deals/` (Nov 20).
  - Stores treat the holiday as a weekend, so `/green-wednesday` now keeps its live list through Nov 30.
- **Trinity** (2,417 URLs, mostly products): `/deals`, `/daily-deals`.
- **nuEra** (361 URLs): event posts (4/20 discounts, "Weedmas" Christmas deals) and Illinois law/guide pages.
- **One site with 200+ blog posts** (name cut off in the log): 4/20 events in Illinois, 7/10 Day Illinois, "Blazing Thanksgiving".
- **Maribis:** fetch failed. **Cloud 9:** 403.
- **Leafly local deal pages:** one generic description per city ("Looking for weed deals and discounts in Peoria, IL? Find 420 deals…"). Titles didn't parse, and whether their deals are current is UNVERIFIED.

**Calendar worth owning next:** Weedmas/Christmas deals in December, 4/20 in April, 7/10 in July. One page each, the way /green-wednesday works, built a few weeks ahead.
