// lib/scraper/menu/adapters/jane.ts
// =============================================================================
// Jane (iHeartJane) menu adapter — multi-cluster Algolia + slug-resolution.
//
// Chrome Round 2 found TWO Algolia clusters in use across our 5 Jane
// storefronts. The adapter is parameterized per-store via the registry's
// optional `jane_cluster` field (defaults to 'default').
//
// Coverage (5 stores)
//   * nuEra East Peoria       (1517)            cluster=default
//   * nuEra Pekin             (3050)            cluster=default
//   * Beyond Hello Peoria     (6926)            cluster=default
//   * Beyond Hello Bloomington(slug)            cluster=default  (slug→id resolved at fetch)
//   * RISE Canton             (1343)            cluster=rise_gti
//
// Clusters
//   default  -- app VFM4X0N23A, index menu-products-production
//               body uses numericFilters [store_id=N] + facetFilters by `kind`
//               (matches nuEra / Beyond Hello storefront behavior)
//   rise_gti -- app 4O7QMAY0VJ, index production_menu_items
//               body uses single `filters` string:
//                 "store_id:N AND sale_type:RECREATIONAL AND available:true"
//               (matches RISE / GTI storefront behavior)
//
// Slug → storeId resolution (BH Bloomington)
//   If platform_store_id is non-numeric we treat it as a Jane storefront
//   slug and GET api.iheartjane.com/v1/stores?slug=<slug> to resolve the
//   numeric store_id. Cached in-process for the life of the runner.
//
// Loud-fail: 401/403 from Algolia (key rotation) throws AdapterAuthError.
// =============================================================================

import type { Adapter, AdapterOpts, FetchResult, RawMenuItem, StoreRef } from "../types";
import { AdapterAuthError, AdapterSchemaError } from "../types";

const ADAPTER_VERSION = "jane@2.0.0";
const HITS_PER_PAGE = 100;
const MAX_PAGES = 30;

interface JaneCluster {
  appId: string;
  apiKey: string;
  indexName: string;
  /** Build the Algolia query body for this cluster + store. */
  buildBody: (storeId: number, page: number) => unknown;
}

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

/** Default cluster (nuEra + Beyond Hello). */
const DEFAULT_CLUSTER: JaneCluster = {
  appId: "VFM4X0N23A",
  // Search-only key from Jane's public storefront bundle (2026-06-04).
  // Override via JANE_ALGOLIA_KEY env when rotated.
  apiKey: process.env.JANE_ALGOLIA_KEY || "f9b53d83d1e96b97c4f80ab1ac6cdbfb",
  indexName: "menu-products-production",
  buildBody: (storeId, page) => ({
    query: "",
    page,
    hitsPerPage: HITS_PER_PAGE,
    facetFilters: [VALID_PRODUCT_TYPES.map((t) => `kind:${t}`)],
    numericFilters: [`store_id=${storeId}`],
    attributesToRetrieve: ["*"],
  }),
};

/** RISE / GTI cluster (RISE Canton storeId 1343). */
const RISE_CLUSTER: JaneCluster = {
  appId: "4O7QMAY0VJ",
  apiKey: process.env.JANE_ALGOLIA_KEY_RISE || "e1b4dada43202e5a1a88124a9ad956f2",
  indexName: "production_menu_items",
  buildBody: (storeId, page) => ({
    filters: `store_id:${storeId} AND sale_type:RECREATIONAL AND available:true`,
    hitsPerPage: HITS_PER_PAGE,    // RISE storefront uses 24 in the wild; 100 is fine -- Algolia caps if needed
    page,
    attributesToRetrieve: ["*"],
  }),
};

const CLUSTERS: Record<string, JaneCluster> = {
  default: DEFAULT_CLUSTER,
  rise_gti: RISE_CLUSTER,
};

