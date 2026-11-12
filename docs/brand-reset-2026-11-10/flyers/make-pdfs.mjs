// Print the three flyers to PDF. Usage:
//   node docs/brand-reset-2026-11-10/flyers/make-pdfs.mjs [baseUrl]
// Writes, per design:
//   <name>-4x6.pdf          4×6 in card (print shop / photo paper)
//   <name>-letter.pdf       US Letter, one big flyer per sheet (7 × 10.5 in), crop marks
//   <name>-letter-2up.pdf   US Letter landscape, two 4×6 flyers per sheet, cut marks
// Everything stays vector (text, leaf, QR), so it prints sharp on any printer.
import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://localhost:3100";
const OUT = "docs/brand-reset-2026-11-10/flyers";
const DESIGNS = [
  ["vault", "gold-leaf"],
  ["gallery", "big-leaf"],
  ["instrument", "leaf-code"],
];

// Crop marks: short hairlines just outside each card corner.
const marks = (sel) => `
${sel}{position:relative;overflow:visible!important}
${sel}::before,${sel}::after{content:"";position:absolute;inset:-0.18in;pointer-events:none;
  background:
   linear-gradient(#999,#999) 0 0.18in/0.12in 0.5pt no-repeat,
   linear-gradient(#999,#999) 0.18in 0/0.5pt 0.12in no-repeat,
   linear-gradient(#999,#999) 100% 0.18in/0.12in 0.5pt no-repeat,
   linear-gradient(#999,#999) calc(100% - 0.18in) 0/0.5pt 0.12in no-repeat,
   linear-gradient(#999,#999) 0 calc(100% - 0.18in)/0.12in 0.5pt no-repeat,
   linear-gradient(#999,#999) 0.18in 100%/0.5pt 0.12in no-repeat,
   linear-gradient(#999,#999) 100% calc(100% - 0.18in)/0.12in 0.5pt no-repeat,
   linear-gradient(#999,#999) calc(100% - 0.18in) 100%/0.5pt 0.12in no-repeat}
${sel}::after{display:none}`;

const BASE_PRINT = `
html.brx-on,html.brx-on body{background:#fff!important}
.fl-note,nextjs-portal{display:none!important}
.fl-wrap{min-height:0!important;padding:0!important}
.fl{box-shadow:none!important;max-width:none!important}`;

// 1-up: the 4×6 card scaled 1.75× = 7 × 10.5 in, centered on 8.5 × 11.
// zoom (not transform) so layout and text re-render at size, not as a bitmap.
const LETTER = `
@page{size:8.5in 11in!important;margin:0}
${BASE_PRINT}
.fl-wrap{width:8.5in;height:11in;display:flex;align-items:center;justify-content:center}
.fl{width:4in!important;height:6in!important;zoom:1.75}
${marks(".fl-frame")}
.fl-frame{width:7in;height:10.5in}`;

// 2-up: two cards side by side on landscape letter, 0.5in gutter.
const TWOUP = `
@page{size:11in 8.5in!important;margin:0}
${BASE_PRINT}
.fl-wrap{width:11in;height:8.5in;flex-direction:row!important;align-items:center;justify-content:center;gap:0.6in!important}
.fl{width:4in!important;height:6in!important}
${marks(".fl-frame")}
.fl-frame{width:4in;height:6in}`;

const browser = await chromium.launch();
const page = await browser.newPage();

async function load(v) {
  await page.goto(`${BASE}/preview/brand-reset/${v}/flyer?daypart=day`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
}

for (const [v, name] of DESIGNS) {
  // 4×6 card
  await load(v);
  await page.pdf({ path: `${OUT}/${name}-4x6.pdf`, width: "4in", height: "6in", printBackground: true, preferCSSPageSize: true });

  // Letter, one per sheet
  await load(v);
  await page.addStyleTag({ content: LETTER });
  await page.evaluate(() => {
    const fl = document.querySelector(".fl");
    const frame = document.createElement("div");
    frame.className = "fl-frame";
    fl.replaceWith(frame);
    frame.appendChild(fl);
  });
  await page.pdf({ path: `${OUT}/${name}-letter.pdf`, width: "8.5in", height: "11in", printBackground: true, preferCSSPageSize: false });

  // Letter, two per sheet
  await load(v);
  await page.addStyleTag({ content: TWOUP });
  await page.evaluate(() => {
    const fl = document.querySelector(".fl");
    const wrap = fl.parentElement;
    const a = document.createElement("div");
    a.className = "fl-frame";
    fl.replaceWith(a);
    a.appendChild(fl);
    const b = a.cloneNode(true);
    wrap.insertBefore(b, a.nextSibling);
  });
  await page.pdf({ path: `${OUT}/${name}-letter-2up.pdf`, width: "11in", height: "8.5in", printBackground: true, preferCSSPageSize: false });
  console.log("wrote", name);
}
await browser.close();
