# Menu-price + deal coverage: nuEra, High Haven, Trinity, Bloom — 2026-09-27

Branch `claude/modest-darwin-2gychf`. Nothing was written to the production DB,
and nothing was read from a live store site. This cloud session's network
policy denied every store host (nueracannabis.com, highhavencannabis.com,
trinitydispensaries.com, risecannabis.com) and also Supabase. Everything
below was **built and tested against saved fixtures and a local browser**.
The first real read is the Mac dry run (commands at the end).

## What was already there (read first)

- `scripts/scrape-rendered-deals.ts` is the Mac/launchd rendered scraper. It
  runs the deals pass (`source='website_rendered'`, `scraper_runs`) and then
  the menu phase (`menu_snapshots` / `menu_items`, used by `/cheapest`).
- `lib/scraper/menuCapture.ts` had three menu readers: **dutchie, sweed,
  joint**. There was **no Jane / Algolia reader**. nuEra and High Haven were
  listed in `MENU_NOT_COVERED`.
- `reference-data/captures-jul09/jane-1517-flower.json` is a real July capture
  of nuEra East Peoria's Jane menu. It shows the product records the Algolia
  index holds, and that Jane's `dmerch` call returns only 30 of 359 products
  with details (the rest are filled in from Algolia). That is why the new
  reader uses Algolia.

## What was added (all inside the existing scraper)

| Piece | Where | How |
|---|---|---|
| Jane reader | `menuCapture.ts` platform `jane` | Watches the menu page's own Algolia requests and reads the app id, public search key, product index and `store_id` filter from them. If there are none, it reads the page's own config. **The key is never in code** (a test checks this). It replays the query with only the category changed: flower, then vape, then edible. |
| Store check | same | `janeStoreId` 1517 (East Peoria REC) and 1519 (Urbana REC). A page that queries the MED store is refused. Champaign and Pekin take the id from the page's own query. |
| Platform switch | `alsoTry` | Every page load watches for all platforms' data calls. High Haven is listed as Jane but can also be read as Dutchie, since search results show its menu is on Dutchie now. If neither shows up, the error names what the page did call. |
| Dutchie fallback | `readDutchie(generic)` | For a Dutchie menu that doesn't open on the flower-eighths view: it keeps only the store/pricing identity filters, then asks for each unit. The replay runs in the same frame that made the call. |
| Trinity reader | platform `treez` | HTML only, since there is no data call. It follows the store's own link from the home page and requires the store's name near the top of the page (it refuses if both stores are named there). It then opens the Flower / Vapes / Edibles links it finds and reads each product card on its own. |
| Bloom deals | `lib/scraper/renderedDeals.ts` + fetcher | Reads RISE's chain-wide IL deals page once per run. The page is split into cards and each card is read by itself. A deal goes to a store only if its card names that store (Peoria, Bradford, or Normal + Northbrook). It goes to all three stores only if the card, or a page sentence with no "unless / except / participating" clause, says all Illinois locations. |
| Enum | `sql/migrations/2026-09-27-menu-platforms-jane-treez.sql` | Adds `jane` and `treez` to `menu_platform`. **Not applied.** |

The units are the same three the current reader uses (eighth 3.5g, 1g cart,
100mg gummies). Candidates go through the same shared rules
(`rejectReason` / `splitCandidates`): sanity bands, infused flower, THC over 35%,
disposables, ratio edibles. So `/cheapest` picks them up with no page change.

## Per-store status

| Store | What | Status | Notes |
|---|---|---|---|
| nuEra East Peoria | menu (Jane) | **BUILT, NEEDS MAC RUN** | Store 1517. Parser checked on 30 real records from this store (July). |
| nuEra Champaign | menu (Jane) | **BUILT, NEEDS MAC RUN** | Store id read at run time. |
| nuEra Pekin | menu (Jane) | **BUILT, NEEDS MAC RUN** | Store id read at run time. |
| nuEra Urbana | menu (Jane) | **BUILT, NEEDS MAC RUN** | Store 1519. |
| High Haven Normal | menu (Jane or Dutchie) | **BUILT, NEEDS MAC RUN** | Search results show a Dutchie menu. If so, Dutchie is read from the store page's embed. |
| Trinity on Glen | menu (HTML) | **BUILT, NEEDS MAC RUN** | Page layout not observed from here; fails closed. |
| Trinity on University | menu (HTML) | **BUILT, NEEDS MAC RUN** | Search shows a University rec menu on **trinitymmj.com** (another domain). If so, it errors with "no link matching …" and needs a URL decision. |
| Bloom Peoria / Normal Bradford / Normal Northbrook | deals (RISE IL page) | **BUILT, NEEDS MAC RUN** | Cloudflare challenged the cloud on Sep 25. If the Mac is challenged too, the result is **BLOCKED** (skipped, never solved). |

