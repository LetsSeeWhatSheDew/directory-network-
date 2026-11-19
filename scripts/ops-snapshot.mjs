// scripts/ops-snapshot.mjs — READ-ONLY health snapshot for PuffPrice, run from
// GitHub Actions (.github/workflows/ops-snapshot.yml) because that's where the
// service key lives and the network is open. Writes nothing anywhere.
//
// Prints: mail DNS for puffprice.com (where hi@ goes), production page checks,
// live deals per city, alert subscriber counts (no addresses), the newest
// scraper runs, and the three Bloom stores' phone numbers.
import { execSync } from "node:child_process";

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = "https://www.puffprice.com";
const CITIES = ["Peoria", "East Peoria", "Peoria Heights", "Pekin", "Bloomington", "Normal", "Champaign", "Urbana", "Springfield"];

const h = (t) => console.log(`\n## ${t}`);
const sh = (c) => { try { return execSync(c, { encoding: "utf8", timeout: 20000 }).trim(); } catch (e) { return `ERR ${e.message.split("\n")[0]}`; } };

async function rest(path, { count = false } = {}) {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, ...(count ? { Prefer: "count=exact", Range: "0-0" } : {}) },
    signal: AbortSignal.timeout(20000),
  });
  if (count) return Number((r.headers.get("content-range") || "/?").split("/")[1]);
  return r.ok ? r.json() : { error: r.status, body: (await r.text()).slice(0, 200) };
}

h("Mail DNS (puffprice.com)");
for (const t of ["MX", "TXT"]) console.log(`${t}:\n${sh(`dig +short ${t} puffprice.com`)}`);
console.log(`send.puffprice.com MX/TXT (Resend):\n${sh("dig +short MX send.puffprice.com")}\n${sh("dig +short TXT send.puffprice.com")}`);
console.log(`resend._domainkey TXT present: ${sh("dig +short TXT resend._domainkey.puffprice.com").length > 20}`);

h("Production pages");
for (const p of ["/", "/alerts", "/upgrade", "/status", "/green-wednesday", "/deals/all"]) {
  try {
    const r = await fetch(SITE + p, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    const body = r.status === 200 ? await r.text() : "";
    const notes = [];
    if (r.headers.get("location")) notes.push(`→ ${r.headers.get("location")}`);
    if (body.includes("$0.99")) notes.push("SHOWS $0.99");
    const m = body.match(/(\d+)<\/b><span>deals live now/);
    if (m) notes.push(`status says ${m[1]} deals live`);
    console.log(`${p}: ${r.status} ${notes.join(" · ")}`);
  } catch (e) { console.log(`${p}: ERR ${e.message}`); }
}

h("Search titles (what Google shows)");
for (const p of ["/", "/city/peoria", "/city/champaign", "/city/springfield", "/city/east-peoria"]) {
  try {
    const html = await (await fetch(SITE + p, { signal: AbortSignal.timeout(20000) })).text();
    const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "(none)";
    console.log(`${p}: ${t.replace(/&amp;/g, "&")}`);
  } catch (e) { console.log(`${p}: ERR ${e.message}`); }
}

if (!KEY) { console.log("\n(no service key: skipping database checks)"); process.exit(0); }

h("Live deals (active_deals_with_listings, Central IL)");
const deals = await rest("active_deals_with_listings?select=slug,listing_slug,city,source,verified_at&limit=2000");
if (Array.isArray(deals)) {
  const inScope = deals.filter((d) => CITIES.includes(d.city));
  const by = {};
  for (const d of inScope) {
    const c = (by[d.city] ||= { deals: 0, stores: new Set(), rendered: 0 });
    c.deals++; c.stores.add(d.slug || d.listing_slug); if (d.source === "website_rendered") c.rendered++;
  }
  for (const [c, v] of Object.entries(by).sort((a, b) => b[1].deals - a[1].deals)) console.log(`${c}: ${v.deals} deals at ${v.stores.size} stores (${v.rendered} from the browser reader)`);
  const newest = inScope.map((d) => d.verified_at).filter(Boolean).sort().pop();
  console.log(`TOTAL: ${inScope.length} deals at ${new Set(inScope.map((d) => d.slug || d.listing_slug)).size} stores · newest verification ${newest}`);
} else console.log(JSON.stringify(deals));

h("Alert subscribers (counts only)");
console.log(`active: ${await rest("deal_alerts?select=id&is_active=eq.true", { count: true })}`);
console.log(`pending (not confirmed): ${await rest("deal_alerts?select=id&is_active=eq.false", { count: true })}`);
console.log(`confirm emails queued (signups waiting for mail to work): ${await rest(`deal_alerts?select=id&is_active=eq.false&categories=cs.${encodeURIComponent('{"confirm:unsent"}')}`, { count: true })}`);
console.log(`new in last 7 days: ${await rest(`deal_alerts?select=id&created_at=gte.${new Date(Date.now() - 7 * 864e5).toISOString()}`, { count: true })}`);

h("Newest scraper runs");
const runs = await rest("scraper_runs?select=started_at,finished_at,status,trigger,total_deals_added,total_deals_updated,total_deals_deactivated,duration_ms,error_summary,dispensary_results&order=started_at.desc&limit=10");
if (Array.isArray(runs)) for (const r of runs) {
  const n = Array.isArray(r.dispensary_results) ? r.dispensary_results.length : 0;
  console.log(`${r.started_at} ${r.trigger} ${r.status} · ${n} stores · ${Math.round((r.duration_ms || 0) / 1000)}s · +${r.total_deals_added} =${r.total_deals_updated} -${r.total_deals_deactivated}${r.error_summary ? ` · error: ${String(r.error_summary).slice(0, 160)}` : ""}`);
}

h("Deal clicks / views (if tracked)");
for (const t of ["deal_clicks", "deal_events", "click_events"]) {
  const n = await rest(`${t}?select=id`, { count: true });
  if (Number.isFinite(n)) console.log(`${t}: ${n} rows`);
}

h("Bloom phones");
const bloom = await rest("master_listings?select=slug,name,phone,website&project_tag=eq.green&slug=in.(beyond-hello-peoria,ayr-wellness-normal,revolution-dispensary-normal)");
console.log(JSON.stringify(bloom, null, 1));
