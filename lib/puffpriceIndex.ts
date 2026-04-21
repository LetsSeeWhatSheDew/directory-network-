import { getSupabase } from "./supabase";

export type WeeklyIndexResult =
  | {
      available: true;
      puffprice_index_per_gram: number;
      sample_size: number;
      week_of: string;
    }
  | {
      available: false;
      reason: "insufficient_data" | "query_error";
      sample_size: number;
      week_of: string;
    };

const MIN_SAMPLE = 10;

function weekStart(d = new Date()): string {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
  return monday.toISOString().slice(0, 10);
}

export async function computeWeeklyIndex(): Promise<WeeklyIndexResult> {
  const week_of = weekStart();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("deals")
    .select("price_per_gram,unit,category,is_active")
    .eq("is_active", true)
    .eq("category", "flower")
    .not("price_per_gram", "is", null);

  if (error || !data) {
    return { available: false, reason: "query_error", sample_size: 0, week_of };
  }

  const rows = data.filter(
    (r: { price_per_gram: number | null }) =>
      typeof r.price_per_gram === "number" && r.price_per_gram > 0 && r.price_per_gram < 100
  );

  if (rows.length < MIN_SAMPLE) {
    return { available: false, reason: "insufficient_data", sample_size: rows.length, week_of };
  }

  const sum = rows.reduce((acc, r) => acc + (r.price_per_gram as number), 0);
  const avg = sum / rows.length;

  return {
    available: true,
    puffprice_index_per_gram: Math.round(avg * 100) / 100,
    sample_size: rows.length,
    week_of,
  };
}
