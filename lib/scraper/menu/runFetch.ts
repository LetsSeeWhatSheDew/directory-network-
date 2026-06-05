// lib/scraper/menu/runFetch.ts
// Wraps an adapter call so the snapshot ledger always gets a result --
// even on hard failure. Adapters throw AdapterAuthError / AdapterSchemaError
// to signal loud breakage; runFetch translates those to FetchResult.error.
//
// This is the place rate-limit + retry + breakage detection live, so
// individual adapters can stay thin.

import type { Adapter, FetchResult, StoreRef, AdapterOpts } from "./types";
import { AdapterAuthError, AdapterSchemaError } from "./types";

export async function runFetch(
  adapter: Adapter,
  store: StoreRef,
  opts: AdapterOpts = {}
): Promise<FetchResult> {
  const start = Date.now();
  try {
    const result = await adapter.fetch(store, opts);
    return result;
  } catch (err) {
    const duration_ms = Date.now() - start;
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const status =
      err instanceof AdapterAuthError || err instanceof AdapterSchemaError
        ? "error"
        : "error";
    return {
      status,
      platform: adapter.platform,
      items: [],
      duration_ms,
      error: msg,
      adapter_version: `${adapter.platform}@unknown`,
    };
  }
}

/** Sleep helper for politeness between adapter calls. */
export async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Randomized backoff -- delay is base * (1 + random()) so 1000ms -> 1000..2000ms. */
export function jitter(baseMs: number): number {
  return Math.round(baseMs * (1 + Math.random()));
}
