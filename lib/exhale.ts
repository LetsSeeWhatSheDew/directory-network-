// lib/exhale.ts — honest "how much you keep" helpers for the Breathe design.
// Real data only: a dollar deal shows "$X off", a percent deal "X% off".
// Bundle / fixed-price deals ("2 for $60") have no savings figure, so they
// never become the "longest exhale" and never get a Save pill.

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
  return /(^|\s|\()\d+\s*\+|\bbuy\s+(\d+|two|three|four)\b|\b\d+\s*(or|and)\s*(more|up)\b|\bwhen you (buy|purchase)\b|\bmix\s*(&|and|n)\s*match\b|\bminimum\b|\bbulk\b/i.test(t);
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

/** One deal per store, biggest everyday savings first. */
export function lowestList(deals: ExDeal[], n: number, city?: string | null, skipId?: string | null): ExDeal[] {
  const seen = new Set<string>();
  const out: ExDeal[] = [];
  const pool = deals
    .filter((d) => amountOf(d) && !isConditional(d))
    .sort((a, b) => {
      const la = city && (a.city || "").toLowerCase() === city.toLowerCase() ? 1 : 0;
      const lb = city && (b.city || "").toLowerCase() === city.toLowerCase() ? 1 : 0;
      if (la !== lb) return lb - la;
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
