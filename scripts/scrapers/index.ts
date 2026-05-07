// scripts/scrapers/index.ts
//
// Daily scraper orchestrator. Reads dispensaries.json, dispatches to
// the right adapter per platform, ingests results, and records the run
// to scraper_runs.
//
// CLI:
//   npm run scrape                       # all dispensaries
//   npm run scrape -- --dispensary=<slug>  # single
//   npm run scrape -- --dry-run          # no DB writes (still records run)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  DispensaryConfig,
  DispensaryResult,
  Platform,
  RunStatus,
  ScrapedDeal,
} from "./types";
import { ingestDeals } from "./ingest";
import { scrape as scrapeDutchie } from "./adapters/dutchie";
import { scrape as scrapeLeafly } from "./adapters/leafly";
import { scrape as scrapeIheartjane } from "./adapters/iheartjane";
import { scrape as scrapeGeneric } from "./adapters/generic";

type CliFlags = {
  dispensary: string | null;
  dryRun: boolean;
};

function parseFlags(argv: string[]): CliFlags {
  let dispensary: string | null = null;
  let dryRun = false;
  for (const arg of argv) {
    if (arg.startsWith("--dispensary=")) {
      dispensary = arg.slice("--dispensary=".length);
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }
  return { dispensary, dryRun };
}

function loadDispensaries(): DispensaryConfig[] {
  const path = join(process.cwd(), "scripts/scrapers/dispensaries.json");
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("dispensaries.json must be a JSON array");
  }
  return parsed as DispensaryConfig[];
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "scrape: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function dispatch(
  platform: Platform,
  cfg: DispensaryConfig
): Promise<ScrapedDeal[]> {
  const url = cfg.menu_url ?? cfg.deals_url;
  if (!url) throw new Error("no menu_url or deals_url configured");

  switch (platform) {
    case "dutchie":
      return await scrapeDutchie(url);
    case "leafly":
      return await scrapeLeafly(url);
    case "iheartjane":
      return await scrapeIheartjane(url);
    case "generic": {
      if (!cfg.selectors) {
        throw new Error("skipped: no generic selectors configured");
      }
      return await scrapeGeneric(url, cfg.selectors);
    }
    default:
      throw new Error(`unknown platform: ${platform}`);
  }
}

function rollupStatus(results: DispensaryResult[]): RunStatus {
  const ran = results.filter((r) => r.status !== "skipped");
  if (ran.length === 0) return "success";
  const failed = ran.filter((r) => r.status === "failed").length;
  if (failed === 0) return "success";
  if (failed === ran.length) return "failed";
  return "partial";
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dispensaries = loadDispensaries().filter((d) =>
    flags.dispensary ? d.slug === flags.dispensary : true
  );

  if (dispensaries.length === 0) {
    if (flags.dispensary) {
      console.error(`no dispensary in dispensaries.json with slug=${flags.dispensary}`);
    } else {
      console.error("dispensaries.json is empty");
    }
    process.exit(1);
  }

  const client = flags.dryRun ? null : getClient();
  const trigger =
    process.env.SCRAPER_TRIGGER === "cron"
      ? "cron"
      : process.env.SCRAPER_TRIGGER === "admin"
        ? "admin"
        : "manual";
  const runStartedAt = new Date();

  let runId: string | null = null;
  if (client) {
    const { data: runRow, error: runErr } = await client
      .from("scraper_runs")
      .insert({
        status: "running",
        trigger,
        started_at: runStartedAt.toISOString(),
        dispensary_results: [],
      })
      .select("id")
      .single();
    if (runErr) {
      throw new Error(`scrape: scraper_runs insert failed: ${runErr.message}`);
    }
    runId = runRow.id as string;
  } else {
    runId = "dry-run";
  }

  const results: DispensaryResult[] = [];

  for (const cfg of dispensaries) {
    const r: DispensaryResult = {
      slug: cfg.slug,
      platform: cfg.platform,
      status: "success",
      deals_added: 0,
      deals_updated: 0,
      deals_deactivated: 0,
      error_message: null,
    };

    try {
      let scraped: ScrapedDeal[];
      try {
        scraped = await dispatch(cfg.platform, cfg);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.startsWith("skipped:")) {
          r.status = "skipped";
          r.error_message = msg;
          console.log(`[${cfg.slug}] skipped — ${msg}`);
          results.push(r);
          continue;
        }
        throw err;
      }

      console.log(`[${cfg.slug}] platform=${cfg.platform} scraped ${scraped.length} deals`);

      if (flags.dryRun || !client) {
        // Log each deal for visual sanity.
        for (const d of scraped) {
          console.log(`  - ${d.title}${d.discount_value != null ? ` (${d.discount_value}${d.discount_unit === "percent" ? "%" : ""})` : ""}`);
        }
        r.deals_added = scraped.length;
      } else {
        const ingest = await ingestDeals(
          cfg.slug,
          cfg.platform,
          scraped,
          runStartedAt,
          { client }
        );
        r.deals_added = ingest.added;
        r.deals_updated = ingest.updated;
        r.deals_deactivated = ingest.deactivated;
      }
    } catch (err) {
      const msg = (err as Error).message;
      r.status = "failed";
      r.error_message = msg.slice(0, 500);
      console.error(`[${cfg.slug}] FAILED — ${msg}`);
    }

    results.push(r);
  }

  const status = rollupStatus(results);
  const totals = results.reduce(
    (acc, r) => ({
      added: acc.added + r.deals_added,
      updated: acc.updated + r.deals_updated,
      deactivated: acc.deactivated + r.deals_deactivated,
    }),
    { added: 0, updated: 0, deactivated: 0 }
  );

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - runStartedAt.getTime();
  const errorSummary = results
    .filter((r) => r.status === "failed")
    .map((r) => `${r.slug}: ${r.error_message}`)
    .join("; ") || null;

  console.log("");
  console.log(`run status: ${status}`);
  console.log(
    `totals: added=${totals.added} updated=${totals.updated} deactivated=${totals.deactivated} duration=${Math.round(durationMs / 1000)}s`
  );

  if (client && runId) {
    const { error: upErr } = await client
      .from("scraper_runs")
      .update({
        finished_at: finishedAt.toISOString(),
        status,
        dispensary_results: results,
        total_deals_added: totals.added,
        total_deals_updated: totals.updated,
        total_deals_deactivated: totals.deactivated,
        duration_ms: durationMs,
        error_summary: errorSummary,
      })
      .eq("id", runId);
    if (upErr) {
      console.error(`scrape: scraper_runs update failed: ${upErr.message}`);
    }
  }

  process.exit(status === "success" ? 0 : 1);
}

main().catch((err) => {
  console.error("scrape orchestrator crashed:", err);
  process.exit(1);
});
