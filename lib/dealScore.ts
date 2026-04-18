// lib/dealScore.ts
// Deal Quality Score — honest consumer guidance on whether a deal is
// actually worth driving to. Separate from lib/dealScoring.ts (A/B/C/D
// dispensary-weighted grading). This one is discount-only, user-facing,
// and uses plain-language labels the way a friend would.

export type DealGrade = "great" | "solid" | "okay" | "weak";

export interface DealScore {
  grade: DealGrade;
  label: string;
  color: string;
  reason: string;
}

// Accepts both the canonical schema (original_price/deal_price/savings/
// discount_percent) and the PuffPrice DB shape (sale_price/discount_value/
// discount_unit) so existing callers can pass their raw deal object.
type ScoreInput = {
  original_price?: number | null;
  deal_price?: number | null;
  sale_price?: number | null;
  savings?: number | null;
  savings_amount?: number | null;
  discount_percent?: number | null;
  discount_value?: number | null;
  discount_unit?: string | null;
  title?: string | null;
  deal_title?: string | null;
};

function coerceSavings(d: ScoreInput): number {
  const direct =
    (d.savings != null && Number(d.savings)) ||
    (d.savings_amount != null && Number(d.savings_amount)) ||
    0;
  if (direct > 0) return Math.round(direct);

  const orig = Number(d.original_price);
  const sale = Number(d.deal_price ?? d.sale_price);
  if (Number.isFinite(orig) && Number.isFinite(sale) && orig > sale && sale >= 0) {
    return Math.round(orig - sale);
  }

  if ((d.discount_unit || "").toLowerCase() === "dollars") {
    const v = Number(d.discount_value);
    if (Number.isFinite(v) && v > 0) return Math.round(v);
  }

  return 0;
}

function coercePercent(d: ScoreInput): number {
  if (d.discount_percent != null) {
    const p = Number(d.discount_percent);
    if (Number.isFinite(p) && p > 0) return Math.round(p);
  }

  const orig = Number(d.original_price);
  const sale = Number(d.deal_price ?? d.sale_price);
  if (Number.isFinite(orig) && Number.isFinite(sale) && orig > 0 && sale < orig) {
    return Math.round(((orig - sale) / orig) * 100);
  }

  if ((d.discount_unit || "").toLowerCase() === "percent") {
    const v = Number(d.discount_value);
    if (Number.isFinite(v) && v > 0) return Math.min(100, Math.round(v));
  }

  return 0;
}

export function scoreDeal(deal: ScoreInput): DealScore {
  const savings = coerceSavings(deal);
  const pct = coercePercent(deal);

  if (pct >= 30 || savings >= 20) {
    return {
      grade: "great",
      label: "Great value",
      color: "var(--color-text-success, #16a34a)",
      reason:
        pct >= 30
          ? `${pct}% off is well above average`
          : `$${savings} saved is exceptional`,
    };
  }

  if (pct >= 20 || savings >= 12) {
    return {
      grade: "solid",
      label: "Solid deal",
      color: "var(--color-text-success, #16a34a)",
      reason:
        pct > 0
          ? `${pct}% off — worth it`
          : `$${savings} savings — worth it`,
    };
  }

  if (pct >= 10 || savings >= 6) {
    return {
      grade: "okay",
      label: "Okay deal",
      color: "var(--color-text-secondary, #6b7280)",
      reason: "Modest savings — decent if you wanted this anyway",
    };
  }

  return {
    grade: "weak",
    label: "Low savings",
    color: "var(--color-text-tertiary, #9ca3af)",
    reason: "Small discount — compare before driving",
  };
}
