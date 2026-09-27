# Tests

Three layers, all run by `.github/workflows/ci.yml` on every pull request.

| Command | What it does | Time |
|---|---|---|
| `npm run typecheck` | `tsc` over the whole repo (`tsconfig.typecheck.json`) | ~15s |
| `npm run lint:ci` | ESLint, failing only on errors **beyond** `tests/ci/eslint-baseline.json` | ~30s |
| `npm run test:unit` | `node:test` via tsx — `tests/unit/*.test.ts` | ~1s |
| `npm run build:fixtures` then `npm run test:e2e` | production build + Playwright smoke suite, against fixture data | ~5 min |
| `npm run smoke` | the older production smoke check (`tests/smoke.mjs`, plain fetch against puffprice.com) | ~10s |

## Smoke suite (`tests/e2e/smoke.spec.ts`)

Visits **every page route in `app/`** — discovered from `app/**/page.{tsx,jsx}` — at
**390px** (mobile, touch) and **1440px**. Dynamic routes use real slugs listed in
`tests/e2e/routes.ts`; a new dynamic route with no sample fails the suite until you
add one. Each page fails on:

- a non-200 response (after redirects)
- any browser console error or uncaught exception
- missing `<title>`; missing meta description or canonical (skipped for `noindex`
  pages and paths `robots.txt` disallows); a canonical not on `https://www.puffprice.com`
- horizontal overflow at 390px. `globals.css` clips `html`/`body` (`overflow-x: clip`),
  so the page can't scroll sideways, but anything too wide is silently cut off.
  The check lifts that clip while measuring and names the widest elements.
- visible `NaN`, `undefined` or `$0.00`
- visible `OTHER-TENANT` — fixture rows from other `master_listings` projects
  (`project_tag` ≠ `green`); seeing one means a query lost its scope filter

It also checks `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt` and the
manifest render cleanly, and that **every URL in the sitemap answers 200 and isn't
noindex**.

Third-party requests (Google Analytics, map tiles, embeds) are answered locally with
an empty body. Tests stay offline, and fixture traffic never reaches analytics.

### Known issues ratchet

`KNOWN_ISSUES` in `tests/e2e/routes.ts` lists problems on pages other work streams
own, so CI stays green for everyone else meanwhile. It works one way only: when a
listed problem is fixed, the test fails until you delete the entry.

### Fixture data

`tests/fixtures/mock-supabase.mjs` is a small PostgREST look-alike (eq, in, is,
ilike, or, order, limit, JSON paths, `count=exact`…) serving
`tests/fixtures/data.mjs`: real Central Illinois slugs, **made-up** prices, deals,
hours and features, with timestamps relative to "now". Writes are accepted and
discarded. `tests/fixtures/with-mock.mjs <cmd>` runs a command with the mock up
and `NEXT_PUBLIC_SUPABASE_URL` pointed at it. A fixtures build can't reach
production.

To add data a new page needs, add rows to `data.mjs`. If the mock sees a table it
doesn't know, it returns `[]`, just as an empty table would.

### Running locally

```bash
npm run build:fixtures      # next build against the mock
npm run test:e2e            # starts mock + next start on :3100, runs the suite
npx playwright test -g "/open-late"          # one route
npx playwright test --project=mobile-390     # one viewport
BASE_URL=https://<preview>.vercel.app npm run test:e2e   # against a deployment
```

With `BASE_URL`, nothing is started locally and fixture-only samples are skipped.

## CI secrets

The required jobs need **no secrets**. The optional `smoke-live` job runs the same
suite on a build that reads live data. It skips itself unless the repo has a
`NEXT_PUBLIC_SUPABASE_ANON_KEY` secret (the public anon key; the existing
`NEXT_PUBLIC_SUPABASE_URL` secret is reused). It never uses the service-role key and
never blocks a merge.

## Lint baseline

`npm run lint:ci` fails only if a file has more errors of a rule than the baseline
allows. After fixing lint errors, run `npm run lint:baseline` to lock in the lower
count. Never raise the baseline to make CI pass.
