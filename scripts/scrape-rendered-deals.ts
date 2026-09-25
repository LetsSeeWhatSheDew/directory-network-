// scripts/scrape-rendered-deals.ts
// =============================================================================
// Real-browser deal scrape for stores whose menus only exist after
// JavaScript runs (Dutchie / Jane / Sweed / Treez / LeafBridge embeds). Runs
// on Matthew's Mac (launchd, 06:15 + 12:15 via scripts/run-rendered-scrape.sh)
// because it needs a real Chrome; the Vercel cron keeps handling the static
// sites.
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
//   npx tsx scripts/scrape-rendered-deals.ts --menus-only   # skip deals, menu prices only
//   npx tsx scripts/scrape-rendered-deals.ts --no-menus     # deals only (old behaviour)
//
// MENU PRICES (2026-09-25): after the deals pass, the same browser reads
// product-level shelf prices for an eighth, a 1g cart and 100mg gummies from
// each store's own online menu (lib/scraper/menuCapture.ts MENU_SOURCES):
// ONE page load per store plus the data calls that page itself makes when a
// shopper taps a category. Each store gets STORE_BUDGET_MS; no store starts
// after MENU_DEADLINE_MS. --apply writes menu_snapshots + menu_items (the
// menu-baseline pipeline tables); a dry run prints a per-store summary.
//
// Dry runs only READ, so they work with the public anon key.
// Optional env for non-Mac hosts: PW_EXECUTABLE_PATH (Chromium binary instead
// of the installed Chrome channel), PW_PROXY (browser proxy server URL).
//
// HANG PROTECTION (2026-09-25 — a run sat in status='running' for 11+ hours):
//   * every navigation / selector / evaluate has its own timeout, and each
//     page fetch is capped by PAGE_BUDGET_MS with Promise.race;
//   * each store gets STORE_BUDGET_MS (runCilScrape perListingTimeoutMs);
//   * no new store starts after SOFT_DEADLINE_MS (run finishes 'partial');
//   * HARD_DEADLINE_MS: a timer finalizes the scraper_runs row and calls
//     process.exit no matter what the event loop is stuck on;
//   * SIGTERM/SIGINT/uncaught errors finalize the row and exit;
//   * the browser is always closed in finally (itself time-boxed);
//   * on startup, this script's own 'running' rows older than 1 hour are
//     marked failed ("abandoned — process never finished").
// =============================================================================
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Browser, type BrowserContext, type Frame, type Page } from "playwright-core";
import { runCilScrape, type HtmlFetcher, type ScraperSummary } from "../lib/scraper/cil-deal-scraper";
import { insertScraperRun, finishScraperRun, abortScraperRun, markAbandonedRuns } from "../lib/scraper/runLog";
import { isAllowedByRobots } from "../lib/scraper/cil-deal-scraper";
import { MENU_SOURCES, MENU_NOT_COVERED, captureStoreMenu, persistStoreMenu, otdPrice, type StoreMenuResult } from "../lib/scraper/menuCapture";
import { REF_UNITS, REF_DEF } from "../lib/menuPrices";

try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — rely on the environment */
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const APPLY = process.argv.includes("--apply");
// Reads (listings, existing deals) work with the anon key; writes need the service key.
const READ_KEY = SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SLUG = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const CIL = new Set(["peoria", "east peoria", "peoria heights", "pekin", "bloomington", "normal", "champaign", "urbana", "springfield"]);

// Time budgets. The launchd wrapper kills the whole process group at 15 min
// as a last resort; everything here is designed to finish well before that.
// Each can be overridden with an env var of the same name (testing / ops).
const budget = (name: string, fallback: number) => Number(process.env[name]) || fallback;
const NAV_TIMEOUT_MS = budget("NAV_TIMEOUT_MS", 30_000);
const ACTION_TIMEOUT_MS = budget("ACTION_TIMEOUT_MS", 10_000);
const PAGE_BUDGET_MS = budget("PAGE_BUDGET_MS", 60_000);
const STORE_BUDGET_MS = budget("STORE_BUDGET_MS", 90_000);
const SOFT_DEADLINE_MS = budget("SOFT_DEADLINE_MS", 14 * 60_000);
const HARD_DEADLINE_MS = budget("HARD_DEADLINE_MS", 16 * 60_000);
const MENU_DEADLINE_MS = budget("MENU_DEADLINE_MS", 11 * 60_000);
const MENUS_ONLY = process.argv.includes("--menus-only");
const NO_MENUS = process.argv.includes("--no-menus");
const TRIGGER = "manual" as const;

