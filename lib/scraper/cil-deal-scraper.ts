import { inferCategory } from "../inferCategory";
// lib/scraper/cil-deal-scraper.ts
// Shared scraper core used by both the CLI script (scripts/scrape-cil-deals.ts)
// and the Vercel cron route (app/api/cron/scrape-deals/route.ts).
//
// Scope lock: Central IL only. Aggregator hosts are blocklisted.
// Policy: direct dispensary websites + social media only.

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function extractRecurringDaysFromTitle(title: string): string[] | null {
  if (!title) return null;
  const t = title.toLowerCase();
  const found = DAY_NAMES.filter((d) => t.includes(d));
  return found.length > 0 ? [...found] : null;
}

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
// Every Supabase REST call is bounded so a stalled connection can never hang
// a run (the rendered scrape once sat in status='running' for 11+ hours).
const SUPABASE_TIMEOUT_MS = 20000;

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
    // "42.0% Off First Purchase!" counts too.
    pattern: /(\d{1,2})(?:\.0+)?\s?%[^.\n]{0,20}?off[^.\n]{0,30}?(first[-\s]?time|first\s+(?:visit|purchase|order))/gi,
    label: (m) => ({
      title: `First-time ${m[1]}% off`,
      discount_value: Number(m[1]),
      discount_unit: "percent" as const,
    }),
  },
  {
    pattern: /(veteran[s]?|military)[^.\n]{0,40}?(\d{1,2})\s?%[^.\n]{0,20}?off/gi,
    label: (m) => ({
      title: `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]}% off`,
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
      /(\d{2})\s?%\s+off\s+([^.\n%!]{0,40}?)(flower|vapes?|cartridges?|carts?|concentrates?|edibles?|pre[-\s]rolls?|drinks?|beverages?|gummies?|infused)/gi,
    // Keep the words between "off" and the category ("40% Off Elevate
    // Vapes" is a brand deal, not 40% off every vape). '%' and '!' can't
    // appear in the gap, so one deal's text never bleeds into the next.
    label: (m) => ({
      title: `${m[1]}% off ${m[2].trim() ? m[2].trim() + " " : ""}${m[3].toLowerCase()}`,
      discount_value: Number(m[1]),
      discount_unit: "percent" as const,
    }),
  },
  // Shop-card brand deals: "25% OFF KANHA  Order NOW!" (Cookies sites).
  // Uppercase brand immediately followed by a shop CTA, so random prose
  // can't match. Vague labels ("SPECIAL", "DEALS") are dropped in label().
  {
    pattern: /(\d{2})\s?%\s+OFF\s+([A-Z][A-Z0-9&'.]*(?:\s+[A-Z][A-Z0-9&'.]*){0,3})\s+(?:Order|Shop)\s+Now/g,
    label: (m) => {
      const brand = m[2]
        .toLowerCase()
        .replace(/\b([a-z])/g, (c) => c.toUpperCase());
      if (/^(Special|Specials|Deal|Deals|Sale|Everything)$/i.test(brand)) {
        return { title: "", discount_value: null, discount_unit: "other" as const };
      }
      return {
        title: `${m[1]}% off ${brand}`,
        discount_value: Number(m[1]),
        discount_unit: "percent" as const,
      };
    },
  },
  // Storewide: "25% Off the Entire Store!" / "20% off everything"
  {
    pattern: /(\d{2})\s?%\s+off\s+(?:the\s+)?(entire\s+store|everything|storewide|sitewide|all\s+products)/gi,
    label: (m) => ({
      title: `${m[1]}% off entire store`,
      discount_value: Number(m[1]),
      discount_unit: "percent" as const,
    }),
  },
  // Brand-wide: "30% Off NGW Brands!" / "20% off Cresco products". Case-
  // sensitive on purpose: the brand must be Capitalized so "30% off all
  // products" or random prose doesn't match.
  {
    pattern: /(\d{2})\s?%\s+[Oo][Ff][Ff]\s+([A-Z][A-Za-z0-9&'.]*(?:\s+[A-Z][A-Za-z0-9&'.]*){0,3})\s+([Bb]rands?|[Pp]roducts)\b/g,
    label: (m) => ({
      title: `${m[1]}% off ${m[2]} ${m[3].toLowerCase()}`,
      discount_value: Number(m[1]),
      discount_unit: "percent" as const,
    }),
  },
];

