// scripts/scrape-cil-deals.ts
// =============================================================================
// Direct-source CIL deal scraper.
//
// Policy (Matthew, 2026-04-26):
//   - Scrape only direct dispensary websites — no aggregators (Leafly,
//     Weedmaps, iHeartJane, Dutchie).
//   - Central Illinois only. Queries master_listings filtered to the 12
//     CIL cities in lib/constants/regions.ts.
//
// What it does
//   1. Loads every active CIL master_listings row with a website.
//   2. For each, fetches the homepage (and a small set of known
//      deal-page slugs) with a polite 2s delay between requests.
//   3. Extracts deals via:
//        (a) JSON-LD <script type="application/ld+json"> Offer / Product
//        (b) HTML text matching a curated set of discount patterns
//            (percentages, dollar amounts, BOGO, "first-time 20%", etc.)
//        (c) <meta name="description"> mentioning discounts
//   4. Dedups each scraped deal against existing rows
//      (listing_slug + normalized title) and:
//        - match found: UPDATE verified_at = now(), status_reason unchanged
//        - no match: INSERT with status_reason='scraped_direct_source'
//   5. Deals previously scraped but not found this run: mark
//      status_reason='not_seen_last_scrape'. Do NOT auto-deactivate.
//
// Safeguards
//   - Hard reject: listing.city not in CENTRAL_IL_CITIES.
//   - Hard reject: listing.website host in aggregator blocklist.
//   - Polite: 2s per request, User-Agent identifies PuffPrice, robots.txt
//     checked once per host (disallow respected).
//   - 429 backoff: 1-hour domain cooldown.
//   - Max 30 listings per run.
//   - Default --dry-run; --live is required to write.
//
// Run
//   npx tsx scripts/scrape-cil-deals.ts --dry-run
//   npx tsx scripts/scrape-cil-deals.ts --live --apply
// =============================================================================

import { argv, exit, env } from "node:process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ----------------------------- env + flags ---------------------------------

function loadDotenv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      )
        val = val.slice(1, -1);
      if (!env[m[1]]) env[m[1]] = val;
    }
  } catch {
    /* no .env.local — rely on process env */
  }
}
loadDotenv();

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_SERVICE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

const LIVE = argv.includes("--live");
const APPLY = argv.includes("--apply");
const DRY = !LIVE || argv.includes("--dry-run");
const OUTPUT_FLAG = argv.find((a) => a.startsWith("--out="))?.split("=")[1];
const MAX_FLAG = argv.find((a) => a.startsWith("--max="))?.split("=")[1];
const MAX_LISTINGS = Math.max(1, Math.min(30, parseInt(MAX_FLAG || "30", 10) || 30));

if (LIVE && APPLY && !SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: --live --apply requires SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) in env.local"
  );
  exit(1);
}

const MODE =
  DRY && !APPLY
    ? "DRY-RUN"
    : LIVE && APPLY
      ? "LIVE + APPLY"
      : LIVE
        ? "LIVE (no apply — just fetch + preview)"
        : "DRY-RUN";

console.log(`scrape-cil-deals mode=${MODE} max=${MAX_LISTINGS}`);

// ----------------------------- constants -----------------------------------

const CENTRAL_IL_CITIES = new Set([
  "peoria",
  "east peoria",
  "peoria heights",
  "pekin",
  "bartonville",
  "morton",
  "washington",
  "normal",
  "bloomington",
  "champaign",
  "urbana",
  "springfield",
]);

const AGGREGATOR_HOSTS = new Set([
  "leafly.com",
  "www.leafly.com",
  "weedmaps.com",
  "www.weedmaps.com",
  "iheartjane.com",
  "www.iheartjane.com",
  "dutchie.com",
  "www.dutchie.com",
]);

const USER_AGENT =
  "Mozilla/5.0 (compatible; PuffPriceBot/1.0; +https://puffprice.com/about; contact=team@puffprice.com)";

const REQUEST_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 15000;

// Candidate paths appended to each dispensary base URL. First hit wins.
const DEAL_PATH_CANDIDATES = [
  "/",
  "/deals",
  "/deals/",
  "/promotions",
  "/promotions/",
  "/specials",
  "/specials/",
  "/offers",
  "/offers/",
  "/discounts",
];

