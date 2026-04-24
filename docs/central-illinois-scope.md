# Central Illinois Scope Lock
**Date locked:** April 23, 2026 (evening) — hardened April 24, 2026; deal-data-policy amendment April 26, 2026.
**Effective:** April 24, 2026 onward.
**Author:** Matthew (business decision) + Cowork (codification).
**Status:** Active and hard. Central Illinois is the only publicly visible scope until Matthew explicitly decides to expand.

---

## The decision

PuffPrice's public surface shows **Central Illinois only**.

As of April 24, 2026, the scope lock moved from a "positioning and prioritization" preference to a **hard app-level filter.** Listings outside the 11 Central IL cities are not rendered on the homepage, deal pages, city landing pages, brand pages, or the sitemap — they are hidden behind a scope check driven by `lib/constants/regions.ts`.

**The underlying DB rows are untouched.** No listings are deleted, deactivated, or rewritten. The filter is in the rendering layer only. If the one-line scope change is reverted, every out-of-scope listing returns to its previous behavior instantly with no data-recovery step required.

---

## Why (April 24 rationale)

Two external AI reviews (GPT + DeepSeek, April 23) both flagged the same truth: claiming "Illinois cannabis deals" with 67 dispensaries across 28 cities, 1 GPS-populated listing of 111 total, and zero listings hitting the 150-word content floor is aspirational, not verifiable. Competing on "Illinois" against Weedmaps / Leafly / Dutchie is a losing positioning war at zero MRR.

The April 23 "positioning pivot" version of this doc softened the surface but left out-of-scope listings reachable by URL, by deal-category browsing, and by sitemap crawl. That half-measure kept the credibility problem intact — any operator or user stumbling into `/l/zen-leaf-naperville` or `/cannabis/illinois` saw the same too-broad claim reflected in the content.

The April 24 hardening cuts that surface. Non-Central-IL is hidden everywhere public until coverage is real enough to stand behind.

---

## The 11 cities in scope

| City | Metro | Notes |
|---|---|---|
| Peoria | Peoria-area | Core market |
| East Peoria | Peoria-area | Across the Illinois River from Peoria |
| Peoria Heights | Peoria-area | Peoria County; immediately adjacent to Peoria (added April 25 alongside the license-registry subset migration) |
| Pekin | Peoria-area | Tazewell County |
| Bartonville | Peoria-area | Peoria County, south of Peoria |
| Morton | Peoria-area | Tazewell County, east of East Peoria |
| Washington | Peoria-area | Tazewell County, east of East Peoria |
| Bloomington | Bloomington-Normal | McLean County |
| Normal | Bloomington-Normal | McLean County; ISU |
| Champaign | Champaign-Urbana | Champaign County; UIUC |
| Urbana | Champaign-Urbana | Champaign County; UIUC |
| Springfield | Springfield | Sangamon County; state capital |

The canonical source is `lib/constants/regions.ts` → `CENTRAL_IL_CITIES`. That array is the single source of truth — this doc describes the rule; the code enforces it.

Four metro clusters: the Peoria-area belt (seven cities that geographically function as one market), Bloomington-Normal, Champaign-Urbana, and Springfield.

### Current DB snapshot (2026-04-26)

