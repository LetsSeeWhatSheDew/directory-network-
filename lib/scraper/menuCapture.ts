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

import type { Page } from "playwright-core";
import { REF_DEF, REF_UNITS, type RefUnit } from "../menuPrices";
import { calculateOutTheDoor } from "../taxRates";
import { ratesFor } from "../otd";

export type MenuPlatform = "dutchie" | "sweed" | "joint";

export type MenuSource = {
  platform: MenuPlatform;
  /** The one page we load — the store's own menu, on its own domain. */
  url: string;
  /** dispensaries.slug when the pipeline seeded this store under a different
   *  slug than master_listings (reference-data/dispensary_registry.json). */
  dispensarySlug?: string;
};

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
};

// Central IL stores with no menu reader yet, and why (checked 2026-09-25 from a
// cloud browser; see docs/ops/2026-09-25-menu-prices-dryrun.log). Printed on every run
// so the gap stays visible. Move a store into MENU_SOURCES once it reads clean.
export const MENU_NOT_COVERED: Record<string, string> = {
  "cloud-9-east-peoria": "Cresco/Sunnyside storefront: its inventory call (api.crescolabs.com) returned 0 products for store 974 from the cloud; not parsed until a Mac run shows real rows",
  "sunnyside-champaign": "Cresco/Sunnyside storefront: inventory call returned 0 products from the cloud (same as Cloud 9)",
  "shangri-la-springfield": "Cresco/Sunnyside storefront: inventory call returned 0 products for store 970 from the cloud",
  "nuera-east-peoria": "Jane headless menu (nueracannabis.com/shop): product data comes from iheartjane, which answered 403 from the cloud; no reader yet",
  "nuera-champaign": "Jane headless menu, same as nuEra East Peoria",
  "nuera-pekin": "Jane headless menu, same as nuEra East Peoria",
  "nuera-urbana": "Jane headless menu, same as nuEra East Peoria",
  "high-haven-normal": "Jane embed on highhavencannabis.com; no product data call seen from the cloud",
  "beyond-hello-bloomington": "Jane (per the pipeline registry); the registry's menu URL is now a 404 — needs a new menu URL",
  "beyond-hello-normal": "Jane (per the pipeline registry); menu URL not re-found",
  "beyond-hello-peoria": "Bloom Wellness on risecannabis.com — Cloudflare Turnstile blocks the cloud",
  "ayr-wellness-normal": "Bloom Wellness on risecannabis.com — Cloudflare Turnstile blocks the cloud",
  "revolution-dispensary-normal": "Bloom Wellness on risecannabis.com — Cloudflare Turnstile blocks the cloud",
  "trinity-on-glen": "Treez/GapCommerce Next.js storefront: prices are server-rendered HTML only, no reader yet",
  "trinity-on-university": "Treez/GapCommerce Next.js storefront, same as Trinity on Glen",
  "share-springfield": "LeafBridge (WordPress admin-ajax) menu, no reader yet",
  "the-dispensary-champaign": "no store website of its own (see docs/ops/2026-09-25-scraper-coverage.md)",
};

