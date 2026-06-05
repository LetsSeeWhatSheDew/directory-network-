// tests/menu/adapters.test.ts
// Offline parser tests for Dutchie / Sweed / Joint adapters using fixtures.
//
// Run: npx tsx tests/menu/adapters.test.ts
// (No test framework -- exits non-zero on assert failure.)

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
  menu_url: null, graphql_endpoint: "https://noxx.com/api-1/graphql",
};

const ivy: StoreRef = {
  id: "x", slug: "ivy-hall-peoria-heights", name: "Ivy Hall", city: "Peoria Heights",
  platform: "sweed", platform_store_id: "session-routed",
  menu_url: "https://ivyhalldispensary.com/locations/peoria/menu", graphql_endpoint: null,
};

const cookies: StoreRef = {
  id: "x", slug: "cookies-peoria-heights", name: "Cookies", city: "Peoria Heights",
  platform: "joint", platform_store_id: "wp-nonce-gated",
  menu_url: "https://peoriaheights.cookies.co/menu/", graphql_endpoint: null,
};

(async () => {
  // ---------------- DUTCHIE ----------------
  {
    const r = await dutchieAdapter.fetch(noxx, { fixtureLoader: loadFixture });
    if (r.status !== "ok") console.error("Dutchie failure:", r.error);
    assert(r.status === "ok", `dutchie status=ok got ${r.status}`);
    // Cresco flower: 4 buckets, 3.5g on sale at 35.
    const cresco = r.items.filter((i) => i.raw_name.startsWith("Cresco"));
    assert(cresco.length === 4, `Cresco 4 buckets, got ${cresco.length}`);
    const eighth = cresco.find((i) => i.raw_weight === "3.5g")!;
    assert(eighth.is_on_sale, "Cresco 3.5g should be on sale");
    assert(eighth.raw_sale_price === 35, "Cresco 3.5g sale=35");
    assert(eighth.raw_price === 45, "Cresco 3.5g list=45");
    // RYTHM cart: Options + recPrices/recSpecialPrices path, both 0.5g + 1g on sale.
    const rythm = r.items.filter((i) => i.raw_name.startsWith("RYTHM"));
    assert(rythm.length === 2, `RYTHM 2 sizes, got ${rythm.length}`);
    assert(rythm.every((i) => i.is_on_sale), "RYTHM both sizes on sale");
    // incredibles edible: single child variant, not on sale.
    const inc = r.items.filter((i) => i.raw_name.startsWith("incredibles"));
    assert(inc.length === 1, "incredibles 1 variant");
    assert(!inc[0].is_on_sale, "incredibles not on sale");
    // Mystery has no priceRec -> dropped.
    const myst = r.items.filter((i) => i.raw_name.includes("Mystery"));
    assert(myst.length === 0, "Mystery dropped (no price)");
    console.log(`PASS dutchie: ${r.items.length} items`);
  }

  // ---------------- SWEED ----------------
  {
    const r = await sweedAdapter.fetch(ivy, { fixtureLoader: loadFixture });
    if (r.status !== "ok") console.error("Sweed failure:", r.error);
    assert(r.status === "ok", `sweed status=ok got ${r.status}`);
    // Ivy Hall house eighth: 3 variants, 3.5g on sale.
    const house = r.items.filter((i) => i.raw_name.startsWith("Ivy Hall"));
    assert(house.length === 3, `Ivy Hall 3 variants, got ${house.length}`);
    const e = house.find((i) => i.raw_weight === "3.5g")!;
    assert(e.is_on_sale && e.raw_sale_price === 28, "Ivy Hall 3.5g sale=28");
    assert(e.raw_thc === "19%-22.5%", `Ivy Hall thc range, got ${e.raw_thc}`);
    // Brand-as-string vs brand-as-object both resolve.
    const aeriz = r.items.find((i) => i.raw_brand === "Aeriz");
    assert(aeriz, "Aeriz brand resolves from string field");
    const wyld = r.items.find((i) => i.raw_brand === "Wyld");
    assert(wyld, "Wyld brand resolves from string field");
    console.log(`PASS sweed: ${r.items.length} items`);
  }

  // ---------------- JOINT ----------------
  {
    const r = await jointAdapter.fetch(cookies, { fixtureLoader: loadFixture });
    if (r.status !== "ok") console.error("Joint failure:", r.error);
    assert(r.status === "ok", `joint status=ok got ${r.status}`);
    // Cookies Berner's: 2 variants, 3.5g on sale.
    const ck = r.items.filter((i) => i.raw_name.includes("Berner"));
    assert(ck.length === 2, `Berner's 2 variants, got ${ck.length}`);
    const e = ck.find((i) => i.raw_weight === "3.5g")!;
    assert(e.is_on_sale && e.raw_sale_price === 45, "Berner's 3.5g sale=45");
    assert(e.raw_thc === "24.6%", `numeric thc -> "24.6%", got ${e.raw_thc}`);
    // Camino: simple single-price path (no variants, top-level price).
    const cam = r.items.find((i) => i.raw_name.startsWith("Camino"));
    assert(cam && cam.raw_price === 30, "Camino top-level price=30");
    console.log(`PASS joint: ${r.items.length} items`);
  }

  console.log("\nAll Phase 4 adapter parsers passed offline.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
