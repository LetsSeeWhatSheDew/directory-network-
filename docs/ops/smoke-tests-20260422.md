# Smoke tests — 2026-04-22

**Location:** `tests/smoke.mjs`
**Runner:** `npm run smoke` (native `node` + `fetch`, no deps)
**Default target:** `https://www.puffprice.com`
**Override:** `BASE=https://preview-abc.vercel.app npm run smoke`

## What's covered

1. Homepage loads and renders deal/hero indicators.
2. `/deals/flower` renders with deal data.
3. `/l/nuera-east-peoria` renders dispensary page.
4. `/upgrade` shows $0.99 pricing.
5. `/admin/submissions` correctly redirects unauthed users to
   `/admin-login` (307/308 with `location` header).
6. `sitemap.xml` is well-formed XML with ≥50 `<url>` entries.
7. `robots.txt` exists and does NOT disallow `/cannabis` or `/deal`.
8. `/cannabis/illinois` renders with a reasonable byte count.
9. Homepage freshness badge shows `Imported {date}` (Option C copy from
   `docs/handoffs/verified-at-strategy-20260422.md`) — fails if the
   entire feed still reads `Verification pending` (means the
   `verified_at` backfill migration hasn't landed yet).
10. Canonical tag on `/upgrade` points at `https://www.puffprice.com`
    (not the apex) — catches regressions of the SEO audit fix.

## Design choices

- **No framework.** Playwright would add ~200MB of browsers and a
  browser runtime to verify what is essentially string-matching on
  server-rendered HTML. A 150-line `node fetch()` script is the right
  size for this coverage. Upgrade to Playwright when the tests need
  real browser behavior (e.g., JS-only rendering, click flows).
- **Runs against prod by default.** These are smoke tests — they catch
  "deploy didn't make it" and "URL regression" issues, not unit bugs.
  Running against prod is the whole point. To verify a preview URL,
  set `BASE`.
- **Non-zero exit on failure.** `process.exit(1)` gates CI if we ever
  add `npm run smoke` to a deploy pipeline.

## How to run locally

```bash
npm run smoke

# Or against a preview deploy:
BASE=https://project-green-git-feature-X.vercel.app npm run smoke
```

## Known flakes

- **Test 9 (Imported badge)** depends on Matthew having applied
  `sql/migrations/2026-04-22-verified-at-backfill.sql` (Option C).
  Before that migration: every card shows `Verification pending` and
  this test fails. After: every card shows `Imported {date}` and it
  passes. If the test fails, check whether the migration has landed
  before chasing a code bug.
- **Network latency.** Each test has its own `fetch` — slow DNS or
  cold Vercel functions can add 1-2s. No retry logic; if a single test
  errors due to transient network, re-run.

## What's NOT covered yet

- Click-through flows (no JS runtime).
- Response headers beyond what's inline in each test.
- Specific deal IDs (the prod feed churns; we don't want the test to
  pin a specific id).
- `/deal/[id]` Offer schema validation (JSON-LD parsing deserves its
  own check — add when we have 3+ deal pages that shouldn't regress).
- API routes (`/api/deals/recommend`, `/api/deals/submit`) — skipped
  to keep this pure-server checks. Add when the API contract
  stabilizes.
- `/api/health` — no such endpoint exists today.

## When to add a new test

Any time a regression makes it to prod. The test cost is ~10 lines.
Prefer adding a smoke test over a postmortem recommendation.
