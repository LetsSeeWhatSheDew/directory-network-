// lib/mcp/data.ts — read-only data for the public MCP server (/mcp).
//
// Everything here reads through the anon key (RLS applies) and the same
// views/helpers the site uses, so the MCP answers match the pages:
//   deals   → active_deals_with_listings, Central IL cities only, expired
//             rows dropped, biggest discount first, capPerStore(STORE_CAP.feed)
//             — the same order and fairness cap as /api/public/deals and
//             /llms-full.txt.
//   stores  → getRegionStores() (master_listings, project_tag=green)
//   ways    → listing_features (project_tag=green), "yes" rows only
//   hours   → listing_hours for today's weekday in Central Time
//   index   → getDealIndex() (daily_market_stats)
//   tax     → lib/otd + lib/taxRates
// No writes. No personal data: only businesses and their public details.
import { brand } from "../brand";
import { REGION_CITIES, getRegionStores, getFeatureRows, FEATURE_LABEL, type Feature } from "../waysToBuy";
import { CENTRAL_IL_CITIES } from "../constants/regions";
import { capPerStore, STORE_CAP } from "../storeCap";
import { effectiveCategory } from "../inferCategory";
import { otdFor, usd } from "../otd";
import { nowInCT, formatTime } from "../hours";
import { getDealIndex } from "../dealIndex";
import { CITY_TAX_RATES, calculateOutTheDoor, STATE_EXCISE_RATES, TAX_RATES_LAST_UPDATED, type ThcTier } from "../taxRates";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const H = () => {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { apikey: anon, Authorization: `Bearer ${anon}` };
};

export const u = brand.url;

