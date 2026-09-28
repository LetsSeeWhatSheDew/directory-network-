// lib/answers.ts
// =============================================================================
// City answer pages: one page per (question, city) for the questions people
// type into Google and AI assistants — "cheapest eighth in Peoria",
// "dispensary open latest in Normal", "medical dispensary in Urbana".
//
// Every number comes from data the site already reads — no new queries:
//   menu prices  → lib/menuPrices.getCheapestBoard  (same as /cheapest)
//   store list   → lib/waysToBuy.getRegionStores    (same as /open-late)
//   hours        → lib/waysToBuy.getClosingTonight  (same as /open-late)
//   features     → lib/waysToBuy.getFeatureRows     (same as /medical, /drive-thru)
//   deals        → lib/guides.getLiveDeals          (same as the /guides pages)
//
// loadAnswerData() fetches once; buildAnswer() is pure, so the same answer
// feeds the page, its metadata, the sitemap, llms-full.txt and IndexNow, and
// unit tests can drive it with synthetic data.
//
// HARD RULES: never invent a number. Thin data says so and points to the
// nearest city that has it. A page with nothing of its own to say is noindex.
// =============================================================================

import { CENTRAL_IL_CITIES, CENTRAL_IL_PUBLIC_CITY_SLUGS, type CityDef } from "./constants/regions";
import {
  getCheapestBoard,
  cityCenter,
  citySlugOf,
  money,
  checkedLabel,
  NEAR_MILES,
  REF_DEF,
  type CheapestBoard,
  type CheapestItem,
  type RefUnit,
} from "./menuPrices";
import { milesBetween } from "./cityProfiles";
import {
  getRegionStores,
  getFeatureRows,
  getClosingTonight,
  featuresBySlug,
  type RegionStore,
  type FeatureRow,
  type TonightRow,
} from "./waysToBuy";
import { getLiveDeals, type LiveDeal } from "./guides";
import { amountOf, isConditional, needsQuantity, cleanDealTitle, storeName } from "./exhale";
import { nowInCT, formatTime } from "./hours";
import { brand } from "./brand";

// -----------------------------------------------------------------------------
// Registry
// -----------------------------------------------------------------------------

export type AnswerTopic =
  | "cheapest-eighth"
  | "cheapest-vape-cart"
  | "cheapest-edibles"
  | "best-deals"
  | "open-late"
  | "medical"
  | "drive-thru";

export type TopicDef = {
  topic: AnswerTopic;
  /** Short label for link rows: "Cheapest eighth". */
  short: string;
  /** The question as people ask it. */
  question: (city: string) => string;
  path: (citySlug: string) => string;
};

/** /cheapest/[city]/[item] item slugs → reference unit. */
export const CHEAPEST_ITEMS: Record<string, { topic: AnswerTopic; ref: RefUnit }> = {
  eighth: { topic: "cheapest-eighth", ref: "eighth" },
  "vape-cart": { topic: "cheapest-vape-cart", ref: "cart_1g" },
  edibles: { topic: "cheapest-edibles", ref: "gummies_100mg" },
};

export const ANSWER_TOPICS: TopicDef[] = [
  { topic: "cheapest-eighth", short: "Cheapest eighth", question: (c) => `What's the cheapest eighth in ${c}?`, path: (s) => `/cheapest/${s}/eighth` },
  { topic: "cheapest-vape-cart", short: "Cheapest vape cart", question: (c) => `What's the cheapest vape cart in ${c}?`, path: (s) => `/cheapest/${s}/vape-cart` },
  { topic: "cheapest-edibles", short: "Cheapest edibles", question: (c) => `What are the cheapest edibles in ${c}?`, path: (s) => `/cheapest/${s}/edibles` },
  { topic: "best-deals", short: "Best deals today", question: (c) => `What are the best weed deals in ${c} today?`, path: (s) => `/best-deals/${s}` },
  { topic: "open-late", short: "Open latest tonight", question: (c) => `Which dispensary is open latest in ${c}?`, path: (s) => `/open-late/${s}` },
  { topic: "medical", short: "Medical dispensary", question: (c) => `Is there a medical dispensary in ${c}?`, path: (s) => `/medical/${s}` },
  { topic: "drive-thru", short: "Drive-thru", question: (c) => `Is there a drive-thru dispensary near ${c}?`, path: (s) => `/drive-thru/${s}` },
];

export function topicDef(topic: AnswerTopic): TopicDef {
  return ANSWER_TOPICS.find((t) => t.topic === topic)!;
}

export function answerCity(slug: string): CityDef | null {
  return CENTRAL_IL_CITIES.find((c) => c.slug === slug) || null;
}

/** Every (topic, city) pair — 7 × 12. */
export function allAnswerParams(): { topic: AnswerTopic; city: string }[] {
  return ANSWER_TOPICS.flatMap((t) => CENTRAL_IL_CITIES.map((c) => ({ topic: t.topic, city: c.slug })));
}

const REF_OF: Partial<Record<AnswerTopic, RefUnit>> = {
  "cheapest-eighth": "eighth",
  "cheapest-vape-cart": "cart_1g",
  "cheapest-edibles": "gummies_100mg",
};

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

export type AnswerData = {
  now: Date;
  board: CheapestBoard;
  stores: RegionStore[];
  features: FeatureRow[];
  tonight: TonightRow[];
  deals: LiveDeal[];
};

type Part = "board" | "stores" | "features" | "tonight" | "deals";

