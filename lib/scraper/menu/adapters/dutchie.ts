// lib/scraper/menu/adapters/dutchie.ts
// =============================================================================
// Dutchie menu adapter — reconciled to live api-4 + persisted queries
// (Chrome Round 2 recon, 2026-06-04).
//
// Coverage
//   * NOXX East Peoria          dispensaryId 65772a69ac53410009424572
//   * Trinity Peoria University slug trinity-compassionate-care-rec
//   * Trinity Peoria Glen       dispensaryId 5f1084a105efe300b6392001
//
// API
//   GET https://dutchie.com/api-4/graphql
//     ?operationName=FilteredProducts
//     &variables=<URL-encoded JSON>
//     &extensions=<URL-encoded JSON containing persistedQuery.sha256Hash>
//
//   The variables payload includes dispensaryId, pricingType:"rec",
//   page (0-based), perPage (≤50), sortBy:"popularSortIdx", useCache:true.
//
//   Pagination: filteredProducts.paginate.{total, perPage, page}.
//
//   Persisted-query hash CAN rotate without notice. We send the hash and
//   the full inline query on every request (Apollo's Automatic Persisted
//   Queries handshake). If the server signals PERSISTED_QUERY_NOT_FOUND,
//   the inline query is consumed and the server learns the new hash --
//   subsequent calls are cache hits. Allows operator to leave hash blank
//   on first run; adapter recovers.
//
// Per-store fixture filename used by tests / offline runs:
//   tests/fixtures/menu/dutchie-<platform_store_id>.json
// =============================================================================

import type { Adapter, AdapterOpts, FetchResult, RawMenuItem, StoreRef } from "../types";
import { AdapterAuthError, AdapterSchemaError } from "../types";

const ADAPTER_VERSION = "dutchie@2.0.0";
const ENDPOINT = "https://dutchie.com/api-4/graphql";
const PER_PAGE = 50;          // Dutchie api-4 caps at 50 per request
const MAX_PAGES = 30;

// Operator may override via env when Dutchie rotates the hash.
// Empty string is fine: the inline query travels with every request and
// teaches the server on the first call (Apollo APQ).
const DEFAULT_QUERY_HASH = process.env.DUTCHIE_QUERY_HASH || "";

const FILTERED_PRODUCTS_QUERY = `
  query FilteredProducts($filter: ProductFilter) {
    filteredProducts(filter: $filter) {
      paginate { total perPage page }
      products {
        id
        name
        type
        strainType
        brand { name }
        brandName
        Options
        Prices
        recPrices
        recSpecialPrices
        POSMetaData {
          children {
            option
            priceRec
            specialPriceRec
            priceMed
            specialPriceMed
          }
        }
        potencyThc { formatted range unit }
        potencyCbd { formatted range unit }
        special
      }
    }
  }
`;

interface DutchiePotency {
  formatted?: string;
  range?: number[];
  unit?: string;
}

interface DutchieChildOption {
  option?: string;
  priceRec?: number;
  specialPriceRec?: number;
  priceMed?: number;
  specialPriceMed?: number;
}

interface DutchieProduct {
  id?: string;
  name?: string;
  type?: string;
  strainType?: string;
  brand?: { name?: string } | null;
  brandName?: string;
  Options?: string[];
  Prices?: number[];
  recPrices?: number[];
  recSpecialPrices?: number[];
  POSMetaData?: { children?: DutchieChildOption[] } | null;
  potencyThc?: DutchiePotency;
  potencyCbd?: DutchiePotency;
  special?: boolean;
}

interface DutchieResponse {
  data?: {
    filteredProducts?: {
      paginate?: { total?: number; perPage?: number; page?: number };
      products?: DutchieProduct[];
    } | null;
  };
  errors?: Array<{
    message: string;
    extensions?: { code?: string };
  }>;
}

function buildVariables(store: StoreRef, page: number): Record<string, unknown> {
  // Dutchie's ProductFilter accepts EITHER dispensaryId (Mongo ObjectId-
  // shaped 24-char hex) OR cName (the storefront slug). Both Trinity
  // stores have an id; older slug-only entries fall back to cName.
  const ref = store.platform_store_id;
  const isObjectId = /^[0-9a-f]{24}$/i.test(ref);
  const filter: Record<string, unknown> = {
    menuType: "Rec",
    page,
    perPage: PER_PAGE,
    sortBy: "popularSortIdx",
    sortDirection: -1,
    productsOnSpecial: false,
    bypassKioskMenu: false,
    bypassOnlineThresholds: false,
    isKioskMenu: false,
    pricingType: "rec",
    useCache: true,
  };
  if (isObjectId) {
    filter.dispensaryId = ref;
  } else {
    filter.cName = ref;
  }
  return { filter };
}

