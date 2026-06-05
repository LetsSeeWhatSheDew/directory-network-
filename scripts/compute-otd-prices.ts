// scripts/compute-otd-prices.ts
// =============================================================================
// Compute price_out_the_door for every menu_item using the Phase 7 tax engine.
//
// Reads menu_items joined to dispensaries to get the city slug + thc_tier,
// writes price_out_the_door back per row. Idempotent.
//
// Usage
//   npx tsx scripts/compute-otd-prices.ts --report
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/compute-otd-prices.ts --apply
//   --only-missing  (default; skip rows with price_out_the_door already set)
//   --all           (recompute everything)
//   --batch=N       (default 500)
// =============================================================================

import { argv, exit, env } from "node:process";
import { calculateMenuOTD } from "../lib/taxRatesMenu";
import type { MenuThcTier } from "../lib/taxRatesMenu";

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const READ_KEY = SERVICE_KEY || ANON_KEY;
if (!READ_KEY) { console.error("ERROR: need SUPABASE_*_KEY in env."); exit(1); }

const APPLY = argv.includes("--apply");
if (APPLY && !SERVICE_KEY) { console.error("ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY."); exit(1); }
const ALL = argv.includes("--all");
const BATCH = Number(argv.find((a) => a.startsWith("--batch="))?.split("=")[1] || 500);

// Map dispensaries.city (master_listings naming) into lib/taxRates city slug.
const CITY_TO_SLUG: Record<string, string> = {
  "Peoria":         "peoria",
  "East Peoria":    "east-peoria",
  "Peoria Heights": "peoria-heights",
  "Pekin":          "pekin",
  "Bloomington":    "bloomington",
  "Normal":         "normal",
  "Champaign":      "champaign",
  "Urbana":         "urbana",
  "Springfield":    "springfield",
  // Canton, Bartonville, Morton, Washington: no calculator row -> fall back to nearest city slug.
  // For Canton (Fulton County, no county cannabis ROT row), this slightly overstates;
  // tax-explainer copy notes the approximation. Logged here so it's grep-able.
  "Canton":         "peoria",  // TODO: add Canton rates row (low priority)
};

interface RowIn {
  id: string;
  price_pretax: number | null;
  thc_tier: string | null;
  dispensary_id: string;
  dispensaries: { city: string } | null;
}

async function fetchBatch(offset: number): Promise<RowIn[]> {
  const filter = ALL ? "" : "&price_out_the_door=is.null";
  const url = `${SUPABASE_URL}/rest/v1/menu_items?select=id,price_pretax,thc_tier,dispensary_id,dispensaries(city)&price_pretax=not.is.null${filter}&limit=${BATCH}&offset=${offset}`;
  const res = await fetch(url, { headers: { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY!}` } });
  if (!res.ok) throw new Error(`fetch menu_items ${res.status}: ${await res.text()}`);
  return (await res.json()) as RowIn[];
}

async function patch(id: string, otd: number): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ price_out_the_door: otd }),
  });
  if (!res.ok) throw new Error(`PATCH ${id} ${res.status}: ${await res.text()}`);
}

async function main(): Promise<void> {
  console.log(`Compute OTD  apply=${APPLY}  all=${ALL}  batch=${BATCH}\n`);

  let offset = 0;
  let total = 0;
  let computed = 0;
  let skippedNoCity = 0;
  let skippedNoTier = 0;

  for (;;) {
    const rows = await fetchBatch(offset);
    if (rows.length === 0) break;
    total += rows.length;
    for (const r of rows) {
      const city = r.dispensaries?.city;
      const slug = city ? CITY_TO_SLUG[city] : undefined;
      if (!slug) { skippedNoCity++; continue; }
      if (!r.thc_tier || r.thc_tier === "unknown" || !r.price_pretax) { skippedNoTier++; continue; }
      const otd = calculateMenuOTD({
        shelfPrice: r.price_pretax,
        tier: r.thc_tier as MenuThcTier,
        citySlug: slug,
      }).outTheDoor;
      computed++;
      if (APPLY) await patch(r.id, Number(otd.toFixed(2)));
    }
    if (rows.length < BATCH) break;
    offset += BATCH;
  }

  console.log(`\nProcessed ${total} rows.`);
  console.log(`  computed:        ${computed}`);
  console.log(`  skipped no-city: ${skippedNoCity}`);
  console.log(`  skipped no-tier: ${skippedNoTier}`);
  if (!APPLY) console.log("\nDry-run. Pass --apply to PATCH price_out_the_door.");
}

main().catch((e) => { console.error(e); exit(1); });
