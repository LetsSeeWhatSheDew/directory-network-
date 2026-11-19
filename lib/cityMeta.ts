// lib/cityMeta.ts: the search title and description for a city page, led by
// that city's best everyday deal (a plain percent or dollars off, not a
// first-time/veteran/"up to" deal, not a buy-several deal). Search Console
// (Oct 12-Nov 8, 2026): city pages were shown 2,500+ times and almost never
// clicked with a generic "Peoria Dispensary Deals Today" title. A real number
// in the result is the change. Pure, so it's unit tested.
import { amountOf, isConditional, needsQuantity, storeName, productOf, type ExDeal } from "./exhale";

const TITLE_MAX = 60; // the layout appends " | PuffPrice"; Google shows ~60

// "$10 off any purchase over $75", "orders of $100+": a minimum spend, not an everyday saving.
const MIN_SPEND = /\b(over|above|of|spend(ing)?|min(imum)?)\s+\$\s?\d+|\$\s?\d+\s*\+|\$\s?\d+\s+or\s+more/i;

function best(deals: ExDeal[]) {
  let top: { d: ExDeal; a: NonNullable<ReturnType<typeof amountOf>> } | null = null;
  for (const d of deals) {
    const a = amountOf(d);
    if (!a || a.upTo || isConditional(d) || needsQuantity(d) || MIN_SPEND.test(`${d.deal_title || ""} ${d.title || ""}`)) continue;
    if (a.kind === "percent" && a.value < 10) continue;
    // Compare percent with percent first; a dollars-off deal only leads if no percent deal exists.
    if (!top || (a.kind === top.a.kind ? a.value > top.a.value : a.kind === "percent")) top = { d, a };
  }
  return top;
}

export function cityMeta(city: string, deals: ExDeal[], listingCount: number): { title: string; description: string } {
  const n = listingCount;
  const stores = `${n} ${city}, IL dispensar${n === 1 ? "y" : "ies"}`;
  const b = best(deals);
  if (!b) {
    return {
      title: `${city} Dispensary Deals Today`,
      description: deals.length > 0
        ? `${deals.length} deal${deals.length === 1 ? "" : "s"} today across ${stores}, checked this morning on each store's own site. Hours, who's open now, and how to order ahead.`
        : `All ${stores}: hours, who's open now, order-ahead options, and deals as soon as a store posts one.`,
    };
  }
  const store = storeName(b.d).replace(new RegExp(`\\s*${city}\\s*$`, "i"), "").trim() || storeName(b.d);
  const off = `${b.a.big} Off`;
  let title = `${city} Dispensary Deals Today: ${off} at ${store}`;
  if (title.length > TITLE_MAX) title = `${city} Dispensary Deals Today: ${off}`;
  if (title.length > TITLE_MAX) title = `${city} Dispensary Deals: ${off} Today`;
  const what = productOf(b.d).replace(/[.\s]+$/, "");
  const lead = `${b.a.big} off${what && what.length <= 50 ? ` ${what.charAt(0).toLowerCase() + what.slice(1)}` : ""} at ${storeName(b.d)} today.`;
  const description = `${lead} ${deals.length} deal${deals.length === 1 ? "" : "s"} across ${stores}, checked this morning on each store's own site. Nobody pays to rank.`;
  return { title, description };
}
