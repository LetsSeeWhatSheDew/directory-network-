// lib/scraper/menu/adapters/joint.ts
// =============================================================================
// Joint (WordPress) menu adapter — Cookies Peoria Heights.
//
// Chrome Round 2 (2026-06-04) confirmed: /joint-api/v1/sync-dutchie and
// /joint-api/v1/sync-jane both return 404. There is NO upstream backdoor.
// The rotating WordPress nonce IS mandatory.
//
// Flow
//   1. GET <menu_url> (the storefront page) once per session.
//   2. Parse `window.joint.api.nonce = "<NONCE>"` (or similar) out of
//      the HTML response.
//   3. GET <base>/wp-json/joint-api/v1/products?per_page=20&page=N
//        &_wpnonce=<nonce>
//      with header `X-WP-Nonce: <nonce>`.
//   4. Paginate by `page`. WP returns `X-WP-Total` / `X-WP-TotalPages`
//      headers for pagination; we read those.
//
// platform_store_id for Cookies is the numeric Joint storeId (5478).
// We don't actually need it in the URL (the wp-json endpoint is store-
// scoped by host), but we keep it in the registry so the adapter can
// sanity-check the right store responded.
// =============================================================================

import type { Adapter, AdapterOpts, FetchResult, RawMenuItem, StoreRef } from "../types";
import { AdapterAuthError, AdapterSchemaError } from "../types";

const ADAPTER_VERSION = "joint@2.0.0";
const PER_PAGE = 20;
const MAX_PAGES = 30;

