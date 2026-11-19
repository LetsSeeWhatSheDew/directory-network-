// lib/confirmRetry.ts (server-only): keep a signup when its confirm email
// can't go out, and send that confirm later.
//
// Nov 19, 2026: every confirm email failed (Resend 403, domain not verified)
// and each signup ended in an error, so 0 people ever subscribed. Now a
// signup whose confirm fails is kept (still inactive: double opt-in holds)
// and tagged 'confirm:unsent' inside categories. Once a day the deal-alerts
// cron calls resendUnsentConfirms(): each tagged row from the last 14 days
// gets its confirm email, and the tag comes off when Resend accepts it.
// Nothing is ever sent to an address except that one confirm.
import "server-only";
import { Resend } from "resend";
import { brand } from "./brand";
import { weeklyConfirmUrl } from "./alertSubscribers";
import { renderWeeklyConfirmEmail } from "./weeklyConfirm";
import { renderConfirmEmail, alertsFrom } from "./dealAlertEmail";
import { WATCH_TYPES, confirmUrl } from "./dealWatch";
import { SALE_EVENTS } from "./events";

export const UNSENT_TAG = "confirm:unsent";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

function svc(): Record<string, string> | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return key ? { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } : null;
}

type Row = { id: string; email: string; city: string | null; categories: string[] | null; alert_type: string | null };

async function getRow(id: string): Promise<Row | null> {
  const H = svc();
  if (!H) return null;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?select=id,email,city,categories,alert_type&id=eq.${encodeURIComponent(id)}&limit=1`, {
    headers: H, cache: "no-store", signal: AbortSignal.timeout(15000),
  }).catch(() => null);
  return r && r.ok ? (((await r.json()) as Row[])[0] ?? null) : null;
}

async function setCategories(id: string, categories: string[]): Promise<boolean> {
  const H = svc();
  if (!H) return false;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ categories }), signal: AbortSignal.timeout(15000),
  }).catch(() => null);
  return !!r && r.ok;
}

/** Tag a saved-but-unconfirmed row so the daily retry sends its confirm. */
export async function markConfirmUnsent(id: string): Promise<boolean> {
  const row = await getRow(id);
  if (!row) return false;
  const cats = row.categories || [];
  if (cats.includes(UNSENT_TAG)) return true;
  return setCategories(id, [...cats, UNSENT_TAG]);
}

/** The confirm email for a row, weekly report or watch. Exported for tests. */
export function confirmEmailFor(row: Row): { subject: string; html: string; text: string } {
  const type = row.alert_type || "weekly";
  if (!(WATCH_TYPES as readonly string[]).includes(type)) return renderWeeklyConfirmEmail(weeklyConfirmUrl(brand.url, row.id));
  const url = confirmUrl(brand.url, row.id);
  const city = row.city ? ` near ${row.city.replace(/\b\w/g, (c) => c.toUpperCase())}` : " in Central Illinois";
  if (type === "event_watch") {
    const tag = (row.categories || []).find((c) => c.startsWith("event:"))?.slice(6);
    const ev = SALE_EVENTS.find((e) => e.id === tag);
    const name = ev?.name || "the sale day";
    return renderConfirmEmail({ what: `for ${name}`, ask: `email me ${name} deals`, after: `one email the morning of ${name} with the best deals we find${city}.`, confirmUrl: url });
  }
  if (type === "law_watch") {
    return renderConfirmEmail({ what: "in Illinois", ask: "email me when the law changes", after: "a short email when an Illinois law changes what you can buy, where, or how. A few times a year.", confirmUrl: url });
  }
  if (type === "price_watch") return renderConfirmEmail({ what: "on the item you picked", ask: "email me when the price drops", confirmUrl: url });
  return renderConfirmEmail({ what: city.trim(), confirmUrl: url });
}

export type RetryStats = { ok: boolean; pending: number; sent: number; failed: number; code?: string };

/**
 * Send the confirm for every tagged row from the last 14 days. Stops at the
 * first failure (if the mail setup is still broken, every send would fail the
 * same way; no point hammering Resend). dry = count only.
 */
export async function resendUnsentConfirms(opts: { dry: boolean }): Promise<RetryStats> {
  const H = svc();
  if (!H) return { ok: false, pending: 0, sent: 0, failed: 0, code: "no_service_key" };
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_alerts?select=id,email,city,categories,alert_type&is_active=eq.false&categories=cs.${encodeURIComponent(`{"${UNSENT_TAG}"}`)}&created_at=gte.${since}&order=created_at.asc&limit=200`,
    { headers: H, cache: "no-store", signal: AbortSignal.timeout(15000) }
  ).catch(() => null);
  if (!r || !r.ok) return { ok: false, pending: 0, sent: 0, failed: 0, code: "db_read" };
  const rows = (await r.json()) as Row[];
  if (opts.dry || rows.length === 0) return { ok: true, pending: rows.length, sent: 0, failed: 0 };
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, pending: rows.length, sent: 0, failed: 0, code: "no_resend_key" };
  const resend = new Resend(key);
  let sent = 0;
  for (const row of rows) {
    const m = confirmEmailFor(row);
    const res = await resend.emails
      .send({ from: alertsFrom(), to: row.email, replyTo: brand.supportEmail, subject: m.subject, html: m.html, text: m.text })
      .catch((e: unknown) => ({ error: { name: String(e).slice(0, 40), statusCode: 0 } }));
    const err = (res as { error?: { name?: string; statusCode?: number } | null }).error;
    if (err) return { ok: false, pending: rows.length, sent, failed: 1, code: `resend_${err.statusCode ?? "?"}_${String(err.name || "error").replace(/[^a-z_]/gi, "").slice(0, 40)}` };
    await setCategories(row.id, (row.categories || []).filter((c) => c !== UNSENT_TAG));
    sent++;
    await new Promise((ok) => setTimeout(ok, 600)); // stay under Resend's per-second limit
  }
  return { ok: true, pending: rows.length, sent, failed: 0 };
}
