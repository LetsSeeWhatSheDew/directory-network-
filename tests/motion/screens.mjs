#!/usr/bin/env node
// tests/motion/screens.mjs — the motion screenshot matrix for review.
//
//   BASE=http://localhost:3100 node tests/motion/screens.mjs
//
// 390px + 1440px × day + night × reduced motion off + on, for: home, a city
// page, /deals/all, a store page, /alerts, an empty state, an opened deal card,
// and an opened card with an out-the-door estimate. Written as JPEGs to docs/screenshots/motion/. Motion-on shots are
// taken after the load inhale (2.5s) so they show the settled page.

import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = (process.env.BASE || "http://localhost:3100").replace(/\/$/, "");
const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT = "docs/screenshots/motion";
mkdirSync(OUT, { recursive: true });

const SHOTS = [
  ["home", "/"],
  ["city", "/city/peoria"],
  ["deals-all", "/deals/all"],
  ["store", "/dispensary/sample-heights"],
  ["alerts", "/alerts"],
  ["empty", "/city/urbana", ".pp-held"],
  ["opened", "/", ".bh-cards .pp-dc:nth-child(2)", true],
  ["opened-otd", "/dispensary/sample-leaf-peoria", ".sd-deals .pp-dc:nth-child(2)", true],
];

const browser = await chromium.launch({ executablePath: EXE });
for (const width of [390, 1440]) {
  for (const daypart of ["day", "night"]) {
    for (const reduced of [false, true]) {
      const ctx = await browser.newContext({
        viewport: { width, height: width < 600 ? 844 : 900 },
        deviceScaleFactor: 1,
        reducedMotion: reduced ? "reduce" : "no-preference",
      });
      // The first-visit city picker isn't what we're reviewing; mark it seen.
      await ctx.addInitScript(() => {
        try {
          sessionStorage.setItem("cl_picker_seen", "1");
        } catch {}
      });
      const page = await ctx.newPage();
      for (const [name, path, focus, open] of SHOTS) {
        await page.goto(`${BASE}${path}?daypart=${daypart}`, { waitUntil: "networkidle", timeout: 120000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(reduced ? 200 : 2500);
        if (focus) {
          const el = page.locator(focus).first();
          await el.scrollIntoViewIfNeeded();
          await page.evaluate(() => window.scrollBy(0, -140));
          if (open) {
            await el.locator(".pp-dc-face").click();
            await page.waitForTimeout(reduced ? 100 : 600); // mid-exhale: plume up, card open
          }
        }
        const file = `${OUT}/${name}-${width}-${daypart}${reduced ? "-still" : ""}.jpg`;
        await page.screenshot({ path: file, type: "jpeg", quality: 78 });
        console.log(file);
      }
      await ctx.close();
    }
  }
}
await browser.close();
