// lib/dealWatch.ts (server-only)
// "Email me new deals" watches, stored in the existing deal_alerts table with
// NO schema change:
//
//   alert_type  'city_watch'  city = lowercased city, categories = ['flower', ...] or ['all']
//               'store_watch' city = store's city,     categories = ['store:<slug>']
//   min_discount  optional "at least N% off" (city watches)
//   is_active     false until the address is confirmed (double opt-in),
//                 false again after unsubscribe
//
// Bookkeeping lives in the same categories array as tagged entries, so it
// needs no new columns:
//   'ok:<hmac>'        confirmed. HMAC over row id + email with the server
//                      secret, so a row inserted straight through the anon
//                      key (RLS allows anon INSERT) can never pass as confirmed.
//   'sent:YYYY-MM-DD'  the Central-Time day the last digest went out. Used as
//                      a claim so a second run the same day sends nothing.
//
// Watch rows never collide with the weekly-report row: lib/alertSubscribers
// skips these alert_types when it upserts or lists weekly subscribers.
import { createHmac, timingSafeEqual } from "crypto";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export const WATCH_TYPES = ["city_watch", "store_watch"] as const;
export type WatchType = (typeof WATCH_TYPES)[number];
export const WATCH_CATEGORIES = ["flower", "edibles", "vapes", "concentrate"] as const;

export type WatchRow = {
  id: string;
  email: string;
  city: string | null;
  state: string | null;
  categories: string[] | null;
  min_discount: number | null;
  alert_type: WatchType;
  is_active: boolean;
  created_at: string;
};

function svc(): Record<string, string> | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) return null;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}
export function watchesAvailable(): boolean {
  return !!svc();
}

