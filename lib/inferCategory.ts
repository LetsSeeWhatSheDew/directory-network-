// lib/inferCategory.ts
// The daily scraper stores deals with category = NULL, so every category
// page and tile came up empty even when "30% off flower" was live. Infer the
// category from the deal text when the column is empty. Conservative: only
// clear keywords; anything ambiguous stays null (shows under "All deals").

export type DealCategory = "flower" | "edibles" | "vapes" | "concentrate";

const RULES: [DealCategory, RegExp][] = [
  ["vapes", /\b(vapes?|vape carts?|carts?|cartridges?|pods?|disposables?|all[- ]in[- ]ones?|aio)\b/i],
  ["concentrate", /\b(concentrates?|wax|shatter|rosin|resin|live resin|badder|budder|sugar|diamonds?|dabs?|crumble|hash)\b/i],
  ["edibles", /\b(edibles?|gumm(y|ies)|chocolates?|chews?|mints?|beverages?|drinks?|seltzers?|baked goods?|tinctures?)\b/i],
  ["flower", /\b(flower|eighths?|ounces?|oz|quarters?|halves|half[- ]ounce|pre[- ]?rolls?|prerolls?|joints?|infused pre[- ]?rolls?|smalls|shake|popcorn)\b/i],
];

export function inferCategory(...texts: Array<string | null | undefined>): DealCategory | null {
  const t = texts.filter(Boolean).join(" ");
  if (!t) return null;
  let hits = RULES.filter(([, re]) => re.test(t)).map(([c]) => c);
  // "live resin carts" is a vape, not a concentrate.
  if (hits.includes("vapes") && hits.includes("concentrate") && /\b(carts?|cartridges?|pods?|disposables?)\b/i.test(t)) {
    hits = hits.filter((c) => c !== "concentrate");
  }
  // One clear category only — "20% off vapes and edibles" stays null.
  return hits.length === 1 ? hits[0] : null;
}

export function effectiveCategory(d: {
  category?: string | null;
  title?: string | null;
  deal_title?: string | null;
  description?: string | null;
  deal_description?: string | null;
}): string | null {
  if (d.category) return d.category;
  return inferCategory(d.title || d.deal_title, d.description || d.deal_description);
}
