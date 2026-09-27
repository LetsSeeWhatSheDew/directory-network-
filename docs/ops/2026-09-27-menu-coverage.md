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

## Commands for the Mac

Use a normal checkout such as the Desktop working copy, **not** the launchd
clone `~/puffprice-scraper`. The launchd job runs whatever is checked out
there.

```sh
git fetch origin && git checkout claude/modest-darwin-2gychf && npm install
PW_CHANNEL=chrome npm run test:scrapers          # fixtures + local-browser tests
npx tsx scripts/scrape-rendered-deals.ts --menus-only --slug=nuera
npx tsx scripts/scrape-rendered-deals.ts --menus-only --slug=high-haven
npx tsx scripts/scrape-rendered-deals.ts --menus-only --slug=trinity
npx tsx scripts/scrape-rendered-deals.ts --no-menus --slug=beyond-hello-peoria
npx tsx scripts/scrape-rendered-deals.ts --no-menus --slug=ayr-wellness-normal
npx tsx scripts/scrape-rendered-deals.ts --no-menus --slug=revolution-dispensary-normal
```

These are dry runs: they read only and write nothing. The menu runs print each
store's status, the cheapest item per unit and every dropped item with its
reason, and save `scrape-output/menu-prices-<date>.json`. The Bloom runs print
every RISE card, with ✓ and the stores it was mapped to, or ✗ and why it was
skipped.

## Known gaps / follow-ups

- A store whose every page fails to load (e.g. a Cloudflare challenge) still
  counts as "loaded", so its `website_rendered` deals are retired that run.
  This is existing behaviour and unchanged here. Once Bloom has deals, a
  flapping challenge will make them come and go.
- The 7 new menu stores come last in `MENU_SOURCES`. If the deals pass runs
  long, `MENU_DEADLINE_MS` (11 min, unchanged) can skip them for that run. Look
  for `menu_deadline_reached` in the log.
