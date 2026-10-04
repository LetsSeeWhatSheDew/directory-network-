// The status banner must not say "Up to date" when the website check is
// current but the menu reader (most of the deals) is days behind.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkerFreshness, latestGoodRunFor } from "../../lib/scraperFreshness";
import type { ScraperRun } from "../../lib/scraperRuns";

const NOW = Date.parse("2026-10-04T13:00:00Z");
const h = (hrs: number) => new Date(NOW - hrs * 3600000).toISOString();
const run = (id: string, trigger: string, status: ScraperRun["status"], finishedHoursAgo: number | null): ScraperRun => ({
  id, trigger, status,
  started_at: h((finishedHoursAgo ?? 1) + 0.5),
  finished_at: finishedHoursAgo == null ? null : h(finishedHoursAgo),
  dispensary_results: null, total_deals_added: 0, total_deals_updated: 0,
  total_deals_deactivated: 0, duration_ms: null, error_summary: null,
});

test("website check fresh + menu reader 6 days old → menu reader is behind", () => {
  const runs = [run("a", "cron", "success", 8), run("b", "manual", "failed", 140), run("c", "manual", "success", 150)];
  const f = checkerFreshness(runs, 30, NOW);
  assert.equal(f.find((c) => c.trigger === "cron")?.fresh, true);
  const menu = f.find((c) => c.trigger === "manual");
  assert.equal(menu?.fresh, false);
  assert.equal(menu?.lastFinished, h(150));
});

test("both checkers current → nothing behind", () => {
  const runs = [run("a", "cron", "success", 8), run("b", "manual", "partial", 2)];
  assert.ok(checkerFreshness(runs, 30, NOW).every((c) => c.fresh));
});

test("a checker with only failed runs reports no finish time", () => {
  const runs = [run("a", "cron", "success", 8), run("b", "manual", "failed", 5)];
  const menu = checkerFreshness(runs, 30, NOW).find((c) => c.trigger === "manual");
  assert.equal(menu?.lastFinished, null);
  assert.equal(menu?.fresh, false);
  assert.equal(latestGoodRunFor(runs, "manual"), null);
});

test("admin-started runs don't count as a checker", () => {
  const runs = [run("a", "cron", "success", 8), run("b", "admin", "failed", 100)];
  assert.deepEqual(checkerFreshness(runs, 30, NOW).map((c) => c.trigger), ["cron"]);
});