// Audience discounts written number-first: "10% off Veterans", "10% Off – Seniors".
const AUDIENCE_WORDS = "veterans?|military|seniors?";
const AUDIENCE_NUMBER_FIRST = /(\d{1,2})\s?%\s*off\s*[:–—-]?\s*(veterans?|military|seniors?)\b/gi;
// The loose group-first first-time/veteran/senior patterns above; skipped when the page
// is laid out number-first (see extractDealsFromHtml).
const AUDIENCE_GROUP_FIRST_SOURCES = new Set(
  DISCOUNT_PATTERNS.filter(({ pattern }) => /^\((?:veteran|senior|first)/.test(pattern.source)).map(({ pattern }) => pattern.source)
);

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

// Like stripTags, but block-level boundaries become line breaks. The text
// patterns never match across a line ("[^.\n]"), so one card's or list
// item's number can no longer be glued to the next item's label (a flattened
// page is how "THIRSTY THURSDAYS  Shop Now  SECRET MENU 30% OFF" became
// "Thirsty Thursday — 30% off").
function stripTagsKeepLines(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:p|div|li|ul|ol|h[1-6]|tr|table|section|article|header|footer|nav|aside|main|blockquote|dt|dd|figure|figcaption)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t\f\r\v]+/g, " ")
    .replace(/ ?\n[\s]*/g, "\n")
    .trim()
    .split("\n")
    // Card layouts put the label and the value in separate blocks
    // ("Veterans" / "30% Off Every Day!", "Senior Discount (Age 62+):" /
    // "10% Off…"). Re-join a short label line that states no offer of its
    // own (no % or $) with the value line that follows it — once.
    .reduce<string[]>((acc, line) => {
      const prev = acc[acc.length - 1];
      if (prev !== undefined && /^[$\d]/.test(line) && prev.length <= 60 && !/[%$]/.test(prev) && !prev.endsWith("\u0000")) {
        acc[acc.length - 1] = `${prev} ${line}\u0000`;
      } else acc.push(line);
      return acc;
    }, [])
    .map((l) => l.replace(/\u0000$/, ""))
    .join("\n");
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

