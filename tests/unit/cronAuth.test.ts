// Cron routes can't be triggered publicly — run with `npm run test:unit`.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { checkCronAuth } from "../../lib/cronAuth";

const saved = process.env.CRON_SECRET;
afterEach(() => {
  if (saved === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = saved;
});

const req = (auth?: string) =>
  new NextRequest("https://www.puffprice.com/api/cron/x", auth ? { headers: { authorization: auth } } : undefined);

test("no CRON_SECRET configured → always 401", () => {
  delete process.env.CRON_SECRET;
  assert.equal(checkCronAuth(req(), "t").ok, false);
  assert.equal(checkCronAuth(req("Bearer "), "t").ok, false);
  assert.equal(checkCronAuth(req("Bearer undefined"), "t").ok, false);
});

test("wrong or missing bearer → 401; right bearer → ok", () => {
  process.env.CRON_SECRET = "s3cret-value-123";
  assert.equal(checkCronAuth(req(), "t").ok, false);
  assert.equal(checkCronAuth(req("Bearer nope"), "t").ok, false);
  assert.equal(checkCronAuth(req("Bearer s3cret-value-12"), "t").ok, false);
  assert.equal(checkCronAuth(req("Bearer s3cret-value-123"), "t").ok, true);
  // Trailing newline pasted into the env var still matches (documented behavior).
  process.env.CRON_SECRET = "s3cret-value-123\n";
  assert.equal(checkCronAuth(req("Bearer s3cret-value-123"), "t").ok, true);
});

test("every /api/cron route checks cron auth before doing anything", () => {
  const dir = join(__dirname, "../../app/api/cron");
  const routes = readdirSync(dir).map((d) => join(dir, d, "route.ts"));
  assert.ok(routes.length >= 5);
  for (const r of routes) {
    const src = readFileSync(r, "utf8");
    assert.match(src, /checkCronAuth\(req, "[a-z-]+"\);\s*\n\s*if \(!auth\.ok\) return auth\.response;/, `${r} must call checkCronAuth first`);
  }
});
