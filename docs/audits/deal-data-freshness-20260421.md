# Deal Data Freshness Audit — 2026-04-21

**Author:** Cowork
**Question:** "When was the last time we did a full scrape of sales/discount data for all dispensaries?"
**Verdict:** **EXPIRED-LEANING / SINGLE STATIC IMPORT.** No scraper exists. The entire active deal set is one manual import from 2026-04-14 (seven days ago). Three deals are demonstrably stale on the page right now. Fifty-three more have no expiration set and will silently rot until somebody touches them.

This is a trust hazard. The site says "deal intelligence" — what it actually has is a one-time snapshot of a third-party menu cache.

---

## Headline numbers

| Metric | Value |
|---|---|
| Total deals in table | 100 |
| Active (`is_active = true`) | 56 |
| Inactive (`is_active = false`) | 44 |
| Distinct dispensaries with active deals | 21 of 82 (26%) |
| Dispensaries with **zero** active deals | 61 of 82 (74%) |
| Distinct days deals were created | **1** (2026-04-14) |
| Distinct days deals were updated | **1** (2026-04-14) |
| Active deals never touched after creation | **56 of 56 (100%)** |
| Active deals with `verified_at` set | **0 of 56 (0%)** |
| Active deals with `expires_at` populated | 3 of 56 (5%) |
| Active deals with `expires_at` in the past | 3 of 56 (5%) — **all three are 4/20 specials, expired ~13.5h ago, still showing** |
| Active deals with `expires_at = NULL` | 53 of 56 (95%) |
| Active deals with `source_url` | 56 of 56 (100%) |
| Source mix (active) | leafly 33, weedmaps 13, website 10 |

---

## Age distribution

All 56 active deals were created between `2026-04-14 15:05:53 UTC` and `2026-04-14 19:43:47 UTC` — a single ~4.5h import window.

| Age bucket | Active deals |
|---|---|
| 0–7 days | 55 |
| 7–30 days | 1 |
| 30–90 days | 0 |
| 90+ days | 0 |

The "7–30 days" outlier is the same import — it crosses the 7-day boundary by hours because `NOW()` is 2026-04-21 18:38 UTC and the earliest import row is 2026-04-14 15:05 UTC, so `NOW() - 7 days` falls between the first and second batch of inserts that day. It is the same scrape.

The 44 inactive deals were all created on `2026-04-14` and all updated on `2026-04-15 14:56:56` — i.e., a single dedup or cleanup pass ran 24 hours after import and deactivated those 44 rows. After that, nothing has touched the table.

---

## Per-dispensary distribution (active only)

21 dispensaries have active deals. Top concentration:

| Dispensary | Active deals |
|---|---|
| altius-dispensary-carol-stream | 6 |
| nuera-east-peoria | 6 |
| nuera-aurora | 4 |
| nuera-champaign | 4 |
| seven-point-danville | 4 |
| star-buds-westmont | 4 |
| zen-leaf-naperville | 4 |
| natures-treatment-galesburg | 3 |
| prairie-cannabis-naperville | 3 |
| terrace-cannabis-moline | 3 |
| (11 others with 1–2 each) | — |

**74% of dispensaries (61 of 82) have zero active deals.** Their listing pages render with no deal context. This is a coverage problem, not just a freshness problem.

---

## The smoking gun: 4/20 specials

Three deals are titled `4/20 SPECIAL: …` with `expires_at = 2026-04-21 04:59 UTC` (i.e., end of 4/20 in Central Time). At query time (`2026-04-21 18:38 UTC`), they had been expired for **13h 38m** — and were still flagged `is_active = true`. They are still on the live site right now.

| listing_slug | title | expires_at | hours expired |
|---|---|---|---|
| nuera-east-peoria | 4/20 SPECIAL: 30% off everything April 20 | 2026-04-21 04:59 UTC | 13.6 |
| altius-dispensary-carol-stream | 4/20 SPECIAL: 25% off storewide | 2026-04-21 04:59 UTC | 13.6 |
| star-buds-westmont | 4/20 SPECIAL: 5 for $100 flower deal | 2026-04-21 04:59 UTC | 13.6 |

These are the only three deals in the active set with a real `expires_at`. They prove the site has zero automated expiration enforcement.

---

## Estimated stale share

