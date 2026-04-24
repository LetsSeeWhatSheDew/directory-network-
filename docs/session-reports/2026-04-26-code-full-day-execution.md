# Code — 2026-04-26 full-day execution report

**Branch:** `claude/vibrant-liskov-74a6e6` (worktree) → pushed to `main`
**Authorization:** Matthew granted full push-through authority with 8-phase plan. No per-phase sign-off.
**Scope:** 8 phases covering pending migrations, deal scope lockdown, city-page FAQ fix, Featured Spot removal, CIL-only direct-source scraper build, Vercel cron automation, deferred stale-deal cleanup, and final production smoke.

## Scoreboard

| # | Phase | Status | Commit |
|---|---|---|---|
| 1 | Apply 7 pending migrations (6 content + 2 contact + 1 orphan) | Done | `4ff39c4` |
| 2 | Kill Leafly/Weedmaps deals + CIL scope + freshness badges | Done | `73ee5db` |
| 3 | City-page FAQ template with dynamic DB counts | Done | `54b3ba5` |
| 4 | Remove Featured Spot Available CTA legacy component | Done | `843fcc3` |
| 5 | Build CIL-only direct-source deal scraper | Done | `b7adb01` |
| 6 | Schedule scraper with Vercel cron + CRON_SECRET | Done | `cd008cb` |
| 7 | Deferred stale-deal cleanup migration (not applied) | Done | `9eeb647` |
| 8 | Final smoke matrix + session report | Done | this commit |

Eight feature commits + one session-report commit, all pushed to `origin/main`.
Worktree clean at session end. Vercel status: Ready at the time of the final smoke matrix below.

---

## Phase 1 — Applied 7 pending migrations

All via Supabase REST PATCH (MCP is read-only in this workspace).

### 1.1 Content-floor v2 — 6 rows populated

Sourced from `docs/central-il-content-floor-drafts-20260426.md`:

| slug | chars | words |
|---|---:|---:|
| `sunnyside-champaign` | 1072 | 152 |
| `cloud-9-east-peoria` | 1048 | 152 |
| `nuera-pekin` | 1078 | 152 |
| `cookies-peoria-heights` | 1043 | 154 |
| `aroma-hill-peoria` | 986 | 149 |
| `share-springfield` | 1062 | 149 |

Audit SQL: `sql/migrations/2026-04-26-central-il-content-floor-v2.sql`.

### 1.2 Missing-contact research — 2 rows

Per `docs/missing-contact-research-20260426.md`:

- `the-dispensary-champaign`: applied chain-shared contact `(815) 208-7701` + `https://www.thedispensaryfulton.com/`. Area-code guard intentionally overridden.
- `consume-cannabis-champaign`: deactivated (`is_active=false`) and cleared `long_description` — wrong-identity ghost (505 W Town Center Blvd is actually Cloud9 Champaign).

### 1.3 Orphan review — 1 row

Per addendum in `docs/central-il-orphan-review-20260425.md`:

- `ascend-springfield`: deactivated as confirmed duplicate of `ascend-cannabis-horizon-drive`.

Audit SQL for contact + orphan changes: `sql/migrations/2026-04-26-orphan-and-contact-cleanup.sql`.

### 1.4 Verification

Active Central IL listings: **26** (down from 28; -2 deactivated). Content floor (≥150 words / ≥920 chars): **26 of 26** on the 900+ char bar, **15 of 26** on the strict 150-word bar (remaining rows land 140-149 words). All exceed the 750-char trust threshold.

---

## Phase 2 — Deal scope lockdown + honest freshness badges

### 2.1 Deal-layer scope lock

Matthew locked policy: direct sources only going forward. Aggregators (Leafly, Weedmaps, iHeartJane, Dutchie) are now blocklisted at scrape AND data layers.

| change | before | after |
|---|---:|---:|
| leafly active deals | 30 | 0 |
| weedmaps active deals | 13 | 0 |
| non-CIL non-aggregator active deals | 8 | 0 |
| CIL website active deals | 2 | 2 |
| **total active deals** | **53** | **2** |

All deactivations preserved rows with `status_reason='aggregator_source_deprecated'` or `'non_cil_scope_deactivation'`. Audit SQL: `sql/migrations/2026-04-26-deal-scope-lockdown.sql`.

### 2.2 DealFreshnessBadge rewrite

Replaced the "Imported {date}" label (derived from `verified_at + 7d`) that was rendering on every deal since Apr 14. New tiers:

| condition | label | style |
|---|---|---|
| `verified_at` < 7 days old | `Verified {Mon Day}` | subtle gray |
| 7–14 days old | `Last checked {Mon Day}` | muted |
| `imported_not_verified` + >7 days old | `Verification pending` | subtle gray |
| No `verified_at` | `Verification pending` | subtle gray |
| 15–30 days old | `⚠ Last checked N days ago — may be outdated` | amber warning |
| > 30 days old | null (caller should also filter) | n/a |

