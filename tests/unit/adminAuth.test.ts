// Unit tests for lib/adminAuth.ts — run with `npm run test:unit`.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { safeEqual, adminSessionToken, passwordMatches, isAdmin, ADMIN_COOKIE } from "../../lib/adminAuth";

const saved = process.env.ADMIN_PASSWORD;
afterEach(() => {
  if (saved === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = saved;
});

const withCookie = (v: string) => new Request("https://www.puffprice.com/api/admin/leads", { headers: { cookie: `x=1; ${ADMIN_COOKIE}=${encodeURIComponent(v)}` } });

test("safeEqual", () => {
  assert.ok(safeEqual("abc", "abc"));
  assert.ok(!safeEqual("abc", "abd"));
  assert.ok(!safeEqual("abc", "abcd"));
  assert.ok(!safeEqual("", ""), "empty never matches");
});

test("no ADMIN_PASSWORD → nobody is admin, no token", async () => {
  delete process.env.ADMIN_PASSWORD;
  assert.equal(await adminSessionToken(), null);
  assert.equal(passwordMatches(""), false);
  assert.equal(await isAdmin(withCookie("")), false);
  assert.equal(await isAdmin(withCookie("undefined")), false);
});

test("session cookie is a derived token, never the password", async () => {
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
  const token = await adminSessionToken();
  assert.ok(token && /^[0-9a-f]{64}$/.test(token));
  assert.ok(!token!.includes("horse"));
  assert.equal(await isAdmin(withCookie(token!)), true);
  // The old scheme (cookie = raw password) no longer works.
  assert.equal(await isAdmin(withCookie("correct horse battery staple")), false);
  assert.equal(await isAdmin(new Request("https://x/")), false);
  assert.ok(passwordMatches("correct horse battery staple"));
  assert.ok(!passwordMatches("correct horse battery stapl"));
  assert.ok(!passwordMatches(undefined));
});

test("middleware gates every method on /admin (no POST bypass)", () => {
  const src = readFileSync(join(__dirname, "../../middleware.ts"), "utf8");
  assert.doesNotMatch(src, /req\.method === "POST"\) return NextResponse\.next\(\)/);
  assert.match(src, /await isAdmin\(req\)/);
});

test("every /api/admin route calls isAdmin", () => {
  const root = join(__dirname, "../..");
  const routes = (readdirSync(join(root, "app/api/admin"), { recursive: true }) as string[])
    .filter((f) => /route\.(ts|tsx|js)$/.test(f))
    .map((f) => join("app/api/admin", f));
  assert.ok(routes.length >= 6);
  for (const r of routes) {
    const src = readFileSync(join(root, r), "utf8");
    assert.match(src, /await isAdmin\(/, `${r} must check isAdmin`);
  }
});
