// lib/confirmations.ts (server-only)
// "✓ 3 people confirmed this today" — counts Yes taps from the deal
// feedback widget (deal_reports.reason = 'confirmed') in the last 24h.
// deal_reports is insert-only for anon, so this reads with the service key
// on the server. Fail-soft: returns an empty map on any error.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function getConfirmationsToday(dealIds: string[]): Promise<Record<string, number>> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const ids = dealIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!key || ids.length === 0) return {};
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deal_reports?select=deal_id&project_tag=eq.green&reason=eq.confirmed&created_at=gte.${since}&deal_id=in.(${ids.join(",")})`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300, tags: ["feedback"] } }
    );
    if (!res.ok) return {};
    const rows: Array<{ deal_id: string }> = await res.json();
    const out: Record<string, number> = {};
    for (const r of rows) out[r.deal_id] = (out[r.deal_id] || 0) + 1;
    return out;
  } catch {
    return {};
  }
}
