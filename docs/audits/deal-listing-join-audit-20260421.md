# Deal → master_listings join integrity audit — 2026-04-21

**Author:** Cowork
**Triggered by:** Code's Apr 21 night production check ([docs/session-reports/2026-04-21-evening-code.md](../session-reports/2026-04-21-evening-code.md#appendix)) — `/api/deals/recommend` returned `openStatus: null` and `coords: null` for several cities because the top-pick deal's `listing_slug` did not join to `master_listings`.
**Schema contract:** `active_deals_with_listings` view does `LEFT JOIN master_listings m ON d.listing_slug = m.slug`. Any orphan `listing_slug` silently falls through — city becomes NULL, name becomes NULL, no coords, no hours, no map, no phone, no logo. The page "works" but every listing-sourced field is blank.

---

## Headline

**21 distinct `listing_slug` values across the active deal set. 12 join cleanly. 9 are orphans (18 deals affected, ~32% of the active deal set).**

Of the 9 orphans:
- **3 are fixable by slug repoint** (11 deals, 61% of orphan volume) — the canonical master_listings row exists under a different slug.
- **5 appear to be legitimate IL dispensaries not yet in `master_listings`** (6 deals) — the source URLs resolve on Leafly/Weedmaps; these need `master_listings` rows created before the deals can join. Fix is manual data entry, not a slug rename.
- **1 is ambiguous** (1 deal) — `mood-shine-chicago-heights` has a Weedmaps URL but isn't a known IL chain; likely a scrape error or test data.

---

## Full diff table

Deal `listing_slug` values that DO join (12):

| deal.listing_slug | master_listings.slug | status |
|---|---|---|
| bisa-lina-carol-stream | bisa-lina-carol-stream | ✅ matches |
| hi5-dispensary-crestwood | hi5-dispensary-crestwood | ✅ matches |
| high-haven-elgin | high-haven-elgin | ✅ matches |
| nuera-aurora | nuera-aurora | ✅ matches |
| nuera-champaign | nuera-champaign | ✅ matches |
| nuera-east-peoria | nuera-east-peoria | ✅ matches |
| prairie-cannabis-naperville | prairie-cannabis-naperville | ✅ matches |
| seven-point-danville | seven-point-danville | ✅ matches |
| star-buds-westmont | star-buds-westmont | ✅ matches |
| terrace-cannabis-moline | terrace-cannabis-moline | ✅ matches |
| zen-leaf-aurora | zen-leaf-aurora | ✅ matches |
| zen-leaf-naperville | zen-leaf-naperville | ✅ matches |

Deal `listing_slug` values that do NOT join (9 — 18 deals total):

