// scripts/run-menu-snapshot.ts
// =============================================================================
// One-shot menu-snapshot runner.
//
// Usage
//   # dry-run live fetch (no DB writes) for a single store slug
//   npx tsx scripts/run-menu-snapshot.ts --slug=nuera-east-peoria
//
//   # live + persist
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/run-menu-snapshot.ts \
//     --slug=nuera-east-peoria --apply
//
//   # offline (fixture) test, no network
//   npx tsx scripts/run-menu-snapshot.ts --slug=nuera-east-peoria --fixture
//
//   # all 10 stores, sequentially, dry-run
//   npx tsx scripts/run-menu-snapshot.ts --all
//
// Use this as the manual / debugging entry point. Phase 8 wires the full
// pipeline (snapshot -> normalize -> baseline -> tax -> deal score) behind
// a scheduler.
// =============================================================================

import { argv, exit, env } from "node:process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { StoreRef } from "../lib/scraper/menu/types";
import { runFetch, sleep, jitter } from "../lib/scraper/menu/runFetch";
import { persistSnapshot, type PersistEnv } from "../lib/scraper/menu/persist";

import { janeAdapter } from "../lib/scraper/menu/adapters/jane";
import { dutchieAdapter } from "../lib/scraper/menu/adapters/dutchie";
import { sweedAdapter } from "../lib/scraper/menu/adapters/sweed";
import { jointAdapter } from "../lib/scraper/menu/adapters/joint";

const ADAPTERS = {
  jane: janeAdapter,
  dutchie: dutchieAdapter,
  sweed: sweedAdapter,
  joint: jointAdapter,
} as const;

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SLUG = argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const ALL = argv.includes("--all");
const APPLY = argv.includes("--apply");
const FIXTURE = argv.includes("--fixture");

if (!SLUG && !ALL) {
  console.error("ERROR: pass --slug=<dispensary-slug> or --all.");
  exit(1);
}
if (APPLY && !SERVICE_KEY) {
  console.error("ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY.");
  exit(1);
}

const READ_KEY = SERVICE_KEY || ANON_KEY;
if (!READ_KEY) {
  console.error("ERROR: set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.");
  exit(1);
}

async function loadStores(slug?: string): Promise<StoreRef[]> {
  const q = slug
    ? `slug=eq.${encodeURIComponent(slug)}&is_active=eq.true`
    : `is_active=eq.true&order=slug`;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/dispensaries?select=id,slug,name,city,menu_platform,platform_store_id,menu_url,graphql_endpoint,jane_cluster&${q}`,
    { headers: { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY!}` } }
  );
  if (!res.ok) throw new Error(`fetch dispensaries ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as Array<{
    id: string;
    slug: string;
    name: string;
    city: string;
    menu_platform: string;
    platform_store_id: string;
    menu_url: string | null;
    graphql_endpoint: string | null;
    jane_cluster: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city,
    platform: r.menu_platform as StoreRef["platform"],
    platform_store_id: r.platform_store_id,
    menu_url: r.menu_url,
    graphql_endpoint: r.graphql_endpoint,
    jane_cluster: r.jane_cluster,
  }));
}

function fixtureLoader(): (name: string) => Promise<unknown> {
  return async (name: string) =>
    JSON.parse(
      await readFile(join(process.cwd(), "tests", "fixtures", "menu", name), "utf8")
    );
}

async function runOne(store: StoreRef): Promise<void> {
  const adapter = ADAPTERS[store.platform as keyof typeof ADAPTERS];
  if (!adapter) {
    console.log(`  [${store.slug}] no adapter yet for platform=${store.platform} -- skip`);
    return;
  }

  console.log(`\n[${store.slug}] platform=${store.platform} store_id=${store.platform_store_id}`);
  const result = await runFetch(adapter, store, FIXTURE ? { fixtureLoader: fixtureLoader() } : {});
  console.log(
    `  status=${result.status}  items=${result.items.length}  duration=${result.duration_ms}ms  v=${result.adapter_version}` +
      (result.error ? `\n  error: ${result.error}` : "")
  );

  if (result.items.length > 0) {
    const sample = result.items.slice(0, 3).map((i) => ({
      brand: i.raw_brand,
      name: i.raw_name,
      weight: i.raw_weight,
      price: i.raw_price,
      sale: i.raw_sale_price,
      thc: i.raw_thc,
    }));
    console.log("  sample:", sample);
  }

  if (APPLY) {
    const env: PersistEnv = { supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY! };
    const p = await persistSnapshot(env, store, result);
    console.log(`  persisted: snapshot=${p.snapshot_id}  inserted=${p.inserted_items}`);
  }
}

async function main(): Promise<void> {
  const stores = await loadStores(SLUG);
  if (stores.length === 0) {
    console.error("No stores matched.");
    exit(1);
  }
  console.log(`Running ${stores.length} store(s)  apply=${APPLY}  fixture=${FIXTURE}`);
  for (const s of stores) {
    try {
      await runOne(s);
    } catch (err) {
      console.error(`  [${s.slug}] runOne threw:`, (err as Error).message);
    }
    if (stores.length > 1) await sleep(jitter(800));
  }
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