| metric | value | notes |
|---|---|---|
| Active Central IL dispensary listings | 31 → **29 after today's deactivations** | Two rows flagged for deactivation in April 26 Cowork research: `ascend-springfield` (duplicate stub of Ascend Horizon Drive) and `consume-cannabis-champaign` (wrong-identity ghost; 505 W Town Center Blvd is actually Cloud9 Champaign). Code applies the migrations; until then both remain `is_active=true` in DB. Earlier planning docs referenced 26/28 — live DB says 31 today; discrepancy logged in the April 26 commit. |
| Listings with phone + website | 25/31 → **25/29 after deactivations** | Gaps: `the-dispensary-champaign`, `flora-farms-springfield`, `key-cannabis-springfield`, `terrabis-springfield` — all no-website rows that route to the direct-contact verification queue. |
| Listings hitting 150-word content floor | Maintained from April 25 set; April 26 pass focuses on deal-policy and freshness layer rather than new drafts. | |
| Listings with GPS + logo | Central IL set seeded from Code's April 25 Places run. | |
| Active deals (pre-cutover) | 11, across 3 cities (East Peoria 5, Champaign 4, Peoria 2) | Source mix: 9 Leafly, 2 direct-source. All Leafly/Weedmaps rows being deactivated April 26 under the new deal data policy. |
| Active deals (post-cutover target) | 2-5 initially | Direct-source only. Grows as the new scraper matures and direct-contact verification catches up. See `docs/deal-data-policy.md`. |

Per-city active-listing counts from live DB (April 26): Springfield 9 (→ 8 post-deactivation), Peoria 5, Normal 4, Champaign 4 (→ 3 post-deactivation), East Peoria 3, Bloomington 2, Peoria Heights 1, Pekin 1, Urbana 1. Three empty cities: Bartonville, Morton, Washington. *(Pekin moved off the empty list when nuEra Pekin was added April 25; the "4 empty" section below now lists 3.)*

---

## The 3 empty Central IL cities

Three of the 12 cities currently hold zero active dispensary records in `master_listings`: **Bartonville, Morton, Washington.** All three are in the Peoria metro and geographically close to listings in Peoria / East Peoria / Peoria Heights / Pekin.

