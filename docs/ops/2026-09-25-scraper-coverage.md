# Scraper coverage + rendered-scrape hang fix — 2026-09-25

Branch `night/scraper-coverage`. Nothing was pushed and nothing was written to
the production DB. There was no service key, so every run was a dry run that
only read the DB with the anon key. The full dry-run output is in
`docs/ops/2026-09-25-scraper-coverage-dryrun.log`.

## 1. The hang (status='running' for 11+ hours)

**Likely cause.** `scripts/scrape-rendered-deals.ts` had no overall time limit,
so one stalled call could keep the process alive forever while the
`scraper_runs` row stayed `running`. Calls that could stall:
- `page.content()`, `frame.content()`, `frame.evaluate()`, `$$eval` and
  `page.close()` had no timeouts;
- no Supabase REST call had a timeout;
- `browser.close()` could block the exit.

Sites with heavy iframe and tracker content (SHARE, NOXX and others) reproduce
this here. The first manual probe of everyoneshares.com hung until the shell
killed it.

**Fix (all in the existing scraper, with no parallel code path):**

| Layer | What |
|---|---|
| Per call | Navigation 30s, actions 10s (context defaults). Every `content`/`evaluate`/`$$eval`/`title` is wrapped in `withTimeout`. `page.close` is capped at 5s. |
| Per page | `PAGE_BUDGET_MS` = 60s (`Promise.race`). The page is always closed in `finally`. |
| Per store | `runCilScrape({ perListingTimeoutMs: 90_000 })` uses `Promise.race` with a timer. `scrapeListing` also checks the store deadline before each candidate URL, so an abandoned store stops opening pages. A store that times out is logged as `timeout: store exceeded 90s budget`, and its existing deals are **not** retired. |
| Whole run, soft | `deadlineAt` = start + 10 min. After that no new store starts, and the remaining stores are logged as `run_deadline_reached`, so the run finishes `partial`. |
| Whole run, hard | At 12 min a timer calls `bail()`. That PATCHes the row (`partial` if any store finished, otherwise `failed`, with `error_summary`), kills Chrome and calls `process.exit(2)`. A 30s kill switch makes sure the exit happens. |
| Signals and crashes | SIGTERM, SIGINT, SIGHUP, uncaughtException and unhandledRejection all go through `bail()`. |
| Browser | Closed in `finally`. `close` is capped at 10s, then the Chrome process gets SIGKILL. |
| Supabase | Every REST call has `AbortSignal.timeout` (20s in the scraper core, 15s in `runLog`). |
| Startup | With `--apply`, `markAbandonedRuns()` marks this script's own rows (`trigger='manual'`, `status='running'`, `started_at` more than 1h ago) as `failed` with `error_summary = 'abandoned — process never finished'`. |
| Wrapper | `scripts/run-rendered-scrape.sh`: macOS has no GNU `timeout`, so `run_with_timeout` starts each step in its own process group (`perl setpgrp; exec`). A watchdog sends TERM and then KILL to the **whole group** (npx → tsx → node → Chrome). Limits: git pull 120s, npm install 300s, scrape 900s. Any leftover scrape process is killed first. |

Note: `scraper_runs.status` has a CHECK constraint that allows only
`running|success|partial|failed`. There is no `error` value, so abandoned and
aborted runs use `failed`.

**Verified here:**
- A 4s store budget produced `timeout: store exceeded 4s budget` for both Ascend stores, and the run finished in 11s.
- `HARD_DEADLINE_MS=15000` made the run abort at 15s with exit code 2.
- SIGTERM made it abort and exit.
- No Chrome processes were left over after any of these tests.
- The wrapper's `run_with_timeout` killed a `sh -c 'sleep 100 & sleep 100'` group at the limit (rc 143) and left no orphans. This was tested under bash because zsh isn't installed here.

Each budget can be overridden with an env var of the same name
(`STORE_BUDGET_MS`, `HARD_DEADLINE_MS`, …).

**Clean up the stuck row now** (the startup sweep will also do this on the
next `--apply` run):

```sql
UPDATE scraper_runs
   SET status = 'failed', finished_at = now(),
       error_summary = 'abandoned — process never finished'
 WHERE status = 'running' AND finished_at IS NULL
   AND started_at < now() - interval '1 hour';
```

## 2. Coverage: per-store results (dry run, 2026-09-25)

Deal counts are what the dry run would insert. Every deals URL is on the
store's own domain. Embedded POS menus on that domain count as direct under
`docs/deal-data-policy.md`. No Leafly, Weedmaps or dutchie.com marketplace
page was used as a deal source.

