// lib/scraper/menu/normalize/brands.ts
// Canonical brand resolution from raw brand strings.
//
// Strategy
//   1. Exact alias match (case-insensitive, punctuation-stripped)  -> conf 1.0
//   2. Loose alias match (whitespace/dash/period collapsed)         -> conf 0.95
//   3. Substring containment in either direction                    -> conf 0.8
//   4. Levenshtein-distance <= 2 on normalized form                  -> conf 0.7
//   else: null -> review queue with reason='unmatched_brand'
//
// Brand list is loaded from reference-data/brand_master.json (built by
// Cowork). Variants are pre-mapped (e.g. 'rythm','rhythm' -> rythm).

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface BrandEntry {
  canonical_id: string;
  display: string;
  variants: string[];
  parent_company?: string;
}

interface BrandMaster {
  brands: BrandEntry[];
}

let _master: BrandMaster | null = null;
function loadMaster(): BrandMaster {
  if (_master) return _master;
  const path = join(process.cwd(), "reference-data", "brand_master.json");
  _master = JSON.parse(readFileSync(path, "utf8")) as BrandMaster;
  return _master;
}

// Pre-built alias index: every normalized variant -> canonical_id.
// Built once on first call.
let _aliasIndex: Map<string, string> | null = null;
let _looseIndex: Map<string, string> | null = null;

function normLoose(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")    // strip diacritics
    .replace(/[^a-z0-9]/g, "");          // strip everything but alnum
}

function normExact(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function buildIndexes(): void {
  const m = loadMaster();
  _aliasIndex = new Map();
  _looseIndex = new Map();
  for (const b of m.brands) {
    for (const v of b.variants) {
      _aliasIndex.set(normExact(v), b.canonical_id);
      _looseIndex.set(normLoose(v), b.canonical_id);
    }
    // Always include display + canonical_id as additional aliases
    _aliasIndex.set(normExact(b.display), b.canonical_id);
    _aliasIndex.set(normExact(b.canonical_id), b.canonical_id);
    _looseIndex.set(normLoose(b.display), b.canonical_id);
    _looseIndex.set(normLoose(b.canonical_id), b.canonical_id);
  }
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  // Classic DP, O(n*m). Brand strings are short so this is fine.
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export interface BrandResolution {
  canonical_id: string;
  display: string;
  confidence: number;          // 0..1
  method: "exact" | "loose" | "substring" | "edit_distance";
}

export function resolveBrand(rawBrand: string | null): BrandResolution | null {
  if (!rawBrand) return null;
  if (!_aliasIndex || !_looseIndex) buildIndexes();
  const master = loadMaster();

  // 1. exact
  const ex = _aliasIndex!.get(normExact(rawBrand));
  if (ex) {
    const b = master.brands.find((x) => x.canonical_id === ex)!;
    return { canonical_id: b.canonical_id, display: b.display, confidence: 1.0, method: "exact" };
  }

  // 2. loose
  const loose = _looseIndex!.get(normLoose(rawBrand));
  if (loose) {
    const b = master.brands.find((x) => x.canonical_id === loose)!;
    return { canonical_id: b.canonical_id, display: b.display, confidence: 0.95, method: "loose" };
  }

  const lo = normLoose(rawBrand);
  if (lo.length < 3) return null;

  // 3. substring (in either direction)
  for (const b of master.brands) {
    for (const v of [b.display, ...b.variants]) {
      const lv = normLoose(v);
      if (lv.length < 3) continue;
      if (lo.includes(lv) || lv.includes(lo)) {
        return { canonical_id: b.canonical_id, display: b.display, confidence: 0.8, method: "substring" };
      }
    }
  }

  // 4. edit distance <= 2
  let best: { b: BrandEntry; d: number } | null = null;
  for (const b of master.brands) {
    for (const v of [b.display, ...b.variants]) {
      const lv = normLoose(v);
      if (Math.abs(lv.length - lo.length) > 2) continue;
      const d = levenshtein(lo, lv);
      if (d <= 2 && (!best || d < best.d)) best = { b, d };
    }
  }
  if (best) {
    return { canonical_id: best.b.canonical_id, display: best.b.display, confidence: 0.7, method: "edit_distance" };
  }

  return null;
}

export function brandDisplay(canonicalId: string): string | null {
  const m = loadMaster();
  return m.brands.find((b) => b.canonical_id === canonicalId)?.display ?? null;
}

export const __testing = { normLoose, normExact, levenshtein };
