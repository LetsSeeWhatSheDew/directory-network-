// tests/scrapers.test.ts
// Fixture tests for the rendered scraper's menu readers and the RISE chain
// deals reader. No browser, no network: saved fixtures in tests/fixtures/.
//   npm run test:scrapers
//
// Fixtures marked .synthetic. are hand-written in a documented shape (the
// file's own _fixture note says what it is based on); jane-algolia-1517-flower
// is REAL (nuEra East Peoria's own menu, captured 2026-07-09).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  janeCandidates, janeHitsToCandidates, parseAlgoliaRequest, findAlgoliaConfig, htmlCardCandidates, splitCandidates,
  type JaneRecord, type HtmlCard, type MenuCandidate,
} from "../lib/scraper/menuCapture";
import { parseRiseDealCards, pageSaysAllIllinois, isRiseIlDealsUrl, isVagueDealName, tidyPromoName, notACannabisDeal } from "../lib/scraper/renderedDeals";

const fx = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const price = (c: MenuCandidate) => c.sale ?? c.regular;
const NOW = new Date("2026-09-27T12:00:00-05:00");

// ---------------------------------------------------------------------------
// Jane (Algolia) — real flower records
// ---------------------------------------------------------------------------

test("jane: real nuEra East Peoria flower records → eighths only, specials traced, >35% THC dropped", () => {
  const hits: JaneRecord[] = fx("jane-algolia-1517-flower.json").results[0].hits;
  assert.equal(hits.length, 30);
  const eighths = janeHitsToCandidates(hits, 1517, "eighth");
  // 20 records sell an eighth; quarter/half/ounce-only popcorn and shake don't.
  assert.equal(eighths.length, 20);
  assert.ok(eighths.every((c) => c.weight === "eighth ounce" && c.productId));
  const { kept, dropped } = splitCandidates(eighths);
  assert.equal(kept.length, 18);
  // Potency is read for the eighth itself (Kandy Kush: 34.16% overall, 36.96% for the eighth).
  assert.deepEqual(dropped.map((d) => d.name).sort(), ["nuEra · Kandy Kush", "nuEra · Royal Gorilla"]);
  assert.ok(dropped.every((d) => /THC above 35%/.test(d.reason)));
  // The plain 40%-off product special is the price, and every number agrees.
  const cheapest = kept.reduce((a, b) => (price(b) < price(a) ? b : a));
  assert.equal(cheapest.brand, "Interstate 420");
  assert.equal(cheapest.regular, 40);
  assert.equal(cheapest.sale, 24);
  const nuera = kept.find((c) => c.brand === "nuEra" && c.name === "Gelly Roll")!;
  assert.equal(nuera.regular, 50);
  assert.equal(nuera.sale, 30);
  // Same strain, two brands → two products.
  assert.equal(kept.filter((c) => c.name === "Black Inferno").length, 2);
  // Flower records never become carts or gummies.
  assert.equal(janeHitsToCandidates(hits, 1517, "cart_1g").length, 0);
  assert.equal(janeHitsToCandidates(hits, 1517, "gummies_100mg").length, 0);
  // A different store id reads nothing.
  assert.equal(janeHitsToCandidates(hits, 1518, "eighth").length, 0);
});

test("jane: carts — 1g only, cartridges only, plain product specials only", () => {
  const hits: JaneRecord[] = fx("jane-algolia-vape-edible.synthetic.json").vape.results[0].hits;
  const carts = janeHitsToCandidates(hits, 1517, "cart_1g");
  const byId = new Map(carts.map((c) => [c.productId, c]));
  assert.deepEqual([...byId.keys()].sort(), ["9001", "9002", "9005", "9006", "9009"]);
  assert.equal(byId.get("9001")!.brand, "Cresco"); // ™ stripped
  assert.equal(byId.get("9001")!.regular, 45);
  assert.equal(byId.get("9001")!.sale, null);
  assert.equal(byId.get("9002")!.sale, 35); // product special, numbers agree
  assert.equal(byId.get("9005")!.sale, null); // brand / bundle specials ignored
  assert.equal(byId.get("9006")!.sale, null); // special base ≠ shelf price → not trusted
  assert.equal(byId.get("9009")!.regular, 38); // each-priced, amount "1g"
  // Disposable, half-gram-only, MED-only and other-store records: nothing.
  for (const id of ["9003", "9004", "9007", "9008"]) assert.ok(!byId.has(id), id);
});