This requires an assumption about how long a third-party-menu-scraped promo stays valid before it's likely changed. I'll use a 7-day half-life — promos at Illinois dispensaries rotate roughly weekly to weekly-and-a-half.

| Bucket | Active deals | Stale-likelihood |
|---|---|---|
| Confirmed stale (`expires_at` in the past) | 3 | 100% |
| Unknown expiration, ≥7 days old | 53 | ~50% (conservative) — closer to 70% if you assume weekly rotation cycles, since the import is now in its second weekly cycle |
| **Estimated stale total** | **30 of 56 (~54%)** | mid estimate |

Range: low ~30%, mid ~54%, high ~75%. The honest answer is **at least one in three of every "current deal" we show is no longer actually being honored.**

---

## Verification status

`verified_at` is null for all 56 active deals. Nobody has ever clicked a "I verified this is real" button (or run a process that sets it). If the column exists for human or automated verification, neither has been wired up.

---

## What's in the code

Repo grep for `scrape | fetch.*menu | cron | scheduled` across `app/`, `lib/`, `scripts/`, all `*.{ts,tsx,js,jsx,mjs}`:

- `lib/weeklyDigest.ts:3` — comment mentions "the digest cron" (consumer email digest, not a scrape).
- `app/deals/[category]/page.tsx:68` — comment about "missed scheduled job" (defensive UI for empty state).
- `app/terms/page.tsx:83` — Terms of Service "don't scrape us" copy (irrelevant to inbound scraping).

`ls scripts/` returns three files: `backfill-logos-google-places.ts`, `compute-ppg-from-anchors.ts`, `seed-dispensaries.mjs`. None scrape deals.

`ls app/api/` shows `admin/`, `admin-auth/`, `alerts/`, `claim/`, `deals/`, `digest/`, `dispensary/`, `index/`, `leads/`, `listings/`, `location/`, `price-history/`, `stripe/`. No `cron/` directory. No `scrape/` directory. `app/api/deals/` contains `recommend/` and `submit/` — no fetch.

There is no `vercel.json` with a `crons` block.

**Conclusion: there is no scraper, there is no cron, there is no human-verification UI. The 56 deals were imported once on 2026-04-14, dedup-cleaned on 2026-04-15, and have been running on inertia ever since.**

---

## Implications for product positioning

The homepage and brand promise this as "deal intelligence." Right now it is a one-time scrape of three sources (Leafly, Weedmaps, dispensary websites) of 21 of 82 dispensaries, taken seven days ago, with one demonstrated stale-deal class on the page (the 4/20 specials).

A user in a parking lot in Carol Stream right now who sees "Altius — 25% off storewide for 4/20" and drives there will be told "that ended yesterday." That is the failure mode the site exists to prevent.

**Recommended messaging stance until a scraper ships:**
- Drop "intelligence" framing where it implies real-time monitoring.
- Add a "Last verified" timestamp on every deal card (when `verified_at IS NOT NULL`) and a "Unverified — based on most recent menu snapshot" hint when null.
- The stale-deal job (Task 2) is **urgent**, not standard hygiene. Ship the schema this week and run it daily until the scraper exists.

---

## What a scraper would have to look like

This is a recommendation, not a build plan — flagged for Matthew's roadmap call.

**Path A — Direct menu scrapers per dispensary website.** Highest fidelity, slowest to build. Each chain has a different menu engine (Dutchie, Jane, iHeart Jane, Treez, Cova, custom). Realistic effort: 2–3 weeks for the four most common engines covering ~80% of IL dispensaries; ongoing maintenance as engines change markup.

**Path B — Leafly + Weedmaps scrapers.** Lower fidelity (those sites already lag the source by hours-to-days, and they aggressively cache and fingerprint scrapers), but covers most of IL in two scrapers instead of dozens. Realistic effort: 3–5 days for v1 + ongoing fingerprint-defeat work. Risk: ToS violations on both platforms; legal posture needs review.

