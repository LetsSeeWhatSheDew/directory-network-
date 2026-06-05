// lib/scraper/menu/types.ts
// Shared adapter contract for the menu baseline pipeline.
//
// Every platform adapter implements the same shape:
//
//   fetch(store)  ->  raw_items[]
//
// Adapters are RAW only. They do not normalize, dedup, tax, or score.
// Normalization (Phase 5), baselining (Phase 6), tax (Phase 7) all run
// off the raw_items table afterward. Keeping adapters thin makes them
// easy to fix when a platform changes its schema (which happens often).

export type Platform = "jane" | "dutchie" | "sweed" | "joint" | "other";

/** What the pipeline knows about one storefront before fetching. */
export interface StoreRef {
  id: string;                     // dispensaries.id (uuid)
  slug: string;                   // dispensaries.slug
  name: string;
  city: string;
  platform: Platform;
  platform_store_id: string;      // Jane storeId or slug, Dutchie dispensaryId/slug, etc.
  menu_url: string | null;
  graphql_endpoint: string | null;
  /** Jane only: which Algolia cluster this store belongs to. Defaults to
   *  'default' if not set. Currently 'default' (nuEra + Beyond Hello) or
   *  'rise_gti' (RISE Canton -- separate Algolia app/key/index). */
  jane_cluster?: string | null;
}

/** One row coming back from an adapter. Mirrors the raw_* columns on menu_items. */
export interface RawMenuItem {
  raw_name: string;
  raw_brand: string | null;
  raw_category: string | null;
  raw_weight: string | null;       // "3.5g", "eighth", "1g cart"...
  raw_price: number;               // shelf price (pre-tax) in USD
  raw_sale_price: number | null;   // non-null when listed on sale
  raw_thc: string | null;          // "22.5%", "20-24%", "THC: 21.8% / CBD: 0.4%"
  is_on_sale: boolean;
  raw_payload: unknown;            // the original record verbatim (stored as jsonb)
}

export type SnapshotStatus = "ok" | "partial" | "empty" | "error";

export interface FetchResult {
  status: SnapshotStatus;
  platform: Platform;
  items: RawMenuItem[];
  duration_ms: number;
  error?: string;
  adapter_version: string;         // "jane@1.0.0" -- bump on parser changes
}

/** Adapter interface. fetch must NEVER throw to caller -- always return a
 *  FetchResult so the snapshot ledger captures the failure. */
export interface Adapter {
  platform: Platform;
  fetch(store: StoreRef, opts?: AdapterOpts): Promise<FetchResult>;
}

export interface AdapterOpts {
  /** Inject a fixture-loader for offline tests. If provided, adapters use
   *  this instead of hitting the network. */
  fixtureLoader?: (fixtureName: string) => Promise<unknown>;
  /** Optional override for an embedded API key (e.g. Jane Algolia key)
   *  so the same adapter works in test + prod without code changes. */
  apiKey?: string;
}

/** Throw inside an adapter to short-circuit to a loud failure. The
 *  framework's `runFetch` wrapper converts this into an error FetchResult. */
export class AdapterAuthError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AdapterAuthError";
  }
}

export class AdapterSchemaError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AdapterSchemaError";
  }
}
