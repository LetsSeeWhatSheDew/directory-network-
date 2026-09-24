// lib/otd.ts — out-the-door prices: what a deal really costs at the register.
// Only for deals that state a real price in their own words ("$120 OZ",
// "2 for $60 … concentrate"). Percent deals have no shelf price, so they get
// no dollar figure — never a guess. Tax math is lib/taxRates (IL DOR stacking:
// excise on the shelf price, then sales + cannabis ROTs on shelf + excise).
// Product type decides the excise tier; if we can't tell the type, no number.

import { CITY_TAX_RATES, calculateOutTheDoor, STATE_EXCISE_RATES, type ThcTier, type CityTaxRates } from "./taxRates";

export type PriceParse = { price: number; qty: number; each: number | null; kind: "flower" | "vape" | "concentrate" | "edible" | "preroll" | null; label: string };

const KIND: Array<[RegExp, PriceParse["kind"]]> = [
  [/\b(pre-?rolls?|joints?|blunts?)\b/i, "preroll"],
  [/\b(vapes?|carts?|cartridges?|pods?|tanks?|disposables?|all[- ]in[- ]ones?)\b/i, "vape"],
  [/\b(concentrates?|rosin|resin|wax|shatter|badder|budder|dabs?|diamonds?|rso|sauce)\b/i, "concentrate"],
  [/\b(edibles?|gumm(y|ies)|chocolates?|chews?|mints?|drinks?|beverages?|tinctures?)\b/i, "edible"],
  [/\b(oz|ounces?|flower|eighths?|quarters?|halves|half[- ]oz|\d+(\.\d+)?\s*(g|grams?)\b)/i, "flower"],
];

const WORDNUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

export function parsePrice(title: string, category?: string | null): PriceParse | null {
  const t = String(title || "").replace(/\s+Shop Now\b.*$/i, "").trim();
  if (/\bor less\b|\bunder\b|\bstarting at\b|\bfrom \$/i.test(t)) return null; // a ceiling, not a price
  if (/%/.test(t)) return null; // percent deals have no shelf price
  // "2 for $60", "Two 14g Flower for $120", "3 for $27"
  let m = t.match(/\b(\d+|one|two|three|four|five)\s+for\s*\$\s*(\d+(?:\.\d{1,2})?)/i)
    || t.match(/\b(\d+|one|two|three|four|five)\b[^$]{0,40}?\bfor\s*\$\s*(\d+(?:\.\d{1,2})?)/i);
  let qty = 1, price: number | null = null;
  if (m) {
    qty = Number(m[1]) || WORDNUM[m[1].toLowerCase()] || 1;
    price = Number(m[2]);
  } else {
    m = t.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
    if (m) price = Number(m[1]);
    const q = t.match(/\b(\d+)\s*\/\s*\$/); // "2/$30"
    if (q) qty = Number(q[1]);
  }
  if (price == null || !(price > 0) || price > 1000) return null;
  let kind: PriceParse["kind"] = null;
  const cat = (category || "").toLowerCase();
  if (/flower/.test(cat)) kind = "flower";
  else if (/vape/.test(cat)) kind = "vape";
  else if (/concentrate/.test(cat)) kind = "concentrate";
  else if (/edible/.test(cat)) kind = "edible";
  for (const [re, k] of KIND) { if (re.test(t)) { kind = k; break; } }
  return { price, qty, each: qty > 1 ? Math.round((price / qty) * 100) / 100 : null, kind, label: t };
}


export function tierOf(kind: PriceParse["kind"]): ThcTier | null {
  if (kind === "flower" || kind === "preroll") return "flower";
  if (kind === "vape" || kind === "concentrate") return "concentrate";
  if (kind === "edible") return "edible";
  return null;
}

export function ratesFor(city: string | null | undefined): CityTaxRates | null {
  const c = String(city || "").trim().toLowerCase();
  return CITY_TAX_RATES.find((r) => r.city.toLowerCase() === c) || null;
}

export type Otd = {
  shelf: number;          // the deal's stated price
  qty: number;            // "2 for $60" → 2
  total: number;          // out the door, rounded to cents
  each: number | null;    // per item when qty > 1
  tax: number;            // total tax dollars
  rate: number;           // effective tax rate on the shelf price (0.33 = 33%)
  tier: ThcTier;
  kind: NonNullable<PriceParse["kind"]>;
  city: string;
  excise: number;
};

type DealLike = { deal_title?: string | null; title?: string | null; category?: string | null; city?: string | null; discount_unit?: string | null };

/** Out-the-door price for a deal with a stated price, in the store's city. */
export function otdFor(d: DealLike, cityOverride?: string | null): Otd | null {
  const title = d?.deal_title || d?.title || "";
  const p = parsePrice(title, d?.category);
  if (!p || !p.kind) return null;
  const tier = tierOf(p.kind);
  const rates = ratesFor(cityOverride || d?.city);
  if (!tier || !rates) return null;
  const r = calculateOutTheDoor(p.price, tier, rates);
  const total = Math.round(r.outTheDoor * 100) / 100;
  return {
    shelf: p.price,
    qty: p.qty,
    total,
    each: p.qty > 1 ? Math.round((total / p.qty) * 100) / 100 : null,
    tax: Math.round(r.totalTax * 100) / 100,
    rate: r.effectiveRate,
    tier,
    kind: p.kind,
    city: rates.city,
    excise: Math.round(r.cannabisExcise * 100) / 100,
  };
}

/** Effective tax on the shelf price in a city, by tier (for "tax here" lines). */
export function cityTaxRates(city: string | null | undefined): Record<ThcTier, number> | null {
  const rates = ratesFor(city);
  if (!rates) return null;
  const out = {} as Record<ThcTier, number>;
  (Object.keys(STATE_EXCISE_RATES) as ThcTier[]).forEach((t) => (out[t] = calculateOutTheDoor(100, t, rates).effectiveRate));
  return out;
}

export function usd(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

export const KIND_LABEL: Record<NonNullable<PriceParse["kind"]>, string> = {
  flower: "Flower", preroll: "Pre-rolls", vape: "Vapes", concentrate: "Concentrates", edible: "Edibles",
};

/** "$120" / "2 for $60" — the stated price, for a card that has no Save pill. */
export function priceChip(d: { deal_title?: string | null; title?: string | null; category?: string | null }): string | null {
  const p = parsePrice(d?.deal_title || d?.title || "", d?.category);
  if (!p) return null;
  return p.qty > 1 ? `${p.qty} for ${usd(p.price)}` : usd(p.price);
}
