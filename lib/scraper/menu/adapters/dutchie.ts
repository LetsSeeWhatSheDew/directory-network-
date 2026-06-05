// lib/scraper/menu/adapters/dutchie.ts
// =============================================================================
// Dutchie menu adapter.
//
// Covers the four Dutchie-platform Central IL stores:
//   * NOXX East Peoria   (graphql_endpoint=noxx.com/api-1/graphql, dispensaryId 65772a69ac53410009424572)
//   * Trinity Peoria (University)  (dutchie.com/graphql, slug trinity-compassionate-care-rec)
//   * Trinity Peoria (Glen)        (slug VERIFY)
//   * RISE Canton                  (slug VERIFY)
//
// API
//   GraphQL POST. Two endpoints in use:
//     1. dutchie.com/graphql           — the main Dutchie storefront
//     2. <whitelabel>.com/api-1/graphql — Dutchie's embedded-menu proxy
//        for white-label storefronts like NOXX.
//   Both speak the same FilteredProducts schema. Parameterize by endpoint
//   + (dispensaryId OR dispensary slug); the rest of the parser is shared.
//
// Pagination
//   `page` (0-indexed) + `perPage`. Loop until we've covered the total or
//   hit a safety cap.
//
// Schema
//   FilteredProducts returns products[] each with: id, name, brand{name},
//   strainType, type ("Flower"|"Vaporizers"|...), POSMetaData{children[
//     {option:"3.5g", priceRec, specialPriceRec}]}, potency{thc{value,unit,range[]}}.
//   We expand each child option into its own raw row (parallels Jane's
//   bucket expansion) so each weight is observable.
// =============================================================================

import type { Adapter, AdapterOpts, FetchResult, RawMenuItem, StoreRef } from "../types";
import { AdapterAuthError, AdapterSchemaError } from "../types";

const ADAPTER_VERSION = "dutchie@1.0.0";
const PER_PAGE = 100;
const MAX_PAGES = 30;

// GraphQL query for the public FilteredProducts resolver. Pruned to the
// fields the parser uses to keep payloads tight.
const PRODUCTS_QUERY = `
  query FilteredProducts($filter: ProductFilter) {
    filteredProducts(filter: $filter) {
      queryInfo {
        totalCount
      }
      products {
        id
        name
        type
        strainType
        brand { name }
        brandName
        Status
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
        Image
        Description
        Weight
        type
        potencyThc { formatted range unit }
        potencyCbd { formatted range unit }
        terpenes { terpene { name } value }
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
  option?: string;          // "3.5g", "1g cart", etc.
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
      queryInfo?: { totalCount?: number };
      products?: DutchieProduct[];
    } | null;
  };
  errors?: Array<{ message: string }>;
}

function endpoint(store: StoreRef): string {
  return store.graphql_endpoint || "https://dutchie.com/graphql";
}

function buildFilter(store: StoreRef, page: number): unknown {
  // Whitelabel endpoints (noxx) accept dispensaryId; the main Dutchie
  // endpoint accepts dispensary slug. The id-vs-slug check is purely
  // formatting: 24-char hex = ObjectId, otherwise slug.
  const ref = store.platform_store_id;
  const isObjectId = /^[0-9a-f]{24}$/i.test(ref);
  const filter: Record<string, unknown> = {
    menuType: "Rec",
    page,
    perPage: PER_PAGE,
    sortBy: "popular",
    sortDirection: -1,
    productsOnSpecial: false,
    bypassKioskMenu: false,
    bypassOnlineThresholds: false,
    isKioskMenu: false,
    pricingType: "rec",
  };
  if (isObjectId) {
    filter.dispensaryId = ref;
  } else {
    filter.cName = ref;            // Dutchie's "canonical name" / slug filter
  }
  return filter;
}

async function queryPage(store: StoreRef, page: number): Promise<DutchieResponse> {
  const url = endpoint(store);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)",
    },
    body: JSON.stringify({
      operationName: "FilteredProducts",
      query: PRODUCTS_QUERY,
      variables: { filter: buildFilter(store, page) },
    }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new AdapterAuthError(`Dutchie auth ${res.status} at ${url} for ${store.slug}`);
  }
  if (!res.ok) {
    throw new AdapterSchemaError(`Dutchie ${res.status}: ${await res.text().catch(() => "(no body)")}`);
  }
  const body = (await res.json()) as DutchieResponse;
  if (body.errors && body.errors.length > 0) {
    throw new AdapterSchemaError(`Dutchie GraphQL errors: ${body.errors.map((e) => e.message).join("; ")}`);
  }
  if (!body.data || !body.data.filteredProducts) {
    throw new AdapterSchemaError(`Dutchie response missing data.filteredProducts: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body;
}

function thcDisplay(p?: DutchiePotency): string | null {
  if (!p) return null;
  if (p.formatted) return p.formatted;
  if (p.range && p.range.length === 2) return `${p.range[0]}${p.unit || "%"}-${p.range[1]}${p.unit || "%"}`;
  return null;
}

function expandProduct(prod: DutchieProduct): RawMenuItem[] {
  const brand = prod.brand?.name || prod.brandName || null;
  const category = (prod.type || prod.strainType || null) || null;
  const thc = thcDisplay(prod.potencyThc);

  // POSMetaData.children is Dutchie's per-option pricing — flower buckets,
  // vape sizes, edible packs. Prefer it when present.
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

  // Fall back to recPrices / recSpecialPrices arrays paired with Options.
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

    const all: RawMenuItem[] = [];
    let totalCount = 0;
    let page = 0;
    let returned = -1;
    while (page < MAX_PAGES && returned !== 0) {
      const resp = await queryPage(store, page);
      const products = resp.data?.filteredProducts?.products ?? [];
      returned = products.length;
      totalCount = resp.data?.filteredProducts?.queryInfo?.totalCount ?? totalCount;
      for (const p of products) all.push(...expandProduct(p));
      page++;
      if (returned > 0 && all.length < totalCount) await new Promise((r) => setTimeout(r, 500));
    }

    const status = all.length === 0 ? "empty" : "ok";
    return {
      status,
      platform: "dutchie",
      items: all,
      duration_ms: Date.now() - start,
      adapter_version: ADAPTER_VERSION,
      error: totalCount === 0 ? `Dutchie returned 0 products for ${store.slug}` : undefined,
    };
  },
};

export const __testing = { expandProduct, ADAPTER_VERSION };
