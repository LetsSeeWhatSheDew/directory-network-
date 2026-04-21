# Stale-Deal Cron Endpoint Smoke Test — 2026-04-21

**Context:** Commit f5d4536 ships `/api/cron/mark-stale-deals` plus a `vercel.json` crons entry scheduled for 04:00 UTC daily. Until Matthew adds `CRON_SECRET` to Vercel env vars + applies `sql/migrations/2026-04-21-deal-staleness.sql`, the endpoint shouldn't execute work — but it should be reachable and reject unauthorized requests cleanly.

## Results

| Test | Request | Expected | Actual | Pass |
|---|---|---|---|---|
| Route exists | `POST /api/cron/mark-stale-deals` (no auth) | 401, not 404 / 500 | 401 "unauthorized" | PASS |
| Auth-check active | `POST` with `Authorization: Bearer FAKE_TOKEN` | 401 | 401 "unauthorized" | PASS |
| GET also guarded | `GET /api/cron/mark-stale-deals` | 401 | 401 "unauthorized" | PASS |

Response body is literally `unauthorized` (text), status 401. Route file: [app/api/cron/mark-stale-deals/route.ts:47](app/api/cron/mark-stale-deals/route.ts:47).

## vercel.json config
```json
"crons": [{ "path": "/api/cron/mark-stale-deals", "schedule": "0 4 * * *" }]
```
Schedule is 04:00 UTC = 23:00 CT previous day. Config is present in repo and will be picked up by Vercel automatically once deployed.

## Verdict
**PASS — route deployed, auth gate working, cron schedule configured.**

## Pre-reqs for the cron to actually do work (still open)
1. Apply `sql/migrations/2026-04-21-deal-staleness.sql` to Supabase (adds `status_reason` + indexes). Until then the endpoint's first UPDATE errors on the missing column — the handler catches the error and returns `{skipped: true, reason: ...}` cleanly.
2. Add `CRON_SECRET` env var to Vercel. Without it, Vercel's cron trigger will fail the auth check.
3. Optionally set `STALE_ALERT_RECIPIENT` env var (defaults to `matthew@jacarandapeoria.com`).

No code change needed — just env vars + one migration apply.