// Discount patterns we try to match against the page HTML+text.
// Each regex captures the headline shape. We normalize to a simple title
// + discount_value so downstream dedup has a stable signal.
const DISCOUNT_PATTERNS: Array<{
  pattern: RegExp;
  label: (m: RegExpMatchArray) => {
    title: string;
    discount_value: number | null;
    discount_unit: "percent" | "dollar" | "other";
  };
}> = [
  {
    // "20% off first-time" or "first-time 20% off"
    pattern: /(first[-\s]?time|first\s+visit)[^.\n]{0,40}?(\d{1,2})\s?%[^.\n]{0,20}?off/gi,
    label: (m) => ({
      title: `First-time ${m[2]}% off`,
      discount_value: Number(m[2]),
      discount_unit: "percent" as const,
    }),
  },
  {
    pattern: /(\d{1,2})\s?%[^.\n]{0,20}?off[^.\n]{0,30}?(first[-\s]?time|first\s+visit)/gi,
    label: (m) => ({
      title: `First-time ${m[1]}% off`,
      discount_value: Number(m[1]),
      discount_unit: "percent" as const,
    }),
  },
  {
    // "Veterans 10% off" / "Veteran discount 10%"
    pattern: /(veteran[s]?|military)[^.\n]{0,40}?(\d{1,2})\s?%[^.\n]{0,20}?off/gi,
    label: (m) => ({
      title: `${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}% off`,
      discount_value: Number(m[2]),
      discount_unit: "percent" as const,
    }),
  },
  {
    // "Senior 10% off"
    pattern: /(senior[s]?)[^.\n]{0,40}?(\d{1,2})\s?%[^.\n]{0,20}?off/gi,
    label: (m) => ({
      title: `Senior ${m[2]}% off`,
      discount_value: Number(m[2]),
      discount_unit: "percent" as const,
    }),
  },
  {
    // "Munchie Monday 20% off edibles" / themed day of week
    pattern:
      /(Munchie\s+Monday|Terpene\s+Tuesday|Wax\s+Wednesday|Flower\s+Friday|Shatter\s+Sunday|Kush\s+Saturday|Thirsty\s+Thursday)[^.\n]{0,60}?(\d{1,2})\s?%[^.\n]{0,30}?off/gi,
    label: (m) => ({
      title: `${m[1]} — ${m[2]}% off`,
      discount_value: Number(m[2]),
      discount_unit: "percent" as const,
    }),
  },
  {
    // "BOGO" / "Buy one get one"
    pattern: /(BOGO|Buy\s+one\s+get\s+one)[^.\n]{0,60}?(free|half\s+off|50\s?%)/gi,
    label: (m) => ({
      title: `BOGO — ${m[2]}`,
      discount_value: null,
      discount_unit: "other" as const,
    }),
  },
  {
    // Bare "XX% off <category>" where category is specific enough to be a deal
    // headline (flower, carts, concentrates, edibles, pre-rolls, drinks).
    pattern:
      /(\d{2})\s?%\s+off[^.\n]{0,40}?(flower|vapes?|cartridges?|carts?|concentrates?|edibles?|pre[-\s]rolls?|drinks?|beverages?|gummies?|infused)/gi,
    label: (m) => ({
      title: `${m[1]}% off ${m[2].toLowerCase()}`,
      discount_value: Number(m[1]),
      discount_unit: "percent" as const,
    }),
  },
];

// ----------------------------- types ---------------------------------------

type Listing = {
  id: string;
  slug: string;
  name: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  is_active: boolean | null;
  project_tag: string | null;
};

type ExistingDeal = {
  id: string;
  listing_slug: string;
  title: string;
  discount_value: number | null;
  is_active: boolean | null;
  status_reason: string | null;
  source: string | null;
};

type ScrapedDeal = {
  listing_slug: string;
  title: string;
  discount_value: number | null;
  discount_unit: "percent" | "dollar" | "other";
  source_url: string;
};

type RunSummary = {
  mode: string;
  started_at: string;
  finished_at: string | null;
  listings_processed: number;
  listings_skipped_no_website: number;
  listings_skipped_aggregator: number;
  fetch_errors: Array<{ slug: string; error: string }>;
  deals_found: ScrapedDeal[];
  deals_inserted: Array<{ slug: string; title: string }>;
  deals_updated: Array<{ slug: string; title: string }>;
  deals_aged: Array<{ slug: string; title: string }>;
  rate_limited_hosts: string[];
};

// ----------------------------- REST helpers --------------------------------

