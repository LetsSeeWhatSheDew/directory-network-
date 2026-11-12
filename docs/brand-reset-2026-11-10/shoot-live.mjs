// Phone screenshots + quick audit of the live site, Nov 10 2026 brand-reset run.
// Usage: node docs/brand-reset-2026-11-10/shoot-live.mjs [baseUrl] [outDir] [routes.json]
// Uses playwright-core (already in node_modules) with the iPhone 13 profile, 390x844.
import { chromium, devices } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "https://www.puffprice.com";
const OUT = process.argv[3] || "docs/brand-reset-2026-11-10/shots/live";
const ROUTES = process.argv[4]
  ? JSON.parse(fs.readFileSync(process.argv[4], "utf8"))
  : [
      ["home", "/"],
      ["deals-all", "/deals/all"],
      ["city-peoria", "/city/peoria"],
      ["city-east-peoria", "/city/east-peoria"],
      ["dispensary-nuera-east-peoria", "/dispensary/nuera-east-peoria"],
      ["drive-thru", "/drive-thru"],
      ["how-we-rank", "/how-we-rank"],
      ["alerts", "/alerts"],
      ["law-updates", "/law-updates"],
      ["status", "/status"],
    ];
const FULL = !process.argv[4];
fs.mkdirSync(OUT, { recursive: true });

const iphone = { ...devices["iPhone 13"], deviceScaleFactor: 2 };
const browser = await chromium.launch();
const report = [];

for (const daypart of ["day", "night"]) {
  const ctx = await browser.newContext({ ...iphone });
  for (const [name, route] of ROUTES) {
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__lcp = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    const sep = route.includes("?") ? "&" : "?";
    const url = `${BASE}${route}${sep}daypart=${daypart}`;
    const t0 = Date.now();
    let status = 0;
    try {
      const res = await page.goto(url, { waitUntil: "load", timeout: 45000 });
      status = res?.status() ?? 0;
    } catch (e) {
      report.push({ name, daypart, url, error: String(e) });
      await page.close();
      continue;
    }
    await page.waitForTimeout(3500); // let the load animation settle
    const loadMs = Date.now() - t0;
    await page.screenshot({ path: path.join(OUT, `${name}-${daypart}.png`) });
    if (FULL && daypart === "day") {
      await page.screenshot({ path: path.join(OUT, `${name}-${daypart}-full.jpg`), fullPage: true, type: "jpeg", quality: 60, scale: "css" });
    }
    if (FULL && name === "home") {
      // footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT, `footer-${daypart}.png`) });
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    const audit = await page.evaluate(() => {
      const vh = window.innerHeight;
      const txt = (el) => (el.innerText || "").replace(/\s+/g, " ").trim();
      // First-screen text: visible text nodes whose box top is within the viewport
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const first = [];
      let n;
      while ((n = walker.nextNode())) {
        const s = n.textContent.replace(/\s+/g, " ").trim();
        if (!s) continue;
        const el = n.parentElement;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.top < vh && r.bottom > 0) first.push(s);
      }
      const firstText = first.join(" | ");
      const words = firstText.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
      const numbers = (firstText.match(/\$?\d[\d,.:]*%?/g) || []).length;
      // Tap targets
      const taps = [...document.querySelectorAll("a,button,input,select,[role=button]")].filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
      });
      const small = taps.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height < 44 || r.width < 44;
      });
      const smallSamples = small.slice(0, 8).map((el) => {
        const r = el.getBoundingClientRect();
        return `${Math.round(r.width)}x${Math.round(r.height)} "${txt(el).slice(0, 30)}"`;
      });
      // Contrast (approx): text color vs first opaque ancestor background
      const parse = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
      };
      const lum = ({ r, g, b }) => {
        const f = (v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const bgOf = (el) => {
        let e = el;
        while (e) {
          const c = parse(getComputedStyle(e).backgroundColor);
          if (c && c.a > 0.9) return c;
          if (getComputedStyle(e).backgroundImage !== "none") return null; // unknown
          e = e.parentElement;
        }
        return parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
      };
      const lowContrast = [];
      const seenEl = new Set();
      const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while ((n = w2.nextNode())) {
        const s = n.textContent.trim();
        if (!s) continue;
        const el = n.parentElement;
        if (seenEl.has(el)) continue;
        seenEl.add(el);
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (!r.width) continue;
        const fg = parse(cs.color);
        const bg = bgOf(el);
        if (!fg || !bg) continue;
        const op = +cs.opacity;
        const fgc = { r: fg.r * fg.a * op + bg.r * (1 - fg.a * op), g: fg.g * fg.a * op + bg.g * (1 - fg.a * op), b: fg.b * fg.a * op + bg.b * (1 - fg.a * op) };
        const L1 = lum(fgc), L2 = lum(bg);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const size = parseFloat(cs.fontSize);
        const bold = +cs.fontWeight >= 700;
        const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
        if (ratio < need) lowContrast.push(`${ratio.toFixed(2)} "${s.slice(0, 40)}"`);
      }
      const meta = (sel, attr = "content") => document.querySelector(sel)?.getAttribute(attr) || null;
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
        try {
          const j = JSON.parse(s.textContent);
          const t = (x) => (Array.isArray(x) ? x.map(t).flat() : x?.["@graph"] ? x["@graph"].map(t).flat() : [x?.["@type"]]);
          return t(j);
        } catch {
          return ["(bad json)"];
        }
      }).flat();
      return {
        title: document.title,
        h1: [...document.querySelectorAll("h1")].map(txt),
        canonical: meta('link[rel="canonical"]', "href"),
        robots: meta('meta[name="robots"]'),
        description: meta('meta[name="description"]'),
        jsonld: [...new Set(ld.filter(Boolean))],
        firstText: firstText.slice(0, 1200),
        firstWords: words,
        firstNumbers: numbers,
        pageHeight: document.body.scrollHeight,
        tapTargets: taps.length,
        smallTaps: small.length,
        smallSamples,
        lowContrastCount: lowContrast.length,
        lowContrast: lowContrast.slice(0, 10),
        lcp: Math.round(window.__lcp),
      };
    });
    report.push({ name, daypart, url, status, loadMs, ...audit });
    console.log(`${daypart} ${name} ${status} lcp=${audit.lcp} words=${audit.firstWords} nums=${audit.firstNumbers} small=${audit.smallTaps}/${audit.tapTargets} lowC=${audit.lowContrastCount}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "audit.json"), JSON.stringify(report, null, 2));
console.log("wrote", path.join(OUT, "audit.json"));
