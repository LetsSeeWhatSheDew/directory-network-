# Daily deal scrapers

Pulls daily specials from the top 10 Central IL dispensaries and
upserts them into the `deals` table. The scraper is platform-aware:
adapters target Dutchie, Leafly, and iHeartJane embedded menus, plus
a generic adapter for hand-configured selectors.

## What's where

```
scripts/scrapers/
  index.ts                  Orchestrator entry point
  detect-platforms.ts       One-time site detection
  dispensaries.json         Source of truth: which sites + which adapter
  types.ts                  Shared types
  ingest.ts                 Normalize → upsert → soft-delete stale
  regex.ts                  title → discount_pct / recurring_days
  http.ts                   Shared User-Agent + timeout + rate limit
  adapters/
    dutchie.ts
    leafly.ts
    iheartjane.ts
    generic.ts
  __tests__/
    regex.test.ts
    ingest.test.ts
```

## Local run

Requires Node 20+, `tsx`, and the same Supabase env vars production
uses.

```sh
# 1. Pull env locally
vercel env pull .env.local

# 2. Detect platforms (one-time setup; writes dispensaries.json)
npm run scrape:detect

# 3. Dry-run a single dispensary (no DB writes; just logs)
npm run scrape -- --dispensary=cookies-peoria-heights --dry-run

# 4. Run a single dispensary against Supabase
npm run scrape -- --dispensary=cookies-peoria-heights

# 5. Run all 10
npm run scrape

# 6. Tests
npm run test:scrapers
```

`SUPABASE_SERVICE_ROLE_KEY` is required for any non-dry-run invocation.
The orchestrator inserts a row into `scraper_runs` at the start of every
run and updates it with results at the end.

## Adding a dispensary

1. Add a row to `scripts/scrapers/dispensaries.json`:
   ```json
   {
     "slug": "new-dispensary-peoria",
     "name": "New Dispensary Peoria",
     "city": "Peoria",
     "platform": "dutchie",
     "menu_url": "https://dutchie.com/embedded-menu/new-dispensary-peoria/specials",
     "deals_url": "https://newdispensary.com/deals",
     "selectors": null
   }
   ```

2. For `platform: "generic"`, also fill in `selectors`:
   ```json
   {
     "platform": "generic",
     "selectors": {
       "deal_card": ".deal-item",
       "title": ".deal-title",
       "description": ".deal-desc",
       "original_price": ".price-original",
       "sale_price": ".price-sale"
     }
   }
   ```

3. Test in dry-run mode first:
   ```sh
   npm run scrape -- --dispensary=new-dispensary-peoria --dry-run
   ```

4. Push to `main`. Daily cron picks it up at 9am UTC.

## Debugging failures

The fastest path:

1. Open `/admin/scrapers` — find the failed row, expand the error.
2. Re-run that one dispensary locally:
   ```sh
   npm run scrape -- --dispensary=<slug> --dry-run
   ```
3. Common failure modes:
   - **`platform_blocked: 403/503`** — Cloudflare or WAF is challenging
     the request. Document and skip; we don't bypass anti-bot.
   - **`platform_unsupported: __INITIAL_STATE__ not found`** —
     iHeartJane changed their bootstrap shape. Update the regex in
     `adapters/iheartjane.ts`.
   - **`fetch timeout after 30000ms`** — site is slow or down.
     Re-run later; cron will retry tomorrow.
   - **Zero deals returned, no error** — selectors stopped matching.
     Inspect the live HTML and update the adapter selectors. The
     orchestrator records this as `status="success"` with
     `deals_added=0`, so the row is visible in `/admin/scrapers`.

## What this DOES NOT do

- Headless browsers — HTTP + HTML only. JavaScript-rendered pages with
  no server-side payload return zero deals; that's a known limitation.
- Captcha bypass — we honor any 403/503 challenge response and surface
  it to `/admin/scrapers`.
- Menu / product / review scraping — DEALS ONLY.
- Soft-delete on failure — if a dispensary's scrape errors out, its
  existing deals are left active. Stale data is safer than empty data.

## Secrets setup (one-time)

Add these to GitHub repo Secrets (Settings → Secrets and variables →
Actions → New repository secret):

- `NEXT_PUBLIC_SUPABASE_URL` — same value as Vercel env
- `SUPABASE_SERVICE_ROLE_KEY` — same value as Vercel env (Sensitive)

Once set, GitHub Actions runs `npm run scrape` daily at 09:00 UTC
(03:00 / 04:00 Central depending on DST). Trigger manually any time
via the **Actions → Daily deal scrape → Run workflow** button.
