// tests/menu/adapters.test.ts
// Offline parser tests for the reconciled Dutchie / Sweed / Joint
// adapters against LIVE-shape fixtures (Chrome Round 2 recon).
//
// Run: npx tsx tests/menu/adapters.test.ts

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { dutchieAdapter } from "../../lib/scraper/menu/adapters/dutchie";
import { sweedAdapter } from "../../lib/scraper/menu/adapters/sweed";
import { jointAdapter } from "../../lib/scraper/menu/adapters/joint";
import type { StoreRef } from "../../lib/scraper/menu/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const loadFixture = (name: string): Promise<unknown> =>
  readFile(join(process.cwd(), "tests", "fixtures", "menu", name), "utf8").then(JSON.parse);

const noxx: StoreRef = {
  id: "x", slug: "noxx-east-peoria", name: "NOXX", city: "East Peoria",
  platform: "dutchie", platform_store_id: "65772a69ac53410009424572",
  menu_url: "https://dutchie.com/dispensary/noxx-peoria",
  graphql_endpoint: "https://dutchie.com/api-4/graphql",
};

const trinityGlen: StoreRef = {
  id: "x", slug: "trinity-peoria-glen", name: "Trinity", city: "Peoria",
  platform: "dutchie", platform_store_id: "5f1084a105efe300b6392001",
  menu_url: "https://dutchie.com/dispensary/trinity-on-glen",
  graphql_endpoint: "https://dutchie.com/api-4/graphql",
};

const ivy: StoreRef = {
  id: "x", slug: "ivy-hall-peoria-heights", name: "Ivy Hall", city: "Peoria",
  platform: "sweed", platform_store_id: "169",
  menu_url: "https://ivyhalldispensary.com/locations/peoria/menu", graphql_endpoint: null,
};

const cookies: StoreRef = {
  id: "x", slug: "cookies-peoria-heights", name: "Cookies", city: "Peoria Heights",
  platform: "joint", platform_store_id: "5478",
  menu_url: "https://peoriaheights.cookies.co/menu/", graphql_endpoint: null,
};

(async () => {
  // ---------------- DUTCHIE NOXX (api-4 paginate shape) ----------------
  {
    const r = await dutchieAdapter.fetch(noxx, { fixtureLoader: loadFixture });
    if (r.status !== "ok") console.error("Dutchie NOXX failure:", r.error);
    assert(r.status === "ok", `dutchie NOXX status=ok got ${r.status}`);
    // Cresco flower: 4 buckets, 3.5g on sale at 35.
    const cresco = r.items.filter((i) => i.raw_name.startsWith("Cresco"));
    assert(cresco.length === 4, `Cresco 4 buckets, got ${cresco.length}`);
    const eighth = cresco.find((i) => i.raw_weight === "3.5g")!;
    assert(eighth.is_on_sale, "Cresco 3.5g should be on sale");
    assert(eighth.raw_sale_price === 35, "Cresco 3.5g sale=35");
    // RYTHM cart: Options[] + recPrices/recSpecialPrices path, both 0.5g + 1g on sale.
    const rythm = r.items.filter((i) => i.raw_name.startsWith("RYTHM"));
    assert(rythm.length === 2, `RYTHM 2 sizes, got ${rythm.length}`);
    assert(rythm.every((i) => i.is_on_sale), "RYTHM both sizes on sale");
    // incredibles edible: 1 child variant, not on sale.
    const inc = r.items.filter((i) => i.raw_name.startsWith("incredibles"));
    assert(inc.length === 1 && !inc[0].is_on_sale, "incredibles 1 not-on-sale");
    // Mystery has no priceRec -> dropped.
    const myst = r.items.filter((i) => i.raw_name.includes("Mystery"));
    assert(myst.length === 0, "Mystery dropped (no price)");
    console.log(`PASS dutchie NOXX api-4 shape: ${r.items.length} items`);
  }

  // ---------------- DUTCHIE Trinity Glen (resolved VERIFY) ----------------
  {
    const r = await dutchieAdapter.fetch(trinityGlen, { fixtureLoader: loadFixture });
    if (r.status !== "ok") console.error("Dutchie Glen failure:", r.error);
    assert(r.status === "ok", `dutchie Glen status=ok got ${r.status}`);
    // RYTHM Wedding Pie: 3.5g list 50; 7g list 90 sale 75.
    const wp = r.items.filter((i) => i.raw_name.includes("Wedding Pie"));
    assert(wp.length === 2, `Glen RYTHM Wedding Pie 2 buckets, got ${wp.length}`);
    const seven = wp.find((i) => i.raw_weight === "7g")!;
    assert(seven.is_on_sale && seven.raw_sale_price === 75, "Glen 7g on sale at 75");
    // Aeriz cart 0.5g 60 sale 50; Wyld edible 100mg list 28.
    const aer = r.items.find((i) => i.raw_name.startsWith("Aeriz"))!;
    assert(aer.raw_weight === "0.5g" && aer.is_on_sale && aer.raw_sale_price === 50, "Aeriz 0.5g on sale 50");
    const wyld = r.items.find((i) => i.raw_name.startsWith("Wyld"))!;
    assert(wyld.raw_weight === "100mg" && wyld.raw_price === 28, "Wyld 100mg 28");
    console.log(`PASS dutchie Trinity Glen (resolved VERIFY): ${r.items.length} items`);
  }

  // ---------------- SWEED Ivy Hall (StoreId 169) ----------------
  {
    const r = await sweedAdapter.fetch(ivy, { fixtureLoader: loadFixture });
    if (r.status !== "ok") console.error("Sweed failure:", r.error);
    assert(r.status === "ok", `sweed status=ok got ${r.status}`);
    const house = r.items.filter((i) => i.raw_name.startsWith("Ivy Hall"));
    assert(house.length === 3, `Ivy Hall 3 variants, got ${house.length}`);
    const e = house.find((i) => i.raw_weight === "3.5g")!;
    assert(e.is_on_sale && e.raw_sale_price === 28, "Ivy Hall 3.5g sale=28");
    assert(e.raw_thc === "19%-22.5%", `Ivy Hall thc range, got ${e.raw_thc}`);
    const aeriz = r.items.find((i) => i.raw_brand === "Aeriz");
    assert(aeriz, "Aeriz brand resolves from string field");
    console.log(`PASS sweed (storeId 169): ${r.items.length} items`);
  }

  // ---------------- JOINT Cookies (nonce-gated /products) ----------------
  {
    const r = await jointAdapter.fetch(cookies, { fixtureLoader: loadFixture });
    if (r.status !== "ok") console.error("Joint failure:", r.error);
    assert(r.status === "ok", `joint status=ok got ${r.status}`);
    const ck = r.items.filter((i) => i.raw_name.includes("Berner"));
    assert(ck.length === 2, `Berner's 2 variants, got ${ck.length}`);
    const e = ck.find((i) => i.raw_weight === "3.5g")!;
    assert(e.is_on_sale && e.raw_sale_price === 45, "Berner's 3.5g sale=45");
    assert(e.raw_thc === "24.6%", `numeric thc -> "24.6%", got ${e.raw_thc}`);
    // Camino: string price "30.00" parses to numeric 30; no variants path.
    const cam = r.items.find((i) => i.raw_name.startsWith("Camino"));
    assert(cam && cam.raw_price === 30, `Camino string regular_price="30.00" -> 30 numeric, got ${cam?.raw_price}`);
    console.log(`PASS joint (nonce-gated /products): ${r.items.length} items`);
  }

  console.log("\nAll Phase 4 (reconciled) adapter parsers passed against LIVE-shape fixtures.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
