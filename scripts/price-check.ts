// scripts/price-check.ts: READ-ONLY. The Central Illinois Cannabis Price Check:
// per town, the cheapest and the typical (median of each store's cheapest)
// out-the-door price for an eighth of flower, a 1g cart and 100mg of gummies,
// from each store's own online menu (lib/menuPrices.ts getCheapestBoard, the
// same numbers /cheapest shows). Prints a table for the press pitch and the
// monthly price check. Every number traces to a menu row read in the last 36h.
//   npx tsx scripts/price-check.ts
import { getCheapestBoard, REF_UNITS, REF_DEF, money, type CheapestItem } from "../lib/menuPrices";

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function main() {
const board = await getCheapestBoard();
console.log(`## Price check · ${board.stores} stores with fresh menus · menus read ${board.oldest} → ${board.newest}`);
for (const ref of REF_UNITS) {
  const items = board.byRef[ref];
  if (!items.length) { console.log(`\n### ${REF_DEF[ref].label}: no fresh menu prices`); continue; }
  const all = items.map((i) => i.otd);
  const low = items[0];
  console.log(`\n### ${REF_DEF[ref].label}, out the door (tax in)`);
  console.log(`Region: cheapest ${money(low.otd)} at ${low.storeName} (${low.city}) · typical ${money(median(all))} · ${items.length} stores`);
  const byCity = new Map<string, CheapestItem[]>();
  for (const i of items) byCity.set(i.city, [...(byCity.get(i.city) || []), i]);
  console.log("| Town | Stores | Cheapest | Typical | Cheapest at |");
  console.log("|---|---:|---:|---:|---|");
  for (const [city, list] of [...byCity.entries()].sort((a, b) => median(a[1].map((x) => x.otd)) - median(b[1].map((x) => x.otd)))) {
    const c = list[0];
    console.log(`| ${city} | ${list.length} | ${money(c.otd)} | ${money(median(list.map((x) => x.otd)))} | ${c.storeName}: ${c.brand ? c.brand + " " : ""}${c.product.slice(0, 50)} |`);
  }
}
}
main().catch((e) => { console.error(e); process.exit(1); });
