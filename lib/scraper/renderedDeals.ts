// lib/scraper/renderedDeals.ts
// =============================================================================
// Helpers for the rendered deal scrape (scripts/scrape-rendered-deals.ts).
// Mostly pure — everything but readDealCards takes page text and returns deal
// names, so it can be tested against saved fixtures (tests/scrapers.test.ts).
//
//   * promo-name hygiene for structured specials lists (moved here unchanged
//     from the script on 2026-09-27 so tests can import it);
//   * the RISE / Green Thumb chain-wide Illinois deals page reader for the
//     three Bloom Wellness stores (formerly Beyond Hello Peoria, AYR Normal and
//     Revolution Normal).
//
// readDealCards is the one in-browser piece: it splits a rendered promotions
// page into cards for parseRiseDealCards.
// =============================================================================

import type { Page } from "playwright-core";

// ---------------------------------------------------------------------------
// Promo-name hygiene for structured specials lists.
// ---------------------------------------------------------------------------

// Dutchie clamps special names at ~75 characters ("…Ozone Reserve Con").
// Cut a clamped name back to its last whole word and mark it.
export function tidyPromoName(raw: string): string {
  let t = raw.replace(/\s+/g, " ").trim();
  if (t.length >= 72 && !/[.!?)\]]$/.test(t)) t = t.replace(/\s+\S*$/, "").replace(/[\s,&+\-–|]+$/, "") + "…";
  t = t.replace(/([!?.])\1+/g, "$1"); // "BOGO!!!!!!" -> "BOGO!"
  return t.replace(/[\s​,&+\-–—|]+$/, "").trim();
}

// Not a cannabis price: accessory-only promos (pipes, papers, lighters,
// batteries on their own), promos named for a season that isn't now, and
// names too vague to mean anything ("$25 Special").
const CANNABIS_WORD = /\b(flower|bud|popcorn|smalls|shake|oz|ounce|half|eighth|quarter|zip|\d+(?:\.\d+)?\s?g|\d+\s?mg|cart|carts|cartridge|vape|vapes|disposable|dispos|aio|pod|gumm|edible|chew|chocolate|drink|beverage|lemonade|tincture|topical|pre-?roll|joint|concentrate|rosin|resin|badder|sauce|diamond|wax|hash|infused|capsule)/i;
const ACCESSORY_WORD = /\b(pipes?|papers?|cones?|lighters?|hot knife|seahorses?|puffco|lookah|mj arsenal|grinders?|koozie|batter(?:y|ies)|accessor(?:y|ies)|ice pack|rolling)\b/i;
export function notACannabisDeal(name: string, now = new Date()): boolean {
  if (ACCESSORY_WORD.test(name) && !CANNABIS_WORD.test(name.replace(ACCESSORY_WORD, ""))) return true;
  const m = now.getMonth(); // 0 = Jan
  if (/\bsummer\b/i.test(name) && (m < 4 || m > 8)) return true;
  if (/\bwinter\b/i.test(name) && m >= 3 && m <= 9) return true;
  if (/\b(4\/20|420)\b/.test(name) && m !== 3) return true;
  if (/\b(black friday|green wednesday)\b/i.test(name) && m !== 10) return true;
  if (/^\$\s?\d+\s+special!?$/i.test(name.trim())) return true;
  return false;
}

// A promotion whose own name carries an explicit date that has passed
// ("VIBATIONS 25% 6/15/26") is stale even if the POS still lists it.
export function namesPastDate(name: string, now = new Date()): boolean {
  const m = name.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/);
  if (!m) return false;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const d = new Date(year, Number(m[1]) - 1, Number(m[2]), 23, 59, 59);
  return Number.isFinite(d.getTime()) && d.getTime() < now.getTime();
}

// A structured promo name must state an actual offer — a percentage, a
// price, a bundle, BOGO or a freebie. Names like "Nomad 3.5g Smalls Fresh
// Drop" or "BRIQ 2.0! New hardware, same price!" are announcements, not deals.
export const DEAL_SIGNAL = /\d\s?%|\$\s?\.?\d|\bbogo\b|\bb\dg\d\b|\bbuy\s+(?:\d|one|two|any)\b|\bfree\b/i;

/** A name that states an offer but not what it applies to: "Up to 30% off",
 *  "Save 20%", "Daily Deals 25% off". A shopper can't act on these. */