function secret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  );
}
function mac(msg: string, len = 32): string {
  return createHmac("sha256", secret()).update(msg).digest("hex").slice(0, len);
}
export function safeEq(a: string, b: string): boolean {
  return a.length === b.length && a.length > 0 && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ---------- tags inside categories ----------
export const storeSlugOf = (r: Pick<WatchRow, "categories">) =>
  (r.categories || []).find((c) => c.startsWith("store:"))?.slice(6) || null;
const isMeta = (c: string) => c.startsWith("ok:") || c.startsWith("sent:");
export const userCategories = (r: Pick<WatchRow, "categories">) =>
  (r.categories || []).filter((c) => !isMeta(c) && !c.startsWith("store:"));
const confirmTag = (id: string, email: string) => `ok:${mac(`confirmed:${id}:${email.toLowerCase()}`, 24)}`;
export function isConfirmed(r: WatchRow): boolean {
  const want = confirmTag(r.id, r.email);
  return (r.categories || []).some((c) => safeEq(c, want));
}
export const sentOn = (r: Pick<WatchRow, "categories">) =>
  (r.categories || []).find((c) => c.startsWith("sent:"))?.slice(5) || null;

/** Today's date in Central Time, YYYY-MM-DD. */
export function ctDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

// ---------- tokens ----------
/** Confirm link token: bound to the row and an expiry (7 days). */
export function confirmToken(id: string, exp: number): string {
  return mac(`confirm:${id}:${exp}`);
}
export function confirmUrl(base: string, id: string): string {
  const exp = Math.floor(Date.now() / 1000) + 7 * 86400;
  return `${base}/api/alerts/confirm?id=${encodeURIComponent(id)}&x=${exp}&t=${confirmToken(id, exp)}`;
}
/** One-click "stop this watch" token (does not expire). */
export function watchStopToken(id: string): string {
  return mac(`watch:${id}`);
}
export function watchStopUrl(base: string, id: string): string {
  return `${base}/api/alerts/unsubscribe?w=${encodeURIComponent(id)}&t=${watchStopToken(id)}`;
}

// ---------- reads / writes (service key) ----------
const COLS = "id,email,city,state,categories,min_discount,alert_type,is_active,created_at";
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

export async function getWatch(id: string): Promise<WatchRow | null> {
  const H = svc();
  if (!H || !isUuid(id)) return null;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?select=${COLS}&id=eq.${id}&alert_type=in.(city_watch,store_watch)&limit=1`, {
    headers: H,
    cache: "no-store",
  });
  if (!r.ok) return null;
  const rows = (await r.json()) as WatchRow[];
  return rows[0] || null;
}

export type WatchInput =
  | { kind: "store"; email: string; slug: string; city: string | null }
  | { kind: "city"; email: string; city: string; categories: string[]; minDiscount: number | null };

export type SaveResult =
  | { ok: true; row: WatchRow; needsConfirm: boolean }
  | { ok: false; reason: "unavailable" | "db" };

/** Create or update a watch. New or unconfirmed rows stay inactive until the
 *  confirm link is clicked. A confirmed, active watch keeps sending and just
 *  takes the new preferences. */
export async function saveWatch(input: WatchInput): Promise<SaveResult> {
  const H = svc();
  if (!H) return { ok: false, reason: "unavailable" };
  const email = input.email.trim().toLowerCase();
  const type: WatchType = input.kind === "store" ? "store_watch" : "city_watch";
  const city = (input.city || "").trim().toLowerCase() || null;

  let q = `${SUPABASE_URL}/rest/v1/deal_alerts?select=${COLS}&email=ilike.${encodeURIComponent(email)}&alert_type=eq.${type}`;
  if (input.kind === "store") q += `&categories=cs.${encodeURIComponent(`{"store:${input.slug}"}`)}`;
  else q += `&city=eq.${encodeURIComponent(city || "")}`;
  const found = await fetch(`${q}&order=created_at.asc&limit=1`, { headers: H, cache: "no-store" });
  if (!found.ok) return { ok: false, reason: "db" };
  const existing = ((await found.json()) as WatchRow[])[0];

  const prefs =
    input.kind === "store"
      ? [`store:${input.slug}`]
      : input.categories.length
      ? input.categories
      : ["all"];
  const minDiscount = input.kind === "city" ? input.minDiscount : null;

  if (existing) {
    const meta = (existing.categories || []).filter(isMeta);
    const active = existing.is_active && isConfirmed(existing);
    const body = { categories: [...prefs, ...meta], min_discount: minDiscount, city, state: "IL", is_active: active };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${existing.id}`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { ok: false, reason: "db" };
    const row = ((await r.json()) as WatchRow[])[0] || { ...existing, ...body };
    return { ok: true, row, needsConfirm: !active };
  }

  const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts`, {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      email,
      city,
      state: "IL",
      categories: prefs,
      min_discount: minDiscount,
      alert_type: type,
      is_active: false,
    }),
  });
  if (!r.ok) return { ok: false, reason: "db" };
  const row = ((await r.json()) as WatchRow[])[0];
  return row ? { ok: true, row, needsConfirm: true } : { ok: false, reason: "db" };
}

/** Mark a watch confirmed and active. */
export async function confirmWatch(id: string): Promise<WatchRow | null> {
  const H = svc();
  const row = await getWatch(id);
  if (!H || !row) return null;
  const cats = (row.categories || []).filter((c) => !c.startsWith("ok:"));
  cats.push(confirmTag(row.id, row.email));
  const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${row.id}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ categories: cats, is_active: true }),
  });
  return r.ok ? { ...row, categories: cats, is_active: true } : null;
}

export async function stopWatch(id: string): Promise<boolean> {
  const H = svc();
  if (!H || !isUuid(id)) return false;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${id}&alert_type=in.(city_watch,store_watch)`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ is_active: false }),
  });
  return r.ok;
}

/** Every active, confirmed watch. Unconfirmed rows are dropped here, so the
 *  sender can't reach an address that never clicked the confirm link. */
export async function listConfirmedWatches(): Promise<WatchRow[] | null> {
  const H = svc();
  if (!H) return null;
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_alerts?select=${COLS}&is_active=eq.true&alert_type=in.(city_watch,store_watch)&order=created_at.asc&limit=5000`,
    { headers: H, cache: "no-store" }
  );
  if (!r.ok) return null;
  const rows = (await r.json()) as WatchRow[];
  return rows.filter((x) => x.email && x.email.includes("@") && isConfirmed(x));
}

/** Claim a row for today's send: writes 'sent:<day>' only if the row doesn't
 *  already carry it. Returns the previous categories on success (for undo),
 *  or null if another run already claimed it / the write failed. */
export async function claimForToday(row: WatchRow, day: string): Promise<string[] | null> {
  const H = svc();
  if (!H) return null;
  const prev = row.categories || [];
  const next = [...prev.filter((c) => !c.startsWith("sent:")), `sent:${day}`];
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${row.id}&categories=not.cs.${encodeURIComponent(`{"sent:${day}"}`)}`,
    { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ categories: next }) }
  );
  if (!r.ok) return null;
  const rows = (await r.json()) as unknown[];
  return rows.length ? prev : null;
}

/** Put categories back (used when a send fails after the claim). */
export async function restoreCategories(id: string, categories: string[]): Promise<void> {
  const H = svc();
  if (!H) return;
  await fetch(`${SUPABASE_URL}/rest/v1/deal_alerts?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ categories }),
  }).catch(() => undefined);
}
