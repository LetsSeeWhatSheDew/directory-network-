# Real Numbers — As of 2026-04-21 00:00 CT
> **Purpose:** source of truth for every public-facing count on the PuffPrice site.
> **Methodology:** every number below is a Supabase query result run tonight. Queries are reproduced so future sessions can re-verify.
> **Rule:** any hardcoded number on the site must trace to a row in this doc. Anything that doesn't trace here gets flagged by the next Cowork audit pass.

## Headline numbers (use these on the homepage + /alerts + /about)

| Metric | Value | Query |
|---|---|---|
| Active IL dispensaries | **61** | `SELECT COUNT(*) FROM master_listings WHERE project_tag='green' AND is_active=true AND state IN ('IL','il','Illinois','illinois');` |
| Total green-tag listings (active+inactive) | **82** | `SELECT COUNT(*) FROM master_listings WHERE project_tag='green';` |
| Distinct IL cities with ≥1 active listing | **25** | `SELECT COUNT(DISTINCT city) FROM master_listings WHERE project_tag='green' AND is_active=true AND state IN ('IL','il','Illinois','illinois');` |
| Active deals (not expired) | **56** | `SELECT COUNT(*) FROM deals WHERE project_tag='green' AND is_active=true AND (expires_at IS NULL OR expires_at > now());` |
| Dispensaries currently running ≥1 deal | **21** | `SELECT COUNT(DISTINCT listing_slug) FROM deals WHERE project_tag='green' AND is_active=true;` |
| Claimed listings | **0** | `SELECT COUNT(*) FROM master_listings WHERE project_tag='green' AND claimed=true;` |

## Deal mix (for marketing / press)

| Category | Active deals |
|---|---|
| Storewide (`all`) | 31 |
| Flower | 10 |
| Edibles | 7 |
| Concentrate | 5 |
| Vapes | 3 |
| **Total** | **56** |

Average discount: **25.7%**. Max discount: **100** (a $100 fixed-price pack). Earliest deal in current pool: April 2026.

## Cities covered (25)

Springfield (6), Chicago (5), Peoria (5), Naperville (4), Normal (4), Quincy (4), Aurora (3), Champaign (3), Schaumburg (3), Bloomington (2), Carol Stream (2), Danville (2), East Peoria (2), Joliet (2), Moline (2), Rockford (2), Waukegan (2), Collinsville (1), Crestwood (1), Effingham (1), Elgin (1), Galesburg (1), Mundelein (1), Urbana (1), Westmont (1).

Note: the site's `app/cannabis/illinois/page.tsx` ships a 34-city nav list (Canton, Carbondale, Decatur, Jacksonville, Litchfield, Marion, Morris, North Aurora, Ottawa, Rock Island, Sterling, Sycamore are in that list but have zero active listings — they're placeholder SEO pages). When claiming city coverage, use 25 (real coverage) unless explicitly talking about the editorial city-guide surface (34).

## Illinois market context (not PuffPrice coverage)

These are statewide market facts, useful for "how does PuffPrice compare" framing but not to be confused with our coverage:

| Metric | Value | Source |
|---|---|---|
| IDFPR-licensed adult-use dispensaries (IL) | **~290** | Illinois Department of Financial and Professional Regulation adult-use dispensing organization list (April 2026) |
| Population 21+ eligible | **9.6M** | 2024 ACS 5-year estimate, adjusted |
| Recreational cannabis legal since | **2020-01-01** | Cannabis Regulation and Tax Act |

The 290 statewide number belongs in FAQ "how many dispensaries are in Illinois" answers; NOT in PuffPrice-coverage claims.

## Known false / stale counts on the site right now

Pre-fix state (as of this audit). See `docs/handoffs/hardcoded-counts-fixes-20260421.md` for the exact patches.

| Surface | False value | Real value | Severity |
|---|---|---|---|
| `app/page.jsx:1060` | `34 cities` | 25 | HIGH (homepage) |
| `app/cannabis/illinois/page.tsx:8` meta | `270+ / 35+` | 61 / 25 (coverage) | HIGH (SEO + AI answer engines) |
| `app/cannabis/illinois/page.tsx:266` FAQ | `35+ Illinois cities` | 25 | HIGH (above-fold on city page) |
| `app/cannabis/illinois/page.tsx:55` FAQ schema | `over 270` (statewide market) | ~290 | MEDIUM (stale market fact) |
| `app/cannabis/page.tsx:131` pill | `35 cities` | 25 | HIGH (secondary hub) |
| `app/cannabis/missouri/page.tsx:*` | `100+` dispensaries | PuffPrice coverage of MO = 0 | LOW-MEDIUM (deferred decision — editorial vs. coverage framing) |

## The number Matthew should actually feel good about

The headline coverage is still **small** (61 dispensaries × 25 cities out of 290 × ~100 cities statewide ≈ 21% of dispensary universe). That's fine — PuffPrice is 6 weeks old. What matters is that the numbers we put on the page match the numbers in the database.

The homepage "61 Illinois dispensaries" is real. The "25 cities" (after fix) will be real. The "56 active deals" has been dynamic from the start. Three real, verifiable numbers beat a three-digit lie any day.

## When this audit goes stale

Re-run all six queries above whenever any of:
- A net change of ±5 active master_listings rows lands.
- The homepage or `/cannabis/illinois` gets a copy refresh.
- Claim flow ships to production (which will change `claimed=0`).
- A new state goes live beyond Illinois (which makes the "Illinois cities" qualifier start mattering).

## Companion migrations landing tonight (NOT YET APPLIED Tuesday)

Per tonight's Cowork session, these migrations change the underlying counts modestly. Re-run this audit Tuesday afternoon after Matthew applies them:
- `sql/migrations/2026-04-21-enrichment-ship-blockers.sql` — deactivates 3 dedupe slugs → 82 → 79 green-tag rows; active IL 61 → 58.
- `sql/migrations/2026-04-20-fix-active-deals-view.sql` — no count delta, but cleans up city=NULL rows from the deal view (from ~18 to 0).
