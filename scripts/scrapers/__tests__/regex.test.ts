// scripts/scrapers/__tests__/regex.test.ts
//
// Run via: npm run test:scrapers
// Uses node:test (no external deps).

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { inferDiscountPct, inferRecurringDays } from "../regex";

test("inferDiscountPct: '20% off Munchie Monday' → 20", () => {
  assert.equal(inferDiscountPct("20% off Munchie Monday"), 20);
});

test("inferRecurringDays: 'Munchie Monday' → ['monday']", () => {
  assert.deepEqual(inferRecurringDays("20% off Munchie Monday"), ["monday"]);
});

test("inferDiscountPct: 'Wax Wednesday — buy 2 get 1' → null", () => {
  assert.equal(inferDiscountPct("Wax Wednesday — buy 2 get 1"), null);
});

test("inferRecurringDays: 'Wax Wednesday' → ['wednesday']", () => {
  assert.deepEqual(
    inferRecurringDays("Wax Wednesday — buy 2 get 1"),
    ["wednesday"]
  );
});

test("inferDiscountPct: 'Daily Veterans Discount' → null", () => {
  assert.equal(inferDiscountPct("Daily Veterans Discount"), null);
});

test("inferRecurringDays: 'Daily Veterans Discount' → null", () => {
  assert.equal(inferRecurringDays("Daily Veterans Discount"), null);
});

test("inferDiscountPct: 'Mondays Only: 30% off edibles' → 30", () => {
  assert.equal(inferDiscountPct("Mondays Only: 30% off edibles"), 30);
});

test("inferRecurringDays: 'Mondays Only' → ['monday']", () => {
  assert.deepEqual(
    inferRecurringDays("Mondays Only: 30% off edibles"),
    ["monday"]
  );
});

test("inferRecurringDays: 'Stoner Sunday + Munchie Monday combo' → ['monday','sunday']", () => {
  // Output is in canonical weekday order (mon..sun).
  assert.deepEqual(
    inferRecurringDays("Stoner Sunday + Munchie Monday combo"),
    ["monday", "sunday"]
  );
});

test("inferDiscountPct: out-of-range value rejected", () => {
  assert.equal(inferDiscountPct("250% off"), null);
});

test("inferDiscountPct: missing % returns null", () => {
  assert.equal(inferDiscountPct("Save big on flower"), null);
});

test("inferRecurringDays: 'every thursday' → ['thursday']", () => {
  assert.deepEqual(inferRecurringDays("Every Thursday: free pre-roll"), ["thursday"]);
});
