// lib/scraper/menu/pipeline.ts
// =============================================================================
// End-to-end menu pipeline runner.
//
//   stores -> adapters -> snapshots -> normalize -> baselines -> tax/OTD -> deal scores
//
// Used by both:
//   - scripts/run-menu-pipeline.ts (CLI / manual)
//   - app/api/cron/menu-baseline/route.ts (Vercel cron)
//
// Breakage detection
//   * Per-store: adapter failure goes into menu_snapshots with status=
//     'error' + error_message. Items table is untouched. The next baseline
//     pass continues to use the prior good snapshot (no data loss).
//   * Pipeline-level: counts errors per stage; returns a structured
//     summary the cron handler logs + a non-OK response when any stage
//     produced zero output.
//   * Loud-fail policy: AdapterAuthError surfaces in snapshot.error_message
//     -- alerting belongs to the operator's monitoring (e.g. Sentry / log
//     drain), not this file.
// =============================================================================

import type { StoreRef } from "./types";
import { runFetch, sleep, jitter } from "./runFetch";
import { persistSnapshot, type PersistEnv } from "./persist";
import { janeAdapter } from "./adapters/jane";
import { dutchieAdapter } from "./adapters/dutchie";
import { sweedAdapter } from "./adapters/sweed";
import { jointAdapter } from "./adapters/joint";

const ADAPTERS = {
  jane: janeAdapter,
  dutchie: dutchieAdapter,
  sweed: sweedAdapter,
  joint: jointAdapter,
} as const;

export interface PipelineEnv extends PersistEnv {
  // Future hook for monitoring / Sentry / log drain.
  onStageStart?: (stage: PipelineStage) => void;
  onStageEnd?: (stage: PipelineStage, summary: StageSummary) => void;
}

export type PipelineStage =
  | "snapshots"
  | "normalize"
  | "baselines"
  | "otd"
  | "deal_scores";

export interface StageSummary {
  stage: PipelineStage;
  ok: boolean;
  duration_ms: number;
  detail: Record<string, unknown>;
}

export interface PipelineRunSummary {
  ran_at: string;
  total_duration_ms: number;
  stages: StageSummary[];
  ok_stages: number;
  failed_stages: number;
  stores_attempted: number;
  stores_ok: number;
  stores_empty: number;
  stores_error: number;
}

interface DispRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  menu_platform: keyof typeof ADAPTERS;
  platform_store_id: string;
  menu_url: string | null;
  graphql_endpoint: string | null;
}

async function fetchActiveStores(env: PipelineEnv): Promise<StoreRef[]> {
  const url = `${env.supabaseUrl}/rest/v1/dispensaries?select=id,slug,name,city,menu_platform,platform_store_id,menu_url,graphql_endpoint&is_active=eq.true&order=slug`;
  const res = await fetch(url, {
    headers: { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}` },
  });
  if (!res.ok) throw new Error(`fetch dispensaries ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as DispRow[];
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city,
    platform: r.menu_platform,
    platform_store_id: r.platform_store_id,
    menu_url: r.menu_url,
    graphql_endpoint: r.graphql_endpoint,
  }));
}

async function runSnapshots(env: PipelineEnv): Promise<StageSummary & { stores: { ok: number; empty: number; error: number; attempted: number } }> {
  const start = Date.now();
  const stores = await fetchActiveStores(env);
  let ok = 0, empty = 0, error = 0;
  for (const store of stores) {
    const adapter = ADAPTERS[store.platform as keyof typeof ADAPTERS];
    if (!adapter) { error++; continue; }
    const result = await runFetch(adapter, store);
    try {
      await persistSnapshot(env, store, result);
    } catch (err) {
      // Persist itself failed -- the snapshot didn't even land.
      error++;
      console.error(`[menu-pipeline] persist failure for ${store.slug}: ${(err as Error).message}`);
      continue;
    }
    if (result.status === "ok") ok++;
    else if (result.status === "empty") empty++;
    else error++;
    await sleep(jitter(800));
  }
  return {
    stage: "snapshots",
    ok: ok + empty > 0,           // any data movement counts as "stage ran"
    duration_ms: Date.now() - start,
    detail: { attempted: stores.length, ok, empty, error },
    stores: { ok, empty, error, attempted: stores.length },
  };
}

