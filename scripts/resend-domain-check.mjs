// scripts/resend-domain-check.mjs: READ-ONLY. Asks Resend for the status of
// the sending domain(s) and each DNS record it expects. Prints no secrets.
const key = process.env.RESEND_API_KEY;
if (!key) { console.log("RESEND_API_KEY is not a GitHub secret here; can't ask Resend."); process.exit(0); }
const get = async (p) => (await fetch(`https://api.resend.com${p}`, { headers: { Authorization: `Bearer ${key}` } })).json();
const list = await get("/domains");
if (!Array.isArray(list.data)) { console.log("Resend /domains:", JSON.stringify(list).slice(0, 300)); process.exit(0); }
for (const d of list.data) {
  const full = await get(`/domains/${d.id}`);
  console.log(`domain ${full.name}: status=${full.status} region=${full.region}`);
  for (const r of full.records || []) console.log(`  ${r.record} ${r.type} ${r.name} → ${String(r.value).slice(0, 70)} [${r.status}]`);
}
