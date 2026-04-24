# Central IL Orphan Review — 2026-04-25

**Author:** Cowork
**Scope:** Filter the `IN_DB_NOT_IN_STATE` list from
`docs/data-audit-2026-04-23-il-license-registry.md` to the 11 Central IL
cities only, then categorize each row so Code knows what to do tonight.

Non-Central-IL orphans (18 of them) are **deliberately untouched** by
this review. They stay in the DB, unchanged, until scope expands.

---

## Summary

| status | count |
|---|---:|
| Total IN_DB_NOT_IN_STATE orphans statewide | 23 |
| Central IL orphans | 5 |
| → PARSER_MISS (operating, state row exists but parser garbled it) | 4 |
| → DATA_NOISE (aspirational seed, no web footprint) | 1 |
| → OPERATING_ADULT_USE / OPERATING_MEDICAL_ONLY | 0 |
| → CLOSED / DELICENSED | 0 |

**Net recommendation for Code:** deactivate **1** listing
(`north-star-remedies-peoria-il`). Leave the other 4 as-is; they are
real, operating adult-use dispensaries that the PDF parser dropped or
mis-sectioned.

---

## Method

1. Opened `docs/data-audit-2026-04-23-il-license-registry.md`,
   `IN_DB_NOT_IN_STATE` section (23 rows).
2. Filtered to rows whose `city` is in `CENTRAL_IL_CITIES` per
   `lib/constants/regions.ts`: Peoria, East Peoria, Pekin, Bartonville,
   Morton, Washington, Normal, Bloomington, Champaign, Urbana,
   Springfield. **5 rows** survived the filter.
3. For each, cross-referenced: (a) the Suspect tier of the same audit
   (parser may have caught it in garbled form), (b) the letsascend.com /
   operator homepages, (c) Yelp / Leafly / Weedmaps, (d) a live Google
   search for current status.
4. Assigned a category and a Code-ready action.

---

## Row-by-row

### 1. `consume-cannabis-champaign` — Champaign

| field | value |
|---|---|
| DB `is_active` | `true` |
| Operator | Consume Cannabis (chain; existing Carbondale + Marion + Chicago locations) |
| State PDF (suspect row 284.000259-AUDO) | `"9 Cannabis Champai (21"` / `"505 W Town"` / `"Center Blvd"` / 61822 |
| **Category** | **PARSER_MISS** |
| **Recommendation** | Keep `is_active=true`. When Code does the phone/website enrichment tonight, expect 505 W Town Center Blvd, Champaign, IL 61822. |

The Suspect row visibly contains "Cannabis Champai" and "505 W Town Center Blvd" — this is the same row, mangled by PDF column bleed. The record is real. Matthew's Tier-1 outreach doc already identifies nuEra Champaign as the deal-surface dispensary in Champaign; `consume-cannabis-champaign` is a second operator in the same city with zero active deals today. No action.

### 2. `beyond-hello-peoria` — Peoria

| field | value |
|---|---|
| DB `is_active` | `true` |
| Operator | Jushi Holdings (Beyond/Hello chain) |
| Address on file | 7620 State Route 91 Ste A, Peoria, IL 61615 |
| State PDF (suspect row 284.000233-AUDO) | `"7620 N IL nd/Hello - Peo Peoria"` / `"Suite A ria"` / `"Rt 91"` / 61615 |
| **Category** | **PARSER_MISS** |
| **Recommendation** | Keep `is_active=true`. Data on file is already complete (phone, website, address populated). |

Exact address match against the garbled Suspect row. This is the same license. The record is good. No action.

### 3. `north-star-remedies-peoria-il` — Peoria

| field | value |
|---|---|
| DB `id` | `green-004` (manually-seeded "green-0XX" series) |
| DB `is_active` | `true` |
| `address1`, `phone`, `website` | **all NULL** |
| `long_description` | empty |
| State PDF | **not found** in Clean or Suspect tiers |
| Web search | **no web footprint.** No IDFPR license entry, no Leafly, no Weedmaps, no Yelp, no operator homepage, no local news coverage |
| **Category** | **DATA_NOISE** (aspirational seed, never opened / never verified) |
| **Recommendation for Code** | **Set `is_active=false`** with a `status_reason='unverified_no_license'` note, or equivalent. Do not delete the row; preserve for audit trail. This was the manual seed that pre-dated the scraper + license audit pipeline; it has no evidence behind it. |

This is the one Central IL orphan that should come off the public surface tonight. A zero-evidence "North Star Remedies Peoria" record becomes a credibility liability once the homepage narrows to Central IL and that listing is one of only 23 shown.