const NEEDS: Record<AnswerTopic, Part[]> = {
  "cheapest-eighth": ["board"],
  "cheapest-vape-cart": ["board"],
  "cheapest-edibles": ["board"],
  "best-deals": ["deals"],
  "open-late": ["stores", "tonight"],
  medical: ["stores", "features"],
  "drive-thru": ["stores", "features"],
};

const EMPTY_BOARD: CheapestBoard = { byRef: { eighth: [], cart_1g: [], gummies_100mg: [] }, stores: 0, newest: null, oldest: null };

/** Loads only what the given topics need (all topics by default). Every
 *  reader is fail-soft and cached by the fetch layer, so calling this from
 *  several places in one render costs one round trip per table. */
export async function loadAnswerData(topics: AnswerTopic[] = ANSWER_TOPICS.map((t) => t.topic)): Promise<AnswerData> {
  const need = new Set(topics.flatMap((t) => NEEDS[t]));
  if (need.has("tonight")) need.add("stores");
  const [board, stores, features, deals] = await Promise.all([
    need.has("board") ? getCheapestBoard().catch(() => EMPTY_BOARD) : EMPTY_BOARD,
    need.has("stores") ? getRegionStores().catch(() => [] as RegionStore[]) : ([] as RegionStore[]),
    need.has("features") ? getFeatureRows().catch(() => [] as FeatureRow[]) : ([] as FeatureRow[]),
    need.has("deals") ? getLiveDeals().catch(() => [] as LiveDeal[]) : ([] as LiveDeal[]),
  ]);
  const tonight = need.has("tonight") ? await getClosingTonight(stores).catch(() => [] as TonightRow[]) : [];
  return { now: new Date(), board, stores, features, tonight, deals };
}

// -----------------------------------------------------------------------------
// Output shape
// -----------------------------------------------------------------------------

/** A run of answer text; objects render as links. */
export type Seg = string | { text: string; href: string };

export type AnswerRow = {
  key: string;
  href: string;
  title: string;
  sub: string;
  right?: string;
  rightSub?: string;
  pill?: string;
  /** External page the fact came from (store menu, store site). */
  source?: { href: string; label: string };
};

export type Faq = { q: string; a: string };

export type Answer = {
  topic: AnswerTopic;
  city: CityDef;
  path: string;
  url: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  lede: string;
  answer: Seg[];
  answerText: string;
  updated: string;
  listHeading: string;
  rows: AnswerRow[];
  emptyList: string;
  notes: Seg[][];
  faqs: Faq[];
  crumbs: { href: string; label: string }[];
  /** False when the page has nothing of its own to say (noindex, left out
   *  of the sitemap, llms-full.txt and IndexNow). */
  indexable: boolean;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** "Sat, Sep 27, 2026, 8:14 PM CT" */
export function asOfCT(d: Date): string {
  return (
    d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
    }) + " CT"
  );
}

/** "Sep 27, 2026" in Central Time. */
export function dayCT(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" });
}

const yearCT = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", timeZone: "America/Chicago" });

const segText = (segs: Seg[]) => segs.map((s) => (typeof s === "string" ? s : s.text)).join("");

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Miles between two scope-city centers, or null if either is unknown. */
export function milesBetweenCities(a: string, b: string): number | null {
  const ca = cityCenter(a);
  const cb = cityCenter(b);
  if (!ca || !cb) return null;
  return milesBetween(ca, cb);
}

const milesLabel = (m: number | null) => (m == null ? "" : m < 1 ? "same area" : `about ${Math.round(m)} mi`);

/** Stores for a city: the city's own stores; for a city with none of its
 *  own (Bartonville, Morton, Washington), stores within NEAR_MILES. */
export function storesFor(stores: RegionStore[], citySlug: string): { list: RegionStore[]; scope: "city" | "near" } {
  const own = stores.filter((s) => citySlugOf(s.city) === citySlug);
  if (own.length) return { list: own, scope: "city" };
  return { list: stores.filter((s) => within(citySlugOf(s.city), citySlug, NEAR_MILES)), scope: "near" };
}

function within(storeCitySlug: string, citySlug: string, miles: number): boolean {
  if (storeCitySlug === citySlug) return true;
  const m = milesBetweenCities(storeCitySlug, citySlug);
  return m != null && m <= miles;
}

/** Nearest item to a city by city-center distance (ties → first in list). */
function nearestTo<T>(items: T[], citySlug: string, cityOf: (t: T) => string): { item: T; miles: number } | null {
  let best: { item: T; miles: number } | null = null;
  for (const it of items) {
    const m = milesBetweenCities(cityOf(it), citySlug);
    if (m == null) continue;
    if (!best || m < best.miles) best = { item: it, miles: m };
  }
  return best;
}

const isScopeCity = (slug: string) => CENTRAL_IL_CITIES.some((c) => c.slug === slug);
const isPublicCity = (slug: string) => CENTRAL_IL_PUBLIC_CITY_SLUGS.includes(slug);

/** Where the "in {city}" / "near {city}" phrase points for a city with no store. */
function wherePhrase(city: CityDef, scope: "city" | "near") {
  return scope === "city" ? `in ${city.name}` : `near ${city.name}`;
}

function itemLine(it: CheapestItem): string {
  const name = it.product.replace(/\s+/g, " ").trim();
  const b = it.brand && !name.toLowerCase().startsWith(it.brand.toLowerCase()) ? `${it.brand} ` : "";
  return `${b}${name}`;
}

const REF_WORDS: Record<RefUnit, { noun: string; plainQ: string; titleNoun: string }> = {
  eighth: { noun: "eighth (3.5g of flower)", plainQ: "an eighth", titleNoun: "Eighth" },
  cart_1g: { noun: "1g vape cart", plainQ: "a 1g vape cart", titleNoun: "Vape Cart" },
  gummies_100mg: { noun: "100mg pack of gummies", plainQ: "a 100mg pack of gummies", titleNoun: "Edibles (100mg Gummies)" },
};