export function isVagueDealName(name: string): boolean {
  const rest = name
    .toLowerCase()
    .replace(/\d+(?:\.\d+)?\s?%|\$\s?\d+(?:\.\d+)?/g, " ")
    .replace(/\b(up|to|save|get|off|on|select|selected|all|our|daily|weekly|today|todays|today's|deals?|specials?|sale|sales|discounts?|savings?|shop|now|learn|more|products?|items?|offer|offers|the|and|at|in|a|an|of|for|you|your|rise|bloom|wellness|illinois|il|locations?|stores?|dispensar(?:y|ies))\b/g, " ")
    .replace(/[^a-z]+/g, " ")
    .trim();
  return !/[a-z]{3,}/.test(rest);
}

export function offerCatalog(names: string[]): string {
  const ld = {
    "@type": "OfferCatalog",
    offers: names.map((name) => {
      const pct = name.match(/(\d{1,2})\s*%/);
      return pct ? { name, discount: pct[1] } : { name };
    }),
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// ---------------------------------------------------------------------------
// RISE (Green Thumb) chain-wide Illinois deals page → Bloom Wellness stores.
//
// RISE posts its Illinois promotions on ONE page for every IL store, not on
// the store pages. A deal is attached to a Bloom store only when its own card
// names that store, or when the card (or the page, in a sentence with no
// "unless / except / participating") says it applies at all Illinois
// locations. Anything else is skipped and reported — never guessed.
// ---------------------------------------------------------------------------

export const RISE_IL_DEALS_URL = "https://risecannabis.com/dispensaries/illinois/deals/";

export function isRiseIlDealsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /(^|\.)risecannabis\.com$/.test(u.host) && /^\/dispensaries\/illinois\/deals\/?$/.test(u.pathname);
  } catch {
    return false;
  }
}

/** master_listings slug → how the RISE page names that store. */
export const BLOOM_IL_STORES: Record<string, { label: string; re: RegExp }> = {
  // Only Bloom store in Peoria; never East Peoria / Peoria Heights.
  "beyond-hello-peoria": { label: "Bloom Wellness Peoria", re: /(?<!east[\s-])\bpeoria\b(?![\s-]+heights)/i },
  // The two Normal stores are told apart by street. "Normal" alone is
  // ambiguous and matches neither. (Northbrook is also a Chicago suburb, so
  // it must sit next to "Normal" or "Drive".)
  "ayr-wellness-normal": { label: "Bloom Wellness Normal (Bradford)", re: /\bbradford\b/i },
  "revolution-dispensary-normal": {
    label: "Bloom Wellness Normal (Northbrook)",
    re: /\bnormal\b[^\n]{0,24}\bnorthbrook\b|\bnorthbrook\b[^\n]{0,24}\bnormal\b|\bnorthbrook\s+(?:dr\.?|drive)\b/i,
  },
};

const ALL_IL = /\ball\s+(?:of\s+our\s+)?(?:illinois|il)\s+(?:rise\s+(?:and|&)\s+bloom(?:\s+wellness)?\s+)?(?:locations|stores|dispensaries)\b|\ball\s+(?:rise\s+(?:and|&)\s+bloom(?:\s+wellness)?\s+)?(?:locations|stores|dispensaries)\s+in\s+illinois\b/i;
const NAMES_A_STORE = /\b(?:RISE|Rise|Bloom(?:\s+Wellness)?)\s+[A-Z][a-z]+|\b(?:[Vv]alid|[Aa]vailable|[Oo]nly|[Ee]xclusive(?:ly)?)\s+(?:at|in)\b/;
// A line that is just a place or store label: "Northbrook", "Canton, Quincy".
const PLACE_LINE = /^[A-Z][a-z]+(?:[\s,&/-]+[A-Z][a-z.]+){0,3}$/;
const CTA_LINE = /^(shop|order|view|see|learn|get|claim|browse)\b/i;
const HAS_EXCEPTION = /\b(unless|except|excluding|excludes|not valid|participating|select locations|select stores)\b/i;

export type RiseDeal = { title: string; stores: string[] };
export type RiseSkip = { card: string; reason: string };

// Deal cards on a promotions page, one string[] of lines per card. A card is
// the largest box around ONE offer heading that holds no other offer heading
// (capped in size, never inside nav/header/footer), so a card's lines are
// its own. pageLines are the page's other lines (for a page-wide "valid at
// all Illinois locations" sentence).
export async function readDealCards(page: Page, timeoutMs: number): Promise<{ cards: string[][]; pageLines: string[] }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    page.evaluate(() => {
      const SIG = /\d\s?%|\$\s?\.?\d|\bbogo\b|\bb\dg\d\b|\bbuy\s+(?:\d|one|two|any)\b|\bfree\b/i;
      const HEAD = "h1,h2,h3,h4,h5,h6,[class*='title' i],[class*='heading' i]";
      const CHROME = "nav,header,footer,aside,[role='navigation'],[role='banner'],[role='contentinfo']";
      const offerHeads = Array.from(document.querySelectorAll(HEAD)).filter(
        (h) => !h.closest(CHROME) && SIG.test((h as HTMLElement).innerText || "") && ((h as HTMLElement).innerText || "").length < 120
      );
      // Leaf-most only: <div class="card-title"><h3>20% off …</h3></div> is one heading.
      const heads = offerHeads.filter((h) => !offerHeads.some((o) => o !== h && h.contains(o)));
      const cards = new Set<Element>();
      for (const h of heads) {
        let el: Element = h;
        for (let depth = 0; depth < 8 && el.parentElement && el.parentElement !== document.body; depth++) {
          const p: Element = el.parentElement;
          if (p.matches(CHROME) || ((p as HTMLElement).innerText || "").length > 1500) break;
          let n = 0;
          for (const x of heads) if (p.contains(x)) n++;
          if (n > 1) break;
          el = p;
        }
        cards.add(el);
      }
      if (!cards.size) {
        // No offer headings: leaf-most card-like boxes that state an offer.
        const boxes = Array.from(document.querySelectorAll("article,li,[class*='card' i],[class*='deal' i],[class*='promo' i],[class*='offer' i],[class*='special' i]")).filter(
          (b) => !b.closest(CHROME) && SIG.test((b as HTMLElement).innerText || "") && ((b as HTMLElement).innerText || "").length < 1500
        );
        for (const b of boxes) if (!boxes.some((o) => o !== b && b.contains(o))) cards.add(b);
      }
      // (No named helper functions in here: tsx wraps them in __name(), which
      // does not exist inside the browser.)
      const cardLines = Array.from(cards).map((c) =>
        ((c as HTMLElement).innerText || "").split("\n").map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean)
      );
      const inCards = new Set(cardLines.flat());
      const main = document.querySelector("main") || document.body;
      const pageLines = ((main as HTMLElement).innerText || "").split("\n").map((x) => x.replace(/\s+/g, " ").trim()).filter((l) => l && !inCards.has(l));
      return { cards: cardLines.filter((c) => c.length > 0 && c.length <= 40), pageLines };
    }),
    new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error("deal cards timeout")), timeoutMs); }),
  ])
    .catch(() => ({ cards: [] as string[][], pageLines: [] as string[] }))
    .finally(() => clearTimeout(timer));
}

