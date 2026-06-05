// lib/scraper/menu/normalize/index.ts
// Main normalization entry point. Reads raw menu_items rows, derives
// normalized fields (canonical_brand_id, canonical_unit, thc_tier,
// price_pretax, match_confidence) and maps to canonical_products.
//
// What this file does NOT do
//   * Compute baselines (Phase 6).
//   * Tax / OTD modeling (Phase 7).
//   * Score deals (Phase 7).
//
// The single rule: never silently drop. Anything we can't map gets a
// review_queue row.

import { resolveUnit, familyFromCategory, type UnitResolution, type ProductFamily } from "./units";
import { resolveBrand, brandDisplay, type BrandResolution } from "./brands";
import { resolveThc, type ThcResolution, type ThcTier } from "./thc";

export interface RawRowIn {
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

export interface NormalizedRow {
  id: string;
  canonical_brand_id: string | null;
  canonical_category: string;          // 'flower' | 'preroll' | 'vape' | 'concentrate' | 'edible' | 'topical' | 'tincture' | 'other'
  canonical_unit: string | null;
  unit_count: number | null;
  thc_pct: number | null;
  thc_pct_low: number | null;
  thc_pct_high: number | null;
  thc_tier: ThcTier;
  price_pretax: number;                // sale price if on sale, else list
  match_confidence: number;            // 0..1
}

export interface ReviewIssue {
  menu_item_id: string;
  reason: "unmatched_brand" | "unmatched_unit" | "unmatched_category" | "low_confidence_match" | "thc_unparseable";
  detail: string;
}

export interface NormalizationResult {
  normalized: NormalizedRow;
  issues: ReviewIssue[];
  product_key: ProductKey | null;       // identity for canonical_products upsert
  product_display_name: string;          // normalized title-cased name
}

/** Identity used by canonical_products UNIQUE constraint. */
export interface ProductKey {
  canonical_brand_id: string;
  product_name: string;          // lowercase, normalized
  canonical_unit: string;
  unit_count: number;
}

const CANONICAL_CATEGORY_MAP: Record<ProductFamily, string> = {
  flower: "flower",
  pre_rolls: "preroll",
  vapes: "vape",
  concentrates: "concentrate",
  edibles: "edible",
  topical: "topical",
  tincture: "tincture",
  other: "other",
};

export function normalize(row: RawRowIn): NormalizationResult {
  const issues: ReviewIssue[] = [];
  const family = familyFromCategory(row.raw_category);

  // Brand
  const brand = resolveBrand(row.raw_brand);
  if (!brand) {
    issues.push({
      menu_item_id: row.id,
      reason: "unmatched_brand",
      detail: `raw_brand="${row.raw_brand ?? ""}"`,
    });
  } else if (brand.confidence < 0.7) {
    issues.push({
      menu_item_id: row.id,
      reason: "low_confidence_match",
      detail: `brand match via ${brand.method} confidence=${brand.confidence}`,
    });
  }

  // Unit
  const unit = resolveUnit(row.raw_weight, row.raw_category);
  if (!unit) {
    issues.push({
      menu_item_id: row.id,
      reason: "unmatched_unit",
      detail: `raw_weight="${row.raw_weight ?? ""}" category="${row.raw_category ?? ""}"`,
    });
  }

  // THC
  const thc = resolveThc(row.raw_thc, family);
  if (thc.thc_tier === "unknown" && row.raw_thc) {
    issues.push({
      menu_item_id: row.id,
      reason: "thc_unparseable",
      detail: `raw_thc="${row.raw_thc}"`,
    });
  }

  // Category: family => canonical_category. "other" stays "other" but
  // does not block the match -- e.g. accessories/gear flow through as
  // category=other with no canonical_product mapping.
  const canonical_category = CANONICAL_CATEGORY_MAP[family];
  if (family === "other") {
    issues.push({
      menu_item_id: row.id,
      reason: "unmatched_category",
      detail: `raw_category="${row.raw_category ?? ""}"`,
    });
  }

  // price_pretax: sale price if on sale, else list.
  const price_pretax = row.is_on_sale && row.raw_sale_price != null
    ? row.raw_sale_price
    : row.raw_price;

  // Overall confidence is the geometric mean of contributing signals.
  // Missing signal => factor 0.5 (penalize uncertainty).
  const factors = [
    brand?.confidence ?? 0.5,
    unit?.confidence ?? 0.5,
    family === "other" ? 0.5 : 1.0,
  ];
  const overall = factors.reduce((a, b) => a * b, 1) ** (1 / factors.length);

  const productName = normalizeProductName(row.raw_name);

  const normalized: NormalizedRow = {
    id: row.id,
    canonical_brand_id: brand?.canonical_id ?? null,
    canonical_category,
    canonical_unit: unit?.canonical_unit ?? null,
    unit_count: unit?.unit_count ?? null,
    thc_pct: thc.thc_pct,
    thc_pct_low: thc.thc_pct_low,
    thc_pct_high: thc.thc_pct_high,
    thc_tier: thc.thc_tier,
    price_pretax,
    match_confidence: round2(overall),
  };

  // Only build a product key when brand + unit are both present. Items
  // without those can't dedup safely across stores -- they live as
  // unmatched menu_items and surface in the review queue.
  const product_key: ProductKey | null =
    brand && unit && family !== "other"
      ? {
          canonical_brand_id: brand.canonical_id,
          product_name: productName,
          canonical_unit: unit.canonical_unit,
          unit_count: unit.unit_count,
        }
      : null;

  return {
    normalized,
    issues,
    product_key,
    product_display_name: titleCase(productName),
  };
}

/** Strip brand prefix from product name when possible -- many stores list
 *  "RYTHM MAC #1" but the brand is already captured separately. We keep
 *  the original lowercase string aside; this returns the cleaned form. */
function normalizeProductName(rawName: string): string {
  return rawName
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2013\u2014]/g, "-")     // en/em dash -> hyphen
    .trim();
}

function titleCase(s: string): string {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export { resolveBrand, resolveUnit, resolveThc, brandDisplay };
export type { ThcTier, ThcResolution, BrandResolution, UnitResolution, ProductFamily };