const TRACKER_FRAME = /doubleclick|googletagmanager|google-analytics|facebook|hotjar|mathtag|sitescout|stackadapt|nytrng|challenges\.cloudflare/;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      t = setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${label}`)), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

async function targets(): Promise<string[]> {
  const H = { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY}` };
  const listings: Array<{ slug: string; city: string; website: string | null }> = await (
    await fetch(`${SB}/rest/v1/master_listings?select=slug,city,website&project_tag=eq.green&is_active=eq.true&state=eq.IL`, {
      headers: H,
      signal: AbortSignal.timeout(20_000),
    })
  ).json();
  // Stores the static scraper covers are left alone: any store with a live
  // deal from source='website' is handled by the Vercel cron.
  const staticLive: Array<{ listing_slug: string }> = await (
    await fetch(`${SB}/rest/v1/deals?select=listing_slug&project_tag=eq.green&is_active=eq.true&source=eq.website`, {
      headers: H,
      signal: AbortSignal.timeout(20_000),
    })
  ).json();
  const covered = new Set(staticLive.map((d) => d.listing_slug));
  return listings
    // A store with a known deals page is a target even while its website
    // field is blank (see sql/migrations/2026-09-25-website-fixes.sql).
    .filter((l) => (l.website || RENDERED_URLS[l.slug]?.length) && CIL.has((l.city || "").toLowerCase()))
    .filter((l) => (SLUG ? l.slug.includes(SLUG) : !covered.has(l.slug)))
    .map((l) => l.slug);
}

// Where each JS-menu store publishes its deals on its OWN domain (embedded
// POS menus on the store's domain count as direct — docs/deal-data-policy.md).
// Found with scripts/probe-rendered-deals.ts + scripts/dump-rendered-text.ts;
// per-store evidence in docs/ops/2026-09-25-scraper-coverage.md. Stores not
// listed fall back to the static scraper's candidate URLs. An empty list
// means "no deals page of its own — do not guess".
export const RENDERED_URLS: Record<string, string[]> = {
  "aroma-hill-peoria": ["https://shop.aromahillcannabis.com/peoria/menu/discounts?promo=deals"],
  "maribis-springfield": ["https://maribisllc.com/springfield/"],
  // Dutchie-embedded specials lists on the store's own domain.
  "noxx-east-peoria": ["https://noxx.com/stores/noxx-peoria/specials"],
  "ascend-cannabis-horizon-drive": ["https://letsascend.com/stores/springfield-horizon-drive-illinois/specials"],
  "ascend-cannabis-downtown-springfield": ["https://letsascend.com/stores/springfield-adams-street-illinois/specials"],
  "high-profile-cannabis-springfield": ["https://highprofilecannabis.com/stores/il-springfield-hp/specials"],
  // LeafBridge (WordPress) specials grid fed by the store's Dutchie POS.
  "share-springfield": ["https://everyoneshares.com/specials/"],
  // Treez/GapCommerce storefront. Store-level promotions are the per-store
  // "Hot $90 Ounce" product groups; the promotion cards on /deals are empty.
  // group_id values come from the homepage "$90 Ounces" carousel and change
  // when Trinity rebuilds the group — re-probe if these stop matching.
  "trinity-on-glen": ["https://www.trinitydispensaries.com/product-group/glen-hot-90-ounce-deals?group_id=7131514f-d658-4463-8d49-96b145531732"],
  "trinity-on-university": ["https://www.trinitydispensaries.com/product-group/university-hot-90-oz-deals?group_id=b2b9a4c4-7638-4856-aee8-b05e0dbcdfec"],
  // Cresco/Sunnyside platform (store transitioned in 2026).
  "shangri-la-springfield": ["https://www.shangrila-springfield.shop/page/specials-shangri-la"],
  // Now Green Thumb "Bloom Wellness" stores on risecannabis.com (Cloudflare
  // Turnstile — blocked from datacenter IPs; may load from the Mac).
  "beyond-hello-peoria": ["https://risecannabis.com/dispensaries/illinois/bloom-wellness-peoria/"],
  "ayr-wellness-normal": ["https://risecannabis.com/dispensaries/illinois/bloom-wellness-normal-bradford/"],
  "revolution-dispensary-normal": ["https://risecannabis.com/dispensaries/illinois/bloom-wellness-normal-northbrook/"],
  // Website on file is The Dispensary FULTON; the chain lists no Champaign
  // store and thedispensarychampaign.com redirects to the Fulton site.
  "the-dispensary-champaign": [],
};

