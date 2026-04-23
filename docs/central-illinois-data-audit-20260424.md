# Central Illinois Data Audit — 2026-04-24
**Author:** Cowork (Claude)
**Purpose:** Ground-truth the 11-city Central IL scope lock against live Supabase data before the positioning pivot ships.
**Source:** Supabase project `hnbjufmtmrhexmdrfubw`, live SELECTs only, morning of 2026-04-24.
**Companion doc:** `docs/FINDINGS-2026-04-24-central-il-coverage-gap.md` — the hard flags Matthew needs to see first.

---

## Scope under audit

Eleven cities, locked last night:

Peoria, East Peoria, Pekin, Bartonville, Morton, Washington, Normal, Bloomington, Champaign, Urbana, Springfield.

---

## Statewide baseline (for comparison)

| Metric | Value |
|---|---|
| IL active dispensaries | 67 |
| IL cities with ≥1 dispensary | 28 |
| Active deals statewide | 53 |
| Total `master_listings` rows | 111 |

---

## Per-city snapshot

All fields are raw SELECTs against `master_listings` (dispensaries, `state='IL'`, `is_active IS NOT FALSE`) joined to `deals` on `listing_slug`.

| City | Dispensaries | Active deals | Phone | Website | GPS | Logo | 150-word floor |
|---|---:|---:|---:|---:|---:|---:|---:|
| Springfield | 6 | 0 | 5 | 5 | 0 | 0 | 0 |
| Peoria | 5 | 2 | 4 | 4 | 0 | 1 | 0 |
| Normal | 4 | 0 | 4 | 4 | 0 | 1 | 0 |
| Champaign | 3 | 4 | 0 | 0 | 0 | 2 | 0 |
| Bloomington | 2 | 0 | 1 | 1 | 0 | 1 | 0 |
| East Peoria | 2 | 5 | 2 | 2 | 0 | 1 | 0 |
| Urbana | 1 | 0 | 1 | 1 | 0 | 1 | 0 |
| Bartonville | 0 | 0 | — | — | — | — | — |
| Morton | 0 | 0 | — | — | — | — | — |
| Pekin | 0 | 0 | — | — | — | — | — |
| Washington | 0 | 0 | — | — | — | — | — |
| **Total** | **23** | **11** | **17** | **17** | **0** | **7** | **0** |

---

## Flags

### Cities with <3 dispensaries (too thin to matter on their own)

- **Bloomington (2)** — pairs with Normal to form a metro; treat jointly.
- **East Peoria (2)** — pairs with Peoria; 5 active deals make it inventory-important despite listing count.
- **Urbana (1)** — pairs with Champaign.
- **Bartonville (0)**, **Morton (0)**, **Pekin (0)**, **Washington (0)** — **empty.** No dispensary rows exist.

Seven of eleven cities are thin (<3). Four of those seven are empty.

### Cities with 0 active deals (dead zones we are promoting)

Eight of eleven cities have zero active deals as of this morning:

Bartonville, Bloomington, Morton, Normal, Pekin, Springfield, Urbana, Washington.

**Most surprising dead zone:** Springfield. Six dispensaries, clean contact data on 5 of 6, zero active deals. This is the IL state capital — the "we cover the capital" story is a positioning asset, but right now the capital is a ghost town on the site.

**Least surprising dead zone:** Bartonville / Morton / Pekin / Washington. No dispensaries → no deals.

### Cities with 3+ active deals (the actual inventory)

| City | Dispensaries | Active deals | Concentration |
|---|---:|---:|---|
| East Peoria | 2 | 5 | 100% from nuEra East Peoria |
| Champaign | 3 | 4 | 100% from nuEra Champaign (other 2 dispensaries dormant on deals) |
| Peoria | 5 | 2 | 100% from Ivy Hall Peoria |

**Three cities, three dispensaries, 11 deals.** That's the entire Central IL deal surface right now.

### Coverage quality flags

- **GPS: 0 of 23 (0%).** Worse than the 1-of-67 statewide rate. "GPS-aware" positioning is not demonstrable anywhere in Central IL today. Fixing this is a single Google Places run for 23 rows — bounded, cheap, reversible.
- **Content floor: 0 of 23 (0%).** Matches statewide 0-of-67. The three pilots shipped April 23 (`cookies-chicago`, `high-haven-elgin`, `nuera-east-peoria`) are unmerged templates; the nuEra East Peoria pilot is the one directly usable for Central IL.
- **Phone / website: 17 of 23 (74%).** Above statewide 69%. Central IL is actually better-documented than average — except for Champaign, where all 3 listings have both fields null.
- **Logos: 7 of 23 (30%).** Above statewide 18%. Mostly from the April 22 logo backfill.

---

## Top dispensaries by active deal count (Central IL)

Ranked full list. Three dispensaries hold all 11 deals. In-person verification priorities run top-down.

