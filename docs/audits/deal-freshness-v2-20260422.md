# Deal Freshness Audit v2 — 2026-04-22

**Author:** Cowork (autonomous session)
**Predecessor:** `docs/audits/deal-data-freshness-20260421.md` (Apr 21 v1)
**Run after:** the 8 Apr 22 morning migrations applied. Includes the 3 deactivated 4/20-expired deals and the 7 orphan deactivations; **excludes** the 7 orphan reactivations from the not-yet-applied `2026-04-22-create-orphan-master-listings.sql`.

---

## Headline numbers

| Metric | Count | % of active |
|---|---:|---:|
| Active deals (today)                                      | **46** | 100% |
| Active deals with `expires_at` set                        |   0    |  0%  |
| Active deals marked recurring (`is_recurring=true`)       |  22    | 48%  |
| Active deals **with no expiry AND not recurring**         |  24    | **52%** |
| Active deals already past `expires_at` but still flagged active | 0 | — |

Inactive: 7 orphaned (rectified by pending migration), 3 expired (4/20), 44 NULL-status legacy.

### What this means

**52% of the active feed is structurally destined to go stale silently.** A deal with neither an `expires_at` nor a recurring pattern has no automated way to age out. Nothing tells the staleness job to deactivate it. It sits in the feed forever until a human notices.

This is the freshness debt v1 first surfaced. v1 measured the symptom (deals older than X days); v2 measures the *cause* (no temporal anchor at all).

---

## Per-dispensary deal density (active only)

15 dispensaries account for all 46 active deals. The other 46 IL master_listings (75% of the directory) have **zero** active deals — every one of those listing pages is an empty deal section right now.

| # | Dispensary | City | Active | Recurring | No-expiry+no-recurring (will go stale) |
|---|---|---|---:|---:|---:|
| 1 | Altius Dispensary               | Carol Stream | 5 | 3 | 2 |
| 2 | nuEra East Peoria               | East Peoria  | 5 | 4 | 1 |
| 3 | nuEra Aurora                    | Aurora       | 4 | 3 | 1 |
| 4 | nuEra Champaign                 | Champaign    | 4 | 3 | 1 |
| 5 | Seven Point Danville            | Danville     | 4 | 0 | **4** |
| 6 | Zen Leaf Naperville             | Naperville   | 4 | 2 | 2 |
| 7 | Natures Treatment (Galesburg)   | Galesburg    | 3 | 2 | 1 |
| 8 | Prairie Cannabis Naperville     | Naperville   | 3 | 2 | 1 |
| 9 | Star Buds Westmont              | Westmont     | 3 | 2 | 1 |
| 10 | Terrace Cannabis Moline        | Moline       | 3 | 1 | 2 |
| 11 | Hi5 Dispensary (Crestwood)     | Crestwood    | 2 | 0 | **2** |
| 12 | High Haven Elgin               | Elgin        | 2 | 0 | **2** |
| 13 | Ivy Hall Dispensary (Peoria)   | Peoria       | 2 | 0 | **2** |
| 14 | Bisa Lina Carol Stream         | Carol Stream | 1 | 0 | **1** |
| 15 | Zen Leaf Aurora                | Aurora       | 1 | 0 | **1** |

### Top 5 deal-density dispensaries → Path C outreach targets

These 5 already see the directory surfacing their content; they're the warmest "submit your current deals" pitches:

1. **Altius Dispensary (Carol Stream)** — 5 active, 2 will go stale
2. **nuEra East Peoria** — 5 active, 1 will go stale
3. **nuEra Aurora** — 4 active, 1 will go stale
4. **nuEra Champaign** — 4 active, 1 will go stale
5. **Seven Point Danville** — 4 active, **all 4 will go stale** (highest urgency for outreach OR scraper coverage)

Reach out to these 5 specifically with `/deals/submit`. Pitch is concrete: "you've got N deals on PuffPrice — confirm or refresh before they age out of the feed."

---

## 46 dispensaries with 0 active deals (empty listing-page audit)

Empty deal sections on listing pages = bad UX (a deal directory whose deal section is empty looks broken). Top concentrations:

- **Springfield (6 dispensaries, 0 deals):** Ascend × 3, High Profile, Maribis, Shangri-La
- **Chicago (5 dispensaries, 0 deals):** Emerald City, Emerald Leaf Collective, Lakefront, nuEra Chicago, Sunnyside Wrigleyville
- **Peoria (4 dispensaries, 0 deals):** Beyond Hello, North Star Remedies, Trinity on Glen, Trinity on University
- **Quincy (4 dispensaries, 0 deals):** Bloom Wellness × 3, Rise
- **Normal (4 dispensaries, 0 deals):** AYR, Beyond Hello, High Haven, Revolution
- **Schaumburg (3 dispensaries, 0 deals):** Revolution, Sunnyside, Verilife
- **Joliet, Bloomington, Naperville, Rockford, Waukegan** — 2 each
- **Mundelein, Effingham, Collinsville, Champaign, Urbana, East Peoria, Danville** — 1 each

This is the Path A target list. A scraper that hits Leafly's per-dispensary deals page once a day for these 46 listings would yield the most marginal value — they're the empty-section listings.

---

## What the structural fix looks like

### Short term (this week)
Code already shipped a staleness job (`docs/handoffs/stale-deal-job-spec-20260421.md`). That job currently can't help the 24 no-expiry/no-recurring deals because there's nothing to compare against.

The minimum viable fix is to set `expires_at = created_at + INTERVAL '30 days'` on every existing active deal that's missing one. Not perfect, but converts a silent decay problem into a measurable one. (If a recurring deal is missing `is_recurring=true`, the staleness job will deactivate it after 30 days — but the manual reactivation pattern is already in place.)

### Long term (next sprint)
The Path A scraper described below converts "manually-curated, structurally stale" into "automated, refreshed daily." Start with Leafly because the markup is consistent across dispensaries and the per-dispensary deals page is well-indexed.

### Even longer term
Path C dispensary submissions (Tier 1 outreach in `docs/ops/sales-playbook-20260422.md`) are the highest-quality data — manual curation by people with skin in the game. But Path A and Path C aren't substitutes; they're complements. Scraper fills the long tail; submissions fill the high-value head.

---

## Recommended next moves (in order)

1. **Apply the orphan-listings migration** (`2026-04-22-create-orphan-master-listings.sql`). +7 active deals, fills 6 listing pages.
2. **Run logo + coords backfill** (`scripts/backfill-logos-from-google-places.ts --apply`). Makes empty listings less empty even before scraping starts.
3. **Quick win:** UPDATE the 24 no-expiry/no-recurring deals with `expires_at = created_at + interval '30 days'`. Single SQL.
4. **Build Path A scraper** per the spec at `docs/handoffs/path-a-scraper-spec-20260422.md`. Code task; estimated 1-2 days.
5. **Path C outreach in parallel** to top 5 dispensaries above + the 15 sales-playbook targets. Manual.

If only 1 of those 5 ships this week, ship #1 (orphan migration) — the 7 deals it brings online are the easiest unit of value.
