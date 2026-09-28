#!/usr/bin/env node
// tests/perf/lighthouse-budget.mjs
// =============================================================================
// Performance budget for the pages people open in a parking lot: the home
// page and a city page, as a 390px phone. Lighthouse (performance category)
// with its standard simulated mobile throttling: slow 4G, 4× CPU slowdown.
//
// Fails when any page is over budget. Budgets are set with headroom above the
// numbers measured on 2026-09-27 (see the PR), so they catch a regression —
// a new heavy script, a layout shift, a blocking render — not normal noise.
// Each page runs RUNS times and the median is checked.
//
//   npm run test:perf                       # starts mock + next start itself
//   BASE_URL=https://x.vercel.app npm run test:perf
// Writes a markdown summary to perf-report.md (CI appends it to the job summary).
// =============================================================================
import { spawn } from "node:child_process";
import fs from "node:fs";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright-core";

const PAGES = [
  { name: "Home", path: "/" },
  { name: "City (Peoria)", path: "/city/peoria" },
];

/** Budgets (median of RUNS). Scores 0–100; times in ms; bytes transferred. */
export const BUDGET = {
  score: 85,        // Lighthouse performance score, at least   (measured 94–95)
  fcp: 2000,        // First Contentful Paint, at most          (0.9–1.1s)
  lcp: 4000,        // Largest Contentful Paint                 (3.0–3.2s)
  tbt: 250,         // Total Blocking Time                      (30–45ms)
  cls: 0.1,         // Cumulative Layout Shift                  (0)
  jsKB: 250,        // JavaScript transferred                   (~170 KB)
  totalKB: 700,     // everything transferred                   (~390–430 KB)
};

const RUNS = Number(process.env.PERF_RUNS || 3);
const PORT = Number(process.env.E2E_PORT || 3100);
let base = process.env.BASE_URL;
let server;

async function waitFor(url, ms = 120_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`server not up at ${url}`);
}

if (!base) {
  base = `http://127.0.0.1:${PORT}`;
  server = spawn("node", ["tests/fixtures/with-mock.mjs", "npx", "next", "start", "-p", String(PORT)], { stdio: "ignore", detached: true });
  await waitFor(`${base}/robots.txt`);
}

const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

const config = {
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance"],
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false },
    throttlingMethod: "simulate",
    // Third parties (analytics) never load in tests; block them here too so
    // the number is ours, not Google's.
    blockedUrlPatterns: ["*googletagmanager.com*", "*google-analytics.com*"],
  },
};

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const rows = [];
let failed = false;

try {
  for (const p of PAGES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const r = await lighthouse(`${base}${p.path}?daypart=day`, { port: chrome.port, output: "json", logLevel: "error" }, config);
      const a = r.lhr.audits;
      const items = a["resource-summary"]?.details?.items || [];
      const kb = (type) => Math.round((items.find((x) => x.resourceType === type)?.transferSize || 0) / 1024);
      runs.push({
        score: Math.round((r.lhr.categories.performance.score || 0) * 100),
        fcp: a["first-contentful-paint"].numericValue,
        lcp: a["largest-contentful-paint"].numericValue,
        tbt: a["total-blocking-time"].numericValue,
        cls: a["cumulative-layout-shift"].numericValue,
        jsKB: kb("script"),
        totalKB: kb("total"),
      });
    }
    const m = Object.fromEntries(Object.keys(runs[0]).map((k) => [k, median(runs.map((r) => r[k]))]));
    const over = [];
    if (m.score < BUDGET.score) over.push(`score ${m.score} < ${BUDGET.score}`);
    for (const k of ["fcp", "lcp", "tbt", "cls", "jsKB", "totalKB"]) if (m[k] > BUDGET[k]) over.push(`${k} ${m[k]} > ${BUDGET[k]}`);
    if (over.length) failed = true;
    rows.push({ ...p, m, over });
    console.log(`${over.length ? "✗" : "✓"} ${p.name} ${p.path}: score ${m.score}, FCP ${Math.round(m.fcp)}ms, LCP ${Math.round(m.lcp)}ms, TBT ${Math.round(m.tbt)}ms, CLS ${m.cls.toFixed(3)}, JS ${m.jsKB}KB, total ${m.totalKB}KB${over.length ? `  — over budget: ${over.join(", ")}` : ""}`);
  }
} finally {
  await chrome.kill();
  if (server) try { process.kill(-server.pid); } catch {}
}

const md = [
  `### Performance budget (390px, Lighthouse simulated mobile, median of ${RUNS})`,
  "",
  "| Page | Score | FCP | LCP | TBT | CLS | JS | Total | |",
  "|---|--:|--:|--:|--:|--:|--:|--:|---|",
  ...rows.map(({ name, path, m, over }) => `| ${name} \`${path}\` | ${m.score} | ${(m.fcp / 1000).toFixed(2)}s | ${(m.lcp / 1000).toFixed(2)}s | ${Math.round(m.tbt)}ms | ${m.cls.toFixed(3)} | ${m.jsKB} KB | ${m.totalKB} KB | ${over.length ? "❌ " + over.join(", ") : "✅"} |`),
  `| **Budget** | ≥${BUDGET.score} | ≤${BUDGET.fcp / 1000}s | ≤${BUDGET.lcp / 1000}s | ≤${BUDGET.tbt}ms | ≤${BUDGET.cls} | ≤${BUDGET.jsKB} KB | ≤${BUDGET.totalKB} KB | |`,
  "",
].join("\n");
fs.writeFileSync("perf-report.md", md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n");
process.exit(failed ? 1 : 0);
