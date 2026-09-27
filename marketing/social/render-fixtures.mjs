// marketing/social/render-fixtures.mjs — renders every social template with
// the made-up fixture data into docs/screenshots/social/, plus a screenshot
// of the /social page. For design review; never for posting (every fixture
// image is stamped "Sample data · not live").
//
//   npx next build
//   SOCIAL_FIXTURES=1 npx next start -p 3456 &
//   node marketing/social/render-fixtures.mjs http://localhost:3456
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://localhost:3456";
const out = "docs/screenshots/social";
const templates = ["saving", "city", "index", "cheapest", "law", "drive-thru"];
await mkdir(out, { recursive: true });

for (const t of templates) {
  for (const size of ["feed", "story"]) {
    for (const theme of ["day", "night"]) {
      const r = await fetch(`${base}/og/social/${t}?size=${size}&theme=${theme}`);
      if (!r.ok) throw new Error(`${t} ${size} ${theme}: HTTP ${r.status}`);
      await writeFile(`${out}/${t}-${size}-${theme}.png`, Buffer.from(await r.arrayBuffer()));
      console.log("✓", t, size, theme);
    }
  }
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [name, width] of [["social-page-desktop", 1280], ["social-page-mobile", 390]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/social?theme=day`, { waitUntil: "networkidle" });
  // Load the lazy images before the full-page shot.
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll("img")) img.loading = "eager";
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width, height: width > 400 ? 2000 : 1700 } });
  console.log("✓", name);
  await page.close();
}
await browser.close();
