import { test } from "node:test";
import assert from "node:assert/strict";
import { cityMeta } from "../../lib/cityMeta";

const d = (title: string, v: number, unit = "percent", name = "nuEra Champaign") =>
  ({ deal_title: title, discount_value: v, discount_unit: unit, name, slug: "nuera-champaign" });

test("leads with the biggest everyday percent deal and names the store", () => {
  const m = cityMeta("Champaign", [d("20% off edibles", 20), d("30% off all flower", 30, "percent", "Sunnyside Champaign")], 3);
  assert.equal(m.title, "Champaign Dispensary Deals Today: 30% Off at Sunnyside");
  assert.match(m.description, /^30% off all flower at Sunnyside Champaign today\. 2 deals across 3 Champaign, IL dispensaries/);
});

test("skips first-time, veteran, up-to and buy-several deals", () => {
  const m = cityMeta("Peoria", [d("50% off first-time patients", 50), d("Veterans 40% off", 40), d("Up to 60% off", 60), d("Buy 2 get 25% off", 25), d("15% off vapes", 15)], 5);
  assert.match(m.title, /15% Off/);
});

test("long names fall back to a shorter title under 60 characters", () => {
  const m = cityMeta("Peoria Heights", [d("25% off flower", 25, "percent", "Cookies Dispensary Peoria Heights Extra Long")], 1);
  assert.ok(m.title.length <= 60, m.title);
  assert.match(m.title, /25% Off/);
});

test("no usable deal keeps the plain title", () => {
  const m = cityMeta("Normal", [], 4);
  assert.equal(m.title, "Normal Dispensary Deals Today");
  assert.match(m.description, /All 4 Normal, IL dispensaries/);
});

test("minimum-spend deals don't lead", () => {
  const m = cityMeta("Peoria", [d("$10 off any purchase over $75", 10, "dollars"), d("$20 off orders of $100+", 20, "dollars"), d("12% off carts", 12)], 3);
  assert.match(m.title, /12% Off/);
});