| Store (slug) | Platform | Deals URL | Dry run | Notes / website fix |
|---|---|---|---|---|
| beyond-hello-peoria | RISE / Green Thumb (Cloudflare) | risecannabis.com/dispensaries/illinois/bloom-wellness-peoria/ | **BLOCKED — 0** | The store is now **Bloom Wellness Peoria** (same address, "formerly Beyond Hello"). beyond-hello.com no longer lists Peoria; the old URL redirects to the chain index. risecannabis.com returns a Cloudflare Turnstile challenge to this datacenter IP, and the scraper skips challenges without solving them. It may load from the Mac. The store page only shows a generic "up to 30% off" banner, which the extractor correctly ignores. **Fix website** (SQL). |
| trinity-on-glen | Treez / GapCommerce storefront | trinitydispensaries.com/product-group/glen-hot-90-ounce-deals?group_id=… | **1**: `$90 ounces (select strains)` | The `/deals` promotion cards are empty ("Special offer", no text). The other items are per-product markdowns, which are not store deals. The one store-level promotion is the Glen "Hot $90 Ounce Deals" group: 17 items, all $90 / 28g. A new detector only emits this when the group's own name states the price and 3 or more items share that price and size. The `group_id` changes when Trinity rebuilds the group. **Fix website** to the store page (SQL). The age gate button ("I'M AT LEAST 21") was not recognised before; it is now. |
| trinity-on-university | same | …/product-group/university-hot-90-oz-deals?group_id=… | **0 (PARTIAL)** | The University group exists but currently has no products, and nothing else store-specific is published. This is an honest zero. **Fix website** (SQL). |
| noxx-east-peoria | Dutchie embed on noxx.com | noxx.com/stores/noxx-peoria/specials | **108** | The store's full specials list, e.g. `$80ea Flash Sale - Select 28g Flower (FRIDAY TO SUNDAY)`, `2/$50 1g Cartridges`, `25% Off Kaviar Flower`. Dutchie cuts names off at about 75 characters; those are trimmed to the last whole word and end with "…". Website on file is fine. |
| ayr-wellness-normal | RISE / Green Thumb (Cloudflare) | risecannabis.com/…/bloom-wellness-normal-bradford/ | **BLOCKED — 0** | AYR Normal is now **Bloom Wellness Normal (Bradford)**. bloom-wellness.com lands on a Minnesota store and its IL pages 301 to RISE. Same Cloudflare block as Peoria. **Fix website** (SQL). |
| revolution-dispensary-normal | RISE / Green Thumb (Cloudflare) | risecannabis.com/…/bloom-wellness-normal-northbrook/ | **BLOCKED — 0** | revcanna.com no longer lists Normal: its Normal location URL 301s to Bloom Normal Northbrook, which 301s to RISE. **Fix website** (SQL). |
| ascend-cannabis-downtown-springfield | Dutchie embed on letsascend.com | letsascend.com/stores/springfield-adams-street-illinois/specials | **45** | e.g. `2 for $220 - Ozone 28g Popcorn`, `25% Off Fernway`, `Buy 2 or More Ozone Signature 3.5g Flower, Get 20% Off Those Items`. Website on file is fine. |
| ascend-cannabis-horizon-drive | Dutchie embed on letsascend.com | letsascend.com/stores/springfield-horizon-drive-illinois/specials | **44** | Same list as Adams Street, which is Ascend's chain-level IL promo calendar; each store's own page publishes it. |
| high-profile-cannabis-springfield | Dutchie embed on highprofilecannabis.com | highprofilecannabis.com/stores/il-springfield-hp/specials | **33** | e.g. `Monday's & Thursday's \| 30% Off Cresco Brands`, `Flower \| Buy 4 or More 3.5g, Get 20% Off`. Curl gets Cloudflare 403, but a real browser loads the page. Carousel/list duplicates of the same special are collapsed by special id. **Fix website** from the multi-state chain root to the Springfield page (SQL). |
| share-springfield | LeafBridge (WordPress) over Dutchie POS | everyoneshares.com/specials/ | **99** | Read from the hidden `.special_title` of each specials tab. Filters: names must state an actual offer (%, $, N-for, BOGO, free), so announcements like "BRIQ 2.0! New hardware, same price!" are dropped; names with a date that has passed ("VIBATIONS 25% 6/15/26") are dropped. **Review:** SHARE keeps many specials enabled, and some are clearly seasonal ("Best Summer Deals 40% Off") or day-specific ("Midweek Cart BOGO!", "Thursday Therapeutics"). They are in the store's live specials list, but spot-check before trusting all 99. The static cron also newly finds `Senior 10% off` and `Veterans 10% off` in SHARE's FAQ. **Fix website** http→https (SQL). |
| shangri-la-springfield | Cresco / Sunnyside platform | shangrila-springfield.shop/page/specials-shangri-la | **3**: `Veterans 10% off`, `Senior 10% off`, `First-time 50% off` | The official site was found through shangriladispensaries.com/illinois/, which redirects there. This store exposed the flattened-text bug (§3): before the fix it would have produced a false `Senior 30% off`. The homepage banner "55% off 5+ Cresco, High Supply, & FloraCal items" is real but no pattern captures it yet. **Add website** (SQL). |
| the-dispensary-champaign | none found | — (empty override) | **SKIPPED — 0** | The website on file is The Dispensary **Fulton**. The chain lists only Fulton and East Dubuque, thedispensarychampaign.com redirects to the Fulton site, and the phone on file is Fulton's. No Champaign deals page exists, and only a Facebook page was found. The rendered scraper now skips this store (`no_store_deals_page`) instead of guessing. **Set website NULL** so the static cron stops scraping Fulton for it, and confirm whether the store still operates. |

