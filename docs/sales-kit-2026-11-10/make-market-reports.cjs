const {chromium}=require("playwright-core");
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const s of process.argv.slice(3)){await p.goto(`http://localhost:3100/for-dispensaries/${s}/market-report`,{waitUntil:"networkidle",timeout:180000});await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:`${process.argv[2]}/market-report-${s}.pdf`,width:"8.5in",height:"11in",printBackground:true,preferCSSPageSize:true});console.log("pdf",s);}
await b.close()})().catch(e=>{console.error(e);process.exit(1)});