// Rendered menus list one promo per product ("50% off 4+ Cresco Blue Dream
// flower", "… Bob Hope flower", …). Three or more titles that differ only
// in the product name collapse into one store-level deal:
// "50% off 4+ Cresco flower (select strains)".
export function collapseVariantDeals(deals: ScrapedDeal[]): ScrapedDeal[] {
  const re = /^(.*?\d{1,2}% off (?:\d\+ )?)([A-Z][\w&'.-]*)\s+(.+?)\s+(flower|vapes?|carts?|cartridges|edibles|gummies|pre-?rolls?|concentrates?)$/i;
  const groups = new Map<string, ScrapedDeal[]>();
  const rest: ScrapedDeal[] = [];
  for (const d of deals) {
    const m = d.title.match(re);
    if (!m) { rest.push(d); continue; }
    const k = `${m[1].toLowerCase()}|${m[2]}|${m[4].toLowerCase()}`;
    const g = groups.get(k) || [];
    g.push(d);
    groups.set(k, g);
  }
  // Tiered "N% off Select products" (buy-more-save-more ladders) → one deal.
  const tier = /^(\d{1,2})% off select products$/i;
  const tiers = rest.filter((d) => tier.test(d.title));
  let out = rest;
  if (tiers.length >= 3) {
    const top = tiers.reduce((a, b) => (Number(b.title.match(tier)![1]) > Number(a.title.match(tier)![1]) ? b : a));
    const max = Number(top.title.match(tier)![1]);
    out = rest.filter((d) => !tier.test(d.title));
    out.push({ ...top, title: `Up to ${max}% off select products`, discount_value: max, discount_unit: "percent" });
  } else out = [...rest];
  for (const [, g] of groups) {
    if (g.length >= 3) {
      const m = g[0].title.match(re)!;
      out.push({ ...g[0], title: `${m[1]}${m[2]} ${m[4].toLowerCase()} (select strains)` });
    } else out.push(...g);
  }
  return out;
}

export function extractDealsFromHtml(html: string, sourceUrl: string, listingSlug: string): ScrapedDeal[] {
  const found: ScrapedDeal[] = [];
  const seen = new Set<string>();

  const push = (d: { title: string; discount_value: number | null; discount_unit: "percent" | "dollar" | "other" }) => {
    // Shop-card CTAs ("Shop Now ⭢ 2/$30 GOODY BAG…") bleed into titles on some
    // sites; everything from the CTA on belongs to the next card.
    d = { ...d, title: d.title.replace(/\s+(?:Shop|Order)\s+Now\b.*$/i, "").trim() };
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
  const text = stripTagsKeepLines(html);
  const haystacks = [meta ? meta : "", text].filter(Boolean);

  for (const hay of haystacks) {
    // Audience discounts can be written group-first ("Veterans: 20% off")
    // or number-first ("10% off Veterans discount", "10% Off – Seniors").
    // When several sit on one line, the loose group-first patterns pair each
    // group with the NEXT item's number ("Senior discount (55+) (not
    // stackable) 30% off Medical…" → "Senior 30% off" — false). Decide the
    // layout per line from tight, adjacent matches; on a number-first line
    // use only number-first matches.
    const numberFirstLines = new Set<number>();
    const lineStarts: number[] = [0];
    for (let i = 0; i < hay.length; i++) if (hay[i] === "\n") lineStarts.push(i + 1);
    const lineOf = (idx: number) => {
      let lo = 0, hi = lineStarts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    const tightGroupFirstRe = new RegExp(`\\b(?:${AUDIENCE_WORDS})\\b[ \\t]*(?:discount)?[ \\t]*[:–—-]?[ \\t]*\\d{1,2}\\s?%[ \\t]*off`, "gi");
    const gfCount = new Map<number, number>();
    for (const m of hay.matchAll(tightGroupFirstRe)) gfCount.set(lineOf(m.index!), (gfCount.get(lineOf(m.index!)) || 0) + 1);
    const nfByLine = new Map<number, RegExpMatchArray[]>();
    for (const m of hay.matchAll(AUDIENCE_NUMBER_FIRST)) {
      const ln = lineOf(m.index!);
      nfByLine.set(ln, [...(nfByLine.get(ln) || []), m]);
    }
    for (const [ln, ms] of nfByLine) {
      if (ms.length <= (gfCount.get(ln) || 0)) continue;
      numberFirstLines.add(ln);
      for (const m of ms) {
        const group = m[2].toLowerCase().startsWith("senior")
          ? "Senior"
          : `${m[2][0].toUpperCase()}${m[2].slice(1).toLowerCase()}`;
        push({ title: `${group} ${m[1]}% off`, discount_value: Number(m[1]), discount_unit: "percent" });
      }
    }
    for (const { pattern, label } of DISCOUNT_PATTERNS) {
      const audienceGroupFirst = AUDIENCE_GROUP_FIRST_SOURCES.has(pattern.source);
      const re = new RegExp(pattern.source, pattern.flags.replace(/g/, "") + "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(hay)) !== null) {
        if (audienceGroupFirst && numberFirstLines.has(lineOf(m.index))) continue;
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

export async function isAllowedByRobots(url: string): Promise<boolean> {
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

/**
 * Where to look for a store's deals.
 * Chain sites list many stores under one host (nueracannabis.com,
 * beyond-hello.com, ascendwellness.com…). Their host-root /deals page is
 * chain-wide, so attributing it to one store is wrong — and for nuEra it's
 * where the East Peoria/Champaign/Pekin/Urbana deals stopped matching on
 * Sep 1. When the listing's website has a store path, look ONLY under that
 * path (the store page and its /deals, /specials, /promotions children).
 * Single-store sites keep the original host-root candidates.
 */
export function candidateUrls(baseUrl: URL): string[] {
  const origin = `${baseUrl.protocol}//${baseUrl.host}`;
  const storePath = baseUrl.pathname.replace(/\/+$/, "");
  if (storePath && storePath !== "") {
    return [
      `${origin}${storePath}/deals/`,
      `${origin}${storePath}/specials/`,
      `${origin}${storePath}/promotions/`,
      `${origin}${storePath}/`,
    ];
  }
  return DEAL_PATH_CANDIDATES.map((p) => `${origin}${p}`);
}

// Renders a URL in a real browser and returns the main document HTML plus
// every iframe's HTML (Dutchie/Jane/Sweed menus live in iframes or are
// client-rendered). Supplied by scripts/scrape-rendered-deals.ts; the
// Vercel cron never sets it.
export type HtmlFetcher = (url: string) => Promise<string[] | null>;

async function scrapeListing(
  listing: Listing,
  fetcher?: HtmlFetcher,
  urlOverrides?: Record<string, string[]>,
  deadlineMs: number = Number.POSITIVE_INFINITY
): Promise<{ deals: ScrapedDeal[]; error?: string; skipped?: string }> {
  const override = urlOverrides?.[listing.slug];
  // A store with a known deals page (urlOverrides) is scraped from that page
  // even if master_listings.website is still blank or stale.
  const websiteOrOverride = listing.website || override?.[0];
  if (!websiteOrOverride) return { deals: [], skipped: "no_website" };

  let baseUrl: URL;
  try {
    baseUrl = new URL(websiteOrOverride);
  } catch {
    return { deals: [], skipped: "invalid_url" };
  }

  if (AGGREGATOR_HOSTS.has(baseUrl.host)) {
    return { deals: [], skipped: "aggregator_host" };
  }

  const combined: ScrapedDeal[] = [];
  const seenKeys = new Set<string>();

  const urls = override ?? candidateUrls(baseUrl);
  // An explicit empty override means "this store has no deals page of its
  // own" (e.g. its website field points at a different store) — never fall
  // back to guessing.
  if (urls.length === 0) return { deals: [], skipped: "no_store_deals_page" };
  for (const candidateUrl of urls) {
    if (Date.now() > deadlineMs) {
      return { deals: combined, error: combined.length ? undefined : "store_time_budget_exceeded" };
    }
    let candidateHost: string;
    try {
      candidateHost = new URL(candidateUrl).host;
    } catch {
      continue;
    }
    if (AGGREGATOR_HOSTS.has(candidateHost)) continue;
    const path = new URL(candidateUrl).pathname;
    const allowed = await isAllowedByRobots(candidateUrl);
    if (!allowed) continue;

    try {
      let htmls: string[];
      if (fetcher) {
        const got = await fetcher(candidateUrl);
        if (!got) continue;
        htmls = got;
      } else {
        const res = await fetchWithTimeout(candidateUrl);
        if (res.status === 429) {
          hostCooldown[baseUrl.host] = Date.now() + 60 * 60 * 1000;
          return { deals: combined, error: "rate_limited_429" };
        }
        if (!res.ok) continue;
        htmls = [await res.text()];
      }
      const deals = collapseVariantDeals(htmls.flatMap((h) => extractDealsFromHtml(h, candidateUrl, listing.slug)));
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
  // Rendered (real-browser) mode — see HtmlFetcher.
  fetcher?: HtmlFetcher;
  onlySlugs?: string[];
  urlOverrides?: Record<string, string[]>;
  // Hang protection (rendered runs). A store that takes longer than
  // perListingTimeoutMs is abandoned with a fetch_error; once deadlineAt
  // (epoch ms) passes, no further stores are started and the rest are
  // reported as "run_deadline_reached" so the run finishes as 'partial'.
  perListingTimeoutMs?: number;
  deadlineAt?: number;
  // Called after each store so a caller can checkpoint progress.
  onListingDone?: (summary: ScraperSummary) => void;
}

async function supaGet<T>(supabaseUrl: string, key: string, path: string): Promise<T> {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
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
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
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
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
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
      if (!l.website && cfg.urlOverrides?.[l.slug]?.length) return true;
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
    .filter((l) => !cfg.onlySlugs || cfg.onlySlugs.includes(l.slug))
    .slice(0, cfg.maxListings);

  const SOURCE = cfg.fetcher ? "website_rendered" : "website";
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
    if (cfg.deadlineAt && Date.now() > cfg.deadlineAt) {
      summary.fetch_errors.push({ slug: l.slug, error: "run_deadline_reached" });
      continue;
    }
    summary.listings_processed += 1;
    try {
      const budget = cfg.perListingTimeoutMs;
      const storeDeadline = budget ? Date.now() + budget : Number.POSITIVE_INFINITY;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const r = budget
        ? await Promise.race([
            scrapeListing(l, cfg.fetcher, cfg.urlOverrides, storeDeadline),
            new Promise<{ deals: ScrapedDeal[]; error?: string; skipped?: string }>((resolve) => {
              timer = setTimeout(
                () => resolve({ deals: [], error: `timeout: store exceeded ${Math.round(budget / 1000)}s budget` }),
                budget
              );
            }),
          ]).finally(() => clearTimeout(timer))
        : await scrapeListing(l, cfg.fetcher, cfg.urlOverrides);
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
    cfg.onListingDone?.(summary);
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
  // Each mode only retires its own deals: the static cron must not age out
  // what the rendered run found (it can't see JS menus), and the rendered
  // run only retires deals for stores it actually loaded this run.
  const loadedOk = new Set(
    cilListings.map((l) => l.slug).filter((slug) => !summary.fetch_errors.some((f) => f.slug === slug))
  );
  const agedOut = existing.filter(
    (e) =>
      e.is_active &&
      e.source !== "leafly" &&
      e.source !== "weedmaps" &&
      (SOURCE === "website_rendered"
        ? e.source === "website_rendered" && loadedOk.has(e.listing_slug)
        : e.source !== "website_rendered") &&
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
        const recurringDays = extractRecurringDaysFromTitle(u.scraped.title);
        const insertBase = {
          listing_slug: u.scraped.listing_slug,
          project_tag: "green",
          title: u.scraped.title,
          category: inferCategory(u.scraped.title),
          discount_value: u.scraped.discount_value,
          discount_unit:
            u.scraped.discount_unit === "percent"
              ? "percent"
              : u.scraped.discount_unit === "dollar"
                ? "dollar"
                : null,
          discount_type: u.scraped.discount_unit === "percent" ? "percentage" : "other",
          source: SOURCE,
          source_url: u.scraped.source_url,
          is_active: true,
          status_reason: "scraped_direct_source",
          recurring_days: recurringDays,
          is_recurring: recurringDays !== null,
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
          // Fill category only when we can infer one; never blank out a
          // category someone set by hand.
          ...(inferCategory(u.scraped.title) ? { category: inferCategory(u.scraped.title) } : {}),
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
        is_active: false,
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
