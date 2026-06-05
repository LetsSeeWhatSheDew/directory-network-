// lib/scraper/menu/adapters/sweed.ts
// =============================================================================
// Sweed (SweedPos) menu adapter — reconciled to Chrome Round 2 recon.
//
// Covers Ivy Hall (Sweed storeId 169).
//
// Live flow (Chrome Round 2)
//   1. Page 1 of the menu is delivered SSR (no fetch needed); the page
//      load mints a `__sw-device-id` UUID into localStorage.
//   2. Client filter/sort actions POST
//        https://web-ui-production.sweedpos.com/_api/proxy/Products/GetProductList
//      with body { StoreId: 169, SaleType: "RECREATIONAL", Page, PageSize, ... }
//   3. A single call with a large PageSize pulls the entire menu.
//
// For our server-side adapter we don't have localStorage, so we GET the
// menu page once (which may also set `__sw-device-id` as a cookie in
// some deployments) and either reuse that cookie or mint our own UUID.
// Sweed treats the device id as opaque -- a synthetic UUID works.
// =============================================================================

import type { Adapter, AdapterOpts, FetchResult, RawMenuItem, StoreRef } from "../types";
import { AdapterAuthError, AdapterSchemaError } from "../types";

const ADAPTER_VERSION = "sweed@2.0.0";
const PRODUCT_LIST_URL = "https://web-ui-production.sweedpos.com/_api/proxy/Products/GetProductList";
// One big page pulls the full menu per Chrome Round 2 -- avoids needing
// to handle pagination state in the typical case.
const PER_PAGE = 500;

interface SweedVariant {
  Id?: string;
  Sku?: string;
  Size?: string;             // "3.5g", "1g cart", "100mg"...
  OriginalPrice?: number;    // pre-discount shelf price
  Price?: number;            // current price (may equal OriginalPrice)
  IsLowStock?: boolean;
}

interface SweedProduct {
  Id?: string;
  Name?: string;
  Brand?: string | { Name?: string };
  Category?: string | { Name?: string };
  Variants?: SweedVariant[];
  Thc?: { Min?: number; Max?: number };
  Cbd?: { Min?: number; Max?: number };
}

interface SweedResponse {
  Products?: SweedProduct[];
  TotalCount?: number;
}