| Rank | Dispensary | City | Active deals | Phone? | Website? | GPS? |
|---:|---|---|---:|---|---|---|
| 1 | nuEra East Peoria | East Peoria | 5 | ✓ | ✓ | ✗ |
| 2 | nuEra Champaign | Champaign | 4 | ✗ | ✗ | ✗ |
| 3 | Ivy Hall Dispensary | Peoria | 2 | ✓ | ✓ | ✗ |
| 4 | Beyond Hello Bloomington | Bloomington | 0 | ✗ | ✗ | ✗ |
| 5 | Cookies Dispensary Bloomington | Bloomington | 0 | ✓ | ✓ | ✗ |
| 6 | Consume Cannabis Champaign | Champaign | 0 | ✗ | ✗ | ✗ |
| 7 | The Dispensary Champaign | Champaign | 0 | ✗ | ✗ | ✗ |
| 8 | NOXX East Peoria | East Peoria | 0 | ✓ | ✓ | ✗ |
| 9 | AYR Wellness Normal | Normal | 0 | ✓ | ✓ | ✗ |
| 10 | Beyond Hello Normal | Normal | 0 | ✓ | ✓ | ✗ |
| 11 | High Haven Normal (The Puff Palace) | Normal | 0 | ✓ | ✓ | ✗ |
| 12 | Revolution Dispensary Normal | Normal | 0 | ✓ | ✓ | ✗ |
| 13 | Beyond Hello Peoria | Peoria | 0 | ✓ | ✓ | ✗ |
| 14 | North Star Remedies | Peoria | 0 | ✗ | ✗ | ✗ |
| 15 | Trinity on Glen | Peoria | 0 | ✓ | ✓ | ✗ |
| 16 | Trinity on University | Peoria | 0 | ✓ | ✓ | ✗ |
| 17 | Ascend Cannabis (Horizon area) | Springfield | 0 | ✗ | ✗ | ✗ |
| 18 | Ascend Cannabis Downtown Springfield | Springfield | 0 | ✓ | ✓ | ✗ |
| 19 | Ascend Cannabis Horizon Drive | Springfield | 0 | ✓ | ✓ | ✗ |
| 20 | High Profile Cannabis Springfield | Springfield | 0 | ✓ | ✓ | ✗ |
| 21 | Maribis Springfield | Springfield | 0 | ✓ | ✓ | ✗ |
| 22 | Shangri-La Springfield | Springfield | 0 | ✓ | ✓ | ✗ |
| 23 | nuEra Urbana | Urbana | 0 | ✓ | ✓ | ✗ |

### In-person / phone verification priority list (top 10)

Ranked by active deal count first, then by "phone/website present means it's reachable now without a data fix":

1. **nuEra East Peoria** — 5 deals, reachable. Call (309) 839-1330; confirm Flower Friday, Munchie Monday, Wax Wednesday, Veterans 10%, first-time 20% are all still running. **Highest-leverage single call in Central IL.**
2. **nuEra Champaign** — 4 deals, NOT reachable (contactless record). Same corporate parent as #1. One call to Laura Jaramillo Bernal (`ljaramillo@nueracannabis.com`) covers both listings. See reshaped Tier-1 doc.
3. **Ivy Hall Peoria** — 2 deals, reachable at (855) 489-4255.
4. **Beyond Hello Bloomington** — 0 deals, NOT reachable. Sister-chain to Beyond Hello Peoria and Beyond Hello Normal; shared corporate. One Jushi Holdings contact resolves all three.
5. **Cookies Bloomington** — 0 deals, reachable. Already has content-pilot draft from April 23.
6. **Trinity on Glen + Trinity on University (Peoria)** — 0 deals each, both reachable, same Trinity Dispensaries corporate. Paired outreach.
7. **NOXX East Peoria** — 0 deals, reachable. Neighbor of the top-deal dispensary (nuEra East Peoria); running zero deals while the competitor across town runs five is interesting.
8. **High Haven Normal (The Puff Palace)** — 0 deals, reachable. Existing content-pilot draft from April 23.
9. **Ascend Cannabis Downtown + Ascend Horizon (Springfield)** — 0 deals each, reachable; shared AWH corporate.
10. **AYR / Revolution / Beyond Hello / High Profile / Maribis / Shangri-La / nuEra Urbana** — all reachable; candidates for "why are you running no deals?" scripted outreach.

**Read:** The deal surface is concentrated in three dispensaries, but the reachable-surface is 17 dispensaries. Half a day of phone work could double or triple the visible deal count, purely by asking currently-listed operators whether they have any current promotions to list.

---

## Subcomparisons

### Central IL share of statewide inventory

