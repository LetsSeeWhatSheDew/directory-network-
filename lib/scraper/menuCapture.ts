// lib/scraper/menuCapture.ts
// =============================================================================
// Menu-price capture for the rendered scraper (scripts/scrape-rendered-deals.ts).
//
// While the rendered scraper has a real browser open, it also reads product-
// level shelf prices from each store's OWN online menu for three reference
// units (lib/menuPrices.ts REF_DEF): an eighth (3.5g flower), a 1g vape
// cartridge and a 100mg gummies pack.
//
// One page load per store (the store's own menu page, on its own domain).
// The other categories come from the SAME data calls that menu page makes
// when a shopper taps a category — issued from inside that page, to the
// store's own domain, never to an aggregator:
//
//   dutchie  Dutchie embedded menu (noxx.com, letsascend.com, …): the page's
//            own FilteredProducts GraphQL request (…/api-1/graphql), replayed
//            with the category/size changed.
//   sweed    Sweed storefront (shop.aromahillcannabis.com; the menu embedded on
//            ivyhalldispensary.com): POST …/_api/Products/GetProductList with
//            the page's storeid header, to the same API base the page uses
//            (the store host, or the embed's own Sweed POS proxy).
//   joint    Joint (WordPress) on cookies.co: POST
//            /wp-json/joint-ecommerce/v1/products/ecommerce-production/_search
//            with the page's own businessId.
//   jane     Jane (iHeartJane) headless menu on the store's own site
//            (nueracannabis.com): the page's own Algolia product search. The
//            Algolia app id and public search key ROTATE — they are read at run
//            time from the requests the menu page makes (or, failing that, from
//            the page's own config), never hard-coded. Queries are replayed with
//            the page's own store_id clause and only the category changed.
//   treez    Treez / GapCommerce storefront (trinitydispensaries.com): prices
//            are server-rendered HTML only (no data call to replay), so the
//            reader opens the store's Flower / Vapes / Edibles pages (links
//            found on the store page, never guessed) and reads each product
//            card on its own, line by line. Up to 4 page loads per store.
//
// Platform check at run time: every page load watches for all the platforms'
// data calls. If a store's menu has moved (e.g. Jane → Dutchie) and its
// `alsoTry` platform is what the page actually used, that reader runs;
// otherwise the snapshot is an error that says what the page did load.
//
// Persistence reuses the menu-baseline pipeline's tables and write pattern
// (feat/menu-baseline-pipeline lib/scraper/menu/persist.ts and
// scripts/normalize-menu-items.ts): one menu_snapshots row per store per run
// (recorded even when empty or failed — the breakage ledger), menu_items rows
// only for an ok snapshot, canonical_products upserted on its unique key.
//
// Accuracy over volume: every price passes the REF_DEF sanity band; anything
// ambiguous (infused, >35% THC flower, disposables, ratio edibles, bundle or
// conditional specials) is dropped and logged, never guessed.
// =============================================================================

import type { Frame, Page } from "playwright-core";
import { REF_DEF, REF_UNITS, type RefUnit } from "../menuPrices";
import { calculateOutTheDoor } from "../taxRates";
import { ratesFor } from "../otd";

export type MenuPlatform = "dutchie" | "sweed" | "joint" | "jane" | "treez";

export type MenuSource = {
  platform: MenuPlatform;
  /** The one page we load — the store's own menu, on its own domain. */
  url: string;
  /** dispensaries.slug when the pipeline seeded this store under a different
   *  slug than master_listings (reference-data/dispensary_registry.json). */
  dispensarySlug?: string;
  /** Second platform to accept when the page's own data calls show the store
   *  has moved to it (evidence is mixed for High Haven: Jane vs Dutchie). */
  alsoTry?: MenuPlatform;
  /** jane: the REC store id this menu must query, when known. A page that
   *  queries a different store (e.g. the MED menu) is an error, not data. */
  janeStoreId?: number;
  /** treez: a link on `url` whose text matches this leads to the store's own
   *  menu (one domain serves both Trinity stores). */
  storeLink?: RegExp;
  /** treez: the store's own menu must name the store near the top of the
   *  page, or nothing is read (prices could be the other store's). */
  storeLabel?: RegExp;
  /** treez: …and must NOT name this other store there (a header that lists
   *  both stores can't tell us which one is selected). */
  notLabel?: RegExp;
};

const TRINITY_GLEN = /\bglen(?:\s+ave(?:nue)?)?\b/i;
const TRINITY_UNIVERSITY = /(?<!\d+\s+(?:n\.?|north)\s+)\buniversity(?:\s+st(?:reet)?)?\b(?!\s+suite)/i;

// Store menus by master_listings slug. Found 2026-09-25 by loading each
// store's site; see docs/ops/2026-09-25-menu-prices-dryrun.log for the per-store
// evidence and the stores not covered yet (and why).
export const MENU_SOURCES: Record<string, MenuSource> = {
  // Dutchie embedded menus — the flower page filtered to 1/8oz, cheapest first.
  "noxx-east-peoria": { platform: "dutchie", url: "https://noxx.com/stores/noxx-peoria/products/flower?sortby=pricelowtohigh&weight=1-8oz" },
  "ascend-cannabis-downtown-springfield": { platform: "dutchie", url: "https://letsascend.com/stores/springfield-adams-street-illinois/products/flower?sortby=pricelowtohigh&weight=1-8oz" },
  "ascend-cannabis-horizon-drive": { platform: "dutchie", url: "https://letsascend.com/stores/springfield-horizon-drive-illinois/products/flower?sortby=pricelowtohigh&weight=1-8oz" },
  "high-profile-cannabis-springfield": { platform: "dutchie", url: "https://highprofilecannabis.com/stores/il-springfield-hp/products/flower?sortby=pricelowtohigh&weight=1-8oz" },
  "maribis-springfield": { platform: "dutchie", url: "https://www.maribisllc.com/stores/maribis-denver/products/flower?sortby=pricelowtohigh&weight=1-8oz" },
  // Sweed storefronts.
  "aroma-hill-peoria": { platform: "sweed", url: "https://shop.aromahillcannabis.com/peoria/menu" },
  // Ivy Hall's embedded Sweed menu loads its data from web-ui-production.sweedpos.com,
  // whose robots.txt disallows everything — the run records that and reads nothing.
  "ivy-hall-dispensary": { platform: "sweed", url: "https://ivyhalldispensary.com/locations/peoria/menu/recreational", dispensarySlug: "ivy-hall-peoria-heights" },
  // Joint (WordPress) storefronts.
  "cookies-bloomington": { platform: "joint", url: "https://bloomington.cookies.co/" },
  "cookies-peoria-heights": { platform: "joint", url: "https://peoriaheights.cookies.co/", dispensarySlug: "cookies-peoria-heights" },
  // Jane headless menus on nueracannabis.com (added 2026-09-27; the cloud
  // could not load them — first real read is the Mac run). Store ids from the
  // store's own menu URLs (…/shop/store/<id>/…): 1517 East Peoria REC (1518 is
  // MED), 1519 Urbana REC (1520 is MED). Champaign and Pekin ids are taken
  // from the page's own query at run time.
  "nuera-east-peoria": { platform: "jane", url: "https://nueracannabis.com/shop/store/1517/featured", janeStoreId: 1517 },
  "nuera-champaign": { platform: "jane", url: "https://nueracannabis.com/dispensaries/il/champaign/menu-rec/" },
  "nuera-pekin": { platform: "jane", url: "https://nueracannabis.com/dispensaries/il/pekin/menu-rec/" },
  "nuera-urbana": { platform: "jane", url: "https://nueracannabis.com/dispensaries/il/urbana/menu-rec/", janeStoreId: 1519 },
  // High Haven Normal ("The Puff Palace"): listed as a Jane embed on Sep 25,
  // but its current specials links carry Dutchie ids — the run uses whichever
  // the page actually calls.
  "high-haven-normal": { platform: "jane", alsoTry: "dutchie", url: "https://highhavencannabis.com/high-haven-normal-il-the-puff-palace/normal-menu/" },
  // Trinity (Treez / GapCommerce): one domain, two stores; the store is
  // picked by following the store's own link from the site's home page.
  // "University St" also appears in street addresses ("3125 N University St"),
  // so a bare street name after a house number never counts as the store.
  "trinity-on-glen": { platform: "treez", url: "https://www.trinitydispensaries.com/", storeLink: TRINITY_GLEN, storeLabel: TRINITY_GLEN, notLabel: TRINITY_UNIVERSITY },
  "trinity-on-university": { platform: "treez", url: "https://www.trinitydispensaries.com/", storeLink: TRINITY_UNIVERSITY, storeLabel: TRINITY_UNIVERSITY, notLabel: TRINITY_GLEN },
};

