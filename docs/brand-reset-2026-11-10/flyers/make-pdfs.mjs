// Print the three 4x6 flyers to PDF. Usage: node docs/brand-reset-2026-11-10/flyers/make-pdfs.mjs [baseUrl]
import { chromium } from "playwright-core";
const BASE = process.argv[2] || "http://localhost:3100";
const browser = await chromium.launch();
const page = await browser.newPage();
for (const v of ["vault", "gallery", "instrument"]) {
  await page.goto(`${BASE}/preview/brand-reset/${v}/flyer?daypart=day`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: `docs/brand-reset-2026-11-10/flyers/flyer-${v}-4x6.pdf`, width: "4in", height: "6in", printBackground: true, preferCSSPageSize: true });
  console.log("wrote", v);
}
await browser.close();