None of these is WORKING LIVE. They have not been seen working against the
real sites.

## Mac runbook, in order

Use a normal checkout such as the Desktop copy, **not** `~/puffprice-scraper`.
The launchd job runs whatever is checked out there. `.env.local` must have
`NEXT_PUBLIC_SUPABASE_ANON_KEY` for step 2 and `SUPABASE_SERVICE_ROLE_KEY` for
steps 3 and 5.

**Step 1: get the branch and run the offline tests.**

```sh
git fetch origin && git checkout claude/modest-darwin-2gychf && npm install
PW_CHANNEL=chrome npm run test:scrapers
```

Good: `# pass 31` and `# fail 0`. Stop if anything fails.

**Step 2: dry run for the 10 new stores.** Dry runs read only and write nothing.

```sh
# 7 menu stores: nuEra x4, High Haven, Trinity x2
npx tsx scripts/scrape-rendered-deals.ts --menus-only --slug=nuera,high-haven,trinity
# 3 Bloom stores: deals from RISE's IL deals page
npx tsx scripts/scrape-rendered-deals.ts --no-menus --slug=beyond-hello-peoria,ayr-wellness-normal,revolution-dispensary-normal
```

What to look for in the menu run. Each store prints one line, e.g.
`+ nuera-east-peoria [jane] ok · 212 items · 40 dropped · 1 page load, 3 data calls · 14.2s`,
followed by one line per unit (`eighth`, `cart`, `gummies`).

| | Good | Bad (what it means) |
|---|---|---|
| nuEra x4 | `[jane] ok` or `partial`; `eighth NN found · cheapest $…` with real product names; about 3 data calls | `Jane: no Algolia search key found` (Jane changed how the menu loads). `queried store 1518, expected REC store 1517` (it loaded the MED menu). `menu redirected off the store's domain`. `bot challenge`. |
| High Haven | `[jane]` or `[dutchie]` with `ok` or `partial`. Either is fine; it tells us which platform the menu is on now. | `data calls this page did make: none of the known menu platforms` (the menu URL is wrong or the menu didn't load). |
| Trinity x2 | `[treez] ok` or `partial`; `5 page load`; plausible eighth prices | `no link matching … store picker changed?` (for University this likely means its menu is on trinitymmj.com, so a URL decision is needed). `menu page does not name the store`. `names both stores`. `no Flower / Vapes / Edibles links`. `no product cards found`. |
| All | Cheapest prices look like real shelf prices (eighth about $15–60, 1g cart about $20–60, 100mg gummies about $8–30); `dropped` reasons make sense (THC above 35%, infused, disposable, CBD/ratio) | An item or price you know is wrong. Paste the line into the PR. |

The last line reads `menu prices: X/7 stores with prices`. **X is the new-store coverage.**

What to look for in the Bloom run:

- Good:
  - `· RISE IL deals page: N cards → K deals mapped` with K > 0.
  - Each `✓ <deal> → <store(s)>` names the right store(s).
  - The final `+ beyond-hello-peoria: …` lines are the deals that would be added.
- Bad:
  - `not read (bot challenge or load failure)` and `! …: failed_read: 0 of 2 pages loaded`. Cloudflare blocks the Mac too, so Bloom is **BLOCKED**. Nothing will be retired.
  - 0 mapped with many `✗ … names no Bloom store`. The cards don't say which stores they apply to. That's correct behaviour, but it means no Bloom deals.
  - A `✓` mapped to the wrong store. Stop and paste it into the PR.

**Step 3: dry run for the High Haven deal fix** (static scraper, same as the Vercel cron). It takes several minutes because it checks every store's site, and it writes nothing.

```sh
npx tsx scripts/scrape-cil-deals.ts --dry-run --out=scrape-output/static-dry.json
node -e 'const s=require("./scrape-output/static-dry.json");for(const k of ["deals_found","deals_aged","fetch_errors"])console.log(k,JSON.stringify(s[k].filter(d=>(d.listing_slug||d.slug)==="high-haven-normal")))'
```

- Good:
  - `deals_found` has `First-time 20% off` with `source_url` `https://highhavencannabis.com/high-haven-normal-il-the-puff-palace/`.
  - `deals_aged` has `First-time 42% off` if that row is live today.
  - No 42 anywhere in `deals_found`.
- Bad:
  - `fetch_errors` shows `failed_read … redirected off the store's page` or `expired (WordPress trashed page …)`. Normal's own page moved. Nothing is changed, and the 42% row stays until the page URL is fixed.

**Step 4: apply the enum migration.** Only if step 2 looked good. In the Supabase SQL Editor, run `sql/migrations/2026-09-27-menu-platforms-jane-treez.sql`: two `ALTER TYPE … ADD VALUE` lines, each on its own, not inside `BEGIN/COMMIT`.

**Step 5: the `--apply` run** (writes deals, `menu_snapshots` / `menu_items` and `scraper_runs`).

```sh
npx tsx scripts/scrape-rendered-deals.ts --apply --menus-only --slug=nuera,high-haven,trinity
npx tsx scripts/scrape-rendered-deals.ts --apply --no-menus --slug=beyond-hello-peoria,ayr-wellness-normal,revolution-dispensary-normal
```

- Good:
  - Each menu store prints `wrote snapshot <id> · N menu_items`.
  - The Bloom run ends `found … · insert …`.
  - Within about 15 minutes `/cheapest` shows the new stores.
- Bad:
  - `menu_platform has no 'jane' value yet`: step 4 wasn't applied.
  - `write failed: …`: paste the line into the PR.
- The High Haven 42% row is retired by the next Vercel static cron (09:00 UTC) once this PR is merged.
- After merge, the launchd job (`~/puffprice-scraper`, 06:15 and 12:15) runs everything on `main` twice a day with no further steps.

## Run-level fixes (second commit, same day)

- **Failed reads no longer retire deals, for every store and in both runs.**
  If not one of a store's pages can be read (bot challenge, timeout, HTTP
  error, robots.txt), `scrapeListing` returns
  `failed_read: 0 of N pages loaded (<page> <why>; …)`. That store shows as
  `failed` in `scraper_runs.dispensary_results`, and the run rolls up as
  `partial`. `planRetirements` only retires deals for stores read cleanly this
  run. This applies to the rendered Mac run and the static Vercel cron alike.
  A page that loads but shows no deals still counts as a read. The
  `mark-stale-deals` cron (7+ days unverified) is still the backstop.
