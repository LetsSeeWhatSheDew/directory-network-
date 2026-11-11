// Builds ONE-PAGER.pdf (US Letter leave-behind for dispensary meetings).
// Usage: node docs/sales-kit-2026-11-10/make-one-pager.mjs
// Numbers come from TRACTION.md (Search Console + live DB, Nov 10, 2026).
import { chromium } from "playwright-core";
import QRCode from "qrcode";

const OUT = "docs/sales-kit-2026-11-10/ONE-PAGER.pdf";
const url = "https://www.puffprice.com/for-dispensaries?utm_source=leave_behind&utm_medium=print&utm_campaign=nov26-sales";
const qr = (await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#16150Fff", light: "#00000000" } })).replace("<svg ", '<svg width="100%" height="100%" ');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
@page{size:8.5in 11in;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:"Host Grotesk",system-ui,sans-serif;color:#16150F;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.p{width:8.5in;height:11in;background:#FFFDF8;padding:.6in .65in .5in;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:center;font-size:9pt;letter-spacing:.12em;text-transform:uppercase;color:#6B6759;border-bottom:1px solid #E3DED2;padding-bottom:.12in}
.w{display:inline-flex;align-items:center;gap:7px;color:#16150F;font-weight:600;font-size:14pt;letter-spacing:-.01em;text-transform:none}
.w i{width:10px;height:10px;border-radius:50%;background:#B08A3E}
.k{margin:.42in 0 0;font-size:9.5pt;letter-spacing:.14em;text-transform:uppercase;color:#B08A3E;font-weight:600}
h1{margin:.06in 0 0;font-weight:300;font-size:40pt;line-height:1.02;letter-spacing:-.04em}
.lede{margin:.16in 0 0;font-size:12.5pt;line-height:1.5;color:#3F3C33;max-width:6.4in}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:.14in;margin-top:.34in}
.g div{border:1px solid #E3DED2;border-radius:10px;padding:.14in .16in;background:#fff}
.g b{display:block;font-size:28pt;font-weight:300;letter-spacing:-.035em;line-height:1.05}
.g span{font-size:9pt;color:#6B6759;line-height:1.4}
h2{margin:.36in 0 .1in;font-size:14pt;font-weight:600;letter-spacing:-.01em}
ol{margin:0 0 .28in;padding-left:.24in;font-size:11pt;line-height:1.55}
ol li::marker{color:#B08A3E;font-weight:600}
.offer{margin-top:auto;display:grid;grid-template-columns:1fr 1.7in;gap:.24in;background:#1E3A2B;color:#F4EFE4;border-radius:12px;padding:.24in .28in;align-items:center}
.offer .k{margin:0;color:#E2BE6E}
.offer h3{margin:.04in 0 .08in;font-size:17pt;font-weight:500;letter-spacing:-.02em}
.offer p{margin:0;font-size:10.5pt;line-height:1.5;color:#DCE3DA}
.price{font-size:40pt;font-weight:300;color:#E2BE6E;letter-spacing:-.04em;line-height:1}
.qr{background:#F4EFE4;border-radius:10px;padding:.12in;width:1.7in;height:1.7in}
.rule{margin:.18in 0 0;font-size:10.5pt;line-height:1.5}
.foot{margin-top:.18in;padding-top:.1in;border-top:1px solid #E3DED2;display:flex;justify-content:space-between;font-size:8.5pt;color:#6B6759}
</style></head><body><div class="p">
<div class="top"><span class="w"><i></i>PuffPrice</span><span>For Central Illinois dispensaries</span></div>
<p class="k">Market report</p>
<h1>See exactly where your store stands, every month.</h1>
<p class="lede">Every morning PuffPrice reads every dispensary's own website and menu in 9 Central Illinois cities and shows shoppers the best deal near them. The market report turns that into one page for you: your deals and shelf prices against every store within 15 miles.</p>
<div class="g">
  <div><b>26</b><span>licensed stores read every morning, from their own sites only</span></div>
  <div><b>3,370</b><span>times Google showed PuffPrice, Oct 12 – Nov 8, 2026</span></div>
  <div><b>2.3×</b><span>more Google visibility than the four weeks before</span></div>
</div>
<h2>What's in it</h2>
<ol>
  <li>How many days you ran a deal, and how that compares with the stores around you</li>
  <li>Your typical and deepest deal against theirs, store by store</li>
  <li>Your lowest eighth, cart and gummies out the door, ranked against every nearby store</li>
  <li>What shoppers search for in your city, and how often Google shows your city page</li>
  <li>What's missing from your listing, so shoppers see all of you</li>
</ol>
<div class="offer">
  <div>
    <p class="k">Founding price · first five stores</p>
    <h3><span class="price">$99</span> a month</h3>
    <p>Your first report is free. Billed by invoice, paid by ACH or check. Cancel any time. Being listed stays free.</p>
  </div>
  <div class="qr">${qr}</div>
</div>
<p class="rule"><b>Nobody pays to rank, including you.</b> Buying the report never changes where your deals appear. That's why shoppers trust what they see, and why it's worth being on.</p>
<div class="foot"><span>puffprice.com/for-dispensaries · hi@puffprice.com</span><span>Scan for your store's page and free report</span></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: OUT, width: "8.5in", height: "11in", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log("wrote", OUT);