// -----------------------------------------------------------------------------
// Builders
// -----------------------------------------------------------------------------

type Core = Omit<Answer, "topic" | "city" | "path" | "url" | "answerText">;

function cheapest(ref: RefUnit, city: CityDef, d: AnswerData): Core {
  const w = REF_WORDS[ref];
  const def = REF_DEF[ref];
  const all = d.board.byRef[ref] || [];
  const near = all
    .map((it) => ({ it, miles: milesBetweenCities(it.citySlug, city.slug) }))
    .filter((x) => x.miles != null && x.miles <= NEAR_MILES)
    .sort((a, b) => a.it.otd - b.it.otd || (a.miles ?? 0) - (b.miles ?? 0));
  const asOf = asOfCT(d.now);
  const itemSlug = Object.entries(CHEAPEST_ITEMS).find(([, v]) => v.ref === ref)![0];
  const answer: Seg[] = [];
  const notes: Seg[][] = [];
  let summary: string;

  if (near.length) {
    const top = near[0].it;
    answer.push(
      `As of ${asOf}, the cheapest ${w.noun} in or near ${city.name} is ${money(top.otd)} out the door (${money(top.pretax)} on the shelf) at `,
      { text: top.storeName, href: `/dispensary/${top.listingSlug}` },
      `${top.citySlug === city.slug ? "" : ` in ${top.city}`}: ${itemLine(top)}. `,
      `That's from the store's own online menu, read ${checkedLabel(top.checkedAt)} CT, with Illinois and local cannabis tax added. `,
      near.length === 1
        ? `It's the only store within ${NEAR_MILES} miles whose menu we could read today, so treat it as a price, not a ranking.`
        : `Across the ${near.length} stores within ${NEAR_MILES} miles whose menus we read, each store's cheapest runs ${money(top.otd)} to ${money(near[near.length - 1].it.otd)} with tax.`
    );
    summary = `${money(top.otd)} out the door at ${top.storeName} (${top.city}), from the store's own menu with tax added.`;
    if (top.onSale) notes.push([`${top.storeName}'s price is a sale price; the regular shelf price is ${money(top.regular)}.`]);
  } else {
    const n = nearestTo(all, city.slug, (it) => it.citySlug);
    if (n) {
      const it = n.item;
      const target = isScopeCity(it.citySlug) ? `/cheapest/${it.citySlug}/${itemSlug}` : "/cheapest";
      answer.push(
        `As of ${asOf}, we don't have a menu price for ${w.plainQ} from any store within ${NEAR_MILES} miles of ${city.name} — some stores load their menus in a way we can't read yet. `,
        `The nearest store we can read is `,
        { text: `${it.storeName} in ${it.city}`, href: `/dispensary/${it.listingSlug}` },
        ` (${milesLabel(n.miles)}), where the cheapest is ${money(it.otd)} out the door. `,
        { text: `See the ${it.city} list`, href: target },
        "."
      );
      summary = `No readable menu within ${NEAR_MILES} miles of ${city.name} today; the nearest is ${it.storeName} in ${it.city} at ${money(it.otd)} out the door.`;
    } else {
      answer.push(
        `As of ${asOf}, we don't have a fresh menu price for ${w.plainQ} anywhere in Central Illinois. Our menu reader opens each store's own menu twice a day; prices show up here after its next run, and we never fill the gap with an estimate. `,
        { text: "Today's deals with tax added", href: "/out-the-door" },
        " cover the same question from the deals side."
      );
      summary = `No fresh menu price for ${w.plainQ} near ${city.name} right now — we never estimate. Checked twice a day on each store's own menu.`;
    }
  }

  const rows: AnswerRow[] = near.map(({ it, miles }) => ({
    key: it.listingSlug,
    href: `/dispensary/${it.listingSlug}`,
    title: it.storeName,
    sub: [it.city, miles != null && miles >= 1 ? `${Math.round(miles)} mi` : null, itemLine(it)].filter(Boolean).join(" · "),
    right: money(it.otd),
    rightSub: `${money(it.pretax)} + tax`,
    pill: it.onSale ? "On sale" : undefined,
    source: it.sourceUrl ? { href: it.sourceUrl, label: `menu, checked ${checkedLabel(it.checkedAt)}` } : undefined,
  }));

  const top = near[0]?.it;
  const faqs: Faq[] = [
    {
      q: `What's the cheapest ${ref === "gummies_100mg" ? "edible" : ref === "cart_1g" ? "vape cart" : "eighth"} in ${city.name}?`,
      a: top
        ? `On the menus we read today, ${w.plainQ} starts at ${money(top.otd)} out the door (${money(top.pretax)} before tax) at ${top.storeName} in ${top.city}, for ${itemLine(top)}. Checked ${checkedLabel(top.checkedAt)} CT on the store's own menu.`
        : `We don't have a fresh menu price within ${NEAR_MILES} miles of ${city.name} right now. We only show prices we read today, never estimates.`,
    },
    {
      q: "Does that price include tax?",
      a: `Yes. The big number is out the door: the shelf price plus Illinois state cannabis tax, sales tax and the city's local cannabis tax. This product is ${def.taxNote}.`,
    },
    {
      q: "Where do these prices come from?",
      a: `Each store's own online menu, read twice a day. We keep the cheapest ${def.size} item per store, same size, any brand. A store missing from the list isn't necessarily more expensive; we may not be able to read its menu yet.`,
    },
    {
      q: "Is there a cheaper way with a deal?",
      a: `Sometimes. Percent-off and bundle deals aren't in these shelf prices. Today's deals ${wherePhrase(city, isPublicCity(city.slug) ? "city" : "near")} are on ${brand.url}${topicDef("best-deals").path(city.slug)}.`,
    },
  ];
  if (ref === "gummies_100mg") {
    faqs.splice(1, 0, {
      q: "Why only 100mg gummies?",
      a: "It's the most common edible size in Illinois, so it's the fairest like-for-like comparison. Chocolates, drinks and CBD or CBN blends are left out.",
    });
  }

  return {
    h1: `Cheapest ${w.titleNoun.toLowerCase()} in ${city.name} today`,
    metaTitle: `Cheapest ${w.titleNoun} in ${city.name}, IL Today (Tax Included)`,
    metaDescription: summary,
    eyebrow: `Quick answer · ${city.name} · menu prices`,
    lede: `The lowest price each store within ${NEAR_MILES} miles of ${city.name} lists today for ${w.plainQ}, read from the store's own online menu, with tax added. Same size, any brand. 21+.`,
    answer,
    updated: d.board.newest ? `${checkedLabel(d.board.newest)} CT` : asOf,
    listHeading: `${def.label} near ${city.name}, cheapest first`,
    rows,
    emptyList: `No store within ${NEAR_MILES} miles of ${city.name} has a menu price we could read today.`,
    notes: [
      ...notes,
      [`Out-the-door price in each store's city; ${def.taxNote}. `, { text: "How the list works", href: `/cheapest/${city.slug}` }, "."],
    ],
    faqs,
    crumbs: [
      { href: "/cheapest", label: "Cheapest today" },
      { href: `/cheapest/${city.slug}`, label: city.name },
    ],
    indexable: near.length >= 2,
  };
}