function buildUrl(store: StoreRef, page: number, hash: string): string {
  const variables = encodeURIComponent(JSON.stringify(buildVariables(store, page)));
  const extensions = encodeURIComponent(
    JSON.stringify({
      persistedQuery: { version: 1, sha256Hash: hash },
    })
  );
  const endpoint = store.graphql_endpoint || ENDPOINT;
  return `${endpoint}?operationName=FilteredProducts&variables=${variables}&extensions=${extensions}`;
}

async function queryPage(
  store: StoreRef,
  page: number,
  hash: string
): Promise<DutchieResponse> {
  // First attempt: GET with persisted-query hash (cheap).
  const getUrl = buildUrl(store, page, hash);
  const getRes = await fetch(getUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)",
    },
  });

  if (getRes.status === 401 || getRes.status === 403) {
    throw new AdapterAuthError(`Dutchie api-4 GET auth ${getRes.status} for ${store.slug}`);
  }

  if (getRes.ok) {
    const body = (await getRes.json()) as DutchieResponse;
    if (!isPersistedQueryMiss(body)) return ensureValid(body, store);
    // Fall through to POST below if PERSISTED_QUERY_NOT_FOUND.
  } else if (getRes.status !== 400 && getRes.status !== 404) {
    // Unexpected status that's not the typical APQ-miss signal.
    throw new AdapterSchemaError(
      `Dutchie api-4 GET ${getRes.status}: ${await getRes.text().catch(() => "(no body)")}`
    );
  }

  // Second attempt: POST with full query body + extensions. Server
  // consumes the inline query, registers the hash for future GETs.
  const endpoint = store.graphql_endpoint || ENDPOINT;
  const postRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)",
    },
    body: JSON.stringify({
      operationName: "FilteredProducts",
      query: FILTERED_PRODUCTS_QUERY,
      variables: buildVariables(store, page),
      extensions: { persistedQuery: { version: 1, sha256Hash: hash } },
    }),
  });
  if (postRes.status === 401 || postRes.status === 403) {
    throw new AdapterAuthError(`Dutchie api-4 POST auth ${postRes.status} for ${store.slug}`);
  }
  if (!postRes.ok) {
    throw new AdapterSchemaError(
      `Dutchie api-4 POST ${postRes.status}: ${await postRes.text().catch(() => "(no body)")}`
    );
  }
  const postBody = (await postRes.json()) as DutchieResponse;
  return ensureValid(postBody, store);
}

function isPersistedQueryMiss(body: DutchieResponse): boolean {
  if (!body.errors) return false;
  return body.errors.some(
    (e) =>
      e?.extensions?.code === "PERSISTED_QUERY_NOT_FOUND" ||
      /persisted.?query/i.test(e.message)
  );
}

function ensureValid(body: DutchieResponse, store: StoreRef): DutchieResponse {
  if (body.errors && body.errors.length > 0 && !isPersistedQueryMiss(body)) {
    throw new AdapterSchemaError(
      `Dutchie GraphQL errors at ${store.slug}: ${body.errors.map((e) => e.message).join("; ")}`
    );
  }
  if (!body.data || !body.data.filteredProducts) {
    throw new AdapterSchemaError(
      `Dutchie response missing data.filteredProducts at ${store.slug}: ${JSON.stringify(body).slice(0, 200)}`
    );
  }
  return body;
}

function thcDisplay(p?: DutchiePotency): string | null {
  if (!p) return null;
  if (p.formatted) return p.formatted;
  if (p.range && p.range.length === 2) {
    const unit = p.unit || "%";
    return `${p.range[0]}${unit}-${p.range[1]}${unit}`;
  }
  return null;
}