// Central IL stores with no menu reader yet, and why (checked 2026-09-25 from a
// cloud browser; see docs/ops/2026-09-25-menu-prices-dryrun.log). Printed on every run
// so the gap stays visible. Move a store into MENU_SOURCES once it reads clean.
export const MENU_NOT_COVERED: Record<string, string> = {
  "cloud-9-east-peoria": "Cresco/Sunnyside storefront: its inventory call (api.crescolabs.com) returned 0 products for store 974 from the cloud; not parsed until a Mac run shows real rows",
  "sunnyside-champaign": "Cresco/Sunnyside storefront: inventory call returned 0 products from the cloud (same as Cloud 9)",
  "shangri-la-springfield": "Cresco/Sunnyside storefront: inventory call returned 0 products for store 970 from the cloud",
  "beyond-hello-bloomington": "Jane (per the pipeline registry); the registry's menu URL is now a 404 — needs a new menu URL",
  "beyond-hello-normal": "Jane (per the pipeline registry); menu URL not re-found",
  "beyond-hello-peoria": "Bloom Wellness on risecannabis.com — Cloudflare Turnstile blocks the cloud",
  "ayr-wellness-normal": "Bloom Wellness on risecannabis.com — Cloudflare Turnstile blocks the cloud",
  "revolution-dispensary-normal": "Bloom Wellness on risecannabis.com — Cloudflare Turnstile blocks the cloud",
  "share-springfield": "LeafBridge (WordPress admin-ajax) menu, no reader yet",
  "the-dispensary-champaign": "no store website of its own (see docs/ops/2026-09-25-scraper-coverage.md)",
};

// ---------------------------------------------------------------------------
// Run order. The menu phase stops starting stores at MENU_DEADLINE_MS, so a
// fixed order would starve whichever stores sit at the end whenever the deals
// pass runs long. Instead: least recently ATTEMPTED first. A store is marked
// attempted only when it actually ran (any outcome, error included) — a store
// skipped by the deadline keeps its old time and leads the next run. Stores
// never attempted come first; ties keep MENU_SOURCES order.
// ---------------------------------------------------------------------------

export type MenuOrderState = Record<string, string>; // slug → ISO time of last attempt

export function orderMenuStores(slugs: string[], lastAttempt: MenuOrderState): string[] {
  const t = (slug: string) => {
    const ms = Date.parse(lastAttempt[slug] ?? "");
    return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
  };
  return slugs
    .map((slug, i) => ({ slug, i, at: t(slug) }))
    .sort((a, b) => (a.at === b.at ? a.i - b.i : a.at - b.at))
    .map((x) => x.slug);
}

/** Tolerant read of the saved order state: anything unreadable → {} (MENU_SOURCES order). */
export function parseMenuOrderState(text: string | null | undefined): MenuOrderState {
  if (!text) return {};
  try {
    const j = JSON.parse(text);
    if (!j || typeof j !== "object" || Array.isArray(j)) return {};
    const out: MenuOrderState = {};
    for (const [k, v] of Object.entries(j)) if (typeof v === "string" && Number.isFinite(Date.parse(v))) out[k] = v;
    return out;
  } catch {
    return {};
  }
}

export const ADAPTER_VERSION: Record<MenuPlatform, string> = {
  dutchie: "rendered-dutchie@1.0.0",
  sweed: "rendered-sweed@1.0.0",
  joint: "rendered-joint@1.0.0",
  jane: "rendered-jane-algolia@1.0.0",
  treez: "rendered-treez-html@1.0.0",
};

/** One product at one reference size, as the store's menu lists it. */
export type MenuCandidate = {
  ref: RefUnit;
  name: string;
  brand: string | null;
  category: string;          // platform category / subcategory, verbatim
  weight: string;            // as listed ("1/8oz", "3.5g", "100 mg")
  regular: number;           // shelf price before sale, pre-tax
  sale: number | null;       // non-null only for a plain, unconditional sale price
  thc: string | null;        // "28.2%", "100mg"
  thcPct: number | null;     // flower/cart THC %, when listed
  productId: string | null;
};

export type Dropped = { ref: RefUnit | "?"; name: string; reason: string };

export type StoreMenuResult = {
  slug: string;
  platform: MenuPlatform;
  status: "ok" | "partial" | "empty" | "error";
  items: MenuCandidate[];
  dropped: Dropped[];
  error?: string;
  pageLoads: number;
  dataCalls: number;
  durationMs: number;
  sourceUrl: string;
};

// ---------------------------------------------------------------------------
// Classification helpers (pure — shared by every platform)
// ---------------------------------------------------------------------------

const INFUSED = /\b(infused|moon ?rocks?|caviar|kaviar|kief|hash(?!\s*plant)|coated|dipped|rosin[- ]coated)\b/i;
const SHAKE = /\b(shake|trim|grind|ground|pre-?ground)\b/i;
const NOT_CART = /\b(disposable|dispo|all[- ]in[- ]one|aio|ready[- ]to[- ]use|pods?|battery|batteries|kit|minibar|reload)\b/i;
const RATIO = /\b\d+\s*:\s*\d+\b|\bcbd\b|\bcbn\b|\bcbg\b/i;

const num = (x: unknown): number | null => {
  const n = typeof x === "string" ? Number(x.replace(/[$,]/g, "")) : typeof x === "number" ? x : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Validate one candidate against the reference definition and sanity band.
 *  Returns a reason string when it must be dropped. */
export function rejectReason(c: MenuCandidate): string | null {
  if (!c.name) return "no product name";
  if (!(c.regular > 0)) return "no regular price";
  if (c.sale != null && !(c.sale > 0 && c.sale < c.regular)) return `sale price ${c.sale} not below regular ${c.regular}`;
  const price = c.sale ?? c.regular;
  const [lo, hi] = REF_DEF[c.ref].band;
  if (price < lo || price > hi) return `price $${price} outside sanity band $${lo}–$${hi}`;
  if (c.regular > hi * 2.5) return `regular price $${c.regular} implausible`;
  if (c.ref === "eighth") {
    if (INFUSED.test(`${c.name} ${c.category}`)) return "infused / concentrate-coated flower";
    if (SHAKE.test(`${c.name} ${c.category}`)) return "shake/trim, not bud";
    if (/pre-?roll|joint|blunt/i.test(`${c.name} ${c.category}`)) return "pre-roll";
    if (c.thcPct != null && c.thcPct > 35) return "THC above 35% (taxed at the 25% tier)";
  }
  if (c.ref === "cart_1g" && NOT_CART.test(`${c.name} ${c.category}`)) return "disposable / pod, not a cartridge";
  if (c.ref === "gummies_100mg" && RATIO.test(c.name)) return "CBD/ratio product";
  return null;
}

export function splitCandidates(all: MenuCandidate[]): { kept: MenuCandidate[]; dropped: Dropped[] } {
  const dropped: Dropped[] = [];
  // One row per (unit, brand, product name) — the canonical key the
  // latest_menu_items view collapses on — keeping the lowest price, so the
  // view can never surface a pricier duplicate.
  const best = new Map<string, MenuCandidate>();
  for (const c of all) {
    const why = rejectReason(c);
    if (why) { dropped.push({ ref: c.ref, name: `${c.brand ? c.brand + " · " : ""}${c.name}`, reason: why }); continue; }
    const k = `${c.ref}|${(c.brand || "unknown").toLowerCase()}|${c.name.toLowerCase().replace(/\s+/g, " ").trim()}`;
    const cur = best.get(k);
    if (!cur || (c.sale ?? c.regular) < (cur.sale ?? cur.regular)) best.set(k, c);
  }
  return { kept: [...best.values()], dropped };
}

/** Out-the-door price in the store's city (lib/taxRates stacking). */
export function otdPrice(pretax: number, ref: RefUnit, city: string): number | null {
  const rates = ratesFor(city);
  if (!rates) return null;
  return Math.round(calculateOutTheDoor(pretax, REF_DEF[ref].taxTier, rates).outTheDoor * 100) / 100;
}

// ---------------------------------------------------------------------------
// Platform readers. Each runs inside the already-loaded store page.
// ---------------------------------------------------------------------------

// `target` is where data calls run: the page itself, or the embedded menu
// frame that made the call we replay (same origin as that call).
type Ctx = { page: Page; target?: Page | Frame; deadline: number; calls: { n: number } };

function left(ctx: Ctx): number {
  return ctx.deadline - Date.now();
}

async function inPageJson(
  ctx: Ctx,
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; credentials?: "include" | "omit" }
): Promise<unknown> {
  const ms = Math.max(1000, Math.min(20_000, left(ctx)));
  if (left(ctx) < 1500) throw new Error("store menu budget used up");
  ctx.calls.n++;
  const res = await Promise.race([
    (ctx.target ?? ctx.page).evaluate(
      async ([u, i, t]) => {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), t as number);
        try {
          const r = await fetch(u as string, { credentials: "include", ...(i as RequestInit), signal: ac.signal });
          return { status: r.status, text: await r.text() };
        } finally {
          clearTimeout(timer);
        }
      },
      [url, init, ms] as const
    ),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`data call timeout ${ms}ms`)), ms + 2000)),
  ]);
  if (res.status !== 200) throw new Error(`data call ${res.status}`);
  return JSON.parse(res.text);
}

// ---- Dutchie ---------------------------------------------------------------

