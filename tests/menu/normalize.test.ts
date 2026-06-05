// tests/menu/normalize.test.ts
// End-to-end normalization smoke test: load all 4 adapter fixtures, run
// each through the adapter parser, then through normalize(), and verify:
//   1. ≥90% of parseable items map to a canonical_product (the Phase 5
//      done-condition).
//   2. Brand canonicalization picks up the variants we expect.
//   3. Unit canonicalization handles "3.5g", "1g", "100mg".
//   4. THC tiering routes vapes by adjusted-THC threshold.
//
// Run: npx tsx tests/menu/normalize.test.ts

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { janeAdapter } from "../../lib/scraper/menu/adapters/jane";
import { dutchieAdapter } from "../../lib/scraper/menu/adapters/dutchie";
import { sweedAdapter } from "../../lib/scraper/menu/adapters/sweed";
import { jointAdapter } from "../../lib/scraper/menu/adapters/joint";
import { normalize, resolveBrand, resolveUnit, resolveThc } from "../../lib/scraper/menu/normalize";
import type { Adapter, StoreRef } from "../../lib/scraper/menu/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); }
}

const loadFixture = (name: string): Promise<unknown> =>
  readFile(join(process.cwd(), "tests", "fixtures", "menu", name), "utf8").then(JSON.parse);

const STORES: Array<{ store: StoreRef; adapter: Adapter }> = [
  {
    adapter: janeAdapter,
    store: { id: "x", slug: "nuera-east-peoria", name: "nuEra", city: "East Peoria",
      platform: "jane", platform_store_id: "1517", menu_url: null, graphql_endpoint: null },
  },
  {
    adapter: dutchieAdapter,
    store: { id: "x", slug: "noxx-east-peoria", name: "NOXX", city: "East Peoria",
      platform: "dutchie", platform_store_id: "65772a69ac53410009424572", menu_url: null,
      graphql_endpoint: "https://noxx.com/api-1/graphql" },
  },
  {
    adapter: sweedAdapter,
    store: { id: "x", slug: "ivy-hall-peoria-heights", name: "Ivy Hall", city: "Peoria Heights",
      platform: "sweed", platform_store_id: "session-routed",
      menu_url: "https://ivyhalldispensary.com/locations/peoria/menu", graphql_endpoint: null },
  },
  {
    adapter: jointAdapter,
    store: { id: "x", slug: "cookies-peoria-heights", name: "Cookies", city: "Peoria Heights",
      platform: "joint", platform_store_id: "wp-nonce-gated",
      menu_url: "https://peoriaheights.cookies.co/menu/", graphql_endpoint: null },
  },
];

(async () => {
  // --- unit + brand + thc unit tests (sanity)
  {
    // Brand fuzzy variants from brand_master.json
    assert(resolveBrand("RYTHM")?.canonical_id === "rythm", "exact RYTHM");
    assert(resolveBrand("Rythm")?.canonical_id === "rythm", "case Rythm");
    assert(resolveBrand("rhythm")?.canonical_id === "rythm", "loose rhythm");
    assert(resolveBrand("High Supply")?.canonical_id === "high_supply", "High Supply");
    assert(resolveBrand("HighSupply")?.canonical_id === "high_supply", "HighSupply loose");
    assert(resolveBrand("MÜV")?.canonical_id === "muv", "MÜV diacritic");
    assert(resolveBrand("Camino"), "edit-distance / substring on unseen brand should at least try");
    // Tax-relevant: THC tier routing
    const v = resolveThc("75%", "vapes");
    assert(v.thc_tier === "non_infused_gt_35", `75% vape -> gt_35, got ${v.thc_tier}`);
    const w = resolveThc("28%", "vapes");
    assert(w.thc_tier === "non_infused_le_35", `28% vape -> le_35, got ${w.thc_tier}`);
    const e = resolveThc("100mg", "edibles");
    assert(e.thc_tier === "infused", `edible -> infused regardless of input, got ${e.thc_tier}`);
    const r = resolveThc("18.2%-22%", "flower");
    assert(r.thc_pct === 20.1, `range midpoint ~20.1, got ${r.thc_pct}`);
    // Unit
    const u = resolveUnit("3.5g", "flower");
    assert(u?.canonical_unit === "3.5g", "3.5g unit");
    const u2 = resolveUnit("eighth", "flower");
    assert(u2?.canonical_unit === "3.5g", "eighth -> 3.5g");
    const u3 = resolveUnit("100mg", "edible");
    assert(u3?.canonical_unit.startsWith("100mg_"), `edible solo -> 100mg_*, got ${u3?.canonical_unit}`);
    console.log("PASS unit/brand/thc primitives");
  }

  // --- end-to-end: parse fixtures, normalize each item
  let totalParsed = 0;
  let totalMatched = 0;
  let totalReviewIssues = 0;
  let nonGearItems = 0;

  for (const { store, adapter } of STORES) {
    const r = await adapter.fetch(store, { fixtureLoader: loadFixture });
    assert(r.status === "ok", `${store.slug} parser ok`);
    totalParsed += r.items.length;
    for (const raw of r.items) {
      const fakeId = `fake-${Math.random().toString(36).slice(2, 9)}`;
      const result = normalize({
        id: fakeId,
        raw_name: raw.raw_name,
        raw_brand: raw.raw_brand,
        raw_category: raw.raw_category,
        raw_weight: raw.raw_weight,
        raw_price: raw.raw_price,
        raw_sale_price: raw.raw_sale_price,
        raw_thc: raw.raw_thc,
        is_on_sale: raw.is_on_sale,
      });
      totalReviewIssues += result.issues.length;
      if (result.normalized.canonical_category === "other") {
        // accessories/gear -- don't count against the match-rate target
        continue;
      }
      nonGearItems++;
      if (result.product_key) totalMatched++;
    }
  }

  const matchRate = (totalMatched / nonGearItems) * 100;
  console.log(`\nNormalize summary across 4 fixture stores:`);
  console.log(`  total raw items parsed:    ${totalParsed}`);
  console.log(`  non-gear items:            ${nonGearItems}`);
  console.log(`  mapped to canonical_product: ${totalMatched}  (${matchRate.toFixed(1)}%)`);
  console.log(`  review_queue issues:       ${totalReviewIssues}`);
  assert(matchRate >= 90, `Phase 5 done-condition: match rate >=90% (got ${matchRate.toFixed(1)}%)`);

  console.log("\nPASS: Phase 5 normalization >=90% match rate across all 4 fixtures.");
})().catch((e) => { console.error(e); process.exit(1); });
