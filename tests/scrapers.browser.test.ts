// tests/scrapers.browser.test.ts
// Runs the readers' IN-BROWSER code in a real Chromium against local pages
// served through Playwright routes — no network, nothing leaves the machine.
// Proves the page-side pieces work (no tsx __name() breakage, card splitting,
// reading the Algolia key from the page's own request, the Trinity flow).
// Skipped when no Chromium is available.
//   npm run test:scrapers
//
// Page HTML here is SYNTHETIC (see the fixtures' _fixture notes); the Jane
// flower records served to the page are the real 2026-07-09 capture.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { chromium, type Browser, type Page } from "playwright-core";
import { captureStoreMenu, MENU_SOURCES, type MenuSource } from "../lib/scraper/menuCapture";
import { readDealCards, parseRiseDealCards, pageSaysAllIllinois } from "../lib/scraper/renderedDeals";

const fx = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const CHROME = process.env.PW_EXECUTABLE_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const skip = !existsSync(CHROME) && !process.env.PW_CHANNEL ? "no Chromium here (set PW_EXECUTABLE_PATH)" : false;

let browser: Browser;
before(async () => {
  if (skip) return;
  browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : { executablePath: CHROME });
});
after(async () => { await browser?.close(); });

const html = (body: string) => ({ status: 200, contentType: "text/html", body: `<!doctype html><html><body>${body}</body></html>` });
const run = (page: Page, slug: string, source: MenuSource) =>
  captureStoreMenu({ page, slug, source, budgetMs: 30_000, navTimeoutMs: 10_000, passAgeGate: async () => false, isAllowed: async () => true });

// ---- Jane ------------------------------------------------------------------

const ALG = "https://abcd1234ef-dsn.algolia.net";
const flower = fx("jane-algolia-1517-flower.json");
const ve = fx("jane-algolia-vape-edible.synthetic.json");