function bestDeals(city: CityDef, d: AnswerData): Core {
  const asOf = asOfCT(d.now);
  const ownDeals = d.deals.filter((x) => citySlugOf(x.city) === city.slug);
  const scope: "city" | "near" = ownDeals.length || isPublicCity(city.slug) ? "city" : "near";
  const inScope = scope === "city" ? ownDeals : d.deals.filter((x) => within(citySlugOf(x.city), city.slug, NEAR_MILES));
  const where = wherePhrase(city, scope);
  const everyday = (x: LiveDeal) => !!amountOf(x) && !isConditional(x) && !needsQuantity(x);
  const rank = (x: LiveDeal) => (everyday(x) ? 0 : amountOf(x) && !isConditional(x) ? 1 : amountOf(x) ? 2 : 3);
  const sorted = [...inScope].sort((a, b) => rank(a) - rank(b) || (amountOf(b)?.value ?? 0) - (amountOf(a)?.value ?? 0));
  const top = sorted.find(everyday) || null;
  const storesWith = new Set(inScope.map((x) => x.listing_slug || x.slug)).size;
  const answer: Seg[] = [];
  let summary: string;
  const verified = (x: LiveDeal) => (x.verified_at && Number.isFinite(new Date(x.verified_at).getTime()) ? ` (checked on the store's own site ${dayCT(new Date(x.verified_at))})` : "");

  if (top) {
    const a = amountOf(top)!;
    answer.push(
      `As of ${asOf}, the biggest everyday discount ${where} is ${a.big} off — "${cleanDealTitle(top.deal_title)}" at `,
      { text: storeName(top), href: `/dispensary/${top.slug || top.listing_slug}` },
      `${scope === "near" ? ` in ${top.city}` : ""}${verified(top)}. `,
      `${inScope.length} ${plural(inScope.length, "deal is", "deals are")} live at ${storesWith} ${plural(storesWith, "store", "stores")} ${where} today; first-time, veteran and buy-several deals are listed below but don't lead.`
    );
    summary = `${a.big} off at ${storeName(top)}: "${cleanDealTitle(top.deal_title)}". ${inScope.length} live ${plural(inScope.length, "deal", "deals")} ${where}, checked daily on each store's own site.`;
  } else if (inScope.length) {
    answer.push(
      `As of ${asOf}, the ${inScope.length} ${plural(inScope.length, "deal", "deals")} live ${where} ${plural(inScope.length, "is a", "are")} bundle, set-price or conditional ${plural(inScope.length, "offer", "offers")} rather than a straight discount everyone gets. `,
      `The full list is below, straight from each store's own site.`
    );
    summary = `${inScope.length} live ${plural(inScope.length, "deal", "deals")} ${where} today, none a straight discount for everyone. Checked daily on each store's own site.`;
  } else {
    const byCity = new Map<string, number>();
    for (const x of d.deals) byCity.set(citySlugOf(x.city), (byCity.get(citySlugOf(x.city)) || 0) + 1);
    const n = nearestTo([...byCity.keys()].filter(isScopeCity), city.slug, (s) => s);
    answer.push(`As of ${asOf}, no dispensary ${where} has a deal posted on its own website. `);
    if (n) {
      const name = answerCity(n.item)!.name;
      answer.push(
        `The nearest city with live deals is `,
        { text: name, href: topicDef("best-deals").path(n.item) },
        ` (${milesLabel(n.miles)}), with ${byCity.get(n.item)} today.`
      );
      summary = `No deals posted ${where} today. The nearest city with live deals is ${name}, ${milesLabel(n.miles)} away.`;
    } else {
      answer.push("None of the Central Illinois stores we track has one right now either; deals are re-checked every morning.");
      summary = `No deals posted ${where} today. Re-checked every morning on each store's own site.`;
    }
  }

  const rows: AnswerRow[] = sorted.slice(0, 25).map((x) => {
    const a = amountOf(x);
    return {
      key: x.deal_id,
      href: `/dispensary/${x.slug || x.listing_slug}`,
      title: cleanDealTitle(x.deal_title) || "Deal",
      sub: [storeName(x), scope === "near" || citySlugOf(x.city) !== city.slug ? x.city : null, x.verified_at ? `checked ${dayCT(new Date(x.verified_at))}` : null]
        .filter(Boolean)
        .join(" · "),
      right: a ? `${a.upTo ? "up to " : ""}${a.big} off` : undefined,
      pill: isConditional(x) ? "Conditions apply" : needsQuantity(x) ? "Buy several" : undefined,
      source: x.source_url ? { href: x.source_url, label: "store's page" } : undefined,
    };
  });

  return {
    h1: `Best weed deals in ${city.name} today`,
    metaTitle: `Best Dispensary Deals in ${city.name}, IL Today`,
    metaDescription: summary,
    eyebrow: `Quick answer · ${city.name} · deals`,
    lede: `Every deal ${where} that a dispensary has posted on its own website, biggest everyday discount first. Nobody pays to rank. 21+.`,
    answer,
    updated: asOf,
    listHeading: `Live deals ${where}`,
    rows,
    emptyList: `No live deals ${where} right now.`,
    notes: [
      [
        inScope.length > rows.length ? `Showing ${rows.length} of ${inScope.length}. ` : "",
        ...(isPublicCity(city.slug) ? [{ text: `Every ${city.name} store, deals and hours`, href: `/city/${city.slug}` }, ". "] : []),
        "Deals are re-checked every morning on each store's own site.",
      ],
    ],
    faqs: [
      {
        q: `What are the best weed deals in ${city.name} today?`,
        a: top
          ? `The biggest everyday discount is ${amountOf(top)!.big} off at ${storeName(top)}: "${cleanDealTitle(top.deal_title)}". ${inScope.length} ${plural(inScope.length, "deal is", "deals are")} live ${where}.`
          : inScope.length
            ? `${inScope.length} ${plural(inScope.length, "deal is", "deals are")} live ${where}, all bundles, set prices or conditional offers.`
            : `No store ${where} has a deal posted on its own site right now.`,
      },
      {
        q: "Why doesn't a first-time or veteran discount come first?",
        a: "They're real, but not everyone can use them, and \"up to\" deals don't say what you'll actually save. The top spot goes to the biggest discount any adult can get today.",
      },
      {
        q: "Where do these deals come from?",
        a: "Each dispensary's own website and official social accounts, checked every morning. Never Leafly, Weedmaps or other aggregators. A deal we can't re-find within a week comes down.",
      },
    ],
    crumbs: isPublicCity(city.slug) ? [{ href: `/city/${city.slug}`, label: city.name }] : [{ href: "/deals/all", label: "Deals" }],
    indexable: inScope.length > 0,
  };
}

