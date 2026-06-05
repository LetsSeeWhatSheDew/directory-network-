// scripts/compute-price-baselines.ts
// =============================================================================
// Compute price_baselines per canonical_product from the latest
// menu_items observations.
//
// "Latest" = one row per (dispensary, canonical_product) -- the most recent
// menu_items.scraped_at for each. This is what `latest_menu_items` view
// exposes already (see sql/menu-baseline-schema.sql).
//
// Geo scope today: 'central_il' (all stores active in the dispensaries
// table). Per-radius slices come later -- the geo_scope column on
// price_baselines makes it trivial to add 'peoria_metro_30mi' etc.
//
// Sample-size floor: configurable, default 3 observations to publish a
// band. Below that, the canonical_product is skipped (not flagged --
// just not enough data yet).
//
// Sanity gate runs against price_band_sanity.json; failures are still
// recorded with sanity_passed=false + flag, so the ledger has a history.
//
// Usage
//   npx tsx scripts/compute-price-baselines.ts --report
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/compute-price-baselines.ts --apply
//   --min-samples=N  (default 3)
//   --window-days=N  (default 14)
// =============================================================================

import { argv, exit, env } from "node:process";
import { computeBaseline, applySanity, type Observation } from "../lib/scraper/menu/baselines";

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const READ_KEY = SERVICE_KEY || ANON_KEY;
if (!READ_KEY) { console.error("ERROR: need SUPABASE_*_KEY in env."); exit(1); }

const APPLY = argv.includes("--apply");
if (APPLY && !SERVICE_KEY) { console.error("ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY."); exit(1); }

const MIN_SAMPLES = Number(argv.find((a) => a.startsWith("--min-samples="))?.split("=")[1] || 3);
const WINDOW_DAYS = Number(argv.find((a) => a.startsWith("--window-days="))?.split("=")[1] || 14);
const GEO_SCOPE = argv.find((a) => a.startsWith("--geo="))?.split("=")[1] || "central_il";

interface ItemRow {
  canonical_product_id: string;
  dispensary_id: string;
  price_pretax: number;
  scraped_at: string;
  canonical_category: string;
  canonical_unit: string;
}

async function fetchLatestObservations(): Promise<ItemRow[]> {
  // Pull from latest_menu_items view (one row per disp x canonical) and
  // window by scraped_at recency. The view is already filtered to
  // canonical_product_id IS NOT NULL.
  const since = new Date(Date.now() - WINDOW_DAYS * 86400 * 1000).toISOString();
  const url = `${SUPABASE_URL}/rest/v1/latest_menu_items?select=canonical_product_id,dispensary_id,price_pretax,scraped_at,canonical_category,canonical_unit&scraped_at=gte.${encodeURIComponent(since)}&order=canonical_product_id&limit=10000`;
  const res = await fetch(url, { headers: { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY!}` } });
  if (!res.ok) throw new Error(`fetch observations ${res.status}: ${await res.text()}`);
  return (await res.json()) as ItemRow[];
}

interface BaselineRow {
  canonical_product_id: string;
  geo_scope: string;
  price_kind: "pretax";
  median: number; min: number; max: number; p25: number; p75: number;
  sample_size: number;
  source_snapshot_window_start: string;
  source_snapshot_window_end: string;
  sanity_passed: boolean;
  sanity_flag: string | null;
}

async function insertBaselines(rows: BaselineRow[]): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/price_baselines`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY!,
        Authorization: `Bearer ${SERVICE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`insert price_baselines ${res.status}: ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  console.log(`Compute baselines  apply=${APPLY}  geo=${GEO_SCOPE}  window=${WINDOW_DAYS}d  min=${MIN_SAMPLES}\n`);

  const items = await fetchLatestObservations();
  console.log(`Fetched ${items.length} latest observations in window.\n`);

  // Group by canonical_product_id
  const byProduct = new Map<string, ItemRow[]>();
  for (const it of items) {
    const arr = byProduct.get(it.canonical_product_id) || [];
    arr.push(it);
    byProduct.set(it.canonical_product_id, arr);
  }

  const rows: BaselineRow[] = [];
  let skippedSmall = 0;
  let sanityFailed = 0;

  for (const [cpId, group] of byProduct) {
    if (group.length < MIN_SAMPLES) { skippedSmall++; continue; }
    const obs: Observation[] = group.map((g) => ({
      price_pretax: g.price_pretax,
      scraped_at: g.scraped_at,
      dispensary_id: g.dispensary_id,
    }));
    const b = computeBaseline(obs);
    if (!b) { skippedSmall++; continue; }
    const sanity = applySanity(group[0].canonical_category, group[0].canonical_unit, b.median);
    if (!sanity.passed) sanityFailed++;
    rows.push({
      canonical_product_id: cpId,
      geo_scope: GEO_SCOPE,
      price_kind: "pretax",
      median: b.median, min: b.min, max: b.max, p25: b.p25, p75: b.p75,
      sample_size: b.sample_size,
      source_snapshot_window_start: b.window_start,
      source_snapshot_window_end: b.window_end,
      sanity_passed: sanity.passed,
      sanity_flag: sanity.flag,
    });
  }

  console.log(`Eligible canonical_products: ${rows.length} (skipped ${skippedSmall} with <${MIN_SAMPLES} samples).`);
  console.log(`Sanity gate: passed=${rows.length - sanityFailed}  flagged=${sanityFailed}`);
  if (sanityFailed > 0) {
    console.log("\nFlagged samples (median, gate):");
    for (const r of rows.filter((r) => !r.sanity_passed).slice(0, 20)) {
      console.log(`  cp=${r.canonical_product_id}  median=${r.median.toFixed(2)}  flag="${r.sanity_flag}"`);
    }
  }

  if (!APPLY) {
    console.log("\nDry-run. Pass --apply to insert into price_baselines.");
    return;
  }

  await insertBaselines(rows);
  console.log(`\nApplied: ${rows.length} baseline rows inserted (geo=${GEO_SCOPE}, kind=pretax).`);
}

main().catch((e) => { console.error(e); exit(1); });
