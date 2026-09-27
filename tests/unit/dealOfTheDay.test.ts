// Unit tests: deal-of-the-day selection (lib/dealOfTheDay.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickDealOfTheDay, comparablePercent, rotationHash, type LiveDeal } from "../../lib/dealOfTheDay";

const NOW = Date.parse("2026-09-27T14:00:00Z");
const fresh = new Date(NOW - 3600_000).toISOString();
let n = 0;
const deal = (o: Partial<LiveDeal>): LiveDeal => ({
  deal_id: `00000000-0000-0000-0000-${String(++n).padStart(12, "0")}`,
  deal_title: "20% off flower",
  city: "Peoria",
  slug: "store-a",
  name: "Store A",
  discount_value: 20,
  discount_unit: "percent",
  discount_type: "percentage",
  verified_at: fresh,
  expires_at: null,
  ...o,
});

test("biggest everyday percent wins", () => {
  const r = pickDealOfTheDay([deal({ discount_value: 20 }), deal({ slug: "store-b", discount_value: 35, deal_title: "35% off vapes" })], { now: NOW, day: "2026-09-27" });
  assert.equal(r.status, "ok");
  assert.equal(r.status === "ok" && r.pick.slug, "store-b");
});

test("conditional, 'up to', buy-several, stale, expired and out-of-scope deals never lead", () => {
  const r = pickDealOfTheDay(
    [
      deal({ slug: "a", discount_value: 60, deal_title: "60% off for first-time customers" }),
      deal({ slug: "b", discount_value: 55, deal_title: "Up to 55% off" }),
      deal({ slug: "c", discount_value: 50, deal_title: "50% off when you buy 3 or more" }),
      deal({ slug: "d", discount_value: 45, verified_at: new Date(NOW - 8 * 86400_000).toISOString() }),
      deal({ slug: "e", discount_value: 45, expires_at: new Date(NOW - 60_000).toISOString() }),
      deal({ slug: "f", discount_value: 70, city: "Chicago" }),
      deal({ slug: "g", discount_value: 15 }),
    ],
    { now: NOW, day: "2026-09-27" }
  );
  assert.equal(r.status === "ok" && r.pick.slug, "g");
  assert.equal(r.status === "ok" && r.eligible, 1);
  assert.equal(r.status === "ok" && r.live, 5); // 7 deals; Chicago + expired are not live
});

test("dollars-off compares as a share of a typical basket", () => {
  // $20 off flower = 40% of a $50 flower basket, beats 30% off.
  const d = deal({ discount_value: 20, discount_unit: "dollars", discount_type: "amount", deal_title: "$20 off flower", category: "flower" });
  assert.equal(comparablePercent(d), 40);
  const r = pickDealOfTheDay([deal({ slug: "pct", discount_value: 30 }), { ...d, slug: "usd" }], { now: NOW, day: "2026-09-27" });
  assert.equal(r.status === "ok" && r.pick.slug, "usd");
  // Fixed-price bundles have no savings figure.
  assert.equal(comparablePercent(deal({ discount_value: 60, discount_unit: "dollars", discount_type: "fixed_price", deal_title: "2 for $60" })), null);
});

test("ties rotate by day, not alphabetically, and are deterministic", () => {
  const tied = ["alpha", "bravo", "charlie", "delta", "echo"].map((s) => deal({ slug: s, discount_value: 30 }));
  const winners = new Set<string>();
  for (let day = 1; day <= 30; day++) {
    const d = `2026-10-${String(day).padStart(2, "0")}`;
    const a = pickDealOfTheDay(tied, { now: NOW, day: d });
    const b = pickDealOfTheDay([...tied].reverse(), { now: NOW, day: d });
    assert.equal(a.status === "ok" && a.pick.slug, b.status === "ok" && b.pick.slug, "input order must not matter");
    if (a.status === "ok") winners.add(String(a.pick.slug));
  }
  assert.ok(winners.size >= 3, `expected rotation across stores, got ${[...winners]}`);
  assert.notEqual(rotationHash("2026-10-01|alpha"), rotationHash("2026-10-02|alpha"));
});

test("runners-up are one per store and never the pick's store", () => {
  const r = pickDealOfTheDay(
    [
      deal({ slug: "big", discount_value: 40 }),
      deal({ slug: "big", discount_value: 39, deal_title: "39% off edibles" }),
      deal({ slug: "many", discount_value: 35 }),
      deal({ slug: "many", discount_value: 34, deal_title: "34% off vapes" }),
      deal({ slug: "many", discount_value: 33, deal_title: "33% off carts" }),
      deal({ slug: "small", discount_value: 25 }),
    ],
    { now: NOW, day: "2026-09-27" }
  );
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  assert.equal(r.pick.slug, "big");
  assert.deepEqual(r.runnersUp.map((d) => d.slug), ["many", "small"]);
});

test("honest empty states", () => {
  assert.equal(pickDealOfTheDay(null, { now: NOW }).status, "unknown");
  const none = pickDealOfTheDay([deal({ discount_value: null, deal_title: "2 for $60 flower" })], { now: NOW });
  assert.equal(none.status, "none");
  assert.equal(none.status === "none" && none.live, 1);
});