| deal.listing_slug | deal count | best master match | verdict | source URL |
|---|---|---|---|---|
| altius-dispensary-carol-stream | 6 | **altius-carol-stream** | **REPOINT** — master row exists, name/city match, leafly source URL uses the `altius-carol-stream` path | leafly.com/dispensaries/**altius-carol-stream** |
| ivy-hall-peoria | 2 | **ivy-hall-dispensary** | **REPOINT** — master row `ivy-hall-dispensary` city = Peoria, same dispensary, different slug | ivyhalldispensary.com |
| natures-treatment-galesburg | 3 | **nature-treatment-galesburg** | **REPOINT** — master row uses singular `nature` (data entry inconsistency), same dispensary | leafly.com/dispensaries/**natures-treatment-galesburg** (note: source URL uses plural; master row uses singular) |
| bisa-lina-joliet | 1 | none | **INSERT NEW MASTER** — Bisa Lina operates a Joliet location; leafly URL resolves. Need master_listings row inserted separately. | leafly.com/dispensaries/bisa-lina-joliet |
| cookies-chicago | 1 | none (cookies-bloomington is a different store) | **INSERT NEW MASTER** — Cookies operates a Chicago location in addition to Bloomington. | weedmaps.com/dispensaries/cookies-chicago |
| curaleaf-morris | 1 | none | **INSERT NEW MASTER** — Curaleaf Morris is a real IL dispensary; leafly URL resolves. | leafly.com/dispensaries/curaleaf-morris |
| natures-treatment-milan | 2 | none (only Galesburg exists for this chain) | **INSERT NEW MASTER** — Nature's Treatment of IL has a Milan location. | leafly.com/dispensaries/natures-treatment-milan |
| perception-cannabis-chicago | 1 | none | **INSERT NEW MASTER** — Perception Cannabis is a real Chicago dispensary; weedmaps URL resolves. | weedmaps.com/dispensaries/perception-cannabis |
| mood-shine-chicago-heights | 1 | none | **ORPHAN / INVESTIGATE** — no known "Mood Shine" chain in Chicago Heights; weedmaps URL (weedmaps.com/dispensaries/mood-shine) likely scrape error, typo, or test data. | weedmaps.com/dispensaries/mood-shine |

---

## Recommendations

### Immediate (apply via migration `sql/migrations/2026-04-22-fix-deal-listing-joins.sql`)

**Repoint the 3 fixable slugs** (11 deals, ~20% of the active set):

1. `UPDATE deals SET listing_slug = 'altius-carol-stream' WHERE listing_slug = 'altius-dispensary-carol-stream'` — fixes 6 deals
2. `UPDATE deals SET listing_slug = 'ivy-hall-dispensary' WHERE listing_slug = 'ivy-hall-peoria'` — fixes 2 deals
3. `UPDATE deals SET listing_slug = 'nature-treatment-galesburg' WHERE listing_slug = 'natures-treatment-galesburg'` — fixes 3 deals

**Mark the 6 dispensary-not-in-master rows as orphaned** (prevents silent breakage on the live site):

`UPDATE deals SET is_active = false, status_reason = 'orphaned' WHERE listing_slug IN ('bisa-lina-joliet', 'cookies-chicago', 'curaleaf-morris', 'natures-treatment-milan', 'perception-cannabis-chicago', 'mood-shine-chicago-heights')`

Rationale: better to hide these from the public feed than render a no-city, no-name, no-hours, no-map card. Deals are retained in the table (not deleted) so we can re-activate once the master_listings rows are created.

### Follow-up — master_listings insertions (NOT in this migration)

For the 5 plausible-legitimate dispensaries, the right path is:
1. A Cowork research pass (one session) that Google Maps verifies each is a real IL dispensary, grabs lat/lng, license number, phone, hours.
2. A follow-up migration `sql/migrations/2026-04-XX-add-5-master-listings.sql` that INSERTs them.
3. A re-activation migration that flips the orphaned deals back to `is_active = true` with their original `listing_slug` once the master rows exist.

This is a 2-3 hour research session, not a tonight-task. Flagged in the session report.

### For `mood-shine-chicago-heights` — manual investigation

Ask Matthew to check the Weedmaps URL. If it resolves to a real dispensary, follow the "add to master_listings" path above. If it doesn't resolve (suspected scrape error), leave `is_active = false, status_reason = 'orphaned'` permanently.

---

## Why this matters

Before fix:
- 18 of 56 active deals (32%) render broken listing context — blank name, blank city, no map, no hours, no phone.
- `/api/deals/recommend` returned `openStatus: null` for Peoria, and Chicago statewide top pick (per Code's verification note) — the user sees a deal but gets zero context about where to redeem it.
- The view's NULL-on-miss contract (by design, per [sql/migrations/2026-04-20-fix-active-deals-view.sql](../../sql/migrations/2026-04-20-fix-active-deals-view.sql)) correctly hides the "Illinois" fabrication but doesn't hide the empty card.

After fix:
- 11 of 18 broken deals resolve immediately (new active count: 49; orphaned: 6; reactivates once master rows added: +6 back to 55).
- Chicago top pick still orphaned (perception-cannabis-chicago) — until its master row is added, pick will fall through to next-best deal in that city.
- Peoria Ivy Hall picks now resolve to `ivy-hall-dispensary` — hours + map unblock.

---

## Appendix — queries used

```sql
-- Distinct active deal slugs
SELECT DISTINCT listing_slug FROM deals WHERE is_active = true ORDER BY listing_slug;

-- Full master_listings for project=green
SELECT slug, name, city FROM master_listings WHERE project_tag = 'green' ORDER BY slug;

-- The diff
SELECT DISTINCT d.listing_slug, COUNT(*) AS deal_count
FROM deals d
LEFT JOIN master_listings m ON d.listing_slug = m.slug
WHERE d.is_active = true AND m.slug IS NULL
GROUP BY d.listing_slug
ORDER BY d.listing_slug;

-- Per-deal detail for orphans
SELECT d.id, d.listing_slug, d.title, d.source, d.source_url, d.category, d.created_at
FROM deals d
LEFT JOIN master_listings m ON d.listing_slug = m.slug
WHERE d.is_active = true AND m.slug IS NULL
ORDER BY d.listing_slug, d.id;
```
