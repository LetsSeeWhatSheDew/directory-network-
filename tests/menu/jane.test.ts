// tests/menu/jane.test.ts
// Offline parser tests for the Jane adapter using a saved fixture.
//
// Run: npx tsx tests/menu/jane.test.ts
// (Self-contained -- no test framework required. Asserts via throw.)

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { janeAdapter } from "../../lib/scraper/menu/adapters/jane";
import type { StoreRef } from "../../lib/scraper/menu/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

async function loadFixture(name: string): Promise<unknown> {
  const path = join(process.cwd(), "tests", "fixtures", "menu", name);
  return JSON.parse(await readFile(path, "utf8"));
}

const nuEraEastPeoria: StoreRef = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "nuera-east-peoria",
  name: "nuEra",
  city: "East Peoria",
  platform: "jane",
  platform_store_id: "1517",
  menu_url: "https://nueracannabis.com/shop/store/1517/featured",
  graphql_endpoint: null,
};

(async () => {
  const result = await janeAdapter.fetch(nuEraEastPeoria, { fixtureLoader: loadFixture });

  if (result.status !== "ok") {
    console.error("Adapter failure:", { status: result.status, error: result.error });
  }
  assert(result.status === "ok", `expected status=ok got ${result.status}`);
  assert(result.platform === "jane", "platform should be jane");
  assert(result.items.length > 0, "should produce items");
  assert(result.adapter_version.startsWith("jane@"), "adapter_version set");

  // RYTHM MAC #1 produces 4 buckets (3.5g, 7g, 14g, 28g).
  const rythm = result.items.filter((i) => i.raw_name === "RYTHM MAC #1");
  assert(rythm.length === 4, `RYTHM should expand to 4 buckets, got ${rythm.length}`);
  const weights = new Set(rythm.map((i) => i.raw_weight));
  for (const w of ["3.5g", "7g", "14g", "28g"]) {
    assert(weights.has(w), `RYTHM missing weight ${w}`);
  }

  // Simply Herb has eighth + ounce listed; ounce is on sale.
  const sh = result.items.filter((i) => i.raw_name.startsWith("Simply Herb"));
  assert(sh.length === 2, `Simply Herb should expand to 2 buckets, got ${sh.length}`);
  const oz = sh.find((i) => i.raw_weight === "28g")!;
  assert(oz.is_on_sale === true, "ounce should be marked on sale");
  assert(oz.raw_sale_price === 99, `sale price should be 99, got ${oz.raw_sale_price}`);
  assert(oz.raw_price === 130, `list price should be 130, got ${oz.raw_price}`);
  assert(oz.raw_thc === "18.2%-22%", `thc range mid display, got ${oz.raw_thc}`);

  // Vape: single row, on sale, thc set.
  const vape = result.items.find((i) => i.raw_name.startsWith("RYTHM Cart"))!;
  assert(vape.raw_weight === "1g", `vape weight 1g, got ${vape.raw_weight}`);
  assert(vape.is_on_sale === true, "vape should be on sale");
  assert(vape.raw_sale_price === 55, "vape sale 55");
  assert(vape.raw_thc === "78.5%", `vape thc 78.5%, got ${vape.raw_thc}`);

  // Edible: simple row.
  const edible = result.items.find((i) => i.raw_name.includes("Wyld"))!;
  assert(edible.raw_weight === "100mg", "edible weight 100mg");
  assert(edible.is_on_sale === false, "edible not on sale");

  // Pre-roll: simple row.
  const pre = result.items.find((i) => i.raw_name.includes("Aeriz"))!;
  assert(pre.raw_category === "pre-rolls", `preroll category, got ${pre.raw_category}`);
  assert(pre.raw_weight === "1g", "preroll weight 1g");

  // Coming-soon row (no price) gets dropped silently.
  const mystery = result.items.find((i) => i.raw_brand === "Mystery");
  assert(!mystery, "coming-soon SKU with no price should be dropped");

  console.log(`PASS: Jane adapter parsed ${result.items.length} items from fixture, all expectations met.`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