type DutchieProduct = {
  id?: string; _id?: string; Name?: string; brandName?: string; brand?: { name?: string };
  type?: string; subcategory?: string; Options?: string[]; recPrices?: (number | null)[]; recSpecialPrices?: (number | null)[];
  special?: boolean | null; medicalOnly?: boolean | null; THCContent?: { unit?: string; range?: number[] };
  measurements?: { netWeight?: { unit?: string; values?: number[] } };
};

function dutchieCandidates(p: DutchieProduct, ref: RefUnit): MenuCandidate | null {
  if (p.medicalOnly) return null;
  const opts = p.Options || [];
  let idx = -1;
  if (ref === "eighth") idx = opts.findIndex((o) => /^(1\/8\s?oz|3\.5\s?g)$/i.test(String(o).trim()));
  else if (ref === "cart_1g") idx = opts.findIndex((o) => /^1(\.0)?\s?g$/i.test(String(o).trim()));
  else {
    const nw = p.measurements?.netWeight;
    const mg = nw && /MILLIGRAM/i.test(nw.unit || "") && nw.values?.length === 1 ? nw.values[0] : null;
    if (mg !== 100 || opts.length !== 1) return null;
    idx = 0;
  }
  if (idx < 0) return null;
  const regular = num(p.recPrices?.[idx]);
  if (regular == null) return null;
  const sp = p.special ? num(p.recSpecialPrices?.[idx]) : null;
  const thc = p.THCContent?.unit === "PERCENTAGE" && p.THCContent.range?.length ? Math.max(...p.THCContent.range) : null;
  return {
    ref,
    name: String(p.Name || "").trim(),
    brand: p.brandName || p.brand?.name || null,
    category: [p.type, p.subcategory].filter(Boolean).join(" / "),
    weight: ref === "gummies_100mg" ? "100mg" : String(opts[idx]),
    regular,
    sale: sp != null && sp > 0 && sp < regular ? sp : null,
    thc: ref === "gummies_100mg" ? "100mg" : thc != null ? `${thc}%` : null,
    thcPct: ref === "gummies_100mg" ? null : thc,
    productId: p.id || p._id || null,
  };
}

// Filter keys kept when the captured FilteredProducts call was NOT the
// flower-eighths one (a store whose menu page opens on another view): the
// store / pricing identity only. Anything that narrows results (search,
// brand, strain, category) is dropped before the unit queries are set.
const DUTCHIE_IDENTITY_KEYS = new Set(["dispensaryId", "pricingType", "Status", "bypassOnlineThresholds", "isKioskMenu", "removeProductsBelowOptionThresholds", "platformType", "useCache"]);

async function readDutchie(ctx: Ctx, fpUrl: string | null, firstPage: DutchieProduct[] | null, generic = false): Promise<MenuCandidate[]> {
  if (!fpUrl) throw new Error("menu never requested FilteredProducts (menu did not load or layout changed)");
  const out: MenuCandidate[] = [];
  if (!generic) for (const p of firstPage || []) { const c = dutchieCandidates(p, "eighth"); if (c) out.push(c); }
  const base = new URL(fpUrl);
  const vars = JSON.parse(base.searchParams.get("variables") || "{}");
  if (!vars.productsFilter) throw new Error("FilteredProducts variables changed shape");
  if (generic) {
    if (!vars.productsFilter.dispensaryId) throw new Error("FilteredProducts call carries no dispensaryId");
    for (const k of Object.keys(vars.productsFilter)) if (!DUTCHIE_IDENTITY_KEYS.has(k)) delete vars.productsFilter[k];
  }
  const ask = async (filter: Record<string, unknown>, page: number): Promise<{ products: DutchieProduct[]; totalPages: number }> => {
    const v = JSON.parse(JSON.stringify(vars));
    Object.assign(v.productsFilter, filter);
    if (filter.option === undefined) delete v.productsFilter.option;
    v.productsFilter.sortBy = "price";
    v.productsFilter.sortDirection = 1;
    v.page = page;
    v.perPage = 100;
    const u = new URL(base.toString());
    u.searchParams.set("variables", JSON.stringify(v));
    const j = (await inPageJson(ctx, u.toString(), { method: "GET", headers: { "content-type": "application/json" } })) as {
      data?: { filteredProducts?: { products?: DutchieProduct[]; queryInfo?: { totalPages?: number } } };
    };
    const fp = j?.data?.filteredProducts;
    if (!fp) throw new Error("FilteredProducts returned no data");
    return { products: fp.products || [], totalPages: fp.queryInfo?.totalPages || 1 };
  };
  if (generic) {
    for (let page = 0; page < 2; page++) {
      const e = await ask({ types: ["Flower"], option: "1/8oz" }, page);
      for (const p of e.products) { const c = dutchieCandidates(p, "eighth"); if (c) out.push(c); }
      if (page + 1 >= e.totalPages) break;
    }
  } else if ((firstPage || []).length >= 100) {
    // The menu sorts by regular price, so a deep sale can sit past the first
    // 100 — read one more page of eighths when there is one.
    const more = await ask({ option: "1/8oz" }, 1);
    for (const p of more.products) { const c = dutchieCandidates(p, "eighth"); if (c) out.push(c); }
  }
  // Some stores (Ascend) list eighths as "3.5g" rather than "1/8oz".
  if (!out.some((c) => c.ref === "eighth")) {
    for (let page = 0; page < 2; page++) {
      const alt = await ask({ types: ["Flower"], option: "3.5g" }, page);
      for (const p of alt.products) { const c = dutchieCandidates(p, "eighth"); if (c) out.push(c); }
      if (page + 1 >= alt.totalPages) break;
    }
  }
  // Carts: vaporizers / cartridges, 1g option, cheapest first, up to 2 pages.
  for (let page = 0; page < 2; page++) {
    const carts = await ask({ types: ["Vaporizers"], subcategories: ["cartridges"], option: "1g" }, page);
    for (const p of carts.products) { const c = dutchieCandidates(p, "cart_1g"); if (c) out.push(c); }
    if (page + 1 >= carts.totalPages) break;
  }
  // Gummies: sorted cheapest first; 100mg packs sit past the 5–50mg singles,
  // so read up to two pages.
  for (let page = 0; page < 2; page++) {
    const g = await ask({ types: ["Edible"], subcategories: ["gummies"], option: undefined }, page);
    for (const p of g.products) { const c = dutchieCandidates(p, "gummies_100mg"); if (c) out.push(c); }
    if (page + 1 >= g.totalPages) break;
  }
  return out;
}

// ---- Sweed -----------------------------------------------------------------

type SweedVariant = {
  id?: number; name?: string; price?: number; promoPrice?: number | null; unitSize?: { value?: number; unitAbbr?: string };
  unitsInPackage?: number; labTests?: { thc?: { value?: number[]; unitAbbr?: string } };
  promos?: Array<{ isConditional?: boolean | null; isBogo?: boolean | null; isActiveBySchedule?: boolean | null; minCartAmount?: number | null }>;
  saleType?: string;
};
type SweedProduct = { id?: number; name?: string; brand?: { name?: string }; category?: { id?: number; name?: string }; subcategory?: { name?: string }; variants?: SweedVariant[] };

function sweedCandidates(p: SweedProduct, ref: RefUnit): MenuCandidate[] {
  const out: MenuCandidate[] = [];
  const sub = String(p.subcategory?.name || "");
  for (const v of p.variants || []) {
    if (v.saleType && !/both|recreational|adult/i.test(v.saleType)) continue;
    const size = v.unitSize?.value;
    const unit = String(v.unitSize?.unitAbbr || "").toUpperCase();
    const pack = v.unitsInPackage ?? 1;
    const thcVals = v.labTests?.thc?.value || [];
    const thcUnit = String(v.labTests?.thc?.unitAbbr || "");
    if (ref === "eighth" && !(unit === "G" && size === 3.5 && pack === 1)) continue;
    if (ref === "cart_1g" && !(unit === "G" && size === 1 && pack === 1 && /cart/i.test(sub))) continue;
    if (ref === "gummies_100mg") {
      if (!/gumm|chew/i.test(sub)) continue;
      const mg = /mg/i.test(thcUnit) && thcVals.length === 1 ? thcVals[0] : null;
      if (mg !== 100 || !/\b100\s?mg\b/i.test(String(v.name || ""))) continue;
    }
    const regular = num(v.price);
    if (regular == null) continue;
    // Promo price only when every promo on the variant is plain and live:
    // no conditional (cart minimum, loyalty, bundle) and no BOGO.
    const plainPromos = (v.promos || []).length > 0 && (v.promos || []).every((x) => !x.isConditional && !x.isBogo && x.isActiveBySchedule !== false && !x.minCartAmount);
    const promo = num(v.promoPrice);
    const thcPct = /%/.test(thcUnit) && thcVals.length ? Math.max(...thcVals) : null;
    out.push({
      ref,
      name: String(p.name || "").trim(),
      brand: p.brand?.name || null,
      category: [p.category?.name, sub].filter(Boolean).join(" / "),
      weight: String(v.name || `${size}${unit.toLowerCase()}`),
      regular,
      sale: plainPromos && promo != null && promo > 0 && promo < regular ? promo : null,
      thc: thcVals.length ? `${thcVals.join("-")}${/%/.test(thcUnit) ? "%" : thcUnit.toLowerCase()}` : null,
      thcPct: ref === "gummies_100mg" ? null : thcPct,
      productId: v.id != null ? String(v.id) : p.id != null ? String(p.id) : null,
    });
  }
  return out;
}

