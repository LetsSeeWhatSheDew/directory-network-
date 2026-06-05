// tests/menu/scoreDeal.test.ts
// Pure unit tests for scoreDeal.
import { scoreDeal } from "../../lib/scraper/menu/scoreDeal";

function assert(c: unknown, m: string): asserts c { if (!c) { console.error(`FAIL: ${m}`); process.exit(1); } }

// Band: median=40, p25=30, p75=50
const band = { median: 40, p25: 30, p75: 50 };

// Below p25 -> great
{
  const r = scoreDeal({ observedPrice: 25, baseline: band });
  assert(r.label === "great_deal", `25 vs band -> great_deal, got ${r.label}`);
  assert(r.discount_vs_median === 0.375, `discount_vs_median=0.375 (15/40), got ${r.discount_vs_median}`);
  console.log("PASS great_deal");
}

// Between p25 and median -> fair
{
  const r = scoreDeal({ observedPrice: 35, baseline: band });
  assert(r.label === "fair_deal", `35 vs band -> fair_deal, got ${r.label}`);
  console.log("PASS fair_deal");
}

// Exactly median -> fair (inclusive on upper)
{
  const r = scoreDeal({ observedPrice: 40, baseline: band });
  assert(r.label === "fair_deal", `40 exact median -> fair, got ${r.label}`);
  assert(r.discount_vs_median === 0, "discount=0 at median");
  console.log("PASS fair_deal at median");
}

// Between median and p75 -> weak
{
  const r = scoreDeal({ observedPrice: 45, baseline: band });
  assert(r.label === "weak_deal", `45 vs band -> weak_deal, got ${r.label}`);
  assert(r.discount_vs_median === -0.125, `discount_vs_median=-0.125 (-5/40), got ${r.discount_vs_median}`);
  console.log("PASS weak_deal");
}

// Above p75 -> no real savings
{
  const r = scoreDeal({ observedPrice: 55, baseline: band });
  assert(r.label === "no_real_savings", `55 vs band -> no_real_savings, got ${r.label}`);
  console.log("PASS no_real_savings");
}

// No baseline -> unknown
{
  const r = scoreDeal({ observedPrice: 25, baseline: null });
  assert(r.label === "unknown", `null baseline -> unknown, got ${r.label}`);
  assert(r.discount_vs_median === null, "no discount when no baseline");
  console.log("PASS unknown (no baseline)");
}

// Zero observed -> unknown
{
  const r = scoreDeal({ observedPrice: 0, baseline: band });
  assert(r.label === "unknown", "zero observed -> unknown");
  console.log("PASS unknown (zero observed)");
}

console.log("\nAll scoreDeal tests passed.");
