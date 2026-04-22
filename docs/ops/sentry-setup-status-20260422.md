# Sentry setup status — 2026-04-22

## State

Scaffold is in place; DSN is **not** set in Vercel, so Sentry is a no-op
in production today.

## Files

| File | Role | DSN source |
|---|---|---|
| `sentry.client.config.ts` | Browser-side init | `NEXT_PUBLIC_SENTRY_DSN` |
| `sentry.server.config.ts` | Node runtime init | `SENTRY_DSN` (or `NEXT_PUBLIC_SENTRY_DSN` fallback) |
| `sentry.edge.config.ts` | Edge runtime init | same as server |
| `instrumentation.ts` | Next.js `register()` + `onRequestError()` hook | selects correct runtime |
| `app/error.tsx`, `app/global-error.tsx` | App Router error boundaries | — |

Every file early-returns when DSN is unset — there is no load-time cost
when Sentry is dark.

## What's NOT configured

- `tracesSampleRate = 0` — no performance tracing. Turn up to 0.1 when
  DSN is enabled and traffic volume is clear.
- `replaysSessionSampleRate = 0` — no session replay.
- No `sentry-cli` source map upload configured in the build step. That's
  fine for basic exception capture but means stack traces won't be fully
  mapped to TS source lines in Sentry's UI. Add when the error volume
  justifies the setup time.
- No `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` in Vercel
  environment.

## Matthew's go-live steps

1. Create a project in Sentry (or reuse an existing one) and copy the
   DSN.
2. Add to Vercel env vars — **Production**, **Preview**, **Development**:
   - `NEXT_PUBLIC_SENTRY_DSN = https://<public-key>@<org-id>.ingest.sentry.io/<project-id>`
   - `SENTRY_DSN = https://<public-key>@<org-id>.ingest.sentry.io/<project-id>` (same value; the split is so the client bundle only ships the public DSN and the server picks up the server-scoped one if they ever diverge)
3. Redeploy prod (`git push` or `vercel deploy --prod`).
4. Verify capture:
   - Visit `https://www.puffprice.com/some-intentionally-bad-path-that-returns-500` (or temporarily throw in a handler) and confirm the event appears in Sentry within ~30s.
   - Open the Sentry project → Issues tab.
   - If nothing arrives: check `/_next/static/chunks/` for the Sentry SDK bundle + Vercel Function logs for `Sentry.init` errors.
5. Remove any temporary throw code before shipping — don't leave a
   deliberate error in prod.

## Why no test trigger shipped this session

The brief asked for a deliberate `?test_sentry=1 → throw` path to verify
end-to-end capture. Skipped because without the DSN set, Sentry would
swallow the throw silently and the test would confirm nothing. Add the
DSN first, then run the test.

## If Sentry is not wired after the DSN lands

Probable causes, in order of likelihood:

1. **DSN typo** — paste the exact string from Sentry's Project Settings
   → Client Keys (DSN).
2. **DSN set in Development only** — Vercel env vars are scoped per
   environment. Confirm Production checkbox is selected.
3. **Ad blocker** in browser — some blockers intercept `ingest.sentry.io`.
   Check from a clean browser profile.
4. **Build didn't include the config** — verify the deploy log shows
   `sentry.client.config.ts` compiled into the client bundle. If not,
   Turbopack may have tree-shaken it; add explicit import from
   `instrumentation-client.ts`.
