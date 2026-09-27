# 2026-09-27 — Code: city answer pages + smoke-test safety net

Branch `claude/trusting-albattani-idcmke`. Two parallel sessions were running
at the same time (motion / deal cards / off-system restyle, and deal-of-the-day /
route / accuracy / price watch / Green Wednesday). This session didn't touch deal
cards, orb/exhale/haze components, global CSS, motion tokens or scraper code.

## Part A — answer pages

There are 7 questions × 12 scope cities = 84 pages, all built by `lib/answers.ts`.
It reuses the existing readers and adds no new queries:

| Question | URL | Data source (existing) | Indexed when |
|---|---|---|---|
| Cheapest eighth | `/cheapest/<city>/eighth` | `getCheapestBoard` | ≥2 stores within 15 mi have a menu price |
| Cheapest vape cart | `/cheapest/<city>/vape-cart` | `getCheapestBoard` | same |
| Cheapest edibles (100mg gummies) | `/cheapest/<city>/edibles` | `getCheapestBoard` | same |
| Best deals today | `/best-deals/<city>` | `getLiveDeals` | ≥1 live deal in the city (or within 15 mi for Bartonville/Morton/Washington) |
| Open latest tonight | `/open-late/<city>` | `getRegionStores` + `getClosingTonight` | ≥1 store with today's hours |
| Medical dispensary | `/medical/<city>` | `getFeatureRows` | ≥1 store confirmed selling medical |
| Drive-thru near | `/drive-thru/<city>` | `getFeatureRows` | a drive-thru open or announced within 15 mi |

`<city>` is any of the 12 scope cities. Every page opens with a dated, quotable
answer that names the store and the price or time and links to it. The list it
came from follows, then a FAQ with FAQPage schema. Thin pages say so, point to
the nearest city that has the data, and are `noindex`. Only indexable pages go
into the sitemap, llms-full.txt and the IndexNow ping.

Links in: a "Quick answers" row on `/city/<city>`, a "Quick answers by city"
section on `/guides`, and the URL patterns in `/llms.txt`.

## Part B — safety net

- `tests/e2e/smoke.spec.ts` (Playwright): every page route at 390px and 1440px.
  See `tests/README.md` for the checks.
- `tests/fixtures/`: a mock PostgREST plus fixture rows, so the suite runs without
  secrets or network access.
- `tests/unit/`: node:test via tsx, covering the answer logic and the mock.
- `.github/workflows/ci.yml`: typecheck, lint ratchet, unit tests, then a fixtures
  build and the smoke suite. An optional live-data job runs if a
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` secret is added.
- `.github/workflows/daily-scrape.yml` is untouched.

## Found by the suite

- 11 pages have no canonical: `/about`, `/about/index`, `/alerts`,
  `/alerts/confirmed`, `/early-access` (→ `/alerts`), `/get-listed`, `/map`,
  `/savings`, `/savings/dashboard`, `/upgrade/success`, `/dispensary/submit-deal`.
  None of them uses the Breathe components, so they are likely in the parallel
  restyle session's area. They were left alone and listed in `KNOWN_ISSUES`
  (ratchet). Public ones need `alternates.canonical`; the confirmation and
  dashboard screens should be `noindex`.
- Content that is too wide at 390px is invisible to a plain scroll check,
  because `globals.css` clips `html`/`body`. The suite lifts the clip while
  measuring. No page overflowed on fixture data.
- Pre-existing: `tsc` fails on two `scripts/` files (Cowork lane; excluded in
  `tsconfig.typecheck.json` with a note). There are 97 ESLint errors across 40
  files (baselined; CI fails only on new ones).
