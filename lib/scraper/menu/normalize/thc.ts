// lib/scraper/menu/normalize/thc.ts
// Parse raw THC strings into a single comparable percent + the IL DOR
// excise tier the SKU falls into.
//
// Raw shapes observed across platforms:
//   "22.5%"       single value
//   "18.2-22.0%"  range
//   "18%-22%"     range
//   "THC: 21.8% / CBD: 0.4%"   labeled compound
//   "THCa 25.6%"  THCa-only -> apply adjusted formula 0.877 * THCa
//   "100mg"       edibles -- not a percent; tier=infused regardless
//   null          unknown -> tier=unknown
//
// IL DOR excise tier (per il_cannabis_tax_structure.json):
//   non_infused_le_35   adj THC <= 35%       (flower, preroll, vape, concentrate)
//   non_infused_gt_35   adj THC >  35%       (same product types)
//   infused             flat 20% regardless  (edibles, tinctures, topicals)
//
// adjusted_THC% = delta9_THC% + 0.877 * THCa%
// Menu-displayed "total THC%" is usually a close proxy.

import type { ProductFamily } from "./units";

export type ThcTier = "non_infused_le_35" | "non_infused_gt_35" | "infused" | "unknown";

export interface ThcResolution {
  thc_pct: number | null;        // single comparable percent (midpoint for ranges)
  thc_pct_low: number | null;
  thc_pct_high: number | null;
  thc_tier: ThcTier;
  confidence: number;            // 0..1, lower for inferred / ranges
}

const INFUSED_FAMILIES: ProductFamily[] = ["edibles", "tincture", "topical"];

function isInfusedFamily(family: ProductFamily): boolean {
  return INFUSED_FAMILIES.includes(family);
}

function tierFromPct(adjPct: number): ThcTier {
  return adjPct > 35 ? "non_infused_gt_35" : "non_infused_le_35";
}

export function resolveThc(rawThc: string | null, family: ProductFamily): ThcResolution {
  // Edibles/tinctures/topicals: tier is fixed regardless of THC %.
  if (isInfusedFamily(family)) {
    // Try to capture a milligram value for reporting but don't drive tier.
    return {
      thc_pct: null,
      thc_pct_low: null,
      thc_pct_high: null,
      thc_tier: "infused",
      confidence: 1.0,
    };
  }

  if (!rawThc) {
    return {
      thc_pct: null,
      thc_pct_low: null,
      thc_pct_high: null,
      thc_tier: "unknown",
      confidence: 0,
    };
  }

  const s = rawThc.trim();

  // THCa-only ("THCa 25.6%") -> apply adjusted formula.
  const thcaOnly = s.match(/THCa[^\d]*(\d+(?:\.\d+)?)\s*%/i);
  if (thcaOnly && !/\bTHC\b/i.test(s.replace(/THCa/gi, ""))) {
    const thca = Number(thcaOnly[1]);
    const adj = thca * 0.877;
    return {
      thc_pct: round1(adj),
      thc_pct_low: round1(adj),
      thc_pct_high: round1(adj),
      thc_tier: tierFromPct(adj),
      confidence: 0.9,
    };
  }

  // Range: "18.2-22.0%" or "18%-22%"
  const range = s.match(/(\d+(?:\.\d+)?)\s*%?\s*[-–]\s*(\d+(?:\.\d+)?)\s*%/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    if (lo > 0 && hi > 0 && hi >= lo) {
      const mid = (lo + hi) / 2;
      return {
        thc_pct: round1(mid),
        thc_pct_low: round1(lo),
        thc_pct_high: round1(hi),
        thc_tier: tierFromPct(mid),
        confidence: 0.85,
      };
    }
  }

  // Single value: "22.5%" or "THC: 21.8% / CBD: 0.4%"
  const single = s.match(/(?:THC[:\s]*)?(\d+(?:\.\d+)?)\s*%/i);
  if (single) {
    const v = Number(single[1]);
    if (v > 0 && v < 100) {
      return {
        thc_pct: round1(v),
        thc_pct_low: round1(v),
        thc_pct_high: round1(v),
        thc_tier: tierFromPct(v),
        confidence: 0.95,
      };
    }
  }

  return {
    thc_pct: null,
    thc_pct_low: null,
    thc_pct_high: null,
    thc_tier: "unknown",
    confidence: 0,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export const __testing = { tierFromPct, isInfusedFamily };