async function readSweed(ctx: Ctx, storeId: string | null, apiBase: string | null): Promise<MenuCandidate[]> {
  if (!storeId || !apiBase) throw new Error("storefront never sent a storeid (menu did not load)");
  const headers = { "content-type": "application/json", storeid: storeId, ssr: "false" };
  const cats = (await inPageJson(ctx, `${apiBase}Products/GetProductCategoryList`, { method: "POST", headers, body: "{}" })) as Array<{ id: number; name?: string; canonicalName?: string }>;
  if (!Array.isArray(cats)) throw new Error("category list changed shape");
  const find = (re: RegExp) => cats.find((c) => re.test(`${c.canonicalName || ""} ${c.name || ""}`))?.id;
  const plan: Array<[RefUnit, number | undefined]> = [
    ["eighth", find(/^flower\b/i)],
    ["cart_1g", find(/\bvape|vapor/i)],
    ["gummies_100mg", find(/\bedible/i)],
  ];
  const out: MenuCandidate[] = [];
  for (const [ref, catId] of plan) {
    if (!catId) throw new Error(`no ${ref} category on this menu`);
    for (let page = 1; page <= 3; page++) {
      const body = JSON.stringify({ filters: { category: [catId] }, page, pageSize: 100, sortingMethodId: 7, searchTerm: "", platformOs: "web", sourcePage: 0 });
      const j = (await inPageJson(ctx, `${apiBase}Products/GetProductList`, { method: "POST", headers, body })) as { list?: SweedProduct[]; total?: number };
      for (const p of j.list || []) out.push(...sweedCandidates(p, ref));
      if (!j.list || page * 100 >= (j.total || 0)) break;
    }
  }
  return out;
}

// ---- Joint -----------------------------------------------------------------

type JointVariant = { option?: string; price?: string; specialPrice?: string | null; menuType?: string; appliedSpecials?: Array<{ specialType?: string; discountType?: string }> | null };
type JointSource = { jointId?: string; name?: string; brandName?: string; category?: string; subCategory?: string; potencyThcRangeHigh?: string | null; potencyThcUnit?: string | null; variants?: JointVariant[] };

function jointCandidates(s: JointSource, ref: RefUnit): MenuCandidate[] {
  const out: MenuCandidate[] = [];
  const sub = String(s.subCategory || "");
  for (const v of s.variants || []) {
    if (v.menuType !== "RECREATIONAL") continue;
    const opt = String(v.option || "").trim();
    if (ref === "eighth" && !/^3\.5\s?g$/i.test(opt)) continue;
    if (ref === "cart_1g" && !(/^1(\.0)?\s?g$/i.test(opt) && /510|CART/i.test(sub))) continue;
    if (ref === "gummies_100mg" && !(/^100\s?mg$/i.test(opt) && /GUMM|CHEW/i.test(sub))) continue;
    const regular = num(v.price);
    if (regular == null) continue;
    // Only a plain discount counts as today's price — bundles, BOGO and
    // "buy N" specials need more than one item.
    const specials = v.appliedSpecials || [];
    const plain = specials.length > 0 && specials.every((x) => x.specialType === "DISCOUNT");
    const sp = num(v.specialPrice);
    const thcPct = /%/.test(String(s.potencyThcUnit || "")) ? num(s.potencyThcRangeHigh) : null;
    out.push({
      ref,
      name: String(s.name || "").replace(/\s+/g, " ").trim(),
      brand: s.brandName || null,
      category: [s.category, sub].filter(Boolean).join(" / "),
      weight: opt,
      regular,
      sale: plain && sp != null && sp > 0 && sp < regular ? sp : null,
      thc: ref === "gummies_100mg" ? "100mg" : thcPct != null ? `${thcPct}%` : null,
      thcPct: ref === "gummies_100mg" ? null : thcPct,
      productId: s.jointId || null,
    });
  }
  return out;
}

async function readJoint(ctx: Ctx, businessId: string | null): Promise<MenuCandidate[]> {
  if (!businessId) throw new Error("storefront never searched products (menu did not load)");
  const plan: Array<[RefUnit, string]> = [["eighth", "FLOWER"], ["cart_1g", "VAPORIZERS"], ["gummies_100mg", "EDIBLES"]];
  const out: MenuCandidate[] = [];
  for (const [ref, cat] of plan) {
    const q = {
      size: 300,
      from: 0,
      query: { bool: { filter: [
        { bool: { should: [{ term: { businessId } }] } },
        { bool: { should: [{ term: { menuType: "RECREATIONAL" } }] } },
        { bool: { must_not: [{ term: { isDeleted: true } }] } },
      ] } },
      post_filter: { bool: { must: [{ bool: { should: [{ term: { category: cat } }] } }] } },
    };
    const j = (await inPageJson(ctx, "/wp-json/joint-ecommerce/v1/products/ecommerce-production/_search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(q),
    })) as { hits?: { hits?: Array<{ _source?: JointSource }> } };
    if (!j?.hits) throw new Error("product search changed shape");
    for (const h of j.hits.hits || []) if (h._source) out.push(...jointCandidates(h._source, ref));
  }
  return out;
}

// ---- Jane (iHeartJane) via Algolia ------------------------------------------
//
// Record shape: the Jane product record, as captured from nuEra East Peoria's
// menu on 2026-07-09 (reference-data/captures-jul09/jane-1517-flower.json;
// tests/fixtures/jane-algolia-1517-flower.json). Prices live in one field per
// weight (price_eighth_ounce, price_gram, price_each …); a plain product
// special adds special_price_<weight> {price, discount_price, special_id} and
// discounted_price_<weight>. Bundle / cart-total / brand specials (which need
// more than one item or a signed-in segment) are ignored.

export type JaneRecord = {
  objectID?: number | string;
  product_id?: number;
  store_id?: number;
  name?: string;
  brand?: string | null;
  kind?: string;
  kind_subtype?: string | null;
  root_subtype?: string | null;
  custom_product_subtype?: string | null;
  available_weights?: string[];
  store_types?: string[];
  amount?: string | null;
  net_weight_grams?: number | null;
  percent_thc?: number | null;
  inventory_potencies?: Array<{ price_id?: string; thc_potency?: number | null }>;
  applicable_special_ids?: number[];
  [field: string]: unknown;
};

const JANE_WEIGHT_KEY: Record<string, string> = {
  "half gram": "half_gram", gram: "gram", "two gram": "two_gram", "eighth ounce": "eighth_ounce",
  "quarter ounce": "quarter_ounce", "half ounce": "half_ounce", ounce: "ounce", each: "each",
};

function janePrice(r: JaneRecord, key: string): { regular: number; sale: number | null } | null {
  const regular = num(r[`price_${key}`]);
  if (regular == null) return null;
  let sale: number | null = null;
  const sp = r[`special_price_${key}`] as { price?: unknown; discount_price?: unknown; special_id?: unknown } | undefined;
  if (sp && typeof sp === "object") {
    const base = num(sp.price);
    const dp = num(sp.discount_price);
    const shown = num(r[`discounted_price_${key}`]);
    const ids = r.applicable_special_ids || [];
    const idOk = sp.special_id == null || ids.includes(Number(sp.special_id));
    // Every number has to agree: the special's base is today's shelf price,
    // and the menu shows the same discounted price.
    if (dp != null && base != null && Math.abs(base - regular) < 0.01 && idOk && (shown == null || Math.abs(shown - dp) < 0.01) && dp > 0 && dp < regular) sale = dp;
  }
  return { regular, sale };
}

const clean = (x: unknown) => String(x ?? "").replace(/[\u2122\u00ae]/g, "").replace(/\s+/g, " ").trim();

