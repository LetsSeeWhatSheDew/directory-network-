// lib/scraperRuns.ts (server-only)
// The check log for /status: every scraper run (scraper_runs), read with the
// service key because anon can't see this table. Returns null when the key
// isn't configured or the read fails, so the page can hide the section
// instead of showing a broken one.
//
// Raw error text never leaves this file: publicPhrase() maps it to one of a
// few plain phrases before anything renders.

import "server-only";
import { publicPhrase, storeOk, noDealsReasonBySlug } from "./scraperText";
export { publicPhrase, storeOk, noDealsReasonBySlug };

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export type RunStatus = "running" | "success" | "partial" | "failed";

export type StoreResult = {
  slug: string;
  status: string | null;
  platform: string | null;
  deals_added: number | null;
  deals_updated: number | null;
  deals_deactivated: number | null;
  error_message: string | null;
};

export type ScraperRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
  trigger: "cron" | "manual" | "admin" | string;
  dispensary_results: StoreResult[] | null;
  total_deals_added: number | null;
  total_deals_updated: number | null;
  total_deals_deactivated: number | null;
  duration_ms: number | null;
  error_summary: string | null;
};

/** Runs started in the last `days` days, newest first. null = unavailable. */
export async function getScraperRuns(days = 30): Promise<ScraperRun[] | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) return null;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/scraper_runs?select=id,started_at,finished_at,status,trigger,dispensary_results,total_deals_added,total_deals_updated,total_deals_deactivated,duration_ms,error_summary&started_at=gte.${encodeURIComponent(since)}&order=started_at.desc&limit=300`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 600 } }
    );
    if (!r.ok) return null;
    const rows = (await r.json()) as ScraperRun[];
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

/** Which checker ran, in words a shopper understands. */
export function checkerName(trigger: string): string {
  if (trigger === "cron") return "Morning website check";
  if (trigger === "manual") return "Menu reader";
  return "Check started by our team";
}

/** A run still "running" hours later never finished; say so. */
function stalled(run: ScraperRun): boolean {
  return run.status === "running" && Date.now() - new Date(run.started_at).getTime() > 2 * 3600000;
}

export function runStatusWords(run: ScraperRun): { text: string; tone: "ok" | "note" | "stop" } {
  if (stalled(run)) return { text: "Stopped before finishing", tone: "stop" };
  switch (run.status) {
    case "success":
      return { text: "Finished", tone: "ok" };
    case "partial":
      return { text: "Finished, some stores didn't load", tone: "note" };
    case "running":
      return { text: "Running now", tone: "note" };
    case "failed":
      return /abandon|never finished/i.test(run.error_summary || "")
        ? { text: "Stopped before finishing", tone: "stop" }
        : { text: "Didn't finish", tone: "stop" };
    default:
      return { text: "Unknown", tone: "note" };
  }
}

export function durationWords(ms: number | null | undefined, run?: ScraperRun): string {
  let v = ms;
  if ((v == null || !(v > 0)) && run?.finished_at && run.status === "success")
    v = new Date(run.finished_at).getTime() - new Date(run.started_at).getTime();
  if (v == null || !(v > 0)) return "—";
  const s = Math.round(v / 1000);
  if (s < 60) return `${s} sec`;
  const m = Math.round(s / 60);
  if (m < 90) return `${m} min`;
  return `${Math.round(m / 60)} hr`;
}


/** Latest time each store was checked successfully (finished_at of the run). */
export function lastGoodCheckBySlug(runs: ScraperRun[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const run of runs) {
    const at = run.finished_at || run.started_at;
    if (run.status === "running" || run.status === "failed") continue;
    for (const r of run.dispensary_results || []) {
      if (!r?.slug || !storeOk(r)) continue;
      const cur = out.get(r.slug);
      if (!cur || +new Date(at) > +new Date(cur)) out.set(r.slug, at);
    }
  }
  return out;
}


/** Most recent run that finished (success or partial). */
export function latestGoodRun(runs: ScraperRun[]): ScraperRun | null {
  let best: ScraperRun | null = null;
  for (const r of runs) {
    if ((r.status !== "success" && r.status !== "partial") || !r.finished_at) continue;
    if (!best || +new Date(r.finished_at) > +new Date(best.finished_at as string)) best = r;
  }
  return best;
}

