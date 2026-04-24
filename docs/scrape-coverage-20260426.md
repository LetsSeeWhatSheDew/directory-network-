# PuffPrice Scrape Coverage Tracker — April 26, 2026

**Scope:** every active Central Illinois dispensary listing in `master_listings` (`project_tag='green'`, `is_active=true`).

**Purpose:** rate the scrape difficulty for each direct source under the new Central-IL-only, direct-source-only deal policy (`docs/deal-data-policy.md`). Used to prioritize scraper engineering, in-person verification outreach, and the direct-contact verification queue.

**DB state used for this doc:** live query run 2026-04-26. Returned 31 active CIL listings across 9 cities. Two are flagged for deactivation in pending Cowork work (`ascend-springfield`, `consume-cannabis-champaign`) — both included here but marked `[DEACTIVATING]`; they drop out once Code applies the migration.

*(Note: earlier planning docs referenced 26 or 28 listings; live DB shows 31 today. Trusting DB per the commit rule.)*

---

## Difficulty legend

- **EASY** — dispensary-owned website has a `/deals`, `/specials`, or equivalent URL with structured, parseable promotion data. Can be scraped with a straightforward HTML selector or embedded-JSON extractor.
- **MEDIUM** — deals appear on the dispensary's site but require JS rendering, iframe traversal, or unstructured parsing (homepage banners, blog posts, embedded POS menu widgets). Scrape is possible but requires per-site parser work and periodic re-tuning.
- **HARD** — no dispensary website, or the only visible deal surface is social-only (especially Instagram Stories/Reels), or aggressive anti-scrape. Not automatable in the near term; lives in the direct-contact verification queue.

---

## Spot-check research (2026-04-26)

Five priority dispensaries checked via web search to ground-truth the difficulty rubric. Observed surface behavior summarized below; full assessment rolled into the master table.

### 1. Ivy Hall Dispensary (Peoria) — `https://ivyhalldispensary.com`

- Per-location page at `/locations/peoria/` with hours, products, and a link to the online shop.
- Deals surface is the embedded online shop menu (`/locations/peoria/menu/`), not a standalone `/deals` URL. Specials are flagged inside the menu widget rather than listed on a discrete page.
- **Difficulty: MEDIUM.** Menu widget rendering likely requires JS evaluation; specials are reachable but not via a simple HTML selector against a static page.

### 2. Trinity on University (Peoria) — `https://www.trinitydispensaries.com`

- All menus run through a Dutchie iframe: `/menu?dtche%5Blocation%5D=trinity-compassionate-care-rec`.
- Specials route observed in the wild: `/menu?dtche%5Blocation%5D=...&dtche%5Bpath%5D=specials/sale/321553`.
- Same domain (dispensary-owned) hosts the embed, so this remains a direct source under the policy. But the deal data lives inside the Dutchie widget and requires the widget to render.
- **Difficulty: MEDIUM.** Parser needs to invoke the Dutchie menu endpoint; direct HTML scrape of `trinitydispensaries.com` returns the shell, not the deals.

### 3. Beyond Hello Peoria — `https://beyond-hello.com/illinois-dispensaries/peoria/`

- Clean direct URL for specials: `/illinois-dispensaries/peoria/adult-use-menu/menu/specials/`.
- Pattern is consistent across their chain — every location has `/adult-use-menu/menu/specials/` under the location slug.
- **Difficulty: EASY.** This is the template case. All three Beyond Hello listings in scope (Peoria, Normal, Bloomington) follow the same URL structure.

### 4. nuEra East Peoria — `https://nueracannabis.com/dispensaries/il/east-peoria/`

- Per-location deals URL: `/dispensaries/il/east-peoria/deals/`.
- Per-deal permalinks under `/shop/store/{store_id}/deals/{deal_id}/{slug}` with structured pricing in page titles ("Entire Store 25% Off", "Fire Deals 40%").
- **Difficulty: EASY.** Consistent chain-wide. All four nuEra listings in scope (East Peoria, Champaign, Pekin, Urbana) share the structure.

### 5. Ascend Springfield Horizon Drive — `https://letsascend.com/locations/illinois/springfield-horizon-drive/` / `https://www.ascendwellness.com/dispensaries/springfield-il`

