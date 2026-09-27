// lib/dealAccuracy.ts (server-only) — deal accuracy score per store.
//
// How right a store's deals turn out to be, from two things we already log:
//
//   People   the "Right price? Yes / No" taps (public.deal_reports) on the
//            store's deals over the last WINDOW_DAYS. Yes = reason
//            'confirmed'. No = 'price_changed', 'expired' or 'wrong_store'.
//            Page-level reports ('wrong_info', 'other') don't count: they're
//            about hours or details, not the deal. At most one Yes and one No
//            per deal, per user-agent string, per Central-Time day counts, so
//            one person tapping ten times is one tap. (Different people on the
//            same phone model can share a user-agent, so this can undercount,
//            never overcount.)
//   Checks   the share of the store's live deals our daily check re-found on
//            the store's own site in the last FRESH_HOURS (deals.verified_at,
//            written by the scraper).
//
//   score = 100 × (0.8 × Yes share + 0.2 × re-found share), rounded.
//   (People only, when the store has no live deals to re-check.)
//
// Shown only with MIN_REPORTS or more Yes/No taps; below that the store page
// says "Not enough confirmations yet". Explained on /how-we-rank#accuracy.
//
// It never changes the order of anything, and nothing about it can be paid
// for: there is no paid rank anywhere on PuffPrice.
//
// deal_reports is insert-only for anon, so this reads with the service key
// (server-side only). Fail-soft: any read error → null, and the UI shows
// nothing rather than a guess.

export const MIN_REPORTS = 5;
export const WINDOW_DAYS = 90;
export const FRESH_HOURS = 48;
export const PEOPLE_WEIGHT = 0.8;

export const YES_REASONS = ["confirmed"] as const;
export const NO_REASONS = ["price_changed", "expired", "wrong_store"] as const;
const COUNTED = [...YES_REASONS, ...NO_REASONS] as readonly string[];

export type ReportRow = {
  deal_id: string | null;
  listing_slug: string | null;
  reason: string | null;
  user_agent: string | null;
  created_at: string;
};

export type Tally = { yes: number; no: number };

const ctDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/**
 * Yes/No counts per store. `storeOfDeal` maps a deal id to its store slug
 * for reports that were filed without one (deal pages don't send it).
 */
export function tallyReports(rows: ReportRow[], storeOfDeal: (dealId: string) => string | null): Map<string, Tally> {
  const seen = new Set<string>();
  const out = new Map<string, Tally>();
  for (const r of rows) {
    const reason = String(r.reason || "");
    if (!COUNTED.includes(reason)) continue;
    const slug = r.listing_slug || (r.deal_id ? storeOfDeal(r.deal_id) : null);
    if (!slug) continue;
    const yes = (YES_REASONS as readonly string[]).includes(reason);
    let day: string;
    try {
      day = ctDay(r.created_at);
    } catch {
      continue;
    }
    const key = `${slug}|${r.deal_id || "-"}|${yes ? "y" : "n"}|${r.user_agent || "-"}|${day}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const t = out.get(slug) || { yes: 0, no: 0 };
    if (yes) t.yes++;
    else t.no++;
    out.set(slug, t);
  }
  return out;
}

/** How many of a store's live deals were re-found on its own site recently. */
export function freshShare(deals: Array<{ verified_at?: string | null }>, now = Date.now()): { fresh: number; live: number } {
  let fresh = 0;
  for (const d of deals) {
    const t = d.verified_at ? new Date(d.verified_at).getTime() : NaN;
    if (Number.isFinite(t) && now - t <= FRESH_HOURS * 3600_000) fresh++;
  }
  return { fresh, live: deals.length };
}

export type Accuracy =
  | { status: "scored"; score: number; yes: number; no: number; reports: number; fresh: number; live: number }
  | { status: "thin"; yes: number; no: number; reports: number; fresh: number; live: number };

export function scoreAccuracy(t: Tally, f: { fresh: number; live: number }): Accuracy {
  const reports = t.yes + t.no;
  const base = { yes: t.yes, no: t.no, reports, fresh: f.fresh, live: f.live };
  if (reports < MIN_REPORTS) return { status: "thin", ...base };
  const people = t.yes / reports;
  const raw = f.live > 0 ? PEOPLE_WEIGHT * people + (1 - PEOPLE_WEIGHT) * (f.fresh / f.live) : people;
  return { status: "scored", score: Math.round(raw * 100), ...base };
}

// ── Read side ────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const svc = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return key ? { apikey: key, Authorization: `Bearer ${key}` } : null;
};
const UUID = /^[0-9a-f-]{36}$/i;

async function readReports(H: Record<string, string>): Promise<ReportRow[] | null> {
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/deal_reports?select=deal_id,listing_slug,reason,user_agent,created_at&project_tag=eq.green&reason=in.(${COUNTED.join(",")})&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=10000`,
    { headers: H, next: { revalidate: 1800, tags: ["feedback"] } }
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows : null;
}

/** deal id → store slug, for deals any time (inactive ones included). */
async function readDealStores(H: Record<string, string>, ids: string[]): Promise<Map<string, string> | null> {
  const out = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/deals?select=id,listing_slug&project_tag=eq.green&id=in.(${chunk.join(",")})`, {
      headers: H,
      next: { revalidate: 1800, tags: ["feedback"] },
    });
    if (!r.ok) return null;
    for (const row of (await r.json()) as Array<{ id: string; listing_slug: string | null }>) {
      if (row.listing_slug) out.set(row.id, row.listing_slug);
    }
  }
  return out;
}

/** Yes/No tallies for every store, or null when they can't be read. */
export async function getReportTallies(): Promise<Map<string, Tally> | null> {
  const H = svc();
  if (!H) return null;
  try {
    const rows = await readReports(H);
    if (!rows) return null;
    const need = [...new Set(rows.filter((r) => !r.listing_slug && r.deal_id && UUID.test(r.deal_id)).map((r) => r.deal_id as string))];
    const stores = need.length ? await readDealStores(H, need) : new Map<string, string>();
    if (!stores) return null;
    return tallyReports(rows, (id) => stores.get(id) || null);
  } catch {
    return null;
  }
}

/** One store's accuracy from its live deals, or null when reports can't be read. */
export async function getStoreAccuracy(slug: string, liveDeals: Array<{ verified_at?: string | null }>): Promise<Accuracy | null> {
  const tallies = await getReportTallies();
  if (!tallies) return null;
  return scoreAccuracy(tallies.get(slug) || { yes: 0, no: 0 }, freshShare(liveDeals));
}

/** Accuracy for every store with live deals (for feeds and the MCP server). */
export async function getAccuracyByStore(liveDeals: Array<{ slug?: string | null; listing_slug?: string | null; name?: string | null; verified_at?: string | null }>): Promise<Map<string, Accuracy> | null> {
  const tallies = await getReportTallies();
  if (!tallies) return null;
  const byStore = new Map<string, Array<{ verified_at?: string | null }>>();
  for (const d of liveDeals) {
    const k = String(d.listing_slug || d.slug || "");
    if (!k) continue;
    byStore.set(k, [...(byStore.get(k) || []), d]);
  }
  const out = new Map<string, Accuracy>();
  for (const slug of new Set([...byStore.keys(), ...tallies.keys()])) {
    out.set(slug, scoreAccuracy(tallies.get(slug) || { yes: 0, no: 0 }, freshShare(byStore.get(slug) || [])));
  }
  return out;
}
