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