- Location pages exist on both `letsascend.com` and `ascendwellness.com` (parent brand / consumer brand split).
- Menu page: `letsascend.com/stores/springfield-horizon-drive-illinois` — appears to host live menu data.
- No discrete `/deals` URL surfaced in search. Deal delivery is via Ascenders Club SMS program and in-menu discount flags.
- **Difficulty: MEDIUM.** Scraper has to read the menu page and look for per-product discount markers rather than a consolidated promo list. Parser effort per Ascend location is moderate; three Ascend listings in scope.

---

## Master coverage table (31 active CIL listings)

Sorted by city, then listing. Difficulty reasons call out the specific deal surface observed or inferred.

| # | Slug | Name | City | Website | Difficulty | Reason |
|---|---|---|---|---|---|---|
| 1 | `beyond-hello-bloomington` | Beyond Hello Bloomington | Bloomington | beyond-hello.com | **EASY** | Chain pattern: `/illinois-dispensaries/bloomington/adult-use-menu/menu/specials/`. Same parser as Peoria + Normal. |
| 2 | `cookies-bloomington` | Cookies Dispensary Bloomington | Bloomington | cookiesbloomington.com → bloomington.cookies.co | **MEDIUM** | Primary deal surface is the `bloomington.cookies.co` online shop. No standalone `/specials` URL; discounts live inside the menu renderer. |
| 3 | `consume-cannabis-champaign` `[DEACTIVATING]` | Consume Cannabis | Champaign | _(null)_ | **HARD** | No website. Already flagged for deactivation (wrong-identity ghost; address is Cloud9 Champaign). Drops out of the set. |
| 4 | `nuera-champaign` | nuEra Champaign | Champaign | nueracannabis.com | **EASY** | Chain pattern: `/dispensaries/il/champaign/deals/`. Parser shared with East Peoria, Pekin, Urbana. |
| 5 | `sunnyside-champaign` | Sunnyside | Champaign | sunnyside.shop | **MEDIUM** | Direct menu URL (`/menu/champaign-il/store/champaign-il`) hosts deals inside the Cresco-owned menu widget. No separate `/specials` page; requires in-widget parsing. |
| 6 | `the-dispensary-champaign` | The Dispensary Champaign | Champaign | _(null)_ | **HARD** | No website in DB. In-person verification required until outreach populates a contact surface. |
| 7 | `cloud-9-east-peoria` | Cloud 9 East Peoria | East Peoria | cloud9dispensaries.shop | **MEDIUM** | Menu-platform domain (`.shop`). Parser must handle the menu widget; no discrete deals page observed. |
| 8 | `noxx-east-peoria` | NOXX East Peoria | East Peoria | noxx.com | **MEDIUM** | Location page exists (`/location/noxx-peoria/`). Deals typically live in the location menu or a banner — requires per-page inspection to confirm deal surface. |
| 9 | `nuera-east-peoria` | nuEra East Peoria | East Peoria | nueracannabis.com | **EASY** | Confirmed in spot-check. `/dispensaries/il/east-peoria/deals/`. |
| 10 | `ayr-wellness-normal` | AYR Wellness Normal | Normal | bloom-wellness.com | **MEDIUM** | Retail brand site. Deal surface location needs a manual inspection; likely embedded menu or social-driven promotions. |
| 11 | `beyond-hello-normal` | Beyond Hello Normal | Normal | beyond-hello.com | **EASY** | Chain pattern `/illinois-dispensaries/normal/adult-use-menu/menu/specials/`. |
| 12 | `high-haven-normal` | High Haven Normal (The Puff Palace) | Normal | highhavencannabis.com | **MEDIUM** | Independent chain. Location page (`/high-haven-normal-il-the-puff-palace/`) renders; deal surface almost certainly an embedded menu widget. |
| 13 | `revolution-dispensary-normal` | Revolution Dispensary Normal | Normal | revcanna.com | **MEDIUM** | Revolution chain site. Parser effort moderate; deal data tends to live in embedded menu on the location page. |
| 14 | `nuera-pekin` | NuEra | Pekin | nueracannabis.com | **EASY** | Chain pattern `/dispensaries/il/pekin/deals/`. |
| 15 | `aroma-hill-peoria` | Aroma Hill Peoria | Peoria | aromahillcannabis.com | **MEDIUM** | Independent. Location page (`/peoria/`) renders; deal surface likely menu widget or homepage banner. Needs per-site inspection. |
| 16 | `beyond-hello-peoria` | Beyond Hello Peoria | Peoria | beyond-hello.com | **EASY** | Confirmed in spot-check. `/illinois-dispensaries/peoria/adult-use-menu/menu/specials/`. |
| 17 | `ivy-hall-dispensary` | Ivy Hall Dispensary | Peoria | ivyhalldispensary.com | **MEDIUM** | Confirmed in spot-check. Specials inside embedded online-shop menu, not a discrete URL. |
| 18 | `trinity-on-glen` | Trinity on Glen | Peoria | trinitydispensaries.com | **MEDIUM** | Dutchie-embed menu on dispensary domain. `/menu?dtche%5Blocation%5D=trinity-on-glen` — requires Dutchie endpoint reads. |
| 19 | `trinity-on-university` | Trinity on University | Peoria | trinitydispensaries.com | **MEDIUM** | Confirmed in spot-check. Same Dutchie pattern; different location slug. |
| 20 | `cookies-peoria-heights` | Cookies Peoria Heights | Peoria Heights | cookiespeoriaheights.com | **MEDIUM** | Same Cookies.co platform as Bloomington. Deal surface inside menu widget. |
| 21 | `ascend-springfield` `[DEACTIVATING]` | Ascend Cannabis | Springfield | letsascend.com/locations/illinois/springfield-horizon-drive/ | **MEDIUM** | Duplicate-stub row of Ascend Horizon Drive; flagged for deactivation. Drops out of the set. |
| 22 | `ascend-cannabis-downtown-springfield` | Ascend Cannabis Downtown Springfield | Springfield | ascendwellness.com | **MEDIUM** | Ascend chain site. No discrete `/deals` URL; deals live inside menu page (`/menu/il-springfield-adams-menu-med`) or behind SMS program. |
| 23 | `ascend-cannabis-horizon-drive` | Ascend Cannabis Horizon Drive | Springfield | ascendwellness.com | **MEDIUM** | Same pattern as Downtown. Shared parser across the two Ascend Springfield locations. |
| 24 | `flora-farms-springfield` | Flora Farms Springfield | Springfield | _(null)_ | **HARD** | No website in DB. Research / direct-contact required. |
| 25 | `high-profile-cannabis-springfield` | High Profile Cannabis Springfield | Springfield | highprofilecannabis.com | **EASY** | Clean specials URLs observed: `/specials/springfield-dispensary` and `/shop/springfield-dispensary/specials`. Structured deal list on-page. |
| 26 | `key-cannabis-springfield` | Key Cannabis Springfield | Springfield | _(null)_ | **HARD** | No website in DB. |
| 27 | `maribis-springfield` | Maribis Springfield | Springfield | maribisllc.com | **MEDIUM** | Independent operator site. Deal surface needs per-site inspection; likely homepage banner + embedded menu. |
| 28 | `shangri-la-springfield` | Shangri-La Springfield | Springfield | shangrila.com | **HARD** | The `shangrila.com` URL in DB does not look like a dispensary-owned domain (generic consumer brand). Needs contact-data verification before the scraper can trust it. Treat as no reliable website until confirmed. |
| 29 | `share-springfield` | SHARE | Springfield | everyoneshares.com | **MEDIUM** | SHARE's retail site. Deal surface needs per-site inspection; independent operator. |
| 30 | `terrabis-springfield` | Terrabis Springfield | Springfield | _(null)_ | **HARD** | No website in DB. |
| 31 | `nuera-urbana` | nuEra Urbana | Urbana | nueracannabis.com | **EASY** | Chain pattern `/dispensaries/il/urbana/deals/`. |

