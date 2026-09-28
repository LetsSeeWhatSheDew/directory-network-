// lib/exhale.ts — honest "how much you keep" helpers for the Breathe design.
// Real data only: a dollar deal shows "$X off", a percent deal "X% off".
// Bundle / fixed-price deals ("2 for $60") have no savings figure, so they
// never become the "longest exhale" and never get a Save pill.

import { cityCenter, milesBetween } from "./cityProfiles";

export type ExDeal = {
  deal_id?: string;
  id?: string;
  name?: string | null;
  city?: string | null;
  slug?: string | null;
  listing_slug?: string | null;
  deal_title?: string | null;
  title?: string | null;
  discount_value?: number | null;
  discount_unit?: string | null;
  discount_type?: string | null;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  verified_at?: string | null;
};

export type Amount = { big: string; unit: "off"; kind: "dollars" | "percent"; upTo: boolean; value: number };

export function amountOf(d: ExDeal): Amount | null {
  const v = Number(d?.discount_value);
  if (!Number.isFinite(v) || v <= 0) return null;
  const u = (d?.discount_unit || "").toLowerCase();
  const upTo = /\bup to\b/i.test(d?.deal_title || d?.title || "");
  if (u === "dollars" && d?.discount_type !== "fixed_price") {
    return { big: `$${Math.round(v)}`, unit: "off", kind: "dollars", upTo, value: v };
  }
  if ((u === "percent" || !u) && v <= 100) {
    return { big: `${Math.round(v)}%`, unit: "off", kind: "percent", upTo, value: v };
  }
  return null;
}

/** Text for the Save pill. "Up to" deals say so, so the pill never promises
 *  more than the store does. Falls back to an estimated dollar saving. */
export function saveLabel(d: ExDeal, estDollars?: number | null): string | null {
  const a = amountOf(d);
  if (a) return `Save ${a.upTo ? "up to " : ""}${a.big}`;
  if (estDollars != null) return `Save $${estDollars}`;
  return null;
}

/** Conditional deals (first-time, veterans, seniors, birthdays…) are real but
 *  not for everyone, so they never lead as "today's longest exhale". */
export function isConditional(d: ExDeal): boolean {
  return /\b(first[- ]?time|new (customer|patient)|veteran|military|senior|industry|birthday|student|medical (patient|card) only|\bup to\b)/i.test(
    d?.deal_title || ""
  );
}

/** Deals that only kick in when you buy several ("4+ Cresco flower", "buy 2",
 *  "when you buy 3 or more", "mix & match"). Real and listed everywhere, but
 *  they don't lead as the longest exhale: most people buy one thing. */
