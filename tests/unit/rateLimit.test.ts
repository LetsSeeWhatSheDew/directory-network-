// Unit tests for lib/rateLimit.ts — run with `npm run test:unit`.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { rateLimited, clientKey, firstTimeWithin, hashKey, _debugKeys, _resetRateLimits } from "../../lib/rateLimit";

beforeEach(() => _resetRateLimits());

test("allows up to max calls in the window, then limits", () => {
  const now = 1_000_000;
  for (let i = 0; i < 5; i++) assert.equal(rateLimited("k", 5, 60_000, now + i), false, `call ${i + 1}`);
  assert.equal(rateLimited("k", 5, 60_000, now + 10), true);
});

test("the window slides: old hits expire", () => {
  const now = 2_000_000;
  for (let i = 0; i < 3; i++) rateLimited("slide", 3, 1000, now);
  assert.equal(rateLimited("slide", 3, 1000, now + 1), true);
  assert.equal(rateLimited("slide", 3, 1000, now + 5000), false);
});

test("keys are independent", () => {
  const now = 3_000_000;
  rateLimited("a", 1, 60_000, now);
  assert.equal(rateLimited("a", 1, 60_000, now), true);
  assert.equal(rateLimited("b", 1, 60_000, now), false);
});

test("clientKey never returns or stores the raw IP", () => {
  const ip = "203.0.113.77";
  const h = new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1`, "x-real-ip": ip });
  const key = clientKey(h);
  assert.ok(!key.includes(ip));
  assert.ok(!key.includes("203.0.113"));
  // Same client → same key; different client → different key.
  assert.equal(key, clientKey(new Headers({ "x-real-ip": ip })));
  assert.notEqual(key, clientKey(new Headers({ "x-real-ip": "198.51.100.9" })));

  rateLimited(`fb:${key}`, 5);
  firstTimeWithin(`signup:someone@example.com`, 60_000);
  for (const k of _debugKeys()) {
    assert.ok(!k.includes(ip), "raw IP found in limiter memory");
    assert.ok(!k.includes("example.com"), "raw email found in limiter memory");
  }
});

test("hashKey is one-way looking and stable within the instance", () => {
  assert.equal(hashKey("x"), hashKey("x"));
  assert.notEqual(hashKey("x"), hashKey("y"));
  assert.match(hashKey("x"), /^[A-Za-z0-9_-]{24}$/);
});

test("firstTimeWithin dedupes repeats inside the TTL only", () => {
  const now = 4_000_000;
  assert.equal(firstTimeWithin("same-body", 1000, now), true);
  assert.equal(firstTimeWithin("same-body", 1000, now + 500), false);
  assert.equal(firstTimeWithin("same-body", 1000, now + 1500), true);
  assert.equal(firstTimeWithin("other-body", 1000, now + 500), true);
});

test("memory stays bounded and an active key survives a flood", () => {
  const now = 5_000_000;
  for (let i = 0; i < 20_000; i++) {
    rateLimited(`flood-${i}`, 3, 3_600_000, now);
    // A client that keeps hammering stays recent, so pruning drops idle
    // flood keys before it and its limit is not reset.
    if (i % 100 === 0) rateLimited("hammer", 3, 3_600_000, now);
  }
  assert.ok(_debugKeys().length <= 5001, `map grew to ${_debugKeys().length}`);
  assert.equal(rateLimited("hammer", 3, 3_600_000, now), true);
});
