// lib/dealOfTheDay.ts — today's deal of the day: the biggest real saving
// among live Central Illinois deals, picked the same way every surface
// (the /deal-of-the-day page, its share images, llms-full.txt and the MCP
// deal_of_the_day tool) so they always agree.
//
// Rules, in order (see /deal-of-the-day "How we pick it"):
//   1. Everyday deals only: a real amount off (lib/exhale amountOf), not
//      conditional (first-time, veterans, "up to"…) and not buy-several.
//      Same eligibility as the home page's "longest exhale".
//   2. Fresh: re-found on the store's own site within 7 days (the featured-
//      slot rule, lib/dealFreshness) and not past its end date.
//   3. Biggest saving wins. Percent-off deals compare by their percent;
//      a dollars-off deal is compared as a share of a typical basket for its
//      category (lib/dealScoring AVG_SPEND_BY_CATEGORY). That share is only
//      used to order deals; it is never shown as a number.
//   4. Fairness: a tie is broken by a daily rotation over the tied stores
//      (not alphabetically, not by how many deals a store posts), and the
//      runners-up are one per store (lib/storeCap). Nothing here can be paid for.
//
// HARD RULE: never invents a deal. Unreadable data → status "unknown";
// nothing eligible → status "none" with the true live count.

import { amountOf, isConditional, needsQuantity, productOf, storeWithCity, cleanDealTitle, type Amount, type ExDeal } from "./exhale";
import { isFreshFeatured } from "./dealFreshness";
import { AVG_SPEND_BY_CATEGORY } from "./dealScoring";
import { effectiveCategory } from "./inferCategory";
import { capPerStore, dealStoreKey } from "./storeCap";
import { otdFor, usd } from "./otd";
import { CENTRAL_IL_PUBLIC_CITIES } from "./constants/regions";
import { ctToday } from "./events";

export type LiveDeal = ExDeal & {
  deal_id: string;
  deal_description?: string | null;
  verified_at?: string | null;
  expires_at?: string | null;
};

const REGION = CENTRAL_IL_PUBLIC_CITIES.map((c) => c.name);

// ── Pure selection ───────────────────────────────────────────────────────

/** Basket key for a dollars-off deal: flower / edibles / vapes / concentrate / all. */
function basketKey(d: LiveDeal): string {
  const c = String(effectiveCategory({ category: d.category, deal_title: d.deal_title, deal_description: d.deal_description }) || "").toLowerCase();
  if (/flower|pre-?roll/.test(c)) return "flower";
  if (/edible/.test(c)) return "edibles";
  if (/vape|cart/.test(c)) return "vapes";
  if (/concentrate|extract/.test(c)) return "concentrate";
  return "all";
}

/** A saving as a comparable percent. Ordering only, never displayed. */
export function comparablePercent(d: LiveDeal): number | null {
  const a = amountOf(d);
  if (!a) return null;
  if (a.kind === "percent") return a.value;
  const basket = AVG_SPEND_BY_CATEGORY[basketKey(d)] ?? AVG_SPEND_BY_CATEGORY.all;
  return Math.min(100, (a.value / basket) * 100);
}

/** FNV-1a: a stable, cheap hash for the daily tie rotation. */
export function rotationHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function isLive(d: LiveDeal, now: number): boolean {
  if (!REGION.includes(String(d.city || ""))) return false;
  if (!d.expires_at) return true;
  const t = new Date(d.expires_at).getTime();
  return !Number.isFinite(t) || t > now;
}

export function isEligible(d: LiveDeal, now: number): boolean {
  return (
    isLive(d, now) &&
    !!amountOf(d) &&
    !isConditional(d) &&
    !needsQuantity(d) &&
    isFreshFeatured(d.verified_at, now)
  );
}

export type DotdPick = {
  status: "ok";
  day: string;
  pick: LiveDeal;
  amount: Amount;
  runnersUp: LiveDeal[];
  /** Live Central IL deals today (all kinds). */
  live: number;
  /** Deals that met every rule above. */
  eligible: number;
  /** Stores with at least one live deal. */
  stores: number;
};
export type DotdResult = DotdPick | { status: "none"; day: string; live: number; stores: number } | { status: "unknown"; day: string };

/**
 * Pick today's deal. `deals` null means the data couldn't be read.
 * `day` (YYYY-MM-DD, Central) seeds the tie rotation.
 */
export function pickDealOfTheDay(deals: LiveDeal[] | null, opts: { now?: number; day?: string; runnersUp?: number } = {}): DotdResult {
  const now = opts.now ?? Date.now();
  const day = opts.day ?? ctToday(new Date(now));
  if (!deals) return { status: "unknown", day };
  const live = deals.filter((d) => isLive(d, now));
  const stores = new Set(live.map(dealStoreKey).filter(Boolean)).size;
  const pool = live.filter((d) => isEligible(d, now));
  if (!pool.length) return { status: "none", day, live: live.length, stores };

  const ranked = [...pool].sort((a, b) => {
    const diff = comparablePercent(b)! - comparablePercent(a)!;
    if (Math.abs(diff) > 1e-9) return diff;
    // Tie: rotate daily across stores, then a stable id order.
    const ra = rotationHash(`${day}|${dealStoreKey(a)}`);
    const rb = rotationHash(`${day}|${dealStoreKey(b)}`);
    if (ra !== rb) return ra - rb;
    return String(a.deal_id).localeCompare(String(b.deal_id));
  });
  const pick = ranked[0];
  const pickStore = dealStoreKey(pick);
  // Runners-up: one per store, never the pick's store.
  const others = capPerStore(ranked.filter((d) => dealStoreKey(d) !== pickStore), 1).kept;
  return {
    status: "ok",
    day,
    pick,
    amount: amountOf(pick)!,
    runnersUp: others.slice(0, opts.runnersUp ?? 3),
    live: live.length,
    eligible: pool.length,
    stores,
  };
}

// ── Display helpers (shared by the page, the image and the feeds) ───────

export type DotdCopy = {
  /** "30% off" / "$20 off" */
  saving: string;
  product: string;
  store: string;
  city: string | null;
  title: string;
  /** Out-the-door line when the deal states a real price; always labeled as an estimate. */
  otdEstimate: string | null;
};

export function dotdCopy(d: LiveDeal): DotdCopy {
  const a = amountOf(d)!;
  const title = cleanDealTitle(d.deal_title);
  const o = otdFor({ ...d, deal_title: title });
  return {
    saving: `${a.big} off`,
    product: productOf({ ...d, deal_title: title }),
    store: storeWithCity(d),
    city: d.city || null,
    title,
    otdEstimate: o ? `Est. ${usd(o.total)} out the door with ${o.city} tax` : null,
  };
}

/** "Checked Sun 7:12 AM" in Central Time, or null. */
export function checkedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
}

// ── Read side ────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const SELECT =
  "deal_id,deal_title,deal_description,category,city,name,slug,listing_slug,discount_value,discount_unit,discount_type,verified_at,expires_at,lat,lng";

/** Live Central IL deal rows, or null when the data can't be read (never a fake zero). */
export async function readLiveDeals(revalidate = 900): Promise<LiveDeal[] | null> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=${SELECT}&order=discount_value.desc.nullslast&limit=1000`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate, tags: ["deals"] } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    if (!Array.isArray(rows)) return null;
    return (rows as LiveDeal[]).filter((d) => REGION.includes(String(d.city || "")));
  } catch {
    return null;
  }
}

export async function getDealOfTheDay(): Promise<DotdResult> {
  return pickDealOfTheDay(await readLiveDeals());
}