**If Matthew has independent local knowledge that North Star Remedies is operating or planning to open** — reverse course by flipping `is_active=true` and backfilling address/phone/website. But absent any evidence, deactivate tonight.

### 4. `ascend-cannabis-downtown-springfield` — Springfield

| field | value |
|---|---|
| DB `is_active` | `true` |
| Operator | Ascend Wellness Holdings (AWH) |
| Address on file | 628 E Adams St, Springfield, IL 62701 |
| Phone on file | (217) 679-3283 |
| State PDF | **not parsed.** License number reported elsewhere as 284.000026-AUDO. The audit's methodology note says the parser "only parses the Active Adult Use Dispensing Organization Licenses section — the Original Lottery / SECL conditional license lists are intentionally skipped." License #284.000026 is a very low/early number that likely falls in the Original Lottery section of the PDF — which is *actively operational*, not conditional, and was excluded by mistake. |
| Web evidence | letsascend.com/locations/illinois/springfield-adams-street, Yelp "ASCEND CANNABIS DISPENSARY - SPRINGFIELD DOWNTOWN" (Updated April 2026), Leafly Ascend Downtown Springfield menu. Formerly "Illinois Supply & Provisions." |
| **Category** | **PARSER_MISS** (section-scoping error, not a missing-row error) |
| **Recommendation** | Keep `is_active=true`. Flag the parser's section-scoping as a follow-up parser ticket — the Original Lottery section appears to contain live adult-use operators and should be in-scope for future registry audits. |

### 5. `ascend-cannabis-horizon-drive` — Springfield

| field | value |
|---|---|
| DB `is_active` | `true` |
| Operator | Ascend Wellness Holdings (AWH), second Springfield location |
| Address on file | 3201 Horizon Dr, Springfield, IL 62703 |
| Phone on file | (217) 492-8182 |
| State PDF | **not parsed**, same reason as #4. Sister location under the same corporate parent. |
| Web evidence | letsascend.com/locations/illinois/springfield-horizon-drive, live Yelp and Weedmaps presence |
| **Category** | **PARSER_MISS** |
| **Recommendation** | Keep `is_active=true`. Same parser-section follow-up as #4. |

---

## What Code should do tonight

1. `UPDATE master_listings SET is_active = false WHERE slug = 'north-star-remedies-peoria-il';`

Everything else in this review stays as-is. All four PARSER_MISS rows remain `is_active=true`.

## What Code should NOT do tonight

- Do not touch the 18 non-Central-IL orphans. They are out of tonight's scope.
- Do not attempt to re-match these 4 PARSER_MISS rows against license numbers — that belongs in a future parser fix, not in a data mutation.
- Do not delete `north-star-remedies-peoria-il`. `is_active=false` is enough for the public surface; the row stays for audit.

---

## Follow-up tickets (for later, not tonight)

1. **Parser section-scoping fix.** The IDFPR PDF's "Original Lottery" section appears to contain operational adult-use licenses (evidenced by Ascend Springfield Downtown at 284.000026-AUDO). Re-examine that section and fold its rows into future registry audits.
2. **Suspect-tier resolution.** Several Central IL rows in the current Suspect tier (284.000259, 284.000233) are clearly valid operators — merge their clean values back into the state registry before the next audit compare.
3. **Manually-seeded `green-0XX` audit.** `green-001` through `green-012` are the pre-scraper manual seeds. The North Star Remedies case suggests a one-time sweep of that series against the license registry would catch any other aspirational records.

---

## Sources

