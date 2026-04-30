// lib/taxRates.ts
// Illinois recreational cannabis tax rates for the 9 Central IL public
// cities. Drives /illinois-cannabis-tax-calculator and the
// /illinois-cannabis-tax explainer article.
//
// Source verification (2026-05-01):
//   1. State Cannabis Purchaser Excise Tax — 10 / 20 / 25% by THC tier.
//      Source: https://tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html
//   2. State sales (Retailers' Occupation Tax) — 6.25% statewide, applies
//      to cannabis on top of the excise.
//      Source: https://tax.illinois.gov/research/taxrates.html
//   3. Municipal Cannabis ROT — set per city, capped at 3%.
//      Source: IL Municipal League PDF "Municipal Cannabis Tax Rates"
//      (rates as of 2021-07-01; cross-checked against IL DOR bulletins
//      FY 2024-20, FY 2025-09, FY 2025-20, FY 2026-06 — none of the 9
//      CIL cities have changed since).
//   4. County Cannabis ROT — set per county, capped at 3% in
//      incorporated areas (3.75% unincorporated).
//      Source: IL Municipal League PDF "County Cannabis Tax Rates"
//      (rates as of 2021-07-01; same cross-check as muni).
//   5. Local general sales tax (the city + county + special-district
//      portion of the regular ROT, beyond the 6.25% state).
//      Source: salestaxhandbook.com/illinois/rates/<city>, retrieved
//      2026-05-01.
//
// Calculation order (matches IL DOR stacking rule):
//   1. Cannabis excise applies to the shelf price.
//   2. State sales, local sales, county cannabis ROT, muni cannabis ROT
//      all apply to (shelfPrice + excise) — i.e. the excise IS taxed.
//   See `calculateOutTheDoor` below for the deterministic implementation.

export type ThcTier = "flower" | "concentrate" | "edible";

export interface CityTaxRates {
  /** City name as it appears in master_listings.city */
  city: string;
  /** URL slug used by /city/[slug] and the calculator dropdown */
  slug: string;
  /** County the city sits in (used to label the county cannabis ROT line) */
  county: string;
  /** State sales tax — 6.25% statewide, never overridden */
  stateSalesTax: number;
  /** County cannabis-specific ROT (cap 3% in incorporated; set by county) */
  countyCannabisRot: number;
  /** Municipal cannabis-specific ROT (cap 3%; set by city ordinance) */
  municipalCannabisRot: number;
  /** Local general sales tax — the city + county + special-district
   *  portion of the regular ROT, applied on top of the 6.25% state rate. */
  localSalesTax: number;
  /** ISO date this row's rates were last verified against IL DOR sources */
  verifiedDate: string;
}

export const STATE_EXCISE_RATES: Record<ThcTier, number> = {
  flower: 0.10,        // ≤35% THC flower / pre-rolls
  concentrate: 0.25,   // >35% THC, vape carts, concentrates
  edible: 0.20,        // edibles, tinctures, drinks, topicals
};

export const STATE_SALES_TAX = 0.0625;

/** Single source of truth for which cities the calculator dropdown shows.
 *  Sorted by population for nicer default ordering — Peoria, Springfield,
 *  the metro pairs together. */
export const CITY_TAX_RATES: ReadonlyArray<CityTaxRates> = [
  {
    city: "Peoria",
    slug: "peoria",
    county: "Peoria",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.0275,
    verifiedDate: "2026-05-01",
  },
  {
    city: "East Peoria",
    slug: "east-peoria",
    county: "Tazewell",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.0325,
    verifiedDate: "2026-05-01",
  },
  {
    city: "Peoria Heights",
    slug: "peoria-heights",
    county: "Peoria",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.035,
    verifiedDate: "2026-05-01",
  },
  {
    city: "Pekin",
    slug: "pekin",
    county: "Tazewell",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.0325,
    verifiedDate: "2026-05-01",
  },
  {
    city: "Bloomington",
    slug: "bloomington",
    county: "McLean",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.035,
    verifiedDate: "2026-05-01",
  },
  {
    city: "Normal",
    slug: "normal",
    county: "McLean",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.035,
    verifiedDate: "2026-05-01",
  },
  {
    city: "Champaign",
    slug: "champaign",
    county: "Champaign",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.03,
    verifiedDate: "2026-05-01",
  },
  {
    city: "Urbana",
    slug: "urbana",
    county: "Champaign",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.0275,
    verifiedDate: "2026-05-01",
  },
  {
    city: "Springfield",
    slug: "springfield",
    county: "Sangamon",
    stateSalesTax: 0.0625,
    countyCannabisRot: 0.03,
    municipalCannabisRot: 0.03,
    localSalesTax: 0.035,
    verifiedDate: "2026-05-01",
  },
];

/** Display copy: when this calculator was last verified, used by the
 *  "Tax rates current as of …" line under the breakdown. */
export const TAX_RATES_LAST_UPDATED = "2026-05-01";

/** Next quarterly verification reminder (Jul 1 / Oct 1 / Jan 1 / Apr 1). */
export const TAX_RATES_NEXT_REVIEW = "2026-07-01";

export function findCityRates(slug: string): CityTaxRates | undefined {
  return CITY_TAX_RATES.find((c) => c.slug === slug);
}

/**
 * Calculate out-the-door price + breakdown.
 *
 * IL DOR stacking order (load-bearing — match it exactly):
 *   1. Cannabis excise applies to the shelf price.
 *   2. Subtotal = shelf + excise.
 *   3. State sales, local sales, county cannabis ROT, muni cannabis ROT
 *      ALL apply to subtotal (i.e. the excise tax IS itself taxed).
 *
 * Returns dollar amounts to 4 decimal precision; UI rounds for display.
 */
export interface CalculationResult {
  shelfPrice: number;
  cannabisExcise: number;
  stateSalesTax: number;
  countyCannabisTax: number;
  municipalCannabisTax: number;
  localSalesTax: number;
  totalTax: number;
  outTheDoor: number;
  effectiveRate: number;
}

export function calculateOutTheDoor(
  shelfPrice: number,
  tier: ThcTier,
  rates: CityTaxRates
): CalculationResult {
  const safePrice = Math.max(0, Number(shelfPrice) || 0);
  const exciseRate = STATE_EXCISE_RATES[tier];
  const cannabisExcise = safePrice * exciseRate;
  const subtotal = safePrice + cannabisExcise;

  const stateSalesTax = subtotal * rates.stateSalesTax;
  const countyCannabisTax = subtotal * rates.countyCannabisRot;
  const municipalCannabisTax = subtotal * rates.municipalCannabisRot;
  const localSalesTax = subtotal * rates.localSalesTax;

  const totalTax =
    cannabisExcise +
    stateSalesTax +
    countyCannabisTax +
    municipalCannabisTax +
    localSalesTax;

  const outTheDoor = safePrice + totalTax;
  const effectiveRate = safePrice > 0 ? totalTax / safePrice : 0;

  return {
    shelfPrice: safePrice,
    cannabisExcise,
    stateSalesTax,
    countyCannabisTax,
    municipalCannabisTax,
    localSalesTax,
    totalTax,
    outTheDoor,
    effectiveRate,
  };
}

/** Helper to format a number as USD with 2 decimals. */
export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Helper to format a fraction as a percent with N decimals. */
export function formatPercent(fraction: number, decimals = 1): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}
