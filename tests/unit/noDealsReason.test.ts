// /status says why a store shows no deals today, from the newest check that
// reached it: blocked, age check, or "read fine, nothing posted".
import { test } from "node:test";
import assert from "node:assert/strict";
import { noDealsReasonBySlug } from "../../lib/scraperText";
import type { ScraperRun, StoreResult } from "../../lib/scraperRuns";

const NOW = Date.parse("2026-11-19T13:00:00Z");
const h = (hrs: number) => new Date(NOW - hrs * 3600000).toISOString();
const res = (slug: string, status: string, error_message: string | null = null): StoreResult =>
  ({ slug, status, error_message, deals_added: 0, deals_updated: 0, deals_deactivated: 0 }) as StoreResult;
const run = (id: string, trigger: string, hoursAgo: number, results: StoreResult[], status: ScraperRun["status"] = "success"): ScraperRun => ({
  id, trigger, status, started_at: h(hoursAgo + 0.2), finished_at: h(hoursAgo),
  dispensary_results: results, total_deals_added: 0, total_deals_updated: 0,
  total_deals_deactivated: 0, duration_ms: null, error_summary: null,
});

test("blocked store says so; clean empty read says nothing posted", () => {
  const m = noDealsReasonBySlug([
    run("a", "manual", 2, [res("bloom", "failed", "Cloudflare challenge"), res("cloud-9", "success")]),
  ]);
  assert.equal(m.get("bloom")?.reason, "blocked by the store's security check");
  assert.equal(m.get("cloud-9")?.reason, "read fine, nothing posted");
  assert.equal(m.get("nobody"), undefined);
});

test("newest check wins across days", () => {
  const m = noDealsReasonBySlug([
    run("new", "manual", 2, [res("trinity", "failed", "age gate not passed")]),
    run("old", "manual", 50, [res("trinity", "success")]),
  ]);
  assert.equal(m.get("trinity")?.reason, "stuck at the age check");
});

test("same morning: a clean read by either checker beats the other's failure", () => {
  const m = noDealsReasonBySlug([
    run("cron", "cron", 1, [res("share", "failed", "403 Forbidden")]),
    run("rendered", "manual", 3, [res("share", "success")]),
  ]);
  assert.equal(m.get("share")?.reason, "read fine, nothing posted");
});

test("runs still in progress are ignored", () => {
  const m = noDealsReasonBySlug([run("r", "manual", 0.1, [res("x", "failed", "timeout")], "running")]);
  assert.equal(m.size, 0);
});
