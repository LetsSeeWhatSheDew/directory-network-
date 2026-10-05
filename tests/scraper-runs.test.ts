// tests/scraper-runs.test.ts
// Run-level rules shared by every store (no browser, no network — global fetch
// is stubbed; nothing leaves the machine):
//   1. a store whose pages ALL fail to load is a failed read: logged as
//      failed in scraper_runs, and its existing deals are NOT retired —
//      in the rendered (Mac) run and the static (Vercel cron) run alike;
//   2. menu stores run least-recently-attempted first, so the 11-minute menu
//      deadline can't starve the same stores every run.
//   npm run test:scrapers
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { runCilScrape, planRetirements, offStorePage, STORE_PAGE_URLS, FAILED_READ, type ExistingDeal, type HtmlFetcher } from "../lib/scraper/cil-deal-scraper";
import { buildDispensaryResults, rollupStatus } from "../lib/scraper/runLog";
import { orderMenuStores, parseMenuOrderState, MENU_SOURCES, type MenuOrderState } from "../lib/scraper/menuCapture";
import { offerCatalog } from "../lib/scraper/renderedDeals";

const SB = "https://sb.test";
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

type Listing = { slug: string; city: string; website: string };
const deal = (id: string, slug: string, title: string, source: string): ExistingDeal => ({
  id, listing_slug: slug, title, discount_value: null, is_active: true, status_reason: "scraped_direct_source", source,
});

/** Stub fetch: Supabase reads return the given rows; robots.txt is absent;
 *  store pages answer via `page(url)`. Anything else fails the test. */
function stubFetch(listings: Listing[], existing: ExistingDeal[], page: (url: string) => Response = () => new Response("", { status: 404 })) {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.startsWith(`${SB}/rest/v1/master_listings`)) {
      return Response.json(listings.map((l, i) => ({ id: String(i), ...l, name: l.slug, state: "IL", is_active: true, project_tag: "green" })));
    }
    if (url.startsWith(`${SB}/rest/v1/deals`)) return Response.json(existing);
    if (url.endsWith("/robots.txt")) return new Response("", { status: 404 });
    if (url.startsWith(SB)) throw new Error(`unexpected Supabase call ${url}`);
    return page(url);
  }) as typeof fetch;
}

// ---------------------------------------------------------------------------
// 1. Failed reads never retire deals
// ---------------------------------------------------------------------------

test("planRetirements: only stores read cleanly this run can lose deals, in both modes", () => {
  const existing = [
    deal("1", "store-a", "20% off Kiva gummies", "website_rendered"),
    deal("2", "store-b", "10% off Rove vapes", "website_rendered"),
    deal("3", "store-a", "Senior 10% off", "website"),
    deal("4", "store-b", "Veteran 10% off", "website"),
  ];
  const ok = new Set(["store-b"]);
  assert.deepEqual(planRetirements(existing, new Set(), ok, "website_rendered").map((d) => d.id), ["2"]);
  assert.deepEqual(planRetirements(existing, new Set(), ok, "website").map((d) => d.id), ["4"]);
  // Seen this run → kept.
  assert.deepEqual(planRetirements(existing, new Set(["store-b|10 off rove vapes"]), ok, "website_rendered"), []);
});

test("rendered run: a store whose every page fails (e.g. Cloudflare) is a failed read and keeps its deals", async () => {
  const listings = [
    { slug: "bloom-a", city: "Peoria", website: "https://a.example/" },
    { slug: "store-b", city: "Normal", website: "https://b.example/" },
  ];
  stubFetch(listings, [
    deal("1", "bloom-a", "30% off Verano brands", "website_rendered"),
    deal("2", "store-b", "10% off Rove vapes", "website_rendered"),
    deal("3", "store-b", "25% off Wyld edibles", "website_rendered"),
  ]);
  const fetcher: HtmlFetcher = async (url) => (url.includes("a.example") ? null : [offerCatalog(["25% off Wyld edibles"])]);
  const summary = await runCilScrape({
    supabaseUrl: SB, serviceKey: "anon", mode: "live", apply: false, maxListings: 10, fetcher, requestDelayMs: 0,
    urlOverrides: { "bloom-a": ["https://a.example/store/", "https://a.example/deals/"], "store-b": ["https://b.example/specials/"] },
  });
  const err = summary.fetch_errors.find((e) => e.slug === "bloom-a");
  assert.ok(err, "bloom-a should be a fetch error");
  assert.match(err!.error, new RegExp(`^${FAILED_READ}: 0 of 2 pages loaded`));
  // Only the store that WAS read loses the deal it no longer shows.
  assert.deepEqual(summary.deals_aged, [{ slug: "store-b", title: "10% off Rove vapes" }]);
  // scraper_runs: logged as a failed store, run is partial.
  const rows = buildDispensaryResults(summary);
  assert.equal(rows.find((r) => r.slug === "bloom-a")!.status, "failed");
  assert.equal(rollupStatus(rows), "partial");
});