async function supaGet<T>(path: string): Promise<T> {
  const key = SUPABASE_SERVICE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`supaGet failed ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supaPatch(path: string, body: unknown): Promise<unknown> {
  if (!SUPABASE_SERVICE_KEY) throw new Error("supaPatch requires service key");
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`supaPatch failed ${res.status}: ${await res.text()}`);
  return res.ok;
}

async function supaInsert(path: string, body: unknown): Promise<unknown> {
  if (!SUPABASE_SERVICE_KEY) throw new Error("supaInsert requires service key");
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`supaInsert failed ${res.status}: ${await res.text()}`);
  return res.ok;
}

// ----------------------------- fetch with timeout --------------------------

async function fetchWithTimeout(url: string, ms = REQUEST_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// ----------------------------- parsing helpers -----------------------------

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonLdOffers(html: string): Array<{ title: string; value: number | null }> {
  const out: Array<{ title: string; value: number | null }> = [];
  const blocks = html.match(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    const jsonText = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const data = JSON.parse(jsonText);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const offers = item?.offers;
        const offerArr = Array.isArray(offers) ? offers : offers ? [offers] : [];
        for (const o of offerArr) {
          const name = o?.name || item?.name;
          const discount = o?.priceSpecification?.discount || o?.discount;
          if (name && typeof name === "string") {
            const pct = typeof discount === "string" ? Number(discount.replace(/[^0-9]/g, "")) : null;
            out.push({ title: name.slice(0, 120), value: pct && Number.isFinite(pct) ? pct : null });
          }
        }
      }
    } catch {
      /* skip malformed JSON-LD */
    }
  }
  return out;
}

function extractMetaDescription(html: string): string | null {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function extractDealsFromHtml(html: string, sourceUrl: string, listingSlug: string): ScrapedDeal[] {
  const found: ScrapedDeal[] = [];
  const seen = new Set<string>();

  const push = (d: { title: string; discount_value: number | null; discount_unit: "percent" | "dollar" | "other" }) => {
    const key = normalizeTitle(d.title);
    if (!key || seen.has(key)) return;
    seen.add(key);
    found.push({
      listing_slug: listingSlug,
      title: d.title.slice(0, 160),
      discount_value: d.discount_value,
      discount_unit: d.discount_unit,
      source_url: sourceUrl,
    });
  };

  // 1. JSON-LD
  for (const o of extractJsonLdOffers(html)) {
    push({ title: o.title, discount_value: o.value, discount_unit: o.value !== null ? "percent" : "other" });
  }

  // 2. Meta description
  const meta = extractMetaDescription(html);
  const text = stripTags(html);
  const haystacks = [meta ? meta : "", text].filter(Boolean);

  for (const hay of haystacks) {
    for (const { pattern, label } of DISCOUNT_PATTERNS) {
      const re = new RegExp(pattern.source, pattern.flags.replace(/g/, "") + "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(hay)) !== null) {
        push(label(m as unknown as RegExpMatchArray));
      }
    }
  }

  return found;
}

// ----------------------------- robots.txt ---------------------------------

const robotsCache: Record<string, { disallow: string[]; fetched_at: number }> = {};
const hostCooldown: Record<string, number> = {};

async function isAllowedByRobots(url: string): Promise<boolean> {
  const u = new URL(url);
  const host = u.host;
  if (hostCooldown[host] && Date.now() < hostCooldown[host]) return false;
  if (!robotsCache[host]) {
    try {
      const res = await fetchWithTimeout(`${u.protocol}//${host}/robots.txt`, 8000);
      if (res.ok) {
        const txt = await res.text();
        const disallow: string[] = [];
        let inStar = false;
        for (const line of txt.split("\n")) {
          const L = line.trim();
          if (/^user-agent:\s*\*/i.test(L)) inStar = true;
          else if (/^user-agent:/i.test(L)) inStar = false;
          else if (inStar) {
            const m = L.match(/^disallow:\s*(\S+)/i);
            if (m) disallow.push(m[1]);
          }
        }
        robotsCache[host] = { disallow, fetched_at: Date.now() };
      } else {
        robotsCache[host] = { disallow: [], fetched_at: Date.now() };
      }
    } catch {
      robotsCache[host] = { disallow: [], fetched_at: Date.now() };
    }
  }
  const { disallow } = robotsCache[host];
  for (const d of disallow) {
    if (d && u.pathname.startsWith(d)) return false;
  }
  return true;
}

// ----------------------------- scrape a single listing ---------------------

