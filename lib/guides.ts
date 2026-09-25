// lib/guides.ts — data + registry for the /guides answer pages.
//
// Every guide answers one question people ask Google and AI assistants.
// Legal / tax facts are hard-coded with the date we checked them and a link
// to the official source; anything about deals is pulled live from our own
// tables (deals via active_deals_with_listings, deal_observations,
// daily_market_stats), Central Illinois only. Fail-soft: a failed fetch
// returns [] and the page says what it can't show rather than guessing.

import { REGION_CITIES, getRegionStores, type RegionStore } from "./waysToBuy";
import { DAILY_LOG_START } from "./dealHistory";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const H = () => ({ apikey: ANON, Authorization: `Bearer ${ANON}` });

/** The day the legal and tax facts on the guides were last checked
 *  against the official sources linked on each page. */
export const FACTS_VERIFIED = "2026-09-25";

export type GuideDef = {
  slug: string;
  /** The question, as people type it. Used as the hub card title. */
  question: string;
  /** One-line summary for the hub and llms.txt. */
  blurb: string;
};

export const GUIDES: GuideDef[] = [
  { slug: "best-day-for-dispensary-deals", question: "What's the best day for dispensary deals in Central Illinois?", blurb: "Which weekdays Central Illinois stores run standing deals, from our own daily log." },
  { slug: "illinois-cannabis-prices-2026", question: "How much does weed cost in Illinois in 2026?", blurb: "State sales and item-price figures from IDFPR and Headset, plus what Central Illinois deals look like today." },
  { slug: "can-you-use-a-credit-card-at-illinois-dispensaries", question: "Can you use a credit card at an Illinois dispensary?", blurb: "Cash, debit, ATMs and what each Central Illinois chain says it takes." },
  { slug: "buying-cannabis-in-illinois-as-an-out-of-state-visitor", question: "Can out-of-state visitors buy cannabis in Illinois?", blurb: "Visitor limits after SB 3222, what ID works, and where to stop along I-74 and I-55." },
  { slug: "illinois-medical-cannabis-card-2026", question: "How do you get an Illinois medical cannabis card, and is it worth it?", blurb: "Steps, IDPH fees, the 1% tax, and which Central Illinois stores sell medical." },
  { slug: "dispensary-first-time-discounts-central-illinois", question: "Which Central Illinois dispensaries have first-time, veteran or senior discounts?", blurb: "A live, store-by-store list from each dispensary's own site." },
  { slug: "cannabis-and-driving-illinois", question: "Can you drive with cannabis in the car in Illinois?", blurb: "The container rule that changed June 12, 2026, the THC DUI limit, and car searches." },
  { slug: "where-to-buy-near-isu-and-uiuc", question: "Where are the dispensaries near ISU and UIUC?", blurb: "Bloomington-Normal and Champaign-Urbana stores with today's deals. 21 and over only." },
];

/** Older guide pages that live outside /guides but belong on the hub. */
export const EXISTING_GUIDES: { href: string; title: string; blurb: string }[] = [
  { href: "/cannabis/illinois/first-time-guide", title: "First time at a dispensary", blurb: "What to bring and what to expect at the counter." },
  { href: "/cannabis/illinois/laws", title: "Illinois cannabis laws", blurb: "Age, possession limits, where you can use it, what changed in 2026." },
  { href: "/illinois-cannabis-tax", title: "Illinois cannabis tax explained", blurb: "Why the shelf price isn't the price." },
  { href: "/illinois-cannabis-tax-calculator", title: "Tax calculator", blurb: "Your out-the-door price by city and product." },
  { href: "/out-the-door", title: "Out-the-door prices", blurb: "Today's deals with tax already added." },
  { href: "/ways-to-buy", title: "Ways to buy", blurb: "Order ahead, curbside, medical, closing times." },
  { href: "/drive-thru", title: "Drive-thru dispensaries", blurb: "Legal since June 2026. Who has one." },
  { href: "/medical", title: "Medical dispensaries", blurb: "Central Illinois stores confirmed selling medical." },
  { href: "/open-late", title: "Open latest tonight", blurb: "Who's still open, latest first." },
  { href: "/on-the-way", title: "Best deal on your route", blurb: "Deals along the drive you're already making." },
  { href: "/illinois-cannabis-delivery", title: "Is delivery legal in Illinois?", blurb: "Not yet. Where the bills stand." },
  { href: "/illinois-hemp-law", title: "The Nov 12 hemp change", blurb: "Delta-8 leaves gas stations and smoke shops." },
  { href: "/deal-index", title: "Deal Index", blurb: "Deals live and average discount by city, daily." },
  { href: "/green-wednesday", title: "Green Wednesday", blurb: "Nov 25, 2026. Every deal on one page." },
];

export function guideBySlug(slug: string): GuideDef {
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) throw new Error(`unknown guide ${slug}`);
  return g;
}

export type LiveDeal = {
  deal_id: string;
  deal_title: string | null;
  category: string | null;
  city: string | null;
  name: string | null;
  slug: string | null;
  listing_slug: string | null;
  discount_value: number | null;
  discount_unit: string | null;
  discount_type: string | null;
  is_recurring: boolean | null;
  recurring_days: string[] | null;
  verified_at: string | null;
  source_url: string | null;
};

/** Every live deal at a Central Illinois store (the view is PuffPrice-only
 *  deals joined to their listing; we still scope by city). */
