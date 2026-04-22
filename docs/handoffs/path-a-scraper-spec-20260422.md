# Path A — Leafly per-dispensary deals scraper — Spec

**Owner:** Code (next sprint)
**Status:** Spec only — do NOT build until Matthew greenlights spending dev time on this vs. Path C dispensary outreach.
**Pairs with:** `docs/audits/deal-freshness-v2-20260422.md` (the case for needing it), `sql/migrations/2026-04-21-deal-submissions.sql` (the table this writes into).

---

## Purpose

Convert the long tail of `0-active-deal` IL listings (46 dispensaries today, 75% of the directory) into populated listing pages by automatically scraping Leafly's per-dispensary deals page once a day. Output writes to `deal_submissions` — exactly the same table the Path C consumer/dispensary submission flow uses — so admin review and approval logic is already in place.

## Why Leafly first

| Source | Coverage | Markup consistency | Robots/legal | Verdict |
|---|---|---|---|---|
| **Leafly** | ~80% of IL adult-use dispensaries | High — uniform `/dispensary-info/{slug}` page structure | `robots.txt` allows `/dispensary-info/*`; deals page has no auth wall | **Start here** |
| Weedmaps  | ~70% IL coverage | Medium — heavy SPA, rendered via React; would need Playwright | TOS forbids scraping; Cloudflare-fingerprinted | Skip |
| Dutchie   | ~30% IL coverage | High but tightly scoped per dispensary | TOS friendlier but coverage is thin | Phase 2 |
| Dispensary's own site | varies wildly | Low — each one is a custom CMS | n/a (different per site) | Phase 3 + only for Tier 1 |

## High-level architecture

```
┌──────────────────────────┐
│ Daily cron (Vercel Cron) │
│ 03:30 America/Chicago    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ /api/scrape/leafly  (route handler)  │
│  - reads master_listings (IL/green)  │
│  - calls scraper for each            │
│  - 1 req per dispensary / day        │
│  - dedup vs deal_submissions (7 days)│
│  - writes new submissions            │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────┐
│ deal_submissions table   │
│  submitter_email=        │
│   scraper@puffprice.com  │
│  submitter_role='auto'   │
│  approved=false          │
└────────────┬─────────────┘
             │  (existing admin flow)
             ▼
┌──────────────────────────┐
│ /admin/submissions       │
│  Matthew approves → row  │
│  is promoted to deals    │
└──────────────────────────┘
```

## Endpoint shape

`/api/scrape/leafly/route.ts` — runs as a Vercel Cron job, optionally callable manually with `?slug=ivy-hall-waukegan` for one-off testing.

```
GET /api/scrape/leafly                    → all IL dispensaries
GET /api/scrape/leafly?slug=<slug>        → single dispensary, useful for debugging
GET /api/scrape/leafly?dryRun=true        → don't write submissions, just log what would be inserted
```

Auth: protected by `process.env.CRON_SECRET` matching `request.headers.get('authorization') === 'Bearer ${CRON_SECRET}'`. Vercel Cron sets this automatically when configured in `vercel.json`.

## Mapping master_listings → Leafly URL

Leafly's URL format is consistent: `https://www.leafly.com/dispensary-info/{leafly-slug}/deals`.

The Leafly slug is **not** identical to PuffPrice's `master_listings.slug`. We need a lookup column. Options:

1. **Add `master_listings.leafly_slug`** (preferred). Code task: `ALTER TABLE master_listings ADD COLUMN leafly_slug text`. Backfill manually for the IL set (~67 rows) using a quick SQL script. Use NULL to mean "skip this dispensary."
2. Heuristic from `name` + `city` — fragile, especially for multi-location chains (Ivy Hall has 8 locations on Leafly with similar slugs).

**Recommendation:** add the column. One-time backfill is ~30 min of manual work. Without it the scraper would 404 for half the dispensaries and we'd burn rate-limit budget on misses.

Migration to ship before scraper rolls out:

```sql
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS leafly_slug text;
COMMENT ON COLUMN public.master_listings.leafly_slug IS
  'Leafly URL slug for /dispensary-info/{slug}/deals. NULL = do not scrape.';
```

## HTTP behavior

- **User agent rotation:** pool of 5 modern desktop UAs, randomly chosen per request:
  ```
  Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4) AppleWebKit/605.1.15 ...
  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...
  Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ...
  Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4) AppleWebKit/605.1.15 (KHTML) Version/17.4 Safari/605.1.15
  Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/126.0
  ```