test("jane: gummies — 100mg total, gummies/chews only, no ratio products", () => {
  const hits: JaneRecord[] = fx("jane-algolia-vape-edible.synthetic.json").edible.results[0].hits;
  const raw = janeHitsToCandidates(hits, 1517, "gummies_100mg");
  const { kept, dropped } = splitCandidates(raw);
  assert.deepEqual(kept.map((c) => c.productId).sort(), ["9101", "9106"]);
  assert.equal(kept.find((c) => c.productId === "9106")!.sale, 17.5);
  assert.ok(kept.every((c) => c.weight === "100mg" && c.thcPct === null));
  // "10pk 10mg" name disagrees with 100mg → never a candidate; 1:1 CBD is dropped by the shared rules.
  assert.ok(!raw.some((c) => c.productId === "9102"));
  assert.ok(dropped.some((d) => /1:1/.test(d.name) && /CBD\/ratio/.test(d.reason)));
  // Chocolate bar, 200mg chews: nothing.
  assert.ok(!raw.some((c) => c.productId === "9104" || c.productId === "9105"));
});

test("jane: a record without the unit's price reads nothing", () => {
  const r: JaneRecord = { store_id: 1, kind: "flower", name: "X", available_weights: ["eighth ounce"] };
  assert.deepEqual(janeCandidates(r, "eighth"), []);
});

// ---------------------------------------------------------------------------
// Jane — the Algolia key comes from the page, never from code
// ---------------------------------------------------------------------------

test("algolia: key, app id, index and store filter read from the page's own request", () => {
  const f = fx("jane-algolia-requests.synthetic.json");
  const v4 = parseAlgoliaRequest(f.v4_multi.url, f.v4_multi.headers, f.v4_multi.postData)!;
  assert.equal(v4.appId, "ABCD1234EF");
  assert.equal(v4.apiKey, "fakekey0123456789abcdef0123456789");
  assert.equal(v4.indexName, "menu-products-production");
  assert.deepEqual(v4.storeIds, [1517]);
  assert.equal(v4.storeClause, "store_id = 1517");
  const v5 = parseAlgoliaRequest(f.v5_headers.url, f.v5_headers.headers, f.v5_headers.postData)!;
  assert.equal(v5.apiKey, "fakekey-from-headers-0123456789abcd");
  assert.equal(v5.indexName, "menu-products-production");
  assert.deepEqual(v5.storeIds, [1519]);
  assert.equal(v5.storeClause, "store_id:1519");
  // Not a product index / no key → not a handle.
  assert.equal(parseAlgoliaRequest(f.stores_index.url, f.stores_index.headers, f.stores_index.postData), null);
  assert.equal(parseAlgoliaRequest(f.no_key.url, f.no_key.headers, f.no_key.postData), null);
  assert.equal(parseAlgoliaRequest("https://noxx.com/api-1/graphql?x-algolia-api-key=x", {}, null), null);
});

test("algolia: config fallback finds a key only when it is named as an Algolia key", () => {
  const f = fx("jane-algolia-requests.synthetic.json");
  assert.deepEqual(findAlgoliaConfig(f.config_html), { appId: "ABCD1234EF", apiKey: "fakeconfigkey0123456789abcdef0123", indexName: "menu-products-production" });
  const esc = findAlgoliaConfig(f.config_escaped)!;
  assert.equal(esc.apiKey, "fakeescapedkey0123456789abcdef01");
  assert.equal(esc.indexName, null); // → the reader reports "no index name", never guesses one
  assert.equal(findAlgoliaConfig(f.config_none), null); // a Google Maps apiKey is not an Algolia key
});

