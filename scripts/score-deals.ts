// scripts/score-deals.ts
// =============================================================================
// Score active `deals` rows against the latest price baseline.
//
// Matching strategy (simple by design):
//   1. Resolve deal.listing_slug -> master_listings -> dispensaries by slug.
//      If the menu pipeline's dispensaries.slug == the deal's listing_slug
//      (common case for the 10 CIL stores), direct match. Otherwise the
//      deal is logged as no_canonical_match.
//   2. For each canonical_product seen at that dispensary recently,
//      score the deal's price against the band. We don't try to fuzzy-
//      match deal.title to product_name -- if a deal is a category-level
//      "30% off all flower", we'd need to compute against multiple bands,
//      which the v1 scorer skips. v1 handles single-SKU deals with
//      original_price / sale_price set.
//
// Cardinality
//   This is INTENTIONALLY append-only per Phase 6 pattern. Re-running
//   inserts new deal_scores rows; `latest_deal_scores` view exposes
//   the most recent score per deal.
//
// Usage
//   npx tsx scripts/score-deals.ts --report
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/score-deals.ts --apply
// =============================================================================

import { argv, exit, env } from "node:process";
import { scoreDeal, type ScoreOutput } from "../lib/scraper/menu/scoreDeal";

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const READ_KEY = SERVICE_KEY || ANON_KEY;
if (!READ_KEY) { console.error("ERROR: need SUPABASE_*_KEY."); exit(1); }

const APPLY = argv.includes("--apply");
if (APPLY && !SERVICE_KEY) { console.error("ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY."); exit(1); }

interface DealRow {
  id: string;
  listing_slug: string;
  title: string;
  category: string | null;
  unit: string | null;
  original_price: number | null;
  sale_price: number | null;
  is_active: boolean;
}