**Totals:** all 12 target stores were in the dry run (18 stores in total).
7 stores went from 0 deals to having deals (NOXX, both Ascend,
High Profile, SHARE, Shangri-La, Trinity Glen), with 333 new deals among them.
3 stores are **BLOCKED** by Cloudflare from this machine (the three Bloom
Wellness stores). 1 is a real zero (Trinity University). 1 has no store page
(The Dispensary Champaign).

Beyond the 12 target stores, the same dry run also finds new deals for
stores that were already covered: 6 bundle deals for Sunnyside Champaign
and 1 for Aroma Hill.

The run also retires `50% off 4+ Cresco flower (select strains)` at Cloud 9.
That promotion is no longer on its menu; this is not caused by this change.

## 3. Accuracy fixes in the shared extractor (`lib/scraper/cil-deal-scraper.ts`)

The scraper used to flatten the whole page onto one line. That let one item's
number attach to the next item's label.

- **Line-aware text.** Block elements now become line breaks, and the patterns
  already refuse to match across a line (`[^.\n]`). Card layouts that put the
  label and the value in separate blocks ("Veterans" / "30% Off Every Day!",
  "Senior Discount (Age 62+):" / "10% Off…") are re-joined once, so those
  still match.
- **Number-first audience lists.** On a line that reads "10% off Veterans
  discount … 10% off Senior discount … 30% off Medical", the group-first
  patterns are switched off and number-first matching is used instead.
- **Static cron dry run, before vs after** (same day, same pages):
  - **Removed (false):** Cookies Bloomington `THIRSTY THURSDAY — 25% off`, which is live in the DB today, and `— 30% off`. The page says "THIRSTY THURSDAYS  Shop Now", and the 25%/30% belong to the next cards ("25% OFF MILE HIGH LIVE ROSIN", "SECRET MENU 30% OFF"). The live 25% row will be retired as `not_seen_last_scrape` on the next cron.
  - **Added (true):** Cookies Bloomington `Senior 10% off` ("10% OFF Seniors (55+)"), SHARE `Senior 10% off` and `Veterans 10% off`.
  - **Added, needs review:** High Haven Normal `First-time 20% off`. The store page says "first-time customers who sign up for the High Rollers club will receive 20% off first purchase". The chain deals page says "42.0% Off First Purchase!", which is also captured as `First-time 42% off`. Both statements are on the store's own site; one of them is probably stale.
  - Every other existing deal is unchanged.
- The first-time pattern also accepts "N% off first purchase/order" and "42.0%".

## 4. Other scraper changes

- `scripts/scrape-rendered-deals.ts`:
  - New selectors for structured specials: Dutchie `a[href*="/specials/sale|offer/"]` and LeafBridge `.specials_tab .special_title`. When such a list is present it is used on its own, and the page's per-product "40% off" badges are not run through the text patterns.
  - Uniform-price product-group detector (Trinity).
  - Better age-gate handling: "I'm at least 21" buttons and links; the scraper returns to the requested URL if the gate redirects to "/".
  - Stores with a URL override are scraped even while their website field is blank. An empty override means the store is skipped.
  - Dry runs work with the anon key.
  - `PW_EXECUTABLE_PATH` and `PW_PROXY` let the script run outside the Mac. Without them it still uses the installed Chrome channel.
- New `runLog` helpers: `abortScraperRun`, `markAbandonedRuns`.

## 5. Before merging / after deploy

1. Review and apply `sql/migrations/2026-09-25-website-fixes.sql`.
2. Clear the stuck `scraper_runs` row (SQL in §1), or let the next `--apply` run do it.
3. On the Mac, run one manual pass: `scripts/run-rendered-scrape.sh`. Confirm the row ends `success` or `partial` in under 12 min, and check whether risecannabis.com loads from a residential IP (the three Bloom stores).
4. Spot-check SHARE (99) and NOXX (108). The volume is real, but it will dominate the Springfield and East Peoria feeds; ranking and caps are a product decision.
5. Recurring-day parsing only reads weekday names, so "(FRIDAY TO SUNDAY)" becomes Friday and Sunday only, and "Midweek" is not recognised. This is a known gap and was not changed here.
