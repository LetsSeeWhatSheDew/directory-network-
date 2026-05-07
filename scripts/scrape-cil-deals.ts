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
//
// Observability: when invoked with `--live --apply`, the script writes a
// row to `scraper_runs` (status='running') before calling runCilScrape,
// then PATCHes that row with totals + per-dispensary results when the
// run finishes. Powers /admin/scrapers. Dry-runs do NOT write — they're
// observable via stdout only.
// =============================================================================

import { argv, exit, env } from "node:process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { runCilScrape, type ScraperSummary } from "../lib/scraper/cil-deal-scraper";

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
const RECORDS_RUN = LIVE && APPLY && !!SUPABASE_SERVICE_KEY;
console.log(`scrape-cil-deals mode=${mode}${APPLY ? "+apply" : ""} max=${MAX_LISTINGS}`);

// ----------------------------- scraper_runs observability ---------------------

type Trigger = "cron" | "manual" | "admin";
type DispensaryStatus = "success" | "failed" | "skipped";

type DispensaryResult = {
  slug: string;
  platform: string;
  status: DispensaryStatus;
  deals_added: number;
  deals_updated: number;
  deals_deactivated: number;
  error_message: string | null;
};

function resolveTrigger(): Trigger {
  const t = env.SCRAPER_TRIGGER;
  if (t === "cron") return "cron";
  if (t === "admin") return "admin";
  return "manual";
}

async function insertScraperRun(
  supabaseUrl: string,
  key: string,
  trigger: Trigger
): Promise<string | null> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/scraper_runs`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "running",
        trigger,
        dispensary_results: [],
      }),
    });
    if (!res.ok) {
      console.error(`scraper_runs insert failed: ${res.status} ${await res.text()}`);
      return null;
    }
    const data = (await res.json()) as Array<{ id: string }>;
    return data?.[0]?.id ?? null;
  } catch (err) {
    console.error(`scraper_runs insert error: ${(err as Error).message}`);
    return null;
  }
}

async function patchScraperRun(
  supabaseUrl: string,
  key: string,
  runId: string,
  body: Record<string, unknown>
): Promise<void> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/scraper_runs?id=eq.${runId}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`scraper_runs update failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error(`scraper_runs update error: ${(err as Error).message}`);
  }
}

// Build per-dispensary results from the summary returned by runCilScrape.
// The core scraper tracks events globally (deals_inserted, deals_updated,
// deals_aged, fetch_errors); we group those by listing_slug to fit the
// admin panel's row-per-dispensary shape. All entries get platform="website"
// — direct dispensary websites are the only source allowed.
function buildDispensaryResults(summary: ScraperSummary): DispensaryResult[] {
  const bySlug = new Map<string, DispensaryResult>();

  const ensure = (slug: string): DispensaryResult => {
    let r = bySlug.get(slug);
    if (!r) {
      r = {
        slug,
        platform: "website",
        status: "success",
        deals_added: 0,
        deals_updated: 0,
        deals_deactivated: 0,
        error_message: null,
      };
      bySlug.set(slug, r);
    }
    return r;
  };

  for (const e of summary.fetch_errors) {
    const r = ensure(e.slug);
    r.error_message = e.error;
    r.status = e.error.startsWith("skipped:") ? "skipped" : "failed";
  }
  for (const i of summary.deals_inserted) {
    const r = ensure(i.slug);
    r.deals_added += 1;
  }
  for (const u of summary.deals_updated) {
    const r = ensure(u.slug);
    r.deals_updated += 1;
  }
  for (const a of summary.deals_aged) {
    const r = ensure(a.slug);
    r.deals_deactivated += 1;
  }

  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

function rollupStatus(results: DispensaryResult[]): "success" | "partial" | "failed" {
  const ran = results.filter((r) => r.status !== "skipped");
  if (ran.length === 0) return "success";
  const failed = ran.filter((r) => r.status === "failed").length;
  if (failed === 0) return "success";
  if (failed === ran.length) return "failed";
  return "partial";
}

// ----------------------------- main ------------------------------------------

async function main() {
  const trigger = resolveTrigger();
  const startMs = Date.now();

  let runId: string | null = null;
  if (RECORDS_RUN) {
    runId = await insertScraperRun(SUPABASE_URL, SUPABASE_SERVICE_KEY!, trigger);
    if (runId) {
      console.log(`scraper_runs id=${runId} trigger=${trigger}`);
    }
  }

  let summary: ScraperSummary;
  try {
    summary = await runCilScrape({
      supabaseUrl: SUPABASE_URL,
      serviceKey: SUPABASE_SERVICE_KEY,
      mode,
      apply: APPLY,
      maxListings: MAX_LISTINGS,
    });
  } catch (err) {
    if (RECORDS_RUN && runId) {
      await patchScraperRun(SUPABASE_URL, SUPABASE_SERVICE_KEY!, runId, {
        status: "failed",
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
        error_summary: String((err as Error).message).slice(0, 500),
      });
    }
    throw err;
  }

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

  if (RECORDS_RUN && runId) {
    const results = buildDispensaryResults(summary);
    const totals = results.reduce(
      (acc, r) => ({
        added: acc.added + r.deals_added,
        updated: acc.updated + r.deals_updated,
        deactivated: acc.deactivated + r.deals_deactivated,
      }),
      { added: 0, updated: 0, deactivated: 0 }
    );
    const errorSummary =
      results
        .filter((r) => r.status === "failed" && r.error_message)
        .map((r) => `${r.slug}: ${r.error_message}`)
        .join("; ") || null;

    await patchScraperRun(SUPABASE_URL, SUPABASE_SERVICE_KEY!, runId, {
      status: rollupStatus(results),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startMs,
      dispensary_results: results,
      total_deals_added: totals.added,
      total_deals_updated: totals.updated,
      total_deals_deactivated: totals.deactivated,
      error_summary: errorSummary,
    });
  }
}

main().catch((err) => {
  console.error("FATAL", err);
  exit(1);
});