async function scrapeListing(
  listing: Listing
): Promise<{ deals: ScrapedDeal[]; error?: string; skipped?: string }> {
  if (!listing.website) return { deals: [], skipped: "no_website" };

  let baseUrl: URL;
  try {
    baseUrl = new URL(listing.website);
  } catch {
    return { deals: [], skipped: "invalid_url" };
  }

  if (AGGREGATOR_HOSTS.has(baseUrl.host)) {
    return { deals: [], skipped: "aggregator_host" };
  }

  const combined: ScrapedDeal[] = [];
  const seenKeys = new Set<string>();

  for (const path of DEAL_PATH_CANDIDATES) {
    const candidateUrl = `${baseUrl.protocol}//${baseUrl.host}${path}`;
    const allowed = await isAllowedByRobots(candidateUrl);
    if (!allowed) continue;

    try {
      const res = await fetchWithTimeout(candidateUrl);
      if (res.status === 429) {
        hostCooldown[baseUrl.host] = Date.now() + 60 * 60 * 1000;
        return { deals: combined, error: "rate_limited_429" };
      }
      if (!res.ok) continue;
      const html = await res.text();
      const deals = extractDealsFromHtml(html, candidateUrl, listing.slug);
      for (const d of deals) {
        const key = normalizeTitle(d.title);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          combined.push(d);
        }
      }
    } catch (err) {
      // Continue trying other paths.
    }

    await sleep(REQUEST_DELAY_MS);

    // Only try one deeper path once we've found deals on the homepage.
    if (combined.length > 0 && path === "/") continue;
  }

  return { deals: combined };
}

// ----------------------------- dedup + write -------------------------------

function pickMatchingExisting(
  scraped: ScrapedDeal,
  existing: ExistingDeal[]
): ExistingDeal | undefined {
  const key = normalizeTitle(scraped.title);
  return existing.find(
    (e) =>
      e.listing_slug === scraped.listing_slug &&
      normalizeTitle(e.title) === key &&
      (scraped.discount_value == null ||
        e.discount_value == null ||
        e.discount_value === scraped.discount_value)
  );
}

// ----------------------------- main ----------------------------------------

