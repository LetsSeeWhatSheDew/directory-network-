// lib/scraper/runLog.ts
// scraper_runs observability shared by the CLI script and the Vercel cron.
// (Extracted 2026-09-22: the GitHub Action that used to write these rows was
// auto-disabled by GitHub for inactivity on Sep 8, and the Vercel cron that
// kept scraping daily never logged runs — so the admin panel went dark.)

import type { ScraperSummary } from "./cil-deal-scraper";

export type Trigger = "cron" | "manual" | "admin";
export type DispensaryStatus = "success" | "failed" | "skipped";

export type DispensaryResult = {
  slug: string;
  platform: string;
  status: DispensaryStatus;
  deals_added: number;
  deals_updated: number;
  deals_deactivated: number;
  error_message: string | null;
};


export async function insertScraperRun(
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

export async function patchScraperRun(
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
export function buildDispensaryResults(summary: ScraperSummary): DispensaryResult[] {
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

export function rollupStatus(results: DispensaryResult[]): "success" | "partial" | "failed" {
  const ran = results.filter((r) => r.status !== "skipped");
  if (ran.length === 0) return "success";
  const failed = ran.filter((r) => r.status === "failed").length;
  if (failed === 0) return "success";
  if (failed === ran.length) return "failed";
  return "partial";
}

/** Close out a run row from a finished summary. */
export async function finishScraperRun(
  supabaseUrl: string,
  key: string,
  runId: string,
  summary: ScraperSummary,
  startMs: number
): Promise<void> {
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
  await patchScraperRun(supabaseUrl, key, runId, {
    status: rollupStatus(results),
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - startMs,
    dispensary_results: results,
    total_deals_added: totals.added,
    total_deals_updated: totals.updated,
    total_deals_deactivated: totals.deactivated,
    error_summary: errorSummary ? errorSummary.slice(0, 2000) : null,
  });
}
