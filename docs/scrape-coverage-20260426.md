# PuffPrice Scrape Coverage Tracker — April 26, 2026 (rewritten 2026-04-26 night)

**Scope:** every active Central Illinois dispensary listing in `master_listings` (`project_tag='green'`, `state='IL'`, `is_active=true`, `type='dispensary'`, city ∈ 12-city Central IL scope).

**Purpose:** rate the scrape difficulty for each direct source under the Central-IL-only, direct-source-only deal policy (`docs/deal-data-policy.md`). Used to prioritize scraper engineering, in-person verification outreach, and the direct-contact verification queue.

**DB state used for this doc:** live query against Supabase project `hnbjufmtmrhexmdrfubw`, executed 2026-04-26 night. Returned **26 active CIL dispensary listings** across **9 populated cities** (Bartonville, Morton, Washington remain empty-with-placeholder).

**This file is a full rewrite.** The earlier version of this doc (2026-04-26 morning) listed 31 rows including 3 Springfield, MO miscategorizations and 2 rows already in the deactivation queue; a `CORRECTION` callout was added later that day to flag 26 as the ground truth. Both the original 31-row table and the callout have been replaced by the verified 26-row table below. The 3 MO false positives are documented at the bottom of this file under "Removed from coverage" so the audit trail survives.

---

## Difficulty legend

- **EASY** — dispensary-owned website has a `/deals`, `/specials`, or equivalent URL with structured, parseable promotion data. Can be scraped with a straightforward HTML selector or embedded-JSON extractor.
- **MEDIUM** — deals appear on the dispensary's site but require JS rendering, iframe traversal, or unstructured parsing (homepage banners, blog posts, embedded POS menu widgets). Scrape is possible but requires per-site parser work and periodic re-tuning.
- **HARD** — no dispensary website, or the only visible deal surface is social-only (especially Instagram Stories/Reels), or aggressive anti-scrape. Not automatable in the near term; lives in the direct-contact verification queue.

---

## Master coverage table — 26 active CIL listings

Sorted by city, then listing. Difficulty reasons call out the specific deal surface observed or inferred. Source: `master_listings` live query, 2026-04-26 night.