test("rendered run: a chain page that returns no deals for this store is a successful read (not a failure)", async () => {
  stubFetch([{ slug: "bloom-a", city: "Peoria", website: "https://a2.example/" }], [deal("1", "bloom-a", "30% off Verano brands", "website_rendered")]);
  const summary = await runCilScrape({
    supabaseUrl: SB, serviceKey: "anon", mode: "live", apply: false, maxListings: 10, requestDelayMs: 0,
    fetcher: async () => [], urlOverrides: { "bloom-a": ["https://a2.example/deals/"] },
  });
  assert.deepEqual(summary.fetch_errors, []);
  assert.deepEqual(summary.deals_aged, [{ slug: "bloom-a", title: "30% off Verano brands" }]);
});

test("static (Vercel cron) run: same rule — every page erroring keeps the store's deals", async () => {
  const listings = [
    { slug: "down-a", city: "Peoria", website: "https://down.example/" },
    { slug: "up-b", city: "Normal", website: "https://up.example/" },
  ];
  stubFetch(
    listings,
    [deal("1", "down-a", "Senior 10% off", "website"), deal("2", "up-b", "Veteran 10% off", "website")],
    (url) =>
      url.startsWith("https://down.example") ? new Response("", { status: 503 })
      : url === "https://up.example/" ? new Response("<p>Senior discount: 10% off every day</p>", { status: 200, headers: { "content-type": "text/html" } })
      : new Response("", { status: 404 })
  );
  const summary = await runCilScrape({ supabaseUrl: SB, serviceKey: "anon", mode: "live", apply: false, maxListings: 10, requestDelayMs: 0 });
  const err = summary.fetch_errors.find((e) => e.slug === "down-a")!;
  assert.match(err.error, /^failed_read: 0 of 10 pages loaded \(\/ HTTP 503/);
  assert.deepEqual(summary.deals_aged, [{ slug: "up-b", title: "Veteran 10% off" }]);
  assert.deepEqual(summary.deals_found.map((d) => [d.listing_slug, d.title]), [["up-b", "Senior 10% off"]]);
});

// ---------------------------------------------------------------------------
// 2. Menu-store order: nobody starves behind the deadline
// ---------------------------------------------------------------------------

test("orderMenuStores: never-attempted first, then oldest attempt; ties keep the listed order", () => {
  const order = orderMenuStores(["a", "b", "c", "d"], { a: "2026-09-27T11:00:00Z", b: "2026-09-27T12:00:00Z", d: "2026-09-27T06:00:00Z" });
  assert.deepEqual(order, ["c", "d", "a", "b"]);
  assert.deepEqual(orderMenuStores(["a", "b", "c"], {}), ["a", "b", "c"]); // no state → MENU_SOURCES order
});

test("parseMenuOrderState: unreadable state falls back to the listed order", () => {
  assert.deepEqual(parseMenuOrderState(null), {});
  assert.deepEqual(parseMenuOrderState("{not json"), {});
  assert.deepEqual(parseMenuOrderState("[1,2]"), {});
  assert.deepEqual(parseMenuOrderState('{"a":"2026-09-27T11:00:00Z","b":"yesterday","c":5}'), { a: "2026-09-27T11:00:00Z" });
});

/** Simulate twice-daily runs where the deadline lets only `cap[run]` stores start. */
function simulate(slugs: string[], caps: number[], rotate: boolean): Map<string, number[]> {
  const state: MenuOrderState = {};
  const ranIn = new Map<string, number[]>(slugs.map((s) => [s, []]));
  caps.forEach((cap, run) => {
    const order = rotate ? orderMenuStores(slugs, state) : slugs;
    order.slice(0, cap).forEach((slug, pos) => {
      state[slug] = new Date(Date.UTC(2026, 8, 27) + run * 6 * 3600_000 + pos * 60_000).toISOString();
      ranIn.get(slug)!.push(run);
    });
    // Stores past the cap hit menu_deadline_reached: not marked attempted.
  });
  return ranIn;
}

test("menu order: with the deadline cutting runs short, every store is read within ⌈N/cap⌉ runs", () => {
  const slugs = Object.keys(MENU_SOURCES);
  assert.ok(slugs.length >= 16);
  const caps = [9, 7, 12, 5, 9, 16, 6, 8, 10, 7, 9, 5, 11, 9, 8, 6];
  const minCap = Math.min(...caps);
  const window = Math.ceil(slugs.length / minCap);
  const ran = simulate(slugs, caps, true);
  for (const [slug, runs] of ran) {
    const gaps = [runs[0] + 1, ...runs.slice(1).map((r, i) => r - runs[i]), caps.length - runs[runs.length - 1]];
    assert.ok(Math.max(...gaps) <= window, `${slug} went ${Math.max(...gaps)} runs without a read (limit ${window}): ${runs}`);
  }
  // The newly added stores (last in MENU_SOURCES) are read, not starved.
  for (const s of ["nuera-east-peoria", "high-haven-normal", "trinity-on-university"]) assert.ok(ran.get(s)!.length >= 3, s);
  // Control: the old fixed order starves the tail under the same caps.
  const fixed = simulate(slugs, caps.map((c) => Math.min(c, slugs.length - 1)), false);
  assert.equal(fixed.get(slugs[slugs.length - 1])!.length, 0);
});

// ---------------------------------------------------------------------------
// 3. High Haven Normal: only Normal's own page counts (first-purchase 20%,
//    not Elgin's 42.0% from the chain-wide pages). Page text below is
//    SYNTHETIC, built from the sentences the store pages state.
// ---------------------------------------------------------------------------

const HH = "https://highhavencannabis.com";
const HH_NORMAL = `${HH}/high-haven-normal-il-the-puff-palace/`;
const html = (title: string, body: string) =>
  new Response(`<html><head><title>${title}</title></head><body>${body}</body></html>`, { status: 200, headers: { "content-type": "text/html" } });
/** A response that arrived at `finalUrl` after redirects. */
const redirected = (res: Response, finalUrl: string) => { Object.defineProperty(res, "url", { value: finalUrl }); return res; };

// The chain-wide pages: Elgin's 42.0% with no store named, and the per-location list.
const CHAIN_42 = "<h2>High Rollers Club</h2><p>All first-time customers who sign up for the High Rollers Club will receive 42.0% Off First Purchase!</p>";
const NORMAL_20 = '<h1>The Puff Palace — Normal</h1><p>All first-time customers who sign up for the "High Rollers" club will receive 20% off first purchase.</p>';

test("high-haven-normal: deals come only from Normal's own page — First-time 20%, never Elgin's 42%", async () => {
  assert.deepEqual(STORE_PAGE_URLS["high-haven-normal"], [HH_NORMAL]);
  const asked: string[] = [];
  stubFetch(
    // Website on file is the chain root: the pinned store page still wins.
    [{ slug: "high-haven-normal", city: "Normal", website: `${HH}/` }],
    [deal("1", "high-haven-normal", "First-time 42% off", "website"), deal("2", "high-haven-normal", "First-time 20% off", "website")],
    (url) => {
      asked.push(url);
      if (url === HH_NORMAL) return html("Normal Dispensary - The Puff Palace by High Haven Cannabis", NORMAL_20);
      return html("High Haven Cannabis", CHAIN_42); // home, /deals, /rewards …
    }
  );
  const summary = await runCilScrape({ supabaseUrl: SB, serviceKey: "anon", mode: "live", apply: false, maxListings: 10, requestDelayMs: 0 });
  assert.deepEqual(asked, [HH_NORMAL]); // no chain page is even requested
  assert.deepEqual(summary.deals_found.map((d) => [d.title, d.source_url]), [["First-time 20% off", HH_NORMAL]]);
  assert.deepEqual(summary.deals_updated, [{ slug: "high-haven-normal", title: "First-time 20% off" }]);
  assert.deepEqual(summary.deals_aged, [{ slug: "high-haven-normal", title: "First-time 42% off" }]); // the false 42% is retired
});

test("high-haven-normal: if its page redirects to a chain or trashed page, nothing is read and nothing is retired", async () => {
  for (const finalUrl of [`${HH}/deals__trashed/normal-deals/`, `${HH}/rewards/`]) {
    stubFetch(
      [{ slug: "high-haven-normal", city: "Normal", website: `${HH}/` }],
      [deal("1", "high-haven-normal", "First-time 20% off", "website")],
      () => redirected(html("High Haven Cannabis", CHAIN_42), finalUrl)
    );
    const summary = await runCilScrape({ supabaseUrl: SB, serviceKey: "anon", mode: "live", apply: false, maxListings: 10, requestDelayMs: 0 });
    assert.deepEqual(summary.deals_found, [], finalUrl);
    assert.match(summary.fetch_errors[0].error, /^failed_read: 0 of 1 pages loaded/);
    assert.deepEqual(summary.deals_aged, []);
  }
});

test("offStorePage: trashed pages and redirects off a store's own path are not the store's page", () => {
  const store = "/high-haven-normal-il-the-puff-palace";
  assert.match(offStorePage(`${HH}/deals__trashed/normal-deals/`, `${HH_NORMAL}deals/`, store)!, /expired/);
  assert.match(offStorePage(`${HH}/deals__trashed/normal-deals/`, `${HH}/deals`, "")!, /expired/); // any store
  assert.match(offStorePage(`${HH}/deals/`, `${HH_NORMAL}deals/`, store)!, /off the store's page/);
  assert.match(offStorePage("https://risecannabis.com/x/", "https://revcanna.com/normal/", "/normal")!, /off the site/);
  assert.equal(offStorePage(HH_NORMAL, `${HH}/high-haven-normal-il-the-puff-palace`, store), null); // trailing slash
  assert.equal(offStorePage("https://www.highhavencannabis.com/high-haven-normal-il-the-puff-palace/specials/", `${HH_NORMAL}specials/`, store), null);
  assert.equal(offStorePage(`${HH}/deals/`, `${HH}/deals`, ""), null); // a root-website store: unchanged
});
