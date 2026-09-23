// scripts/probe-deal-pages.ts — READ-ONLY coverage probe.
// For every active Central IL listing: which candidate URLs load, and what
// deals the extractor finds there. Writes nothing to the DB.
// Usage: npx tsx scripts/probe-deal-pages.ts [slug-filter]
import { candidateUrls, extractDealsFromHtml } from "../lib/scraper/cil-deal-scraper";

const URL_ = "https://hnbjufmtmrhexmdrfubw.supabase.co/rest/v1";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";
const CITIES = '("Peoria","East Peoria","Peoria Heights","Pekin","Bartonville","Morton","Washington","Bloomington","Normal","Champaign","Urbana","Springfield")';
const UA = "Mozilla/5.0 (compatible; PuffPriceBot/1.0; +https://www.puffprice.com/how-we-rank)";

async function main() {
  const filter = process.argv[2] || "";
  const res = await fetch(`${URL_}/master_listings?select=slug,website&project_tag=eq.green&state=eq.IL&is_active=eq.true&city=in.${encodeURIComponent(CITIES)}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const rows: Array<{ slug: string; website: string | null }> = await res.json();
  for (const r of rows.filter((x) => x.slug.includes(filter))) {
    if (!r.website) { console.log(`${r.slug}\tNO_WEBSITE`); continue; }
    const base = new URL(r.website);
    const found = new Set<string>();
    const statuses: string[] = [];
    for (const u of candidateUrls(base)) {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
        const resp = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow", signal: ctl.signal });
        clearTimeout(t);
        statuses.push(`${resp.status}`);
        if (!resp.ok) continue;
        const html = await resp.text();
        for (const d of extractDealsFromHtml(html, u, r.slug)) found.add(d.title);
      } catch (e) { statuses.push("ERR"); }
    }
    console.log(`${r.slug}\t[${statuses.join(",")}]\t${found.size}\t${[...found].join(" | ")}`);
  }
}
main();