interface AlgoliaHit {
  objectID?: string;
  product_id?: number | string;
  name?: string;
  brand?: string;
  brand_subtype?: string;
  kind?: string;
  category?: string;
  root_subtype?: string;
  product_type?: string;
  amount?: string;
  unit?: string;
  has_brand_discount?: boolean;
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
  percent_thc?: number;
  percent_thca?: number;
  percent_cbd?: number;
  thc_potency?: number;
  thc_low?: number;
  thc_high?: number;
  store_id?: number | string;
  available?: boolean;
  sale_type?: string;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

interface JaneStoreLookup {
  stores?: Array<{ id?: number; slug?: string; name?: string; address?: string; state?: string; city?: string }>;
  store?: { id?: number; slug?: string; name?: string };
}

// Cache slug -> numeric id so the same runner doesn't hammer v1/stores.
const SLUG_TO_ID_CACHE = new Map<string, number>();

async function resolveStoreId(slugOrId: string): Promise<number> {
  // Already numeric.
  if (/^\d+$/.test(slugOrId)) return Number(slugOrId);

  const cached = SLUG_TO_ID_CACHE.get(slugOrId);
  if (cached) return cached;

  const url = `https://www.iheartjane.com/api/v1/stores?slug=${encodeURIComponent(slugOrId)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)" },
  });
  if (!res.ok) {
    throw new AdapterSchemaError(`Jane v1/stores ${res.status} for slug=${slugOrId}`);
  }
  const body = (await res.json()) as JaneStoreLookup;
  const candidate = body.store?.id ?? body.stores?.[0]?.id;
  if (typeof candidate !== "number") {
    throw new AdapterSchemaError(`Jane v1/stores returned no numeric id for slug=${slugOrId}`);
  }
  SLUG_TO_ID_CACHE.set(slugOrId, candidate);
  return candidate;
}

function algoliaEndpoint(cluster: JaneCluster): string {
  return `https://${cluster.appId.toLowerCase()}-dsn.algolia.net/1/indexes/${cluster.indexName}/query`;
}

async function queryPage(cluster: JaneCluster, storeId: number, page: number): Promise<AlgoliaResponse> {
  const url =
    `${algoliaEndpoint(cluster)}?x-algolia-application-id=${cluster.appId}&x-algolia-api-key=${cluster.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(cluster.buildBody(storeId, page)),
  });
  if (res.status === 401 || res.status === 403) {
    throw new AdapterAuthError(
      `Jane Algolia auth failed (${res.status}) for store ${storeId} on cluster ${cluster.indexName}. Key likely rotated; set JANE_ALGOLIA_KEY (default) or JANE_ALGOLIA_KEY_RISE (rise_gti).`
    );
  }
  if (!res.ok) {
    throw new AdapterSchemaError(
      `Jane Algolia ${res.status} on ${cluster.indexName}: ${await res.text().catch(() => "(no body)")}`
    );
  }
  const json = (await res.json()) as AlgoliaResponse;
  if (!Array.isArray(json.hits) || typeof json.nbHits !== "number") {
    throw new AdapterSchemaError(
      `Jane Algolia returned unexpected shape on ${cluster.indexName}: ${JSON.stringify(json).slice(0, 200)}`
    );
  }
  return json;
}

function thcDisplay(hit: AlgoliaHit): string | null {
  if (hit.thc_low != null && hit.thc_high != null && hit.thc_low !== hit.thc_high) {
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

/** Hit -> RawMenuItem[]; flower SKUs auto-expand to one row per bucket. */
function expandHit(hit: AlgoliaHit): RawMenuItem[] {
  const baseName = hit.name?.trim() || "(unnamed)";
  const brand = hit.brand?.trim() || null;
  const category = (hit.kind || hit.category || hit.product_type || null) || null;
  const isFlower = (category || "").toLowerCase().startsWith("flower");
  const thcStr = thcDisplay(hit);

  if (isFlower) {
    // Two flower conventions across Jane clusters:
    //  A) Default cluster (menu-products-production): one hit per SKU with
    //     per-bucket price fields (price_eighth_ounce, price_quarter_ounce,
    //     price_half_ounce, price_ounce, plus optional price_each for 1g).
    //     We auto-expand to one row per non-null bucket.
    //  B) RISE / rise_gti cluster (production_menu_items): one hit per
    //     (SKU x weight), with a flat `price` and an `amount` like "3.5g".
    //     No per-bucket fields. We emit a single row using `amount` as weight.
    const hasBucketField =
      hit.price_eighth_ounce != null ||
      hit.price_quarter_ounce != null ||
      hit.price_half_ounce != null ||
      hit.price_ounce != null ||
      hit.price_each != null;

    if (hasBucketField) {
      const out: RawMenuItem[] = [];
      const buckets: Array<{ weight: string; list?: number; sale?: number }> = [
        { weight: "1g",  list: hit.price_each,          sale: hit.discounted_price_each },
        { weight: "3.5g", list: hit.price_eighth_ounce,  sale: hit.discounted_price_eighth_ounce },
        { weight: "7g",   list: hit.price_quarter_ounce, sale: hit.discounted_price_quarter_ounce },
        { weight: "14g",  list: hit.price_half_ounce,    sale: hit.discounted_price_half_ounce },
        { weight: "28g",  list: hit.price_ounce,         sale: hit.discounted_price_ounce },
      ];
      for (const b of buckets) {
        if (b.list && b.list > 0) {
          out.push(rawRow({
            name: baseName, brand, category, weight: b.weight,
            price: b.list, sale: b.sale ?? null, thc: thcStr, payload: hit,
          }));
        }
      }
      if (out.length > 0) return out;
    }
    // Flat-price flower (rise_gti cluster): fall through to the single-row
    // path below, which uses hit.amount as the weight.
  }

  const list = hit.price ?? hit.bucket_price ?? hit.price_each;
  const sale = hit.discounted_price ?? hit.discounted_bucket_price ?? hit.discounted_price_each;
  if (!list || list <= 0) return [];
  return [rawRow({
    name: baseName, brand, category, weight: hit.amount || null,
    price: list, sale: sale ?? null, thc: thcStr, payload: hit,
  })];
}

interface StoreWithCluster extends StoreRef {
  jane_cluster?: string;
}

function pickCluster(store: StoreWithCluster): JaneCluster {
  const key = store.jane_cluster || "default";
  const c = CLUSTERS[key];
  if (!c) {
    throw new AdapterSchemaError(`Unknown Jane cluster "${key}" for store ${store.slug}`);
  }
  return c;
}

export const janeAdapter: Adapter = {
  platform: "jane",
  async fetch(store: StoreRef, opts: AdapterOpts = {}): Promise<FetchResult> {
    const start = Date.now();
    const withCluster = store as StoreWithCluster;

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

    // Fixture mode (offline tests). Fixture filename matches the
    // ORIGINAL platform_store_id (slug or numeric) so tests can hold a
    // separate fixture per store/cluster.
    if (opts.fixtureLoader) {
      try {
        const fixture = (await opts.fixtureLoader(
          `jane-${store.platform_store_id}.json`
        )) as AlgoliaResponse;
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

    const cluster = pickCluster(withCluster);

    // Resolve slug -> numeric storeId when needed.
    let storeId: number;
    try {
      storeId = await resolveStoreId(store.platform_store_id);
    } catch (err) {
      return {
        status: "error",
        platform: "jane",
        items: [],
        duration_ms: Date.now() - start,
        error: `resolveStoreId failed for ${store.slug}: ${(err as Error).message}`,
        adapter_version: ADAPTER_VERSION,
      };
    }

    const all: RawMenuItem[] = [];
    let page = 0;
    let nbPages = 1;
    let totalHits = 0;

    while (page < Math.min(nbPages, MAX_PAGES)) {
      const resp = await queryPage(cluster, storeId, page);
      totalHits = resp.nbHits;
      nbPages = resp.nbPages;
      for (const hit of resp.hits) all.push(...expandHit(hit));
      page++;
      if (page < nbPages) await new Promise((r) => setTimeout(r, 400));
    }

    return {
      status: all.length === 0 ? "empty" : "ok",
      platform: "jane",
      items: all,
      duration_ms: Date.now() - start,
      adapter_version: ADAPTER_VERSION,
      error: totalHits === 0 ? `Jane returned 0 hits for store ${storeId} on cluster ${cluster.indexName}` : undefined,
    };
  },
};

export const __testing = {
  expandHit,
  resolveStoreId,
  CLUSTERS,
  algoliaEndpoint,
  ADAPTER_VERSION,
};
