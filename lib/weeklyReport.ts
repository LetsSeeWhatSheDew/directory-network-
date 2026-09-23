// lib/weeklyReport.ts
// "This week in Central Illinois deals" — built only from what the daily
// scraper actually observed (deal_observations) over the last 7 days.
// Used by /this-week and the weekly email. No estimates, no fill-ins:
// if a number isn't in the log, it isn't in the report.

import { DAILY_LOG_START } from "./dealHistory";
import { inferCategory } from "./inferCategory";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export const REPORT_CITIES = [
  "Peoria", "East Peoria", "Peoria Heights", "Pekin",
  "Bloomington", "Normal", "Champaign", "Urbana", "Springfield",
];

type Obs = {
  deal_id: string | null;
  listing_slug: string | null;
  event: "created" | "seen" | "changed" | "deactivated";
  observed_at: string;
  observed_day: string;
  title: string | null;
  category: string | null;
  discount_pct: number | null;
};
type Listing = { slug: string; name: string | null; city: string | null; logo_url: string | null };

export type ReportDeal = {
  dealId: string;
  slug: string;
  store: string;
  city: string;
  logoUrl: string | null;
  title: string;
  category: string | null;
  pct: number | null;
  firstSeen: string;
  lastSeen: string;
  stillLive: boolean;
  daysSeen: number;
  alsoAt: string[]; // other cities running the same deal (same chain + title)
};

export type WeeklyReport = {
  from: string; // YYYY-MM-DD (inclusive)
  to: string;   // YYYY-MM-DD (inclusive)
  daysTracked: number;
  dealsSeen: number;
  storesWithDeals: number;
  newDeals: ReportDeal[];
  newCount: number;
  endedCount: number;
  biggest: ReportDeal[];
  byCity: { city: string; deals: number; stores: number; topPct: number | null }[];
  byCategory: { category: string; deals: number }[];
};

