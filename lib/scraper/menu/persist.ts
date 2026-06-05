// lib/scraper/menu/persist.ts
// Writes a FetchResult into menu_snapshots + menu_items via Supabase REST.
//
// Breakage detection rule (from prompt + price-history pattern):
//   * Every snapshot is recorded, even empty / error -- the ledger is
//     the source of truth for "did the adapter run today?"
//   * Items are inserted ONLY if status === 'ok' and items.length > 0.
//     An empty snapshot does NOT overwrite the prior good snapshot's items.
//     The next baseline pass uses the most recent NON-EMPTY snapshot per
//     store; this happens naturally via menu_snapshots.status filtering.
//
// This file does NOT touch normalization or canonical mapping. Those run
// in Phase 5 against the persisted raw rows.

import type { FetchResult, StoreRef } from "./types";

export interface PersistResult {
  snapshot_id: string;
  inserted_items: number;
}

export interface PersistEnv {
  supabaseUrl: string;
  serviceKey: string;
}

export async function persistSnapshot(
  env: PersistEnv,
  store: StoreRef,
  result: FetchResult
): Promise<PersistResult> {
  const snapshot = await insertSnapshot(env, {
    dispensary_id: store.id,
    platform: result.platform,
    status: result.status,
    item_count: result.items.length,
    duration_ms: result.duration_ms,
    error_message: result.error ?? null,
    adapter_version: result.adapter_version,
  });

  // Empty / error snapshots are recorded but items are NOT inserted.
  // Don't overwrite a prior good day with a bad one.
  if (result.status !== "ok" || result.items.length === 0) {
    return { snapshot_id: snapshot.id, inserted_items: 0 };
  }

  const rows = result.items.map((it) => ({
    snapshot_id: snapshot.id,
    dispensary_id: store.id,
    scraped_at: snapshot.scraped_at,
    raw_name: it.raw_name,
    raw_brand: it.raw_brand,
    raw_category: it.raw_category,
    raw_weight: it.raw_weight,
    raw_price: it.raw_price,
    raw_sale_price: it.raw_sale_price,
    raw_thc: it.raw_thc,
    is_on_sale: it.is_on_sale,
    raw_payload: it.raw_payload,
    thc_tier: "unknown",
  }));

  // Insert in batches of 100 to stay well under PostgREST limits.
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const res = await fetch(`${env.supabaseUrl}/rest/v1/menu_items`, {
      method: "POST",
      headers: {
        apikey: env.serviceKey,
        Authorization: `Bearer ${env.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      throw new Error(`menu_items insert failed (${res.status}): ${await res.text()}`);
    }
    inserted += batch.length;
  }

  return { snapshot_id: snapshot.id, inserted_items: inserted };
}

interface SnapshotRow {
  id: string;
  scraped_at: string;
}

async function insertSnapshot(
  env: PersistEnv,
  body: Record<string, unknown>
): Promise<SnapshotRow> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/menu_snapshots`, {
    method: "POST",
    headers: {
      apikey: env.serviceKey,
      Authorization: `Bearer ${env.serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify([body]),
  });
  if (!res.ok) {
    throw new Error(`menu_snapshots insert failed (${res.status}): ${await res.text()}`);
  }
  const arr = (await res.json()) as SnapshotRow[];
  if (arr.length === 0) throw new Error("menu_snapshots insert returned no row");
  return arr[0];
}
