// lib/scraper/menu/adapters/jane.ts
// =============================================================================
// Jane (iHeartJane) menu adapter.
//
// Covers the four Jane-platform Central IL stores:
//   * nuEra East Peoria  (storeId 1517)
//   * nuEra Pekin        (storeId 3050)
//   * Beyond Hello Peoria(storeId 6926)
//   * Beyond Hello Bloomington (storeId VERIFY -- Phase 9 backfill)
//
// API
//   Public Algolia search index `menu-products-production`, app ID
//   `VFM4X0N23A`. POST a JSON query body filtered by store_id and
//   (optionally) product_type. The Algolia search-only API key is
//   embedded in Jane's JS bundle and can be rotated without notice --
//   keep it as a single config value, fail LOUD on auth error.
//
// Beyond Hello note: BH renders its menu in Shadow DOM. DO NOT scrape
// the page. Hit Algolia directly with the storeId from the registry.
//
// Pagination
//   Algolia paginates by `page` (0-indexed) and `hitsPerPage`. We loop
//   until either `nbHits <= (page+1)*hitsPerPage` or a safety cap.
//
// Output
//   RawMenuItem[] with raw_* fields populated. Normalization happens in
//   Phase 5 against the persisted rows -- this file is RAW only.
// =============================================================================

import type { Adapter, AdapterOpts, FetchResult, RawMenuItem, StoreRef } from "../types";
import { AdapterAuthError, AdapterSchemaError } from "../types";

const ADAPTER_VERSION = "jane@1.0.0";

const JANE_ALGOLIA_APP_ID = "VFM4X0N23A";
const JANE_ALGOLIA_INDEX = "menu-products-production";
// Search-only key from Jane's public storefront bundle (2026-06-04).
// Rotatable; override via JANE_ALGOLIA_KEY env or opts.apiKey.
const JANE_ALGOLIA_DEFAULT_KEY = "f9b53d83d1e96b97c4f80ab1ac6cdbfb";

const HITS_PER_PAGE = 100;
const MAX_PAGES = 30; // 3000 SKUs safety cap; biggest IL menu is ~600 items

// Categories the IL adult-use menu surfaces. Anything else falls through
// to raw_category and is handled in Phase 5.
const VALID_PRODUCT_TYPES = [
  "flower",
  "pre-rolls",
  "vape",
  "cartridges",
  "extracts",
  "concentrate",
  "edible",
  "edibles",
  "tincture",
  "topical",
  "accessories",
  "gear",
  "merch",
];

