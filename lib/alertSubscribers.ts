// lib/alertSubscribers.ts (server-only)
// One row per email in deal_alerts. deal_alerts has no unique constraint on
// email, so upsert = look up (case-insensitive) then PATCH or POST, using
// the service key (anon can insert but not read or update).
import { createHmac } from "crypto";
import { WATCH_TYPES } from "./dealWatch";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

// Watch rows (lib/dealWatch.ts: city, store, price and event watches) share
// this table but are their own subscriptions; the weekly-report row must
// never match or merge with them.
const NOT_WATCH = `or=${encodeURIComponent(`(alert_type.is.null,alert_type.not.in.(${WATCH_TYPES.join(",")}))`)}`;

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

type StoredAlert = {
  id: string;
  email: string;
  city: string | null;
  categories: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
};

// ---------- weekly report: double opt-in ----------
// A weekly-report row (non-watch alert_type) starts inactive and turns on
// only when the address clicks the confirm link, which adds an
// 'ok:<hmac(id, email)>' tag to categories (same pattern as lib/dealWatch).
// A row inserted straight through the anon key can't forge that tag.
//
// Rows that were already active before double opt-in shipped carry no
// 'ok:' tag at all; they came from the old single-opt-in form and are
// grandfathered (cutting them off would drop real subscribers). New code
// never creates an active row without the tag: subscribeWeekly() only keeps
// an existing row's active state, and confirmWeekly() adds the tag. Once
// sql/migrations/2026-09-27-security-hardening.sql removes the anon INSERT
// on deal_alerts, nothing else can create an active row either.
const isMetaTag = (c: string) => c.startsWith("ok:") || c.startsWith("sent:");

export function weeklyConfirmTag(id: string, email: string): string | null {
  const s = secret();
  if (!s) return null;
  return `ok:${createHmac("sha256", s).update(`weekly-confirmed:${id}:${email.trim().toLowerCase()}`).digest("hex").slice(0, 24)}`;
}

export function isWeeklyConfirmed(r: Pick<StoredAlert, "id" | "email" | "categories">): boolean {
  const tags = (r.categories || []).filter((c) => c.startsWith("ok:"));
  if (tags.length === 0) return true; // legacy single-opt-in row (see above)
  const want = weeklyConfirmTag(r.id, r.email);
  return !!want && tags.includes(want);
}

/** Confirm-link token for a weekly row, bound to the row id and an expiry. */
export function weeklyConfirmToken(id: string, exp: number): string {
  const s = secret();
  return s ? createHmac("sha256", s).update(`weekly-confirm:${id}:${exp}`).digest("hex").slice(0, 32) : "";
}
export function weeklyConfirmUrl(base: string, id: string): string {
  const exp = Math.floor(Date.now() / 1000) + 7 * 86400;
  return `${base}/api/alerts/subscribe-confirm?id=${encodeURIComponent(id)}&x=${exp}&t=${weeklyConfirmToken(id, exp)}`;
}

const ALERT_COLS = "id,email,city,categories,is_active,created_at";

export type SubscribeResult =
  | { ok: true; status: "active" }
  | { ok: true; status: "pending"; id: string }
  | { ok: false; reason: "unavailable" | "db" };

/**
 * Save weekly-report preferences for an email. A confirmed, active
 * subscriber just gets the new preferences. Anyone else (new address, or one
 * that unsubscribed) gets an inactive row and must confirm by email — so a
 * stranger can neither sign someone up nor switch an unsubscribe back on.
 */
export async function subscribeWeekly(row: AlertRow): Promise<SubscribeResult> {
  const H = svc();
  if (!H || !secret()) return { ok: false, reason: "unavailable" };
  const email = row.email.trim().toLowerCase();
  const found = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_alerts?select=${ALERT_COLS}&email=ilike.${encodeURIComponent(email)}&${NOT_WATCH}&order=created_at.asc&limit=1`,
    { headers: H, cache: "no-store" }
  ).catch(() => null);
  if (!found || !found.ok) return { ok: false, reason: "db" };
  const existing = ((await found.json()) as StoredAlert[])[0];
  const prefs = (row.categories && row.categories.length ? row.categories : ["all"]).filter((c) => !isMetaTag(c));

  if (existing) {
    const active = !!existing.is_active && isWeeklyConfirmed(existing);
    const meta = (existing.categories || []).filter(isMetaTag);
    const body: Record<string, unknown> = { categories: [...prefs, ...meta], city: row.city ?? existing.city, is_active: active };
    if (row.alert_type) body.alert_type = row.alert_type;
    if (row.phone) body.phone = row.phone;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${existing.id}`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!r || !r.ok) return { ok: false, reason: "db" };
    return active ? { ok: true, status: "active" } : { ok: true, status: "pending", id: existing.id };
  }

  const insert: Record<string, unknown> = { email, city: row.city ?? null, categories: prefs, alert_type: row.alert_type ?? "weekly", is_active: false };
  if (row.phone) insert.phone = row.phone;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts`, {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify(insert),
  }).catch(() => null);
  if (!r || !r.ok) return { ok: false, reason: "db" };
  const created = ((await r.json()) as StoredAlert[])[0];
  return created ? { ok: true, status: "pending", id: created.id } : { ok: false, reason: "db" };
}

/** The confirm link was clicked: tag the row confirmed and switch it on. */
export async function confirmWeekly(id: string): Promise<boolean> {
  const H = svc();
  if (!H || !/^[0-9a-f-]{36}$/i.test(id)) return false;
  const g = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?select=${ALERT_COLS}&id=eq.${id}&${NOT_WATCH}&limit=1`, { headers: H, cache: "no-store" }).catch(() => null);
  if (!g || !g.ok) return false;
  const row = ((await g.json()) as StoredAlert[])[0];
  const tag = row ? weeklyConfirmTag(row.id, row.email) : null;
  if (!row || !tag) return false;
  const categories = [...(row.categories || []).filter((c) => !c.startsWith("ok:")), tag];
  const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${row.id}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ categories, is_active: true }),
  }).catch(() => null);
  return !!r && r.ok;
}

/** Everyone who gets the Monday report: active AND confirmed (or grandfathered). */
export async function listWeeklySubscribers(): Promise<Array<{ email: string; city: string | null }>> {
  const H = svc();
  if (!H) return [];
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_alerts?select=${ALERT_COLS}&is_active=eq.true&${NOT_WATCH}&limit=5000`,
    { headers: H, cache: "no-store" }
  );
  if (!r.ok) return [];
  const rows: StoredAlert[] = await r.json();
  const seen = new Set<string>();
  return rows
    .filter((x) => {
      const e = (x.email || "").toLowerCase();
      if (!e.includes("@") || seen.has(e) || !isWeeklyConfirmed(x)) return false;
      seen.add(e);
      return true;
    })
    .map((x) => ({ email: x.email, city: x.city }));
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

// HMAC secret for unsubscribe / confirm links. Never falls back to an empty
// string: with no secret configured, links can't be minted or verified
// (an empty key would make every token forgeable).
function secret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
}
export function unsubscribeToken(email: string): string {
  const s = secret();
  return s ? createHmac("sha256", s).update(email.trim().toLowerCase()).digest("hex").slice(0, 32) : "";
}
export function unsubscribeUrl(base: string, email: string): string {
  const e = email.trim().toLowerCase();
  return `${base}/api/alerts/unsubscribe?e=${encodeURIComponent(e)}&t=${unsubscribeToken(e)}`;
}
