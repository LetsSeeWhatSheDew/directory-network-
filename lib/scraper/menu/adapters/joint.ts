// lib/scraper/menu/adapters/joint.ts
// =============================================================================
// Joint (WordPress) menu adapter — Cookies Peoria Heights.
//
// Joint's main menu endpoint is admin-ajax.php with a rotating WP nonce.
// Per the registry note, Joint exposes /joint-api/v1/sync-dutchie and
// /sync-jane: Cookies' data ORIGINATES from a Dutchie or Jane backend
// upstream. Probe those upstream paths first; if they return product
// data, parse them. If not, fall back to parsing the server-rendered
// /menu/ HTML.
//
// Strategy (in order)
//   1. GET /wp-json/joint-api/v1/sync-dutchie?store=... — if 200 + JSON
//      products, use those. (Most likely path — Cookies normally proxies
//      a Dutchie store.)
//   2. GET /wp-json/joint-api/v1/sync-jane — same idea, Jane upstream.
//   3. GET /menu/ HTML and parse JSON-LD product schema.
//
// This adapter is intentionally minimal. The registry note says don't
// over-invest in fighting the rotating nonce. If 1+2 fail, we record an
// empty snapshot with an explanatory error — Phase 8 alerts on
// repeated empties and a human resolves whether to add HTML parsing.
// =============================================================================

import type { Adapter, AdapterOpts, FetchResult, RawMenuItem, StoreRef } from "../types";
import { AdapterAuthError, AdapterSchemaError } from "../types";

const ADAPTER_VERSION = "joint@0.9.0";  // 0.9 = HTML fallback not yet implemented

interface JointSyncProduct {
  id?: string;
  name?: string;
  brand?: string;
  category?: string;
  type?: string;
  weight?: string;
  size?: string;
  price?: number;
  list_price?: number;
  sale_price?: number;
  thc?: number | string;
  options?: Array<{ size?: string; price?: number; sale_price?: number }>;
  variants?: Array<{ size?: string; price?: number; sale_price?: number }>;
}

interface JointSyncResponse {
  products?: JointSyncProduct[];
  data?: { products?: JointSyncProduct[] };
}

function baseUrlFromMenuUrl(menuUrl: string): string {
  const u = new URL(menuUrl);
  return `${u.protocol}//${u.host}`;
}

async function trySync(base: string, kind: "dutchie" | "jane"): Promise<JointSyncProduct[] | null> {
  const url = `${base}/wp-json/joint-api/v1/sync-${kind}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PuffPriceMenuPipeline/1.0 (+https://puffprice.com/about)",
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new AdapterAuthError(`Joint sync-${kind} auth ${res.status}`);
    }
    if (!res.ok) return null;
    const body = (await res.json()) as JointSyncResponse;
    return body.products ?? body.data?.products ?? null;
  } catch (err) {
    if (err instanceof AdapterAuthError) throw err;
    return null;
  }
}

function expandSyncProduct(p: JointSyncProduct): RawMenuItem[] {
  const brand = p.brand ?? null;
  const category = p.category ?? p.type ?? null;
  const thc = typeof p.thc === "number" ? `${p.thc}%` : (p.thc ?? null);
  const variants = p.variants ?? p.options ?? [];

  if (variants.length > 0) {
    const out: RawMenuItem[] = [];
    for (const v of variants) {
      const list = v.price;
      const sale = v.sale_price;
      if (!list || list <= 0) continue;
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

  const list = p.list_price ?? p.price;
  const sale = p.sale_price;
  if (!list || list <= 0) return [];
  const onSale = sale != null && sale > 0 && sale < list;
  return [{
    raw_name: p.name?.trim() || "(unnamed)",
    raw_brand: brand,
    raw_category: category,
    raw_weight: p.weight?.trim() || p.size?.trim() || null,
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
        const fixture = (await opts.fixtureLoader(`joint-${store.slug}.json`)) as JointSyncResponse;
        const products = fixture.products ?? fixture.data?.products ?? [];
        const items = products.flatMap(expandSyncProduct);
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

    // Strategy 1: sync-dutchie
    try {
      const dutchie = await trySync(base, "dutchie");
      if (dutchie && dutchie.length > 0) {
        const items = dutchie.flatMap(expandSyncProduct);
        return {
          status: items.length > 0 ? "ok" : "empty",
          platform: "joint",
          items,
          duration_ms: Date.now() - start,
          adapter_version: ADAPTER_VERSION,
        };
      }
    } catch (err) {
      throw err; // auth surfaces loudly
    }

    // Strategy 2: sync-jane
    try {
      const jane = await trySync(base, "jane");
      if (jane && jane.length > 0) {
        const items = jane.flatMap(expandSyncProduct);
        return {
          status: items.length > 0 ? "ok" : "empty",
          platform: "joint",
          items,
          duration_ms: Date.now() - start,
          adapter_version: ADAPTER_VERSION,
        };
      }
    } catch (err) {
      throw err;
    }

    // Strategy 3: not yet implemented. Record empty + explain.
    return {
      status: "empty",
      platform: "joint",
      items: [],
      duration_ms: Date.now() - start,
      error: "Joint sync-dutchie and sync-jane both returned no products. HTML fallback parser is not implemented (v0.9). Investigate WP nonce flow before adding.",
      adapter_version: ADAPTER_VERSION,
    };
  },
};

export const __testing = { expandSyncProduct, ADAPTER_VERSION };
