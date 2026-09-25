// lib/alertSubscribers.ts (server-only)
// One row per email in deal_alerts. deal_alerts has no unique constraint on
// email, so upsert = look up (case-insensitive) then PATCH or POST, using
// the service key (anon can insert but not read or update).
import { createHmac } from "crypto";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

// Watch rows (lib/dealWatch.ts) share this table but are their own
// subscriptions; the weekly-report row must never match or merge with them.
const NOT_WATCH = `or=${encodeURIComponent("(alert_type.is.null,alert_type.not.in.(city_watch,store_watch))")}`;

function svc() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) return null;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export type AlertRow = {
  email: string;
  city?: string | null;
  categories?: string[];
  alert_type?: "weekly" | "daily" | "instant";
  phone?: string | null;
  is_active?: boolean;
};

export async function upsertAlert(row: AlertRow): Promise<boolean> {
  const H = svc();
  const email = row.email.trim().toLowerCase();
  const body = { ...row, email, is_active: row.is_active ?? true };
  if (!H) {
    // Fallback: anon insert (duplicates possible, but never lose a signup).
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts`, {
      method: "POST",
      headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });
    return r.ok;
  }
  const found = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_alerts?select=id&email=ilike.${encodeURIComponent(email)}&${NOT_WATCH}&limit=1`,
    { headers: H, cache: "no-store" }
  );
  const rows: Array<{ id: string }> = found.ok ? await found.json() : [];
  const r = rows[0]
    ? await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${rows[0].id}`, {
        method: "PATCH",
        headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify(body),
      })
    : await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts`, {
        method: "POST",
        headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify(body),
      });
  return r.ok;
}

export async function listWeeklySubscribers(): Promise<Array<{ email: string; city: string | null }>> {
  const H = svc();
  if (!H) return [];
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_alerts?select=email,city&is_active=eq.true&${NOT_WATCH}&limit=5000`,
    { headers: H, cache: "no-store" }
  );
  if (!r.ok) return [];
  const rows: Array<{ email: string; city: string | null }> = await r.json();
  const seen = new Set<string>();
  return rows.filter((x) => {
    const e = (x.email || "").toLowerCase();
    if (!e.includes("@") || seen.has(e)) return false;
    seen.add(e);
    return true;
  });
}

export async function deactivateAlert(email: string): Promise<boolean> {
  const H = svc();
  if (!H) return false;
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_alerts?email=ilike.${encodeURIComponent(email.trim().toLowerCase())}`,
    { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ is_active: false }) }
  );
  return r.ok;
}

function secret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
}
export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret()).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}
export function unsubscribeUrl(base: string, email: string): string {
  const e = email.trim().toLowerCase();
  return `${base}/api/alerts/unsubscribe?e=${encodeURIComponent(e)}&t=${unsubscribeToken(e)}`;
}