- **Menu stores rotate.** The menu phase now runs stores least recently
  *attempted* first (`orderMenuStores`). The state lives in
  `scrape-output/menu-order-state.json`, which is gitignored and so survives
  the launchd clone's `git pull`. It is written after each store. A store
  skipped by `MENU_DEADLINE_MS` is not marked, so it goes first next run. The
  deadline itself is unchanged (11 min). The log prints the order at the
  start of the menu phase. If the file is missing or unreadable, the stores
  run in `MENU_SOURCES` order.

## High Haven Normal first-time offer (2026-09-28)

The Sep 25 run found both `First-time 20% off` and `First-time 42% off` for
High Haven Normal, and both came from High Haven's own site. They are not
old-versus-new; they are two different stores' offers:

- The chain's Rewards page lists the first-purchase offer by location:
  Elgin (The Record Store) 42%, Darien (The Gas Station) 20%, Normal (The
  Puff Palace) 20%.
- The chain-wide pages (home, `/rewards/`, `/deals/`) show Elgin's
  "42.0% Off First Purchase!" without naming a store.
- The site also still serves trashed WordPress deals pages
  (`/deals__trashed/normal-deals/`, `/deals__trashed/elgin-il/`,
  `/deals__trashed/darien-il/`).
- Normal's own page,
  https://highhavencannabis.com/high-haven-normal-il-the-puff-palace/, states:
  "All first-time customers who sign up for the High Rollers club will receive
  20% off first purchase."

Source caveat: this cloud session still could not load highhavencannabis.com.
The page text above comes from search-engine results for those URLs, not from
a direct read. The Mac dry run (step 3) is the direct check.

Fix (shared scraper core, `lib/scraper/cil-deal-scraper.ts`):

- `STORE_PAGE_URLS` pins `high-haven-normal` to Normal's own page, and the
  static scraper reads only that page. So only what Normal's page states is
  kept.
- `offStorePage` is a generic check for every store. A fetched page whose
  final URL is a WordPress `__trashed` page is expired and not read. A page
  requested under a store's own path that redirected outside it is not that
  store's page. Either way it counts as not read: if no page is read, the
  store is a failed read and nothing is retired.
- After merge, the next static cron retires the live `First-time 42% off` row
  as not seen.

Tests: `tests/scraper-runs.test.ts`, 3 tests. I checked them by mutation:
removing the pin or the guard makes them fail.