/** One Jane record → candidates for one reference unit (0 or 1). */
export function janeCandidates(r: JaneRecord, ref: RefUnit): MenuCandidate[] {
  if (r.store_types?.length && !r.store_types.some((t) => /rec|adult/i.test(t))) return [];
  const kind = clean(r.kind).toLowerCase();
  const sub = [r.kind_subtype, r.root_subtype, r.custom_product_subtype].map(clean).filter(Boolean).join(" / ");
  const name = clean(r.name);
  const weights = (r.available_weights || []).map((w) => String(w).toLowerCase());
  const amount = clean(r.amount);
  const netG = num(r.net_weight_grams);
  const eachOnly = weights.length === 1 && weights[0] === "each";
  let label: string | null = null;
  if (ref === "eighth") {
    if (kind !== "flower") return [];
    if (weights.includes("eighth ounce")) label = "eighth ounce";
    else if (eachOnly && (netG === 3.5 || /^3\.5\s?g$/i.test(amount))) label = "each";
  } else if (ref === "cart_1g") {
    if (kind !== "vape" || !/cart/i.test(sub)) return [];
    if (weights.includes("gram")) label = "gram";
    else if (eachOnly && (netG === 1 || /^1(?:\.0)?\s?g$/i.test(amount))) label = "each";
  } else {
    if (kind !== "edible" || !/gumm|chew/i.test(`${sub} ${name}`) || !eachOnly) return [];
    // 100mg in total: the listed amount says so, and nothing in the name
    // says otherwise ("10 x 10mg" names that also say 100mg are dropped).
    const inName = [...name.matchAll(/\b(\d+(?:\.\d+)?)\s?mg\b/gi)].map((m) => Number(m[1]));
    const am = amount.match(/^(\d+(?:\.\d+)?)\s?mg$/i);
    if (am ? Number(am[1]) !== 100 || inName.some((n) => n !== 100) : !(inName.length && inName.every((n) => n === 100))) return [];
    label = "each";
  }
  if (!label) return [];
  const key = JANE_WEIGHT_KEY[label];
  const price = janePrice(r, key);
  if (!price) return [];
  const pot = (r.inventory_potencies || []).find((x) => x.price_id === key)?.thc_potency;
  const thcPct = ref === "gummies_100mg" ? null : num(pot) ?? num(r.percent_thc);
  return [{
    ref,
    name,
    brand: clean(r.brand) || null,
    category: [kind, sub].filter(Boolean).join(" / "),
    weight: ref === "gummies_100mg" ? "100mg" : label === "each" ? amount || `${netG}g` : label,
    regular: price.regular,
    sale: price.sale,
    thc: ref === "gummies_100mg" ? "100mg" : thcPct != null ? `${thcPct}%` : null,
    thcPct,
    productId: r.product_id != null ? String(r.product_id) : r.objectID != null ? String(r.objectID) : null,
  }];
}

/** Algolia hits → candidates, keeping only records of the store we asked for. */
export function janeHitsToCandidates(hits: JaneRecord[], storeId: number, ref: RefUnit): MenuCandidate[] {
  return hits.filter((h) => Number(h.store_id) === storeId).flatMap((h) => janeCandidates(h, ref));
}

/** What we need to replay the menu page's own Algolia product search. */
export type AlgoliaHandle = {
  host: string;
  appId: string;
  apiKey: string;
  indexName: string;
  storeIds: number[];
  storeClause: string | null; // the page's own store filter, e.g. "store_id:1517"
  via: "network" | "config";
};

const ALGOLIA_HOST = /(^|\.)(algolia\.net|algolianet\.com|algolia\.io)$/i;
const STORE_CLAUSE = /\bstore_id\s*(?::|=)\s*"?(\d+)"?/g;

/**
 * Read the Algolia app id, public search key, product index and store filter
 * from one request the menu page made. Returns null for anything that is not
 * an Algolia product query with a key (the key must come from the page — it
 * rotates).
 */
export function parseAlgoliaRequest(url: string, headers: Record<string, string>, postData: string | null): AlgoliaHandle | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!ALGOLIA_HOST.test(u.host) || !u.pathname.startsWith("/1/indexes/")) return null;
  const h: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers || {})) h[k.toLowerCase()] = v;
  const apiKey = u.searchParams.get("x-algolia-api-key") || h["x-algolia-api-key"];
  const appId = u.searchParams.get("x-algolia-application-id") || h["x-algolia-application-id"] || u.host.match(/^([a-z0-9]{6,12})(?:-dsn|-\d)?\./i)?.[1]?.toUpperCase();
  if (!apiKey || !appId) return null;
  const queries: Array<{ index: string; filters: string[] }> = [];
  const pathIndex = decodeURIComponent(u.pathname.split("/")[3] || "");
  const fromParams = (params: unknown, extra: Record<string, unknown>) => {
    const f: string[] = [];
    if (typeof params === "string") {
      const sp = new URLSearchParams(params);
      for (const k of ["filters", "facetFilters", "numericFilters"]) { const v = sp.get(k); if (v) f.push(v); }
    }
    for (const k of ["filters", "facetFilters", "numericFilters"]) if (extra[k] != null) f.push(typeof extra[k] === "string" ? (extra[k] as string) : JSON.stringify(extra[k]));
    return f;
  };
  let body: Record<string, unknown> | null = null;
  try { body = postData ? JSON.parse(postData) : null; } catch { body = null; }
  if (body && Array.isArray(body.requests)) {
    for (const r of body.requests as Array<Record<string, unknown>>) queries.push({ index: String(r.indexName || pathIndex), filters: fromParams(r.params, r) });
  } else {
    queries.push({ index: pathIndex, filters: body ? fromParams(body.params, body) : [] });
  }
  // "menu-products-production" — a products index ("stores-production" is not).
  const product = queries.filter((q) => q.index && q.index !== "*" && /(?:^|[-_.])products?(?:[-_.]|$)/i.test(q.index));
  if (!product.length) return null;
  const storeIds = new Set<number>();
  let storeClause: string | null = null;
  for (const q of product) for (const f of q.filters) for (const m of f.matchAll(STORE_CLAUSE)) {
    storeIds.add(Number(m[1]));
    storeClause ??= m[0].replace(/"/g, "");
  }
  return { host: u.host, appId, apiKey, indexName: product[0].index, storeIds: [...storeIds], storeClause, via: "network" };
}

/** Fallback: the page's own config (inline scripts, __NEXT_DATA__, env blobs). */
export function findAlgoliaConfig(text: string): { appId: string; apiKey: string; indexName: string | null } | null {
  const q = `\\\\?["']`; // a quote, possibly JSON-escaped inside a script string
  const key = text.match(new RegExp(`algolia[\\w-]*?(?:search[_-]?)?(?:api)?[_-]?key${q}?\\s*[:=]\\s*${q}([A-Za-z0-9=+/_-]{20,400})${q}`, "i"))?.[1];
  const app = text.match(new RegExp(`algolia[\\w-]*?app(?:lication)?[_-]?id${q}?\\s*[:=]\\s*${q}([A-Za-z0-9]{8,12})${q}`, "i"))?.[1];
  if (!key || !app) return null;
  const index = text.match(new RegExp(`${q}(menu-products-[a-z0-9-]+)${q}`, "i"))?.[1] || null;
  return { appId: app.toUpperCase(), apiKey: key, indexName: index };
}

async function readJane(ctx: Ctx, h: AlgoliaHandle, storeId: number): Promise<MenuCandidate[]> {
  const clause = h.storeClause && new RegExp(`\\b${storeId}\\b`).test(h.storeClause) ? h.storeClause : `store_id:${storeId}`;
  // Key and app id in the query string (as Algolia's own browser client does),
  // so the call needs no CORS preflight; no cookies go to Algolia.
  const url = `https://${h.host}/1/indexes/*/queries?x-algolia-api-key=${encodeURIComponent(h.apiKey)}&x-algolia-application-id=${encodeURIComponent(h.appId)}`;
  const plan: Array<[RefUnit, string]> = [["eighth", "flower"], ["cart_1g", "vape"], ["gummies_100mg", "edible"]];
  const out: MenuCandidate[] = [];
  for (const [ref, kind] of plan) {
    for (let page = 0; page < 3; page++) {
      const params = new URLSearchParams({ query: "", filters: `${clause} AND (kind:"${kind}" OR root_types:"${kind}")`, hitsPerPage: "1000", page: String(page) }).toString();
      const j = (await inPageJson(ctx, url, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: JSON.stringify({ requests: [{ indexName: h.indexName, params }] }),
        credentials: "omit",
      })) as { results?: Array<{ hits?: JaneRecord[]; nbPages?: number }> };
      const r0 = j?.results?.[0];
      if (!r0 || !Array.isArray(r0.hits)) throw new Error("Algolia answer changed shape (no results[0].hits)");
      out.push(...janeHitsToCandidates(r0.hits, storeId, ref));
      if (page + 1 >= (r0.nbPages || 1)) break;
    }
  }
  return out;
}

// ---- Treez / GapCommerce (server-rendered HTML) ----------------------------
//
// No data call to replay: each product is a card in the page's HTML. A card
// is the largest box around ONE product link (…/product/…) that holds no
// other product link, and it is parsed on its own, line by line, so one
// card's price can never be read against the next card's name. The one
// layout seen on Trinity (2026-09-25, "$90 ounces" groups) prints a price as
// "$90" / "/" / "28g" on separate lines; a card may list several sizes.

export type HtmlCard = { href: string; name: string; lines: string[] };

const TREEZ_SIZE: Record<RefUnit, (n: number, u: string) => boolean> = {
  eighth: (n, u) => u === "g" && n === 3.5,
  cart_1g: (n, u) => u === "g" && n === 1,
  gummies_100mg: (n, u) => u === "mg" && n === 100,
};
// "2 for $50", "BOGO", "buy 3", "mix & match", "bundle": needs more than one item.
const CONDITIONAL = /\b\d+\s*(?:for|\/)\s*\$\s?\d|\bbogo\b|\bb\dg\d\b|\bbuy\s+(?:\d|one|two)|\bmix\s*(?:&|and|n)\s*match|\bbundle\b/i;
const NOT_A_NAME = /^(\$|\/$)|^\d+(?:\.\d+)?\s?(?:g|mg|oz)$|^(thc|cbd|tac)\b|^(sale|new|special|staff pick|limited|add to cart|add|sold out|in stock|indica|sativa|hybrid)$/i;