// Match either of:
//   window.joint = { ... api: { nonce: "abc123" } ... }
//   window.joint.api.nonce = "abc123"
//   jointApi = { nonce: "abc123" }
// Cookies' template can wrap the nonce in any of these.
const NONCE_PATTERNS: RegExp[] = [
  /joint(?:Api)?\.?[\w.]*nonce\s*[:=]\s*["']([a-f0-9]{6,32})["']/i,
  /wpApiSettings\s*=\s*\{[^}]*?nonce\s*:\s*["']([a-f0-9]{6,32})["']/i,
  /name="_wpnonce"\s+value="([a-f0-9]{6,32})"/i,
  /data-wpnonce="([a-f0-9]{6,32})"/i,
];

interface JointSyncProduct {
  id?: string | number;
  name?: string;
  brand?: string | { name?: string };
  category?: string;
  type?: string;
  weight?: string;
  size?: string;
  price?: number | string;
  list_price?: number | string;
  sale_price?: number | string;
  regular_price?: number | string;
  thc?: number | string;
  options?: Array<{ size?: string; price?: number | string; sale_price?: number | string }>;
  variants?: Array<{ size?: string; price?: number | string; sale_price?: number | string }>;
  store_id?: number | string;
}

interface JointProductsResponse {
  products?: JointSyncProduct[];
  data?: { products?: JointSyncProduct[] } | JointSyncProduct[];
  // Some Joint deployments return a bare array.
  // We coerce in the parser.
}

function baseUrlFromMenuUrl(menuUrl: string): string {
  const u = new URL(menuUrl);
  return `${u.protocol}//${u.host}`;
}

async function scrapeNonce(menuUrl: string): Promise<string> {
  const res = await fetch(menuUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new AdapterAuthError(`Joint menu GET ${res.status} at ${menuUrl}`);
  }
  const html = await res.text();
  for (const re of NONCE_PATTERNS) {
    const m = html.match(re);
    if (m) return m[1];
  }
  throw new AdapterAuthError(
    `Joint nonce not found in ${menuUrl} HTML (tried ${NONCE_PATTERNS.length} patterns). Page template may have changed.`
  );
}

async function fetchProductsPage(
  base: string,
  nonce: string,
  page: number
): Promise<{ products: JointSyncProduct[]; totalPages: number; total: number }> {
  const url = `${base}/wp-json/joint-api/v1/products?per_page=${PER_PAGE}&page=${page}&_wpnonce=${encodeURIComponent(nonce)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-WP-Nonce": nonce,
      "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)",
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new AdapterAuthError(`Joint products auth ${res.status}; nonce stale or wrong`);
  }
  if (!res.ok) {
    throw new AdapterSchemaError(
      `Joint products ${res.status}: ${await res.text().catch(() => "(no body)")}`
    );
  }
  const totalPages = Number(res.headers.get("x-wp-totalpages") || "1");
  const total = Number(res.headers.get("x-wp-total") || "0");
  const body = (await res.json()) as JointProductsResponse | JointSyncProduct[];

  let products: JointSyncProduct[];
  if (Array.isArray(body)) {
    products = body;
  } else if (Array.isArray(body.products)) {
    products = body.products;
  } else if (Array.isArray((body.data as JointSyncProduct[] | undefined))) {
    products = body.data as JointSyncProduct[];
  } else if (body.data && Array.isArray((body.data as { products?: JointSyncProduct[] }).products)) {
    products = (body.data as { products?: JointSyncProduct[] }).products ?? [];
  } else {
    throw new AdapterSchemaError(
      `Joint products: unexpected response shape: ${JSON.stringify(body).slice(0, 200)}`
    );
  }
  return { products, totalPages, total };
}

function num(v: number | string | undefined | null): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function expandProduct(p: JointSyncProduct): RawMenuItem[] {
  const brand = typeof p.brand === "string" ? p.brand : p.brand?.name ?? null;
  const category = p.category ?? p.type ?? null;
  const thc = typeof p.thc === "number" ? `${p.thc}%` : (p.thc ?? null);
  const variants = p.variants ?? p.options ?? [];

  if (variants.length > 0) {
    const out: RawMenuItem[] = [];
    for (const v of variants) {
      const list = num(v.price);
      const sale = num(v.sale_price);
      if (list == null || list <= 0) continue;
      const onSale = sale != null && sale > 0 && sale < list;
      out.push({
        raw_name: p.name?.trim() || "(unnamed)",
        raw_brand: brand,
        raw_category: category,
        raw_weight: v.size?.trim() || null,
        raw_price: list,
        raw_sale_price: onSale ? sale! : null,
        raw_thc: thc,
        is_on_sale: onSale,
        raw_payload: { product: p, variant: v },
      });
    }
    if (out.length > 0) return out;
  }

  const list = num(p.list_price ?? p.regular_price ?? p.price);
  const sale = num(p.sale_price);
  if (list == null || list <= 0) return [];
  const onSale = sale != null && sale > 0 && sale < list;
  return [{
    raw_name: p.name?.trim() || "(unnamed)",
    raw_brand: brand,
    raw_category: category,
    raw_weight: (p.weight?.trim() || p.size?.trim()) ?? null,
    raw_price: list,
    raw_sale_price: onSale ? sale! : null,
    raw_thc: thc,
    is_on_sale: onSale,
    raw_payload: p,
  }];
}

export const jointAdapter: Adapter = {
  platform: "joint",
  async fetch(store: StoreRef, opts: AdapterOpts = {}): Promise<FetchResult> {
    const start = Date.now();
    if (store.platform !== "joint") {
      return {
        status: "error",
        platform: "joint",
        items: [],
        duration_ms: 0,
        error: `Adapter mismatch: ${store.slug} platform=${store.platform}`,
        adapter_version: ADAPTER_VERSION,
      };
    }
    if (!store.menu_url) {
      return {
        status: "error",
        platform: "joint",
        items: [],
        duration_ms: 0,
        error: `${store.slug} missing menu_url`,
        adapter_version: ADAPTER_VERSION,
      };
    }

    if (opts.fixtureLoader) {
      try {
        const fixture = (await opts.fixtureLoader(`joint-${store.slug}.json`)) as JointProductsResponse;
        const products = Array.isArray(fixture)
          ? (fixture as JointSyncProduct[])
          : (fixture.products ?? (fixture.data as JointSyncProduct[] | undefined) ?? []);
        const items = (products as JointSyncProduct[]).flatMap(expandProduct);
        return {
          status: items.length > 0 ? "ok" : "empty",
          platform: "joint",
          items,
          duration_ms: Date.now() - start,
          adapter_version: ADAPTER_VERSION,
        };
      } catch (err) {
        return {
          status: "error",
          platform: "joint",
          items: [],
          duration_ms: Date.now() - start,
          error: `fixture load: ${(err as Error).message}`,
          adapter_version: ADAPTER_VERSION,
        };
      }
    }

    const base = baseUrlFromMenuUrl(store.menu_url);

    // Step 1: scrape the nonce from the menu page HTML.
    let nonce: string;
    try {
      nonce = await scrapeNonce(store.menu_url);
    } catch (err) {
      return {
        status: "error",
        platform: "joint",
        items: [],
        duration_ms: Date.now() - start,
        error: (err as Error).message,
        adapter_version: ADAPTER_VERSION,
      };
    }

    // Step 2: page through /products with the nonce.
    const all: RawMenuItem[] = [];
    let page = 1;
    let totalPages = 1;
    let retriedNonce = false;
    while (page <= Math.min(totalPages, MAX_PAGES)) {
      try {
        const resp = await fetchProductsPage(base, nonce, page);
        totalPages = resp.totalPages || 1;
        for (const p of resp.products) all.push(...expandProduct(p));
        page++;
        if (page <= totalPages) await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        if (err instanceof AdapterAuthError && !retriedNonce) {
          retriedNonce = true;
          nonce = await scrapeNonce(store.menu_url);
          continue;
        }
        throw err;
      }
    }

    return {
      status: all.length === 0 ? "empty" : "ok",
      platform: "joint",
      items: all,
      duration_ms: Date.now() - start,
      adapter_version: ADAPTER_VERSION,
      error: all.length === 0 ? `Joint /products returned no items for ${store.slug}` : undefined,
    };
  },
};

export const __testing = { expandProduct, scrapeNonce, NONCE_PATTERNS, ADAPTER_VERSION };