// ---------------------------------------------------------------------------
// Promo-name hygiene for structured specials lists.
// ---------------------------------------------------------------------------

// Dutchie clamps special names at ~75 characters ("…Ozone Reserve Con").
// Cut a clamped name back to its last whole word and mark it.
function tidyPromoName(raw: string): string {
  let t = raw.replace(/\s+/g, " ").trim();
  if (t.length >= 72 && !/[.!?)\]]$/.test(t)) t = t.replace(/\s+\S*$/, "").replace(/[\s,&+\-–|]+$/, "") + "…";
  t = t.replace(/([!?.])\1+/g, "$1"); // "BOGO!!!!!!" -> "BOGO!"
  return t.replace(/[\s\u200b,&+\-–—|]+$/, "").trim();
}

// Not a cannabis price: accessory-only promos (pipes, papers, lighters,
// batteries on their own), promos named for a season that isn't now, and
// names too vague to mean anything ("$25 Special").
const CANNABIS_WORD = /\b(flower|bud|popcorn|smalls|shake|oz|ounce|half|eighth|quarter|zip|\d+(?:\.\d+)?\s?g|\d+\s?mg|cart|carts|cartridge|vape|vapes|disposable|dispos|aio|pod|gumm|edible|chew|chocolate|drink|beverage|lemonade|tincture|topical|pre-?roll|joint|concentrate|rosin|resin|badder|sauce|diamond|wax|hash|infused|capsule)/i;
const ACCESSORY_WORD = /\b(pipes?|papers?|cones?|lighters?|hot knife|seahorses?|puffco|lookah|mj arsenal|grinders?|koozie|batter(?:y|ies)|accessor(?:y|ies)|ice pack|rolling)\b/i;
function notACannabisDeal(name: string, now = new Date()): boolean {
  if (ACCESSORY_WORD.test(name) && !CANNABIS_WORD.test(name.replace(ACCESSORY_WORD, ""))) return true;
  const m = now.getMonth(); // 0 = Jan
  if (/\bsummer\b/i.test(name) && (m < 4 || m > 8)) return true;
  if (/\bwinter\b/i.test(name) && m >= 3 && m <= 9) return true;
  if (/\b(4\/20|420)\b/.test(name) && m !== 3) return true;
  if (/\b(black friday|green wednesday)\b/i.test(name) && m !== 10) return true;
  if (/^\$\s?\d+\s+special!?$/i.test(name.trim())) return true;
  return false;
}

// A promotion whose own name carries an explicit date that has passed
// ("VIBATIONS 25% 6/15/26") is stale even if the POS still lists it.
function namesPastDate(name: string, now = new Date()): boolean {
  const m = name.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/);
  if (!m) return false;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const d = new Date(year, Number(m[1]) - 1, Number(m[2]), 23, 59, 59);
  return Number.isFinite(d.getTime()) && d.getTime() < now.getTime();
}

