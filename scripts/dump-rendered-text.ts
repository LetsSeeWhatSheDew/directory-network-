// Debug helper: print deal-ish lines from a rendered page (+ frames).
//   npx tsx scripts/dump-rendered-text.ts <url> [<url>...]
import { chromium } from "playwright-core";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  for (const u of process.argv.slice(2)) {
    const p = await ctx.newPage();
    try {
      await p.goto(u, { waitUntil: "domcontentloaded", timeout: 30000 });
      const gate = p.getByRole("button", { name: /^(yes|i am 21|i'm 21|i am over 21|enter)/i }).first();
      if (await gate.isVisible().catch(() => false)) await gate.click().catch(() => {});
      await p.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(3000);
      const texts: string[] = [];
      for (const f of p.frames()) { try { texts.push(await f.evaluate(() => document.body?.innerText || "")); } catch {} }
      const lines = texts.join("\n").split("\n").map((s) => s.trim()).filter((s) => /%|\boff\b|bogo|\$\d|deal|special/i.test(s) && s.length < 160);
      console.log(`\n### ${u}  (${await p.title()})\n` + [...new Set(lines)].slice(0, 40).join("\n"));
      const links = await p.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href).filter((h) => /deal|special|promo|menu|shop/i.test(h)));
      console.log("links: " + [...new Set(links)].slice(0, 12).join(" "));
    } catch (e) { console.log(`### ${u} ERR ${(e as Error).message.slice(0, 80)}`); }
    await p.close();
  }
  await b.close();
})();
