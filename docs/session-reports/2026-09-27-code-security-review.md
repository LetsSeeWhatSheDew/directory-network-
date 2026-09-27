# 2026-09-27 — Code: server-side security + robustness review

Scope: `app/api/**`, `/mcp`, `middleware.ts`, `next.config.ts`, `lib/` data access, `sql/migrations` (new file only, not applied). No UI styling, no scraper logic. The full findings table is in the PR description; this is the short version for the next session.

## Fixed in code
- **Admin gate.** `middleware.ts` let every POST to `/admin/*` through without auth, and App Router pages render for POST, so the admin pages (leads, subscribers, submissions, traffic) were readable by anyone. Now every method is gated, plus a new `app/admin/layout.tsx` checks the session again server-side. That also makes `/admin` dynamic; it used to be prerendered at build time with the service key, which baked lead data into build output.
- **Admin session.** The cookie is now a SHA-256 token derived from `ADMIN_PASSWORD`, not the password itself. Compares are constant-time, login is limited to 5 tries per 15 min per client, and all `/api/admin/*` routes share `lib/adminAuth.isAdmin`. Admins have to sign in once more after deploy.
- **Next.js 16.0.7 → 16.3.6** (critical advisories). `npm audit --omit=dev` is clean.
- **Weekly report double opt-in** (`lib/alertSubscribers.subscribeWeekly`, `/api/alerts/subscribe-confirm`, `lib/weeklyConfirm.ts`). Before this, anyone could subscribe any address, and `/api/alerts/preferences` could switch an unsubscribe back on. Existing active subscribers (rows with no `ok:` tag) are grandfathered. Watches were already double opt-in and are unchanged.
- **`/api/location`** used to send every visitor's IP to ipapi.co. It now reads Vercel's own geo headers and sends nothing anywhere.
- **Analytics privacy.** `/api/track` now refuses DNT/GPC on the server too. Row building moved into `lib/trackEvent.ts`, and `tests/unit/privacy.test.ts` fails if any IP, UA, cookie, email or undocumented field reaches a stored row.
- **Public write endpoints** use `lib/validation.ts` (body caps, cleaning, email, cross-site refusal) and `lib/rateLimit.ts` (salted in-memory hashes, no raw IP, plus `firstTimeWithin` for idempotency). `/api/deals/submit` no longer stores the IP or UA. The operator lead email is HTML-escaped.
- **Headers.** HSTS, nosniff, Referrer-Policy, Permissions-Policy and XFO are set. An enforced CSP covers only the directives that can't break a page; the full allow-list is in `Content-Security-Policy-Report-Only`.
- **server-only.** `lib/supabase`, `analyticsDb`, `confirmations`, `scraperRuns` and `weeklyConfirm` are marked server-only. `lib/submitLead` (used from a client component) got its own anon client. `tests/unit/clientSecrets.test.ts` walks the client import graph.
- **Crons.** All 5 require `CRON_SECRET`; indexnow and weekly-digest now use the shared constant-time helper. **MCP** gets a 64 KB precheck, a 20 s deadline and a 512 KB output cap, and every data query is verified green-scoped.

## Needs the owner
1. Apply `sql/migrations/2026-09-27-security-hardening.sql` (read its header first). It was tested on a local Postgres 16 mock of the Supabase roles: it closes the holes, keeps every anon read and intake insert, and is idempotent.
2. Supabase → Authentication: turn off new-user sign-ups. PuffPrice doesn't use Supabase Auth.
3. `RESEND_API_KEY` must be set or weekly sign-ups return 503 (they now send a confirm email).
4. Set `UNSUBSCRIBE_SECRET` to the current `CRON_SECRET` value, so `CRON_SECRET` can later be rotated without breaking unsubscribe links in mail that's already been sent.
5. Look in Vercel logs for `POST /admin*` requests since Sep 22. If any came from outside, treat lead/subscriber data as exposed.

## Left alone (and why)
See "Not changed" in the PR. Headline items: GPS sent to nominatim from `LocationAware.tsx` (PR #10 owns the file), `deals.submitted_by_email` readable once a submitted deal is activated, the view join without `project_tag`, and the per-instance rate limits.

## Verify
`npm run test:unit` (48 pass). `npx tsc --noEmit` has only the 4 pre-existing errors in two Cowork scripts. `npx eslint` is clean on every touched file, and the repo went from 97 to 87 errors with no file getting worse. `next build` passes with sentinel values in every secret env var; the sentinels appear nowhere in `.next/static` or in prerendered pages.