function openLate(city: CityDef, d: AnswerData): Core {
  const asOf = asOfCT(d.now);
  const ct = nowInCT(d.now);
  const { list, scope } = storesFor(d.stores, city.slug);
  const where = wherePhrase(city, scope);
  const ids = new Set(list.map((s) => s.id));
  const rowsIn = d.tonight.filter((t) => ids.has(t.store.id));
  const listed = rowsIn.filter((t) => t.closesAt);
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const lateKey = (t: string) => toMin(t) + (toMin(t) < 300 ? 1440 : 0);
  const answer: Seg[] = [];
  const notes: Seg[][] = [];
  let summary: string;

  if (listed.length) {
    const latest = lateKey(listed[0].closesAt!);
    const tied = listed.filter((t) => lateKey(t.closesAt!) === latest);
    const time = formatTime(listed[0].closesAt);
    const openNow = tied.some((t) => t.openNow);
    answer.push(`As of ${asOf}, the dispensary open latest ${where} today is `);
    tied.slice(0, 3).forEach((t, i) => {
      if (i > 0) answer.push(i === tied.slice(0, 3).length - 1 ? " and " : ", ");
      answer.push({ text: t.store.name, href: `/dispensary/${t.store.slug}` });
      if (scope === "near") answer.push(` in ${t.store.city}`);
    });
    answer.push(`, open until ${time}. `);
    const closedForNight = !openNow && ct.minutes >= latest && latest < 1440;
    if (openNow) answer.push(`${tied.length > 1 ? "They're" : "It's"} open right now. `);
    else if (closedForNight) answer.push(`Every store ${where} has closed for the night. `);
    else answer.push(`${tied.length > 1 ? "They aren't" : "It isn't"} open at this moment; check today's opening time on the store's page. `);
    answer.push(`Hours come from each store's listing and can change on holidays, so call ahead late at night.`);
    summary = `${tied.map((t) => t.store.name).slice(0, 3).join(" and ")} — open until ${time} today. Every store ${where}, sorted by closing time.`;

    // A store a few miles away that closes later is worth knowing about.
    if (scope === "city") {
      const nearby = d.tonight.filter(
        (t) => !ids.has(t.store.id) && t.closesAt && within(citySlugOf(t.store.city), city.slug, NEAR_MILES) && lateKey(t.closesAt) > latest
      );
      if (nearby[0]) {
        const n = nearby[0];
        notes.push([
          `Just outside ${city.name}: `,
          { text: n.store.name, href: `/dispensary/${n.store.slug}` },
          ` in ${n.store.city} (${milesLabel(milesBetweenCities(citySlugOf(n.store.city), city.slug))}) stays open until ${formatTime(n.closesAt)}.`,
        ]);
      }
    }
  } else if (rowsIn.length) {
    answer.push(
      `As of ${asOf}, ${rowsIn.every((t) => t.closedToday) ? `every store ${where} is closed today` : `we don't have today's hours for the ${rowsIn.length} ${plural(rowsIn.length, "store", "stores")} ${where}`}. `,
      { text: "See every Central Illinois store by closing time", href: "/open-late" },
      "."
    );
    summary = `We don't have today's closing times ${where}. See every Central Illinois store by closing time.`;
  } else {
    answer.push(`As of ${asOf}, there's no dispensary within ${NEAR_MILES} miles of ${city.name} in our listings. `, { text: "Every Central Illinois store by closing time", href: "/open-late" }, ".");
    summary = `No dispensary within ${NEAR_MILES} miles of ${city.name}. See every Central Illinois store by closing time.`;
  }

  const rows: AnswerRow[] = rowsIn.map((t) => ({
    key: t.store.slug,
    href: `/dispensary/${t.store.slug}`,
    title: t.store.name,
    sub: [t.store.city, t.openNow ? "open now" : null].filter(Boolean).join(" · "),
    right: t.closesAt ? formatTime(t.closesAt) : t.closedToday ? "Closed today" : "Hours not listed",
  }));

  return {
    h1: `Dispensary open latest in ${city.name} tonight`,
    metaTitle: `Which Dispensary Is Open Latest in ${city.name}, IL Tonight?`,
    metaDescription: summary,
    eyebrow: `Quick answer · ${city.name} · hours`,
    lede: `Every dispensary ${where}, sorted by today's closing time in Central Time. Illinois now allows hours until 2 a.m. with city approval. 21+.`,
    answer,
    updated: asOf,
    listHeading: `Closing times ${where} today`,
    rows,
    emptyList: `No stores ${where} in our listings.`,
    notes: [...notes, ["Times are today's, Central Time. ", { text: "All Central Illinois stores by closing time", href: "/open-late" }, "."]],
    faqs: [
      {
        q: `Which dispensary is open latest in ${city.name}?`,
        a: listed.length
          ? `Today it's ${listed.filter((t) => lateKey(t.closesAt!) === lateKey(listed[0].closesAt!)).map((t) => t.store.name).slice(0, 3).join(" and ")}, open until ${formatTime(listed[0].closesAt)} Central Time, going by each store's listed hours.`
          : `We don't have today's closing times ${where}.`,
      },
      {
        q: "Can Illinois dispensaries stay open past 10 p.m.?",
        a: "Yes, if the city allows it. SB 3222, signed in June 2026, lets dispensaries stay open until 2 a.m. with local approval. Most Central Illinois stores still close by 10.",
      },
      {
        q: "Are these hours reliable on holidays?",
        a: "Not always. They come from each store's listing and stores change them for holidays and inventory days. Late at night, call before you drive.",
      },
    ],
    crumbs: [
      { href: "/ways-to-buy", label: "Ways to buy" },
      { href: "/open-late", label: "Open late" },
    ],
    indexable: listed.length > 0,
  };
}

