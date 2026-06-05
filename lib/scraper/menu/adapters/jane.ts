// lib/scraper/menu/adapters/jane.ts
// =============================================================================
// Jane (iHeartJane) menu adapter — single consolidated Algolia config.
//
// Chrome re-verified the live shape on 2026-06-05. Jane consolidated its
// Algolia setup: there is now ONE cluster for every Jane storefront we cover
// (nuEra ×2, Beyond Hello ×2, RISE Canton). The former `rise_gti` cluster
// (app 4O7QMAY0VJ / index production_menu_items) is DEAD — it returns
// "Index not allowed with this API key". RISE Canton (store 1343) now lives
// in the same app VFM4X0N23A / index menu-products-production as the rest.
//
// Coverage (5 stores), all on the single cluster
//   * nuEra East Peoria        (1517)
//   * nuEra Pekin              (3050)
//   * Beyond Hello Peoria      (6926)
//   * Beyond Hello Bloomington (slug -> id resolved at fetch)
//   * RISE Canton              (1343)
//
// Live request shape (verified 2026-06-05) — the multi-index batch endpoint:
//   POST https://search.iheartjane.com/1/indexes/*/queries
//   headers: x-algolia-application-id, x-algolia-api-key, Content-Type
//   body:   { "requests": [ { "indexName": "menu-products-production",
//             "params": "filters=store_id%3D<ID>&hitsPerPage=48&page=0" } ] }
//   response: results[0].{ hits, nbHits, page, nbPages, hitsPerPage }
//
// `store_id` is the per-store discriminator. The embedded search key is
// public and WILL rotate — keep it env-driven (JANE_ALGOLIA_KEY) and fail
// loud (AdapterAuthError) on 401/403 so a rotation surfaces immediately.
//
// Slug -> storeId resolution (Beyond Hello Bloomington)
//   If platform_store_id is non-numeric we treat it as a Jane storefront
//   slug and GET www.iheartjane.com/api/v1/stores?slug=<slug> to resolve the
//   numeric store_id. Cached in-process for the life of the runner.
//
// NOTE on jane_cluster: the registry's `jane_cluster` field is now vestigial
// (single cluster). The adapter ignores its value — a lingering legacy value
// like "rise_gti" routes to the one config rather than throwing, so RISE
// Canton keeps working before Cowork retires the field.
// =============================================================================

import type { Adapter, AdapterOpts, FetchResult, RawMenuItem, StoreRef } from "../types";
import { AdapterAuthError, AdapterSchemaError } from "../types";

const ADAPTER_VERSION = "jane@3.0.0";
const HITS_PER_PAGE = 48; // Live storefront uses 48; Algolia caps if exceeded.
const MAX_PAGES = 30;

// ---- Single consolidated Jane Algolia config (2026-06-05) -------------------
const JANE_APP_ID = "VFM4X0N23A";
const JANE_INDEX = "menu-products-production";
// Public embedded search key. Rotates without notice — override via env.
const JANE_API_KEY = process.env.JANE_ALGOLIA_KEY || "edc5435c65d771cecbd98bbd488aa8d3";
// Multi-index batch endpoint the live storefront posts to.
const SEARCH_ENDPOINT = "https://search.iheartjane.com/1/indexes/*/queries";

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

