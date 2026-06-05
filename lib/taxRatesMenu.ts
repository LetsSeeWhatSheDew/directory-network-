// lib/taxRatesMenu.ts
// =============================================================================
// THC-tiered tax engine for the menu baseline pipeline.
//
// Wraps lib/taxRates.ts (which is keyed by ThcTier = flower|concentrate|edible)
// and extends it for the IL DOR three-tier non_infused split:
//
//   non_infused_le_35  -> 10% excise   (flower / preroll / vape / concentrate, adj THC <= 35%)
//   non_infused_gt_35  -> 25% excise   (same product types, adj THC > 35%)
//   infused            -> 20% excise   (edibles, tinctures, topicals -- flat)
//
// The existing lib/taxRates.ts ThcTier ('flower' | 'concentrate' | 'edible')
// hard-routes ALL vapes/concentrates to the 25% rate. That's wrong for
// vapes with adjusted THC <= 35% -- they should be 10%. This wrapper fixes
// it by re-routing based on the menu pipeline's `MenuThcTier` enum (which
// matches the IL DOR semantics in reference-data/il_cannabis_tax_structure.json).
//
// Use this in the menu pipeline. The calculator at /illinois-cannabis-tax-
// calculator can keep using lib/taxRates.ts as-is (it has its own UI tier).
//
// IMPORTANT: per il_cannabis_tax_structure.json, after computing this
// wrapper, the full stacking order is:
//   1. excise = shelf * exciseRate
//   2. subtotal = shelf + excise
//   3. state ROT, local sales, county cannabis, muni cannabis all on subtotal
// That matches lib/taxRates.ts's calculateOutTheDoor implementation, so
// once we map the tier, we can hand off to its math.

import {
  calculateOutTheDoor as baseCalculate,
  findCityRates,
  type CalculationResult,
  type CityTaxRates,
} from "./taxRates";

export type MenuThcTier = "non_infused_le_35" | "non_infused_gt_35" | "infused" | "unknown";

/** Map a MenuThcTier into the existing taxRates ThcTier OR a synthetic
 *  10% excise rate. lib/taxRates ThcTier has no `non_infused_le_35` slot
 *  (it routes flower=10%, concentrate=25%, edible=20%), so we add the
 *  missing 10% case here. */
const LE_35_EXCISE = 0.10;
const GT_35_EXCISE = 0.25;
const INFUSED_EXCISE = 0.20;

export interface MenuTaxInput {
  shelfPrice: number;
  tier: MenuThcTier;
  /** City slug as it appears in lib/taxRates CITY_TAX_RATES (e.g. 'east-peoria'). */
  citySlug: string;
}

/**
 * Compute OTD for a menu item.
 *
 * If tier='unknown', we fall back to the 25% non_infused_gt_35 rate as a
 * defensive choice -- overstating tax is better than understating it for
 * a comparison shopper.
 */
export function calculateMenuOTD(input: MenuTaxInput): CalculationResult & { tierUsed: MenuThcTier } {
  const rates = findCityRates(input.citySlug);
  if (!rates) {
    throw new Error(`No tax rates configured for city slug: ${input.citySlug}`);
  }

  const exciseRate = exciseForTier(input.tier);
  const result = computeStacked(input.shelfPrice, exciseRate, rates);
  return { ...result, tierUsed: input.tier === "unknown" ? "non_infused_gt_35" : input.tier };
}

function exciseForTier(tier: MenuThcTier): number {
  switch (tier) {
    case "non_infused_le_35": return LE_35_EXCISE;
    case "non_infused_gt_35": return GT_35_EXCISE;
    case "infused":           return INFUSED_EXCISE;
    case "unknown":           return GT_35_EXCISE; // defensive overstate
  }
}

/** Inline the IL DOR stack so we don't depend on a particular ThcTier enum slot. */
function computeStacked(shelfPrice: number, exciseRate: number, rates: CityTaxRates): CalculationResult {
  const safePrice = Math.max(0, Number(shelfPrice) || 0);
  const cannabisExcise = safePrice * exciseRate;
  const subtotal = safePrice + cannabisExcise;
  const stateSalesTax = subtotal * rates.stateSalesTax;
  const countyCannabisTax = subtotal * rates.countyCannabisRot;
  const municipalCannabisTax = subtotal * rates.municipalCannabisRot;
  const localSalesTax = subtotal * rates.localSalesTax;
  const totalTax = cannabisExcise + stateSalesTax + countyCannabisTax + municipalCannabisTax + localSalesTax;
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

/** Re-export so callers don't need to import from both files. */
export { findCityRates, baseCalculate };
export type { CalculationResult, CityTaxRates };