**Path C — Dispensary-submitted via /deals/submit form** (already shipped by Code in this afternoon's push). Zero scraping risk, but depends on dispensary participation. Slow to ramp without outreach. Useful as the long-term canonical source once submission UX lands volume.

**Recommended sequence:**
1. **Week 1 (now):** Ship the stale-deal job (Task 2 in this session) so the 53 unknown-expiration rows don't sit forever. Surface "Last verified" UI honestly.
2. **Weeks 1–2:** Re-run the manual 2026-04-14 import process now and weekly thereafter, on a Monday morning calendar reminder, until automation lands. Cheap. Buys credibility.
3. **Weeks 2–4:** Build Path B (Leafly + Weedmaps scrapers) behind a daily cron. Treat as the primary source until Path A lands. Confirm legal posture before deploying.
4. **Months 2–3:** Build Path A scrapers chain-by-chain, starting with the four engines (Dutchie, Jane, iHeart Jane, Treez) that cover the majority of IL.
5. **Months 1–6:** Drive Path C submissions via the operator outreach Cowork is already drafting, so dispensaries push their own deals to us. Eventually this should be the canonical source.

---

## Stack of follow-on actions

For Matthew:
- Decide whether to soften the "intelligence" framing in the homepage hero until automation exists.
- Decide which of Path A/B/C is the priority for the next two weeks.
- Decide whether to manually re-import this week (low effort, high credibility) before the scraper ships.

For Code (handoff docs in this same session):
- Build the daily stale-deal job per `docs/handoffs/stale-deal-job-spec-20260421.md`.
- Render "Last verified" / "Unverified — most recent menu snapshot" cues on deal cards (spec to be added in next Cowork session — flagging here so it's not lost).

For Cowork (next session):
- Author the manual re-import script that re-runs whatever produced the 2026-04-14 batch. Find that script (Bash history? Granola? Past commits?) and document the procedure so it's repeatable on a calendar.
- Spec out the "Last verified" UI surface for Code.

---

## Appendix — exact queries used

```sql
-- Total / active / inactive
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_active IS TRUE) AS active,
  COUNT(*) FILTER (WHERE is_active IS FALSE) AS inactive,
  COUNT(*) FILTER (WHERE is_active IS NULL) AS null_active
FROM public.deals;

-- Date range and update history
SELECT MIN(created_at), MAX(created_at),
       MIN(updated_at), MAX(updated_at),
       MIN(verified_at), MAX(verified_at),
       COUNT(verified_at) AS verified_count,
       COUNT(DISTINCT DATE(created_at)) AS distinct_create_days,
       COUNT(DISTINCT DATE(updated_at)) AS distinct_update_days
FROM public.deals
WHERE is_active IS TRUE;

-- Age distribution
SELECT CASE
  WHEN created_at >= NOW() - INTERVAL '7 days' THEN '0-7 days'
  WHEN created_at >= NOW() - INTERVAL '30 days' THEN '7-30 days'
  WHEN created_at >= NOW() - INTERVAL '90 days' THEN '30-90 days'
  ELSE '90+ days'
END AS age_bucket, COUNT(*)
FROM public.deals WHERE is_active IS TRUE GROUP BY 1;

-- Expiration / source coverage
SELECT
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active IS TRUE) AS expired_still_active,
  COUNT(*) FILTER (WHERE expires_at IS NULL AND is_active IS TRUE) AS no_expiration_active,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at >= NOW() AND is_active IS TRUE) AS valid_active,
  COUNT(*) FILTER (WHERE source_url IS NOT NULL AND is_active IS TRUE) AS with_source_url,
  COUNT(*) FILTER (WHERE source_url IS NULL AND is_active IS TRUE) AS without_source_url
FROM public.deals;

-- Per-dispensary deal counts
SELECT listing_slug, COUNT(*) FROM public.deals
WHERE is_active IS TRUE GROUP BY listing_slug ORDER BY 2 DESC;

-- Coverage gap
SELECT
  (SELECT COUNT(*) FROM public.master_listings WHERE project_tag='green') AS total_dispensaries_green,
  (SELECT COUNT(*) FROM public.deals WHERE is_active IS TRUE) AS active_deals,
  (SELECT COUNT(DISTINCT listing_slug) FROM public.deals WHERE is_active IS TRUE) AS dispensaries_with_deals;

-- Smoking gun
SELECT id, listing_slug, title, expires_at, NOW() - expires_at AS how_long_expired
FROM public.deals
WHERE is_active IS TRUE AND expires_at IS NOT NULL AND expires_at < NOW()
ORDER BY expires_at;
```