// ── Time + citation ──────────────────────────────────────────────────────
export function ctLabel(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }) + " CT";
}
export function ctDay(isoDay: string): string {
  return new Date(isoDay + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" });
}
export function citeAs(checked: string): string {
  return `Source: PuffPrice (puffprice.com), checked ${checked}`;
}

// ── Cities ───────────────────────────────────────────────────────────────
export const SCOPE_CITIES = CENTRAL_IL_CITIES.map((c) => c.name);
const citySlug = (c: string) => c.toLowerCase().replace(/\s+/g, "-");

export type CityResolve = { ok: true; city: string | null } | { ok: false; message: string };

/** "peoria", "Peoria, IL", "east-peoria", "Bloomington-Normal" → canonical name. */
export function resolveCity(input: unknown): CityResolve {
  if (input == null || input === "") return { ok: true, city: null };
  if (typeof input !== "string") return { ok: false, message: "city must be a string" };
  const raw = input.trim().toLowerCase()
    .replace(/,?\s*(il|illinois)\.?$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw || raw === "any" || raw === "all" || raw === "central illinois") return { ok: true, city: null };
  const hit = SCOPE_CITIES.find((c) => c.toLowerCase() === raw);
  if (hit) return { ok: true, city: hit };
  return {
    ok: false,
    message: `PuffPrice covers Central Illinois only. "${input}" isn't one of its cities: ${SCOPE_CITIES.join(", ")}.`,
  };
}

/** Scope cities with no licensed dispensary (Bartonville, Morton, Washington). */
export function isEmptyScopeCity(city: string): boolean {
  return !REGION_CITIES.includes(city);
}

// ── Deals ────────────────────────────────────────────────────────────────
type DealRow = {
  deal_id: string;
  deal_title: string | null;
  deal_description: string | null;
  category: string | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_unit: string | null;
  expires_at: string | null;
  is_recurring: boolean | null;
  recurring_days: string[] | null;
  listing_slug: string | null;
  slug: string | null;
  name: string | null;
  city: string | null;
  verified_at: string | null;
};

const DEAL_SELECT =
  "deal_id,deal_title,deal_description,category,discount_type,discount_value,discount_unit,expires_at,is_recurring,recurring_days,listing_slug,slug,name,city,verified_at";

/** Live Central IL deals, in site order (biggest discount first), expired dropped. */
export async function liveDeals(): Promise<{ ok: boolean; rows: DealRow[] }> {
  const inList = `(${REGION_CITIES.map((c) => `"${c}"`).join(",")})`;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=${DEAL_SELECT}&city=in.${encodeURIComponent(inList)}&order=discount_value.desc.nullslast&limit=1000`,
      { headers: H(), next: { revalidate: 300, tags: ["deals"] } }
    );
    if (!r.ok) return { ok: false, rows: [] };
    const rows: DealRow[] = await r.json();
    const now = Date.now();
    return {
      ok: true,
      rows: rows.filter((d) => {
        if (!REGION_CITIES.includes(String(d.city || ""))) return false;
        if (!d.expires_at) return true;
        const t = new Date(d.expires_at).getTime();
        return !Number.isFinite(t) || t > now;
      }),
    };
  } catch {
    return { ok: false, rows: [] };
  }
}

export const DEAL_CATEGORIES = ["flower", "vape", "edible", "pre-roll", "concentrate", "any"] as const;
export type DealCategoryArg = (typeof DEAL_CATEGORIES)[number];

const PREROLL_RE = /\b(pre-?rolls?|prerolls?|joints?|blunts?)\b/i;

function matchesCategory(d: DealRow, cat: DealCategoryArg): boolean {
  if (cat === "any") return true;
  const text = `${d.deal_title || ""} ${d.deal_description || ""}`;
  if (cat === "pre-roll") return PREROLL_RE.test(text);
  const eff = String(effectiveCategory(d) || "").toLowerCase();
  if (cat === "flower") return eff === "flower";
  if (cat === "vape") return eff === "vapes" || eff === "vape";
  if (cat === "edible") return eff === "edibles" || eff === "edible";
  if (cat === "concentrate") return eff === "concentrate" || eff === "concentrates";
  return false;
}

function discountLabel(d: DealRow): string | null {
  const v = Number(d.discount_value);
  if (!Number.isFinite(v) || v <= 0) return null;
  const unit = String(d.discount_unit || "").toLowerCase();
  if (unit === "percent") return `${v}% off`;
  if (unit === "dollars") return `$${v} off`;
  return null;
}

export async function findDeals(args: { city: string | null; category: DealCategoryArg; max: number; minDiscount: number | null }) {
  const { ok, rows } = await liveDeals();
  let pool = rows;
  if (args.city) pool = pool.filter((d) => d.city === args.city);
  pool = pool.filter((d) => matchesCategory(d, args.category));
  if (args.minDiscount != null) {
    pool = pool.filter((d) => String(d.discount_unit || "").toLowerCase() === "percent" && Number(d.discount_value) >= (args.minDiscount as number));
  }
  const totalMatching = pool.length;
  const { kept } = capPerStore(pool, STORE_CAP.feed);
  const shown = kept.slice(0, args.max);
  const deals = shown.map((d) => {
    const slug = d.slug || d.listing_slug || "";
    const otd = otdFor(d);
    return {
      store: d.name,
      city: d.city,
      title: d.deal_title,
      discount: discountLabel(d),
      discount_percent: String(d.discount_unit || "").toLowerCase() === "percent" ? Number(d.discount_value) : null,
      category: effectiveCategory(d),
      recurring_days: d.is_recurring && d.recurring_days?.length ? d.recurring_days : null,
      expires_at: d.expires_at,
      out_the_door: otd
        ? {
            line: `About ${usd(otd.total)} out the door in ${otd.city}${otd.each ? ` (${usd(otd.each)} each)` : ""}, including ${Math.round(otd.rate * 1000) / 10}% tax`,
            shelf_price: otd.shelf,
            quantity: otd.qty,
            total: otd.total,
            each: otd.each,
            tax: otd.tax,
          }
        : null,
      verified_at: d.verified_at,
      deal_url: `${u}/deal/${d.deal_id}`,
      store_url: `${u}/dispensary/${slug}`,
    };
  });
  const latest = shown.reduce<string | null>((a, d) => (d.verified_at && (!a || d.verified_at > a) ? d.verified_at : a), null);
  return { ok, deals, totalMatching, latestVerified: latest };
}

// ── Dispensaries ─────────────────────────────────────────────────────────
type HoursRow = { listing_id: string; opens_at: string | null; closes_at: string | null; is_closed: boolean | null };

async function hoursToday(ids: string[], weekday: number): Promise<Map<string, HoursRow>> {
  if (!ids.length) return new Map();
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/listing_hours?select=listing_id,opens_at,closes_at,is_closed&project_tag=eq.green&weekday=eq.${weekday}&listing_id=in.(${ids.join(",")})`,
      { headers: H(), next: { revalidate: 600 } }
    );
    const rows: HoursRow[] = r.ok ? await r.json() : [];
    return new Map(rows.map((h) => [h.listing_id, h]));
  } catch {
    return new Map();
  }
}

const WAYS: Feature[] = ["medical", "curbside", "order_ahead", "drive_thru"];