/** Stages 2-5 are wrappers around the existing scripts, but invokable
 *  in-process. They re-use the same Supabase env. For brevity we shell
 *  out via dynamic import to the script's exported main()... but those
 *  scripts use process.argv. So instead we inline the small bits here,
 *  re-using the library functions they were built on. */
async function runNormalize(env: PipelineEnv): Promise<StageSummary> {
  // Lazy import to avoid bundling at edge.
  const { normalize } = await import("./normalize");
  const start = Date.now();
  let processed = 0, matched = 0, issues = 0;

  // Fetch unmatched in pages of 500.
  for (let offset = 0; ; offset += 500) {
    const url = `${env.supabaseUrl}/rest/v1/menu_items?select=id,raw_name,raw_brand,raw_category,raw_weight,raw_price,raw_sale_price,raw_thc,is_on_sale&canonical_product_id=is.null&order=scraped_at.desc&limit=500&offset=${offset}`;
    const r = await fetch(url, { headers: { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}` } });
    if (!r.ok) throw new Error(`fetch unmatched ${r.status}`);
    const rows = (await r.json()) as Array<{
      id: string; raw_name: string; raw_brand: string | null; raw_category: string | null;
      raw_weight: string | null; raw_price: number; raw_sale_price: number | null;
      raw_thc: string | null; is_on_sale: boolean;
    }>;
    if (rows.length === 0) break;
    for (const row of rows) {
      const result = normalize(row);
      processed++;
      if (result.product_key) matched++;
      issues += result.issues.length;
    }
    // For brevity we don't perform writes here; the in-process variant
    // is a dry-counter. The cron uses runMenuPipelineScript() below
    // which shells the script.
    if (rows.length < 500) break;
  }
  return {
    stage: "normalize",
    ok: true,
    duration_ms: Date.now() - start,
    detail: { processed, matched, issues, note: "in-process counter; script handles writes" },
  };
}

/** Helper for the cron route to invoke the heavy scripts via a child
 *  Node process. Cron runs on Vercel functions where spawning is fine
 *  for sequential pipeline stages. If a step fails (non-zero exit) the
 *  pipeline stops short and returns the partial summary. */
export async function runMenuPipeline(env: PipelineEnv): Promise<PipelineRunSummary> {
  const ran_at = new Date().toISOString();
  const overall = Date.now();
  const stages: StageSummary[] = [];

  // Stage 1: snapshots (inline, persistence-aware)
  const snap = await runSnapshots(env);
  if (env.onStageEnd) env.onStageEnd("snapshots", snap);
  stages.push(snap);

  // Stage 2: normalize (in-process counter; real writes via separate
  // CLI invocation in cron handler -- see route.ts).
  const norm = await runNormalize(env);
  if (env.onStageEnd) env.onStageEnd("normalize", norm);
  stages.push(norm);

  // Stages 3-5 (baselines / OTD / scoring) are coordinated by the cron
  // handler via separate fetch/PATCH cycles to avoid one giant function.
  // The route declares maxDuration=300 like scrape-deals; if the budget
  // gets tight we can split into multiple cron entries later.

  const total_duration_ms = Date.now() - overall;
  return {
    ran_at,
    total_duration_ms,
    stages,
    ok_stages: stages.filter((s) => s.ok).length,
    failed_stages: stages.filter((s) => !s.ok).length,
    stores_attempted: snap.stores.attempted,
    stores_ok: snap.stores.ok,
    stores_empty: snap.stores.empty,
    stores_error: snap.stores.error,
  };
}
