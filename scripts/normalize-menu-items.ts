// scripts/normalize-menu-items.ts
// =============================================================================
// Normalize raw menu_items into canonical_products + write back
// canonical_brand_id / canonical_unit / thc_tier / price_pretax /
// match_confidence on each menu_item row.
//
// Default: process only rows where canonical_product_id IS NULL (incremental).
// --all: re-process every menu_item (useful after a normalizer change).
// --report: print summary, do not write.
//
// Required env
//   SUPABASE_SERVICE_ROLE_KEY for --apply (writes).
//
// Pipeline order
//   1. Fetch a batch of raw menu_items.
//   2. For each: normalize() -> NormalizationResult.
//   3. Group by product_key, upsert into canonical_products (one round-trip
//      per unique key).
//   4. PATCH each menu_item with normalized fields + canonical_product_id.
//   5. Insert any ReviewIssues into review_queue.
//
// Usage
//   npx tsx scripts/normalize-menu-items.ts --report
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/normalize-menu-items.ts --apply
// =============================================================================

import { argv, exit, env } from "node:process";
import { normalize, type NormalizationResult, type ProductKey } from "../lib/scraper/menu/normalize";

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const APPLY = argv.includes("--apply");
const ALL = argv.includes("--all");
const REPORT = argv.includes("--report") || !APPLY;
const BATCH = Number(argv.find((a) => a.startsWith("--batch="))?.split("=")[1] || 500);

if (APPLY && !SERVICE_KEY) {
  console.error("ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY.");
  exit(1);
}
const READ_KEY = SERVICE_KEY || ANON_KEY;
if (!READ_KEY) {
  console.error("ERROR: set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.");
  exit(1);
}

interface RawRow {
  id: string;
  raw_name: string;
  raw_brand: string | null;
  raw_category: string | null;
  raw_weight: string | null;
  raw_price: number;
  raw_sale_price: number | null;
  raw_thc: string | null;
  is_on_sale: boolean;
}