/** One rendered product card → candidates for one reference unit. */
export function htmlCardCandidates(card: HtmlCard, ref: RefUnit, pageCategory: "flower" | "vape" | "edible"): MenuCandidate[] {
  const lines = card.lines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const name = clean(card.name) || lines.find((l) => l.length > 2 && !NOT_A_NAME.test(l)) || "";
  const text = lines.join("\n");
  const want = { eighth: "flower", cart_1g: "vape", gummies_100mg: "edible" }[ref];
  if (pageCategory !== want) return [];
  if (ref === "cart_1g" && !/\b(cart|carts|cartridge|cartridges|510)\b/i.test(`${name}\n${text}`)) return [];
  if (ref === "gummies_100mg" && !/gumm|chew/i.test(`${name}\n${text}`)) return [];
  const conditional = CONDITIONAL.test(text);
  // Price pairs: one or two prices, then "/", then the size.
  const pairs: Array<{ prices: number[]; n: number; u: string }> = [];
  const re = /\$\s?(\d{1,3}(?:\.\d{2})?)\s*(?:\n\s*)?(?:\$\s?(\d{1,3}(?:\.\d{2})?)\s*(?:\n\s*)?)?\/\s*(?:\n\s*)?(\d+(?:\.\d+)?)\s?(g|mg)\b/gi;
  for (const m of text.matchAll(re)) pairs.push({ prices: [m[1], m[2]].filter(Boolean).map(Number), n: Number(m[3]), u: m[4].toLowerCase() });
  let prices: number[] | null = null;
  let weight = "";
  const hit = pairs.filter((p) => TREEZ_SIZE[ref](p.n, p.u));
  if (hit.length > 1) return []; // the same size listed twice: ambiguous
  if (hit.length === 1) {
    prices = hit[0].prices;
    weight = `${hit[0].n}${hit[0].u}`;
  } else if (!pairs.length) {
    // No "$x / size" pair: the size must be in the product name and the card
    // must show exactly one price.
    const all = [...new Set([...text.matchAll(/\$\s?(\d{1,3}(?:\.\d{2})?)\b/g)].map((m) => Number(m[1])))];
    const sizeInName = { eighth: /\b3\.5\s?g\b|\b1\/8\s?(?:oz|ounce)\b/i, cart_1g: /\b1(?:\.0)?\s?g\b/i, gummies_100mg: /\b100\s?mg\b/i }[ref];
    const otherMg = ref === "gummies_100mg" && [...name.matchAll(/\b(\d+(?:\.\d+)?)\s?mg\b/gi)].some((m) => Number(m[1]) !== 100);
    if (all.length !== 1 || !sizeInName.test(name) || otherMg) return [];
    prices = all;
    weight = REF_DEF[ref].size;
  }
  if (!prices?.length) return [];
  const regular = Math.max(...prices);
  const low = Math.min(...prices);
  const sale = !conditional && prices.length === 2 && low < regular ? low : null;
  const thcPct = ref === "gummies_100mg" ? null : num(text.match(/\bTHC\b[^\d\n]{0,6}(\d{1,2}(?:\.\d+)?)\s?%/i)?.[1]);
  return [{
    ref, name, brand: null, category: pageCategory, weight, regular, sale,
    thc: ref === "gummies_100mg" ? "100mg" : thcPct != null ? `${thcPct}%` : null,
    thcPct, productId: card.href || null,
  }];
}

// Category links on the store's menu page, by visible text.
const CATEGORY_LINK: Array<["flower" | "vape" | "edible", RegExp]> = [
  ["flower", /^flower$/i],
  ["vape", /^(vapes?|vaporizers?|vape cartridges|cartridges|carts)$/i],
  ["edible", /^edibles?$/i],
];

async function linksByText(page: Page): Promise<Array<{ text: string; href: string }>> {
  return Promise.race([
    page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]"))
        .filter((a) => (a as HTMLAnchorElement).host === location.host)
        .map((a) => ({ text: ((a as HTMLElement).innerText || a.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim(), href: (a as HTMLAnchorElement).href }))
        .filter((l) => l.text && l.text.length < 60)
    ),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("link scan timeout")), 10_000)),
  ]);
}

async function htmlCards(page: Page): Promise<HtmlCard[]> {
  return Promise.race([
    page.evaluate(() => {
      // (No named helper functions in here: tsx wraps them in __name(), which
      // does not exist inside the browser.)
      const links = Array.from(document.querySelectorAll("a[href]")).filter(
        (a) => (a as HTMLAnchorElement).host === location.host && /\/products?\/[^/]+/.test((a as HTMLAnchorElement).pathname) && !/\/product-groups?\//.test((a as HTMLAnchorElement).pathname)
      ) as HTMLAnchorElement[];
      const productPaths = new Set(links.map((a) => a.pathname));
      const out: Array<{ href: string; name: string; lines: string[] }> = [];
      const done = new Set<string>();
      for (const a of links) {
        if (done.has(a.pathname)) continue;
        let el: Element | null = a;
        let card: Element | null = null;
        for (let d = 0; d < 8 && el && el !== document.body; d++) {
          const paths = new Set(Array.from(el.querySelectorAll("a[href]")).map((x) => (x as HTMLAnchorElement).pathname).filter((p) => productPaths.has(p)));
          if (el !== a && [...paths].some((p) => p !== a.pathname)) break;
          if (/\$\s?\d/.test((el as HTMLElement).innerText || "")) card = el;
          el = el.parentElement;
        }
        if (!card) continue;
        done.add(a.pathname);
        const own = ((a.innerText || "").split("\n").map((x) => x.trim()).filter((x) => x.length > 2 && !/^\$/.test(x))[0]) || a.getAttribute("aria-label") || a.querySelector("img")?.getAttribute("alt") || "";
        out.push({ href: a.pathname, name: own, lines: ((card as HTMLElement).innerText || "").split("\n").map((x) => x.trim()).filter(Boolean) });
      }
      return out.filter((c) => c.lines.length <= 30);
    }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("card scan timeout")), 10_000)),
  ]);
}

async function readTreez(
  ctx: Ctx,
  source: MenuSource,
  opts: { navTimeoutMs: number; passAgeGate: (p: Page) => Promise<boolean>; isAllowed: (url: string) => Promise<boolean>; loads: { n: number } }
): Promise<{ raw: MenuCandidate[]; missing: string[] }> {
  const { page } = ctx;
  const host = new URL(source.url).host;
  const go = async (url: string) => {
    if (left(ctx) < 8000) throw new Error("store menu budget used up");
    if (!(await opts.isAllowed(url))) throw new Error(`robots.txt disallows ${new URL(url).pathname}`);
    opts.loads.n++;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: Math.min(opts.navTimeoutMs, left(ctx) - 3000) });
    if (await opts.passAgeGate(page)) {
      await page.waitForTimeout(1200);
      // The age gate can drop the return path — go back to the page we wanted.
      if (new URL(page.url()).pathname.replace(/\/+$/, "") !== new URL(url).pathname.replace(/\/+$/, "")) {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: Math.min(opts.navTimeoutMs, left(ctx) - 3000) });
      }
    }
    await page.waitForLoadState("networkidle", { timeout: Math.max(1000, Math.min(10_000, left(ctx) - 5000)) }).catch(() => {});
    if (new URL(page.url()).host !== host) throw new Error(`left the store's domain (${new URL(page.url()).host})`);
  };
  // 1. The store's own menu: follow its link from the start page.
  if (source.storeLink) {
    const store = (await linksByText(page)).find((l) => source.storeLink!.test(l.text) && !/\/product/.test(new URL(l.href).pathname));
    if (!store) throw new Error(`no link matching ${source.storeLink} on ${source.url} — store picker changed?`);
    await go(store.href);
  }
  // 2. Make sure the menu is this store's, not the other one's.
  if (source.storeLabel) {
    const top = await Promise.race([
      page.evaluate(() => (document.body?.innerText || "").split("\n").slice(0, 60).join("\n")),
      new Promise<string>((r) => setTimeout(() => r(""), 5000)),
    ]);
    if (!source.storeLabel.test(top)) throw new Error(`menu page does not name the store (${source.storeLabel}) near the top — not read, prices could be another store's`);
    if (source.notLabel?.test(top)) throw new Error(`menu page names both stores near the top — can't tell which store's prices these are, not read`);
  }
  // 3. The category pages the store's menu links to.
  const links = await linksByText(page);
  const plan: Array<[RefUnit, "flower" | "vape" | "edible", string | undefined]> = [];
  for (const [cat, re] of CATEGORY_LINK) {
    const l = links.find((x) => re.test(x.text));
    const ref: RefUnit = cat === "flower" ? "eighth" : cat === "vape" ? "cart_1g" : "gummies_100mg";
    plan.push([ref, cat, l?.href]);
  }
  if (!plan.some((p) => p[2])) throw new Error("no Flower / Vapes / Edibles links on the store's menu page");
  const raw: MenuCandidate[] = [];
  const missing: string[] = [];
  for (const [ref, cat, href] of plan) {
    if (!href) { missing.push(`${cat}: no link`); continue; }
    // One category failing (slow page, budget) keeps what the others read.
    try {
      await go(href);
      // Lazy-loaded grids: scroll a few times (bounded).
      for (let i = 0; i < 4 && left(ctx) > 10_000; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
        await page.waitForTimeout(700);
      }
      const cards = await htmlCards(page);
      if (!cards.length) missing.push(`${cat}: no product cards found`);
      for (const c of cards) raw.push(...htmlCardCandidates(c, ref, cat));
    } catch (e) {
      missing.push(`${cat}: ${(e as Error).message.slice(0, 80)}`);
    }
  }
  return { raw, missing };
}