test("menuCapture: no Algolia key is hard-coded in the reader", () => {
  const src = readFileSync(new URL("../lib/scraper/menuCapture.ts", import.meta.url), "utf8");
  assert.ok(!/x-algolia-api-key=[0-9a-f]{16,}/i.test(src));
  assert.ok(!/apiKey:\s*["'][0-9a-f]{32}["']/i.test(src));
});

// ---------------------------------------------------------------------------
// Trinity (Treez HTML cards)
// ---------------------------------------------------------------------------

test("trinity: flower cards → eighths, one card at a time", () => {
  const cards: HtmlCard[] = fx("trinity-cards.synthetic.json").flower;
  const raw = cards.flatMap((c) => htmlCardCandidates(c, "eighth", "flower"));
  const by = new Map(raw.map((c) => [c.productId, c]));
  assert.equal(by.get("/product/pastries-34-3-5g")!.regular, 30);
  assert.equal(by.get("/product/pastries-34-3-5g")!.thcPct, 24.1);
  assert.equal(by.get("/product/mayday")!.regular, 45); // the 3.5g price, not the 7g one
  assert.equal(by.get("/product/jokerz-sale")!.sale, 35);
  assert.equal(by.get("/product/jokerz-sale")!.regular, 50);
  // "2 for $70" is a bundle: the card's own shelf price stands, no sale, and $70 is never read as a price.
  assert.equal(by.get("/product/flan-bundle")!.regular, 40);
  assert.equal(by.get("/product/flan-bundle")!.sale, null);
  assert.equal(by.get("/product/name-size")!.regular, 38); // size in the name, one price on the card
  assert.ok(!by.has("/product/ounce")); // 28g only
  assert.ok(!by.has("/product/two-prices-no-size")); // ambiguous
  const { kept, dropped } = splitCandidates(raw);
  assert.ok(dropped.some((d) => /Kief Coated/.test(d.name) && /infused/.test(d.reason)));
  assert.ok(dropped.some((d) => /Gas Face/.test(d.name) && /THC above 35%/.test(d.reason)));
  assert.ok(kept.every((c) => c.weight === "3.5g"));
  // Card on the wrong category page reads nothing.
  assert.equal(htmlCardCandidates(cards[0], "eighth", "vape").length, 0);
});

test("trinity: vape and edible cards", () => {
  const f = fx("trinity-cards.synthetic.json");
  const carts = (f.vape as HtmlCard[]).flatMap((c) => htmlCardCandidates(c, "cart_1g", "vape"));
  assert.deepEqual(carts.map((c) => [c.productId, c.regular]), [["/product/cart-1g", 42]]);
  const gummies = (f.edible as HtmlCard[]).flatMap((c) => htmlCardCandidates(c, "gummies_100mg", "edible"));
  assert.deepEqual(gummies.map((c) => [c.productId, c.regular]), [["/product/gummy", 22]]);
});

// ---------------------------------------------------------------------------
// RISE chain-wide IL deals → Bloom Wellness stores
// ---------------------------------------------------------------------------

const PEORIA = "beyond-hello-peoria";
const BRADFORD = "ayr-wellness-normal";
const NORTHBROOK = "revolution-dispensary-normal";
const ALL = [PEORIA, BRADFORD, NORTHBROOK];

test("rise: a deal goes only to the stores its own card names, or all three for 'all Illinois locations'", () => {
  const f = fx("rise-il-deals.synthetic.json");
  const { deals, skipped } = parseRiseDealCards(f.cards, { pageAllIllinois: pageSaysAllIllinois(f.pageLines), now: NOW });
  assert.equal(pageSaysAllIllinois(f.pageLines), false);
  assert.deepEqual(deals, [
    { title: "30% off Verano and The Essence brands", stores: [PEORIA] },
    { title: "35% off Rove, Cresco Brands, and Joos Disposables (1g|2g)", stores: ALL },
    { title: "40% off Elevate vapes", stores: [BRADFORD] }, // brand-specific stays brand-specific
    { title: "20% off RYTHM flower", stores: [NORTHBROOK] },
  ]);
  const why = new Map(skipped.map((s) => [s.card, s.reason]));
  assert.match(why.get("25% off Good Green edibles")!, /names no Bloom store/); // "Normal" alone is ambiguous
  assert.match(why.get("BOGO 50% off Dogwalkers pre-rolls")!, /names no Bloom store/); // other RISE stores
  assert.match(why.get("20% off all glass pipes and papers")!, /accessory/);
  assert.match(why.get("Up to 30% off")!, /vague/);
  assert.match(why.get("15% off Incredibles gummies")!, /exception/);
  assert.match(why.get("Daily Deals")!, /no line on the card states an offer/);
  assert.match(why.get("10% off Aeriz 3.5g")!, /date on the card has passed/);
  assert.match(why.get("25% off Cresco flower")!, /names no Bloom store/); // bare "Northbrook" is a Chicago suburb too
  assert.match(why.get("$25 eighths of Simply Herb")!, /names no Bloom store/); // East Peoria ≠ Peoria
});

test("rise: a page-wide 'all Illinois locations' sentence covers only cards that name no store or place", () => {
  const f = fx("rise-il-deals.synthetic.json");
  assert.equal(pageSaysAllIllinois(f.pageLinesAllIl), true);
  assert.equal(pageSaysAllIllinois(f.pageLinesAllIlUnless), false); // "unless noted" → not trusted
  const { deals } = parseRiseDealCards(f.cards, { pageAllIllinois: true, now: NOW });
  const titles = deals.map((d) => d.title);
  assert.ok(!titles.includes("25% off Good Green edibles")); // names "Bloom Wellness Normal"
  assert.ok(!titles.includes("BOGO 50% off Dogwalkers pre-rolls")); // names other RISE stores
  assert.ok(!titles.includes("25% off Cresco flower")); // names a place
  assert.ok(!titles.includes("$25 eighths of Simply Herb"));
  assert.equal(deals.length, 4);
});

test("rise: one card's discount never lands on another card's name", () => {
  const { deals } = parseRiseDealCards(
    [["THIRSTY THURSDAYS", "Shop Now", "Bloom Wellness Peoria"], ["25% OFF MILE HIGH LIVE ROSIN", "All Illinois locations"]],
    { now: NOW }
  );
  assert.deepEqual(deals, [{ title: "25% OFF MILE HIGH LIVE ROSIN", stores: ALL }]);
});

test("rise: deals page URL and vague-name rules", () => {
  assert.ok(isRiseIlDealsUrl("https://risecannabis.com/dispensaries/illinois/deals/"));
  assert.ok(!isRiseIlDealsUrl("https://risecannabis.com/dispensaries/illinois/bloom-wellness-peoria/"));
  for (const v of ["Up to 30% off", "Save 20%", "Daily Deals 25% off", "20% off select products"]) assert.ok(isVagueDealName(v), v);
  for (const ok of ["25% off everything", "40% off Elevate vapes", "$25 eighths", "BOGO Wyld gummies"]) assert.ok(!isVagueDealName(ok), ok);
});

test("promo hygiene moved to lib unchanged", () => {
  assert.equal(tidyPromoName("Midweek Cart BOGO!!!!"), "Midweek Cart BOGO!");
  assert.ok(notACannabisDeal("Accessory Sale 20% off lighters"));
  assert.ok(!notACannabisDeal("20% off Kanha gummies"));
});