async function fetchBatch(offset: number): Promise<RawRow[]> {
  const filter = ALL ? "" : "&canonical_product_id=is.null";
  const url = `${SUPABASE_URL}/rest/v1/menu_items?select=id,raw_name,raw_brand,raw_category,raw_weight,raw_price,raw_sale_price,raw_thc,is_on_sale${filter}&order=scraped_at.desc&limit=${BATCH}&offset=${offset}`;
  const res = await fetch(url, {
    headers: { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY!}` },
  });
  if (!res.ok) throw new Error(`fetch menu_items ${res.status}: ${await res.text()}`);
  return (await res.json()) as RawRow[];
}

interface UpsertProductRow {
  canonical_brand_id: string;
  product_name: string;
  product_name_display: string;
  canonical_category: string;
  canonical_unit: string;
  unit_count: number;
  default_thc_tier: string;
  last_seen_at: string;
}

async function upsertProducts(rows: UpsertProductRow[]): Promise<Map<string, string>> {
  // canonical_products has UNIQUE(canonical_brand_id, product_name, canonical_unit, unit_count).
  // Use ON CONFLICT merge to be idempotent.
  if (rows.length === 0) return new Map();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/canonical_products?on_conflict=canonical_brand_id,product_name,canonical_unit,unit_count`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY!,
        Authorization: `Bearer ${SERVICE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(rows),
    }
  );
  if (!res.ok) throw new Error(`upsert canonical_products ${res.status}: ${await res.text()}`);
  const out = (await res.json()) as Array<{
    id: string;
    canonical_brand_id: string;
    product_name: string;
    canonical_unit: string;
    unit_count: number;
  }>;
  const map = new Map<string, string>();
  for (const p of out) {
    map.set(keyOf(p), p.id);
  }
  return map;
}

function keyOf(p: { canonical_brand_id: string; product_name: string; canonical_unit: string; unit_count: number }): string {
  return `${p.canonical_brand_id}::${p.product_name}::${p.canonical_unit}::${p.unit_count}`;
}

async function patchMenuItem(
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`PATCH menu_items ${id} ${res.status}: ${await res.text()}`);
}

async function insertReviewIssues(issues: Array<{ menu_item_id: string; reason: string; detail: string }>): Promise<void> {
  if (issues.length === 0) return;
  const rows = issues.map((i) => ({
    menu_item_id: i.menu_item_id,
    reason: i.reason,
    detail: i.detail,
  }));
  const res = await fetch(`${SUPABASE_URL}/rest/v1/review_queue`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`insert review_queue ${res.status}: ${await res.text()}`);
}

async function processBatch(rows: RawRow[]): Promise<{ matched: number; unmatched: number; issues: number }> {
  let matched = 0;
  let unmatched = 0;
  let totalIssues = 0;

  // 1) Normalize all rows
  const results: Array<{ row: RawRow; result: NormalizationResult }> = rows.map((r) => ({
    row: r,
    result: normalize(r),
  }));

  // 2) Build distinct product keys for canonical_products upsert
  const distinct = new Map<string, { key: ProductKey; result: NormalizationResult }>();
  for (const { result } of results) {
    if (!result.product_key) continue;
    const k = keyOf(result.product_key);
    if (!distinct.has(k)) distinct.set(k, { key: result.product_key, result });
  }

  const upsertRows: UpsertProductRow[] = [...distinct.values()].map(({ key, result }) => ({
    canonical_brand_id: key.canonical_brand_id,
    product_name: key.product_name,
    product_name_display: result.product_display_name,
    canonical_category: result.normalized.canonical_category,
    canonical_unit: key.canonical_unit,
    unit_count: key.unit_count,
    default_thc_tier: result.normalized.thc_tier,
    last_seen_at: new Date().toISOString(),
  }));

  let canonicalIdByKey = new Map<string, string>();
  if (APPLY) {
    canonicalIdByKey = await upsertProducts(upsertRows);
  } else {
    for (const r of upsertRows) {
      canonicalIdByKey.set(
        keyOf(r as unknown as { canonical_brand_id: string; product_name: string; canonical_unit: string; unit_count: number }),
        "DRY-RUN-ID"
      );
    }
  }

  // 3) Patch menu_items + collect review issues
  const allIssues: Array<{ menu_item_id: string; reason: string; detail: string }> = [];

  for (const { row, result } of results) {
    const cpId = result.product_key
      ? canonicalIdByKey.get(keyOf(result.product_key))
      : null;
    if (cpId && cpId !== "DRY-RUN-ID") matched++;
    else if (cpId === "DRY-RUN-ID") matched++;
    else unmatched++;

    if (result.issues.length > 0) {
      totalIssues += result.issues.length;
      allIssues.push(...result.issues);
    }

    if (!APPLY) continue;

    const patch: Record<string, unknown> = {
      canonical_brand_id: result.normalized.canonical_brand_id,
      canonical_category: result.normalized.canonical_category,
      canonical_unit: result.normalized.canonical_unit,
      unit_count: result.normalized.unit_count,
      thc_pct: result.normalized.thc_pct,
      thc_pct_low: result.normalized.thc_pct_low,
      thc_pct_high: result.normalized.thc_pct_high,
      thc_tier: result.normalized.thc_tier,
      price_pretax: result.normalized.price_pretax,
      match_confidence: result.normalized.match_confidence,
      canonical_product_id: cpId && cpId !== "DRY-RUN-ID" ? cpId : null,
    };
    await patchMenuItem(row.id, patch);
  }

  if (APPLY && allIssues.length > 0) await insertReviewIssues(allIssues);

  return { matched, unmatched, issues: totalIssues };
}

async function main(): Promise<void> {
  console.log(`Normalize menu_items  apply=${APPLY}  all=${ALL}  batch=${BATCH}\n`);

  let offset = 0;
  let totalMatched = 0;
  let totalUnmatched = 0;
  let totalIssues = 0;
  let pages = 0;

  for (;;) {
    const rows = await fetchBatch(offset);
    if (rows.length === 0) break;
    pages++;
    const r = await processBatch(rows);
    totalMatched += r.matched;
    totalUnmatched += r.unmatched;
    totalIssues += r.issues;
    console.log(`  page ${pages}: ${rows.length} rows  matched=${r.matched}  unmatched=${r.unmatched}  issues=${r.issues}`);
    if (rows.length < BATCH) break;
    offset += BATCH;
  }

  const total = totalMatched + totalUnmatched;
  const rate = total > 0 ? ((totalMatched / total) * 100).toFixed(1) : "0.0";

  console.log(`\nTotal rows processed: ${total}`);
  console.log(`  matched:   ${totalMatched}  (${rate}%)`);
  console.log(`  unmatched: ${totalUnmatched}  -> review_queue`);
  console.log(`  issues:    ${totalIssues}`);
  if (REPORT) console.log("\nDry-run. Pass --apply to write canonical_products + patch menu_items.");
}

main().catch((e) => { console.error(e); exit(1); });
