# Handoff — Daily stale-deal job

**From:** Cowork
**To:** Code
**Date:** 2026-04-21
**Pairs with:**
- `sql/migrations/2026-04-21-deal-staleness.sql` (NOT YET APPLIED)
- `sql/queries/mark-stale-deals.sql`
- `docs/audits/deal-data-freshness-20260421.md` (the why)

## Why

Three deals in production right now expired 13+ hours ago and are still rendering. Fifty-three more have no `expires_at` set and will silently rot until somebody touches them. The audit doc has the full picture. Until a scraper exists, the daily stale-deal job is the only thing standing between the user and a deal that ended last week.

## What you're building

A serverless cron handler at `/api/cron/mark-stale-deals` that runs the SQL in `sql/queries/mark-stale-deals.sql` once per day, logs the result, and emits an alert if the result looks anomalous.

## Schema dependency

Apply `sql/migrations/2026-04-21-deal-staleness.sql` first. It adds:
- `deals.status_reason text NULL` — categorizes deactivations (`expired`, `stale`, `dispensary_closed`, `manual`, `duplicate`).
- Two partial indexes on active rows for the WHERE clauses the job uses.

Naming note (read before you wire anything up): the original task brief mentioned `status` and `end_date` and `last_verified_at` columns. The live schema has `is_active boolean`, `expires_at timestamptz`, and `verified_at timestamptz`. The migration sticks with the existing names — `is_active = false` is the deactivation, `verified_at` is reused as "last time we looked." No new `last_verified_at` column.

## Cron config

Vercel Cron in `vercel.json` (create the file if it doesn't exist):

```json
{
  "crons": [
    {
      "path": "/api/cron/mark-stale-deals",
      "schedule": "0 4 * * *"
    }
  ]
}
```

`0 4 * * *` = 04:00 UTC daily = 23:00 Central previous day = 22:00 Central in summer. Pre-dawn for the whole US, including Illinois. Far enough from midnight in any timezone to clear out anything that expired the previous calendar day.

## Auth

Vercel Cron sends an `Authorization: Bearer ${CRON_SECRET}` header. Add `CRON_SECRET` to Vercel env vars. Reject any request without the matching header — don't expose this endpoint to the open internet.

```ts
// app/api/cron/mark-stale-deals/route.ts (sketch)
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('unauthorized', { status: 401 });
  }
  // …run the SQL, return summary JSON
}
```

## What to log

Log structured JSON (not free-text) so we can grep Vercel logs later:

```json
{
  "job": "mark-stale-deals",
  "ran_at": "2026-04-22T04:00:01Z",
  "newly_expired": 3,
  "newly_stale": 0,
  "remaining_active": 53,
  "duration_ms": 184
}
```

Send to Sentry as a breadcrumb (info level), not an event, on success.

## What to alert on

Three failure modes worth waking somebody up for:

1. **The job errored** — Sentry exception, normal handling. Vercel will also email on cron failure if you enable that on the cron tab.
2. **`newly_expired + newly_stale > 10` in a single run.** Either a scraper just landed a big import that surfaced a backlog (good), or a column got NULL'd somewhere (bad). Flag for human review. **Draft only — do not actually wire the email send until Matthew confirms which inbox sends it.** Spec for the eventual alert:
   - Subject: `[PuffPrice] Stale-deal job deactivated N deals`
   - Body: counts by status_reason, plus the top 10 deactivated `listing_slug`s.
   - To: Matthew's address from `lib/brand.ts` config.
3. **`remaining_active == 0`.** We just emptied the active set. Almost certainly a regression. Page hard.

Until alert wiring is in, just log loudly enough that the next person to look at Vercel logs sees it.

## Failure modes to think through

- **Query takes too long.** Deals table has 100 rows today, a few thousand at scale. The new partial indexes mean both UPDATEs scan a tiny working set. Worst case a year from now: <10k active rows. No timeout risk for the foreseeable future. If we ever hit `statement_timeout`, batch by `id` ranges.
- **Cron runs twice in the same day.** Idempotent by construction — both UPDATEs filter `is_active IS TRUE`, so the second run is a no-op. The summary query will report zero rows changed on the rerun.
- **No deals match.** Normal. Return the summary with zeros and exit 200. Don't treat empty as failure.
- **Cron didn't run at all.** Vercel Cron skips runs if a previous invocation is still live. Add a "last successful run" check on the homepage admin (out of scope for this handoff — file under follow-up).
- **A deal expired this morning between the cron run and the user reading the page.** Acceptable — within 24h SLA. If we want stricter freshness later, a second run at 16:00 UTC catches East Coast lunch deals that expired overnight.
- **The 30-day stale threshold is too aggressive / too lax.** It's a literal in the SQL. Tweaking is a one-line change. Revisit when scraper evidence exists.

## After the job runs — refresh the rankings view

The `top-5-percent` materialized view (Task 3 / `sql/migrations/2026-04-21-deal-ranking.sql`) needs to be refreshed after the staleness pass so badges drop off newly-deactivated deals on the next page render. In the same handler, after the staleness UPDATEs:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.deal_rankings;
```

(Reference query: `sql/queries/refresh-deal-rankings.sql`. The CONCURRENTLY variant requires a unique index on the view — see that migration.)

If the rankings migration hasn't shipped when you wire the cron, this call will error — wrap it in a try/catch that swallows "relation does not exist" and logs a warning, so the staleness pass can ship independently.

## Acceptance

- Migration applied; `\d public.deals` shows `status_reason` column and both indexes.
- `/api/cron/mark-stale-deals` returns 401 without bearer, 200 with bearer, JSON summary in body.
- Vercel Cron config registered; first run visible in Vercel dashboard.
- Within 24h of merge, the three stale 4/20 specials flip to `is_active = false` with `status_reason = 'expired'`.
- Vercel logs show one structured info line per run.

## Out of scope (next handoff)

- "Last verified" UI on deal cards (read `verified_at`, render relative time, fall back to "Snapshot from {created_at}" when null).
- A second daily run at 16:00 UTC for tighter SLA (single-line cron change).
- Email alert wiring once Matthew confirms the sending inbox.
- Admin dashboard surface for "last cron run + result."
