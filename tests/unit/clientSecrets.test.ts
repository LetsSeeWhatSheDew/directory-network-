// No server secret can reach the browser bundle — run with `npm run test:unit`.
//
// Next.js only inlines NEXT_PUBLIC_* env vars into client code, so the two
// ways a secret leaks are (1) a secret given a NEXT_PUBLIC_ name, or (2) a
// client component importing a module that holds a secret (today that just
// evaluates to undefined in the browser, but it's one rename away from a
// leak, and it ships server logic to every visitor). Both are checked here
// by reading the source; the PR that added this also grepped a real
// `next build` output for sentinel secret values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const ROOT = resolve(__dirname, "../..");
const SOURCE_DIRS = ["app", "components", "lib"];
const EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];

const SERVER_SECRETS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ADMIN_PASSWORD",
  "UNSUBSCRIBE_SECRET",
  "GOOGLE_PLACES_API_KEY",
  "SENTRY_AUTH_TOKEN",
  "TWILIO_AUTH_TOKEN",
  "INDEXNOW_KEY",
];
// Public by design (safe to ship to browsers).
const PUBLIC_OK = new Set(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "NEXT_PUBLIC_GA_MEASUREMENT_ID"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

const files = SOURCE_DIRS.flatMap((d) => walk(join(ROOT, d)));
const isClient = (src: string) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*\s*["']use client["']/.test(src);

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null; // package import
  for (const cand of [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => join(base, "index" + e))]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand;
  }
  return null;
}

function importsOf(file: string, src: string): string[] {
  const specs = [...src.matchAll(/(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g)].map(
    (m) => m[1] || m[2] || m[3]
  );
  return specs.map((s) => resolveImport(file, s)).filter((x): x is string => !!x);
}

test("no client component can reach a module that holds a server secret", () => {
  const clientEntries = files.filter((f) => isClient(readFileSync(f, "utf8")));
  assert.ok(clientEntries.length > 10, "found client components");
  const problems: string[] = [];
  for (const entry of clientEntries) {
    const seen = new Set<string>();
    const stack: Array<{ f: string; via: string[] }> = [{ f: entry, via: [] }];
    while (stack.length) {
      const { f, via } = stack.pop()!;
      if (seen.has(f)) continue;
      seen.add(f);
      const src = readFileSync(f, "utf8");
      const chain = [...via, relative(ROOT, f)];
      for (const secret of SERVER_SECRETS) {
        // An actual env read (process.env.X, process.env["X"], or
        // const { X } = process.env), not a mention in UI copy.
        const read = new RegExp(`process\\.env(?:\\.${secret}\\b|\\[["']${secret}["']\\])|\\{[^}]*\\b${secret}\\b[^}]*\\}\\s*=\\s*process\\.env`);
        if (read.test(src)) problems.push(`${chain.join(" → ")} reads ${secret}`);
      }
      if (/import\s+["']server-only["']/.test(src) && f !== entry) problems.push(`${chain.join(" → ")} is server-only`);
      for (const next of importsOf(f, src)) stack.push({ f: next, via: chain });
    }
  }
  assert.deepEqual([...new Set(problems)], []);
});

test("no secret-looking env var is exposed with a NEXT_PUBLIC_ prefix", () => {
  const offenders = new Set<string>();
  const extra = ["next.config.ts", "middleware.ts", "instrumentation.ts", "instrumentation-client.ts", "sentry.client.config.ts", "sentry.server.config.ts", "sentry.edge.config.ts"]
    .map((f) => join(ROOT, f))
    .filter((f) => existsSync(f));
  for (const f of [...files, ...extra]) {
    for (const m of readFileSync(f, "utf8").matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
      const name = m[0];
      if (PUBLIC_OK.has(name)) continue;
      if (/SECRET|SERVICE|PASSWORD|TOKEN|PRIVATE|WEBHOOK|_KEY$/.test(name)) offenders.add(`${relative(ROOT, f)}: ${name}`);
    }
  }
  assert.deepEqual([...offenders], []);
});

test("modules that hold the service-role key are marked server-only", () => {
  for (const f of ["lib/supabase.ts", "lib/analyticsDb.ts", "lib/confirmations.ts", "lib/scraperRuns.ts", "lib/weeklyConfirm.ts"]) {
    assert.match(readFileSync(join(ROOT, f), "utf8"), /^import "server-only";$/m, `${f} must import "server-only"`);
  }
});
