// scripts/probe-rendered-deals.ts — READ-ONLY spike.
// Opens each Central IL store's own deal pages in a real Chrome (via
// playwright-core, channel "chrome") and runs the same extractor the static
// scraper uses on the RENDERED DOM (main page + iframes). Prints what it
// would find. Writes nothing.
//   npx tsx scripts/probe-rendered-deals.ts [slug-filter]
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { candidateUrls, extractDealsFromHtml } from "../lib/scraper/cil-deal-scraper";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const K = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!;
const CIL = new Set(["peoria", "east peoria", "peoria heights", "pekin", "bloomington", "normal", "champaign", "urbana", "springfield"]);
const filter = process.argv[2];

(async () => {
  const H = { apikey: K, Authorization: `Bearer ${K}` };
  const listings: Array<{ slug: string; city: string; website: string | null }> = await (
    await fetch(`${SB}/rest/v1/master_listings?select=slug,city,website&project_tag=eq.green&is_active=eq.true&state=eq.IL`, { headers: H })
  ).json();
  const active: Array<{ listing_slug: string }> = await (
    await fetch(`${SB}/rest/v1/deals?select=listing_slug&project_tag=eq.green&is_active=eq.true`, { headers: H })
  ).json();
  const hasDeals = new Set(active.map((a) => a.listing_slug));
  const targets = listings.filter(
    (l) => l.website && CIL.has((l.city || "").toLowerCase()) && (filter ? l.slug.includes(filter) : !hasDeals.has(l.slug))
  );
  console.log(`targets: ${targets.length}`);

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US" });
  // Age gates: most stores set a cookie/localStorage flag; click common buttons if shown.
  for (const l of targets) {
    const base = new URL(l.website!);
    const urls = candidateUrls(base).slice(0, 4);
    const found: string[] = [];
    const notes: string[] = [];
    for (const u of urls) {
      const page = await ctx.newPage();
      try {
        const resp = await page.goto(u, { waitUntil: "domcontentloaded", timeout: 25000 });
        const status = resp?.status();
        for (const label of [/^(yes|i am 21|i'm 21|enter|i am over 21|yes, i am 21\+?)/i]) {
          const btn = page.getByRole("button", { name: label }).first();
          if (await btn.isVisible().catch(() => false)) await btn.click().catch(() => {});
        }
        await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
        await page.waitForTimeout(2500);
        const title = await page.title();
        const htmls = [await page.content()];
        for (const f of page.frames()) {
          if (f === page.mainFrame()) continue;
          try { htmls.push(await f.content()); } catch {}
        }
        const frameHosts = page.frames().slice(1).map((f) => { try { return new URL(f.url()).host; } catch { return ""; } }).filter(Boolean);
        const deals = htmls.flatMap((h) => extractDealsFromHtml(h, u, l.slug));
        for (const d of deals) if (!found.includes(d.title)) found.push(d.title);
        notes.push(`${new URL(u).pathname} ${status} "${title.slice(0, 40)}" frames=[${[...new Set(frameHosts)].join(",")}] deals=${deals.length}`);
      } catch (e) {
        notes.push(`${u} ERR ${String((e as Error).message).slice(0, 60)}`);
      } finally {
        await page.close();
      }
    }
    console.log(`\n## ${l.slug} (${l.city})\n  ${notes.join("\n  ")}\n  → ${found.length ? found.join(" | ") : "none"}`);
  }
  await browser.close();
})();
