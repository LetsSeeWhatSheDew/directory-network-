// lib/dealScoring.ts
// Central helpers for deal math: savings estimation and A/B/C/D grading.

export const AVG_PRICE_BY_CATEGORY: Record<string, number> = {
  flower: 40,
  edibles: 25,
  vapes: 45,
  concentrate: 50,
  concentrates: 50,
  all: 35,
};

export type Deal = Record<string, any>;

/** Estimated dollar savings vs Illinois average. Returns a whole number or null. */
export function estimateSavings(d: Deal): number | null {
  if (d?.savings_amount && d.savings_amount > 0) return Math.round(d.savings_amount);
  const value = Number(d?.discount_value);
  if (!Number.isFinite(value)) return null;

  const unit = d?.discount_unit;
  if (unit === "dollars") {
    if (d?.discount_type === "fixed_price") {
      // Fixed price — treat value as sale price; approximate savings from category avg
      const cat = (d?.category || "all").toLowerCase();
      const avg = AVG_PRICE_BY_CATEGORY[cat] ?? AVG_PRICE_BY_CATEGORY.all;
      // For multi-pack deals (e.g., "5 for $100"), the savings math below is a
      // rough lower bound — it's fine for a "you save ~$X" hint.
      const saved = avg * 5 - value;
      return saved > 0 ? Math.round(saved) : null;
    }
    return Math.round(value); // flat dollar discount
  }

  // Percent (or unknown) — apply to category average
  const cat = (d?.category || "all").toLowerCase();
  const avg = AVG_PRICE_BY_CATEGORY[cat] ?? AVG_PRICE_BY_CATEGORY.all;
  const saved = (value / 100) * avg;
  return saved > 0 ? Math.round(saved) : null;
}

export function formatSavingsDollars(d: Deal): string {
  const n = estimateSavings(d);
  if (n == null) {
    const v = Number(d?.discount_value);
    if (Number.isFinite(v) && d?.discount_unit === "percent") return `${Math.round(v)}% off`;
    return "Save";
  }
  return `~$${n}`;
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
  const unit = d?.discount_unit;
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
  const avg = AVG_PRICE_BY_CATEGORY[cat] ?? AVG_PRICE_BY_CATEGORY.all;
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