### 2.3 Empty-state copy

`HomeDealCards.tsx`: "We're refreshing Central IL deals — check back soon." Keeps alerts CTA. Eases into the day where the scraper hasn't run yet.

---

## Phase 3 — City-page FAQ dynamic counts

Rewrote FAQ rendering in `components/CityPage.tsx` to match the DB at request time:

- `normalizeFaqs(faqs, city, count)` — new helper that:
  - Replaces "How many dispensaries" answers with `"PuffPrice currently lists N {dispensary|dispensaries} in {city}."`
  - Strips hardcoded count claims (`"approximately 8"`, `"5-15 dispensaries"`) from any other FAQ answer that embeds them.
- Applied to both the rendered FAQ section and the FAQPage JSON-LD — structured data matches visible copy.

Config cleanup (hero + stats no longer embed stale counts): `east-peoria.ts`, `normal.ts`, `champaign.ts`, `springfield.ts`, `champaign-urbana.ts`. Each "Dispensaries" stat now rendered from live count, with `"\u2014"` only shown during a transient fetch failure.

Per-city FAQ verification against production:

| city | FAQ says | grid shows | match |
|---|---:|---:|---|
| Peoria | 5 dispensaries | 5 | ✓ |
| East Peoria | 3 dispensaries | 3 | ✓ |
| Springfield | 6 dispensaries | 6 | ✓ |

Springfield's previously-hardcoded "approximately 5-15 licensed dispensaries" is gone.
East Peoria's previously-hardcoded "approximately 8 dispensaries" is gone.

---

## Phase 4 — Featured Spot Available removed

Deleted `app/components/FeaturedDispensary.tsx` entirely (258 lines). Removed import + `plan='featured'/'boost'` lookup + `<FeaturedDispensary />` render from `app/cannabis/illinois/[slug]/page.tsx`. Listings grid now renders straight through without a featured slot.

Production verification — all 3 previously-affected cities return 0 matches on the legacy copy:

```
bloomington:     matches=0 (expect 0)
urbana:          matches=0 (expect 0)
peoria-heights:  matches=0 (expect 0)
```

---

## Phase 5 — CIL-only direct-source scraper

Built `scripts/scrape-cil-deals.ts` with core logic in `lib/scraper/cil-deal-scraper.ts` (shared between CLI and cron route).

### 5.1 Safeguards

- Hard reject: listings outside `CENTRAL_IL_CITIES` (case-insensitive match).
- Hard reject: website host in aggregator blocklist (Leafly, Weedmaps, iHeartJane, Dutchie).
- Polite: 2s delay between requests, User-Agent identifies PuffPrice.
- robots.txt checked once per host; disallow paths respected.
- 429 response → 1-hour domain cooldown.
- Max 30 listings per run.
- Default `--dry-run`; `--live` required for wire; `--apply` required to write.

### 5.2 Parser stages

1. `<script type="application/ld+json">` → Offer/Product extraction.
2. HTML text matched against 7 curated discount regex patterns (first-time %, veteran/senior %, themed days, BOGO, "XX% off <category>").
3. `<meta name="description">` mentioning discounts.

### 5.3 First live run results (2026-04-26)

| metric | value |
|---|---:|
| listings processed | 26 |
| deals found | 9 |
| deals inserted | 9 |
| deals updated | 0 |
| deals aged out (`not_seen_last_scrape`) | 2 |
| fetch errors | 0 |
| rate-limited hosts | 0 |

New deals by dispensary:

| listing | deals |
|---|---|
| `cookies-peoria-heights` | `25% off pre-rolls`, `First-time 25% off` |
| `share-springfield` | `Senior 10% off` |
| `noxx-east-peoria` | `20% off edibles`, `50% off vape` |
| `cookies-bloomington` | `First-time 25% off`, `MILITARY 20% off`, `20% off flower` |
| `ivy-hall-dispensary` | `Veterans 20% off` |

Aged out (2 Ivy Hall deals from the pre-scope-lockdown era): `30% off Savvy Flower — stackable up to 35%`, `First-time customer — 25% off first order`. Preserved in DB with `status_reason='not_seen_last_scrape'`; will be cleaned up by the Phase 7 deferred migration after day 7.

### 5.4 Current DB state

```
 source | status_reason              | count
--------+----------------------------+------
 website| scraped_direct_source      |     9
 website| not_seen_last_scrape       |     2
```

Total active Central IL deals: **11**.

---

## Phase 6 — Scheduled cron every 6 hours

### 6.1 Vercel Cron

Added to `vercel.json`:

```json
{ "path": "/api/cron/scrape-deals", "schedule": "0 */6 * * *" }
```

### 6.2 API route

`app/api/cron/scrape-deals/route.ts`:

- Auth: `Authorization: Bearer ${CRON_SECRET}` — rejects with 401 if secret missing or mismatch.
- Calls `runCilScrape({ mode: "live", apply: true, maxListings: 30 })`.
- Returns JSON summary with counts + errors.
- `maxDuration=300` (fits comfortably in default Vercel function budget; ~160s worst-case for 26 listings × 2s × 3 paths).
- Logs a compact summary for Vercel Logs.

### 6.3 CRON_SECRET value for Matthew to paste into Vercel

**`S0zVClH9eC9oHKJuHCxJFRUQk_8uYVA5YFDOmrug0UA`**

Paste into Vercel: Project settings → Environment Variables → `CRON_SECRET` (Production, Sensitive). The same secret is used by `mark-stale-deals` (already existing cron), so a single value covers both routes if that one is already using this value — otherwise add as new.

Until `CRON_SECRET` is added, `/api/cron/scrape-deals` returns 401 and no scraping happens. Manual runs continue to work via `npx tsx scripts/scrape-cil-deals.ts --live --apply`.

---

## Phase 7 — Deferred stale-deal cleanup migration

`sql/migrations/2026-04-26-stale-deal-cleanup.sql` — written but **not applied.** Eligible earliest **2026-05-03** (after at least one full week of scrape runs).

Deactivates deals where `status_reason='not_seen_last_scrape'` has been sticky for 72+ hours AND `verified_at` is also 72+ hours stale. Three-plus consecutive scrape misses → retire. Never deletes — `is_active=false` preserves the audit trail.

---

## Phase 8 — Final production smoke matrix

Ran after Vercel flipped Ready post-final-commit.

```
EXPECT 200:
  /                                       200
  /cannabis/illinois                      200
  /cannabis/illinois/peoria               200
  /cannabis/illinois/east-peoria          200
  /cannabis/illinois/springfield          200
  /cannabis/illinois/bloomington          200
  /cannabis/illinois/urbana               200
  /cannabis/illinois/peoria-heights       200
  /cannabis/illinois/normal               200
  /cannabis/illinois/champaign            200
  /l/cloud-9-east-peoria                  200
  /l/cookies-peoria-heights               200
  /sitemap.xml                            200  (CIL only)

EXPECT 404:
  /cannabis/illinois/chicago              404
  /l/consume-cannabis-champaign           404  (deactivated Phase 1.2)
  /l/ascend-springfield                   404  (deactivated Phase 1.3)

Content checks:
  homepage               : "11 active deals", labels read "Verified" / "Last checked" — no "Imported Apr 14"
  east-peoria FAQ        : "PuffPrice currently lists 3 dispensaries in East Peoria"
  springfield FAQ        : "PuffPrice currently lists 6 dispensaries in Springfield"
  peoria FAQ             : "PuffPrice currently lists 5 dispensaries in Peoria"
  bloomington/urbana/ph  : no "FEATURED SPOT AVAILABLE" markup
  sitemap                : 17 unique CIL /cannabis/illinois/* URLs, no Chicago/Aurora/Rockford
```

16 of 16 status codes match. All content assertions pass.

---

## Final numbers after the day's work

- **Active CIL listings:** 26 (28 -> 26, -2 from deactivation of `consume-cannabis-champaign` + `ascend-springfield`).
- **Active CIL deals:** 11 (53 -> 2 after aggregator/non-CIL lockdown -> 11 after first direct-source scrape: 9 fresh inserts + 2 aged Ivy Hall rows flagged `not_seen_last_scrape` but still visible).
- **Freshness labels:** every deal card now shows `Verified {Apr 24}`, `Last checked {date}`, or `Verification pending`. Zero "Imported Apr 14" labels remain.
- **FAQ counts:** every populated CIL city's FAQ matches the rendered grid count.
- **Featured Spot CTA:** deleted. Zero instances on any CIL city page.
- **Scheduled deal refresh:** cron wired to fire every 6 hours (needs `CRON_SECRET` in Vercel env to activate).

## What's deferred / needs a human

1. **Add `CRON_SECRET` to Vercel env** (Production, Sensitive). Value: `S0zVClH9eC9oHKJuHCxJFRUQk_8uYVA5YFDOmrug0UA`. Until added, the scraper only runs on manual invocation.
2. **Apply `sql/migrations/2026-04-26-stale-deal-cleanup.sql`** on or after 2026-05-03, after a full week of scrape runs has established a baseline.
3. **Create `cloud-9-champaign`** row — per Cowork research the address at `consume-cannabis-champaign` is Cloud9 Champaign. Needs a registry-subset migration following the April 25 pattern. Not tonight's scope.
4. **Regex pattern tuning** — first scraper run found 9 deals; several known direct-source dispensaries returned 0 (nuEra sites, Sunnyside, Ascend). Either they don't post deals on their websites in text form (they use JavaScript-heavy menus from Dutchie/iHeartJane), or our pattern set needs expansion. Worth another pass after a week of data.

## Rollbacks

None. All phases landed on the first try. Pre-existing TS errors in `HeroDealCard.tsx` and `scripts/backfill-*.ts` were noted but are not related to this session's changes.
