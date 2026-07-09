// scripts/map-capture-jane.ts
// =============================================================================
// Capture-mapper: real browser capture (dmerch v2 merchandiser API) ->
// the Algolia batch-envelope shape the Jane adapter's fixture path already
// parses. Zero adapter changes: the mapped file is consumed verbatim by
// janeAdapter.fetch(store, { fixtureLoader }) via run-menu-snapshot --fixture.
//
// Source shape (reference-data/captures-jul09/jane-1517-flower.json):
//   response.body.placements[] -> placement "menu_inline_table" has the full
//   359-product flower catalog. Each product has .product_id and
//   .search_attributes {name, brand, kind, category, percent_thc,
//   price_<weight>, special_price_<weight>{discount_price,...}, ...}.
//
// We ONLY read the menu_inline_table placement (menu_dynamic_row carries
// sponsored/ad rows without search_attributes) and dedupe by product_id.
//
// Real fields only. Per-weight sale price comes from the authoritative
// special_price_<weight>.discount_price object (the one carrying
// special_id / discount_percent / discount_amount that matches
// special_title). We do NOT trust the bare discounted_price_<weight>
// numbers -- they were internally inconsistent in the capture.
//
// Usage
//   npx tsx scripts/map-capture-jane.ts \
//     --in=reference-data/captures-jul09/jane-1517-flower.json \
//     --out=reference-data/captures-jul09/mapped/jane-1517.json
// =============================================================================

import { argv, exit } from "node:process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const IN = argv.find((a) => a.startsWith("--in="))?.split("=")[1];
const OUT = argv.find((a) => a.startsWith("--out="))?.split("=")[1];
if (!IN || !OUT) {
  console.error("ERROR: pass --in=<capture.json> --out=<mapped.json>");
  exit(1);
}

// Weight-key -> the Algolia price field names the adapter's expandHit reads.
// (adapter maps price_each->1g, price_eighth_ounce->3.5g, etc.)
const WEIGHTS = [
  { dmerch: "gram", list: "price_gram", each: "price_each", disc: "discounted_price_each" },
  { dmerch: "eighth_ounce", list: "price_eighth_ounce", each: "price_eighth_ounce", disc: "discounted_price_eighth_ounce" },
  { dmerch: "quarter_ounce", list: "price_quarter_ounce", each: "price_quarter_ounce", disc: "discounted_price_quarter_ounce" },
  { dmerch: "half_ounce", list: "price_half_ounce", each: "price_half_ounce", disc: "discounted_price_half_ounce" },
  { dmerch: "ounce", list: "price_ounce", each: "price_ounce", disc: "discounted_price_ounce" },
] as const;

function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Pull the authoritative per-weight sale price from special_price_<weight>. */
function specialDiscount(sa: Record<string, any>, dmerchWeight: string): number | undefined {
  const obj = sa[`special_price_${dmerchWeight}`];
  if (obj && typeof obj === "object" && obj.discount_price != null) {
    return num(obj.discount_price);
  }
  return undefined;
}

function main() {
  const capture = JSON.parse(readFileSync(IN!, "utf8"));
  const placements: any[] = capture?.response?.body?.placements ?? [];

  // Process inline_table FIRST (source of truth), then any other placements
  // (e.g. menu_dynamic_row) for additional hydrated products. Dedupe by
  // product_id so inline wins on overlap. Most inline entries are Kevel ad
  // stubs (ad_token/kevel_token, no search_attributes) -- those carry no
  // real product data and are skipped, never invented.
  const ordered = [
    ...placements.filter((p) => (p.placement ?? p.name) === "menu_inline_table"),
    ...placements.filter((p) => (p.placement ?? p.name) !== "menu_inline_table"),
  ];
  if (ordered.length === 0) {
    console.error("ERROR: no placements[] found.");
    exit(1);
  }
  const products: any[] = ordered.flatMap((p) => (Array.isArray(p.products) ? p.products : []));

  const seen = new Set<string | number>();
  const hits: Record<string, any>[] = [];
  let skippedNoAttrs = 0;
  let skippedDupes = 0;
  let skippedNoPrice = 0;

  for (const prod of products) {
    const pid = prod.product_id ?? prod.object_id;
    const sa = prod.search_attributes;
    if (!sa) { skippedNoAttrs++; continue; }
    if (pid != null && seen.has(pid)) { skippedDupes++; continue; }
    if (pid != null) seen.add(pid);

    const hit: Record<string, any> = {
      product_id: pid,
      objectID: sa.objectID ?? String(pid),
      name: sa.name,
      brand: sa.brand ?? null,
      kind: sa.kind ?? null,
      category: sa.category ?? null,
      percent_thc: sa.percent_thc ?? null,
      percent_cbd: sa.percent_cbd ?? null,
      store_id: sa.store_id ?? capture?.request?.store_id ?? null,
      bucket_price: num(sa.bucket_price),
    };

    let anyPrice = false;
    for (const w of WEIGHTS) {
      const list = num(sa[w.list]);
      if (list == null) continue;
      anyPrice = true;
      hit[w.each] = list;
      const sale = specialDiscount(sa, w.dmerch);
      if (sale != null && sale < list) hit[w.disc] = sale;
    }
    if (!anyPrice) { skippedNoPrice++; continue; }
    hits.push(hit);
  }

  // Algolia batch-envelope: exactly what janeAdapter.extractResult() expects.
  const out = {
    results: [
      {
        hits,
        nbHits: hits.length,
        page: 0,
        nbPages: 1,
        hitsPerPage: hits.length,
      },
    ],
  };

  mkdirSync(dirname(OUT!), { recursive: true });
  writeFileSync(OUT!, JSON.stringify(out, null, 2));
  console.log(
    `jane mapper: wrote ${hits.length} products -> ${OUT}\n` +
      `  skipped: no_attrs=${skippedNoAttrs} dupes=${skippedDupes} no_price=${skippedNoPrice}`
  );
}

main();
