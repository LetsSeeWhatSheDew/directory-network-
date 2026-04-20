import { getSupabase } from "./supabase";
import { estimateSavings } from "./dealScoring";

type DealRow = {
  discount_value: number | null;
  discount_unit: string | null;
  discount_type: string | null;
  original_price: number | null;
  sale_price: number | null;
  category: string | null;
  is_active: boolean | null;
};

function monthBounds(d = new Date()): { start: string; end: string; monthName: string } {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  const monthName = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return { start: start.toISOString(), end: end.toISOString(), monthName };
}

// Factual only. Sums estimated savings for currently-active deals — no
// fabricated "buyers saved $X" multiplier, no visit counts we don't have.
export async function getLiveDealsValueThisMonth(): Promise<{
  totalDollars: number;
  dealCount: number;
  monthName: string;
} | null> {
  const supabase = getSupabase();
  const { monthName } = monthBounds();
  const { data, error } = await supabase
    .from("deals")
    .select("discount_value,discount_unit,discount_type,original_price,sale_price,category,is_active")
    .eq("is_active", true)
    .eq("project_tag", "green");
  if (error || !data) return null;
  const rows = data as DealRow[];
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

// Count of deals created in the current month (month-to-date).
export async function getDealsRunThisMonth(): Promise<{
  count: number;
  monthName: string;
} | null> {
  const supabase = getSupabase();
  const { start, end, monthName } = monthBounds();
  const { count, error } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("project_tag", "green")
    .gte("created_at", start)
    .lt("created_at", end);
  if (error) return null;
  return { count: count ?? 0, monthName };
}
