// lib/scraper/cil-deal-scraper.ts
// Shared scraper core used by both the CLI script (scripts/scrape-cil-deals.ts)
// and the Vercel cron route (app/api/cron/scrape-deals/route.ts).
//
// Scope lock: Central IL only. Aggregator hosts are blocklisted.
// Policy: direct dispensary websites + social media only.

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

const DISCOUNT_PATTERNS: Array<{
  pattern: RegExp;
  label: (m: RegExpMatchArray) => {
    title: string;
    discount_value: number | null;
    discount_unit: "percent" | "dollar" | "other";
  };
}> = [
  {
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
    pattern: /(veteran[s]?|military)[^.\n]{0,40}?(\d{1,2})\s?%[^.\n]{0,20}?off/gi,
    label: (m) => ({
      title: `${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}% off`,
      discount_value: Number(m[2]),
      discount_unit: "percent" as const,
    }),
  },
  {
    pattern: /(senior[s]?)[^.\n]{0,40}?(\d{1,2})\s?%[^.\n]{0,20}?off/gi,
    label: (m) => ({
      title: `Senior ${m[2]}% off`,
      discount_value: Number(m[2]),
      discount_unit: "percent" as const,
    }),
  },
  {
    pattern:
      /(Munchie\s+Monday|Terpene\s+Tuesday|Wax\s+Wednesday|Flower\s+Friday|Shatter\s+Sunday|Kush\s+Saturday|Thirsty\s+Thursday)[^.\n]{0,60}?(\d{1,2})\s?%[^.\n]{0,30}?off/gi,
    label: (m) => ({
      title: `${m[1]} — ${m[2]}% off`,
      discount_value: Number(m[2]),
      discount_unit: "percent" as const,
    }),
  },
  {
    pattern: /(BOGO|Buy\s+one\s+get\s+one)[^.\n]{0,60}?(free|half\s+off|50\s?%)/gi,
    label: (m) => ({
      title: `BOGO — ${m[2]}`,
      discount_value: null,
      discount_unit: "other" as const,
    }),
  },
  {
    pattern:
      /(\d{2})\s?%\s+off[^.\n]{0,40}?(flower|vapes?|cartridges?|carts?|concentrates?|edibles?|pre[-\s]rolls?|drinks?|beverages?|gummies?|infused)/gi,
    label: (m) => ({
      title: `${m[1]}% off ${m[2].toLowerCase()}`,
      discount_value: Number(m[1]),
      discount_unit: "percent" as const,
    }),
  },
];

export type Listing = {
  id: string;
  slug: string;
  name: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  is_active: boolean | null;
  project_tag: string | null;
};

export type ExistingDeal = {
  id: string;
  listing_slug: string;
  title: string;
  discount_value: number | null;
  is_active: boolean | null;
  status_reason: string | null;
  source: string | null;
};

export type ScrapedDeal = {
  listing_slug: string;
  title: string;
  discount_value: number | null;
  discount_unit: "percent" | "dollar" | "other";
  source_url: string;
};

export type ScraperSummary = {
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

export function normalizeTitle(t: string): string {
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

  for (const o of extractJsonLdOffers(html)) {
    push({ title: o.title, discount_value: o.value, discount_unit: o.value !== null ? "percent" : "other" });
  }

  const meta = extractMetaDescription(html);
  const text = stripTags(html);
  const haystacks = [meta ? meta : "", text].filter(Boolean);

  for (const hay of haystacks) {
    for (const { pattern, label } of DISCOUNT_PATTERNS) {
      const re = new RegExp(pattern.source, pattern.flags.replace(/g/, "") + "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(hay)) !== null) {
        // BOGO guard: "Buy one, get one 50% off: Select vape" is a BOGO deal,
        // not a flat 50% off vape deal. Skip any match whose 40-char prefix
        // contains BOGO signals — the dedicated BOGO pattern covers this case.
        const prefix = hay.slice(Math.max(0, m.index - 40), m.index);
        if (/buy\s+(one|1|two|2|a)[,\s]+get\s+(one|1|a)|\bbogo\b|\bb1g1\b/i.test(prefix)) {
          continue;
        }
        push(label(m as unknown as RegExpMatchArray));
      }
    }
  }

  return found;
}

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

async function scrapeListing(listing: Listing): Promise<{ deals: ScrapedDeal[]; error?: string; skipped?: string }> {
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
    } catch {
      /* continue */
    }

    await sleep(REQUEST_DELAY_MS);

    if (combined.length > 0 && path === "/") continue;
  }

  return { deals: combined };
}

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

export interface RunConfig {
  supabaseUrl: string;
  serviceKey: string | undefined;
  mode: "dry" | "live";
  apply: boolean;
  maxListings: number;
}