function expandProduct(prod: DutchieProduct): RawMenuItem[] {
  const brand = prod.brand?.name || prod.brandName || null;
  const category = (prod.type || prod.strainType || null) || null;
  const thc = thcDisplay(prod.potencyThc);

  const children = prod.POSMetaData?.children?.filter((c) => c.option) ?? [];
  if (children.length > 0) {
    const out: RawMenuItem[] = [];
    for (const c of children) {
      const list = c.priceRec ?? c.priceMed;
      const sale = c.specialPriceRec ?? c.specialPriceMed;
      if (!list || list <= 0) continue;
      const onSale = sale != null && sale > 0 && sale < list;
      out.push({
        raw_name: prod.name?.trim() || "(unnamed)",
        raw_brand: brand,
        raw_category: category,
        raw_weight: c.option!.trim(),
        raw_price: list,
        raw_sale_price: onSale ? sale! : null,
        raw_thc: thc,
        is_on_sale: onSale,
        raw_payload: { product: prod, child: c },
      });
    }
    if (out.length > 0) return out;
  }

  // Fallback path: Options[] + recPrices[] + recSpecialPrices[].
  const options = prod.Options ?? [];
  const prices = prod.recPrices ?? prod.Prices ?? [];
  const specials = prod.recSpecialPrices ?? [];
  if (options.length > 0 && prices.length > 0) {
    const out: RawMenuItem[] = [];
    const len = Math.min(options.length, prices.length);
    for (let i = 0; i < len; i++) {
      const list = prices[i];
      const sale = specials[i];
      if (!list || list <= 0) continue;
      const onSale = sale != null && sale > 0 && sale < list;
      out.push({
        raw_name: prod.name?.trim() || "(unnamed)",
        raw_brand: brand,
        raw_category: category,
        raw_weight: options[i]?.trim() || null,
        raw_price: list,
        raw_sale_price: onSale ? sale : null,
        raw_thc: thc,
        is_on_sale: onSale,
        raw_payload: prod,
      });
    }
    if (out.length > 0) return out;
  }

  return [];
}

export const dutchieAdapter: Adapter = {
  platform: "dutchie",
  async fetch(store: StoreRef, opts: AdapterOpts = {}): Promise<FetchResult> {
    const start = Date.now();
    if (store.platform !== "dutchie") {
      return {
        status: "error",
        platform: "dutchie",
        items: [],
        duration_ms: 0,
        error: `Adapter mismatch: ${store.slug} platform=${store.platform}`,
        adapter_version: ADAPTER_VERSION,
      };
    }
    if (store.platform_store_id.startsWith("VERIFY")) {
      return {
        status: "error",
        platform: "dutchie",
        items: [],
        duration_ms: 0,
        error: `${store.slug} has unverified platform_store_id; skipping`,
        adapter_version: ADAPTER_VERSION,
      };
    }

    if (opts.fixtureLoader) {
      try {
        const fixture = (await opts.fixtureLoader(`dutchie-${store.platform_store_id}.json`)) as DutchieResponse;
        const products = fixture.data?.filteredProducts?.products ?? [];
        const items = products.flatMap(expandProduct);
        return {
          status: items.length > 0 ? "ok" : "empty",
          platform: "dutchie",
          items,
          duration_ms: Date.now() - start,
          adapter_version: ADAPTER_VERSION,
        };
      } catch (err) {
        return {
          status: "error",
          platform: "dutchie",
          items: [],
          duration_ms: Date.now() - start,
          error: `fixture load: ${(err as Error).message}`,
          adapter_version: ADAPTER_VERSION,
        };
      }
    }

    const hash = opts.apiKey || DEFAULT_QUERY_HASH;
    const all: RawMenuItem[] = [];
    let total = 0;
    let page = 0;
    let returned = -1;

    while (page < MAX_PAGES && returned !== 0) {
      const resp = await queryPage(store, page, hash);
      const products = resp.data?.filteredProducts?.products ?? [];
      returned = products.length;
      total = resp.data?.filteredProducts?.paginate?.total ?? total;
      for (const p of products) all.push(...expandProduct(p));
      page++;
      if (returned > 0 && all.length < total) await new Promise((r) => setTimeout(r, 500));
    }

    const status = all.length === 0 ? "empty" : "ok";
    return {
      status,
      platform: "dutchie",
      items: all,
      duration_ms: Date.now() - start,
      adapter_version: ADAPTER_VERSION,
      error: total === 0 ? `Dutchie api-4 returned 0 products for ${store.slug}` : undefined,
    };
  },
};

export const __testing = { expandProduct, buildVariables, buildUrl, isPersistedQueryMiss, ADAPTER_VERSION };