export function needsQuantity(d: ExDeal): boolean {
  const t = `${d?.deal_title || ""} ${d?.title || ""}`;
  return /(^|\s|\()\d+\s*\+|\bbuy\s+(\d+|two|three|four)\b|\b\d+\s*(or|and)\s*(more|up)\b|\bwhen you (buy|purchase)\b|\bmix\s*(&|and|n)\s*match\b|\bminimum\b|\bbulk\b|\bbogo\b|\bb\d+g\d+\b|\bbuy\s+one\b|\bget\s+(one|1)\s+(free|half)/i.test(t);
}

/** Strip scraper leftovers ("Shop Now ⭢ …") from a stored deal title. */
export function cleanDealTitle(t: string | null | undefined): string {
  return String(t || "").replace(/\s+Shop Now\b.*$/i, "").trim();
}

/** The product part of a deal title, without the leading "30% off". */
export function productOf(d: ExDeal): string {
  const t = (d?.deal_title || "").trim();
  const stripped = t
    .replace(/^(up to\s+)?\$?\d+(\.\d+)?\s*%?\s*off\s*(on\s+)?/i, "")
    .replace(/\s+Shop Now.*$/i, "")
    .trim();
  const s = stripped || t;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function slugToName(s: string) {
  return s.split("-").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function storeName(d: ExDeal): string {
  const n = (d?.name || "").trim();
  const slug = d?.slug || d?.listing_slug || "";
  if (!n || n === slug || /^[a-z0-9-]+$/.test(n)) return slugToName(slug || "Central Illinois dispensary");
  return n.replace(/\s*\(.*?\)\s*$/, "").replace(/^nuera\b/i, "nuEra");
}

/** "Cloud 9 East Peoria" already says where; "Sunnyside" needs ", Champaign". */
export function storeWithCity(d: ExDeal): string {
  const n = storeName(d);
  const c = (d?.city || "").trim();
  if (!c || n.toLowerCase().includes(c.toLowerCase())) return n;
  return `${n}, ${c}`;
}

export function storeHref(d: ExDeal): string {
  return `/dispensary/${d.slug || d.listing_slug}`;
}

export function directionsHref(d: ExDeal): string {
  if (d.lat != null && d.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${storeName(d)} ${d.city || ""} IL`)}`;
}

// ---------------------------------------------------------------------------
// Near the visitor. The orb (and anything else that puts "the best deal" next
// to a location label) must agree with that label: biggest everyday saving at
// stores within ~25 miles of the visitor's chosen city; if none, widen step by
// step and say so. No city yet → the Central-IL-wide pick, labeled as such.
// Distances are straight-line, from the store's lat/lng when we have it, else
// its city center (lib/cityProfiles).

export type Origin = { city?: string | null; lat?: number | null; lng?: number | null };

/** Radii tried in order (miles). The first is "near"; the rest are widening. */
export const NEAR_STEPS = [25, 40, 60, 90] as const;

export type NearPick = {
  deal: ExDeal;
  /** Straight-line miles from the visitor, when known. */
  miles: number | null;
  /** near = within the first radius; widened = further out; region = no city chosen. */
  scope: "near" | "widened" | "region";
};

function originPoint(o: Origin | null | undefined): { lat: number; lng: number } | null {
  if (!o) return null;
  if (o.lat != null && o.lng != null && Number.isFinite(o.lat) && Number.isFinite(o.lng)) return { lat: o.lat, lng: o.lng };
  return cityCenter(o.city);
}

function dealPoint(d: ExDeal): { lat: number; lng: number } | null {
  if (d.lat != null && d.lng != null && Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng))) {
    return { lat: Number(d.lat), lng: Number(d.lng) };
  }
  return cityCenter(d.city);
}

/** Miles from the visitor to a deal's store, or null when either end is unknown. */
export function milesTo(d: ExDeal, origin: Origin | null | undefined): number | null {
  const a = originPoint(origin);
  const b = dealPoint(d);
  return a && b ? milesBetween(a, b) : null;
}

const everyday = (d: ExDeal) => !!amountOf(d) && !isConditional(d) && !needsQuantity(d);
const bigger = (a: ExDeal, b: ExDeal) => amountOf(b)!.value - amountOf(a)!.value;

/** Biggest everyday saving near the visitor, widening until something turns up. */
export function nearestExhale(deals: ExDeal[], origin: Origin | null | undefined): NearPick | null {
  const eligible = deals.filter(everyday);
  if (!eligible.length) return null;
  const here = originPoint(origin);
  if (!here) {
    const pick = [...eligible].sort(bigger)[0];
    return { deal: pick, miles: null, scope: "region" };
  }
  const withMiles = eligible.map((d) => ({ d, m: milesTo(d, origin) }));
  for (const [i, r] of NEAR_STEPS.entries()) {
    const inRange = withMiles.filter((x) => x.m != null && x.m <= r).sort((x, y) => bigger(x.d, y.d) || x.m! - y.m!);
    if (inRange.length) return { deal: inRange[0].d, miles: inRange[0].m, scope: i === 0 ? "near" : "widened" };
  }
  // Nothing within the widest step: the closest store with an everyday saving.
  const known = withMiles.filter((x) => x.m != null).sort((x, y) => x.m! - y.m! || bigger(x.d, y.d));
  if (known.length) return { deal: known[0].d, miles: known[0].m, scope: "widened" };
  return { deal: [...eligible].sort(bigger)[0], miles: null, scope: "widened" };
}

/** "3 mi", "70 mi". Whole miles; under a mile reads "under 1 mi". */
export function milesLabel(m: number | null): string | null {
  if (m == null || !Number.isFinite(m)) return null;
  return m < 1 ? "under 1 mi" : `${Math.round(m)} mi`;
}

/** The orb's subline for a pick. Always names the city or the distance. */
export function nearSubline(p: NearPick): string {
  const store = storeWithCity(p.deal);
  const cityOnce = p.deal.city && !store.toLowerCase().includes(p.deal.city.toLowerCase()) ? `, ${p.deal.city}` : "";
  const where = `${store}${cityOnce}`;
  const mi = milesLabel(p.miles);
  if (p.scope === "region") return `${productOf(p.deal)} at ${where} · across Central Illinois`;
  if (p.scope === "widened") {
    const a = amountOf(p.deal)!;
    return `Nearest big one: ${a.big} off at ${where}${mi ? ` · ${mi}` : ""}`;
  }
  return `${productOf(p.deal)} at ${where}${mi ? ` · ${mi}` : ""}`;
}

/** Biggest everyday saving, preferring the visitor's city. */
export function longestExhale(deals: ExDeal[], city?: string | null): ExDeal | null {
  const eligible = deals.filter((d) => amountOf(d) && !isConditional(d) && !needsQuantity(d));
  const rank = (a: ExDeal, b: ExDeal) => (amountOf(b)!.value - amountOf(a)!.value);
  if (city) {
    const local = eligible.filter((d) => (d.city || "").toLowerCase() === city.toLowerCase()).sort(rank);
    if (local.length) return local[0];
  }
  return eligible.sort(rank)[0] || null;
}

/** One deal per store, biggest everyday savings first. With a city or an
 *  Origin, stores within the first near radius (25 mi) come first. */
export function lowestList(deals: ExDeal[], n: number, city?: string | Origin | null, skipId?: string | null): ExDeal[] {
  const seen = new Set<string>();
  const out: ExDeal[] = [];
  const origin: Origin | null = typeof city === "string" ? { city } : city || null;
  const cityName = origin?.city || null;
  const hasPoint = !!originPoint(origin);
  const isLocal = (d: ExDeal) => {
    if (!origin) return 0;
    if (hasPoint) {
      const m = milesTo(d, origin);
      if (m != null) return m <= NEAR_STEPS[0] ? 1 : 0;
    }
    return cityName && (d.city || "").toLowerCase() === cityName.toLowerCase() ? 1 : 0;
  };
  const pool = deals
    .filter((d) => amountOf(d) && !isConditional(d))
    .sort((a, b) => {
      const la = isLocal(a);
      const lb = isLocal(b);
      if (la !== lb) return lb - la;
      // Buy-several deals sit below everyday savings.
      const qa = needsQuantity(a) ? 1 : 0;
      const qb = needsQuantity(b) ? 1 : 0;
      if (qa !== qb) return qa - qb;
      return amountOf(b)!.value - amountOf(a)!.value;
    });
  for (const d of pool) {
    const key = (d.slug || d.listing_slug || d.name || "").toLowerCase();
    const id = d.deal_id || d.id || "";
    if (seen.has(key) || (skipId && id === skipId)) continue;
    seen.add(key);
    out.push(d);
    if (out.length >= n) break;
  }
  return out;
}

export const EXHALE_LINES = [
  "Go on, let your shoulders drop.",
  "Keep the difference. Let the rest go.",
  "Go ahead and sigh. Nobody's timing you.",
  "The math is done. That part's handled.",
];