// ---------------------------------------------------------------------------
// Entry point: load the store's menu page once and read all three units.
// ---------------------------------------------------------------------------

export async function captureStoreMenu(opts: {
  page: Page;
  slug: string;
  source: MenuSource;
  budgetMs: number;
  navTimeoutMs: number;
  passAgeGate: (p: Page) => Promise<boolean>;
  isAllowed: (url: string) => Promise<boolean>;
}): Promise<StoreMenuResult> {
  const { page, slug, source } = opts;
  const t0 = Date.now();
  const ctx: Ctx = { page, deadline: t0 + opts.budgetMs, calls: { n: 0 } };
  const base: Omit<StoreMenuResult, "status" | "items" | "dropped"> = {
    slug, platform: source.platform, pageLoads: 0, dataCalls: 0, durationMs: 0, sourceUrl: source.url,
  };
  const done = (r: Partial<StoreMenuResult> & { status: StoreMenuResult["status"] }): StoreMenuResult => ({
    ...base, items: [], dropped: [], ...r, dataCalls: ctx.calls.n, durationMs: Date.now() - t0,
  });

  if (!(await opts.isAllowed(source.url))) return done({ status: "error", error: "robots.txt disallows the menu page" });

  // Watch the page's own data calls for the handles we replay — for every
  // platform, so a store whose menu moved is reported (or read, via alsoTry)
  // instead of silently coming back empty.
  let dutchieUrl: string | null = null;
  let dutchieAny = null as { url: string; frame: Frame } | null; // any FilteredProducts call (menu opened elsewhere)
  let dutchieFirst: Promise<DutchieProduct[] | null> | null = null;
  let sweedStore: string | null = null;
  let sweedApi: string | null = null; // "https://<store host>/_api/" or the store embed's "…/_api/proxy/"
  let jointBusiness: string | null = null;
  const algolia: AlgoliaHandle[] = [];
  let janeDmerch = false;
  const onRequest = (r: import("playwright-core").Request) => {
    const u = r.url();
    try {
      if (/[?&]operationName=FilteredProducts\b/.test(u)) {
        if (!dutchieUrl && /"option":"1\/8oz"|%22option%22%3A%221%2F8oz%22/.test(u)) dutchieUrl = u;
        if (!dutchieAny) dutchieAny = { url: u, frame: r.frame() };
      } else if (!sweedStore && r.headers()["storeid"] && /^https:\/\/[^/]+\/_api\/(?:proxy\/)?/.test(u)) {
        sweedStore = r.headers()["storeid"];
        sweedApi = u.match(/^(https:\/\/[^/]+\/_api\/(?:proxy\/)?)/)![1];
      } else if (!jointBusiness && /joint-ecommerce\/v1\/products\/[^/]+\/_search/.test(u)) {
        const m = (r.postData() || "").match(/"businessId"\s*:\s*"?(\d+)"?/);
        if (m) jointBusiness = m[1];
      } else if (ALGOLIA_HOST.test(new URL(u).host)) {
        const h = parseAlgoliaRequest(u, r.headers(), r.postData());
        if (h) algolia.push(h);
      } else if (/(^|\.)dmerch\.iheartjane\.com$/.test(new URL(u).host)) {
        janeDmerch = true;
      }
    } catch {
      /* a malformed request never breaks the capture */
    }
  };
  const onResponse = (r: import("playwright-core").Response) => {
    if (!dutchieFirst && dutchieUrl && r.url() === dutchieUrl) {
      dutchieFirst = r.json().then((j) => (j?.data?.filteredProducts?.products as DutchieProduct[]) || null).catch(() => null);
    }
  };
  page.on("request", onRequest);
  page.on("response", onResponse);
  try {
    base.pageLoads = 1;
    await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: opts.navTimeoutMs });
    if (await opts.passAgeGate(page)) await page.waitForTimeout(1200);
    await page.waitForLoadState("networkidle", { timeout: Math.max(1000, Math.min(15_000, left(ctx) - 5000)) }).catch(() => {});
    const title = (await page.title().catch(() => "")).toLowerCase();
    if (/just a moment|attention required|access denied|verify you are human/.test(title)) {
      return done({ status: "error", error: "bot challenge (Cloudflare) — skipped, not solved" });
    }
    // The page we read must be the store's own domain.
    const pageHost = new URL(page.url()).host.replace(/^www\./, "");
    const wantHost = new URL(source.url).host.replace(/^www\./, "");
    if (pageHost !== wantHost) return done({ status: "error", error: `menu redirected off the store's domain (${pageHost})` });

    // Which reader: the expected platform when the page shows its handle,
    // else `alsoTry` when the page shows that one instead.
    const seen: Partial<Record<MenuPlatform, boolean>> = {
      dutchie: !!(dutchieUrl || dutchieAny), sweed: !!sweedStore, joint: !!jointBusiness, jane: algolia.length > 0, treez: true,
    };
    let platform: MenuPlatform = source.platform;
    if (!seen[platform] && source.alsoTry && seen[source.alsoTry]) platform = source.alsoTry;
    base.platform = platform;
    const seenList: string[] = (Object.keys(seen) as MenuPlatform[]).filter((k) => k !== "treez" && seen[k]);
    if (janeDmerch) seenList.push("jane (dmerch only, no Algolia)");
    const notSeen = (what: string) => `${what}; data calls this page did make: ${seenList.length ? seenList.join(", ") : "none of the known menu platforms"}`;

    let raw: MenuCandidate[] = [];
    let missing: string[] = [];
    if (platform === "dutchie") {
      const generic = !dutchieUrl && !!dutchieAny;
      const fpUrl = dutchieUrl ?? dutchieAny?.url ?? null;
      if (!fpUrl) return done({ status: "error", error: notSeen("menu never requested FilteredProducts (menu did not load or layout changed)") });
      const first = !generic && dutchieFirst ? await Promise.race([dutchieFirst, new Promise<null>((r) => setTimeout(() => r(null), 5000))]) : null;
      if (!(await opts.isAllowed(fpUrl))) return done({ status: "error", error: "robots.txt disallows the menu data path" });
      // Replay from the frame that made the call (the page itself, or the
      // store's embedded menu frame) — same origin as the original call.
      const frame = generic ? dutchieAny!.frame : null;
      if (frame && frame !== page.mainFrame()) {
        if (frame.isDetached()) return done({ status: "error", error: "the embedded menu frame went away before it could be read" });
        ctx.target = frame;
      }
      raw = await readDutchie(ctx, fpUrl, first, generic);
    } else if (platform === "sweed") {
      if (sweedApi && !(await opts.isAllowed(`${sweedApi}Products/GetProductList`))) return done({ status: "error", error: "robots.txt disallows the menu data path" });
      raw = await readSweed(ctx, sweedStore, sweedApi);
    } else if (platform === "joint") {
      if (!(await opts.isAllowed(new URL("/wp-json/joint-ecommerce/v1/products/", page.url()).toString()))) return done({ status: "error", error: "robots.txt disallows the menu data path" });
      raw = await readJoint(ctx, jointBusiness);
    } else if (platform === "jane") {
      let handle: AlgoliaHandle | null = null;
      // Prefer a captured call that queried the expected store.
      const want = source.janeStoreId;
      handle = algolia.find((h) => want != null && h.storeIds.includes(want)) || algolia.find((h) => h.storeIds.length) || algolia[0] || null;
      if (!handle) {
        // No Algolia call seen: look for the key in the page's own config.
        const texts: string[] = [];
        for (const f of page.frames()) {
          texts.push(await Promise.race([f.content().catch(() => ""), new Promise<string>((r) => setTimeout(() => r(""), 5000))]));
        }
        const cfg = findAlgoliaConfig(texts.join("\n"));
        if (!cfg) {
          return done({ status: "error", error: notSeen("Jane: no Algolia search key found — the menu page made no Algolia product query and its config names no key (never hard-coded; Jane may have changed how the menu loads)") });
        }
        if (!cfg.indexName) return done({ status: "error", error: "Jane: found an Algolia key in the page config but no menu-products index name" });
        handle = { host: `${cfg.appId.toLowerCase()}-dsn.algolia.net`, appId: cfg.appId, apiKey: cfg.apiKey, indexName: cfg.indexName, storeIds: [], storeClause: null, via: "config" };
      }
      const idsSeen = [...new Set(algolia.flatMap((h) => h.storeIds))];
      const urlId = Number(new URL(page.url()).pathname.match(/\/store\/(\d+)(?:\/|$)/)?.[1]) || null;
      let storeId: number | null = null;
      if (want != null) {
        if (idsSeen.length && !idsSeen.includes(want)) return done({ status: "error", error: `Jane: page queried store ${idsSeen.join("/")}, expected REC store ${want} — not read` });
        storeId = want;
      } else if (idsSeen.length === 1) storeId = idsSeen[0];
      else if (!idsSeen.length && urlId) storeId = urlId;
      else if (idsSeen.length > 1) return done({ status: "error", error: `Jane: page queried several stores (${idsSeen.join(", ")}) — set janeStoreId for this store` });
      if (storeId == null) return done({ status: "error", error: "Jane: no store id in the page's query or URL — set janeStoreId for this store" });
      if (!(await opts.isAllowed(`https://${handle.host}/1/indexes/`))) return done({ status: "error", error: "robots.txt disallows the menu data path" });
      raw = await readJane(ctx, handle, storeId);
    } else {
      const loads = { n: 0 };
      try {
        ({ raw, missing } = await readTreez(ctx, source, { navTimeoutMs: opts.navTimeoutMs, passAgeGate: opts.passAgeGate, isAllowed: opts.isAllowed, loads }));
      } finally {
        base.pageLoads += loads.n;
      }
    }
    const { kept, dropped } = splitCandidates(raw);
    const refsFound = new Set(kept.map((k) => k.ref));
    const status = kept.length === 0 ? "empty" : REF_UNITS.every((r) => refsFound.has(r)) ? "ok" : "partial";
    return done({ status, items: kept, dropped, ...(missing.length && status !== "ok" ? { error: missing.join("; ").slice(0, 200) } : {}) });
  } catch (e) {
    return done({ status: "error", error: (e as Error).message.slice(0, 200) });
  } finally {
    page.off("request", onRequest);
    page.off("response", onResponse);
  }
}

