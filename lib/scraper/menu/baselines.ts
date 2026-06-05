// lib/scraper/menu/baselines.ts
// Compute local price bands per canonical_product and apply the sanity
// gate from reference-data/price_band_sanity.json.
//
// Inputs
//   * latest-snapshot menu_item observations per canonical_product, filtered
//     to a geo scope (Central IL today; per-city / per-radius later).
//   * the sanity bands keyed by class identifier (e.g. flower_3.5g_eighth).
//
// Output
//   * one row per (canonical_product, geo_scope, price_kind) into
//     price_baselines. sanity_passed=false rows still get inserted so the
//     ledger has the history; they're filtered by `latest_baselines` view
//     where sanity_passed=true.

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface SanityBand {
  low: number;
  typical: number;
  high: number;
  observed_sale_floor?: number;
  unit: string;
}

interface SanityFile {
  bands: Record<string, SanityBand>;
  sanity_rule: string;
}

let _sanity: SanityFile | null = null;
function loadSanity(): SanityFile {
  if (_sanity) return _sanity;
  const p = join(process.cwd(), "reference-data", "price_band_sanity.json");
  _sanity = JSON.parse(readFileSync(p, "utf8")) as SanityFile;
  return _sanity;
}

export interface Observation {
  price_pretax: number;
  scraped_at: string;
  dispensary_id: string;
}

export interface Baseline {
  median: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  sample_size: number;
  window_start: string;
  window_end: string;
}

export function computeBaseline(obs: Observation[]): Baseline | null {
  if (obs.length === 0) return null;
  const prices = obs.map((o) => o.price_pretax).filter((p) => p > 0).sort((a, b) => a - b);
  if (prices.length === 0) return null;
  const times = obs.map((o) => o.scraped_at).sort();
  return {
    median: percentile(prices, 50),
    min: prices[0],
    max: prices[prices.length - 1],
    p25: percentile(prices, 25),
    p75: percentile(prices, 75),
    sample_size: prices.length,
    window_start: times[0],
    window_end: times[times.length - 1],
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

/** Map a (canonical_category, canonical_unit) to a sanity-band key.
 *  Returns null if no sanity band exists for the class. */
export function sanityKey(category: string, unit: string): string | null {
  // The bands file uses keys like:
  //   flower_3.5g_eighth, flower_7g_quarter, vape_0.5g, vape_1g,
  //   concentrate_1g, preroll_1g_single, edible_100mg_pack
  // We map by category+unit; for edibles we collapse pack count to the
  // 100mg-pack band as a coarse check (different pack sizes have their
  // own legitimate ranges; tighten later).
  switch (category) {
    case "flower":
      if (unit === "3.5g") return "flower_3.5g_eighth";
      if (unit === "7g") return "flower_7g_quarter";
      if (unit === "14g") return "flower_14g_half";
      if (unit === "28g") return "flower_28g_ounce";
      return null;
    case "vape":
      if (unit === "0.5g") return "vape_0.5g";
      if (unit === "1g") return "vape_1g";
      return null;
    case "concentrate":
      if (unit === "1g") return "concentrate_1g";
      return null;
    case "preroll":
      if (unit.startsWith("1g")) return "preroll_1g_single";
      return null;
    case "edible":
      if (unit.startsWith("100mg")) return "edible_100mg_pack";
      return null;
    default:
      return null;
  }
}

export interface SanityResult {
  passed: boolean;
  flag: string | null;
}

export function applySanity(category: string, unit: string, median: number): SanityResult {
  const key = sanityKey(category, unit);
  if (!key) return { passed: true, flag: null }; // no band -> nothing to check
  const band = loadSanity().bands[key];
  if (!band) return { passed: true, flag: null };
  const minAllowed = band.low * 0.6;
  const maxAllowed = band.high * 1.5;
  if (median < minAllowed) {
    return { passed: false, flag: `median ${median.toFixed(2)} < ${minAllowed.toFixed(2)} (low*0.6 for ${key})` };
  }
  if (median > maxAllowed) {
    return { passed: false, flag: `median ${median.toFixed(2)} > ${maxAllowed.toFixed(2)} (high*1.5 for ${key})` };
  }
  return { passed: true, flag: null };
}

export const __testing = { percentile };