export async function listDispensaries(city: string | null) {
  const [stores, features, deals] = await Promise.all([getRegionStores(), getFeatureRows(), liveDeals()]);
  const inScope = stores.filter((s) => (city ? s.city === city : true));
  const ct = nowInCT();
  const hours = await hoursToday(inScope.map((s) => s.id), ct.weekday);
  const dealCount = new Map<string, number>();
  for (const d of deals.rows) {
    const k = d.listing_slug || d.slug || "";
    dealCount.set(k, (dealCount.get(k) || 0) + 1);
  }
  const out = inScope.map((s) => {
    const h = hours.get(s.id);
    const f = features.filter((r) => r.listing_slug === s.slug);
    const ways: Record<string, { status: string; evidence: string; source_url: string; verified_at: string } | null> = {};
    for (const w of WAYS) {
      const row = f.find((r) => r.feature === w);
      // No row = not confirmed either way; we never report "no" by default.
      ways[w] = row ? { status: row.status, evidence: row.evidence, source_url: row.source_url, verified_at: row.verified_at } : null;
    }
    return {
      name: s.name,
      city: s.city,
      // Some rows already carry "…, Peoria, IL 61615" in address1.
      address: s.address1 ? (/\bIL\b/.test(s.address1) ? s.address1 : `${s.address1}, ${s.city}, IL`) : null,
      phone: s.phone,
      website: s.website,
      hours_today: h
        ? h.is_closed
          ? "Closed today"
          : h.opens_at && h.closes_at
          ? `${formatTime(h.opens_at)} – ${formatTime(h.closes_at)}`
          : null
        : null,
      ways_to_buy: ways,
      ways_to_buy_confirmed: WAYS.filter((w) => ways[w]?.status === "yes").map((w) => FEATURE_LABEL[w]),
      live_deals: dealCount.get(s.slug) || 0,
      store_url: `${u}/dispensary/${s.slug}`,
    };
  });
  out.sort((a, b) => b.live_deals - a.live_deals || String(a.name).localeCompare(String(b.name)));
  return { stores: out, storesOk: stores.length > 0 };
}

// ── Out the door ─────────────────────────────────────────────────────────
export const OTD_CATEGORIES = ["flower", "pre-roll", "vape", "concentrate", "edible"] as const;
export type OtdCategory = (typeof OTD_CATEGORIES)[number];

export function outTheDoor(shelf: number, category: OtdCategory, city: string | null, thcOver35: boolean | null) {
  // Excise tier (lib/taxRates, /illinois-cannabis-tax): infused products 20%
  // regardless of potency; otherwise 10% at ≤35% THC and 25% above. Vapes and
  // concentrates are assumed >35% (as lib/otd does) unless told otherwise.
  let tier: ThcTier;
  let tierNote: string;
  if (category === "edible") {
    tier = "edible";
    tierNote = "Cannabis-infused products (edibles, tinctures, drinks, topicals): 20% excise regardless of THC.";
  } else if (category === "flower" || category === "pre-roll") {
    tier = thcOver35 ? "concentrate" : "flower";
    tierNote = thcOver35 ? "Over 35% THC: 25% excise." : "35% THC or less: 10% excise." + (thcOver35 == null ? " Pass thc_over_35=true for high-potency or infused pre-rolls." : "");
  } else {
    tier = thcOver35 === false ? "flower" : "concentrate";
    tierNote = thcOver35 === false ? "Told it's 35% THC or less: 10% excise." : "Vapes and concentrates are almost always over 35% THC: 25% excise." + (thcOver35 == null ? " (Assumed; pass thc_over_35=false if it's 35% or less.)" : "");
  }
  const cities = city ? CITY_TAX_RATES.filter((c) => c.city === city) : CITY_TAX_RATES;
  const results = cities.map((rates) => {
    const r = calculateOutTheDoor(shelf, tier, rates);
    const r2 = (n: number) => Math.round(n * 100) / 100;
    return {
      city: rates.city,
      county: rates.county,
      shelf_price: r2(r.shelfPrice),
      breakdown: {
        cannabis_excise: r2(r.cannabisExcise),
        state_sales_tax: r2(r.stateSalesTax),
        local_sales_tax: r2(r.localSalesTax),
        county_cannabis_tax: r2(r.countyCannabisTax),
        municipal_cannabis_tax: r2(r.municipalCannabisTax),
      },
      rates: {
        cannabis_excise: STATE_EXCISE_RATES[tier],
        state_sales_tax: rates.stateSalesTax,
        local_sales_tax: rates.localSalesTax,
        county_cannabis_tax: rates.countyCannabisRot,
        municipal_cannabis_tax: rates.municipalCannabisRot,
      },
      total_tax: r2(r.totalTax),
      out_the_door: r2(r.outTheDoor),
      effective_tax_rate_percent: Math.round(r.effectiveRate * 1000) / 10,
      rates_verified: rates.verifiedDate,
    };
  });
  return { tier, tierNote, results, ratesUpdated: TAX_RATES_LAST_UPDATED };
}

// ── Deal Index ───────────────────────────────────────────────────────────
export async function dealIndex(city: string | null) {
  const idx = await getDealIndex();
  const today = idx.days[idx.days.length - 1] || null;
  const cities = idx.latest
    .filter((c) => (city ? c.city === city : true))
    .map((c) => ({
      city: c.city,
      deals_live: c.deals_live,
      stores_with_deals: c.stores_with_deals,
      avg_discount_percent: c.avg_discount_pct,
      city_url: `${u}/city/${citySlug(c.city)}`,
    }));
  const trend = idx.days.slice(-7).map((d) => ({ day: d.day, deals_live: d.deals, stores_with_deals: d.stores, avg_discount_percent: d.avgPct }));
  return { day: idx.latestDay, total: today, cities, trend };
}
