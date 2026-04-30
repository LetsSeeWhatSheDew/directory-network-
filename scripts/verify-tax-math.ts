// Tax math verification — run with: npx tsx scripts/verify-tax-math.ts
//
// Sanity-checks the tax calculator against the three demo-ready test
// scenarios from Big Boi mode prompt + the article's worked example.
// If anything drifts, this surfaces it before deploy.

import { calculateOutTheDoor, findCityRates, type ThcTier } from "../lib/taxRates";

const testCases: Array<{ label: string; price: number; tier: ThcTier; city: string }> = [
  { label: "Scenario A — $50 flower in Peoria", price: 50, tier: "flower", city: "peoria" },
  { label: "Scenario B — $50 vape in Springfield", price: 50, tier: "concentrate", city: "springfield" },
  { label: "Scenario C — $50 edible in Urbana", price: 50, tier: "edible", city: "urbana" },
  { label: "Article example — $35 flower in East Peoria", price: 35, tier: "flower", city: "east-peoria" },
];

for (const t of testCases) {
  const c = findCityRates(t.city)!;
  const r = calculateOutTheDoor(t.price, t.tier, c);
  console.log(t.label);
  console.log(`  shelf:       $${r.shelfPrice.toFixed(2)}`);
  console.log(`  excise:      $${r.cannabisExcise.toFixed(4)}`);
  console.log(`  state sales: $${r.stateSalesTax.toFixed(4)}`);
  console.log(`  local sales: $${r.localSalesTax.toFixed(4)}`);
  console.log(`  ${c.county} cnty: $${r.countyCannabisTax.toFixed(4)}`);
  console.log(`  ${c.city} muni: $${r.municipalCannabisTax.toFixed(4)}`);
  console.log(`  total tax:   $${r.totalTax.toFixed(4)} -> rounded $${r.totalTax.toFixed(2)}`);
  console.log(`  out the door: $${r.outTheDoor.toFixed(2)}  (${(r.effectiveRate * 100).toFixed(1)}% effective)`);
  console.log();
}
