// scripts/map-capture-sweed.ts
// =============================================================================
// Capture-mapper: real browser capture (Sweed SSR-embedded product list) ->
// the GetProductList response shape the Sweed adapter's fixture path parses.
// Zero adapter changes.
//
// CONTRACT SURPRISE (documented, not called): there is NO client-side XHR
// that returns the catalog. Sweed renders the product list server-side and
// embeds it as a JSON blob inside a <script> in the category page HTML. The
// capture harvested that blob as response.embedded_product_list_page1 (24
// flower products, page 1 only). The real GetProductList API request contract
// is recorded in the capture's request/capture_meta -- see capture-notes.md.
//
// Source product shape:
//   { name, brand:{name}, category:{name}, variants:[
//       { name:"3.5g", price, promoPrice, labTests:{thc:{value:[x]}}, ... } ] }
//
// Adapter target shape (per sweed adapter + fixture _meta):
//   { TotalCount, Products:[ { Name, Brand:{Name}, Category:{Name},
//       Thc:{Min,Max}, Variants:[ {Size, OriginalPrice, Price} ] } ] }
//   -> adapter: list = OriginalPrice (shelf), current = Price; onSale when
//      current < list. So OriginalPrice<-price, Price<-promoPrice||price.
//
// Real fields only. Skip variants with no usable positive price.
//
// Usage
//   npx tsx scripts/map-capture-sweed.ts \
//     --in=reference-data/captures-jul09/sweed-169-flower.json \
//     --out=reference-data/captures-jul09/mapped/sweed-169.json
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

function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** First finite THC% from a variant's labTests (actual thc, not displayThc). */
function variantThc(v: any): number | undefined {
  const val = v?.labTests?.thc?.value;
  if (Array.isArray(val) && val.length && Number.isFinite(val[0])) return val[0];
  return undefined;
}

function main() {
  const capture = JSON.parse(readFileSync(IN!, "utf8"));
  const list: any[] = capture?.response?.embedded_product_list_page1 ?? [];
  if (!Array.isArray(list) || list.length === 0) {
    console.error("ERROR: no embedded_product_list_page1[] found.");
    exit(1);
  }

  const Products: any[] = [];
  let skippedNoVariants = 0;
  let variantCount = 0;

  for (const p of list) {
    const variants: any[] = [];
    let thcMin: number | undefined;
    let thcMax: number | undefined;

    for (const v of p.variants ?? []) {
      const shelf = num(v.price);
      if (shelf == null) continue; // no usable price -> skip, never invent one
      const promo = num(v.promoPrice);
      variants.push({
        Size: (v.name ?? "").toString().trim() || null,
        OriginalPrice: shelf,
        Price: promo != null ? promo : shelf,
      });
      variantCount++;
      const t = variantThc(v);
      if (t != null) {
        thcMin = thcMin == null ? t : Math.min(thcMin, t);
        thcMax = thcMax == null ? t : Math.max(thcMax, t);
      }
    }

    if (variants.length === 0) { skippedNoVariants++; continue; }

    Products.push({
      Id: p.id,
      Name: p.name,
      Brand: { Name: p.brand?.name ?? null },
      Category: { Name: p.category?.name ?? null },
      Thc: thcMin != null ? { Min: thcMin, Max: thcMax } : undefined,
      Variants: variants,
    });
  }

  const out = { TotalCount: Products.length, Products };

  mkdirSync(dirname(OUT!), { recursive: true });
  writeFileSync(OUT!, JSON.stringify(out, null, 2));
  console.log(
    `sweed mapper: wrote ${Products.length} products / ${variantCount} variants -> ${OUT}\n` +
      `  skipped: no_usable_variant=${skippedNoVariants}`
  );
}

main();
