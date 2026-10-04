// lib/scraperFreshness.ts — pure helpers (no fetch, no keys) so they can be
// unit tested. The morning website check can be fresh while the menu reader
// (most of the deals) is days behind; /status must not call that "up to date".
import type { ScraperRun } from "./scraperRuns";

const NAMES: Record<string, string> = { cron: "Morning website check", manual: "Menu reader" };

/** Most recent finished (success or partial) run from one checker. */
export function latestGoodRunFor(runs: ScraperRun[], trigger: string): ScraperRun | null {
  let best: ScraperRun | null = null;
  for (const r of runs) {
    if (r.trigger !== trigger || (r.status !== "success" && r.status !== "partial") || !r.finished_at) continue;
    if (!best || +new Date(r.finished_at) > +new Date(best.finished_at as string)) best = r;
  }
  return best;
}

/** Freshness per checker that has run in the window ("cron" and "manual" only). */
export function checkerFreshness(
  runs: ScraperRun[],
  maxHours = 30,
  now = Date.now()
): { trigger: string; name: string; lastFinished: string | null; fresh: boolean }[] {
  const triggers = Array.from(new Set(runs.map((r) => r.trigger).filter((t) => t in NAMES)));
  return triggers.map((t) => {
    const lastFinished = latestGoodRunFor(runs, t)?.finished_at || null;
    const fresh = !!lastFinished && (now - new Date(lastFinished).getTime()) / 3600000 <= maxHours;
    return { trigger: t, name: NAMES[t], lastFinished, fresh };
  });
}
