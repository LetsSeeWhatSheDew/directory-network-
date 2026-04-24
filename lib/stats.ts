import { getSupabase } from "./supabase";
import { estimateSavings } from "./dealScoring";
import { CENTRAL_IL_CITIES } from "./constants/regions";

type DealRow = {
  discount_value: number | null;
  discount_unit: string | null;
  discount_type: string | null;
  original_price: number | null;
  sale_price: number | null;
  category: string | null;
  is_active: boolean | null;
};

// City names only (Supabase .in() accepts an array). Matches
// lib/constants/regions.ts.
const CENTRAL_IL_CITY_NAMES: string[] = CENTRAL_IL_CITIES.map((c) => c.name);

function monthBounds(d = new Date()): { start: string; end: string; monthName: string } {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  const monthName = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return { start: start.toISOString(), end: end.toISOString(), monthName };
}

// Resolve the set of listing slugs belonging to the 12 Central IL cities.
// Cached per-request — only the active, in-scope dispensaries contribute
// to the homepage live-stats strip.
async function getCentralILListingSlugs(): Promise<Set<string>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("master_listings")
    .select("slug")
    .eq("state", "IL")
    .eq("project_tag", "green")
    .eq("is_active", true)
    .in("city", CENTRAL_IL_CITY_NAMES);
  if (error || !Array.isArray(data)) return new Set<string>();
  return new Set<string>(data.map((r: { slug: string }) => r.slug).filter(Boolean));
}

// Factual only. Sums estimated savings for currently-active deals — no
// fabricated "buyers saved $X" multiplier, no visit counts we don't have.
// Scoped to Central Illinois to match the publicly-visible surface.
export async function getLiveDealsValueThisMonth(): Promise<{
  totalDollars: number;
  dealCount: number;
  monthName: string;
} | null> {
  const supabase = getSupabase();
  const { monthName } = monthBounds();
  const slugs = await getCentralILListingSlugs();
  if (slugs.size === 0) {
    return { totalDollars: 0, dealCount: 0, monthName };
  }
  const { data, error } = await supabase
    .from("deals")
    .select("listing_slug,discount_value,discount_unit,discount_type,original_price,sale_price,category,is_active")
    .eq("is_active", true)
    .eq("project_tag", "green")
    .in("listing_slug", Array.from(slugs));
  if (error || !data) return null;
  const rows = data as (DealRow & { listing_slug: string })[];
  const sum = rows.reduce((acc, r) => {
    const s = estimateSavings(r);
    return acc + (typeof s === "number" && s > 0 ? s : 0);
  }, 0);
  return {
    totalDollars: Math.round(sum),
    dealCount: rows.length,
    monthName,
  };
}

// Count of Central IL deals created in the current month (month-to-date).
export async function getDealsRunThisMonth(): Promise<{
  count: number;
  monthName: string;
} | null> {
  const supabase = getSupabase();
  const { start, end, monthName } = monthBounds();
  const slugs = await getCentralILListingSlugs();
  if (slugs.size === 0) {
    return { count: 0, monthName };
  }
  const { count, error } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("project_tag", "green")
    .in("listing_slug", Array.from(slugs))
    .gte("created_at", start)
    .lt("created_at", end);
  if (error) return null;
  return { count: count ?? 0, monthName };
}