### Rollup

| Difficulty | Count | % of 29 post-deactivation set |
|---|---|---|
| EASY | 8 | 28% |
| MEDIUM | 15 | 52% |
| HARD | 6 | 21% |

(Totals sum to 29 after excluding the two `[DEACTIVATING]` rows.)

- **EASY listings (8):** Beyond Hello Bloomington / Normal / Peoria, nuEra Champaign / East Peoria / Pekin / Urbana, High Profile Cannabis Springfield.
- **MEDIUM listings (15):** the independents and chain sites that host deals inside an embedded menu widget but on a dispensary-owned domain.
- **HARD listings (6):** The Dispensary Champaign, Flora Farms Springfield, Key Cannabis Springfield, Shangri-La Springfield (suspect URL), Terrabis Springfield — no usable website surface — plus any post-launch additions that arrive without a website.

Two scrapers cover 7 of the 8 EASY listings: the Beyond Hello chain template (3 locations) and the nuEra chain template (4 locations). One bespoke EASY parser covers High Profile Springfield. **Net: two chain scrapers + one one-off = 8 dispensaries live on autopilot.**

---

## Priority list for in-person / direct-contact verification

The MEDIUM + HARD listings that matter most for Matthew's next outreach cycle. Selected for a mix of traffic weight (Peoria / Springfield density), dispensaries where automation is expensive-to-impossible, and coverage gaps where a single phone call unlocks real deal data.