function headers() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return { apikey: key, Authorization: `Bearer ${key}` };
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export async function getWeeklyReport(now = new Date()): Promise<WeeklyReport | null> {
  const toD = new Date(now);
  const fromD = new Date(now.getTime() - 6 * 86400000);
  const from = ymd(fromD);
  const to = ymd(toD);
  try {
    const [obsRes, listRes, dealRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/deal_observations?select=deal_id,listing_slug,event,observed_at,observed_day,title,category,discount_pct&project_tag=eq.green&observed_day=gte.${from}&order=observed_at.asc&limit=5000`,
        { headers: headers(), next: { revalidate: 3600, tags: ["weekly-report"] } }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/master_listings?select=slug,name,city,logo_url&project_tag=eq.green&state=eq.IL&is_active=eq.true&limit=500`,
        { headers: headers(), next: { revalidate: 3600 } }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/deals?select=id,is_active,created_at,updated_at&project_tag=eq.green&updated_at=gte.${from}&limit=5000`,
        { headers: headers(), next: { revalidate: 3600, tags: ["weekly-report"] } }
      ),
    ]);
    if (!obsRes.ok || !listRes.ok) return null;
    // Current truth for live/ended comes from the deals table, not the log
    // (deactivations before the log started have no 'deactivated' event).
    const dealRows: Array<{ id: string; is_active: boolean; created_at: string; updated_at: string }> =
      dealRes.ok ? await dealRes.json() : [];
    const D = new Map(dealRows.map((d) => [d.id, d]));
    const obs: Obs[] = await obsRes.json();
    const listings: Listing[] = await listRes.json();
    const L = new Map(listings.map((l) => [l.slug, l]));
    const inRegion = (slug: string | null) => {
      const c = slug ? L.get(slug)?.city : null;
      return !!c && REPORT_CITIES.includes(c);
    };

    const deals = new Map<string, ReportDeal>();
    const created = new Set<string>();
    const ended = new Set<string>();
    const seenDays = new Set<string>();
    for (const o of obs) {
      if (!o.deal_id || !inRegion(o.listing_slug)) continue;
      if (o.event === "seen" && o.observed_day >= DAILY_LOG_START) seenDays.add(o.observed_day);
      const l = L.get(o.listing_slug as string)!;
      const cur = deals.get(o.deal_id);
      const pct = o.discount_pct != null ? Math.round(Number(o.discount_pct)) : null;
      if (!cur) {
        deals.set(o.deal_id, {
          dealId: o.deal_id,
          slug: l.slug,
          store: l.name || l.slug,
          city: l.city as string,
          logoUrl: l.logo_url,
          title: o.title || "Deal",
          category: o.category,
          pct,
          firstSeen: o.observed_day,
          lastSeen: o.observed_day,
          stillLive: o.event !== "deactivated",
          daysSeen: 1,
          alsoAt: [],
        });
      } else {
        if (o.observed_day !== cur.lastSeen) cur.daysSeen++;
        cur.lastSeen = o.observed_day;
        if (o.title) cur.title = o.title;
        if (o.category) cur.category = o.category;
        if (pct != null) cur.pct = Math.max(cur.pct ?? 0, pct);
        cur.stillLive = o.event !== "deactivated";
      }
      if (o.event === "created") created.add(o.deal_id);
      if (o.event === "deactivated") ended.add(o.deal_id);
    }

    // A deal pulled the same day it appeared was almost always a bad read
    // we corrected — leave it out of the report rather than call it "ended".
    for (const d of deals.values()) {
      const row = D.get(d.dealId);
      if (row) d.stillLive = !!row.is_active;
    }
    const livedADay = (d: ReportDeal) => {
      const row = D.get(d.dealId);
      if (!row) return d.daysSeen >= 2;
      return new Date(row.updated_at).getTime() - new Date(row.created_at).getTime() >= 20 * 3600 * 1000;
    };
    const all = [...deals.values()].filter((d) => d.stillLive || livedADay(d));
    for (const d of all) if (!d.stillLive) ended.add(d.dealId);
    for (const d of all) if (!d.category) d.category = inferCategory(d.title) || null;
    const counted = new Set(all.map((d) => d.dealId));
    for (const id of [...created]) if (!counted.has(id)) created.delete(id);
    for (const id of [...ended]) if (!counted.has(id)) ended.delete(id);
    const byPct = (a: ReportDeal, b: ReportDeal) => (b.pct ?? -1) - (a.pct ?? -1);
    // One row per store+title so four identical nuEra locations don't
    // crowd the list; keep the city list on the store name instead.
    const chain = (d: ReportDeal) =>
      d.store.toLowerCase().replace(new RegExp(`\\s*(${REPORT_CITIES.join("|")})\\s*$`, "i"), "").replace(/[^a-z0-9]/g, "");
    const dedupe = (arr: ReportDeal[]) => {
      const first = new Map<string, ReportDeal>();
      const out: ReportDeal[] = [];
      for (const d of arr) {
        const k = `${chain(d)}|${d.title.toLowerCase()}`;
        const f = first.get(k);
        if (f) {
          if (d.city !== f.city && !f.alsoAt.includes(d.city)) f.alsoAt.push(d.city);
          continue;
        }
        const copy = { ...d, alsoAt: [] as string[] };
        first.set(k, copy);
        out.push(copy);
      }
      return out;
    };

    const cityAgg = new Map<string, { deals: number; stores: Set<string>; topPct: number | null }>();
    const catAgg = new Map<string, number>();
    for (const d of all) {
      const c = cityAgg.get(d.city) || { deals: 0, stores: new Set<string>(), topPct: null };
      c.deals++;
      c.stores.add(d.slug);
      if (d.pct != null) c.topPct = Math.max(c.topPct ?? 0, d.pct);
      cityAgg.set(d.city, c);
      const cat = d.category || "other";
      catAgg.set(cat, (catAgg.get(cat) || 0) + 1);
    }

    return {
      from,
      to,
      daysTracked: seenDays.size,
      dealsSeen: all.length,
      storesWithDeals: new Set(all.map((d) => d.slug)).size,
      newCount: created.size,
      newDeals: dedupe(all.filter((d) => d.stillLive && created.has(d.dealId)).sort(byPct)).slice(0, 8),
      endedCount: ended.size,
      biggest: dedupe(all.filter((d) => d.stillLive && d.pct != null).sort(byPct)).slice(0, 8),
      byCity: [...cityAgg.entries()]
        .map(([city, v]) => ({ city, deals: v.deals, stores: v.stores.size, topPct: v.topPct }))
        .sort((a, b) => b.deals - a.deals),
      byCategory: [...catAgg.entries()]
        .map(([category, deals]) => ({ category, deals }))
        .sort((a, b) => b.deals - a.deals),
    };
  } catch {
    return null;
  }
}

export function reportRangeLabel(r: { from: string; to: string }): string {
  const f = new Date(r.from + "T12:00:00Z");
  const t = new Date(r.to + "T12:00:00Z");
  const m = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${m(f)} – ${m(t)}, ${t.getUTCFullYear()}`;
}