async function supaGet<T>(supabaseUrl: string, key: string, path: string): Promise<T> {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`supaGet failed ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supaPatch(supabaseUrl: string, key: string, path: string, body: unknown): Promise<void> {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`supaPatch failed ${res.status}: ${await res.text()}`);
}

async function supaInsert(supabaseUrl: string, key: string, path: string, body: unknown): Promise<void> {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`supaInsert failed ${res.status}: ${await res.text()}`);
}

export async function runCilScrape(cfg: RunConfig): Promise<ScraperSummary> {
  if (cfg.mode === "live" && cfg.apply && !cfg.serviceKey) {
    throw new Error("live+apply requires SUPABASE_SERVICE_ROLE_KEY");
  }
  const readKey = cfg.serviceKey || "";

  const summary: ScraperSummary = {
    mode: cfg.mode + (cfg.apply ? "+apply" : ""),
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

  const allListings = await supaGet<Listing[]>(
    cfg.supabaseUrl,
    readKey,
    `/master_listings?select=id,slug,name,city,state,website,is_active,project_tag&is_active=eq.true&project_tag=eq.green&state=eq.IL&limit=200`
  );

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
    .slice(0, cfg.maxListings);

  const slugsIn = cilListings.map((l) => `"${l.slug}"`).join(",");
  const existing = slugsIn
    ? await supaGet<ExistingDeal[]>(
        cfg.supabaseUrl,
        readKey,
        `/deals?select=id,listing_slug,title,discount_value,is_active,status_reason,source&listing_slug=in.(${slugsIn})&limit=500`
      )
    : [];

  const allScraped: ScrapedDeal[] = [];
  for (const l of cilListings) {
    summary.listings_processed += 1;
    try {
      const r = await scrapeListing(l);
      if (r.skipped) {
        summary.fetch_errors.push({ slug: l.slug, error: `skipped:${r.skipped}` });
        continue;
      }
      if (r.error) {
        summary.fetch_errors.push({ slug: l.slug, error: r.error });
        if (r.error === "rate_limited_429" && l.website) {
          try {
            const host = new URL(l.website).host;
            if (!summary.rate_limited_hosts.includes(host)) summary.rate_limited_hosts.push(host);
          } catch {}
        }
      }
      for (const d of r.deals) {
        allScraped.push(d);
        summary.deals_found.push(d);
      }
    } catch (err) {
      summary.fetch_errors.push({ slug: l.slug, error: String((err as Error).message) });
    }
  }

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

  const scrapedKeys = new Set(upsertPlan.map((u) => `${u.scraped.listing_slug}|${normalizeTitle(u.scraped.title)}`));
  const agedOut = existing.filter(
    (e) =>
      e.is_active &&
      e.source !== "leafly" &&
      e.source !== "weedmaps" &&
      e.status_reason !== "not_seen_last_scrape" &&
      !scrapedKeys.has(`${e.listing_slug}|${normalizeTitle(e.title)}`)
  );

  if (cfg.mode === "live" && cfg.apply && cfg.serviceKey) {
    // last_independent_verification is what the daily-verification sweep
    // reads to decide trust tier. The scraper IS the independent
    // verification — so any time we insert or update a deal here, both
    // verified_at (display freshness) and last_independent_verification
    // (audit anchor) get the same NOW timestamp.
    const tryColumns = async (
      path: string,
      bodyWithCol: Record<string, unknown>,
      bodyFallback: Record<string, unknown>,
      method: "insert" | "patch"
    ) => {
      try {
        if (method === "insert") {
          await supaInsert(cfg.supabaseUrl, cfg.serviceKey!, "/deals", bodyWithCol);
        } else {
          await supaPatch(cfg.supabaseUrl, cfg.serviceKey!, path, bodyWithCol);
        }
        return;
      } catch (err) {
        const msg = String((err as Error).message);
        // Pre-migration: column doesn't exist. Retry without it. The
        // scraper still works — we just lose the audit anchor for this
        // run. Once Matthew applies the migration, both fields populate.
        if (/last_independent_verification/i.test(msg)) {
          if (method === "insert") {
            await supaInsert(cfg.supabaseUrl, cfg.serviceKey!, "/deals", bodyFallback);
          } else {
            await supaPatch(cfg.supabaseUrl, cfg.serviceKey!, path, bodyFallback);
          }
          return;
        }
        throw err;
      }
    };

    for (const u of upsertPlan) {
      if (u.op === "insert") {
        const nowIso = new Date().toISOString();
        const insertBase = {
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
          verified_at: nowIso,
          verified_by: "scraper@puffprice.com",
          created_at: nowIso,
          updated_at: nowIso,
        };
        await tryColumns(
          "",
          { ...insertBase, last_independent_verification: nowIso },
          insertBase,
          "insert"
        );
        summary.deals_inserted.push({ slug: u.scraped.listing_slug, title: u.scraped.title });
      } else if (u.op === "update" && u.existingId) {
        const nowIso = new Date().toISOString();
        const patchBase = {
          verified_at: nowIso,
          verified_by: "scraper@puffprice.com",
          status_reason: "scraped_direct_source",
          is_active: true,
          updated_at: nowIso,
        };
        await tryColumns(
          `/deals?id=eq.${u.existingId}`,
          { ...patchBase, last_independent_verification: nowIso },
          patchBase,
          "patch"
        );
        summary.deals_updated.push({ slug: u.scraped.listing_slug, title: u.scraped.title });
      }
    }
    for (const a of agedOut) {
      await supaPatch(cfg.supabaseUrl, cfg.serviceKey, `/deals?id=eq.${a.id}`, {
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
  return summary;
}