- [IDFPR Active Adult Use Dispensing Organization Licenses (PDF)](https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/licenselookup/adultusedispensaries.pdf)
- [Ascend Cannabis — Springfield (Adams Street)](https://letsascend.com/locations/illinois/springfield-adams-street/)
- [Ascend Cannabis — Springfield (Horizon Dr)](https://letsascend.com/locations/illinois/springfield-horizon-drive/)
- [Ascend Cannabis Dispensary — Springfield Downtown (Yelp)](https://www.yelp.com/biz/ascend-springfield-downtown-springfield-2)
- [Beyond Hello Peoria](https://beyond-hello.com/illinois-dispensaries/peoria/)

---

## Addendum — 2026-04-26 morning

Re-review of two rows from the April 25 list after additional research and the April 25 evening Places-enrichment run. Two corrections, two Code actions.

### 1. `ascend-springfield` (generic stub) — DEACTIVATE

The April 25 content-floor drafts doc deferred this row as a "probable duplicate stub." Tonight's research tightens that from probable to confirmed.

**What changed:** Code's April 25 evening Places enrichment run wrote to this row (phone (217) 492-8060, website `letsascend.com/locations/illinois/springfield-horizon-drive/`, and a 7-day 8-9 hours block). The website URL is the same one Ascend uses for its **Horizon Drive** location — the same dispensary already represented in the DB as `ascend-cannabis-horizon-drive` (3201 Horizon Dr, (217) 492-8182). The phone numbers differ by four digits (both (217) 492-8XXX) but point to the same physical store; the letsascend.com URL pattern makes the duplication explicit.

**Web-research confirms no third location:**

- letsascend.com/find-us/ lists **exactly two** Springfield Ascend locations: Adams Street (downtown) and Horizon Drive. No third.
- The April 23 IDFPR license audit has two Springfield Ascend licenses both in the Original-Lottery section the parser skipped (one each for Adams Street and Horizon Drive). No third license.
- Yelp, Leafly, Weedmaps, Veriheal, Waze, and Nextdoor all list the same two Springfield Ascend storefronts. No third.

**Recommendation:** **DEACTIVATE.** `ascend-springfield` is a pre-scraper generic stub that ended up with a Horizon-Drive Places match. The correct representation of "Ascend Springfield" in the DB is the two specific-location rows that already exist. The generic stub doubles the public listing count for a single physical dispensary and creates an "Ascend" card on the Springfield metro page that would duplicate Ascend Horizon Drive with slightly different data.

Do not merge data fields into `ascend-cannabis-horizon-drive`; the Horizon Drive row has its own canonical values already, and the generic row's Places-sourced phone may be a separate receptionist line that would confuse more than it helps.

**Cascade effects:** total Central IL active listings drops by 1 (to 27 post-deactivation; to 26 after combining with the `consume-cannabis-champaign` deactivation in today's research doc). Springfield's active-listing count drops from 7 to 6.

### SQL

```sql
-- 2026-04-26 deactivation — ascend-springfield
-- Duplicative of ascend-cannabis-horizon-drive and
-- ascend-cannabis-downtown-springfield. No third Ascend location
-- exists in Springfield per operator site, state registry, and every
-- public directory checked (Yelp, Leafly, Weedmaps, Veriheal).

BEGIN;

UPDATE master_listings
SET is_active       = false,
    long_description = '',
    short_description = '',
    updated_at       = now()
WHERE slug = 'ascend-springfield';

COMMIT;
```

No `long_description` draft needed — the row is going inactive.

### 2. `consume-cannabis-champaign` — retract PARSER_MISS, mark as GHOST

The April 25 review placed this row in PARSER_MISS, asserting that state license 284.000259-AUDO ("9 Cannabis Champai" / 505 W Town Center Blvd) was a garbled version of Consume Cannabis Champaign. **That was wrong.**

**What's actually true:**

- **Consume Cannabis does not operate a Champaign location.** The chain's own locations page (`consumecannabis.com`) lists Carbondale, Marion, Chicago, Oakbrook Terrace, Antioch, and St. Charles. No Champaign.
- **505 W Town Center Blvd is Cloud9 Cannabis Champaign,** operated by the same Cloud9 chain that just got a correctly-named row added on April 25 as `cloud-9-east-peoria`. Cloud9's corporate site explicitly lists Champaign, Edwardsville, Oswego, and East Peoria as the four store locations.
- **The "9" in "9 Cannabis Champai" is the end of "Cloud9,"** not the end of "Consume." The parser garble made that hard to see in the Suspect tier; the direct Cloud9 site confirmation dissolves the ambiguity.

**Recommendation:** **DEACTIVATE + clear the incorrect long_description** that the April 25 content-floor applied. Separately, the real Cloud9 Champaign row should be added in a follow-up (not tonight), along with the parser-section-scoping fix.

Full rationale, source links, and the SQL for Code are in `docs/missing-contact-research-20260426.md` (deliberately kept with the research data, not here, because the deactivation is triggered by new research and pairs naturally with the `the-dispensary-champaign` fix in the same doc).

**Cascade effects:** Champaign active-listing count drops from 4 to 3. Central IL total drops by another 1 on top of the Ascend-Springfield deactivation, landing the total at 26.

### Summary of changes from this addendum

| slug | April 25 recommendation | April 26 revised recommendation | reason |
|---|---|---|---|
| `ascend-springfield` | Deferred / probable duplicate | **Deactivate** | Places enrichment + three-way web-source cross-check confirms duplication of `ascend-cannabis-horizon-drive` |
| `consume-cannabis-champaign` | PARSER_MISS; keep active | **Deactivate + clear bad long_description** | April 25 categorization was wrong; 505 W Town Center is Cloud9 Champaign, not Consume |

Both changes are SQL-blocked in their respective research / fix docs. Code applies tonight.

