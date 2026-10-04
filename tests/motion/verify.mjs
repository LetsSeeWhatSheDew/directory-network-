#!/usr/bin/env node
// tests/motion/verify.mjs — checks the motion system's hard rules in a real browser.
//
//   BASE=http://localhost:3000 node tests/motion/verify.mjs [--quick]
//
// Local runs use tests/motion/mock-supabase.mjs (fixture data) when the real
// Supabase project isn't reachable. Checks, per page with deal cards:
//   1. Numbers never animate: no running CSS animation targets a Save pill,
//      the orb figure, a price, or anything that contains one. (The FLIP that
//      carries cards down when one opens is a WAAPI move of the whole card,
//      which the spec asks for; it's reported separately, never a fade/scale.)
//   2. Tapping a card never scrolls the page: scrollY before === after.
//   3. Get directions is hit-testable the instant the card opens (+1 frame).
//   4. prefers-reduced-motion: zero running animations, before and after a tap.
//   5. ?pace=2 doubles the paced durations.
//   6. Background motion (haze, fireflies) is paused after ~30s (html.pp-still)
//      and while the tab is hidden (html.pp-away).   (skipped with --quick)

import { chromium } from "playwright-core";

const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const QUICK = process.argv.includes("--quick");
const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const NUM = ".pp-save, .bh-num, .sv-amt, .save-amount, .pp-dc-keep b, .pp-dc-otd, .pp-otd b, .cp-tick-n, .bh-count b";

const PAGES = [
  ["home", "/"],
  ["city", "/city/peoria"],
  ["deals-all", "/deals/all"],
  ["store", "/dispensary/sample-heights"],
];

let failed = 0;
const ok = (c, msg) => {
  console.log(`  ${c ? "✓" : "✗"} ${msg}`);
  if (!c) failed++;
};

const numberAnims = (NUM) =>
  document
    .getAnimations()
    .filter((a) => a.playState === "running" && a.effect && a.effect.target && a.constructor.name === "CSSAnimation")
    .filter((a) => {
      const t = a.effect.target;
      const pseudo = a.effect.pseudoElement;
      if (pseudo) return false; // rings on ::after never touch the number itself
      return t.matches(NUM) || !!t.querySelector(NUM);
    })
    .map((a) => `${a.animationName} on ${a.effect.target.className || a.effect.target.tagName}`);

const browser = await chromium.launch({ executablePath: EXE });
// Fresh context per page; the first-visit city picker isn't under test.
const b = {
  newPage: async (opts = {}) => {
    const p = await browser.newPage(opts);
    await p.addInitScript(() => {
      try {
        sessionStorage.setItem("cl_picker_seen", "1");
      } catch {}
    });
    return p;
  },
  close: () => browser.close(),
};
for (const width of [390, 1440]) {
  for (const [name, path] of PAGES) {
    console.log(`\n${name} @${width}`);
    const p = await b.newPage({ viewport: { width, height: 900 } });
    await p.goto(`${BASE}${path}?daypart=day`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(60);
    const early = await p.evaluate(numberAnims, NUM);
    ok(early.length === 0, `no number animates on load${early.length ? ": " + early.join(", ") : ""}`);
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(800);
    const card = p.locator(".pp-dc").nth(1);
    if (!(await card.count())) {
      ok(false, "has deal cards");
      await p.close();
      continue;
    }
    // The site scrolls smoothly (html { scroll-behavior: smooth }), so position
    // the card with an instant scroll and wait for the page to be still before
    // reading scrollY; otherwise the test measures its own scroll animation.
    await p.evaluate(() => {
      const el = document.querySelectorAll(".pp-dc")[1];
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - 200), behavior: "instant" });
    });
    await p.waitForFunction(
      () =>
        new Promise((res) => {
          const a = window.scrollY;
          requestAnimationFrame(() => requestAnimationFrame(() => res(window.scrollY === a)));
        })
    );
    await p.waitForTimeout(250);
    const y0 = await p.evaluate(() => window.scrollY);
    await card.locator(".pp-dc-face").click();
    const hit = await p.evaluate(
      () =>
        new Promise((res) =>
          requestAnimationFrame(() => {
            const a = document.querySelector(".pp-dc.is-open .pp-dc-act.main");
            if (!a) return res("no directions link");
            const r = a.getBoundingClientRect();
            const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            res(el && (el === a || a.contains(el)) ? "ok" : `covered by ${el && el.className}`);
          })
        )
    );
    ok(hit === "ok", `Get directions tappable the instant the card opens (${hit})`);
    const mid = await p.evaluate(numberAnims, NUM);
    ok(mid.length === 0, `no number animates while opening${mid.length ? ": " + mid.join(", ") : ""}`);
    await p.waitForTimeout(1700);
    const y1 = await p.evaluate(() => window.scrollY);
    ok(y0 === y1, `tap never scrolls: scrollY ${y0} → ${y1}`);
    await p.close();

    // Reduced motion: a fully still page.
    const r = await b.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await r.goto(`${BASE}${path}?daypart=night`, { waitUntil: "networkidle", timeout: 120000 });
    const still0 = await r.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    const rc = r.locator(".pp-dc").nth(1);
    await rc.scrollIntoViewIfNeeded();
    await rc.locator(".pp-dc-face").click();
    await r.waitForTimeout(100);
    const still1 = await r.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    ok(still0 === 0 && still1 === 0, `reduced motion: ${still0} running animations on load, ${still1} after a tap`);
    await r.close();
  }
}

// Pace.
{
  const p = await b.newPage();
  await p.goto(`${BASE}/?pace=2`, { waitUntil: "domcontentloaded" });
  const v = await p.evaluate(() => {
    const d = document.createElement("div");
    d.style.transitionDuration = "var(--pp-t-release)";
    document.body.appendChild(d);
    return getComputedStyle(d).transitionDuration;
  });
  ok(v === "5.2s", `?pace=2 doubles the release (2.6s → ${v})`);
  await p.close();
}

if (!QUICK) {
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p.goto(`${BASE}/?daypart=night`, { waitUntil: "networkidle" });
  await p.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const away = await p.evaluate(() => ({
    cls: document.documentElement.classList.contains("pp-away"),
    state: getComputedStyle(document.querySelector(".bh-ff")).animationPlayState,
  }));
  ok(away.cls && away.state.startsWith("paused"), `hidden tab pauses fireflies (${away.state})`);
  await p.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await p.waitForTimeout(31000);
  const still = await p.evaluate(() => ({
    cls: document.documentElement.classList.contains("pp-still"),
    running: document
      .getAnimations()
      .filter((a) => a.playState === "running" && a.effect?.target?.matches?.(".hz-w, .dk-mist, .pp-ff, .bh-ff")).length,
  }));
  ok(still.cls && still.running === 0, `haze + fireflies settle after ~30s (pp-still=${still.cls}, running=${still.running})`);
  await p.close();
}

await b.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nall motion checks passed");
process.exit(failed ? 1 : 0);
