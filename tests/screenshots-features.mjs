// tests/screenshots-features.mjs — full-page screenshots of the Sep 27 feature
// pages at 390px and 1440px, plus the deal-of-the-day share images.
// Run against a dev server backed by tests/fixtures/supabase-fixture.mjs
// (SAMPLE data only):  BASE=http://127.0.0.1:3100 node tests/screenshots-features.mjs
import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";

const BASE = process.env.BASE || "http://127.0.0.1:3100";
const OUT = "docs/screenshots/features";
const PAGES = [
  ["deal-of-the-day", "/deal-of-the-day"],
  ["route", "/route"],
  ["route-peoria-to-bloomington", "/route/peoria-to-bloomington"],
  ["route-peoria-to-springfield", "/route/peoria-to-springfield"],
  ["route-bloomington-to-champaign", "/route/bloomington-to-champaign"],
  ["route-bloomington-to-springfield", "/route/bloomington-to-springfield"],
  ["price-watch", "/price-watch?store=sample-riverside-peoria&item=eighth#eighth-sample-riverside-peoria"],
  ["green-wednesday", "/green-wednesday"],
  ["420", "/420"],
  ["710", "/710"],
  ["store-accuracy-scored", "/dispensary/sample-riverside-peoria"],
  ["store-accuracy-thin", "/dispensary/sample-east-bank"],
  ["how-we-rank", "/how-we-rank#accuracy"],
];
const WIDTHS = [390, 1440];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const [name, path] of PAGES) {
    const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}daypart=day`.replace(/(#[^?&]*)(.*)$/, "$2$1");
    await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    // Hide the Next.js dev-mode badge; it isn't part of the page.
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}-${w}.jpg`, fullPage: true, type: "jpeg", quality: 80 });
    console.log(`${name}-${w}.jpg`);
  }
  await ctx.close();
}
for (const size of ["og", "post"]) {
  const r = await fetch(`${BASE}/og/deal-of-the-day?size=${size}`);
  await writeFile(`${OUT}/og-deal-of-the-day-${size}.png`, Buffer.from(await r.arrayBuffer()));
  const n = await fetch(`${BASE}/og/deal-of-the-day?size=${size}&theme=night`);
  await writeFile(`${OUT}/og-deal-of-the-day-${size}-night.png`, Buffer.from(await n.arrayBuffer()));
  console.log(`og-deal-of-the-day-${size}.png`);
}
await browser.close();