async function establishSession(menuUrl: string): Promise<string> {
  // Server-side fetch doesn't get a real cookie jar by default. We GET the
  // page and read the Set-Cookie header ourselves.
  const res = await fetch(menuUrl, {
    headers: {
      "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new AdapterAuthError(`Sweed menu GET failed ${res.status} at ${menuUrl}`);
  }
  const setCookie = res.headers.get("set-cookie") || "";
  // Either name appears across versions of the Sweed widget.
  const m = setCookie.match(/(?:__sw-device-id|sw-device-id|deviceId)=([^;]+)/i);
  if (!m) {
    // Some Sweed deployments mint the device id client-side via JS. We
    // fall back to a synthetic id; Sweed accepts a fresh UUID just fine.
    return cryptoRandom();
  }
  return m[1];
}

function cryptoRandom(): string {
  // Avoid require("crypto") for portability across runtimes.
  // 32 hex chars, plenty for a device id.
  let out = "";
  for (let i = 0; i < 8; i++) out += Math.random().toString(16).slice(2, 10);
  return out.slice(0, 32);
}

async function fetchProducts(deviceId: string, store: StoreRef, page: number): Promise<SweedResponse> {
  // platform_store_id is the numeric Sweed StoreId (e.g. "169" for Ivy Hall).
  const storeId = Number(store.platform_store_id);
  if (!Number.isFinite(storeId) || storeId <= 0) {
    throw new AdapterSchemaError(
      `Sweed needs a numeric storeId; got "${store.platform_store_id}" for ${store.slug}`
    );
  }
  const res = await fetch(PRODUCT_LIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Cookie: `__sw-device-id=${deviceId}`,
      "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)",
      Referer: store.menu_url || "",
    },
    body: JSON.stringify({
      StoreId: storeId,
      SaleType: "RECREATIONAL",
      Page: page,
      PageSize: PER_PAGE,
      SortBy: "popularity",
      SortDirection: "desc",
      Filters: {},
    }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new AdapterAuthError(`Sweed session rejected (${res.status}). Cookie may have expired.`);
  }
  if (!res.ok) {
    throw new AdapterSchemaError(`Sweed ${res.status}: ${await res.text().catch(() => "(no body)")}`);
  }
  const body = (await res.json()) as SweedResponse;
  if (!body || !Array.isArray(body.Products)) {
    throw new AdapterSchemaError(`Sweed response missing Products[]: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body;
}

function strField(v: string | { Name?: string } | undefined): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  return v.Name?.trim() || null;
}

function thcDisplay(t?: { Min?: number; Max?: number }): string | null {
  if (!t) return null;
  if (t.Min != null && t.Max != null && t.Min !== t.Max) return `${t.Min}%-${t.Max}%`;
  if (t.Min != null) return `${t.Min}%`;
  if (t.Max != null) return `${t.Max}%`;
  return null;
}

function expandProduct(p: SweedProduct): RawMenuItem[] {
  const brand = strField(p.Brand);
  const category = strField(p.Category);
  const thc = thcDisplay(p.Thc);
  const variants = p.Variants ?? [];
  const out: RawMenuItem[] = [];
  for (const v of variants) {
    const list = v.OriginalPrice && v.OriginalPrice > 0 ? v.OriginalPrice : v.Price;
    const current = v.Price;
    if (!list || list <= 0) continue;
    const onSale = current != null && current > 0 && current < list;
    out.push({
      raw_name: p.Name?.trim() || "(unnamed)",
      raw_brand: brand,
      raw_category: category,
      raw_weight: v.Size?.trim() || null,
      raw_price: list,
      raw_sale_price: onSale ? current! : null,
      raw_thc: thc,
      is_on_sale: onSale,
      raw_payload: { product: p, variant: v },
    });
  }
  return out;
}

export const sweedAdapter: Adapter = {
  platform: "sweed",
  async fetch(store: StoreRef, opts: AdapterOpts = {}): Promise<FetchResult> {
    const start = Date.now();
    if (store.platform !== "sweed") {
      return {
        status: "error",
        platform: "sweed",
        items: [],
        duration_ms: 0,
        error: `Adapter mismatch: ${store.slug} platform=${store.platform}`,
        adapter_version: ADAPTER_VERSION,
      };
    }
    if (!store.menu_url) {
      return {
        status: "error",
        platform: "sweed",
        items: [],
        duration_ms: 0,
        error: `${store.slug} missing menu_url for session bootstrap`,
        adapter_version: ADAPTER_VERSION,
      };
    }

    if (opts.fixtureLoader) {
      try {
        const fixture = (await opts.fixtureLoader(`sweed-${store.slug}.json`)) as SweedResponse;
        const items = (fixture.Products ?? []).flatMap(expandProduct);
        return {
          status: items.length > 0 ? "ok" : "empty",
          platform: "sweed",
          items,
          duration_ms: Date.now() - start,
          adapter_version: ADAPTER_VERSION,
        };
      } catch (err) {
        return {
          status: "error",
          platform: "sweed",
          items: [],
          duration_ms: Date.now() - start,
          error: `fixture load: ${(err as Error).message}`,
          adapter_version: ADAPTER_VERSION,
        };
      }
    }

    let deviceId = await establishSession(store.menu_url);
    let all: RawMenuItem[] = [];
    let totalCount = 0;
    // Sweed lets us pull the whole menu in one big page (PER_PAGE=500),
    // but loop a few times defensively in case a store ever exceeds it.
    let page = 0;
    let returned = -1;
    let retriedAuth = false;

    while (page < 10 && returned !== 0) {
      try {
        const resp = await fetchProducts(deviceId, store, page);
        const products = resp.Products ?? [];
        returned = products.length;
        totalCount = resp.TotalCount ?? totalCount;
        for (const p of products) all.push(...expandProduct(p));
        page++;
        if (returned > 0 && all.length < totalCount) await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        if (err instanceof AdapterAuthError && !retriedAuth) {
          // Session likely expired -- re-bootstrap and retry the same page once.
          retriedAuth = true;
          deviceId = await establishSession(store.menu_url);
          continue;
        }
        throw err;
      }
    }

    const status = all.length === 0 ? "empty" : "ok";
    return {
      status,
      platform: "sweed",
      items: all,
      duration_ms: Date.now() - start,
      adapter_version: ADAPTER_VERSION,
      error: totalCount === 0 ? `Sweed returned 0 products for ${store.slug}` : undefined,
    };
  },
};

export const __testing = { expandProduct, ADAPTER_VERSION };