/** Whether a page-level sentence (outside the cards) says every deal on the
 *  page applies at all Illinois locations, with no exception clause. */
export function pageSaysAllIllinois(lines: string[]): boolean {
  return lines.some((l) => ALL_IL.test(l) && !HAS_EXCEPTION.test(l));
}

/**
 * One deal per card: the card's first line that states an offer. Cards are
 * read line by line and on their own, so one card's discount can never be
 * attached to the next card's name.
 */
export function parseRiseDealCards(
  cards: string[][],
  opts: { pageAllIllinois?: boolean; now?: Date } = {}
): { deals: RiseDeal[]; skipped: RiseSkip[] } {
  const now = opts.now ?? new Date();
  const deals: RiseDeal[] = [];
  const skipped: RiseSkip[] = [];
  const seen = new Set<string>();
  for (const raw of cards) {
    const lines = raw.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!lines.length) continue;
    const label = lines[0].slice(0, 80);
    const offer = lines.find((l) => DEAL_SIGNAL.test(l) && l.length >= 5 && l.length < 90);
    if (!offer) { skipped.push({ card: label, reason: "no line on the card states an offer" }); continue; }
    const title = tidyPromoName(offer);
    if (notACannabisDeal(title, now)) { skipped.push({ card: title, reason: "accessory-only or out-of-season promo" }); continue; }
    if (lines.some((l) => namesPastDate(l, now))) { skipped.push({ card: title, reason: "a date on the card has passed" }); continue; }
    if (isVagueDealName(title)) { skipped.push({ card: title, reason: "vague — does not say what the offer is on" }); continue; }
    const text = lines.join("\n");
    let stores: string[];
    if (HAS_EXCEPTION.test(text)) {
      // "All Illinois locations except Peoria" — not parsed; a wrong store is worse than none.
      skipped.push({ card: title, reason: "card has an exception / participating-stores clause" });
      continue;
    } else if (ALL_IL.test(text)) {
      stores = Object.keys(BLOOM_IL_STORES);
    } else {
      stores = Object.entries(BLOOM_IL_STORES).filter(([, s]) => s.re.test(text)).map(([slug]) => slug);
      // A page-wide "all Illinois locations" covers a card only when the card
      // itself names no store or place ("RISE Niles", "Valid at …", "Bloom
      // Wellness Normal" all count as naming one).
      const placeLine = lines.some((l) => l !== offer && PLACE_LINE.test(l) && !CTA_LINE.test(l));
      if (!stores.length && opts.pageAllIllinois && !NAMES_A_STORE.test(text) && !placeLine) stores = Object.keys(BLOOM_IL_STORES);
    }
    if (!stores.length) { skipped.push({ card: title, reason: "card names no Bloom store and does not say all Illinois locations" }); continue; }
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deals.push({ title, stores });
  }
  return { deals, skipped };
}
