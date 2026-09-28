// tests/near-exhale.test.ts — the homepage orb picks the biggest everyday
// saving NEAR the visitor's chosen city, widening (and saying so) when needed.
//   npx tsx tests/near-exhale.test.ts
import assert from "node:assert/strict";
import { nearestExhale, nearSubline, lowestList, type ExDeal } from "../lib/exhale";

const D = (id: string, name: string, city: string, title: string, value: number, unit: "percent" | "dollars"): ExDeal => ({
  deal_id: id, name, slug: id, city, deal_title: title, discount_value: value, discount_unit: unit,
});

// The live bug: a 50% Springfield deal is the biggest in Central IL.
const deals: ExDeal[] = [
  D("share", "SHARE", "Springfield", "50% off flower", 50, "percent"),
  D("leaf", "Leaf Peoria", "Peoria", "25% off vapes", 25, "percent"),
  D("river", "River East Peoria", "East Peoria", "20% off edibles", 20, "percent"),
  D("capitol", "Capitol", "Springfield", "30% off carts", 30, "percent"),
];

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`  ✓ ${name}`);
};

test("Peoria Heights → a Peoria-area store, not Springfield", () => {
  const p = nearestExhale(deals, { city: "Peoria Heights" })!;
  assert.equal(p.scope, "near");
  assert.equal(p.deal.deal_id, "leaf");
  assert.ok(p.miles! < 25, `miles ${p.miles}`);
  const line = nearSubline(p);
  assert.match(line, /Leaf Peoria/);
  assert.match(line, /\d+ mi$/);
});

test("GPS coordinates win over the city center", () => {
  const p = nearestExhale(deals, { city: "Peoria Heights", lat: 40.747, lng: -89.573 })!;
  assert.equal(p.deal.deal_id, "leaf");
});

test("Springfield → the Springfield store", () => {
  const p = nearestExhale(deals, { city: "Springfield" })!;
  assert.equal(p.scope, "near");
  assert.equal(p.deal.deal_id, "share");
  assert.match(nearSubline(p), /SHARE, Springfield · (under 1|\d+) mi/);
});

test("Nothing near → widens and says so", () => {
  const onlyFar = deals.filter((d) => d.city === "Springfield");
  const p = nearestExhale(onlyFar, { city: "Peoria Heights" })!;
  assert.equal(p.scope, "widened");
  assert.equal(p.deal.deal_id, "share");
  const line = nearSubline(p);
  assert.match(line, /^Nearest big one: 50% off at SHARE, Springfield · \d+ mi$/);
  const mi = Number(line.match(/(\d+) mi$/)![1]);
  assert.ok(mi > 55 && mi < 80, `Peoria Heights→Springfield ~70 mi, got ${mi}`);
});

test("No city yet → Central-IL-wide pick, labeled as such", () => {
  const p = nearestExhale(deals, null)!;
  assert.equal(p.scope, "region");
  assert.equal(p.deal.deal_id, "share");
  assert.match(nearSubline(p), /across Central Illinois$/);
});

test("Lowest list puts stores within 25 mi first", () => {
  const list = lowestList(deals, 4, { city: "Peoria Heights" });
  assert.deepEqual(list.slice(0, 2).map((d) => d.deal_id), ["leaf", "river"]);
});

test("Conditional and buy-several deals never lead", () => {
  const p = nearestExhale(
    [D("vet", "Leaf Peoria", "Peoria", "40% off for veterans", 40, "percent"), ...deals],
    { city: "Peoria" }
  )!;
  assert.equal(p.deal.deal_id, "leaf");
});

console.log(`\n${n} near-exhale checks passed`);