async function routeAlgolia(page: Page, seen: string[]) {
  await page.route(`${ALG}/**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    seen.push(new URL(req.url()).searchParams.get("x-algolia-api-key") || "");
    const params = new URLSearchParams(JSON.parse(req.postData() || "{}").requests?.[0]?.params || "");
    const f = params.get("filters") || "";
    const body = /kind:"vape"/.test(f) ? ve.vape : /kind:"edible"/.test(f) ? ve.edible : flower;
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
  });
}

// The store page makes its own Algolia query, with the key it was served.
const janePage = (key: string, storeId: number) => html(`
  <h1>nuEra East Peoria (REC)</h1>
  <script>
    fetch("${ALG}/1/indexes/*/queries?x-algolia-api-key=${key}&x-algolia-application-id=ABCD1234EF", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: JSON.stringify({ requests: [{ indexName: "menu-products-production", params: "query=&filters=store_id%3A${storeId}%20AND%20kind%3A%22flower%22&hitsPerPage=24" }] })
    });
  </script>`);

test("browser: Jane menu — key read from the page's own Algolia call, all three units read", { skip }, async () => {
  const page = await browser.newPage();
  const keys: string[] = [];
  await routeAlgolia(page, keys);
  await page.route("https://nueracannabis.com/**", (r) => r.fulfill(janePage("rotatedkey-today-0123456789abcdef", 1517)));
  const r = await run(page, "nuera-east-peoria", MENU_SOURCES["nuera-east-peoria"]);
  await page.close();
  assert.equal(r.status, "ok", r.error);
  assert.equal(r.platform, "jane");
  assert.equal(r.dataCalls, 3);
  // The replayed queries used exactly the key the page used today.
  assert.ok(keys.length >= 4 && keys.every((k) => k === "rotatedkey-today-0123456789abcdef"));
  const n = (ref: string) => r.items.filter((i) => i.ref === ref).length;
  assert.deepEqual([n("eighth"), n("cart_1g"), n("gummies_100mg")], [18, 5, 2]);
});

test("browser: Jane menu that queries the MED store is refused", { skip }, async () => {
  const page = await browser.newPage();
  await routeAlgolia(page, []);
  await page.route("https://nueracannabis.com/**", (r) => r.fulfill(janePage("k0123456789abcdef0123", 1518)));
  const r = await run(page, "nuera-east-peoria", MENU_SOURCES["nuera-east-peoria"]);
  await page.close();
  assert.equal(r.status, "error");
  assert.match(r.error!, /queried store 1518, expected REC store 1517/);
});

test("browser: Jane key from page config when no Algolia call is seen; clear error when there is none", { skip }, async () => {
  const cfg = fx("jane-algolia-requests.synthetic.json").config_html as string;
  let page = await browser.newPage();
  const keys: string[] = [];
  await routeAlgolia(page, keys);
  await page.route("https://nueracannabis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: cfg }));
  let r = await run(page, "nuera-east-peoria", MENU_SOURCES["nuera-east-peoria"]);
  await page.close();
  assert.equal(r.status, "ok", r.error);
  assert.ok(keys.every((k) => k === "fakeconfigkey0123456789abcdef0123"));

  page = await browser.newPage();
  await page.route("https://nueracannabis.com/**", (r) => r.fulfill(html("<h1>menu</h1>")));
  r = await run(page, "nuera-east-peoria", MENU_SOURCES["nuera-east-peoria"]);
  await page.close();
  assert.equal(r.status, "error");
  assert.match(r.error!, /no Algolia search key found/);
});

// ---- Jane without Algolia (2026-11-10 shapes; synthetic pages) ---------------

const recsFor = (kind: string): unknown[] =>
  kind === "flower" ? flower.results[0].hits : kind === "vape" ? ve.vape.results[0].hits : ve.edible.results[0].hits;

// Bloom: a React Router app whose category routes hold recommendedSortResults.
// The fake router serves 15 products for a plain visit and everything for
// ?currentPage=20, like the real one (15 + 60·(N−1)).
const bloomPage = (data: Record<string, unknown[]>) => html(`
  <h1>nuEra East Peoria (REC)</h1>
  <script>
    const DATA = ${JSON.stringify(data)};
    window.__BLOOM_CLIENT_ENV__ = {};
    window.__reactRouterDataRouter = {
      basename: "/shop",
      state: { navigation: { state: "idle" }, loaderData: {} },
      navigate: async (to) => {
        const m = to.match(/^\\/store\\/(\\d+)\\/(\\w+)\\?currentPage=(\\d+)$/);
        history.replaceState(null, "", "/shop" + to);
        const all = DATA[m[2]] || [];
        const n = 15 + 60 * (Number(m[3]) - 1);
        window.__reactRouterDataRouter.state.loaderData = {
          root: {},
          ["routes/_menu.store.$storeId." + m[2] + "._index"]: {
            recommendedSortResults: JSON.stringify({ cachedProducts: [], totalProducts: all.length, products: all.slice(0, n).map((a) => ({ attributes: a })) }),
          },
        };
      },
    };
  </script>`);

test("browser: Jane Bloom menu — read through the page's own router, all three units", { skip }, async () => {
  const page = await browser.newPage();
  await page.route("https://nueracannabis.com/**", (r) => r.fulfill(bloomPage({ flower: recsFor("flower"), vape: recsFor("vape"), edible: recsFor("edible") })));
  const r = await run(page, "nuera-east-peoria", MENU_SOURCES["nuera-east-peoria"]);
  await page.close();
  assert.equal(r.status, "ok", r.error);
  assert.equal(r.platform, "jane");
  assert.equal(r.dataCalls, 3);
  const n = (ref: string) => r.items.filter((i) => i.ref === ref).length;
  assert.deepEqual([n("eighth"), n("cart_1g"), n("gummies_100mg")], [18, 5, 2]); // same records as the Algolia test
});

test("browser: Jane Bloom menu for another store than expected is refused", { skip }, async () => {
  const page = await browser.newPage();
  await page.route("https://nueracannabis.com/**", (r) => r.fulfill(bloomPage({})));
  const src = { ...MENU_SOURCES["nuera-east-peoria"], url: "https://nueracannabis.com/shop/store/1518/featured" };
  const r = await run(page, "nuera-east-peoria", src);
  await page.close();
  assert.equal(r.status, "error");
  assert.match(r.error!, /queried store 1518, expected REC store 1517/);
});

test("browser: Jane frameless embed — the page's own dmerch search replayed per category, rest via smartpage", { skip }, async () => {
  const page = await browser.newPage();
  const keys: string[] = [];
  const bodies: Array<Record<string, unknown>> = [];
  const STORE = 6285;
  const mine = (kind: string) => (recsFor(kind) as Array<Record<string, unknown>>).map((a, i) => ({ ...a, store_id: a.store_id === 1517 ? STORE : a.store_id, objectID: `${kind}-${i}` }));
  await page.route("https://dmerch.iheartjane.com/**", async (route) => {
    const req = route.request();
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const u = new URL(req.url());
    keys.push(u.searchParams.get("jdm_api_key") || "");
    const b = JSON.parse(req.postData() || "{}");
    bodies.push(b);
    let products: unknown[] = [];
    if (u.pathname === "/v2/smart") {
      const kind = String(b.search_filter || "").match(/root_types:"(\w+)"/)?.[1];
      // The first 3 come with their record, the rest as bare ids (like the real 60).
      products = kind ? mine(kind).map((a, i) => (i < 3 ? { object_id: a.objectID, store_id: STORE, search_attributes: a } : { object_id: a.objectID, store_id: STORE })) : [];
    } else if (u.pathname === "/v2/smartpage") {
      const all = [...mine("flower"), ...mine("vape"), ...mine("edible")];
      products = (b.object_ids as string[]).map((id) => ({ object_id: id, search_attributes: all.find((a) => a.objectID === id) }));
    }
    await route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ products }) });
  });
  await page.route("https://highhavencannabis.com/**", (r) => r.fulfill(html(`<h1>The Puff Palace</h1><script>
    fetch("https://dmerch.iheartjane.com/v2/smart?jdm_api_key=page-served-key-123&jdm_source=monolith", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ app_mode: "framelessEmbed", jane_device_id: "dev1", page_size: 60, placement: "menu_inline_table", search_filter: "", store_ids: [${STORE}] })
    });
  </script>`)));
  const r = await run(page, "high-haven-normal", MENU_SOURCES["high-haven-normal"]);
  await page.close();
  assert.equal(r.status, "ok", r.error);
  assert.equal(r.platform, "jane");
  assert.ok(keys.every((k) => k === "page-served-key-123"));
  // Replays keep the page's own store and device; only the category and size change.
  const replays = bodies.slice(1).filter((b) => "search_filter" in b);
  assert.deepEqual(replays.map((b) => b.search_filter), ['root_types:"flower"', 'root_types:"vape"', 'root_types:"edible"']);
  assert.ok(replays.every((b) => JSON.stringify(b.store_ids) === `[${STORE}]` && b.jane_device_id === "dev1"));
  const n = (ref: string) => r.items.filter((i) => i.ref === ref).length;
  assert.deepEqual([n("eighth"), n("cart_1g"), n("gummies_100mg")], [18, 5, 2]);
});

// ---- High Haven: listed as Jane, page actually calls Dutchie ----------------

test("browser: store listed as Jane whose page calls Dutchie is read with the Dutchie reader (alsoTry)", { skip }, async () => {
  const page = await browser.newPage();
  const filters: Array<Record<string, unknown>> = [];
  const mk = (name: string, type: string, sub: string, opt: string, price: number, extra: Record<string, unknown> = {}) => ({
    id: name, Name: name, brandName: "B", type, subcategory: sub, Options: [opt], recPrices: [price], ...extra,
  });
  await page.route("https://highhavencannabis.com/api-1/graphql**", async (route) => {
    const v = JSON.parse(new URL(route.request().url()).searchParams.get("variables") || "{}");
    const pf = v.productsFilter;
    filters.push(pf);
    let products: unknown[] = [];
    if (pf.types?.[0] === "Flower" && pf.option === "1/8oz") products = [mk("Eighth A", "Flower", "", "1/8oz", 35)];
    if (pf.types?.[0] === "Vaporizers") products = [mk("Cart A", "Vaporizers", "cartridges", "1g", 40)];
    if (pf.types?.[0] === "Edible") products = [mk("Gummy A", "Edible", "gummies", "100mg", 20, { measurements: { netWeight: { unit: "MILLIGRAMS", values: [100] } } })];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { filteredProducts: { products, queryInfo: { totalPages: 1 } } } }) });
  });
  // The menu opens on a search for edibles — not the flower-eighths view.
  const vars = encodeURIComponent(JSON.stringify({ productsFilter: { dispensaryId: "hh-normal", pricingType: "rec", types: ["Edible"], search: "wyld", brandId: "x" }, page: 0, perPage: 50 }));
  await page.route("https://highhavencannabis.com/high-haven-normal-il-the-puff-palace/**", (r) =>
    r.fulfill(html(`<h1>The Puff Palace</h1><script>fetch("/api-1/graphql?operationName=FilteredProducts&variables=${vars}")</script>`))
  );
  const r = await run(page, "high-haven-normal", MENU_SOURCES["high-haven-normal"]);
  await page.close();
  assert.equal(r.platform, "dutchie");
  assert.equal(r.status, "ok", r.error);
  assert.deepEqual(r.items.map((i) => [i.ref, i.regular]).sort(), [["cart_1g", 40], ["eighth", 35], ["gummies_100mg", 20]]);
  // The page's own narrowing filters (search, brand) were dropped before the unit queries.
  const replayed = filters.slice(1);
  assert.ok(replayed.length >= 3 && replayed.every((f) => f.dispensaryId === "hh-normal" && !("search" in f) && !("brandId" in f)));
});

// ---- Trinity ----------------------------------------------------------------

const card = (href: string, name: string, lines: string[]) =>
  `<div class="card"><a href="${href}"><div>${name}</div></a>${lines.map((l) => `<div>${l}</div>`).join("")}</div>`;

async function routeTrinity(page: Page, glenTop: string) {
  await page.route("https://www.trinitydispensaries.com/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") {
      return route.fulfill(html(`<nav><a href="/glen">Trinity on Glen</a><a href="/glen">3125 N University St</a><a href="/university">Trinity - University St</a>
        <a href="/product-group/glen-hot-90">Glen Hot $90 Ounces</a></nav>`));
    }
    if (path === "/glen") return route.fulfill(html(`<header>${glenTop}</header><a href="/glen/flower">Flower</a><a href="/glen/vapes">Vapes</a><a href="/glen/edibles">Edibles</a>`));
    if (path === "/glen/flower") {
      return route.fulfill(html(`<div class="grid">
        ${card("/product/pastries", "Pastries #34", ["Simply Herb", "THC 24.1%", "$30", "/", "3.5g"])}
        ${card("/product/mayday", "Mayday", ["Bedford Grow", "$45", "/", "3.5g", "$80", "/", "7g"])}
        ${card("/product/jokerz", "Jokerz 31", ["$35", "$50", "/", "3.5g"])}
      </div>`));
    }
    if (path === "/glen/vapes") return route.fulfill(html(card("/product/cart", "Lemon OG Cart", ["$42", "/", "1g"])));
    if (path === "/glen/edibles") return route.fulfill(html(card("/product/gummy", "Wyld Gummies", ["$22", "/", "100mg"])));
    return route.fulfill({ status: 404, body: "" });
  });
}

test("browser: Trinity — follows the store's own link, confirms the store, reads cards per category", { skip }, async () => {
  const page = await browser.newPage();
  await routeTrinity(page, "Shopping at Trinity - Glen Ave");
  const r = await run(page, "trinity-on-glen", MENU_SOURCES["trinity-on-glen"]);
  await page.close();
  assert.equal(r.status, "ok", r.error);
  assert.equal(r.pageLoads, 5); // home, store, three categories
  const eighths = r.items.filter((i) => i.ref === "eighth").map((i) => [i.name, i.regular, i.sale]).sort();
  assert.deepEqual(eighths, [["Jokerz 31", 50, 35], ["Mayday", 45, null], ["Pastries #34", 30, null]]);
  assert.deepEqual(r.items.filter((i) => i.ref !== "eighth").map((i) => [i.ref, i.regular]).sort(), [["cart_1g", 42], ["gummies_100mg", 22]]);
});

test("browser: Trinity — a menu page that names both stores is not read", { skip }, async () => {
  const page = await browser.newPage();
  await routeTrinity(page, "Trinity - Glen Ave | Trinity - University St");
  const r = await run(page, "trinity-on-glen", MENU_SOURCES["trinity-on-glen"]);
  await page.close();
  assert.equal(r.status, "error");
  assert.match(r.error!, /names both stores/);
  assert.equal(r.items.length, 0);
});

// Trinity, 2026-11-10: no store links; a store-picker dialog (radio options +
// "SHOP PICKUP") sets a cookie, and the selector button names the store.
async function routeTrinityPicker(page: Page, opts: { pagedFlower?: boolean } = {}) {
  await page.route("https://www.trinitydispensaries.com/**", async (route) => {
    const u = new URL(route.request().url());
    const store = (route.request().headers()["cookie"] || "").match(/treez_selectedStoreId=([\w-]+)/)?.[1];
    const label = store === "trinity-glen" ? "PICKUP<br>Trinity Glen<br>2301 W Glen Ave, Peoria, IL 61614"
      : store === "trinity-university" ? "PICKUP<br>Trinity University<br>3125 N University St, Peoria, IL 61604" : "How do you want to shop?";
    const header = `<header><button aria-label="Open store selector and purchase method" onclick="document.getElementById('dlg').hidden=false">${label}</button>
      <div id="dlg" role="dialog" ${store ? "hidden" : ""}>
        <label><input type="radio" name="s" value="trinity-glen" aria-label="Select store: Trinity Glen - Peoria, IL">Trinity Glen - Peoria, IL</label><span>2301 W Glen Ave</span>
        <label><input type="radio" name="s" value="trinity-university" aria-label="Select store: Trinity University - Peoria, IL">Trinity University - Peoria, IL</label><span>3125 N University St</span>
        <button onclick="const v=document.querySelector('input[name=s]:checked').value; document.cookie='treez_selectedStoreId='+v+'; path=/'; location.reload()">SHOP PICKUP</button>
      </div></header>
      <nav><a href="/collection/flower">Flower</a><a href="/collection/cartridge">Vapes</a><a href="/collection/edible">Edibles</a></nav>`;
    const price = store === "trinity-university" ? 33 : 27;
    if (u.pathname === "/") return route.fulfill(html(`${header}<p>*Trinity - Glen* Hot $90 Ounce Deals</p>`));
    if (u.pathname === "/collection/flower") {
      const pg = Number(u.searchParams.get("page") || 1);
      const next = opts.pagedFlower && pg < 2 ? `<a href="/collection/flower?page=${pg + 1}">Next</a>` : "";
      const body = pg === 1
        ? card("/product/rainbow-beltz", "", ["RAINBOW BELTZ | 3.5G | TWENTY TWENTY", `$${price}`, "/", "3.5g", "$45"])
        : card("/product/goon", "", ["Goon Berries | 3.5g | Signature", "$30", "/", "3.5g"]);
      return route.fulfill(html(`${header}${body}${next}`));
    }
    if (u.pathname === "/collection/cartridge") return route.fulfill(html(`${header}${card("/product/cart", "Lemon OG Cart", ["$42", "/", "1g"])}`));
    if (u.pathname === "/collection/edible") return route.fulfill(html(`${header}${card("/product/gummy", "Wyld Gummies 100mg", ["$16", "/", "each", "$20"])}`));
    return route.fulfill({ status: 404, body: "" });
  });
}

test("browser: Trinity — picks the store in the site's own store picker, then reads each category", { skip }, async () => {
  for (const [slug, price] of [["trinity-on-glen", 27], ["trinity-on-university", 33]] as const) {
    const page = await browser.newPage();
    await routeTrinityPicker(page, { pagedFlower: true });
    // A full store budget, so the reader also follows the flower grid's "Next" page.
    const r = await captureStoreMenu({ page, slug, source: MENU_SOURCES[slug], budgetMs: 85_000, navTimeoutMs: 10_000, passAgeGate: async () => false, isAllowed: async () => true });
    await page.close();
    assert.equal(r.status, "ok", `${slug}: ${r.error}`);
    assert.equal(r.pageLoads, 5); // home (the picker's own reload is the site's, not ours), flower ×2, vapes, edibles
    const eighths = r.items.filter((i) => i.ref === "eighth").map((i) => [i.name, i.regular, i.sale]).sort();
    assert.deepEqual(eighths, [["Goon Berries | 3.5g | Signature", 30, null], ["RAINBOW BELTZ | 3.5G | TWENTY TWENTY", 45, price]]);
    assert.deepEqual(r.items.filter((i) => i.ref !== "eighth").map((i) => [i.ref, i.regular, i.sale]).sort(), [["cart_1g", 42, null], ["gummies_100mg", 20, 16]]);
  }
});

// ---- RISE deals page: card splitting in the browser ---------------------------

test("browser: RISE deals page splits into cards; nav store names never attach to a deal", { skip }, async () => {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html><body>
    <nav><a>Bloom Wellness Peoria</a><a>Bloom Wellness Normal (Bradford)</a><h3>20% off everything in the nav</h3></nav>
    <main>
      <h1>Illinois Dispensary Deals</h1>
      <p>Deals change daily.</p>
      <section class="grid">
        <div class="deal"><div class="deal-title"><h3>30% off Verano and The Essence brands</h3></div><p>Valid at Bloom Wellness Peoria</p><a>Shop Now</a></div>
        <div class="deal"><h3>35% off Rove, Cresco Brands, and Joos Disposables (1g|2g)</h3><p>Available at all Illinois locations</p></div>
        <div class="deal"><h3>40% off Elevate vapes</h3><p>Bloom Wellness Normal (Bradford)</p></div>
        <div class="deal"><h3>25% off Good Green edibles</h3><p>RISE Niles</p></div>
      </section>
    </main></body></html>`);
  const got = await readDealCards(page, 10_000);
  await page.close();
  assert.equal(got.cards.length, 4);
  assert.deepEqual(got.cards[0], ["30% off Verano and The Essence brands", "Valid at Bloom Wellness Peoria", "Shop Now"]);
  const { deals } = parseRiseDealCards(got.cards, { pageAllIllinois: pageSaysAllIllinois(got.pageLines), now: new Date("2026-09-27T12:00:00-05:00") });
  assert.deepEqual(deals.map((d) => [d.title, d.stores.length]), [
    ["30% off Verano and The Essence brands", 1],
    ["35% off Rove, Cresco Brands, and Joos Disposables (1g|2g)", 3],
    ["40% off Elevate vapes", 1],
  ]);
});