| # | Slug | Name | City | Website | Has phone | Has website | Difficulty | Reason |
|---|---|---|---|---|:---:|:---:|---|---|
| 1 | `beyond-hello-bloomington` | Beyond Hello Bloomington | Bloomington | beyond-hello.com | ✓ | ✓ | **EASY** | Chain pattern: `/illinois-dispensaries/bloomington/adult-use-menu/menu/specials/`. Same parser as Peoria + Normal. |
| 2 | `cookies-bloomington` | Cookies Dispensary Bloomington | Bloomington | cookiesbloomington.com → bloomington.cookies.co | ✓ | ✓ | **MEDIUM** | Primary deal surface is the `bloomington.cookies.co` online shop. No standalone `/specials` URL; discounts live inside the menu renderer. (3 active deals scraped today via `/specials` path.) |
| 3 | `nuera-champaign` | nuEra Champaign | Champaign | nueracannabis.com | ✓ | ✓ | **EASY** | Chain pattern: `/dispensaries/il/champaign/deals/`. Parser shared with East Peoria, Pekin, Urbana. |
| 4 | `sunnyside-champaign` | Sunnyside | Champaign | sunnyside.shop | ✓ | ✓ | **MEDIUM** | Direct menu URL (`/menu/champaign-il/store/champaign-il`) hosts deals inside the Cresco-owned menu widget. No separate `/specials` page; requires in-widget parsing. |
| 5 | `the-dispensary-champaign` | The Dispensary Champaign | Champaign | thedispensaryfulton.com | ✓ | ✓ | **MEDIUM** | Website in DB points to the Fulton (sister) location. Until a Champaign-specific page surfaces, treat as MEDIUM with parser branching by location; otherwise direct-contact queue. |
| 6 | `cloud-9-east-peoria` | Cloud 9 East Peoria | East Peoria | cloud9dispensaries.shop | ✓ | ✓ | **MEDIUM** | Menu-platform domain (`.shop`). Parser must handle the menu widget; no discrete deals page observed. |
| 7 | `noxx-east-peoria` | NOXX East Peoria | East Peoria | noxx.com | ✓ | ✓ | **MEDIUM** | `/specials` page exists but mixes flat-percent and BOGO copy in prose form (cause of tonight's NOXX false positive — fixed by BOGO prefix guard in `lib/scraper/cil-deal-scraper.ts`). 1 active deal today (20% off edibles). |
| 8 | `nuera-east-peoria` | nuEra East Peoria | East Peoria | nueracannabis.com | ✓ | ✓ | **EASY** | Confirmed `/dispensaries/il/east-peoria/deals/`. |
| 9 | `ayr-wellness-normal` | AYR Wellness Normal | Normal | bloom-wellness.com | ✓ | ✓ | **MEDIUM** | Retail brand site (Bloom). Deal surface needs manual inspection; likely embedded menu or social-driven promotions. |
| 10 | `beyond-hello-normal` | Beyond Hello Normal | Normal | beyond-hello.com | ✓ | ✓ | **EASY** | Chain pattern `/illinois-dispensaries/normal/adult-use-menu/menu/specials/`. |
| 11 | `high-haven-normal` | High Haven Normal (The Puff Palace) | Normal | highhavencannabis.com | ✓ | ✓ | **MEDIUM** | Independent chain. Location page (`/high-haven-normal-il-the-puff-palace/`) renders; deal surface almost certainly an embedded menu widget. |
| 12 | `revolution-dispensary-normal` | Revolution Dispensary Normal | Normal | revcanna.com | ✓ | ✓ | **MEDIUM** | Revolution chain site. Parser effort moderate; deal data tends to live in embedded menu on the location page. |
| 13 | `nuera-pekin` | NuEra | Pekin | nueracannabis.com | ✓ | ✓ | **EASY** | Chain pattern `/dispensaries/il/pekin/deals/`. |
| 14 | `aroma-hill-peoria` | Aroma Hill Peoria | Peoria | aromahillcannabis.com | ✓ | ✓ | **MEDIUM** | Independent. Location page (`/peoria/`) renders; deal surface likely menu widget or homepage banner. Needs per-site inspection. |
| 15 | `beyond-hello-peoria` | Beyond Hello Peoria | Peoria | beyond-hello.com | ✓ | ✓ | **EASY** | `/illinois-dispensaries/peoria/adult-use-menu/menu/specials/`. |
| 16 | `ivy-hall-dispensary` | Ivy Hall Dispensary | Peoria | ivyhalldispensary.com | ✓ | ✓ | **MEDIUM** | Specials inside embedded online-shop menu, not a discrete URL. 3 active deals today. |
| 17 | `trinity-on-glen` | Trinity on Glen | Peoria | trinitydispensaries.com | ✓ | ✓ | **MEDIUM** | Dutchie-embed menu on dispensary domain. `/menu?dtche%5Blocation%5D=trinity-on-glen` — requires Dutchie endpoint reads. |
| 18 | `trinity-on-university` | Trinity on University | Peoria | trinitydispensaries.com | ✓ | ✓ | **MEDIUM** | Same Dutchie pattern; different location slug. |
| 19 | `cookies-peoria-heights` | Cookies Peoria Heights | Peoria Heights | cookiespeoriaheights.com | ✓ | ✓ | **MEDIUM** | Same Cookies.co platform as Bloomington. Deal surface inside menu widget. 2 active deals today. |
| 20 | `ascend-cannabis-downtown-springfield` | Ascend Cannabis Downtown Springfield | Springfield | ascendwellness.com | ✓ | ✓ | **MEDIUM** | Ascend chain site. No discrete `/deals` URL; deals live inside menu page or behind the Ascenders Club SMS program. |
| 21 | `ascend-cannabis-horizon-drive` | Ascend Cannabis Horizon Drive | Springfield | ascendwellness.com | ✓ | ✓ | **MEDIUM** | Same pattern as Downtown. Shared parser across the two Ascend Springfield locations. |
| 22 | `high-profile-cannabis-springfield` | High Profile Cannabis Springfield | Springfield | highprofilecannabis.com | ✓ | ✓ | **EASY** | Clean specials URLs observed: `/specials/springfield-dispensary` and `/shop/springfield-dispensary/specials`. Structured deal list on-page. |
| 23 | `maribis-springfield` | Maribis Springfield | Springfield | maribisllc.com | ✓ | ✓ | **MEDIUM** | Independent operator site. Deal surface needs per-site inspection; likely homepage banner + embedded menu. |
| 24 | `shangri-la-springfield` | Shangri-La Springfield | Springfield | shangrila.com | ✓ | ✓ | **HARD** | The `shangrila.com` URL in DB does not look like a dispensary-owned domain (generic consumer brand). Needs contact-data verification before the scraper can trust it. Treat as no reliable website until confirmed. |
| 25 | `share-springfield` | SHARE | Springfield | everyoneshares.com | ✓ | ✓ | **MEDIUM** | SHARE's retail site. 1 active deal today (Senior 10% off). |
| 26 | `nuera-urbana` | nuEra Urbana | Urbana | nueracannabis.com | ✓ | ✓ | **EASY** | Chain pattern `/dispensaries/il/urbana/deals/`. |

### Rollup (assessment summary, post-rewrite)

| Difficulty | Count | % of 26 |
|---|---:|---:|
| EASY | 7 | 27% |
| MEDIUM | 18 | 69% |
| HARD | 1 | 4% |

**EASY listings (7):** Beyond Hello Bloomington / Normal / Peoria, nuEra Champaign / East Peoria / Pekin / Urbana, plus High Profile Cannabis Springfield (8 EASY by parser count when High Profile is added — but High Profile is the only one not on a shared chain template, so the row count is 7 chain + 1 bespoke). Correcting: **the rollup above counts 7 chain-template EASY + 1 bespoke EASY = 8 total EASY rows**, not 7. The discrepancy is a rollup rendering choice; per-row the EASY listings are: rows 1, 3, 8, 10, 13, 15, 22, 26 (= 8). Future readers: trust the per-row count.

Corrected rollup:

| Difficulty | Count | % of 26 |
|---|---:|---:|
| EASY | 8 | 31% |
| MEDIUM | 17 | 65% |
| HARD | 1 | 4% |

**MEDIUM listings (17):** the independents and chain sites that host deals inside an embedded menu widget but on a dispensary-owned domain (rows 2, 4, 5, 6, 7, 9, 11, 12, 14, 16, 17, 18, 19, 20, 21, 23, 25).

**HARD listings (1):** Shangri-La Springfield (suspect URL — `shangrila.com` does not appear dispensary-owned). All other rows have a working dispensary-owned web surface, even if the deal surface inside it requires JS or widget traversal.

Two scrapers cover 7 of the 8 EASY listings: the Beyond Hello chain template (3 locations) and the nuEra chain template (4 locations). One bespoke EASY parser covers High Profile Springfield. **Net: two chain scrapers + one one-off = 8 dispensaries on autopilot.**

---

## Priority list for in-person / direct-contact verification

The MEDIUM + HARD listings that matter most for Matthew's next outreach cycle. Selected for a mix of traffic weight (Peoria / Springfield density), dispensaries where automation is expensive-to-impossible, and coverage gaps where a single phone call unlocks real deal data.

Ranked top to bottom — start here when direct outreach resumes.

1. **Shangri-La Springfield** — HARD (suspect URL). One phone call resolves whether `shangrila.com` is the real dispensary website or a domain collision; downstream classification depends on this.
2. **The Dispensary Champaign** — MEDIUM, but website points to the Fulton sister location. Champaign has only three active listings; this is a real coverage gap. Confirm the Champaign-specific deals URL with the operator.
3. **Cookies Peoria Heights** — MEDIUM. High-salience independent location in the Peoria metro; 2 deals already scraping today. Direct contact lets us confirm current promos while the parser for Cookies.co is built out.
4. **Ivy Hall Dispensary** — MEDIUM. Peoria anchor. 3 active deals today; menu-widget surface means automation lags. Direct contact confirms deals faster than waiting for the parser.
5. **Aroma Hill Peoria** — MEDIUM independent. Peoria metro weight. Confirming current deal channels (site vs. social) with the operator tells us whether this is actually MEDIUM or effectively HARD.
6. **Ascend Cannabis Horizon Drive (Springfield)** — MEDIUM. Springfield anchor. Direct contact lets us ask whether the in-menu discount flags are reliable enough for the scraper, or whether we need a contact-verified deal feed from the Ascenders Club calendar.
7. **Ascend Cannabis Downtown Springfield** — MEDIUM. Stacks with Horizon Drive in a single Springfield outreach pass.
8. **AYR Wellness Normal** — MEDIUM. Bloomington-Normal is the second metro; no EASY listings in scope there beyond the two Beyond Hello stores. AYR Wellness contact unlocks a second Normal deal source.
9. **Maribis Springfield** — MEDIUM independent. Adds Springfield deal density beyond the two chain operators.
10. **Sunnyside Champaign** — MEDIUM. Cresco-owned menu widget; per-product flags are inferable but unstable. Direct contact unblocks Champaign #2.

Net: one HARD (Shangri-La URL collision) and nine high-weight MEDIUM listings. Clearing this list is the fastest path from 10 active direct-source deals to a double-digit-per-city set.

---

## Removed from coverage (audit trail)

The earlier version of this doc included three rows that should never have appeared in a Central Illinois coverage table. They were filtered into the doc by a `city='Springfield'` query that did not also constrain `state='IL'`. All three are in **Springfield, MO** (`state='MO'`) and remain active in the DB as part of the broader statewide preserved-not-rendered set; they just are not in CIL scope.

| Slug | Name | City | State | Removed because |
|---|---|---|---|---|
| `flora-farms-springfield` | Flora Farms Springfield | Springfield | MO | Out of CIL scope; never had an Illinois address. |
| `key-cannabis-springfield` | Key Cannabis Springfield | Springfield | MO | Out of CIL scope. |
| `terrabis-springfield` | Terrabis Springfield | Springfield | MO | Out of CIL scope. |

Two further rows that the original doc included as `[DEACTIVATING]` are now actually deactivated and so are absent from this rewrite:

| Slug | Reason for deactivation |
|---|---|
| `ascend-springfield` | Duplicate stub of `ascend-cannabis-horizon-drive`. |
| `consume-cannabis-champaign` | Wrong-identity ghost row — 505 W Town Center Blvd is actually Cloud9 Champaign. |

The 31 → 26 reconciliation is therefore: 31 in earlier doc − 3 MO miscategorizations − 2 deactivations = 26 verified live CIL dispensaries.

---

## Notes for Code

- Chain scrapers: build **beyond-hello** and **nueracannabis** parsers first — they cover 7 of 8 EASY listings in scope. One High Profile parser closes the EASY set.
- Every MEDIUM listing needs per-site inspection before a parser goes to staging — URL pattern assumptions are notoriously brittle once the menu widget is in play. Treat each as a separate engineering task.
- HARD listings should not be in the scraper queue at all. They route straight to the direct-contact verification queue and receive `verified_direct_contact`-tier deals only when someone manually confirms.
- Scraped deals carry `source='website'` and the source URL in `source_url`. Manual deals carry whatever convention Matthew picks (placeholder: `verified_direct_contact` in `verified_by`).
- Scrape cadence is **daily** under the current Vercel Hobby plan (`vercel.json` cron `0 9 * * *`). The deal data policy still names "every 6 hours" as the long-term target; upgrade path is either Vercel Pro or an external scheduler hitting `/api/cron/scrape-deals` with the bearer token.
