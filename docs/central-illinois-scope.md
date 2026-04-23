# Central Illinois Scope Lock
**Date locked:** April 23, 2026 (evening)
**Effective:** April 24, 2026 onward
**Author:** Matthew (business decision) + Cowork (codification)
**Status:** Active — guides homepage placement, metadata, and outreach prioritization

---

## The decision

PuffPrice's public positioning shifts from **"Illinois cannabis deals"** to **"Central Illinois cannabis deals."**

This is a **positioning and prioritization** shift. It is **not** a data deletion. Every listing currently in `master_listings` stays live, stays crawlable at its existing URL, and continues to populate `/cannabis/illinois` and the statewide sitemap.

Central Illinois just becomes the front door.

---

## Why

Two external AI reviews (GPT + DeepSeek) on April 23 both flagged the same truth:

- Claiming "Illinois cannabis deals" with 67 dispensaries across 28 cities, 1 GPS-populated listing out of 111, and zero dispensary records hitting the 150-word content floor is **aspirational, not verifiable.**
- Competing on "Illinois" against Weedmaps / Leafly / Dutchie is a losing positioning war at zero MRR.
- A small, geographically-defensible scope where Matthew can **personally verify every deal this week** is both more honest and more defensible as a SEO / AI-citation moat.

"Central Illinois" is the market Matthew actually lives in and drives through. That's the small-and-defensible play.

---

## The 11 cities in scope

| City | Metro | Notes |
|---|---|---|
| Peoria | Peoria-area | Core market |
| East Peoria | Peoria-area | Across the Illinois River from Peoria |
| Pekin | Peoria-area | Tazewell County |
| Bartonville | Peoria-area | Peoria County, south of Peoria |
| Morton | Peoria-area | Tazewell County, east of East Peoria |
| Washington | Peoria-area | Tazewell County, east of East Peoria |
| Bloomington | Bloomington-Normal | McLean County |
| Normal | Bloomington-Normal | McLean County; ISU |
| Champaign | Champaign-Urbana | Champaign County; UIUC |
| Urbana | Champaign-Urbana | Champaign County; UIUC |
| Springfield | Springfield | Sangamon County; state capital |

**Four metro clusters.** The Peoria-area belt is six cities that geographically function as one market. Bloomington-Normal and Champaign-Urbana are twin-city pairs. Springfield stands alone.

See companion doc `docs/central-illinois-data-audit-20260424.md` for per-city dispensary / deal / coverage metrics and the nasty surprise that 4 of the 11 cities currently have zero dispensary records. See `docs/FINDINGS-2026-04-24-central-il-coverage-gap.md` for the specific decision this forces.

---

## What "in scope" means

Applies to all 11 cities:

- **Homepage placement.** Default map frame and "near you" suggestions center on Central IL. Homepage featured deals pull from Central IL listings first.
- **Metadata emphasis.** Title tags, meta descriptions, Open Graph, and schema.org `LocalBusiness` entries lead with "Central Illinois." Statewide pages still exist, but they aren't the front door.
- **Outreach priority.** Dispensary verification calls, email outreach, and corporate data-integrity conversations start with Central IL operators. nuEra East Peoria + nuEra Champaign are priorities #1 and #2.
- **Content budget.** The 150-word content-floor fill happens for these 23 dispensaries first (23, not 67).
- **GPS backfill.** The one bounded Google Places geocoding run targets these 23 before any wider statewide burn.
- **PR + media.** Press releases, local outreach, and any eventual "launch announcement" lead with "Central Illinois."
- **PuffPrice Index.** The statewide benchmark stays statewide (it gets its authority from breadth). But the homepage surfaces a Central IL sub-index alongside it when we have enough data points.

---

## What "out of scope" means

Applies to the 44 dispensaries and 21 cities **not** listed above:

- **Still indexed.** Every existing URL continues to resolve. `/l/[id]`, `/l/[slug]`, city landing pages, and `/cannabis/illinois` all keep working.
- **Still in the sitemap.** No removals.
- **Still searchable.** Deal-category pages (`/deals/flower`, `/deals/edibles`, etc.) continue to surface out-of-scope listings.
- **Just not promoted.** Homepage hero, social, outreach, and metadata don't lead with them.
- **Not "graduated away from."** When a non-Central IL dispensary calls or emails to claim their listing, we handle it the same way we'd handle a Central IL claim. Listings are free, always, per the business model.

