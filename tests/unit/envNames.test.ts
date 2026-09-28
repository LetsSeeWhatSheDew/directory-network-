// Env-var names the code reads must match what Vercel actually has set
// (docs/ENV-VARS.md) — run with `npm run test:unit`.
//
// As of 2026-09-28 Vercel Production has SUPABASE_SERVICE_KEY (not
// SUPABASE_SERVICE_ROLE_KEY), NEXT_PUBLIC_GA_MEASUREMENT_ID (not
// NEXT_PUBLIC_GA_ID), CRON_SECRET, and no UNSUBSCRIBE_SECRET.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { unsubscribeToken } from "../../lib/alertSubscribers";

const ROOT = resolve(__dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(p)) out.push(p);
  }
  return out;
}
const sources = [...["app", "lib", "components"].flatMap((d) => walk(join(ROOT, d))), join(ROOT, "middleware.ts")];

test("every read of SUPABASE_SERVICE_ROLE_KEY also accepts SUPABASE_SERVICE_KEY (the name Vercel has)", () => {
  const bad: string[] = [];
  for (const f of sources) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/process\.env\.SUPABASE_SERVICE_ROLE_KEY\b/g)) {
      // The whole statement around the read (previous ; { } to the next ;).
      const before = src.slice(0, m.index!);
      const stmtStart = Math.max(before.lastIndexOf(";"), before.lastIndexOf("{"), before.lastIndexOf("}")) + 1;
      const stmtEnd = src.indexOf(";", m.index!);
      const stmt = src.slice(stmtStart, stmtEnd === -1 ? undefined : stmtEnd);
      if (!/SUPABASE_SERVICE_KEY\b/.test(stmt)) {
        const line = src.slice(0, m.index!).split("\n").length;
        bad.push(`${relative(ROOT, f)}:${line}`);
      }
    }
  }
  assert.deepEqual(bad, [], "reads SUPABASE_SERVICE_ROLE_KEY with no SUPABASE_SERVICE_KEY fallback");
});

test("Google Analytics id is read as NEXT_PUBLIC_GA_MEASUREMENT_ID", () => {
  const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
  assert.match(layout, /process\.env\.NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  for (const f of sources) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /NEXT_PUBLIC_GA_ID\b/, `${relative(ROOT, f)} reads NEXT_PUBLIC_GA_ID, which isn't set`);
  }
});

test("no hardcoded admin password fallback (admin fails closed when ADMIN_PASSWORD is unset)", () => {
  for (const f of sources) {
    const src = readFileSync(f, "utf8");
    assert.doesNotMatch(src, /cleanlist2026/, `${relative(ROOT, f)} contains the old default password`);
    assert.doesNotMatch(src, /ADMIN_PASSWORD\s*(\|\||\?\?)\s*["'`]/, `${relative(ROOT, f)} has a literal ADMIN_PASSWORD fallback`);
  }
});

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

test("unsubscribe links fall back to CRON_SECRET when UNSUBSCRIBE_SECRET isn't set", () => {
  delete process.env.UNSUBSCRIBE_SECRET;
  process.env.CRON_SECRET = "cron-secret-value";
  const expected = createHmac("sha256", "cron-secret-value").update("a@example.com").digest("hex").slice(0, 32);
  assert.equal(unsubscribeToken("A@Example.com "), expected);
  // Setting UNSUBSCRIBE_SECRET to the same value keeps every sent link valid.
  process.env.UNSUBSCRIBE_SECRET = "cron-secret-value";
  process.env.CRON_SECRET = "rotated-cron-secret";
  assert.equal(unsubscribeToken("a@example.com"), expected);
});
