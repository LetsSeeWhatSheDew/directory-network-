// lib/scraper/menu/scoreDeal.ts
// Pure scoring function: given a baseline + observed sale price, return
// a label and discount_vs_median. No I/O.

export type DealScoreLabel = "great_deal" | "fair_deal" | "weak_deal" | "no_real_savings" | "unknown";

export interface ScoreInput {
  observedPrice: number;       // the deal's sale price (or fixed_price)
  baseline: {
    median: number;
    p25: number;
    p75: number;
  } | null;
}

export interface ScoreOutput {
  label: DealScoreLabel;
  discount_vs_median: number | null;     // (median - observed) / median; null if no baseline
}

export function scoreDeal(input: ScoreInput): ScoreOutput {
  if (!input.baseline || input.observedPrice <= 0) {
    return { label: "unknown", discount_vs_median: null };
  }
  const { median, p25, p75 } = input.baseline;
  if (median <= 0) return { label: "unknown", discount_vs_median: null };

  const discount = (median - input.observedPrice) / median;

  let label: DealScoreLabel;
  if (input.observedPrice < p25) label = "great_deal";
  else if (input.observedPrice <= median) label = "fair_deal";
  else if (input.observedPrice <= p75) label = "weak_deal";
  else label = "no_real_savings";

  return { label, discount_vs_median: roundTo(discount, 4) };
}

function roundTo(n: number, places: number): number {
  const p = 10 ** places;
  return Math.round(n * p) / p;
}
