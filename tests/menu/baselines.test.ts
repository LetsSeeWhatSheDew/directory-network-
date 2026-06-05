// tests/menu/baselines.test.ts
// Unit tests for baseline math + sanity gate.
// Run: npx tsx tests/menu/baselines.test.ts

import { computeBaseline, applySanity, sanityKey } from "../../lib/scraper/menu/baselines";

function assert(c: unknown, m: string): asserts c { if (!c) { console.error(`FAIL: ${m}`); process.exit(1); } }

const t = (s: string) => new Date(s).toISOString();

// --- baseline math
{
  const b = computeBaseline([
    { price_pretax: 30, scraped_at: t("2026-06-01"), dispensary_id: "a" },
    { price_pretax: 35, scraped_at: t("2026-06-02"), dispensary_id: "b" },
    { price_pretax: 40, scraped_at: t("2026-06-03"), dispensary_id: "c" },
    { price_pretax: 45, scraped_at: t("2026-06-04"), dispensary_id: "d" },
    { price_pretax: 50, scraped_at: t("2026-06-05"), dispensary_id: "e" },
  ])!;
  assert(b.median === 40, `median 40, got ${b.median}`);
  assert(b.min === 30 && b.max === 50, "min/max bookends");
  assert(b.p25 === 35, `p25 35, got ${b.p25}`);
  assert(b.p75 === 45, `p75 45, got ${b.p75}`);
  assert(b.sample_size === 5, "sample size 5");
  // window edges
  assert(b.window_start === t("2026-06-01"), "window start");
  assert(b.window_end === t("2026-06-05"), "window end");
  console.log("PASS baseline math");
}

// --- single-observation degenerate
{
  const b = computeBaseline([{ price_pretax: 30, scraped_at: t("2026-06-01"), dispensary_id: "a" }])!;
  assert(b.median === 30 && b.p25 === 30 && b.p75 === 30, "single-obs collapses to one value");
  console.log("PASS single-obs baseline");
}

// --- zeroes / negatives filtered out
{
  const b = computeBaseline([
    { price_pretax: 30, scraped_at: t("2026-06-01"), dispensary_id: "a" },
    { price_pretax: 0, scraped_at: t("2026-06-02"), dispensary_id: "b" },
    { price_pretax: -5, scraped_at: t("2026-06-03"), dispensary_id: "c" },
  ])!;
  assert(b.sample_size === 1, `non-positive filtered, sample_size 1 got ${b.sample_size}`);
  console.log("PASS non-positive filter");
}

// --- sanity key mapping
{
  assert(sanityKey("flower", "3.5g") === "flower_3.5g_eighth", "eighth band key");
  assert(sanityKey("vape", "0.5g") === "vape_0.5g", "vape 0.5g key");
  assert(sanityKey("preroll", "1g_1pk") === "preroll_1g_single", "preroll 1g key (1g_1pk prefix)");
  assert(sanityKey("edible", "100mg_10pk") === "edible_100mg_pack", "edible 100mg pack key");
  assert(sanityKey("topical", "1g") === null, "no band for topical -> null");
  console.log("PASS sanity key mapping");
}

// --- sanity gate behavior (band: eighth low 20, typical 35, high 60)
{
  // Median within band -> pass
  const a = applySanity("flower", "3.5g", 35);
  assert(a.passed && a.flag === null, "35 eighth passes");

  // Way below low*0.6 (20*0.6 = 12) -> flag
  const lo = applySanity("flower", "3.5g", 8);
  assert(!lo.passed && lo.flag !== null, "8 eighth fails low");

  // Way above high*1.5 (60*1.5 = 90) -> flag
  const hi = applySanity("flower", "3.5g", 100);
  assert(!hi.passed && hi.flag !== null, "100 eighth fails high");

  // Right at the edge -> pass
  const edge = applySanity("flower", "3.5g", 89);
  assert(edge.passed, "89 eighth (just under 90 ceiling) passes");

  // No band -> pass-through
  const noBand = applySanity("topical", "1g", 50);
  assert(noBand.passed, "no-band -> pass");

  console.log("PASS sanity gate");
}

console.log("\nAll Phase 6 baseline tests passed.");
