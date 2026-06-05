// scripts/seed-dispensaries-from-registry.ts
// =============================================================================
// Seed the `dispensaries` table from reference-data/dispensary_registry.json.
//
// Idempotent: ON CONFLICT (slug) DO UPDATE — re-running picks up any
// registry edits Cowork lands later. License number is updated when the
// VERIFY_IDFPR sentinel is replaced with a real number.
//
// Usage
//   # dry-run (default — prints proposed upserts)
//   npx tsx scripts/seed-dispensaries-from-registry.ts
//
//   # apply
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-dispensaries-from-registry.ts --apply
//
// Requires the Phase 1 migration (sql/menu-baseline-schema.sql) to be
// applied first.
// =============================================================================

import { argv, exit, env } from "node:process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface RegistryEntry {
  slug: string;
  name: string;
  license_number: string;   // sometimes 'VERIFY_IDFPR'
  license_holder?: string;
  address: string;
  city: string;
  county?: string;
  zip?: string;
  phone?: string;
  lat: number;
  lng: number;
  menu_platform: "jane" | "dutchie" | "sweed" | "joint" | "other";
  platform_store_id: string;
  menu_url?: string;
  graphql_endpoint?: string;
  shadow_dom?: boolean;
  geocode_status?: "approx" | "verified" | "failed";
  note?: string;
  edge_note?: string;
}

interface Registry {
  _meta?: Record<string, unknown>;
  dispensaries: RegistryEntry[];
}

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = argv.includes("--apply");

if (APPLY && !SERVICE_KEY) {
  console.error("ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY in env.");
  exit(1);
}

const REGISTRY_PATH = join(
  process.cwd(),
  "reference-data",
  "dispensary_registry.json"
);

function loadRegistry(): Registry {
  const raw = readFileSync(REGISTRY_PATH, "utf8");
  const parsed = JSON.parse(raw) as Registry;
  if (!Array.isArray(parsed.dispensaries)) {
    throw new Error(`Registry shape unexpected at ${REGISTRY_PATH}`);
  }
  return parsed;
}

function toDbRow(e: RegistryEntry) {
  const notes = [e.note, e.edge_note].filter(Boolean).join(" | ") || null;
  return {
    slug: e.slug,
    name: e.name,
    // Keep VERIFY sentinels as null in DB; preserve real license numbers.
    license_number: e.license_number.startsWith("VERIFY")
      ? null
      : e.license_number,
    license_holder: e.license_holder ?? null,
    address: e.address ?? null,
    city: e.city,
    county: e.county ?? null,
    state: "IL",
    zip: e.zip ?? null,
    phone: e.phone ?? null,
    lat: e.lat,
    lng: e.lng,
    geocode_status: e.geocode_status ?? "approx",
    menu_platform: e.menu_platform,
    platform_store_id: e.platform_store_id,
    menu_url: e.menu_url ?? null,
    graphql_endpoint: e.graphql_endpoint ?? null,
    shadow_dom: e.shadow_dom ?? false,
    notes,
    is_active: true,
  };
}

async function upsert(rows: ReturnType<typeof toDbRow>[]): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/dispensaries?on_conflict=slug`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY!,
        Authorization: `Bearer ${SERVICE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(rows),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upsert failed: ${res.status} ${body}`);
  }
  const result = (await res.json()) as unknown[];
  console.log(`  upserted ${result.length} rows`);
}

async function main(): Promise<void> {
  const registry = loadRegistry();
  const rows = registry.dispensaries.map(toDbRow);

  console.log(`\nRegistry: ${rows.length} dispensaries\n`);

  for (const r of rows) {
    const lic = r.license_number ?? "(VERIFY)";
    console.log(
      `  ${r.slug.padEnd(32)} ${r.menu_platform.padEnd(8)} ${lic.padEnd(20)} ${r.city}`
    );
  }

  if (!APPLY) {
    console.log("\nDry-run. Pass --apply to upsert into Supabase.");
    return;
  }

  console.log("\nApplying upsert...");
  await upsert(rows);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