// A structured promo name must state an actual offer — a percentage, a
// price, a bundle, BOGO or a freebie. Names like "Nomad 3.5g Smalls Fresh
// Drop" or "BRIQ 2.0! New hardware, same price!" are announcements, not deals.
const DEAL_SIGNAL = /\d\s?%|\$\s?\.?\d|\bbogo\b|\bb\dg\d\b|\bbuy\s+(?:\d|one|two|any)\b|\bfree\b/i;

function offerCatalog(names: string[]): string {
  const ld = {
    "@type": "OfferCatalog",
    offers: names.map((name) => {
      const pct = name.match(/(\d{1,2})\s*%/);
      return pct ? { name, discount: pct[1] } : { name };
    }),
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// Structured, store-published specials lists. When one of these is present
// it is the complete promotion list for the store, so the page's product
// cards ("40% off" badges on individual items) are NOT run through the text
// patterns.
async function structuredSpecials(f: Frame): Promise<string[]> {
  return withTimeout(
    f.evaluate(() => {
      const out: string[] = [];
      // Dutchie embedded menus (store domain /stores/<slug>/specials):
      // each special is a link to …/specials/sale/<id> or …/specials/offer/<id>.
      // A special can appear twice (promo carousel + the list); keyed by its
      // id, the list's name — which comes later in the page — wins.
      const byId = new Map<string, string>();
      for (const a of Array.from(document.querySelectorAll('a[href*="/specials/sale/"], a[href*="/specials/offer/"]'))) {
        const t = ((a as HTMLElement).innerText || "").split("\n").map((x) => x.trim()).find((x) => x.length > 3 && !/^shop$/i.test(x));
        if (t) byId.set((a as HTMLAnchorElement).pathname.replace(/\/+$/, ""), t);
      }
      out.push(...byId.values());
      // LeafBridge specials grid: hidden .special_title inside each tab.
      for (const el of Array.from(document.querySelectorAll(".specials_tab .special_title"))) {
        const t = (el.textContent || "").trim();
        if (t) out.push(t);
      }
      return out;
    }),
    ACTION_TIMEOUT_MS,
    "structured specials"
  ).catch(() => [] as string[]);
}

// Store-named product groups where every item carries the price the group
// is named for: "Glen Hot 90 Ounce Deals" with ≥3 items at "$90 / 28g" →
// "$90 ounces (select strains)". The group name has to state the price, so
// generic product grids never qualify.
async function uniformPriceGroup(page: Page): Promise<string | null> {
  const info = await withTimeout(
    page.evaluate(() => ({
      names: [document.title, ...Array.from(document.querySelectorAll("h1, h2, [aria-current=page]")).map((h) => (h as HTMLElement).innerText || "")],
      text: document.body?.innerText || "",
    })),
    ACTION_TIMEOUT_MS,
    "uniform price group"
  ).catch(() => null);
  if (!info) return null;
  const SIZE_WORD: Record<string, string> = { "28g": "ounces", "14g": "half ounces", "7g": "quarters", "3.5g": "eighths" };
  for (const name of info.names) {
    if (!/\bdeals?\b|\bspecials?\b/i.test(name)) continue;
    const price = name.match(/\$?\b(\d{2,3})\b/)?.[1];
    if (!price) continue;
    const re = new RegExp(`(?:^|\\n)\\$${price}(?:\\.00)?\\s*\\n\\s*\\/\\s*\\n?\\s*(28g|14g|7g|3\\.5g)\\b`, "gi");
    const sizes = [...info.text.matchAll(re)].map((m) => m[1].toLowerCase());
    if (sizes.length >= 3 && sizes.every((s) => s === sizes[0])) {
      return `$${price} ${SIZE_WORD[sizes[0]]} (select strains)`;
    }
  }
  return null;
}

const GATE_BUTTON = /^(yes|i am 21|i'm 21|i am over 21|i'm over 21|enter|yes, i am 21\+?|i'?m at least 21|i am at least 21)/i;

async function passAgeGate(page: Page): Promise<boolean> {
  for (const role of ["button", "link"] as const) {
    const gate = page.getByRole(role, { name: GATE_BUTTON }).first();
    if (await gate.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gate.click({ timeout: ACTION_TIMEOUT_MS }).catch(() => {});
      return true;
    }
  }
  return false;
}

function makeFetcher(ctx: BrowserContext): HtmlFetcher {
  const fetchOnce = async (url: string, page: Page): Promise<string[] | null> => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    // Age gate: click through a visible "Yes / I'm 21" control if present.
    if (await passAgeGate(page)) {
      await page.waitForLoadState("domcontentloaded", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
      await page.waitForTimeout(1500);
      // Some gates (Trinity) drop the return path and land on "/" — go back
      // to the page we were asked for.
      const want = new URL(url);
      const got = new URL(page.url());
      if (got.host !== want.host || got.pathname.replace(/\/+$/, "") !== want.pathname.replace(/\/+$/, "")) {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
      }
    }
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const title = (await withTimeout(page.title(), ACTION_TIMEOUT_MS, "title")).toLowerCase();
    if (/just a moment|attention required|access denied|verify you are human/.test(title)) return null;

    // Structured specials lists (Dutchie embeds, LeafBridge) and store-named
    // uniform-price groups (Treez) — complete, store-published lists.
    const structured: string[] = [];
    for (const f of page.frames()) {
      if (TRACKER_FRAME.test(f.url())) continue;
      structured.push(...(await structuredSpecials(f)));
    }
    const group = await uniformPriceGroup(page);
    if (group) structured.push(group);
    const cleanStructured = [
      ...new Set(
        structured
          .map(tidyPromoName)
          .filter((t) => t.length > 4 && t.length < 90 && DEAL_SIGNAL.test(t) && !namesPastDate(t) && !notACannabisDeal(t))
      ),
    ];
    if (cleanStructured.length) return [offerCatalog(cleanStructured)];

    // Rendered menus carry per-PRODUCT JSON-LD offers — never treat those
    // as deals. Strip them; the store's own promotion list (below) is the
    // only structured source we trust here.
    const stripLd = (h: string) => h.replace(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
    const out = [stripLd(await withTimeout(page.content(), ACTION_TIMEOUT_MS, "content"))];
    const promos: string[] = [];
    for (const f of page.frames()) {
      if (TRACKER_FRAME.test(f.url())) continue;
      if (f !== page.mainFrame()) {
        try { out.push(stripLd(await withTimeout(f.content(), ACTION_TIMEOUT_MS, "frame content"))); } catch {}
      }
      // Sweed storefronts list each promotion as a link to
      // /menu/discounts/<name>-<id>; its text is the store's own deal name.
      try {
        const names = await withTimeout(
          f.$$eval('a[href*="/menu/discounts/"]', (as) =>
            as.map((a) => {
              const t = ((a as HTMLElement).innerText || "").split("\n").map((x) => x.trim()).find((x) => x.length > 3) || "";
              const slug = ((a as HTMLAnchorElement).pathname.split("/").pop() || "").replace(/-\d+$/, "");
              return t || slug.replace(/-/g, " ");
            })
          ),
          ACTION_TIMEOUT_MS,
          "sweed discounts"
        );
        promos.push(...names);
      } catch {}
    }
    // Bundle deals written as lines on the store's own page:
    // "One Gram Joints – 3 for $27", "2 for $60 – One Gram Cured Concentrate".
    for (const f of page.frames()) {
      if (TRACKER_FRAME.test(f.url())) continue;
      try {
        const text: string = await withTimeout(f.evaluate(() => document.body?.innerText || ""), ACTION_TIMEOUT_MS, "frame text");
        for (const raw of text.split("\n")) {
          const line = raw.replace(/\s*[–—-]?\s*(?:Shop|Order|View) (?:Now|Deals?)[\s\u200b]*$/i, "").replace(/\s+/g, " ").trim();
          if (line.length >= 8 && line.length <= 80 && /\b\d+\s+for\s+\$\d{1,4}\b/i.test(line) && !/\?|sign up|subscribe/i.test(line)) promos.push(line);
        }
      } catch {}
    }
    const clean = [...new Set(promos.map((t) => t.replace(/\s+/g, " ").replace(/[\s\u200b—–-]+$/, "").trim()).filter((t) => t.length > 4 && t.length < 90 && /\d|bogo|free/i.test(t) && !namesPastDate(t)))];
    if (clean.length) out.push(offerCatalog(clean));
    return out;
  };

  return async (url) => {
    let page: Page | null = null;
    try {
      page = await withTimeout(ctx.newPage(), ACTION_TIMEOUT_MS, "newPage");
      page.setDefaultTimeout(ACTION_TIMEOUT_MS);
      page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
      return await withTimeout(fetchOnce(url, page), PAGE_BUDGET_MS, `page ${url}`);
    } catch (err) {
      console.log(`  · ${url}: ${(err as Error).message.slice(0, 120)}`);
      return null;
    } finally {
      if (page) await withTimeout(page.close(), 5000, "page.close").catch(() => {});
    }
  };
}

// ---------------------------------------------------------------------------
// Menu prices: one page per store, bounded, after the deals pass.
// ---------------------------------------------------------------------------

async function menuPhase(ctx: BrowserContext): Promise<void> {
  const slugs = Object.keys(MENU_SOURCES).filter((s) => (SLUG ? s.includes(SLUG) : true));
  if (!slugs.length) return;
  const H = { apikey: READ_KEY!, Authorization: `Bearer ${READ_KEY}` };
  const raw: Array<{ slug: string; name: string; city: string; address1: string | null }> = await (
    await fetch(
      `${SB}/rest/v1/master_listings?select=slug,name,city,address1&project_tag=eq.green&is_active=eq.true&slug=in.(${slugs.join(",")})`,
      { headers: H, signal: AbortSignal.timeout(20_000) }
    )
  ).json();
  if (!Array.isArray(raw)) throw new Error(`listings read failed: ${JSON.stringify(raw).slice(0, 160)}`);
  const bySlug = new Map(raw.map((l) => [l.slug, { slug: l.slug, name: l.name, city: l.city, address: l.address1 }]));
  console.log(`\nmenu prices: ${slugs.length} stores ${APPLY ? "(APPLY)" : "(dry run)"}`);
  const results: StoreMenuResult[] = [];
  for (const slug of slugs) {
    const listing = bySlug.get(slug);
    if (!listing) { console.log(`  ? ${slug}: not an active green listing — skipped`); continue; }
    if (Date.now() - start > MENU_DEADLINE_MS) { console.log(`  ~ ${slug}: menu_deadline_reached — skipped this run`); continue; }
    let page: Page | null = null;
    let r: StoreMenuResult;
    try {
      page = await withTimeout(ctx.newPage(), ACTION_TIMEOUT_MS, "newPage");
      page.setDefaultTimeout(ACTION_TIMEOUT_MS);
      page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
      r = await withTimeout(
        captureStoreMenu({
          page, slug, source: MENU_SOURCES[slug], budgetMs: STORE_BUDGET_MS - 5000, navTimeoutMs: NAV_TIMEOUT_MS,
          passAgeGate, isAllowed: isAllowedByRobots,
        }),
        STORE_BUDGET_MS,
        `menu ${slug}`
      );
    } catch (e) {
      r = { slug, platform: MENU_SOURCES[slug].platform, status: "error", items: [], dropped: [], error: (e as Error).message.slice(0, 160), pageLoads: 1, dataCalls: 0, durationMs: STORE_BUDGET_MS, sourceUrl: MENU_SOURCES[slug].url };
    } finally {
      if (page) await withTimeout(page.close(), 5000, "page.close").catch(() => {});
    }
    results.push(r);
    printMenuResult(r, listing.city);
    if (APPLY && SERVICE_KEY) {
      try {
        const w = await persistStoreMenu({ supabaseUrl: SB, serviceKey: SERVICE_KEY }, listing, MENU_SOURCES[slug], r);
        console.log(`    wrote snapshot ${w.snapshotId} · ${w.inserted} menu_items`);
      } catch (e) {
        console.log(`    ! write failed: ${(e as Error).message.slice(0, 200)}`);
      }
    }
  }
  if (!SLUG) for (const [slug, why] of Object.entries(MENU_NOT_COVERED)) console.log(`  - ${slug}: no menu reader · ${why}`);
  const ok = results.filter((r) => r.items.length).length;
  console.log(`menu prices: ${ok}/${results.length} stores with prices · ${results.reduce((a, r) => a + r.items.length, 0)} items kept · ${results.reduce((a, r) => a + r.dropped.length, 0)} dropped`);
  mkdirSync("scrape-output", { recursive: true });
  writeFileSync(`scrape-output/menu-prices-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(results, null, 2));
}

function printMenuResult(r: StoreMenuResult, city: string) {
  const secs = (r.durationMs / 1000).toFixed(1);
  console.log(`  ${r.status === "error" ? "!" : r.items.length ? "+" : "0"} ${r.slug} [${r.platform}] ${r.status} · ${r.items.length} items · ${r.dropped.length} dropped · ${r.pageLoads} page load, ${r.dataCalls} data calls · ${secs}s${r.error ? ` · ${r.error}` : ""}`);
  for (const ref of REF_UNITS) {
    const rows = r.items.filter((i) => i.ref === ref);
    if (!rows.length) { console.log(`      ${REF_DEF[ref].short.padEnd(8)} none found`); continue; }
    const best = rows.reduce((a, b) => ((b.sale ?? b.regular) < (a.sale ?? a.regular) ? b : a));
    const pre = best.sale ?? best.regular;
    const otd = otdPrice(pre, ref, city);
    console.log(
      `      ${REF_DEF[ref].short.padEnd(8)} ${String(rows.length).padStart(3)} found · cheapest $${pre.toFixed(2)}${best.sale != null ? ` (reg $${best.regular.toFixed(2)})` : ""} → $${otd != null ? otd.toFixed(2) : "?"} out the door · ${best.brand ? best.brand + " · " : ""}${best.name} [${best.weight}]`
    );
  }
  const reasons = new Map<string, number>();
  for (const d of r.dropped) {
    const k = `${d.ref}: ${d.reason.replace(/\$[\d.]+/g, "$x")}`;
    reasons.set(k, (reasons.get(k) || 0) + 1);
  }
  for (const [k, n] of reasons) console.log(`      dropped ${n} × ${k}`);
  for (const d of r.dropped.filter((x) => /sanity band|implausible|not below/.test(x.reason)).slice(0, 8)) console.log(`        · ${d.ref} ${d.name}: ${d.reason}`);
}

// ---------------------------------------------------------------------------
// Run with a guaranteed end.
// ---------------------------------------------------------------------------

const start = Date.now();
let runId: string | null = null;
let browser: Browser | null = null;
let lastSummary: ScraperSummary | null = null;
let finalizing = false;

async function closeBrowser() {
  if (!browser) return;
  const b = browser;
  browser = null;
  await withTimeout(b.close(), 10_000, "browser.close").catch(async () => {
    // Chrome ignored close — kill the process outright.
    try { (b as unknown as { process?: () => { kill: (s: string) => void } | null }).process?.()?.kill("SIGKILL"); } catch {}
  });
}

async function bail(reason: string, code: number): Promise<never> {
  if (finalizing) process.exit(code);
  finalizing = true;
  console.error(`rendered scrape aborted: ${reason}`);
  // Nothing below may block the exit for long.
  const killSwitch = setTimeout(() => process.exit(code), 30_000);
  try {
    if (runId && SERVICE_KEY) await abortScraperRun(SB, SERVICE_KEY, runId, start, reason, lastSummary);
  } catch {}
  try { await closeBrowser(); } catch {}
  clearTimeout(killSwitch);
  process.exit(code);
}

const hardDeadline = setTimeout(
  () => void bail(`hard deadline: run exceeded ${HARD_DEADLINE_MS / 60000} min — finalized and exited`, 2),
  HARD_DEADLINE_MS
);
for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"] as const) {
  process.on(sig, () => void bail(`received ${sig} (killed by wrapper timeout or operator)`, 143));
}
process.on("uncaughtException", (e) => void bail(`uncaught exception: ${e?.message ?? e}`, 1));
process.on("unhandledRejection", (e) => void bail(`unhandled rejection: ${(e as Error)?.message ?? e}`, 1));

(async () => {
  if (APPLY && !SERVICE_KEY) { console.error("--apply needs SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  if (!READ_KEY) { console.error("missing Supabase key (service or anon)"); process.exit(1); }

  if (APPLY) {
    const stale = await markAbandonedRuns(SB, SERVICE_KEY!, TRIGGER);
    if (stale) console.log(`marked ${stale} abandoned scraper_runs row(s) as failed`);
  }
  const slugs = MENUS_ONLY ? [] : await targets();
  if (!MENUS_ONLY) console.log(`rendered scrape: ${slugs.length} stores ${APPLY ? "(APPLY)" : "(dry run)"}`);
  const executablePath = process.env.PW_EXECUTABLE_PATH;
  browser = await withTimeout(
    chromium.launch({
      ...(executablePath ? { executablePath } : { channel: "chrome" }),
      headless: true,
      ...(process.env.PW_PROXY ? { proxy: { server: process.env.PW_PROXY } } : {}),
    }),
    60_000,
    "browser launch"
  );
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US", timezoneId: "America/Chicago" });
  ctx.setDefaultTimeout(ACTION_TIMEOUT_MS);
  ctx.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
  runId = APPLY && !MENUS_ONLY ? await insertScraperRun(SB, SERVICE_KEY!, TRIGGER) : null;
  try {
    if (!MENUS_ONLY) {
    const summary = await runCilScrape({
      supabaseUrl: SB,
      serviceKey: APPLY ? SERVICE_KEY : READ_KEY,
      mode: "live",
      apply: APPLY,
      maxListings: 40,
      fetcher: makeFetcher(ctx),
      onlySlugs: slugs,
      urlOverrides: RENDERED_URLS,
      perListingTimeoutMs: STORE_BUDGET_MS,
      deadlineAt: start + SOFT_DEADLINE_MS,
      onListingDone: (s) => { lastSummary = s; },
    });
    lastSummary = summary;
    // bail() already finalized the row and owns the exit — don't race it.
    if (finalizing) return;
    if (runId) await finishScraperRun(SB, SERVICE_KEY!, runId, summary, start);
    mkdirSync("scrape-output", { recursive: true });
    writeFileSync(`scrape-output/rendered-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(summary, null, 2));
    console.log(`found ${summary.deals_found.length} · insert ${summary.deals_inserted.length} · update ${summary.deals_updated.length} · retire ${summary.deals_aged.length}`);
    for (const d of summary.deals_inserted) console.log(`  + ${d.slug}: ${d.title}`);
    for (const d of summary.deals_updated) console.log(`  = ${d.slug}: ${d.title}`);
    for (const d of summary.deals_aged) console.log(`  - ${d.slug}: ${d.title}`);
    for (const e of summary.fetch_errors) console.log(`  ! ${e.slug}: ${e.error}`);
    const seen = new Set(summary.deals_found.map((d) => d.listing_slug));
    for (const s of slugs) if (!seen.has(s) && !summary.fetch_errors.some((e) => e.slug === s)) console.log(`  0 ${s}: no deals found`);
    }
    // Menu prices ride on the same browser. A failure here never touches the
    // deals result above (already finalized in scraper_runs).
    if (!NO_MENUS && !finalizing) {
      try {
        await menuPhase(ctx);
      } catch (e) {
        console.log(`menu prices aborted: ${(e as Error).message.slice(0, 200)}`);
      }
    }
  } finally {
    if (!finalizing) await closeBrowser();
  }
  if (finalizing) return;
  clearTimeout(hardDeadline);
  // Nothing may keep the process alive after the run is done.
  process.exit(0);
})().catch((e) => void bail(`fatal: ${(e as Error)?.message ?? e}`, 1));