Ranked top to bottom — start here when direct outreach resumes.

1. **The Dispensary Champaign** — HARD, no website. Champaign has only three active listings; this is a real coverage gap. Phone / in-person confirm is the only path until the dispensary surfaces a web presence.
2. **Flora Farms Springfield** — HARD. Springfield has nine listings but most are MEDIUM or harder. Flora Farms has no scrapable surface; manual verification turns a zero into a one.
3. **Key Cannabis Springfield** — HARD, same reasoning as Flora Farms. Stacks with it in a single Springfield verification pass.
4. **Terrabis Springfield** — HARD, completes the Springfield no-website set. One-trip verification pass in Springfield resolves all three.
5. **Shangri-La Springfield** — HARD (suspect URL). Verify the correct website as step one; only then decide if it's scrapable. Quick phone call resolves.
6. **Cookies Peoria Heights** — MEDIUM. High-salience independent location in the Peoria metro; promotions are known to be active but sit inside the Cookies.co menu widget. Direct contact lets us confirm current promos while the parser for Cookies.co is built.
7. **Ivy Hall Dispensary** — MEDIUM. Peoria anchor. Confirmed deal activity in spot-check, but menu-widget deals mean automation lags. Direct contact confirms deals faster than waiting for the parser.
8. **Aroma Hill Peoria** — MEDIUM independent. Peoria metro weight. Confirming current deal channels (site vs. social) with the operator tells us whether this is actually MEDIUM or effectively HARD.
9. **Ascend Cannabis Horizon Drive (Springfield)** — MEDIUM. Second Springfield anchor behind High Profile. Direct contact lets us ask whether the in-menu discount flags are reliable enough for the scraper, or whether we need a contact-verified deal feed from the Ascenders Club calendar.
10. **AYR Wellness Normal** — MEDIUM. Bloomington-Normal is the second metro; no EASY listings in scope there beyond the two Beyond Hello stores. AYR Wellness contact unlocks a second Normal deal source.

Net: five HARD listings (all Springfield or Champaign) and five high-weight MEDIUM listings. Clearing this list is the fastest path from "2-3 direct-source deals post-cutover" to a double-digit live-deal set.

---

## Notes for Code

- Chain scrapers: build **beyond-hello** and **nueracannabis** parsers first — they cover 7 of 8 EASY listings in scope. One High Profile parser closes the EASY set.
- Every MEDIUM listing needs per-site inspection before a parser goes to staging — URL pattern assumptions are notoriously brittle once the menu widget is in play. Treat each as a separate engineering task.
- HARD listings should not be in the scraper queue at all. They route straight to the direct-contact verification queue and receive `verified_direct_contact`-tier deals only when someone manually confirms.
- Scraped deals carry `verification_level='scraped_direct_source'` and the source URL in `source_url`. Manual deals carry `verification_level='verified_direct_contact'` and the verifier's identifier in `verified_by`.
- Respect the 6-hour cadence from `docs/deal-data-policy.md`. Staggered start times per listing are fine; the guarantee is "every deal is re-verified within 6 hours," not "every listing is hit at the same second."