export const ADAPTER_VERSION: Record<MenuPlatform, string> = {
  dutchie: "rendered-dutchie@1.0.0",
  sweed: "rendered-sweed@1.0.0",
  joint: "rendered-joint@1.0.0",
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

type Ctx = { page: Page; deadline: number; calls: { n: number } };

function left(ctx: Ctx): number {
  return ctx.deadline - Date.now();
}

async function inPageJson(ctx: Ctx, url: string, init: { method: string; headers: Record<string, string>; body?: string }): Promise<unknown> {
  const ms = Math.max(1000, Math.min(20_000, left(ctx)));
  if (left(ctx) < 1500) throw new Error("store menu budget used up");
  ctx.calls.n++;
  const res = await Promise.race([
    ctx.page.evaluate(
      async ([u, i, t]) => {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), t as number);
        try {
          const r = await fetch(u as string, { ...(i as RequestInit), credentials: "include", signal: ac.signal });
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

async function readDutchie(ctx: Ctx, fpUrl: string | null, firstPage: DutchieProduct[] | null): Promise<MenuCandidate[]> {
  if (!fpUrl) throw new Error("menu never requested FilteredProducts (menu did not load or layout changed)");
  const out: MenuCandidate[] = [];
  for (const p of firstPage || []) { const c = dutchieCandidates(p, "eighth"); if (c) out.push(c); }
  const base = new URL(fpUrl);
  const vars = JSON.parse(base.searchParams.get("variables") || "{}");
  if (!vars.productsFilter) throw new Error("FilteredProducts variables changed shape");
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
  // The menu sorts by regular price, so a deep sale can sit past the first
  // 100 — read one more page of eighths when there is one.
  if ((firstPage || []).length >= 100) {
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

  // Watch the page's own data calls for the handles we replay.
  let dutchieUrl: string | null = null;
  let dutchieFirst: Promise<DutchieProduct[] | null> | null = null;
  let sweedStore: string | null = null;
  let sweedApi: string | null = null; // "https://<store host>/_api/" or the store embed's "…/_api/proxy/"
  let jointBusiness: string | null = null;
  const onRequest = (r: import("playwright-core").Request) => {
    const u = r.url();
    if (source.platform === "dutchie" && !dutchieUrl && /[?&]operationName=FilteredProducts\b/.test(u) && /"option":"1\/8oz"|%22option%22%3A%221%2F8oz%22/.test(u)) {
      dutchieUrl = u;
    } else if (source.platform === "sweed" && !sweedStore) {
      const s = r.headers()["storeid"];
      const m = u.match(/^(https:\/\/[^/]+\/_api\/(?:proxy\/)?)/);
      if (s && m) { sweedStore = s; sweedApi = m[1]; }
    } else if (source.platform === "joint" && !jointBusiness && /joint-ecommerce\/v1\/products\/[^/]+\/_search/.test(u)) {
      const m = (r.postData() || "").match(/"businessId"\s*:\s*"?(\d+)"?/);
      if (m) jointBusiness = m[1];
    }
  };
  const onResponse = (r: import("playwright-core").Response) => {
    if (source.platform === "dutchie" && !dutchieFirst && dutchieUrl && r.url() === dutchieUrl) {
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
    // The data-call origin must be the store's own domain.
    const pageHost = new URL(page.url()).host.replace(/^www\./, "");
    const wantHost = new URL(source.url).host.replace(/^www\./, "");
    if (pageHost !== wantHost) return done({ status: "error", error: `menu redirected off the store's domain (${pageHost})` });

    let raw: MenuCandidate[] = [];
    if (source.platform === "dutchie") {
      const first = dutchieFirst ? await Promise.race([dutchieFirst, new Promise<null>((r) => setTimeout(() => r(null), 5000))]) : null;
      const apiUrl = dutchieUrl ? new URL(dutchieUrl as string) : null;
      if (apiUrl && !(await opts.isAllowed(apiUrl.toString()))) return done({ status: "error", error: "robots.txt disallows the menu data path" });
      raw = await readDutchie(ctx, dutchieUrl, first);
    } else if (source.platform === "sweed") {
      if (sweedApi && !(await opts.isAllowed(`${sweedApi}Products/GetProductList`))) return done({ status: "error", error: "robots.txt disallows the menu data path" });
      raw = await readSweed(ctx, sweedStore, sweedApi);
    } else {
      if (!(await opts.isAllowed(new URL("/wp-json/joint-ecommerce/v1/products/", page.url()).toString()))) return done({ status: "error", error: "robots.txt disallows the menu data path" });
      raw = await readJoint(ctx, jointBusiness);
    }
    const { kept, dropped } = splitCandidates(raw);
    const refsFound = new Set(kept.map((k) => k.ref));
    const status = kept.length === 0 ? "empty" : REF_UNITS.every((r) => refsFound.has(r)) ? "ok" : "partial";
    return done({ status, items: kept, dropped });
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
  const dispensaryId = await resolveDispensaryId(env, listing, source);
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
      platform: source.platform,
      status,
      item_count: rows.length,
      duration_ms: result.durationMs,
      error_message: result.error ?? (result.status === "partial" ? "not every reference unit was found on this menu" : null),
      adapter_version: ADAPTER_VERSION[source.platform],
    }],
  })) as Array<{ id: string; scraped_at: string }>)[0];
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
