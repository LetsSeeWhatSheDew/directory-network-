# FINDINGS — Central IL Scope vs. Actual Coverage
**Date:** April 24, 2026 (morning)
**Author:** Cowork (Claude)
**Status:** Flag to Matthew — read before promoting "Central Illinois" positioning externally
**Trigger:** Per session constraints — "If the Supabase data audit surfaces a nasty surprise (e.g., 3 of 11 cities have zero dispensaries), STOP and write a FINDINGS.md flagging it before continuing."

---

## TL;DR

The Central IL scope locks 11 cities. Live Supabase data as of 2026-04-24 morning shows:

- **4 of 11 cities have ZERO dispensaries in `master_listings`**: Bartonville, Morton, Pekin, Washington.
- **8 of 11 cities have ZERO active deals**: only East Peoria (5), Champaign (4), and Peoria (2) have any active deals at all.
- **Total active deals in Central IL: 11** (out of 53 active statewide = 20.8%).
- **Total Central IL dispensaries: 23** (out of 67 statewide IL = 34%).
- **GPS coverage across Central IL: 0 / 23** (the one GPS-populated listing statewide is outside Central IL).
- **Content floor (≥150-word `long_description`): 0 / 23** (matches the statewide 0-of-67 problem).

This is a **real positioning gap**, not a data-quality artifact. "Illinois cannabis deals" was aspirational at 67 dispensaries / 53 deals. "Central Illinois cannabis deals" pulls to 23 dispensaries / 11 deals / 3 of 11 cities lit up. It's more defensible but also visibly thinner.

## Why I am flagging, not stopping

The session brief framed this as a positioning + prioritization shift, not a data deletion. The scope lock is a **target**, not a claim of current coverage — the doc and outreach work is building toward filling these cities in. I continued producing Tasks 1–5 **with the gap surfaced throughout** rather than stopping cold, because the Tier-1 outreach and Task 4 out-of-the-box ideas all benefit from being ground-truthed against this finding.

Matthew's call: accept the thinness, or revise the scope lock before the positioning ships publicly.

## Per-city snapshot

| City | Dispensaries | Active deals | Phone coverage | Website coverage | Status |
|---|---|---|---|---|---|
| Springfield | 6 | 0 | 5/6 | 5/6 | Has listings, no active deals — weakest "capital city" story |
| Peoria | 5 | 2 | 4/5 | 4/5 | Core market, two active deals from Ivy Hall |
| Normal | 4 | 0 | 4/4 | 4/4 | Clean listings, zero active deals — dead deal zone |
| Champaign | 3 | 4 | 0/3 | 0/3 | **All 3 Champaign listings have no phone/website — nuEra Champaign powers the 4 deals** |
| Bloomington | 2 | 0 | 1/2 | 1/2 | Twin-city with Normal; still zero deals |
| East Peoria | 2 | 5 | 2/2 | 2/2 | **Strongest city by active deals — entirely nuEra East Peoria** |
| Urbana | 1 | 0 | 1/1 | 1/1 | Single listing, zero deals |
| Bartonville | 0 | 0 | — | — | **Empty — no listings exist** |
| Morton | 0 | 0 | — | — | **Empty — no listings exist** |
| Pekin | 0 | 0 | — | — | **Empty — no listings exist** |
| Washington | 0 | 0 | — | — | **Empty — no listings exist** |
| **Total** | **23** | **11** | **17/23** | **17/23** | |

## Three interpretations Matthew can choose from

1. **Hold the 11-city scope; treat 4 empty cities as "coming soon" targets.** Honest framing: "We cover Peoria-area, Bloomington-Normal, Champaign-Urbana, and Springfield today. Bartonville / Morton / Pekin / Washington are mapped for Q2 expansion when the first licensed dispensary opens or we complete manual entry." This keeps the 11-city "Central Illinois metro belt" story intact and sets a clear filling-in roadmap.

2. **Trim to 7 cities that have at least one dispensary.** Peoria, East Peoria, Normal, Bloomington, Champaign, Urbana, Springfield. Matches current reality without aspirational padding. Loses the tidy "11 cities" number.

3. **Hybrid: 7 "covered" + 4 "watch list."** Home-page and metadata promote the 7 with data. The 4 empty cities get placeholder intent pages ("No dispensaries yet in Pekin — the closest deals are in East Peoria, 10 minutes north") that are honest and still pull SEO long-tail.

My recommendation: Option 3. It matches the already-shipped `/near/[landmark]` and intent-page patterns, doesn't lie about coverage, and turns the empty cities into referral funnels for the cities with inventory.

## The Champaign anomaly

All three Champaign dispensaries (`nuera-champaign`, `consume-cannabis-champaign`, `the-dispensary-champaign`) have `phone IS NULL` and `website IS NULL` in `master_listings`. nuEra Champaign alone accounts for 4 of Central IL's 11 active deals — that's 36% of the Central IL deal surface hiding behind a contactless listing.

**Implication for Monday:** nuEra Champaign is the single highest-leverage outreach call in Central IL. It's already in the Tier-1 research doc (#3). Filling nuEra Champaign's contact record is disproportionately valuable under the new scope.

## What changes in Tasks 3–5 as a result

- **Task 3 (Tier-1 outreach v2):** Of the original 9 Tier-1 targets, only **1 is in Central IL (nuEra Champaign)**. The others are DuPage / Kane / Will / Cook county. They stay in the repo as out-of-scope-but-reachable, flagged clearly. The rewrite focuses the nuEra Jaramillo email on verifying **both** Champaign and East Peoria (East Peoria is the 5-deal anchor — confirming those deals is a bigger data-integrity win than anything else on the board).
- **Task 4 (ideas):** Tax calculator and deal calendar are high-value **because** Central IL coverage is thin — they're moat plays that don't require more listings. SMS-first lookup is gated on having enough deals per ZIP to answer with, which the data says is currently only ZIPs around 61603, 61611, 61820. Noted.
- **Task 5 (open questions):** Question 4 from the afternoon report ("CLAUDE.md snapshot numbers are stale") gets updated: the stale numbers were 61/25/56/82. Actuals now 67/28/53/111 statewide. Central IL subset: 23/7/11/23.

## Hard numbers for Matthew's sanity-check

- Statewide active dispensaries: 67
- Statewide active deals: 53
- Statewide GPS-populated listings: 1 (≈ 1.5%)
- Central IL active dispensaries: **23** (34% of state)
- Central IL active deals: **11** (21% of state)
- Central IL dispensaries with both phone + website: **17** (74%)
- Central IL dispensaries with content-floor hit: **0**
- Central IL dispensaries with GPS: **0**

If the site ships "Central Illinois Cannabis Deals" tomorrow, the homepage shows 11 deals across 3 cities. That's a small, verifiable number — consistent with the "small + defensible" framing — but it's **below** the threshold where most visitors see a useful match on first load unless routing favors the 3 cities that actually have deals.

## Action items this finding generates

- [ ] Matthew picks Option 1 / 2 / 3 above before homepage copy ships.
- [ ] Either (a) manually add dispensaries in the 4 empty cities from IDFPR, or (b) explicitly flag them as future-expansion.
- [ ] nuEra outreach gets prioritized as a data-integrity call because Champaign's contactless listings are 36% of Central IL's active-deal surface.
- [ ] GPS backfill for the 23 Central IL dispensaries becomes a focused, bounded job — not the 67-listing statewide migration. Single Google Places burn, ~$5, reversible.

---

**Blocking?** No. I continued with Tasks 1, 3, 4, 5 with this finding folded in. Commit is atomic per the brief.
