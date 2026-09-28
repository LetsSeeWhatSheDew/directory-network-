#!/usr/bin/env node
// tests/ci/lint-ratchet.mjs — "no new lint errors".
//
// The repo had 97 ESLint errors when CI was added (2026-09-27), spread across
// files other work streams own. Failing every PR on those would make the
// lint check useless, so this script fails only when a file has MORE errors
// of a rule than tests/ci/eslint-baseline.json allows. Fixing errors never
// fails; run with --update afterwards to lock the lower count in.
//
//   node tests/ci/lint-ratchet.mjs            # check
//   node tests/ci/lint-ratchet.mjs --update   # rewrite the baseline
import { ESLint } from "eslint";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASELINE = path.join(ROOT, "tests/ci/eslint-baseline.json");

const eslint = new ESLint({ cwd: ROOT });
const results = await eslint.lintFiles(["."]);

/** { "app/x.tsx": { "rule-id": count } } — errors only. */
const current = {};
const detail = {};
for (const r of results) {
  const file = path.relative(ROOT, r.filePath).split(path.sep).join("/");
  for (const m of r.messages) {
    if (m.severity !== 2) continue;
    const rule = m.ruleId || "(parse error)";
    current[file] ??= {};
    current[file][rule] = (current[file][rule] || 0) + 1;
    (detail[`${file}|${rule}`] ??= []).push(`${file}:${m.line}:${m.column} ${m.message.split("\n")[0]} (${rule})`);
  }
}

const sortObj = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, typeof o[k] === "object" ? sortObj(o[k]) : o[k]]));

if (process.argv.includes("--update")) {
  fs.writeFileSync(BASELINE, JSON.stringify(sortObj(current), null, 2) + "\n");
  const n = Object.values(current).flatMap((x) => Object.values(x)).reduce((a, b) => a + b, 0);
  console.log(`baseline written: ${n} errors in ${Object.keys(current).length} files`);
  process.exit(0);
}

const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : {};
const worse = [];
let improved = 0;
for (const [file, rules] of Object.entries(current)) {
  for (const [rule, n] of Object.entries(rules)) {
    const allowed = baseline[file]?.[rule] || 0;
    if (n > allowed) worse.push({ file, rule, n, allowed });
  }
}
for (const [file, rules] of Object.entries(baseline)) {
  for (const [rule, n] of Object.entries(rules)) if ((current[file]?.[rule] || 0) < n) improved++;
}

if (worse.length) {
  console.error("New ESLint errors (over the baseline in tests/ci/eslint-baseline.json):\n");
  for (const w of worse) {
    console.error(`  ${w.file}  ${w.rule}: ${w.n} (baseline ${w.allowed})`);
    for (const line of detail[`${w.file}|${w.rule}`]) console.error(`    ${line}`);
  }
  console.error("\nFix them (run `npx eslint <file>`). Don't raise the baseline to make this pass.");
  process.exit(1);
}
const total = Object.values(current).flatMap((x) => Object.values(x)).reduce((a, b) => a + b, 0);
console.log(`lint ratchet ok: no new errors (${total} pre-existing).`);
if (improved) console.log(`${improved} file/rule count(s) went down — run \`npm run lint:baseline\` to lock that in.`);
