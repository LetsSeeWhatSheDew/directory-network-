// Usage: node docs/sales-kit-2026-11-10/make-market-reports.mjs <outDir> <slug> [slug…]
// BASE (env) = the site to print from: default http://localhost:3100 (dev server);
// the "Market report PDFs" workflow sets https://www.puffprice.com.
// PW_CHANNEL=chrome uses the installed Google Chrome (GitHub runners have it).
import { chromium } from "playwright-core";
const BASE = process.env.BASE || "http://localhost:3100";
(async()=>{const b=await chromium.launch(process.env.PW_CHANNEL?{channel:process.env.PW_CHANNEL}:{});const p=await b.newPage();
for(const s of process.argv.slice(3)){await p.goto(`${BASE}/for-dispensaries/${s}/market-report`,{waitUntil:"networkidle",timeout:180000});await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:`${process.argv[2]}/market-report-${s}.pdf`,width:"8.5in",height:"11in",printBackground:true,preferCSSPageSize:true});console.log("pdf",s);}
await b.close()})().catch(e=>{console.error(e);process.exit(1)});