async function fetchActiveDeals(): Promise<DealRow[]> {
  const url = `${SUPABASE_URL}/rest/v1/deals?select=id,listing_slug,title,category,unit,original_price,sale_price,is_active&is_active=eq.true&project_tag=eq.green&sale_price=not.is.null&limit=1000`;
  const res = await fetch(url, { headers: { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY!}` } });
  if (!res.ok) throw new Error(`fetch deals ${res.status}: ${await res.text()}`);
  return (await res.json()) as DealRow[];
}

interface BaselineRow {
  id: string;
  canonical_product_id: string;
  median: number; p25: number; p75: number;
  canonical_products: {
    canonical_category: string;
    canonical_unit: string;
  };
}

interface DispRow { id: string; slug: string }

async function fetchDispensariesBySlug(slugs: string[]): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();
  const list = `(${slugs.map((s) => `"${s}"`).join(",")})`;
  const url = `${SUPABASE_URL}/rest/v1/dispensaries?select=id,slug&slug=in.${encodeURIComponent(list)}`;
  const res = await fetch(url, { headers: { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY!}` } });
  if (!res.ok) throw new Error(`fetch dispensaries ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as DispRow[];
  const out = new Map<string, string>();
  for (const r of rows) out.set(r.slug, r.id);
  return out;
}

/** Fetch latest baselines for canonical_products that have been observed
 *  at the given dispensary, filtered to (category, unit) the deal is for. */
async function fetchMatchingBaseline(
  dispensaryId: string,
  category: string | null,
  unit: string | null
): Promise<BaselineRow | null> {
  if (!category) return null;
  // Map deal.category + deal.unit to canonical_category + canonical_unit
  const canonicalCategory = mapDealCategory(category);
  const canonicalUnit = mapDealUnit(unit);
  if (!canonicalCategory || !canonicalUnit) return null;

  // Find canonical_products observed at this dispensary in the last 30d
  // matching the (category, unit). Then take their latest baseline.
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const url =
    `${SUPABASE_URL}/rest/v1/menu_items?select=canonical_product_id,canonical_products!inner(canonical_category,canonical_unit)` +
    `&dispensary_id=eq.${dispensaryId}` +
    `&scraped_at=gte.${encodeURIComponent(since)}` +
    `&canonical_product_id=not.is.null` +
    `&canonical_products.canonical_category=eq.${canonicalCategory}` +
    `&canonical_products.canonical_unit=eq.${canonicalUnit}` +
    `&limit=50`;
  const res = await fetch(url, { headers: { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY!}` } });
  if (!res.ok) return null;
  const items = (await res.json()) as Array<{ canonical_product_id: string; canonical_products: { canonical_category: string; canonical_unit: string } }>;
  if (items.length === 0) return null;

  // Average baseline across canonical_products at this store for that
  // (category, unit) class -- the deal usually targets a class, not a SKU.
  // We pull the latest_baselines for these canonical_products and aggregate.
  const cpIds = [...new Set(items.map((i) => i.canonical_product_id))];
  const idList = `(${cpIds.map((s) => `"${s}"`).join(",")})`;
  const blUrl =
    `${SUPABASE_URL}/rest/v1/latest_baselines?select=id,canonical_product_id,median,p25,p75` +
    `&canonical_product_id=in.${encodeURIComponent(idList)}` +
    `&price_kind=eq.pretax`;
  const blRes = await fetch(blUrl, { headers: { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY!}` } });
  if (!blRes.ok) return null;
  const bls = (await blRes.json()) as Array<{ id: string; canonical_product_id: string; median: number; p25: number; p75: number }>;
  if (bls.length === 0) return null;

  // Class-level aggregate: median of medians, min(p25), max(p75)
  const medians = bls.map((b) => b.median).sort((a, b) => a - b);
  const median = medians[Math.floor(medians.length / 2)];
  const p25 = Math.min(...bls.map((b) => b.p25));
  const p75 = Math.max(...bls.map((b) => b.p75));
  return {
    id: bls[0].id,           // representative baseline id
    canonical_product_id: bls[0].canonical_product_id,
    median, p25, p75,
    canonical_products: { canonical_category: canonicalCategory, canonical_unit: canonicalUnit },
  };
}

function mapDealCategory(deal: string | null): string | null {
  if (!deal) return null;
  const s = deal.toLowerCase();
  if (s.startsWith("flower")) return "flower";
  if (s.includes("pre-roll") || s.includes("preroll")) return "preroll";
  if (s.includes("vape") || s.includes("cart")) return "vape";
  if (s.includes("concentrate") || s.includes("extract")) return "concentrate";
  if (s.includes("edible") || s.includes("gummies")) return "edible";
  if (s.includes("topical")) return "topical";
  return null;
}

function mapDealUnit(deal: string | null): string | null {
  if (!deal) return null;
  const s = deal.toLowerCase();
  if (s === "eighth" || s === "1/8") return "3.5g";
  if (s === "quarter" || s === "1/4") return "7g";
  if (s === "half" || s === "1/2") return "14g";
  if (s === "oz" || s === "ounce") return "28g";
  if (s === "gram" || s === "1g") return "1g";
  if (s === "each" || s === "pack") return "1g"; // best-effort for prerolls/edibles
  return null;
}

interface ScoreRow {
  deal_id: string;
  canonical_product_id: string | null;
  baseline_id: string | null;
  observed_price: number;
  baseline_median: number | null;
  baseline_p25: number | null;
  baseline_p75: number | null;
  discount_vs_median: number | null;
  score_label: string;
  reason: string | null;
}

async function insertScores(rows: ScoreRow[]): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_scores`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY!,
        Authorization: `Bearer ${SERVICE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`insert deal_scores ${res.status}: ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  console.log(`Score deals  apply=${APPLY}\n`);
  const deals = await fetchActiveDeals();
  console.log(`Fetched ${deals.length} active deals with sale_price.\n`);

  const slugs = [...new Set(deals.map((d) => d.listing_slug))];
  const dispBySlug = await fetchDispensariesBySlug(slugs);
  console.log(`Resolved ${dispBySlug.size}/${slugs.length} listing_slug -> dispensary.\n`);

  const scoreRows: ScoreRow[] = [];
  const counters = { unknown: 0, great_deal: 0, fair_deal: 0, weak_deal: 0, no_real_savings: 0, no_disp: 0, no_baseline: 0 };

  for (const d of deals) {
    if (d.sale_price == null) continue;
    const dispId = dispBySlug.get(d.listing_slug);
    if (!dispId) {
      counters.no_disp++;
      scoreRows.push({
        deal_id: d.id, canonical_product_id: null, baseline_id: null,
        observed_price: d.sale_price,
        baseline_median: null, baseline_p25: null, baseline_p75: null,
        discount_vs_median: null, score_label: "unknown",
        reason: `listing_slug "${d.listing_slug}" not in dispensaries table`,
      });
      continue;
    }
    const baseline = await fetchMatchingBaseline(dispId, d.category, d.unit);
    if (!baseline) {
      counters.no_baseline++;
      scoreRows.push({
        deal_id: d.id, canonical_product_id: null, baseline_id: null,
        observed_price: d.sale_price,
        baseline_median: null, baseline_p25: null, baseline_p75: null,
        discount_vs_median: null, score_label: "unknown",
        reason: `no baseline for category=${d.category} unit=${d.unit} at ${d.listing_slug}`,
      });
      continue;
    }
    const score: ScoreOutput = scoreDeal({
      observedPrice: d.sale_price,
      baseline: { median: baseline.median, p25: baseline.p25, p75: baseline.p75 },
    });
    counters[score.label]++;
    scoreRows.push({
      deal_id: d.id,
      canonical_product_id: baseline.canonical_product_id,
      baseline_id: baseline.id,
      observed_price: d.sale_price,
      baseline_median: baseline.median,
      baseline_p25: baseline.p25,
      baseline_p75: baseline.p75,
      discount_vs_median: score.discount_vs_median,
      score_label: score.label,
      reason: null,
    });
  }

  console.log("Score distribution:", counters);

  if (APPLY) {
    await insertScores(scoreRows);
    console.log(`\nApplied: inserted ${scoreRows.length} deal_scores rows.`);
  } else {
    console.log("\nDry-run. Pass --apply to insert into deal_scores.");
    for (const r of scoreRows.slice(0, 5)) {
      console.log(`  deal=${r.deal_id.slice(0, 8)}  label=${r.score_label}  obs=${r.observed_price}  median=${r.baseline_median ?? "n/a"}  reason=${r.reason ?? ""}`);
    }
  }
}

main().catch((e) => { console.error(e); exit(1); });
