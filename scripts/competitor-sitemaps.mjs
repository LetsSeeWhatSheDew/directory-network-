// scripts/competitor-sitemaps.mjs: READ-ONLY SEO gap check. Reads public
// sitemaps of local dispensary sites (and Leafly's local deal pages) and
// prints page counts, local-intent pages and last-modified dates.
const SITES = ["aromahillcannabis.com", "noxx.com", "everyoneshares.com", "ivyhalldispensary.com", "nueracannabis.com", "trinitydispensaries.com", "letsascend.com", "highprofilecannabis.com", "maribis.com", "cloud9cannabis.com"];
const LOCAL = /peoria|springfield|bloomington|normal|champaign|urbana|pekin|illinois|deal|special|sale|tax|law|first[- ]time|guide|blog|near|green[- ]wednesday|420|4-20|black[- ]friday|holiday|medical|faq/i;
const UA = { "User-Agent": "Mozilla/5.0 (compatible; puffprice-seo-check)" };
const get = async (u) => { try { const r = await fetch(u, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) }); return r.ok ? await r.text() : `HTTP ${r.status}`; } catch (e) { return `ERR ${e.message}`; } };
const locs = (xml) => [...xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>(?:[\s\S]*?<lastmod>([^<]+)<\/lastmod>)?[\s\S]*?<\/url>/g)].map((m) => ({ loc: m[1].trim(), mod: (m[2] || "").slice(0, 10) }));
const subs = (xml) => [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

for (const host of SITES) {
  let urls = [], note = "";
  for (const path of ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml"]) {
    const xml = await get(`https://${host}${path}`);
    if (!xml.startsWith("<") && !xml.includes("<urlset") && !xml.includes("<sitemapindex")) { note += ` ${path}:${xml.slice(0, 40)}`; continue; }
    const kids = subs(xml);
    if (kids.length) for (const k of kids.slice(0, 15)) urls.push(...locs(await get(k)));
    else urls.push(...locs(xml));
    if (urls.length) break;
  }
  console.log(`\n## ${host}: ${urls.length} URLs${urls.length ? "" : ` (${note.trim()})`}`);
  const local = urls.filter((u) => LOCAL.test(new URL(u.loc, `https://${host}`).pathname));
  for (const u of local.slice(0, 25)) console.log(`- ${new URL(u.loc, `https://${host}`).pathname}${u.mod ? `  (${u.mod})` : ""}`);
  if (local.length > 25) console.log(`  …and ${local.length - 25} more`);
}

for (const city of ["peoria-il-us", "springfield-il-us", "bloomington-il-us", "champaign-il-us"]) {
  const html = await get(`https://www.leafly.com/deals/${city}`);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || html.slice(0, 60);
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const none = /no deals near/i.test(html);
  console.log(`\n## Leafly ${city}: ${title}\n  ${desc.slice(0, 160)}${none ? "\n  SAYS: no deals near this location" : ""}`);
}