- **Rate limit:** 1 request per dispensary per cron run. Cron runs once a day. Each run hits ≤67 Leafly URLs total. Inter-request pause: random 800–2000ms (`setTimeout`). Total run time: ~2 minutes.
- **Retry policy:**
  - HTTP 200 → parse and continue.
  - HTTP 404 → log "leafly slug stale" and continue (don't retry — page is gone).
  - HTTP 429 → exponential backoff: wait 30s, 60s, 120s, then bail on this dispensary for the day.
  - HTTP 5xx → 1 retry after 5s, then bail.
- **Concurrency:** strictly serial. No `Promise.all` over dispensaries — Leafly will rate-limit a parallel burst.

## Extraction schema

For each deal block on the Leafly page:

| Field | Required | Source on Leafly DOM | Notes |
|---|---|---|---|
| `title`                | yes | `[data-testid="deal-title"]` (current selector) | Truncate at 100 chars |
| `description`          | no  | `[data-testid="deal-description"]` | First 500 chars |
| `category`             | no  | parsed from title: regex for "flower", "vape", "edible", "concentrate", "preroll", "tincture" → fallback `'all'` |
| `weight_grams`         | no  | regex `(\d+(?:\.\d+)?)\s*g\b` against title+description → null if not present |
| `mg_thc`               | no  | regex `(\d+)\s*mg(?:\s+thc)?` → null if not present |
| `regular_price_usd`    | no  | strikethrough price; selector `.price-original` |
| `sale_price_usd`       | no  | active price; selector `.price-current` |
| `expires_at`           | no  | "Ends MM/DD" text in the deal card → parse to ISO |
| `source_url`           | yes | the deals page URL itself |
| `dispensary_slug`      | yes | the PuffPrice `master_listings.slug` (FK target) |
| `submitter_email`      | yes | hardcoded `'scraper@puffprice.com'` |
| `submitter_role`       | yes | hardcoded `'auto'` |
| `verified_method`      | yes | hardcoded `'leafly_scraper_v1'` |

The selectors above are hypotheses based on Leafly's current public markup; **Code should verify with curl+grep against 2-3 live Leafly dispensary pages before locking the parser.**

## Dedup logic

Before inserting, query:

```sql
SELECT 1 FROM deal_submissions
WHERE dispensary_slug = $1
  AND deal_title = $2
  AND COALESCE(sale_price_usd, -1) = COALESCE($3, -1)
  AND submitted_at >= now() - interval '7 days'
LIMIT 1;
```

If a row exists, skip. Otherwise insert. This handles Leafly's tendency to leave a deal up for weeks — we don't want a duplicate submission every day.

## Error handling

- Wrap every per-dispensary block in try/catch. Failures don't kill the whole run.
- Log to console (Vercel captures stdout). Future enhancement: write to a `scraper_runs` table for observability.
- One scraper failure for one dispensary on one day = OK. The next day's run will catch it.

## Budget / output expectations

| Metric | Estimate |
|---|---|
| Dispensaries scraped per run | ~50 (those with `leafly_slug` set) |
| Average deals per dispensary on Leafly | 2-4 |
| New submissions per run (after dedup) | 2-8 |
| Submissions per week (at 1 run/day) | 14-56 |
| Submissions per month | 60-240 |

This is **far** below the Tier 1 sales playbook's 15-dispensary submission target (~3 deals each = ~45 submissions over 30 days), so the scraper is largely additive volume from the long tail rather than head competition.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Leafly DOM changes break selector | Medium | All scraping silently returns 0 deals | Alarm: alert if a run produces zero submissions across all 50 dispensaries |
| Leafly bans the scraper IP | Low | Scraping stops | Vercel Cron uses Vercel's IPs; rate limit is conservative; UA rotation in place |
| Leafly TOS challenge | Low | Cease & desist | Public deals page; not bypassing auth or paywall; UA isn't impersonating Googlebot. Still — if we get a C&D, we shut it off and pivot to direct dispensary submissions |
| Bad deal data ends up in production | Medium | User sees wrong deal | All scraper output lands in `deal_submissions` (not `deals` directly). Matthew approves before promotion to live. |
| Duplicate floods after Leafly UI changes | Low | DB bloat | The 7-day dedup window is keyed on (slug, title, sale_price); add a hard cap of 50 submissions/dispensary/day as a circuit breaker |

## Cron setup

`vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/scrape/leafly",
      "schedule": "30 8 * * *"
    }
  ]
}
```

`30 8 * * *` UTC = 03:30 America/Chicago (CDT). Off-peak for Leafly.

## Files Code will need to create

- `app/api/scrape/leafly/route.ts` — handler
- `lib/scrapers/leafly.ts` — page fetcher + parser
- `lib/scrapers/dedup.ts` — shared dedup helper for any future scraper
- `sql/migrations/YYYY-MM-DD-add-leafly-slug.sql` — adds `leafly_slug` column
- one-off backfill SQL or admin script populating `leafly_slug` for the existing IL set
- update `vercel.json` with the cron entry

## Out of scope for v1

- Leafly menu scraping (just deals)
- Image extraction
- Deal stacking detection
- Multi-state expansion (IL only)
- Real-time scraping on listing-page request (always batch via cron)
- Submitting back to Leafly (we're consumers only)

## Pre-launch checklist

- [ ] `leafly_slug` column added to `master_listings`
- [ ] At least 30 of the 67 IL listings have `leafly_slug` populated
- [ ] One manual run with `?slug=ivy-hall-waukegan&dryRun=true` confirms parser
- [ ] One manual run with `?dryRun=true` (all dispensaries) shows expected submission count
- [ ] One real run; review the resulting `deal_submissions` rows in `/admin/submissions`
- [ ] Cron entry in `vercel.json` deployed
- [ ] After 1 week of cron runs, audit submission count vs. estimate above