export async function getLiveDeals(): Promise<LiveDeal[]> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,category,city,name,slug,listing_slug,discount_value,discount_unit,discount_type,is_recurring,recurring_days,verified_at,source_url&order=discount_value.desc.nullslast&limit=500`,
      { headers: H(), next: { revalidate: 3600 } }
    );
    const rows: LiveDeal[] = r.ok ? await r.json() : [];
    return Array.isArray(rows) ? rows.filter((d) => REGION_CITIES.includes(String(d.city || ""))) : [];
  } catch {
    return [];
  }
}

export type Observation = {
  deal_id: string;
  listing_slug: string;
  event: "created" | "seen" | "deactivated";
  observed_day: string;
  title: string | null;
  discount_pct: number | null;
  source_url: string | null;
};

/** The deal log, Central Illinois stores only, from direct store sources
 *  only (legacy aggregator rows are skipped — see docs/deal-data-policy.md). */
export async function getObservations(stores: RegionStore[]): Promise<Observation[]> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/deal_observations?select=deal_id,listing_slug,event,observed_day,title,discount_pct,source_url&project_tag=eq.green&order=observed_day.asc&limit=10000`,
      { headers: H(), next: { revalidate: 3600, tags: ["deal-history"] } }
    );
    const rows: Observation[] = r.ok ? await r.json() : [];
    const slugs = new Set(stores.map((s) => s.slug));
    return (Array.isArray(rows) ? rows : []).filter(
      (o) => slugs.has(o.listing_slug) && !/leafly|weedmaps|iheartjane|dutchie\.com\/dispensar/i.test(o.source_url || "")
    );
  } catch {
    return [];
  }
}

export type MarketDay = { observed_day: string; city: string; deals_live: number; stores_with_deals: number; avg_discount_pct: number | null };

/** Daily per-city rollup since daily logging began. */
export async function getMarketDays(): Promise<MarketDay[]> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_market_stats?select=observed_day,city,deals_live,stores_with_deals,avg_discount_pct&observed_day=gte.${DAILY_LOG_START}&order=observed_day.asc`,
      { headers: H(), next: { revalidate: 3600, tags: ["deal-index"] } }
    );
    const rows: MarketDay[] = r.ok ? await r.json() : [];
    return (Array.isArray(rows) ? rows : []).filter((x) => REGION_CITIES.includes(x.city));
  } catch {
    return [];
  }
}

export { getRegionStores, DAILY_LOG_START };

// ---------- weekday helpers ----------

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const DAY_WORDS: [RegExp, Weekday][] = [
  [/\bmon(day)?\b|munchie\s*mon/i, "Monday"],
  [/\btues?(day)?\b|terp(ene)?\s*tue/i, "Tuesday"],
  [/\bwed(nesday)?\b|wax\s*wed/i, "Wednesday"],
  [/\bthu(rs)?(day)?\b|thirsty\s*thu/i, "Thursday"],
  [/\bfri(day)?\b/i, "Friday"],
  [/\bsat(urday)?\b/i, "Saturday"],
  [/\bsun(day)?\b/i, "Sunday"],
];

/** Weekdays a deal names in its title ("Thirsty Thursday", "Wax Wednesday"). */
export function weekdaysInTitle(title: string | null | undefined): Weekday[] {
  const t = String(title || "");
  // Only count explicit day words; "Green Wednesday" is a one-off holiday.
  if (/green\s*wednesday/i.test(t)) return [];
  const out: Weekday[] = [];
  for (const [re, d] of DAY_WORDS) if (re.test(t) && /day\b/i.test(t)) out.push(d);
  return out;
}

/** "thursday" / "Thu" → "Thursday". */
export function normalizeWeekday(s: string): Weekday | null {
  const k = s.trim().slice(0, 3).toLowerCase();
  return WEEKDAYS.find((d) => d.slice(0, 3).toLowerCase() === k) || null;
}

/** Weekday name of an ISO day (YYYY-MM-DD) — calendar date, no TZ drift. */
export function weekdayOfDay(day: string): Weekday {
  const js = new Date(day + "T12:00:00Z").getUTCDay(); // 0=Sun
  return WEEKDAYS[(js + 6) % 7];
}

export const fmtDay = (d: string) =>
  new Date(d.length === 10 ? d + "T12:00:00Z" : d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: d.length === 10 ? "UTC" : "America/Chicago",
  });

/** Today's date in Central Time, "Sep 25, 2026". */
export function todayCT(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" });
}

/** Today's date in Central Time as YYYY-MM-DD (for dateModified). */
export function todayIsoCT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

// ---------- conditional-discount helpers ----------

export type DiscountKind = "First-time" | "Veterans & military" | "Seniors" | "Medical patients" | "Industry" | "Birthday";

export function discountKind(title: string | null | undefined): DiscountKind | null {
  const t = String(title || "");
  if (/first[- ]?time|new (customer|patient)/i.test(t)) return "First-time";
  if (/veteran|military|\bvet\b/i.test(t)) return "Veterans & military";
  if (/senior|\b6[05]\s*\+/i.test(t)) return "Seniors";
  if (/medical|patient|\bmmj\b|card ?holder/i.test(t)) return "Medical patients";
  if (/industry/i.test(t)) return "Industry";
  if (/birthday/i.test(t)) return "Birthday";
  return null;
}