// ---------------------------------------------------------------------------
// Persistence (service key, --apply only). Same tables and write order as
// the pipeline's persist.ts + normalize step.
// ---------------------------------------------------------------------------

type Env = { supabaseUrl: string; serviceKey: string };

async function rest(env: Env, path: string, init: { method: string; body?: unknown; prefer?: string }): Promise<unknown> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    method: init.method,
    headers: {
      apikey: env.serviceKey,
      Authorization: `Bearer ${env.serviceKey}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${init.method} ${path.split("?")[0]} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "_") || "unknown";

/**
 * Find this store's `dispensaries` row (the pipeline's store table), creating
 * it when missing. Match order: master_listing_slug → pipeline slug → the
 * master slug. A found row without master_listing_slug gets it set (the
 * schema's soft join into master_listings).
 */
export async function resolveDispensaryId(
  env: Env,
  listing: { slug: string; name: string; city: string; address?: string | null },
  source: MenuSource
): Promise<string> {
  type D = { id: string; master_listing_slug: string | null };
  const q = (f: string) => rest(env, `dispensaries?select=id,master_listing_slug&${f}&limit=1`, { method: "GET" }) as Promise<D[]>;
  let row = (await q(`master_listing_slug=eq.${encodeURIComponent(listing.slug)}`))[0];
  if (!row) row = (await q(`slug=eq.${encodeURIComponent(source.dispensarySlug || listing.slug)}`))[0];
  if (!row && source.dispensarySlug) row = (await q(`slug=eq.${encodeURIComponent(listing.slug)}`))[0];
  if (row) {
    if (!row.master_listing_slug) {
      await rest(env, `dispensaries?id=eq.${row.id}`, { method: "PATCH", body: { master_listing_slug: listing.slug }, prefer: "return=minimal" });
    }
    return row.id;
  }
  const created = (await rest(env, "dispensaries", {
    method: "POST",
    prefer: "return=representation",
    body: [{
      slug: listing.slug,
      name: listing.name,
      city: listing.city,
      state: "IL",
      address: listing.address || null,
      menu_platform: source.platform,
      menu_url: source.url,
      master_listing_slug: listing.slug,
      is_active: true,
      notes: "created by scripts/scrape-rendered-deals.ts menu phase",
    }],
  })) as D[];
  if (!created?.[0]?.id) throw new Error("dispensaries insert returned no row");
  return created[0].id;
}

export async function persistStoreMenu(
  env: Env,
  listing: { slug: string; name: string; city: string; address?: string | null },
  source: MenuSource,
  result: StoreMenuResult
): Promise<{ snapshotId: string; inserted: number }> {
  // The platform the page actually used (a store can move, see alsoTry).
  const platform = result.platform;
  const enumHint = (e: Error): never => {
    if (/enum menu_platform/i.test(e.message)) {
      throw new Error(`menu_platform has no '${platform}' value yet — apply sql/migrations/2026-09-27-menu-platforms-jane-treez.sql (${e.message.slice(0, 120)})`);
    }
    throw e;
  };
  const dispensaryId = await resolveDispensaryId(env, listing, { ...source, platform }).catch(enumHint);
  // Rows we'd write (need a tax rate for the city — no rate, no row).
  const rows = result.items
    .map((c) => ({ c, pretax: c.sale ?? c.regular }))
    .map((x) => ({ ...x, otd: otdPrice(x.pretax, x.c.ref, listing.city) }))
    .filter((x) => x.otd != null);
  const status = rows.length === 0 && result.status !== "error" ? "empty" : result.status;
  const snap = ((await rest(env, "menu_snapshots", {
    method: "POST",
    prefer: "return=representation",
    body: [{
      dispensary_id: dispensaryId,
      platform,
      status,
      item_count: rows.length,
      duration_ms: result.durationMs,
      error_message: result.error ?? (result.status === "partial" ? "not every reference unit was found on this menu" : null),
      adapter_version: ADAPTER_VERSION[platform],
    }],
  }).catch(enumHint)) as Array<{ id: string; scraped_at: string }>)[0];
  if (!snap?.id) throw new Error("menu_snapshots insert returned no row");
  // Empty / error snapshots are recorded, items are not (never overwrite a good day with a bad one).
  if (status === "error" || rows.length === 0) return { snapshotId: snap.id, inserted: 0 };

  // canonical_products on its unique key (brand, name, unit, pack count).
  const keyOf = (b: string, n: string, u: string) => `${b}::${n}::${u}::1`;
  const products = new Map<string, Record<string, unknown>>();
  for (const { c } of rows) {
    const def = REF_DEF[c.ref];
    const brandId = slugify(c.brand || "unknown");
    const pname = c.name.toLowerCase().replace(/\s+/g, " ").trim();
    products.set(keyOf(brandId, pname, def.canonicalUnit), {
      canonical_brand_id: brandId,
      product_name: pname,
      product_name_display: c.name,
      canonical_category: def.canonicalCategory,
      canonical_unit: def.canonicalUnit,
      unit_count: 1,
      default_thc_tier: def.thcTier,
      last_seen_at: snap.scraped_at,
    });
  }
  const upserted = (await rest(env, "canonical_products?on_conflict=canonical_brand_id,product_name,canonical_unit,unit_count", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: [...products.values()],
  })) as Array<{ id: string; canonical_brand_id: string; product_name: string; canonical_unit: string }>;
  const idByKey = new Map(upserted.map((p) => [keyOf(p.canonical_brand_id, p.product_name, p.canonical_unit), p.id]));

  const items = rows.map(({ c, pretax, otd }) => {
    const def = REF_DEF[c.ref];
    const brandId = slugify(c.brand || "unknown");
    const pname = c.name.toLowerCase().replace(/\s+/g, " ").trim();
    return {
      snapshot_id: snap.id,
      dispensary_id: dispensaryId,
      scraped_at: snap.scraped_at,
      raw_name: c.name,
      raw_brand: c.brand,
      raw_category: c.category,
      raw_weight: c.weight,
      raw_price: c.regular,
      raw_sale_price: c.sale,
      raw_thc: c.thc,
      is_on_sale: c.sale != null,
      raw_payload: {
        puffprice_ref: c.ref,
        listing_slug: listing.slug,
        source_url: result.sourceUrl,
        platform: source.platform,
        platform_product_id: c.productId,
      },
      canonical_product_id: idByKey.get(keyOf(brandId, pname, def.canonicalUnit)) || null,
      canonical_brand_id: brandId,
      canonical_category: def.canonicalCategory,
      canonical_unit: def.canonicalUnit,
      unit_count: 1,
      thc_pct: c.thcPct,
      thc_tier: def.thcTier,
      price_pretax: pretax,
      price_out_the_door: otd,
      match_confidence: 1,
    };
  });
  let inserted = 0;
  for (let i = 0; i < items.length; i += 100) {
    await rest(env, "menu_items", { method: "POST", prefer: "return=minimal", body: items.slice(i, i + 100) });
    inserted += Math.min(100, items.length - i);
  }
  return { snapshotId: snap.id, inserted };
}