_(Pekin was in this list at lock time; it now has one active listing — nuEra Pekin — following Code's April 25 license-registry subset migration.)_

**They stay in scope.** The homepage includes them in any "cities in scope" display; city landing pages for these three continue to resolve. The render treatment is a placeholder:

> No licensed dispensaries in [city] yet — nearest is [X miles away in Y].

This mirrors the "real person in a parking lot" principle: if a Washington resident arrives via search, they should land on an honest answer (the nearest option), not a blank template or a 404. Code owns the placeholder render.

Rationale for keeping empty cities in scope:

- They are real Central IL cities Matthew drives through.
- Dispensaries may open there during the scope lock; the placeholder is the right seat for them when they do.
- Removing them and re-adding would be more work than leaving them as empty-with-placeholder.
- "Nearest alternative" framing is genuinely useful for users.

---

## What "in scope" means (tonight)

Applies to all 12 cities:

- **Public surface** — homepage, deal-category pages, brand pages, city landings, `/l/[id]`, `/l/[slug]`, sitemap: show Central IL listings only.
- **Search** — deal browsing, category filters, and "near me" suggestions scope to Central IL by default.
- **Metadata** — title tags, meta descriptions, Open Graph, and schema.org `LocalBusiness` entries reflect Central IL positioning. Statewide language ("Illinois cannabis deals") gets replaced with Central IL language on every template that still carries it.
- **Homepage messaging** — hero copy references Central IL and the four metro clusters. No statewide promises.
- **Outreach priority** — dispensary verification calls, email outreach, and corporate data-integrity conversations stay on Central IL operators. nuEra East Peoria + nuEra Champaign remain priority #1 and #2.
- **Content floor** — the 150-word descriptions target the current Central IL dispensary set first. Out-of-scope content floor work is parked.
- **GPS backfill** — bounded Google Places geocoding runs target Central IL only.
- **Deal sourcing** — direct dispensary websites and official social only. No Leafly, Weedmaps, iHeartJane, or Dutchie marketplace. Re-verified every 6 hours. Full policy: `docs/deal-data-policy.md`. Scrape difficulty per listing: `docs/scrape-coverage-20260426.md`.
- **PR and media** — any "launch announcement" and local outreach leads with "Central Illinois."

---

## What "out of scope" means (tonight)

Applies to the ~44 dispensaries and ~20 cities outside the 12-city scope:

- **DB rows preserved.** Every `master_listings`, `deals`, `listing_hours`, and related row stays exactly as-is. No deactivation, no deletion, no rewrite.
- **Not publicly rendered.** Homepage, deal pages, city landings, brand pages, sitemap, and search results filter them out at the render layer.
- **Not crawlable.** Out-of-scope URLs return 404 or the equivalent template behavior Code chooses; they are not in the sitemap. This is the step the April 24 hardening adds on top of the April 23 positioning shift.
- **Still recoverable.** The filter is a one-line change in `lib/constants/regions.ts`. Flipping scope back to all-of-IL or adding a specific city is a reversible edit, not a data migration.

Inbound claims from out-of-scope operators remain welcome — we just won't be surfacing their listings publicly during the lock. If a Naperville operator emails asking to claim their listing, Cowork can still process the claim against the DB row; the listing just won't appear publicly until scope expands to include Naperville.

---

## Reversal procedure

The scope lock is designed to be reversed with a single line change.

**To fully revert to statewide:** edit `lib/constants/regions.ts` and change the scope flag (or, whichever mechanism Code implements), deploy, done. No data migration runs. No content rewrites. The ~44 out-of-scope listings reappear on the public surface in whatever state they were in when the lock went on.

**To add a single city (e.g., Quincy) to the scope:** append one entry to `CENTRAL_IL_CITIES` in `lib/constants/regions.ts` and redeploy. The listings in Quincy that already exist in `master_listings` become publicly visible again. The sitemap picks them up on its next build.

**To add a metro region:** same pattern, appending multiple entries at once.

**Operational expectation:** reversal happens when Matthew decides the moment is right, not on an auto-trigger. The prior version of this doc listed 90-day expansion triggers (Quincy, Decatur, Danville) with specific numeric preconditions. Those are **removed** from this version. The new policy: monthly scope review (first review May 24, 2026); expansion is a deliberate Matthew decision based on inbound interest, MRR direction, and operational readiness — not an automatic unlock when a listing count crosses a threshold.

---

## Anti-scope (explicit don'ts)

- **Do not silently delete out-of-scope listings.** DB rows stay.
- **Do not rewrite out-of-scope dispensary page content to downgrade it.** Non-Central listings are hidden, not degraded — if scope ever reopens, their pages should be ready to render cleanly.
- **Do not block inbound claims from out-of-scope operators.** Free is free; we accept the data and hold it until scope expands.
- **Do not wire in an auto-expansion trigger based on listing count or deal count.** Expansion is a decision, not a rule firing.
- **Do not publish "Illinois' best cannabis deals" copy anywhere tonight.** Every template and page should read Central Illinois.

---

## Consistent copy

For homepage, outreach, metadata, and social language, use these phrasings:

- **Standard:** "Central Illinois cannabis deals — Peoria, Bloomington-Normal, Champaign-Urbana, and Springfield."
- **Tightest honest claim (when only cities with live deals matter):** "Deals from dispensaries in East Peoria, Champaign, and Peoria" (the three cities currently carrying all 11 Central IL active deals).
- **Coverage framing:** "Twelve Central Illinois cities, nine currently with licensed dispensaries — nearest-store routing for the other three."
- **Expansion-friendly when speaking to the future:** "Built for Central Illinois first."

**Avoid:** "Illinois' best cannabis deals." "The largest Illinois dispensary directory." "Statewide coverage." Anything that overstates the current surface.

---

## How this doc gets used

- **Code lane:** source of truth for the scope filter, the homepage copy, the placeholder render for the 3 empty cities, and the reversal procedure.
- **Cowork lane:** source of truth for outreach prioritization, content-depth scheduling, and any future data migration decisions.
- **Chrome lane:** verifies that any claim on the live site matches what's in scope and that out-of-scope listings are correctly hidden.

Any change to the 12-city list gets written here first. Silent drift — the homepage saying one thing, this doc saying another — is the specific failure mode this doc exists to prevent.
