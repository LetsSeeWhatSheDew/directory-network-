// Phone screenshots of the brand-reset preview pages, day + night, 390x844.
// Usage: node docs/brand-reset-2026-11-10/shoot-preview.mjs [baseUrl] [only-prefix]
import { chromium, devices } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://localhost:3100";
const ONLY = process.argv[3] || "";
const OUT = "docs/brand-reset-2026-11-10/shots/preview";
fs.mkdirSync(OUT, { recursive: true });

// [file name, route, optional selector to tap before the "tapped" shot]
const ROUTES = [
  ["index", "/preview/brand-reset"],
  ["best-bud-1-home", "/preview/brand-reset/best-bud", ".bud-tap"],
  ["best-bud-2-deal", "/preview/brand-reset/best-bud/deal", ".bud-row"],
  ["best-bud-3-pro", "/preview/brand-reset/best-bud/pro"],
  ["best-bud-4-stores", "/preview/brand-reset/best-bud/stores"],
  ["scout-1-home", "/preview/brand-reset/scout", ".sc-tap"],
  ["scout-2-deal", "/preview/brand-reset/scout/deal", ".sc-row"],
  ["scout-3-pro", "/preview/brand-reset/scout/pro"],
  ["scout-4-stores", "/preview/brand-reset/scout/stores"],
].filter(([n]) => n.startsWith(ONLY));

const browser = await chromium.launch();
const issues = [];
for (const daypart of ["day", "night"]) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 2 });
  for (const [name, route, tap] of ROUTES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    const res = await page.goto(`${BASE}${route}?daypart=${daypart}`, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${name}-${daypart}.png`) });
    await page.screenshot({ path: path.join(OUT, `${name}-${daypart}-full.png`), fullPage: true });
    if (tap) {
      const el = page.locator(tap).first();
      if (await el.count()) {
        await el.click();
        await page.waitForTimeout(700);
        const expanded = await el.getAttribute("aria-expanded");
        if (expanded !== "true") issues.push(`${name} ${daypart}: tap did not open (aria-expanded=${expanded})`);
        await page.screenshot({ path: path.join(OUT, `${name}-${daypart}-tapped-full.png`), fullPage: true });
      } else issues.push(`${name}: no ${tap} to tap`);
    }
    const check = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
      const small = [...document.querySelectorAll(".brx a, .brx button")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const inline = getComputedStyle(el).display === "inline" && el.closest("p,li,td,span");
          return r.width > 0 && r.height > 0 && r.height < 44 && !inline;
        })
        .map((el) => `${Math.round(el.getBoundingClientRect().height)}px "${(el.textContent || "").trim().slice(0, 30)}"`);
      const fonts = [".bud-say", ".bud-sub", ".sc-big", ".sc-body"].map((s) => {
        const el = document.querySelector(s);
        return el ? `${s}: ${getComputedStyle(el).fontFamily.split(",")[0]}` : null;
      }).filter(Boolean);
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content");
      return { overflow, small, fonts, robots };
    });
    if (res.status() !== 200) issues.push(`${name} ${daypart}: HTTP ${res.status()}`);
    if (check.overflow) issues.push(`${name} ${daypart}: horizontal overflow`);
    if (check.small.length) issues.push(`${name} ${daypart}: small taps ${check.small.join("; ")}`);
    if (!/noindex/.test(check.robots || "")) issues.push(`${name}: robots meta = ${check.robots}`);
    if (errs.length) issues.push(`${name} ${daypart}: console ${errs.slice(0, 2).join(" | ")}`);
    console.log(daypart, name, res.status(), check.fonts.join(" "));
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(issues.length ? "ISSUES:\n" + issues.join("\n") : "no issues");
