# Cron setup — daily stale-deal sweep (2026-04-22)

**Endpoint:** `app/api/cron/mark-stale-deals/route.ts`
**Schedule:** `0 4 * * *` UTC (23:00 America/Chicago, off-peak)
**Source of truth:** `vercel.json` in repo root

## What it does

1. Flips active deals with `expires_at < NOW()` to
   `is_active=false, status_reason='expired'`.
2. Flips active deals without `expires_at` and `created_at` older than
   30 days to `is_active=false, status_reason='stale'`.
3. Attempts to `REFRESH MATERIALIZED VIEW deal_rankings` (no-op if the
   view hasn't been materialized).
4. If `expired + stale > 10`, sends a Resend email to
   `matthew@jacarandapeoria.com` (override with `STALE_ALERT_RECIPIENT`).
5. Returns a JSON summary with counts + duration.

## Auth

The route rejects any request missing `Authorization: Bearer $CRON_SECRET`.
Vercel Cron sets this header automatically when the entry is defined in
`vercel.json` and `CRON_SECRET` is set in the Vercel environment.

If `CRON_SECRET` is not set, every cron run returns 401 and silently does
nothing — fail-safe.

## Matthew's one-time setup

In a terminal with the Vercel CLI linked to the project:

```bash
# Generate a strong random secret.
openssl rand -hex 32
# Paste the hex value as CRON_SECRET in Vercel → Project → Settings →
# Environment Variables → Production + Preview + Development.
```

Or paste via the dashboard. No local `.env.local` entry needed unless
you want to test the endpoint from your laptop (see manual test below).

## Manual test

After `CRON_SECRET` lands in Vercel prod:

```bash
# Pull the prod env values locally
vercel env pull .env.local

# Source the secret into the shell
export $(grep CRON_SECRET .env.local)

# Hit the live endpoint
curl -sS \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://www.puffprice.com/api/cron/mark-stale-deals \
  | jq .
```

Expected response shape:

```json
{
  "expired_count": 0,
  "stale_count": 0,
  "active_remaining": 46,
  "ran_at": "2026-04-22T04:00:00.000Z",
  "duration_ms": 120,
  "rankings_refreshed": true
}
```

A 401 means `CRON_SECRET` isn't set in Vercel or doesn't match what you
sent. A 500 means the Supabase write failed — check the Vercel logs.

## Observability

- Vercel → Functions → Logs for this route shows every invocation
  (automatic + manual).
- Resend alert fires when the daily sweep flips more than 10 deals at
  once — the dataset only has 46 active deals today, so any big number
  is a signal that something changed upstream (bulk reactivation, a
  scrape ingest gone wrong, etc.).

## Failure modes

| Symptom | Likely cause | Action |
|---|---|---|
| No cron runs recorded in Vercel logs | `vercel.json` not included in build | Check `vercel.json` is in repo root + committed |
| Every run returns 401 | `CRON_SECRET` not set in prod env | Add via Vercel dashboard |
| Run returns `{ skipped: true, reason: "column status_reason does not exist" }` | `2026-04-21-deal-staleness.sql` not applied | Apply the migration |
| `expired_count + stale_count` suddenly spikes | Import batch with missing `expires_at` aged past 30 days | Investigate the specific batch in `deals.created_at` |
