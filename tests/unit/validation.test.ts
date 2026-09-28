// Unit tests for lib/validation.ts — run with `npm run test:unit`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readJsonBody,
  parseJsonObject,
  cleanText,
  cleanLine,
  normalizeEmail,
  isSlug,
  isUuid,
  honeypotTripped,
  hasLink,
  crossSiteRequest,
  boundedNumber,
  isoDateOrNull,
  escapeHtml,
  MAX_FORM_BYTES,
} from "../../lib/validation";

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://www.puffprice.com/api/x", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

test("readJsonBody accepts a small JSON object", async () => {
  const r = await readJsonBody(post(JSON.stringify({ a: 1 })));
  assert.deepEqual(r, { ok: true, body: { a: 1 } });
});

test("readJsonBody refuses oversized bodies (declared and actual)", async () => {
  const big = JSON.stringify({ a: "x".repeat(MAX_FORM_BYTES + 10) });
  const declared = await readJsonBody(post("{}", { "content-length": String(MAX_FORM_BYTES + 1) }));
  assert.equal(declared.ok, false);
  if (!declared.ok) assert.equal(declared.status, 413);
  const actual = await readJsonBody(post(big));
  assert.equal(actual.ok, false);
  if (!actual.ok) assert.equal(actual.status, 413);
  // Multi-byte characters count as bytes, not chars.
  const emoji = await readJsonBody(post(JSON.stringify({ a: "🌿".repeat(5000) })), 16 * 1024);
  assert.equal(emoji.ok, false);
});

test("parseJsonObject refuses arrays, primitives and junk", () => {
  for (const raw of ["[]", "[1,2]", "1", '"s"', "null", "{", ""]) {
    assert.equal(parseJsonObject(raw).ok, false, raw);
  }
});

test("cleanText trims, caps and strips control/bidi characters", () => {
  assert.equal(cleanText("  hi  ", 10), "hi");
  assert.equal(cleanText("abcdef", 3), "abc");
  assert.equal(cleanText("a\u0000b‮c", 10), "abc");
  assert.equal(cleanText("line1\nline2", 20), "line1\nline2");
  assert.equal(cleanText("   ", 10), null);
  assert.equal(cleanText(42, 10), null);
  assert.equal(cleanLine("a\n\n  b", 10), "a b");
});

test("normalizeEmail", () => {
  assert.equal(normalizeEmail("  Someone@Example.COM "), "someone@example.com");
  for (const bad of ["", "no-at", "a@b", "a@b.c", "<x>@y.com", "a b@c.com", `${"a".repeat(250)}@x.com`, null, 5]) {
    assert.equal(normalizeEmail(bad), null, String(bad));
  }
});

test("isSlug / isUuid", () => {
  assert.ok(isSlug("nuera-east-peoria"));
  assert.ok(!isSlug("Bad Slug"));
  assert.ok(!isSlug("a--b"));
  assert.ok(!isSlug("x".repeat(121)));
  assert.ok(!isSlug("slug,is_active.eq.false"));
  assert.ok(isUuid("123e4567-e89b-12d3-a456-426614174000"));
  assert.ok(!isUuid("123e4567"));
});

test("honeypot and link detection", () => {
  assert.equal(honeypotTripped({ website: "" }), false);
  assert.equal(honeypotTripped({}), false);
  assert.equal(honeypotTripped({ website: "http://spam" }), true);
  assert.equal(honeypotTripped({ hp: "x" }, "hp"), true);
  assert.ok(hasLink("visit https://spam.example"));
  assert.ok(hasLink("go to www.spam.example"));
  assert.ok(!hasLink("Great staff, 10/10"));
});

test("crossSiteRequest", () => {
  assert.equal(crossSiteRequest(new Headers({ "sec-fetch-site": "same-origin", host: "www.puffprice.com" })), false);
  assert.equal(crossSiteRequest(new Headers({ "sec-fetch-site": "cross-site" })), true);
  assert.equal(crossSiteRequest(new Headers({ origin: "https://evil.example", host: "www.puffprice.com" })), true);
  assert.equal(crossSiteRequest(new Headers({ origin: "https://www.puffprice.com", host: "www.puffprice.com" })), false);
  assert.equal(crossSiteRequest(new Headers({})), false); // curl / old browsers pass
});

test("boundedNumber and isoDateOrNull", () => {
  assert.equal(boundedNumber("12.5", 0, 100), 12.5);
  assert.equal(boundedNumber(-1, 0, 100), null);
  assert.equal(boundedNumber("abc", 0, 100), null);
  assert.equal(boundedNumber("", 0, 100), null);
  assert.equal(boundedNumber(Infinity, 0, 100), null);
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(isoDateOrNull(today), today);
  assert.equal(isoDateOrNull("2026-02-30x"), null);
  assert.equal(isoDateOrNull("9999-01-01"), null);
  assert.equal(isoDateOrNull("'; drop table"), null);
});

test("escapeHtml", () => {
  assert.equal(escapeHtml(`<img src=x onerror="a('b')">&`), "&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;");
  assert.equal(escapeHtml(null), "");
});
