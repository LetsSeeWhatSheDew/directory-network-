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
      reason: "sample_too_small" | "query_error";
      sample_size: number;
      week_of: string;
    };

export const PUFFPRICE_INDEX_MIN_SAMPLE = 10;

function weekStart(d = new Date()): string {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
  return monday.toISOString().slice(0, 10);
}

export async function computeWeeklyIndex(): Promise<WeeklyIndexResult> {
  const week_of = weekStart();
  const supabase = getSupabase();
  // deals table is shared across multiple projects; scope to green
  // before any aggregation so the Index can't pull in non-PuffPrice rows.
  const { data, error } = await supabase
    .from("deals")
    .select("price_per_gram,unit,category,is_active")
    .eq("is_active", true)
    .eq("project_tag", "green")
    .eq("category", "flower")
    .not("price_per_gram", "is", null);

  if (error || !data) {
    return { available: false, reason: "query_error", sample_size: 0, week_of };
  }

  const rows = data.filter(
    (r: { price_per_gram: number | null }) =>
      typeof r.price_per_gram === "number" && r.price_per_gram > 0 && r.price_per_gram < 100
  );

  if (rows.length < PUFFPRICE_INDEX_MIN_SAMPLE) {
    return { available: false, reason: "sample_too_small", sample_size: rows.length, week_of };
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

// Server-component convenience. Mirrors the get* naming the rest of the
// codebase uses (getListing, getHours, getRelated). Safe to await inside
// any Server Component or Route Handler. Catches to keep the page
// render-robust when the deals table is momentarily unreachable.
export async function getWeeklyIndex(): Promise<WeeklyIndexResult> {
  try {
    return await computeWeeklyIndex();
  } catch {
    return {
      available: false,
      reason: "query_error",
      sample_size: 0,
      week_of: weekStart(),
    };
  }
}

/**
 * Copy helpers — drop-in strings for the eventual Index consumer. Keeps
 * the empty-state language consistent across homepage, /about/index, and
 * any future widget. All return plain text (no JSX) so they can live
 * anywhere.
 */
export function indexHeadlineCopy(r: WeeklyIndexResult): string {
  if (r.available) {
    return `$${r.puffprice_index_per_gram.toFixed(2)} / gram`;
  }
  return "Index baseline pending";
}

export function indexSupportCopy(r: WeeklyIndexResult): string {
  if (r.available) {
    const n = r.sample_size;
    return `Weekly PuffPrice Index across ${n} active Illinois flower deal${n === 1 ? "" : "s"}.`;
  }
  if (r.reason === "query_error") {
    return "Index unavailable — check back shortly.";
  }
  // sample_too_small — show progress rather than silence.
  const n = r.sample_size;
  const need = PUFFPRICE_INDEX_MIN_SAMPLE;
  return `Building: ${n} of ${need} flower price points tracked. Index publishes when we cross ${need}.`;
}