interface AlgoliaHit {
  objectID?: string;
  product_id?: number | string;
  name?: string;
  brand?: string;
  brand_subtype?: string;
  kind?: string;            // "flower" | "vape" | etc -- Jane's category
  category?: string;
  root_subtype?: string;    // sub-kind
  product_type?: string;
  amount?: string;          // "3.5g", "1g", "100mg"...
  unit?: string;            // "g", "mg"...
  has_brand_discount?: boolean;
  // Pricing: Jane stores per-bucket prices and discounted prices in
  // a fan of fields. We coalesce these into raw_price / raw_sale_price.
  price?: number;
  bucket_price?: number;
  price_each?: number;
  price_eighth_ounce?: number;
  price_quarter_ounce?: number;
  price_half_ounce?: number;
  price_ounce?: number;
  price_two_grams?: number;
  discounted_price?: number;
  discounted_bucket_price?: number;
  discounted_price_each?: number;
  discounted_price_eighth_ounce?: number;
  discounted_price_quarter_ounce?: number;
  discounted_price_half_ounce?: number;
  discounted_price_ounce?: number;
  // THC: usually a single number; sometimes range as min/max
  percent_thc?: number;
  percent_thca?: number;
  percent_cbd?: number;
  thc_potency?: number;
  thc_low?: number;
  thc_high?: number;
  store_id?: number | string;
  store_notes?: string;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

function endpoint(): string {
  return `https://${JANE_ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/${JANE_ALGOLIA_INDEX}/query`;
}

function buildBody(storeId: string, page: number): unknown {
  // store_id is a numeric column in Jane's Algolia index. Filter syntax
  // accepts either `store_id = N` or `store_id:N`. Use the canonical
  // numericFilters slot for safety.
  return {
    query: "",
    page,
    hitsPerPage: HITS_PER_PAGE,
    facetFilters: [
      VALID_PRODUCT_TYPES.map((t) => `kind:${t}`),
    ],
    numericFilters: [`store_id=${Number(storeId)}`],
    attributesToRetrieve: ["*"],
  };
}

async function queryPage(
  apiKey: string,
  storeId: string,
  page: number
): Promise<AlgoliaResponse> {
  const url = `${endpoint()}?x-algolia-application-id=${JANE_ALGOLIA_APP_ID}&x-algolia-api-key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(buildBody(storeId, page)),
  });
  if (res.status === 401 || res.status === 403) {
    throw new AdapterAuthError(
      `Jane Algolia auth failed (${res.status}) for store ${storeId} -- key likely rotated. Set JANE_ALGOLIA_KEY.`
    );
  }
  if (!res.ok) {
    throw new AdapterSchemaError(
      `Jane Algolia ${res.status}: ${await res.text().catch(() => "(no body)")}`
    );
  }
  const json = (await res.json()) as AlgoliaResponse;
  if (!Array.isArray(json.hits) || typeof json.nbHits !== "number") {
    throw new AdapterSchemaError(`Jane Algolia returned unexpected shape: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json;
}

/** Coalesce Jane's per-bucket prices into a single (price, weight) tuple.
 *  Jane lists a flower SKU once but exposes price_eighth/quarter/half/ounce
 *  on the same hit -- we expand into multiple raw rows so each weight
 *  shows up as its own observation, matching how the customer shops.
 *
 *  Non-flower SKUs use the simple price / bucket_price fields. */
function expandHit(hit: AlgoliaHit): RawMenuItem[] {
  const baseName = hit.name?.trim() || "(unnamed)";
  const brand = hit.brand?.trim() || null;
  const category = (hit.kind || hit.category || hit.product_type || null) || null;
  const isFlower = (category || "").toLowerCase().startsWith("flower");
  const isPreroll = (category || "").toLowerCase().includes("pre-roll");
  const thcStr = thcDisplay(hit);

  // Flower with bucket pricing -> one raw row per bucket.
  if (isFlower) {
    const out: RawMenuItem[] = [];
    const buckets: Array<{ weight: string; list?: number; sale?: number }> = [
      { weight: "1g",  list: hit.price ?? hit.bucket_price ?? hit.price_each, sale: hit.discounted_price ?? hit.discounted_bucket_price ?? hit.discounted_price_each },
      { weight: "3.5g", list: hit.price_eighth_ounce,   sale: hit.discounted_price_eighth_ounce },
      { weight: "7g",   list: hit.price_quarter_ounce,  sale: hit.discounted_price_quarter_ounce },
      { weight: "14g",  list: hit.price_half_ounce,     sale: hit.discounted_price_half_ounce },
      { weight: "28g",  list: hit.price_ounce,          sale: hit.discounted_price_ounce },
    ];
    for (const b of buckets) {
      if (b.list && b.list > 0) {
        out.push(rawRow({
          name: baseName,
          brand,
          category,
          weight: b.weight,
          price: b.list,
          sale: b.sale ?? null,
          thc: thcStr,
          payload: hit,
        }));
      }
    }
    if (out.length > 0) return out;
  }

  // Non-flower or flower-without-bucket: single row.
  const list = hit.price ?? hit.bucket_price ?? hit.price_each;
  const sale = hit.discounted_price ?? hit.discounted_bucket_price ?? hit.discounted_price_each;
  if (!list || list <= 0) return []; // can't observe a price -> skip silently
  const weight = isPreroll
    ? (hit.amount || null)
    : (hit.amount || null);
  return [rawRow({
    name: baseName,
    brand,
    category,
    weight,
    price: list,
    sale: sale ?? null,
    thc: thcStr,
    payload: hit,
  })];
}

function thcDisplay(hit: AlgoliaHit): string | null {
  if (hit.thc_low != null && hit.thc_high != null) {
    return `${hit.thc_low}%-${hit.thc_high}%`;
  }
  const total = hit.percent_thc ?? hit.thc_potency;
  if (total != null) return `${total}%`;
  if (hit.percent_thca != null) return `THCa ${hit.percent_thca}%`;
  return null;
}

function rawRow(args: {
  name: string;
  brand: string | null;
  category: string | null;
  weight: string | null;
  price: number;
  sale: number | null;
  thc: string | null;
  payload: unknown;
}): RawMenuItem {
  const onSale = args.sale != null && args.sale > 0 && args.sale < args.price;
  return {
    raw_name: args.name,
    raw_brand: args.brand,
    raw_category: args.category,
    raw_weight: args.weight,
    raw_price: args.price,
    raw_sale_price: onSale ? args.sale : null,
    raw_thc: args.thc,
    is_on_sale: onSale,
    raw_payload: args.payload,
  };
}

export const janeAdapter: Adapter = {
  platform: "jane",
  async fetch(store: StoreRef, opts: AdapterOpts = {}): Promise<FetchResult> {
    const start = Date.now();

    if (store.platform !== "jane") {
      return {
        status: "error",
        platform: "jane",
        items: [],
        duration_ms: 0,
        error: `Adapter mismatch: store ${store.slug} has platform ${store.platform}`,
        adapter_version: ADAPTER_VERSION,
      };
    }
    if (store.platform_store_id.startsWith("VERIFY")) {
      return {
        status: "error",
        platform: "jane",
        items: [],
        duration_ms: 0,
        error: `${store.slug} has unverified platform_store_id; skipping`,
        adapter_version: ADAPTER_VERSION,
      };
    }

    // Fixture mode for offline tests.
    if (opts.fixtureLoader) {
      try {
        const fixture = (await opts.fixtureLoader(`jane-${store.platform_store_id}.json`)) as AlgoliaResponse;
        const items = fixture.hits.flatMap(expandHit);
        return {
          status: items.length > 0 ? "ok" : "empty",
          platform: "jane",
          items,
          duration_ms: Date.now() - start,
          adapter_version: ADAPTER_VERSION,
        };
      } catch (err) {
        return {
          status: "error",
          platform: "jane",
          items: [],
          duration_ms: Date.now() - start,
          error: `fixture load: ${(err as Error).message}`,
          adapter_version: ADAPTER_VERSION,
        };
      }
    }

    const apiKey = opts.apiKey || process.env.JANE_ALGOLIA_KEY || JANE_ALGOLIA_DEFAULT_KEY;

    const all: RawMenuItem[] = [];
    let page = 0;
    let nbPages = 1;
    let totalHits = 0;

    while (page < Math.min(nbPages, MAX_PAGES)) {
      const resp = await queryPage(apiKey, store.platform_store_id, page);
      totalHits = resp.nbHits;
      nbPages = resp.nbPages;
      for (const hit of resp.hits) {
        all.push(...expandHit(hit));
      }
      page++;
      // Polite delay between pages.
      if (page < nbPages) await new Promise((r) => setTimeout(r, 400));
    }

    const status = all.length === 0 ? "empty" : "ok";
    const duration_ms = Date.now() - start;

    return {
      status,
      platform: "jane",
      items: all,
      duration_ms,
      adapter_version: ADAPTER_VERSION,
      error: totalHits === 0 ? `Jane returned 0 hits for store ${store.platform_store_id}` : undefined,
    };
  },
};

export const __testing = { expandHit, buildBody, ADAPTER_VERSION };
