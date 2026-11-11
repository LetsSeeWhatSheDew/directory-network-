// tests/scraper-dedupe.test.ts — one live row per deal (Nov 10, 2026 fix).
// The scraper used to re-insert live deals daily (existing-deal read capped at
// 500 rows) and nothing retired the copies: 110 rows shown for 37 deals.
//   npx tsx --test tests/scraper-dedupe.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickMatchingExisting, planDuplicateRetirements, type ExistingDeal, type ScrapedDeal } from "../lib/scraper/cil-deal-scraper";

const row = (id: string, over: Partial<ExistingDeal> = {}): ExistingDeal => ({
  id, listing_slug: "nuera-east-peoria", title: "40% off Ogeez products", discount_value: 40,
  is_active: true, status_reason: "holding_pattern_within_48h", source: "website", ...over,
});
const scraped: ScrapedDeal = { listing_slug: "nuera-east-peoria", title: "40% off Ogeez products", discount_value: 40, discount_unit: "percent", source_url: "https://x" };

test("match prefers the newest ACTIVE row (existing is newest-first)", () => {
  const existing = [row("new-inactive", { is_active: false }), row("newest-active"), row("older-active")];
  assert.equal(pickMatchingExisting(scraped, existing)?.id, "newest-active");
});

test("numeric discount from PostgREST as a string still matches", () => {
  const existing = [row("a", { discount_value: "40" as unknown as number })];
  assert.equal(pickMatchingExisting(scraped, existing)?.id, "a");
});

test("seven daily copies → keep one, retire six", () => {
  const existing = ["d10", "d9", "d8", "d7", "d6", "d5", "d4"].map((id) => row(id));
  const keep = pickMatchingExisting(scraped, existing);
  const dups = planDuplicateRetirements(scraped, keep, existing);
  assert.equal(keep?.id, "d10");
  assert.deepEqual(dups.map((d) => d.id), ["d9", "d8", "d7", "d6", "d5", "d4"]);
});

test("never touches other stores, other deals, inactive rows, or the other source family", () => {
  const existing = [
    row("keep"),
    row("other-store", { listing_slug: "nuera-pekin" }),
    row("other-deal", { title: "30% off NGW brands", discount_value: 30 }),
    row("already-off", { is_active: false }),
    row("rendered-copy", { source: "website_rendered" }),
  ];
  const keep = pickMatchingExisting(scraped, existing);
  assert.deepEqual(planDuplicateRetirements(scraped, keep, existing), []);
});

test("no match → nothing retired (it's an insert)", () => {
  assert.deepEqual(planDuplicateRetirements(scraped, undefined, [row("x", { title: "other" })]), []);
});
