# Handoff — apply migration: deals.last_independent_verification

**Date:** 2026-04-30
**Author:** Code (demo-ready session)
**Action required:** Matthew to apply `sql/migrations/2026-04-30-deal-independent-verification.sql` via Supabase SQL Editor.
**Urgency:** before next 09:00 UTC cron, ideally within 24h.

## Why

The Phase 1 work tonight retired the homepage's 7-day featured-deal staleness gate. That gate was producing the "No featured deal today" empty state on days when the daily scraper couldn't independently re-confirm certain dispensaries. The retirement is paired with a new daily-verification sweep (`lib/scraper/dailyVerification.ts`) that runs after the scraper and:

- bumps `verified_at = NOW()` for active deals whose `last_independent_verification` is within 48 hours (treats them as still confirmed via continuity),
- holds the line for deals whose `last_independent_verification` is 48h–7 days old,
- deactivates deals whose `last_independent_verification` is more than 7 days old (we can't credibly say they're still running).

This sweep needs the new `last_independent_verification` column to function. Until the migration is applied, the sweep detects the missing column and skips with `{skipped: true, reason: "last_independent_verification column not present (migration pending)"}` — no crashes, no false bumps, no false deactivations. The scraper's primary flow continues to work exactly as before.

But the durable fix only kicks in once the migration is applied.

## What the migration does

1. Adds `deals.last_independent_verification timestamptz` (nullable).
2. Backfills `last_independent_verification = COALESCE(verified_at, created_at)` for every existing row (the scraper has been the only writer of `verified_at` until now, so the two are equivalent for existing rows).
3. Adds an index `idx_deals_active_last_indep_verif` to make the cron's post-pass query fast.
4. Rebuilds `active_deals_with_listings` to project `last_independent_verification` (existing column list preserved, just one new field added).

## How to apply

```sql
-- In Supabase SQL Editor (project ref hnbjufmtmrhexmdrfubw):
\i sql/migrations/2026-04-30-deal-independent-verification.sql
```

Or paste the contents of that file directly into the SQL Editor.

## Verification queries

After apply, run the queries at the bottom of the migration file. Expected:

- (a) `populated == total` (every green deal has a last_independent_verification).
- (b) The view's column list now includes `last_independent_verification`.

## After Matthew applies

The next Vercel cron run (09:00 UTC daily) will trigger the post-scrape sweep. The summary line in the cron's response payload will include a `verification` object with `bumped` / `held` / `deactivated` / `skipped: false`.

If you want immediate effect (instead of waiting for 09:00 UTC), run:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.puffprice.com/api/cron/scrape-deals
```

The response should include the `verification` object now populated.

## Rollback

If something goes wrong:

```sql
BEGIN;
DROP INDEX IF EXISTS public.idx_deals_active_last_indep_verif;
ALTER TABLE public.deals DROP COLUMN IF EXISTS last_independent_verification;
-- And re-run sql/migrations/2026-04-22-add-verified-at-to-view.sql to restore
-- the old view definition.
COMMIT;
```

The Code-side scraper and sweep both detect the missing column and degrade — they won't crash if the column disappears.