function medical(city: CityDef, d: AnswerData): Core {
  const asOf = asOfCT(d.now);
  const day = dayCT(d.now);
  const F = featuresBySlug(d.features);
  const { list, scope } = storesFor(d.stores, city.slug);
  const where = wherePhrase(city, scope);
  const yes = list.filter((s) => F.get(s.slug)?.medical?.status === "yes");
  const recOnly = list.filter((s) => F.get(s.slug)?.medical?.status === "no");
  const unknown = list.filter((s) => !F.get(s.slug)?.medical);
  const answer: Seg[] = [];
  let summary: string;

  if (yes.length) {
    answer.push(
      `Yes. As of ${day}, ${yes.length} ${plural(yes.length, "dispensary", "dispensaries")} ${where} ${plural(yes.length, "says", "say")} on ${plural(yes.length, "its", "their")} own website that ${plural(yes.length, "it sells", "they sell")} medical cannabis: `
    );
    yes.slice(0, 4).forEach((s, i) => {
      if (i > 0) answer.push(i === Math.min(yes.length, 4) - 1 ? " and " : ", ");
      answer.push({ text: s.name, href: `/dispensary/${s.slug}` });
      if (scope === "near") answer.push(` (${s.city})`);
    });
    answer.push(
      `. Since Sept 10, 2026, Illinois stores can serve medical and adult-use customers under one roof, and a registered patient pays a much lower tax. Bring your card and ID.`
    );
    summary = `${yes.map((s) => s.name).slice(0, 3).join(", ")} ${plural(yes.length, "sells", "sell")} medical cannabis ${where}, per ${plural(yes.length, "its", "their")} own site. Checked ${day}.`;
  } else {
    const allYes = d.stores.filter((s) => F.get(s.slug)?.medical?.status === "yes");
    const n = nearestTo(allYes, city.slug, (s) => citySlugOf(s.city));
    answer.push(
      list.length === 1
        ? `As of ${day}, ${list[0].name}${scope === "near" ? ` in ${list[0].city}` : ""} doesn't say on its own website that it sells medical cannabis. `
        : list.length
          ? `As of ${day}, none of the ${list.length} dispensaries ${where} says on its own website that it sells medical cannabis. `
          : `As of ${day}, there's no dispensary ${where} in our listings. `
    );
    if (n) {
      answer.push(`The nearest store that does is `, { text: `${n.item.name} in ${n.item.city}`, href: `/dispensary/${n.item.slug}` }, ` (${milesLabel(n.miles)}).`);
      summary = `No store ${where} confirms medical sales yet. Nearest that does: ${n.item.name} in ${n.item.city}, ${milesLabel(n.miles)}.`;
    } else {
      answer.push("We haven't confirmed medical sales at any Central Illinois store yet.");
      summary = `No store ${where} confirms medical sales yet, as of ${day}.`;
    }
    if (unknown.length) answer.push(` Call ahead: ${unknown.length === 1 ? (list.length === 1 ? "it hasn't" : "one store here hasn't") : `${unknown.length} stores here haven't`} said either way.`);
  }

  const src = (s: RegionStore) => F.get(s.slug)?.medical;
  const rows: AnswerRow[] = yes.map((s) => ({
    key: s.slug,
    href: `/dispensary/${s.slug}`,
    title: s.name,
    sub: [s.city, src(s)?.evidence].filter(Boolean).join(" · "),
    pill: "Medical",
    source: src(s)?.source_url ? { href: src(s)!.source_url, label: "store's own site" } : undefined,
  }));
  const notes: Seg[][] = [];
  if (recOnly.length) notes.push([`Recreational only, per the store's own site: ${recOnly.map((s) => s.name).join(", ")}.`]);
  if (unknown.length && yes.length) notes.push([`Not confirmed either way yet: ${unknown.map((s) => s.name).join(", ")}.`]);
  notes.push(["Checked ", asOf, ". ", { text: "Every Central Illinois medical store", href: "/medical" }, " · ", { text: "Getting a medical card", href: "/guides/illinois-medical-cannabis-card-2026" }, "."]);

  return {
    h1: `Medical dispensary in ${city.name}`,
    metaTitle: `Medical Cannabis Dispensary in ${city.name}, IL (${yearCT(d.now)})`,
    metaDescription: summary,
    eyebrow: `Quick answer · ${city.name} · medical`,
    lede: `Which dispensaries ${where} sell medical cannabis, confirmed on each store's own website, with the wording we found. 21+, or a registered patient.`,
    answer,
    updated: asOf,
    listHeading: `Confirmed selling medical ${where}`,
    rows,
    emptyList: `No store ${where} confirms medical sales on its own site yet.`,
    notes,
    faqs: [
      {
        q: `Is there a medical dispensary in ${city.name}?`,
        a: yes.length
          ? `Yes: ${yes.map((s) => s.name).join(", ")}, per each store's own website, checked ${day}.`
          : `Not confirmed yet. None of the stores ${where} says on its own site that it sells medical, as of ${day}.`,
      },
      {
        q: "What changed for medical cannabis in Illinois in 2026?",
        a: "SB 3222 (June 12, 2026) let every dispensary apply to sell medical, and IDFPR issued medical licenses to 37 existing adult-use stores on Sept 10, 2026, so one store can now serve both.",
      },
      {
        q: "Is medical cannabis cheaper in Illinois?",
        a: "Usually, because of tax. Stores selling medical quote a 1% state tax with a valid card, against 10% to 25% state excise plus sales tax on adult-use purchases.",
      },
    ],
    crumbs: [
      { href: "/ways-to-buy", label: "Ways to buy" },
      { href: "/medical", label: "Medical" },
    ],
    indexable: yes.length > 0,
  };
}

function driveThru(city: CityDef, d: AnswerData): Core {
  const day = dayCT(d.now);
  const F = featuresBySlug(d.features);
  const near = d.stores.filter((s) => within(citySlugOf(s.city), city.slug, NEAR_MILES));
  const open = near.filter((s) => F.get(s.slug)?.drive_thru?.status === "yes");
  const coming = near.filter((s) => F.get(s.slug)?.drive_thru?.status === "announced");
  const fast = near.filter((s) => F.get(s.slug)?.order_ahead?.status === "yes" || F.get(s.slug)?.curbside?.status === "yes");
  const answer: Seg[] = [];
  let summary: string;
  const name = (s: RegionStore): Seg[] => [{ text: s.name, href: `/dispensary/${s.slug}` }, citySlugOf(s.city) === city.slug ? "" : ` in ${s.city}`];

  if (open.length) {
    answer.push(`Yes. As of ${day}, `);
    open.slice(0, 3).forEach((s, i) => {
      if (i > 0) answer.push(" and ");
      answer.push(...name(s));
    });
    answer.push(` ${plural(open.length, "has", "have")} a drive-thru open, per ${plural(open.length, "the store's", "each store's")} own website. At Illinois drive-thrus so far you order online first, then show ID at the window.`);
    summary = `Yes — ${open.map((s) => s.name).slice(0, 3).join(" and ")} ${plural(open.length, "has", "have")} a drive-thru near ${city.name}, per the store's own site. Checked ${day}.`;
  } else {
    answer.push(
      `Not yet. As of ${day}, none of the ${near.length} ${plural(near.length, "dispensary", "dispensaries")} within ${NEAR_MILES} miles of ${city.name} has a drive-thru open. Illinois made them legal on June 12, 2026, but each store still needs city and state sign-off. `
    );
    if (coming.length) {
      answer.push(...name(coming[0]), ` has announced one. `);
    }
    if (fast.length) {
      answer.push(`The closest thing today is ordering ahead for quick pickup at `, ...name(fast[0]), fast.length > 1 ? ` and ${fast.length - 1} other ${plural(fast.length - 1, "store", "stores")} nearby.` : ".");
    }
    summary = `No drive-thru dispensary within ${NEAR_MILES} miles of ${city.name} yet (checked ${day}). ${fast.length ? `${fast.length} nearby ${plural(fast.length, "store offers", "stores offer")} order-ahead or curbside pickup.` : "Legal in Illinois since June 12, 2026."}`;
  }

  const listStores = open.length ? [...open, ...coming] : fast;
  const rows: AnswerRow[] = listStores.map((s) => {
    const f = F.get(s.slug) || {};
    const pills = [f.drive_thru?.status === "yes" ? "Drive-thru" : f.drive_thru?.status === "announced" ? "Drive-thru coming" : null, f.order_ahead?.status === "yes" ? "Order ahead" : null, f.curbside?.status === "yes" ? "Curbside" : null].filter(Boolean);
    const m = milesBetweenCities(citySlugOf(s.city), city.slug);
    return {
      key: s.slug,
      href: `/dispensary/${s.slug}`,
      title: s.name,
      sub: [s.city, m != null && m >= 1 ? `${Math.round(m)} mi` : null].filter(Boolean).join(" · "),
      pill: pills.join(" · ") || undefined,
    };
  });

  return {
    h1: `Drive-thru dispensary near ${city.name}`,
    metaTitle: `Drive-Thru Dispensary Near ${city.name}, IL? (${yearCT(d.now)})`,
    metaDescription: summary,
    eyebrow: `Quick answer · ${city.name} · drive-thru`,
    lede: `Whether any dispensary within ${NEAR_MILES} miles of ${city.name} has a drive-thru, confirmed on the store's own website — and the fastest pickup until one does. 21+.`,
    answer,
    updated: asOfCT(d.now),
    listHeading: open.length ? `Drive-thrus near ${city.name}` : `Fastest pickup near ${city.name} today`,
    rows,
    emptyList: `No store within ${NEAR_MILES} miles of ${city.name} lists a drive-thru, order-ahead or curbside pickup on its own site yet.`,
    notes: [["Where Illinois drive-thrus are already open, and why none is here yet: ", { text: "the drive-thru tracker", href: "/drive-thru" }, "."]],
    faqs: [
      {
        q: `Is there a drive-thru dispensary near ${city.name}?`,
        a: open.length
          ? `Yes: ${open.map((s) => `${s.name} (${s.city})`).join(", ")}, per each store's own site, checked ${day}.`
          : `Not yet. As of ${day}, no dispensary within ${NEAR_MILES} miles of ${city.name} has one open${coming.length ? `; ${coming[0].name} has announced one` : ""}.`,
      },
      {
        q: "Are cannabis drive-thrus legal in Illinois?",
        a: "Yes. SB 3222, signed June 12, 2026, allows a dispensary to serve customers through a drive-through once IDFPR approves the store's setup. Many cities also have to change their local ordinance first.",
      },
      {
        q: "How does a dispensary drive-thru work?",
        a: "At the Illinois drive-thrus open so far, you order online first, pull up to the window, and staff check your ID before handing over the order.",
      },
    ],
    crumbs: [
      { href: "/ways-to-buy", label: "Ways to buy" },
      { href: "/drive-thru", label: "Drive-thru" },
    ],
    indexable: open.length + coming.length > 0,
  };
}

/** Builds one answer page. Pure: same data in, same answer out. */
export function buildAnswer(topic: AnswerTopic, citySlug: string, data: AnswerData): Answer | null {
  const city = answerCity(citySlug);
  if (!city) return null;
  const ref = REF_OF[topic];
  const core: Core =
    ref ? cheapest(ref, city, data)
    : topic === "best-deals" ? bestDeals(city, data)
    : topic === "open-late" ? openLate(city, data)
    : topic === "medical" ? medical(city, data)
    : driveThru(city, data);
  const path = topicDef(topic).path(city.slug);
  return { ...core, topic, city, path, url: `${brand.url}${path}`, answerText: segText(core.answer).replace(/\s+/g, " ").trim() };
}

/** Page helper: load what one topic needs and build it. */
export async function getAnswer(topic: AnswerTopic, citySlug: string): Promise<Answer | null> {
  if (!answerCity(citySlug)) return null;
  return buildAnswer(topic, citySlug, await loadAnswerData([topic]));
}

/** Every answer that has something of its own to say (indexable). */
export async function indexableAnswers(): Promise<Answer[]> {
  const data = await loadAnswerData();
  return allAnswerParams()
    .map(({ topic, city }) => buildAnswer(topic, city, data))
    .filter((a): a is Answer => !!a && a.indexable);
}

/** Sitemap entries for indexable answer pages. */
export async function answerSitemapEntries() {
  try {
    return (await indexableAnswers()).map((a) => ({
      url: a.url,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

/** URLs for the IndexNow ping (indexable answers only). */
export async function answerUrlsForIndexNow(): Promise<string[]> {
  try {
    return (await indexableAnswers()).map((a) => a.url);
  } catch {
    return [];
  }
}

/** "## Quick answers by city" block for /llms-full.txt. */
export async function answerLlmsLines(): Promise<string[]> {
  let answers: Answer[] = [];
  try {
    answers = await indexableAnswers();
  } catch {
    return [];
  }
  if (!answers.length) return [];
  const lines = ["", "## Quick answers by city", "One question, one city, answered from today's data. Each line links to its page."];
  for (const c of CENTRAL_IL_CITIES) {
    const mine = answers.filter((a) => a.city.slug === c.slug);
    if (!mine.length) continue;
    lines.push("", `### ${c.name}`);
    for (const a of mine) lines.push(`- ${topicDef(a.topic).question(c.name)} ${a.answerText} ${a.url}`);
  }
  return lines;
}