async function main() {
  const summary: RunSummary = {
    mode: MODE,
    started_at: new Date().toISOString(),
    finished_at: null,
    listings_processed: 0,
    listings_skipped_no_website: 0,
    listings_skipped_aggregator: 0,
    fetch_errors: [],
    deals_found: [],
    deals_inserted: [],
    deals_updated: [],
    deals_aged: [],
    rate_limited_hosts: [],
  };

  // 1. Load active CIL listings.
  const citiesIn = Array.from(CENTRAL_IL_CITIES)
    .map((c) => `"${c}"`)
    .join(",");
  const listingsPath = `/master_listings?select=id,slug,name,city,state,website,is_active,project_tag&is_active=eq.true&project_tag=eq.green&state=eq.IL&limit=200`;
  const allListings = await supaGet<Listing[]>(listingsPath);

  // Filter by CIL city (case-insensitive) + non-null website + non-aggregator.
  const cilListings = allListings
    .filter((l) => l.city && CENTRAL_IL_CITIES.has(l.city.toLowerCase()))
    .filter((l) => {
      if (!l.website) {
        summary.listings_skipped_no_website += 1;
        return false;
      }
      try {
        const u = new URL(l.website);
        if (AGGREGATOR_HOSTS.has(u.host)) {
          summary.listings_skipped_aggregator += 1;
          return false;
        }
      } catch {
        return false;
      }
      return true;
    })
    .slice(0, MAX_LISTINGS);

  console.log(
    `Scope: ${cilListings.length} CIL listings with websites. Skipped (no website): ${summary.listings_skipped_no_website}. Skipped (aggregator website): ${summary.listings_skipped_aggregator}.`
  );

  // 2. Load existing deals for those listings (for dedup).
  const slugsIn = cilListings.map((l) => `"${l.slug}"`).join(",");
  const existingPath = slugsIn
    ? `/deals?select=id,listing_slug,title,discount_value,is_active,status_reason,source&listing_slug=in.(${slugsIn})&limit=500`
    : null;
  const existing = existingPath ? await supaGet<ExistingDeal[]>(existingPath) : [];
  console.log(`Existing deals for CIL listings: ${existing.length}`);

  // 3. Scrape.
  const allScraped: ScrapedDeal[] = [];
  for (const l of cilListings) {
    summary.listings_processed += 1;
    console.log(`→ ${l.slug} @ ${l.website}`);
    try {
      const r = await scrapeListing(l);
      if (r.skipped) {
        summary.fetch_errors.push({ slug: l.slug, error: `skipped:${r.skipped}` });
        continue;
      }
      if (r.error) {
        summary.fetch_errors.push({ slug: l.slug, error: r.error });
        if (r.error === "rate_limited_429") {
          try {
            const host = new URL(l.website!).host;
            if (!summary.rate_limited_hosts.includes(host)) summary.rate_limited_hosts.push(host);
          } catch {}
        }
      }
      for (const d of r.deals) {
        allScraped.push(d);
        summary.deals_found.push(d);
      }
      console.log(`   found ${r.deals.length} deals`);
    } catch (err) {
      summary.fetch_errors.push({ slug: l.slug, error: String((err as Error).message) });
    }
  }

  // 4. Diff scraped vs existing; split into inserts vs updates.
  const upsertPlan: Array<{ op: "insert" | "update"; scraped: ScrapedDeal; existingId?: string }> = [];
  const seenKeys = new Set<string>();
  for (const s of allScraped) {
    const key = `${s.listing_slug}|${normalizeTitle(s.title)}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    const match = pickMatchingExisting(s, existing);
    if (match) upsertPlan.push({ op: "update", scraped: s, existingId: match.id });
    else upsertPlan.push({ op: "insert", scraped: s });
  }

  // Deals previously scraped but not found this run: mark not_seen_last_scrape.
  const scrapedKeys = new Set(upsertPlan.map((u) => `${u.scraped.listing_slug}|${normalizeTitle(u.scraped.title)}`));
  const agedOut = existing.filter(
    (e) =>
      e.is_active &&
      e.source !== "leafly" &&
      e.source !== "weedmaps" &&
      e.status_reason !== "not_seen_last_scrape" &&
      !scrapedKeys.has(`${e.listing_slug}|${normalizeTitle(e.title)}`)
  );

  // 5. Write (if --live --apply).
  if (LIVE && APPLY) {
    for (const u of upsertPlan) {
      if (u.op === "insert") {
        await supaInsert("/deals", {
          listing_slug: u.scraped.listing_slug,
          project_tag: "green",
          title: u.scraped.title,
          discount_value: u.scraped.discount_value,
          discount_unit:
            u.scraped.discount_unit === "percent"
              ? "percent"
              : u.scraped.discount_unit === "dollar"
                ? "dollar"
                : null,
          discount_type: u.scraped.discount_unit === "percent" ? "percentage" : "other",
          source: "website",
          source_url: u.scraped.source_url,
          is_active: true,
          status_reason: "scraped_direct_source",
          verified_at: new Date().toISOString(),
          verified_by: "scraper@puffprice.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        summary.deals_inserted.push({ slug: u.scraped.listing_slug, title: u.scraped.title });
      } else if (u.op === "update" && u.existingId) {
        await supaPatch(`/deals?id=eq.${u.existingId}`, {
          verified_at: new Date().toISOString(),
          verified_by: "scraper@puffprice.com",
          status_reason: "scraped_direct_source",
          is_active: true,
          updated_at: new Date().toISOString(),
        });
        summary.deals_updated.push({ slug: u.scraped.listing_slug, title: u.scraped.title });
      }
    }
    for (const a of agedOut) {
      await supaPatch(`/deals?id=eq.${a.id}`, {
        status_reason: "not_seen_last_scrape",
        updated_at: new Date().toISOString(),
      });
      summary.deals_aged.push({ slug: a.listing_slug, title: a.title });
    }
  } else {
    for (const u of upsertPlan) {
      if (u.op === "insert") summary.deals_inserted.push({ slug: u.scraped.listing_slug, title: u.scraped.title });
      else summary.deals_updated.push({ slug: u.scraped.listing_slug, title: u.scraped.title });
    }
    for (const a of agedOut) summary.deals_aged.push({ slug: a.listing_slug, title: a.title });
  }

  summary.finished_at = new Date().toISOString();

  const outPath =
    OUTPUT_FLAG ||
    `/tmp/cil-scrape-${DRY && !APPLY ? "dryrun" : "live"}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  try {
    const dir = outPath.substring(0, outPath.lastIndexOf("/"));
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  } catch {}
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`Summary written to ${outPath}`);
  console.log(
    `Totals: processed=${summary.listings_processed} found=${summary.deals_found.length} insert=${summary.deals_inserted.length} update=${summary.deals_updated.length} aged=${summary.deals_aged.length} errors=${summary.fetch_errors.length}`
  );
}

main().catch((err) => {
  console.error("FATAL", err);
  exit(1);
});
