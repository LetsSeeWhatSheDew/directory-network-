// lib/dealHistory.ts
// Read side of the deal history log (public.deal_observations, filled by a
// DB trigger on every scrape). Fail-soft: until the migration is applied —
// or while there isn't enough history yet — callers get null and render
// nothing. Numbers are only ever computed from logged observations.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";
const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

export type ListingDealHistory = {
  listing_slug: string;
  deal_days_30d: number;
  deals_seen_90d: number;
  typical_discount_pct: number | null;
  best_discount_pct: number | null;
  last_seen_day: string | null;
  first_seen_day: string | null;
};

/** Minimum history before we say anything about "typical" or "best". */
export const MIN_HISTORY_DAYS = 7;

export function historyIsMeaningful(h: ListingDealHistory | null): h is ListingDealHistory {
  if (!h || !h.first_seen_day) return false;
  const spanDays = (Date.now() - new Date(h.first_seen_day + "T12:00:00Z").getTime()) / 86_400_000;
  return spanDays >= MIN_HISTORY_DAYS && h.deals_seen_90d >= 2;
}

export async function getListingDealHistory(slug: string): Promise<ListingDealHistory | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listing_deal_history?listing_slug=eq.${encodeURIComponent(slug)}&select=*`,
      { headers: HEADERS, next: { revalidate: 1800, tags: ["deal-history"] } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const r = Array.isArray(rows) ? rows[0] : null;
    if (!r) return null;
    return {
      ...r,
      deal_days_30d: Number(r.deal_days_30d) || 0,
      deals_seen_90d: Number(r.deals_seen_90d) || 0,
      typical_discount_pct: r.typical_discount_pct == null ? null : Number(r.typical_discount_pct),
      best_discount_pct: r.best_discount_pct == null ? null : Number(r.best_discount_pct),
    };
  } catch {
    return null;
  }
}

export type CityMonth = { daysWithDeals: number; avgDiscountPct: number | null; trackedDays: number };

/** Last-30-day rollup for one city from daily_market_stats. */
export async function getCityMonth(city: string): Promise<CityMonth | null> {
  try {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_market_stats?city=eq.${encodeURIComponent(city)}&observed_day=gte.${since}&select=observed_day,deals_live,avg_discount_pct`,
      { headers: HEADERS, next: { revalidate: 1800, tags: ["deal-history"] } }
    );
    if (!res.ok) return null;
    const rows: Array<{ observed_day: string; deals_live: number; avg_discount_pct: number | null }> =
      await res.json();
    if (!Array.isArray(rows)) return null;
    const withDeals = rows.filter((r) => Number(r.deals_live) > 0);
    const pcts = withDeals.map((r) => r.avg_discount_pct).filter((x): x is number => x != null);
    return {
      daysWithDeals: withDeals.length,
      avgDiscountPct: pcts.length ? Math.round(pcts.reduce((a, b) => a + Number(b), 0) / pcts.length) : null,
      trackedDays: rows.length,
    };
  } catch {
    return null;
  }
}
