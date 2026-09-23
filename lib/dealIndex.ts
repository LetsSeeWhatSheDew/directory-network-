// lib/dealIndex.ts — Central Illinois Deal Index, from the daily deal log.
// Only days since DAILY_LOG_START count: before that the log was backfilled
// from deal create dates, not seen day by day.
import { DAILY_LOG_START } from "./dealHistory";
import { REGION_CITIES } from "./waysToBuy";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export type DayCity = { observed_day: string; city: string; deals_live: number; stores_with_deals: number; avg_discount_pct: number | null };
export type IndexDay = { day: string; deals: number; stores: number; avgPct: number | null };

export async function getDealIndex(): Promise<{ days: IndexDay[]; latest: DayCity[]; latestDay: string | null }> {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_market_stats?select=observed_day,city,deals_live,stores_with_deals,avg_discount_pct&observed_day=gte.${DAILY_LOG_START}&order=observed_day.asc`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600, tags: ["deal-index"] } }
    );
    const rows: DayCity[] = r.ok ? await r.json() : [];
    const inRegion = rows.filter((x) => REGION_CITIES.includes(x.city));
    const byDay = new Map<string, DayCity[]>();
    for (const x of inRegion) byDay.set(x.observed_day, [...(byDay.get(x.observed_day) || []), x]);
    const days: IndexDay[] = [...byDay.entries()].map(([day, xs]) => {
      const deals = xs.reduce((a, b) => a + b.deals_live, 0);
      const weighted = xs.filter((x) => x.avg_discount_pct != null);
      const w = weighted.reduce((a, b) => a + b.deals_live, 0);
      return {
        day,
        deals,
        stores: xs.reduce((a, b) => a + b.stores_with_deals, 0),
        avgPct: w ? Math.round(weighted.reduce((a, b) => a + (b.avg_discount_pct as number) * b.deals_live, 0) / w) : null,
      };
    });
    const latestDay = days.length ? days[days.length - 1].day : null;
    const latest = latestDay ? (byDay.get(latestDay) || []).sort((a, b) => b.deals_live - a.deals_live) : [];
    return { days, latest, latestDay };
  } catch {
    return { days: [], latest: [], latestDay: null };
  }
}