**Important framing:** the shift is about what we point public attention at, not about what we serve. A real person driving through Naperville who lands on `/l/zen-leaf-naperville` still gets the full content depth experience. They just aren't the person the homepage is trying to find.

---

## 90-day expansion triggers

The scope lock is deliberately narrow so outreach and data-integrity work has somewhere to land. It is **not permanent.** Here's when we expand, and to what.

### Expand to Quincy when:

- ≥ 3 Quincy dispensaries have clean phone + website in `master_listings`
- ≥ 5 active deals are live in Quincy
- At least 1 has been verified by phone within 30 days

Rationale: Quincy is western Central IL (Adams County). Geographically defensible extension. Not in the initial 11 because current inventory there is 0 — adding it would fail the "small + defensible + real" test.

### Expand to Decatur when:

- ≥ 2 Decatur dispensaries have clean phone + website
- ≥ 3 active deals are live
- Nature's Treatment (current operator in Decatur area) has returned one outreach email

Rationale: Decatur is Macon County, directly between Springfield and Champaign. Fills a natural gap in the I-72 corridor.

### Expand to Danville when:

- ≥ 2 Danville dispensaries have clean phone + website
- ≥ 3 active deals
- Content pilots exist for at least one Danville listing

Rationale: Danville is Vermilion County, east of Champaign-Urbana on I-74. Natural extension of the Champaign-Urbana cluster.

### Expand to Chicago metro (Cook + collar counties):

**Not yet.** Chicago has the biggest deal surface in the state but also the most crowded competitive field (Weedmaps, Leafly, Dutchie all over it). Defer until:

- Central IL has been "full" — all 23 Central IL dispensaries phone/website-clean, GPS-populated, content-floor met.
- ≥ $1,000 MRR or a clear paying-customer moment to justify the competitive spend.
- A distinctive Chicago angle beyond "list more deals" — e.g., neighborhood-level routing, Metra-adjacency, parking scarcity indexing. Something Weedmaps does not offer.

Until those hit, Chicago inventory stays indexed but un-promoted.

### Decision cadence

Re-evaluate scope monthly. First review: **May 24, 2026.**

- Does Central IL coverage feel sustainable?
- Which adjacent city has the cleanest data + inbound interest?
- Is one expansion at a time the right pace, or should we double up?

---

## Anti-scope (explicit don'ts)

- **Do not silently delete out-of-scope listings.** They stay.
- **Do not remove out-of-scope cities from the sitemap.** They stay.
- **Do not rewrite out-of-scope dispensary page content to downgrade it.** Scope is about homepage and outreach priority, not page quality.
- **Do not claim "Central Illinois coverage" on the homepage while the 4 empty cities remain empty.** Either add them to the listing database manually or soften the copy to the 7 cities that actually have dispensaries. See FINDINGS doc for options.
- **Do not block inbound claims from out-of-scope operators.** Free is free — we accept the data.

---

## Consistent copy

When homepage / outreach / metadata language is drafted, use these phrasings:

- **Accurate + aspirational:** "Central Illinois cannabis deals — Peoria, Bloomington-Normal, Champaign-Urbana, and Springfield."
- **Tightest honest claim:** "Deals from dispensaries in East Peoria, Champaign, and Peoria" (only the 3 cities with current active deals).
- **Expansion-friendly:** "Built for Central Illinois first — expanding statewide as coverage gets real."

**Avoid:** "Illinois' best cannabis deals." "The largest Illinois dispensary directory." Anything that implies statewide coverage as a promise rather than a roadmap.

---

## How this doc gets used

- **Code lane:** references this for homepage copy changes, metadata, and any routing logic that distinguishes "featured" from "indexed."
- **Cowork lane:** references this for outreach prioritization, content-depth scheduling, and any future data migration decisions.
- **Chrome lane:** verifies that any claims on the live site match what's in scope and what the data audit shows.

The scope lock is the single source of truth until the next monthly review. Drift is fine — silent drift is not. Any change to the 11-city list gets written here first.