| Metric | Central IL | Statewide | CIL share |
|---|---:|---:|---:|
| Active dispensaries | 23 | 67 | 34% |
| Active cities | 7 | 28 | 25% |
| Active deals | 11 | 53 | 21% |
| Listings with GPS | 0 | 1 | 0% |
| Listings hitting 150-word floor | 0 | 0 | — |

Central IL is roughly **one-third** of statewide listings but **one-fifth** of statewide active deals and **none** of statewide GPS coverage. The pivot trades a larger (but unpromoted) inventory for a smaller one that Matthew can actually verify this week.

### The Champaign anomaly

All three Champaign dispensaries have both `phone IS NULL` and `website IS NULL`:

- `nuera-champaign` — 4 active deals (powers the entire Champaign deal surface)
- `consume-cannabis-champaign` — 0 deals
- `the-dispensary-champaign` — 0 deals

nuEra Champaign is the single dispensary where one phone call unlocks the most visible Central IL surface per minute of effort. The Tier-1 reshaped outreach doc (see `docs/ops/tier-1-gap-fill-contact-research-20260423-v2.md`) centers on this.

### The Springfield paradox

Six dispensaries, 5 of 6 have clean phone + website, and **zero active deals**. This is either (a) a scraper gap — Springfield operators run deals we just haven't captured — or (b) a real market feature, possibly driven by how Sangamon County tax + competitive dynamics differ from Peoria/Champaign-Urbana. Worth a single phone call to Ascend Downtown (217-679-3283) to sanity-check whether they run any current promotions we should be indexing.

---

## Recommendations (not decisions)

1. **Pair the 11 cities into 4 metro clusters for homepage/search:** Peoria-area (Peoria, East Peoria, Pekin, Bartonville, Morton, Washington), Bloomington-Normal, Champaign-Urbana, Springfield. Cities with zero dispensaries still show up — they route to the nearest metro-cluster dispensary list. Matches the already-shipped `/near/[landmark]` pattern.
2. **Run one Google Places geocoding pass for the 23 Central IL dispensaries.** One bounded ask, ~$5, unlocks distance-sort across all of Central IL.
3. **Prioritize nuEra Champaign + nuEra East Peoria as one outreach.** Jaramillo Bernal email covers 9 of 11 Central IL active deals.
4. **Ship the content-depth layer for all 23 Central IL dispensaries before the positioning pivot goes public.** The April 23 pilots already template it. 23 × ~300 words is doable in a single focused session.
5. **Hold homepage copy claims to "three dispensaries with active deals today, covering East Peoria, Champaign, and Peoria — more metros listed below."** Truthful, consistent with the flag above.

---

## Source queries

For reproducibility. All run read-only against Supabase via MCP on 2026-04-24 AM.

```sql
-- Per-city rollup
WITH scope AS (
  SELECT unnest(ARRAY[
    'Peoria','East Peoria','Pekin','Bartonville','Morton',
    'Washington','Normal','Bloomington','Champaign','Urbana','Springfield'
  ]) AS city
)
SELECT s.city AS scope_city,
       COUNT(ml.id) AS dispensary_count,
       SUM(CASE WHEN ml.phone   IS NOT NULL AND length(trim(ml.phone))>0   THEN 1 ELSE 0 END) AS with_phone,
       SUM(CASE WHEN ml.website IS NOT NULL AND length(trim(ml.website))>0 THEN 1 ELSE 0 END) AS with_website,
       SUM(CASE WHEN ml.lat IS NOT NULL AND ml.lng IS NOT NULL             THEN 1 ELSE 0 END) AS with_gps,
       SUM(CASE WHEN ml.logo_url IS NOT NULL AND length(trim(ml.logo_url))>0 THEN 1 ELSE 0 END) AS with_logo,
       SUM(CASE WHEN ml.long_description IS NOT NULL
                 AND array_length(regexp_split_to_array(trim(ml.long_description), '\s+'), 1) >= 150
            THEN 1 ELSE 0 END) AS content_floor_met
FROM scope s
LEFT JOIN master_listings ml
       ON lower(ml.city) = lower(s.city)
      AND ml.type='dispensary' AND ml.state='IL' AND ml.is_active IS NOT FALSE
GROUP BY s.city
ORDER BY dispensary_count DESC, scope_city;

-- Active deals per city
WITH scope AS (SELECT unnest(ARRAY['Peoria','East Peoria','Pekin','Bartonville','Morton','Washington','Normal','Bloomington','Champaign','Urbana','Springfield']) AS city)
SELECT s.city, COUNT(d.id) FILTER (WHERE d.is_active=true) AS active_deals
FROM scope s
LEFT JOIN master_listings ml ON lower(ml.city) = lower(s.city) AND ml.type='dispensary' AND ml.state='IL' AND ml.is_active IS NOT FALSE
LEFT JOIN deals d ON d.listing_slug = ml.slug
GROUP BY s.city
ORDER BY active_deals DESC NULLS LAST, s.city;
```
