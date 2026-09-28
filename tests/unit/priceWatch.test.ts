// Unit tests: price-drop decisions and watch tags (lib/priceWatch.ts, lib/dealWatch.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { decidePriceDrop, parseCeiling, MIN_DROP_CENTS } from "../../lib/priceWatch";
import { itemOf, refCentsOf, maxCentsOf, eventOf, withTag } from "../../lib/dealWatch";
import { eventById, daysUntil, eventsOn, SALE_EVENTS } from "../../lib/events";

test("a real drop notifies and becomes the new reference", () => {
  assert.deepEqual(decidePriceDrop(3120, 2741), { notify: true, nextRef: 2741 });
});

test("tiny wiggles don't notify and keep the reference", () => {
  assert.deepEqual(decidePriceDrop(3120, 3120 - MIN_DROP_CENTS + 1), { notify: false, nextRef: 3120 });
});

test("rises move the reference up so the next sale counts", () => {
  assert.deepEqual(decidePriceDrop(2741, 3120), { notify: false, nextRef: 3120 });
  assert.deepEqual(decidePriceDrop(3120, 2741), { notify: true, nextRef: 2741 });
});

test("a ceiling holds the email until the price is at or under it", () => {
  assert.deepEqual(decidePriceDrop(4000, 3500, 3000), { notify: false, nextRef: 3500 });
  assert.deepEqual(decidePriceDrop(3500, 3000, 3000), { notify: true, nextRef: 3000 });
});

test("no fresh price: nothing happens", () => {
  assert.deepEqual(decidePriceDrop(3000, null), { notify: false, nextRef: 3000 });
});

test("ceiling input parsing", () => {
  assert.equal(parseCeiling("30"), 3000);
  assert.equal(parseCeiling("$27.50"), 2750);
  assert.equal(parseCeiling(""), null);
  assert.equal(parseCeiling("-4"), null);
  assert.equal(parseCeiling("abc"), null);
});

test("watch tags round-trip", () => {
  const cats = ["item:nuera-east-peoria:eighth", "ref:3120", "max:3000", "ok:abc", "sent:2026-09-27"];
  assert.deepEqual(itemOf({ categories: cats }), { slug: "nuera-east-peoria", ref: "eighth" });
  assert.equal(refCentsOf({ categories: cats }), 3120);
  assert.equal(maxCentsOf({ categories: cats }), 3000);
  assert.equal(maxCentsOf({ categories: ["ref:1"] }), null);
  const next = withTag(cats, "ref:", "2741");
  assert.equal(refCentsOf({ categories: next }), 2741);
  assert.equal(next.filter((c) => c.startsWith("ref:")).length, 1);
  assert.ok(next.includes("ok:abc") && next.includes("sent:2026-09-27"));
  assert.equal(eventOf({ categories: ["event:green-wednesday-2026", "ok:x"] }), "green-wednesday-2026");
});

test("sale days: dates, countdown and lookup", () => {
  const gw = eventById("green-wednesday-2026")!;
  assert.equal(gw.date, "2026-11-25");
  assert.equal(daysUntil(gw, new Date("2026-09-27T17:00:00Z")), 59);
  // Central Time decides the day: 05:30 UTC Nov 25 is still 11:30 PM Nov 24 in Illinois.
  assert.equal(daysUntil(gw, new Date("2026-11-25T05:30:00Z")), 1);
  assert.equal(daysUntil(gw, new Date("2026-11-25T06:30:00Z")), 0);
  assert.equal(daysUntil(gw, new Date("2026-11-26T12:00:00Z")), -1);
});

test("sale days are in the future and matched by their own names", () => {
  for (const e of SALE_EVENTS) {
    assert.ok(e.match.test(e.name) || e.id.startsWith("green"), e.id);
    assert.deepEqual(eventsOn(e.date).map((x) => x.id), [e.id]);
  }
  assert.ok(eventById("420-2027")!.match.test("4/20 sale: 30% off everything"));
  assert.ok(eventById("710-2027")!.match.test("7/10 concentrates BOGO"));
  assert.equal(eventById("710-2027")!.match.test("$17.10 carts"), false);
});
