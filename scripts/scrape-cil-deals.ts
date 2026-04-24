// scripts/scrape-cil-deals.ts
// =============================================================================
// CLI entrypoint for the direct-source CIL deal scraper.
// Shared scraper core lives in lib/scraper/cil-deal-scraper.ts.
// The same module is called from the Vercel cron route at
// app/api/cron/scrape-deals/route.ts.
//
// Run
//   npx tsx scripts/scrape-cil-deals.ts --dry-run
//   npx tsx scripts/scrape-cil-deals.ts --live --apply
// =============================================================================

import { argv, exit, env } from "node:process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { runCilScrape } from "../lib/scraper/cil-deal-scraper";

function loadDotenv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      )
        val = val.slice(1, -1);
      if (!env[m[1]]) env[m[1]] = val;
    }
  } catch {
    /* no .env.local */
  }
}
loadDotenv();

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_SERVICE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

const LIVE = argv.includes("--live");
const APPLY = argv.includes("--apply");
const OUTPUT_FLAG = argv.find((a) => a.startsWith("--out="))?.split("=")[1];
const MAX_FLAG = argv.find((a) => a.startsWith("--max="))?.split("=")[1];
const MAX_LISTINGS = Math.max(1, Math.min(30, parseInt(MAX_FLAG || "30", 10) || 30));

if (LIVE && APPLY && !SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: --live --apply requires SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) in env.local"
  );
  exit(1);
}

const mode = LIVE ? "live" : "dry";
console.log(`scrape-cil-deals mode=${mode}${APPLY ? "+apply" : ""} max=${MAX_LISTINGS}`);

async function main() {
  const summary = await runCilScrape({
    supabaseUrl: SUPABASE_URL,
    serviceKey: SUPABASE_SERVICE_KEY,
    mode,
    apply: APPLY,
    maxListings: MAX_LISTINGS,
  });

  const outPath =
    OUTPUT_FLAG ||
    `/tmp/cil-scrape-${mode}${APPLY ? "-apply" : ""}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
  try {
    const dir = outPath.substring(0, outPath.lastIndexOf("/"));
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  } catch {}
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`Summary written to ${outPath}`);
  console.log(
    `Totals: processed=${summary.listings_processed} found=${summary.deals_found.length} insert=${summary.deals_inserted.length} update=${summary.deals_updated.length} aged=${summary.deals_aged.length} errors=${summary.fetch_errors.length}`
  );
}

main().catch((err) => {
  console.error("FATAL", err);
  exit(1);
});
