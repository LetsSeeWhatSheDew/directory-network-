// lib/dealScoring.ts
// Central helpers for deal math: savings estimation and A/B/C/D grading.
//
// SAVINGS CALCULATION RULES (April 15, 2026 rewrite)
// ---------------------------------------------------
// R1. If original_price AND sale_price exist → savings = original - sale (exact)
// R2. Else if discount_value is a percent → multiply by AVG_SPEND by category
// R3. If calculated savings < $8 → return null (caller shows percent instead)
// R4. Always round to nearest whole dollar; never display cents
//
// AVG_SPEND reflects REAL per-visit basket sizes, not per-unit prices. A
// flower customer spending 30% off "everything" is spending ~$50, not $40
// on one eighth. This is what makes the number on the homepage feel honest.

/** Realistic per-visit basket spend by category (USD). */
export const AVG_SPEND_BY_CATEGORY: Record<string, number> = {
  flower: 50,
  edibles: 30,
  vapes: 55,
  concentrate: 60,
  concentrates: 60,
  all: 65, // storewide = full-shop visit, people spend more
  storewide: 65,
};

/** Minimum calculated savings to show as a dollar amount. */
export const MIN_DOLLAR_SAVINGS = 8;

/** Legacy export — some old code paths still reference AVG_PRICE_BY_CATEGORY. */
export const AVG_PRICE_BY_CATEGORY = AVG_SPEND_BY_CATEGORY;

export type Deal = Record<string, any>;

/**
 * Exact dollar savings when we have both original and sale price.
 * Returns null if either is missing or the math doesn't make sense.
 */
function exactSavings(d: Deal): number | null {
  const orig = Number(d?.original_price);
  const sale = Number(d?.sale_price);
  if (!Number.isFinite(orig) || !Number.isFinite(sale)) return null;
  if (orig <= 0 || sale < 0 || sale >= orig) return null;
  return Math.round(orig - sale);
}

/** Does this deal have an exact price pair we can trust? */
export function hasExactSavings(d: Deal): boolean {
  return exactSavings(d) != null;
}

/**
 * Best estimate of dollar savings for a given deal.
 * Returns null when we shouldn't show a dollar amount (sub-threshold, or
 * we genuinely can't estimate). Callers should fall back to percent copy.
 */
export function estimateSavings(d: Deal): number | null {
  // R1: exact prices — trust them
  const exact = exactSavings(d);
  if (exact != null) {
    return exact >= MIN_DOLLAR_SAVINGS ? exact : null;
  }

  // Explicit savings_amount override (rare, but respect it)
  if (d?.savings_amount && Number(d.savings_amount) > 0) {
    const n = Math.round(Number(d.savings_amount));
    return n >= MIN_DOLLAR_SAVINGS ? n : null;
  }

  const value = Number(d?.discount_value);
  if (!Number.isFinite(value) || value <= 0) return null;

  const unit = (d?.discount_unit || "").toLowerCase();
  const cat = (d?.category || "all").toLowerCase();
  const avg = AVG_SPEND_BY_CATEGORY[cat] ?? AVG_SPEND_BY_CATEGORY.all;

  // Flat dollar discount
  if (unit === "dollars") {
    if (d?.discount_type === "fixed_price") {
      // "5 for $100" style — rough lower bound vs average basket
      const saved = avg - value;
      return saved >= MIN_DOLLAR_SAVINGS ? Math.round(saved) : null;
    }
    return value >= MIN_DOLLAR_SAVINGS ? Math.round(value) : null;
  }

  // R2: percent → average basket spend
  // (unit === "percent", or unit missing but value looks like a percent)
  const pct = value > 100 ? 100 : value;
  const saved = (pct / 100) * avg;
  return saved >= MIN_DOLLAR_SAVINGS ? Math.round(saved) : null;
}

/**
 * Display string for a deal's savings. Follows the 4 rules at the top.
 * Returns things like "SAVE $18", "30% off", "30% off everything",
 * or "Save" as a last resort.
 */
export function formatSavingsDollars(d: Deal): string {
  const n = estimateSavings(d);
  if (n != null) {
    return `SAVE $${n}`;
  }

  // R3 fallback: show the percent instead of a small dollar amount
  const value = Number(d?.discount_value);
  const unit = (d?.discount_unit || "").toLowerCase();
  if (Number.isFinite(value) && value > 0) {
    if (unit === "percent" || (!unit && value <= 100)) {
      return `${Math.round(value)}% OFF`;
    }
    if (unit === "dollars" && d?.discount_type !== "fixed_price") {
      return `$${Math.round(value)} off`;
    }
  }

  return "Deal active";
}

/**
 * Best single-trip savings number across a list of deals. Used by the
 * homepage "average save per trip" callout so the number matches what
 * users actually see in the cards.
 */
export function bestSavings(deals: Deal[]): number | null {
  let best: number | null = null;
  for (const d of deals) {
    const n = estimateSavings(d);
    if (n != null && (best == null || n > best)) best = n;
  }
  return best;
}

export type DealGrade = "A+" | "A" | "B" | "C" | "D";

export interface GradeResult {
  score: number;
  grade: DealGrade;
  color: { bg: string; fg: string };
  label: string;
}

export function scoreDeal(d: Deal): number {
  let s = 0;
  const discount = Number(d?.discount_value) || 0;
  const unit = (d?.discount_unit || "").toLowerCase();
  const pct = unit === "percent" ? discount : unit === "dollars" ? inferPercent(d) : discount;

  if (pct >= 40) s += 40;
  else if (pct >= 25) s += 30;
  else if (pct >= 10) s += 20;
  else s += 10;

  const rating = Number(d?.google_rating) || 0;
  if (rating >= 4.8) s += 20;
  else if (rating >= 4.5) s += 15;

  if (d?.accepts_credit) s += 10;
  if (d?.drive_thru) s += 5;
  if (d?.is_recurring) s += 5;

  if (d?.expires_at) {
    const expires = new Date(d.expires_at).getTime();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (expires > now && expires - now <= oneDay) s += 10;
  }

  return Math.max(0, Math.min(100, s));
}

function inferPercent(d: Deal): number {
  const v = Number(d?.discount_value) || 0;
  const cat = (d?.category || "all").toLowerCase();
  const avg = AVG_SPEND_BY_CATEGORY[cat] ?? AVG_SPEND_BY_CATEGORY.all;
  if (!avg) return 0;
  return Math.min(100, (v / avg) * 100);
}

export function gradeDeal(d: Deal): GradeResult {
  const score = scoreDeal(d);
  if (score >= 80) return { score, grade: "A+", label: "Outstanding", color: { bg: "#16a34a", fg: "#ffffff" } };
  if (score >= 65) return { score, grade: "A", label: "Excellent", color: { bg: "#22c55e", fg: "#ffffff" } };
  if (score >= 50) return { score, grade: "B", label: "Good deal", color: { bg: "#2563eb", fg: "#ffffff" } };
  if (score >= 35) return { score, grade: "C", label: "Decent", color: { bg: "#f59e0b", fg: "#1f2937" } };
  return { score, grade: "D", label: "Weak", color: { bg: "#d1d5db", fg: "#1f2937" } };
}
