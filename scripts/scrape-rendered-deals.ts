// scripts/scrape-rendered-deals.ts
// =============================================================================
// Real-browser deal scrape for stores whose menus only exist after
// JavaScript runs (Dutchie / Jane / Sweed embeds). Runs on Matthew's Mac
// (launchd, nightly) because it needs a real Chrome; the Vercel cron keeps
// handling the static sites.
//
// Same rules as the static scraper: each store's OWN site only (never an
// aggregator), robots.txt respected, same extractor, same dedupe. Pages that
// answer with a bot challenge are skipped — we never try to solve them.
// Deals it writes carry source='website_rendered' so the two scrapers never
// retire each other's deals.
//
//   npx tsx scripts/scrape-rendered-deals.ts            # dry run, prints plan
//   npx tsx scripts/scrape-rendered-deals.ts --apply    # writes + logs scraper_runs
//   npx tsx scripts/scrape-rendered-deals.ts --slug=cloud-9
// =============================================================================
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium, type BrowserContext } from "playwright-core";
import { runCilScrape, type HtmlFetcher } from "../lib/scraper/cil-deal-scraper";
import { insertScraperRun, finishScraperRun } from "../lib/scraper/runLog";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const APPLY = process.argv.includes("--apply");
const SLUG = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const CIL = new Set(["peoria", "east peoria", "peoria heights", "pekin", "bloomington", "normal", "champaign", "urbana", "springfield"]);

async function targets(): Promise<string[]> {
  const H = { apikey: KEY!, Authorization: `Bearer ${KEY}` };
  const listings: Array<{ slug: string; city: string; website: string | null }> = await (
    await fetch(`${SB}/rest/v1/master_listings?select=slug,city,website&project_tag=eq.green&is_active=eq.true&state=eq.IL`, { headers: H })
  ).json();
  // Stores the static scraper covers are left alone: any store with a live
  // deal from source='website' is handled by the Vercel cron.
  const staticLive: Array<{ listing_slug: string }> = await (
    await fetch(`${SB}/rest/v1/deals?select=listing_slug&project_tag=eq.green&is_active=eq.true&source=eq.website`, { headers: H })
  ).json();
  const covered = new Set(staticLive.map((d) => d.listing_slug));
  return listings
    .filter((l) => l.website && CIL.has((l.city || "").toLowerCase()))
    .filter((l) => (SLUG ? l.slug.includes(SLUG) : !covered.has(l.slug)))
    .map((l) => l.slug);
}

// Where each JS-menu store publishes its deals on its OWN domain, found by
// scripts/probe-rendered-deals.ts + scripts/dump-rendered-text.ts. Stores not
// listed fall back to the static scraper's candidate URLs.
export const RENDERED_URLS: Record<string, string[]> = {
  "aroma-hill-peoria": ["https://shop.aromahillcannabis.com/peoria/menu/discounts?promo=deals"],
  "maribis-springfield": ["https://maribisllc.com/springfield/"],
};

function makeFetcher(ctx: BrowserContext): HtmlFetcher {
  return async (url) => {
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      // Age gate: click through a visible "Yes / I'm 21" button if present.
      const gate = page.getByRole("button", { name: /^(yes|i am 21|i'm 21|i am over 21|enter|yes, i am 21\+?)/i }).first();
      if (await gate.isVisible().catch(() => false)) await gate.click().catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2500);
      const title = (await page.title()).toLowerCase();
      if (/just a moment|attention required|access denied|verify you are human/.test(title)) return null;
      // Rendered menus carry per-PRODUCT JSON-LD offers — never treat those
      // as deals. Strip them; the store's own promotion list (below) is the
      // only structured source we trust here.
      const stripLd = (h: string) => h.replace(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
      const out = [stripLd(await page.content())];
      const promos: string[] = [];
      for (const f of page.frames()) {
        if (/doubleclick|googletagmanager|google-analytics|facebook|hotjar|mathtag|sitescout/.test(f.url())) continue;
        if (f !== page.mainFrame()) { try { out.push(stripLd(await f.content())); } catch {} }
        // Sweed storefronts list each promotion as a link to
        // /menu/discounts/<name>-<id>; its text is the store's own deal name.
        try {
          const names = await f.$$eval('a[href*="/menu/discounts/"]', (as) =>
            as.map((a) => {
              const t = ((a as HTMLElement).innerText || "").split("\n").map((x) => x.trim()).find((x) => x.length > 3) || "";
              const slug = ((a as HTMLAnchorElement).pathname.split("/").pop() || "").replace(/-\d+$/, "");
              return t || slug.replace(/-/g, " ");
            })
          );
          promos.push(...names);
        } catch {}
      }
      // Bundle deals written as lines on the store's own page:
      // "One Gram Joints – 3 for $27", "2 for $60 – One Gram Cured Concentrate".
      for (const f of page.frames()) {
        if (/doubleclick|googletagmanager|google-analytics|facebook|hotjar|mathtag|sitescout/.test(f.url())) continue;
        try {
          const text: string = await f.evaluate(() => document.body?.innerText || "");
          for (const raw of text.split("\n")) {
            const line = raw.replace(/\s*[–-]\s*Shop Now\s*$/i, "").replace(/\s+/g, " ").trim();
            if (line.length >= 8 && line.length <= 80 && /\b\d+\s+for\s+\$\d{1,4}\b/i.test(line) && !/\?|sign up|subscribe/i.test(line)) promos.push(line);
          }
        } catch {}
      }
      const clean = [...new Set(promos.map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t.length > 4 && t.length < 90 && /\d|bogo|free/i.test(t)))];
      if (clean.length) {
        const ld = { "@type": "OfferCatalog", offers: clean.map((name) => {
          const pct = name.match(/(\d{1,2})\s*%/);
          return pct ? { name, discount: pct[1] } : { name };
        }) };
        out.push(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
      }
      return out;
    } catch {
      return null;
    } finally {
      await page.close().catch(() => {});
    }
  };
}

(async () => {
  if (!KEY) { console.error("missing SUPABASE_SERVICE_KEY"); process.exit(1); }
  const slugs = await targets();
  console.log(`rendered scrape: ${slugs.length} stores ${APPLY ? "(APPLY)" : "(dry run)"}`);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US", timezoneId: "America/Chicago" });
  const start = Date.now();
  const runId = APPLY ? await insertScraperRun(SB, KEY, "manual") : null;
  try {
    const summary = await runCilScrape({
      supabaseUrl: SB,
      serviceKey: KEY,
      mode: "live",
      apply: APPLY,
      maxListings: 40,
      fetcher: makeFetcher(ctx),
      onlySlugs: slugs,
      urlOverrides: RENDERED_URLS,
    });
    if (runId) await finishScraperRun(SB, KEY, runId, summary, start);
    mkdirSync("scrape-output", { recursive: true });
    writeFileSync(`scrape-output/rendered-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(summary, null, 2));
    console.log(`found ${summary.deals_found.length} · insert ${summary.deals_inserted.length} · update ${summary.deals_updated.length} · retire ${summary.deals_aged.length}`);
    for (const d of summary.deals_inserted) console.log(`  + ${d.slug}: ${d.title}`);
    for (const d of summary.deals_aged) console.log(`  - ${d.slug}: ${d.title}`);
    for (const e of summary.fetch_errors) console.log(`  ! ${e.slug}: ${e.error}`);
  } finally {
    await browser.close();
  }
})();
