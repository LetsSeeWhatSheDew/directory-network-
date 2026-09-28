// /social must never be reachable without the admin password, in any mode.
// Run: npx tsx --test tests/unit/social-access.test.ts
//
// Three layers:
//   1. The gate itself (lib/social/access.ts), including with fixtures on.
//   2. The page wires it up first: it gates before reading any data, and no
//      env flag appears in its access path.
//   3. Over HTTP against a running server, when SOCIAL_BASE_URL is set
//      (marketing/social/render-fixtures.mjs sets it up; see the README):
//      no cookie or a wrong cookie → redirect to /admin-login, the right
//      test password → 200.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { socialAccessAllowed, ADMIN_COOKIE } from "../../lib/social/access";

describe("socialAccessAllowed", () => {
  test("no password configured → nobody gets in", () => {
    assert.equal(socialAccessAllowed("anything", undefined), false);
    assert.equal(socialAccessAllowed("", ""), false);
    assert.equal(socialAccessAllowed(undefined, undefined), false);
  });

  test("missing or wrong cookie → denied", () => {
    assert.equal(socialAccessAllowed(undefined, "s3cret"), false);
    assert.equal(socialAccessAllowed(null, "s3cret"), false);
    assert.equal(socialAccessAllowed("", "s3cret"), false);
    assert.equal(socialAccessAllowed("s3cre", "s3cret"), false);
    assert.equal(socialAccessAllowed("s3cret ", "s3cret"), false);
  });

  test("the right password → allowed", () => {
    assert.equal(socialAccessAllowed("s3cret", "s3cret"), true);
  });

  test("fixture mode changes nothing", () => {
    const before = process.env.SOCIAL_FIXTURES;
    process.env.SOCIAL_FIXTURES = "1";
    try {
      assert.equal(socialAccessAllowed(undefined, "s3cret"), false);
      assert.equal(socialAccessAllowed(undefined, undefined), false);
      assert.equal(socialAccessAllowed("wrong", "s3cret"), false);
    } finally {
      if (before === undefined) delete process.env.SOCIAL_FIXTURES;
      else process.env.SOCIAL_FIXTURES = before;
    }
  });

  test("uses the /admin cookie", () => {
    assert.equal(ADMIN_COOKIE, "dn_admin_auth");
  });
});

describe("app/social/page.tsx", () => {
  const src = readFileSync(join(process.cwd(), "app/social/page.tsx"), "utf8");
  const body = src.slice(src.indexOf("export default async function SocialPage"));

  test("gates with socialAccessAllowed and ADMIN_PASSWORD, redirecting to login", () => {
    assert.match(body, /if \(!socialAccessAllowed\([^)]*,\s*process\.env\.ADMIN_PASSWORD\)\)\s*redirect\("\/admin-login\?from=\/social"\)/);
  });

  test("the gate runs before any data is read", () => {
    const gate = body.indexOf("socialAccessAllowed(");
    const data = body.indexOf("getAllSocialData(");
    assert.ok(gate > 0 && data > 0 && gate < data, "access check must come before getAllSocialData");
  });

  test("no env flag or fixture switch in the access path", () => {
    assert.doesNotMatch(src, /fixturesOn|SOCIAL_FIXTURES|NODE_ENV|VERCEL_ENV/);
  });
});

describe("over HTTP (SOCIAL_BASE_URL)", () => {
  const base = process.env.SOCIAL_BASE_URL;
  const pw = process.env.SOCIAL_TEST_PASSWORD;
  const skip = base ? false : "set SOCIAL_BASE_URL (and SOCIAL_TEST_PASSWORD) to run against a server";
  const get = (cookie?: string) =>
    fetch(`${base}/social`, { redirect: "manual", headers: cookie ? { cookie: `${ADMIN_COOKIE}=${encodeURIComponent(cookie)}` } : {} });

  test("no cookie → redirect to /admin-login, no page", { skip }, async () => {
    const r = await get();
    assert.ok([302, 303, 307, 308].includes(r.status), `expected a redirect, got ${r.status}`);
    assert.match(r.headers.get("location") || "", /\/admin-login\?from=(\/|%2F)social/);
    assert.doesNotMatch(await r.text(), /Copy caption|Download feed/);
  });

  test("wrong cookie → redirect to /admin-login", { skip }, async () => {
    const r = await get("not-the-password");
    assert.ok([302, 303, 307, 308].includes(r.status), `expected a redirect, got ${r.status}`);
  });

  test("test password → 200", { skip: skip || (pw ? false : "set SOCIAL_TEST_PASSWORD") }, async () => {
    const r = await get(pw);
    assert.equal(r.status, 200);
    assert.match(await r.text(), /Today.s posts/);
  });
});