interface AlgoliaResult {
  hits: AlgoliaHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

/** Batch response envelope: { results: [ AlgoliaResult ] }. */
interface AlgoliaBatchResponse {
  results?: AlgoliaResult[];
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

/** Build the `params` querystring for one store/page on the batch endpoint. */
function buildParams(storeId: number, page: number): string {
  // store_id is the discriminator; `=` must be percent-encoded inside the
  // filters value -> store_id%3D<ID>. encodeURIComponent does this for us.
  const filters = encodeURIComponent(`store_id=${storeId}`);
  return `filters=${filters}&hitsPerPage=${HITS_PER_PAGE}&page=${page}`;
}

/**
 * Pull one AlgoliaResult from a raw payload.
 * - Live / new fixtures: batch envelope { results: [ {hits,...} ] }.
 * - Legacy single-query fixtures: bare { hits, nbHits, ... } (back-compat).
 * The live network path uses requireResult() which is strict (batch-only) so
 * a real prod shape change fails loud; fixtures may use either envelope.
 */
function extractResult(raw: unknown): AlgoliaResult {
  const obj = raw as AlgoliaBatchResponse & Partial<AlgoliaResult>;
  if (obj && Array.isArray(obj.results)) {
    const r = obj.results[0];
    if (r && Array.isArray(r.hits)) return r;
    throw new AdapterSchemaError(
      `Jane batch envelope has no results[0].hits: ${JSON.stringify(raw).slice(0, 200)}`
    );
  }
  if (obj && Array.isArray(obj.hits)) {
    return obj as AlgoliaResult; // legacy single-query shape
  }
  throw new AdapterSchemaError(`Jane payload missing hits[]: ${JSON.stringify(raw).slice(0, 200)}`);
}

async function queryPage(storeId: number, page: number, apiKey: string): Promise<AlgoliaResult> {
  const res = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "x-algolia-application-id": JANE_APP_ID,
      "x-algolia-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ requests: [{ indexName: JANE_INDEX, params: buildParams(storeId, page) }] }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new AdapterAuthError(
      `Jane Algolia auth failed (${res.status}) for store ${storeId}. Public search key likely rotated; set JANE_ALGOLIA_KEY.`
    );
  }
  if (!res.ok) {
    throw new AdapterSchemaError(
      `Jane Algolia ${res.status} on ${JANE_INDEX}: ${await res.text().catch(() => "(no body)")}`
    );
  }
  const json = (await res.json()) as AlgoliaBatchResponse;
  const result = json.results?.[0];
  if (!result || !Array.isArray(result.hits) || typeof result.nbHits !== "number") {
    throw new AdapterSchemaError(
      `Jane Algolia returned unexpected batch shape: ${JSON.stringify(json).slice(0, 200)}`
    );
  }
  return result;
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

/** Hit -> RawMenuItem[]; flower SKUs auto-expand to one row per bucket.
 *  Shape-driven (NOT cluster-driven): a hit with per-bucket price fields
 *  expands; a hit with a flat `price` + `amount` emits a single row. Works
 *  for any Jane store regardless of how its flower is encoded. */
function expandHit(hit: AlgoliaHit): RawMenuItem[] {
  const baseName = hit.name?.trim() || "(unnamed)";
  const brand = hit.brand?.trim() || null;
  const category = (hit.kind || hit.category || hit.product_type || null) || null;
  const isFlower = (category || "").toLowerCase().startsWith("flower");
  const thcStr = thcDisplay(hit);

  if (isFlower) {
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
    // Flat-price flower: fall through to the single-row path (uses hit.amount).
  }

  const list = hit.price ?? hit.bucket_price ?? hit.price_each;
  const sale = hit.discounted_price ?? hit.discounted_bucket_price ?? hit.discounted_price_each;
  if (!list || list <= 0) return [];
  return [rawRow({
    name: baseName, brand, category, weight: hit.amount || null,
    price: list, sale: sale ?? null, thc: thcStr, payload: hit,
  })];
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

    // Fixture mode (offline tests). Fixture filename matches the
    // platform_store_id (slug or numeric) so tests can hold one fixture per
    // store. Tolerates both the new batch envelope and legacy single-query.
    if (opts.fixtureLoader) {
      try {
        const fixture = await opts.fixtureLoader(`jane-${store.platform_store_id}.json`);
        const result = extractResult(fixture);
        const items = result.hits.flatMap(expandHit);
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

    const apiKey = opts.apiKey || JANE_API_KEY;

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
      const resp = await queryPage(storeId, page, apiKey);
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
      error: totalHits === 0 ? `Jane returned 0 hits for store ${storeId} on ${JANE_INDEX}` : undefined,
    };
  },
};

export const __testing = {
  expandHit,
  resolveStoreId,
  extractResult,
  buildParams,
  SEARCH_ENDPOINT,
  JANE_APP_ID,
  JANE_INDEX,
  ADAPTER_VERSION,
};
