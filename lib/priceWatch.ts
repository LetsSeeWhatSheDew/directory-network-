// lib/priceWatch.ts — "email me when it drops" for one menu item at one
// store: the cheapest eighth, 1g cart or 100mg gummies a store lists, read
// twice a day from the store's own online menu (lib/menuPrices.ts).
//
// A watch remembers one reference price (out the door, in cents) on its
// deal_alerts row as 'ref:<cents>' (lib/dealWatch.ts). Each morning:
//   • price fell by at least MIN_DROP_CENTS below the reference (and under
//     the optional ceiling) → email, and the new price becomes the reference,
//     so the next email needs a further drop;
//   • price rose above the reference → the reference follows it up, so the
//     next sale counts as a drop again;
//   • no fresh menu price today → nothing happens (never a guessed price).
// At most one email per address per day (the 'sent:' claim).
//
// Pure: no I/O here. The daily run is lib/watchRuns.ts.

import { REF_DEF, REF_UNITS, type RefUnit } from "./menuPrices";

/** Drops smaller than this (out the door) are noise: rounding, tax pennies. */
export const MIN_DROP_CENTS = 100;

export type PriceDecision = { notify: boolean; nextRef: number };

export function decidePriceDrop(refCents: number, currentCents: number | null, maxCents: number | null = null): PriceDecision {
  if (currentCents == null || !Number.isFinite(currentCents) || currentCents <= 0) return { notify: false, nextRef: refCents };
  if (currentCents >= refCents) return { notify: false, nextRef: currentCents };
  if (refCents - currentCents < MIN_DROP_CENTS) return { notify: false, nextRef: refCents };
  if (maxCents != null && currentCents > maxCents) return { notify: false, nextRef: currentCents };
  return { notify: true, nextRef: currentCents };
}

export const toCents = (usd: number) => Math.round(usd * 100);
export const fromCents = (c: number) => `$${(c / 100).toFixed(2)}`;

export function isRefUnit(v: unknown): v is RefUnit {
  return typeof v === "string" && (REF_UNITS as readonly string[]).includes(v);
}

/** "eighth of flower" / "1g vape cartridge" / "100mg of gummies" */
export const itemWords = (ref: RefUnit) => REF_DEF[ref].label.toLowerCase();

/** Parse the optional "only if it's under $X" input: dollars → cents, or null. */
export function parseCeiling(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? Number(v.replace(/[$,\s]/g, "")) : Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > 1000) return null;
  return toCents(n);
}
