// lib/traffic.ts — server-side reads of first-party analytics (`events`).
// Count queries via supabase-js (head:true, count:'exact'); no SQL/RPC.
// Returns null when the service key is missing or a query fails, so pages
// can show an honest "not counted yet" line instead of a made-up zero.
import { analyticsReader, analyticsWriter, COUNTING_SINCE } from "./analyticsDb";

export type StoreTraffic = {
  sinceIso: string;
  views: number;
  uniqueVisitors: number;
  dealViews: number;
  directions: number;
  calls: number;
  websiteOrOrder: number;
  qrScans: number;
};

function windowStart(days: number): string {
  const since = new Date(Date.now() - days * 86400000);
  const floor = new Date(`${COUNTING_SINCE}T00:00:00-05:00`);
  return (since > floor ? since : floor).toISOString();
}

export async function getStoreTraffic(slug: string, days = 30): Promise<StoreTraffic | null> {
  const db = analyticsReader(3600);
  if (!db) return null;
  const sinceIso = windowStart(days);
  try {
    const count = async (types: string[]) => {
      const { count, error } = await db
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("project_tag", "green")
        .eq("listing_id", slug)
        .in("event_type", types)
        .gte("created_at", sinceIso);
      if (error) throw error;
      return count ?? 0;
    };
    const [views, dealViews, directions, calls, websiteOrOrder, qrScans, vidRows] = await Promise.all([
      count(["store_view"]),
      count(["deal_view"]),
      count(["directions_tap"]),
      count(["call_tap"]),
      count(["website_tap", "order_tap"]),
      count(["qr_scan"]),
      db
        .from("events")
        .select("vid:metadata->>vid")
        .eq("project_tag", "green")
        .eq("listing_id", slug)
        .in("event_type", ["store_view", "deal_view"])
        .gte("created_at", sinceIso)
        .limit(10000),
    ]);
    if (vidRows.error) throw vidRows.error;
    const vids = new Set<string>();
    for (const r of (vidRows.data || []) as Array<{ vid: string | null }>) if (r.vid) vids.add(r.vid);
    return { sinceIso, views, uniqueVisitors: vids.size, dealViews, directions, calls, websiteOrOrder, qrScans };
  } catch (err) {
    console.error("[traffic] store read failed:", err);
    return null;
  }
}

export type EventRow = {
  event_type: string;
  listing_id: string | null;
  created_at: string;
  metadata: Record<string, string | null> | null;
};

/** All green events in the window, paged (PostgREST caps a page at 1000). */
export async function getRecentEvents(days = 30, maxRows = 50000): Promise<{ rows: EventRow[]; truncated: boolean } | null> {
  const db = analyticsWriter();
  if (!db) return null;
  const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
  const rows: EventRow[] = [];
  const page = 1000;
  try {
    for (let from = 0; from < maxRows; from += page) {
      const { data, error } = await db
        .from("events")
        .select("event_type,listing_id,created_at,metadata")
        .eq("project_tag", "green")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .range(from, from + page - 1);
      if (error) throw error;
      const batch = (data || []) as EventRow[];
      rows.push(...batch);
      if (batch.length < page) return { rows, truncated: false };
    }
    return { rows, truncated: true };
  } catch (err) {
    console.error("[traffic] events read failed:", err);
    return null;
  }
}
