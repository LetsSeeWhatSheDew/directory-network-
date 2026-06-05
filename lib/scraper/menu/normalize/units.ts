// lib/scraper/menu/normalize/units.ts
// Canonical unit + unit_count resolution from raw weight strings.
//
// Consumes reference-data/unit_normalization_map.json (loaded at module init).
// Returns { canonical_unit, unit_count, confidence } or null if both the
// alias map AND the regex fallbacks fail.
//
// Confidence rubric:
//   1.0  alias map hit (deterministic)
//   0.7  regex hit (deterministic on the unit number, but category was guessed)
//   null no hit -> caller queues to review_queue with reason='unmatched_unit'

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface UnitMapEntry {
  aliases: string[];
  grams?: number;
  grams_each?: number;
  count?: number;
  total_mg?: number;
  mg_each?: number;
}

interface UnitCategory {
  canonical: string;
  map: Record<string, UnitMapEntry>;
}

interface UnitMap {
  flower: UnitCategory;
  pre_rolls: UnitCategory;
  vapes: UnitCategory;
  concentrates: UnitCategory;
  edibles: UnitCategory;
  regex_patterns: {
    grams: string;
    ounce_fraction: string;
    edible_mg_pack: string;
  };
}

let _map: UnitMap | null = null;
function loadMap(): UnitMap {
  if (_map) return _map;
  const path = join(process.cwd(), "reference-data", "unit_normalization_map.json");
  const raw = readFileSync(path, "utf8");
  _map = JSON.parse(raw) as UnitMap;
  return _map;
}

export type ProductFamily = "flower" | "pre_rolls" | "vapes" | "concentrates" | "edibles" | "topical" | "tincture" | "other";

export interface UnitResolution {
  canonical_unit: string;     // e.g. "3.5g", "0.5g_5pk", "100mg_10pk"
  unit_count: number;         // pack count; 1 for singles
  confidence: number;         // 0..1
  family: ProductFamily;
}

/** Best-effort family detection from a raw category string. */
export function familyFromCategory(rawCategory: string | null): ProductFamily {
  const c = (rawCategory || "").toLowerCase();
  if (c.includes("pre-roll") || c.includes("preroll") || c.includes("joint")) return "pre_rolls";
  if (c.startsWith("flower") || c === "bud") return "flower";
  if (c.includes("vap") || c.includes("cart") || c === "vaporizer" || c === "vaporizers") return "vapes";
  if (c.includes("concentrate") || c.includes("extract") || c.includes("dab") || c.includes("rosin") || c.includes("resin")) return "concentrates";
  if (c.includes("edible") || c.includes("gummies") || c.includes("chocolate") || c.includes("beverage") || c.includes("drink") || c.includes("chew")) return "edibles";
  if (c.includes("tincture")) return "tincture";
  if (c.includes("topical") || c.includes("balm") || c.includes("lotion")) return "topical";
  return "other";
}

function normalizeWeightString(w: string): string {
  return w.toLowerCase().trim().replace(/\s+/g, " ");
}

function tryAliasMap(
  weight: string,
  family: ProductFamily
): UnitResolution | null {
  const map = loadMap();
  const category = ((): UnitCategory | null => {
    switch (family) {
      case "flower": return map.flower;
      case "pre_rolls": return map.pre_rolls;
      case "vapes": return map.vapes;
      case "concentrates": return map.concentrates;
      case "edibles": return map.edibles;
      default: return null;
    }
  })();
  if (!category) return null;
  const w = normalizeWeightString(weight);
  for (const [canonical, entry] of Object.entries(category.map)) {
    for (const alias of entry.aliases) {
      if (alias.toLowerCase() === w) {
        return {
          canonical_unit: canonical,
          unit_count: entry.count ?? 1,
          confidence: 1.0,
          family,
        };
      }
    }
  }
  return null;
}

function tryRegex(
  weight: string,
  family: ProductFamily
): UnitResolution | null {
  const w = normalizeWeightString(weight);
  const map = loadMap();

  // Edible mg+pack pattern: "100mg 10pk", "200mg 20 count"
  if (family === "edibles") {
    const m = w.match(new RegExp(map.regex_patterns.edible_mg_pack, "i"));
    if (m) {
      const totalMg = Number(m[1]);
      const count = Number(m[2]);
      return {
        canonical_unit: `${totalMg}mg_${count}pk`,
        unit_count: count,
        confidence: 0.7,
        family,
      };
    }
    // Solo mg unit (drink/syringe): "100mg" without pack
    const mg = w.match(/(\d+)\s*mg\b/);
    if (mg) {
      return {
        canonical_unit: `${Number(mg[1])}mg_1pk`,
        unit_count: 1,
        confidence: 0.6,
        family,
      };
    }
  }

  // Flower / vape / concentrate / pre-roll grams
  const grams = w.match(new RegExp(map.regex_patterns.grams, "i"));
  if (grams) {
    const n = Number(grams[1]);
    if (!Number.isFinite(n) || n <= 0) return null;
    // Normalize to bucket if it's near a standard size
    const STANDARD = [0.3, 0.35, 0.5, 1, 2, 2.5, 3.5, 7, 14, 28];
    const nearest = STANDARD.reduce((best, s) =>
      Math.abs(s - n) < Math.abs(best - n) ? s : best, STANDARD[0]
    );
    const useNearest = Math.abs(nearest - n) < 0.05;
    const canonical = useNearest ? `${nearest}g` : `${n}g`;
    return { canonical_unit: canonical, unit_count: 1, confidence: 0.7, family };
  }

  // Ounce fractions: "1/8", "eighth", "quarter", "half", "ounce"
  const oz = w.match(new RegExp(map.regex_patterns.ounce_fraction, "i"));
  if (oz) {
    const tok = oz[1].toLowerCase().replace(/\s/g, "");
    if (tok.includes("eighth") || tok === "1/8") return { canonical_unit: "3.5g", unit_count: 1, confidence: 0.9, family: family === "other" ? "flower" : family };
    if (tok.includes("quarter") || tok === "1/4") return { canonical_unit: "7g", unit_count: 1, confidence: 0.9, family: family === "other" ? "flower" : family };
    if (tok.includes("half") || tok === "1/2") return { canonical_unit: "14g", unit_count: 1, confidence: 0.9, family: family === "other" ? "flower" : family };
    if (tok === "ounce" || tok === "oz") return { canonical_unit: "28g", unit_count: 1, confidence: 0.9, family: family === "other" ? "flower" : family };
  }

  return null;
}

export function resolveUnit(
  rawWeight: string | null,
  rawCategory: string | null
): UnitResolution | null {
  if (!rawWeight) return null;
  const family = familyFromCategory(rawCategory);
  return tryAliasMap(rawWeight, family) ?? tryRegex(rawWeight, family);
}

export const __testing = { tryAliasMap, tryRegex, familyFromCategory, normalizeWeightString };
