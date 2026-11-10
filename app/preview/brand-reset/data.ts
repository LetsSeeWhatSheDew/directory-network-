// app/preview/brand-reset/data.ts — live data for the brand-reset previews.
// Real rows only: the same Supabase view the site reads, deduped by
// store + title (the daily-duplicate bug found Nov 10 inflates the raw view
// ~3x; see docs/brand-reset-2026-11-10/ASSESS-site.md). Nothing is invented:
// when a number isn't in the data, callers render "not enough data yet".
import "server-only";
import { REGION_CITIES, getRegionStores, getClosingTonight, getFeatureRows, type Feature } from "@/lib/waysToBuy";
import { amountOf, isConditional, needsQuantity, productOf, storeName, directionsHref, cleanDealTitle, type ExDeal } from "@/lib/exhale";
import { otdFor, usd } from "@/lib/otd";
import { getListingDealHistory, historyIsMeaningful } from "@/lib/dealHistory";
import { milesBetween } from "@/lib/cityProfiles";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` };

export type PDeal = {
  id: string;
  slug: string;
  store: string;
  city: string;
  title: string;
  product: string;
  pct: number | null;
  amountBig: string | null; // "40%" / "$10"
  everyday: boolean; // not conditional, not buy-several
  conditionNote: string | null;
  checkedAt: string | null; // ISO
  checkedLabel: string | null; // "Today, 3:41 AM"
  sourceUrl: string | null;
  directions: string;
  phone: string | null;
  address: string | null;
  closesLabel: string;
  openNow: boolean;
  features: string[];
  otd: { shelf: string; total: string; ratePct: number; city: string } | null;
  lat: number | null;
  lng: number | null;
};

const FEAT_SHORT: Record<Feature, string> = {
  drive_thru: "Drive-thru",
  curbside: "Curbside",
  order_ahead: "Order ahead",
  medical: "Medical",
  delivery: "Delivery",
};

function ctLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const tz = "America/Chicago";
  const day = d.toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric" });
  const today = new Date().toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
  return `${day === today ? "Today" : day}, ${time}`;
}

export async function getPreviewData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped PostgREST row
  let raw: Array<Record<string, any>> = [];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=*&limit=1000`, { headers: H, next: { revalidate: 900 } });
    raw = r.ok ? await r.json() : [];
  } catch {}
  const [stores, featureRows] = await Promise.all([getRegionStores(), getFeatureRows()]);
  const tonight = await getClosingTonight(stores);
  const tonightBySlug = new Map(tonight.map((t) => [t.store.slug, t]));
  const storeBySlug = new Map(stores.map((s) => [s.slug, s]));
  const feats = new Map<string, string[]>();
  for (const f of featureRows) {
    if (f.status !== "yes") continue;
    const list = feats.get(f.listing_slug) || [];
    const label = FEAT_SHORT[f.feature as Feature];
    if (label && !list.includes(label)) list.push(label);
    feats.set(f.listing_slug, list);
  }

  const inRegion = raw.filter((d) => REGION_CITIES.includes(String(d.city)));
  // Dedupe: one row per store + normalized title + value, keeping the newest check.
  const byKey = new Map<string, Record<string, unknown>>();
  for (const d of inRegion) {
    const key = `${d.listing_slug}|${cleanDealTitle(d.deal_title).toLowerCase().replace(/\s+/g, " ")}|${d.discount_value ?? ""}`;
    const prev = byKey.get(key) as { verified_at?: string } | undefined;
    if (!prev || String(d.verified_at || "") > String(prev.verified_at || "")) byKey.set(key, d);
  }

  const deals: PDeal[] = [...byKey.values()].map((row) => {
    const d = row as ExDeal & Record<string, unknown>;
    const slug = String(d.listing_slug);
    const a = amountOf(d);
    const t = tonightBySlug.get(slug);
    const o = otdFor(d);
    const cond = isConditional(d) ? "Not for everyone: read the fine print" : needsQuantity(d) ? "Only when you buy several" : null;
    const lat = d.lat == null ? null : Number(d.lat);
    const lng = d.lng == null ? null : Number(d.lng);
    return {
      id: String(d.deal_id),
      slug,
      store: (() => {
        const n = storeName(d);
        return n.toLowerCase().includes(String(d.city).toLowerCase()) ? n : `${n} ${d.city}`;
      })(),
      city: String(d.city),
      title: cleanDealTitle(String(d.deal_title)),
      product: productOf(d),
      pct: a?.kind === "percent" ? a.value : null,
      amountBig: a ? a.big : null,
      everyday: !!a && !isConditional(d) && !needsQuantity(d),
      conditionNote: cond,
      checkedAt: (d.verified_at as string) || null,
      checkedLabel: ctLabel((d.verified_at as string) || null),
      sourceUrl: (d.source_url as string) || null,
      directions: directionsHref(d),
      phone: (d.phone as string) || storeBySlug.get(slug)?.phone || null,
      address: storeBySlug.get(slug)?.address1 || null,
      closesLabel: (t?.closesLabel || "Hours not listed").replace(/:00(?= [AP]M)/g, ""),
      openNow: !!t?.openNow,
      features: feats.get(slug) || [],
      otd: o ? { shelf: usd(o.shelf), total: usd(o.total), ratePct: Math.round(o.rate * 1000) / 10, city: o.city } : null,
      lat,
      lng,
    };
  });

  // Ranking: biggest everyday saving first (open stores before closed), the
  // same rule the live site uses. Nobody pays to rank.
  const ranked = [...deals].sort((x, y) => {
    if (x.everyday !== y.everyday) return x.everyday ? -1 : 1;
    if (x.openNow !== y.openNow) return x.openNow ? -1 : 1;
    if ((y.pct ?? -1) !== (x.pct ?? -1)) return (y.pct ?? -1) - (x.pct ?? -1);
    // Same saving: the one checked most recently wins.
    return String(y.checkedAt || "").localeCompare(String(x.checkedAt || ""));
  });

  // One per store for "more near you".
  const seen = new Set<string>();
  const onePerStore = ranked.filter((d) => (seen.has(d.slug) ? false : (seen.add(d.slug), true)));

  const best = onePerStore[0] || null;
  const history = best ? await getListingDealHistory(best.slug) : null;
  const latestCheck = deals.reduce<string | null>((m, d) => (d.checkedAt && (!m || d.checkedAt > m) ? d.checkedAt : m), null);
  const withPrice = deals.find((d) => d.otd && d.slug === "trinity-on-glen") || deals.find((d) => d.otd) || null;

  return {
    best,
    history: historyIsMeaningful(history) ? history : null,
    more: onePerStore.slice(1, 4),
    all: onePerStore,
    dealCount: deals.length,
    rawRowCount: inRegion.length,
    storeCount: stores.length,
    storesWithDeals: new Set(deals.map((d) => d.slug)).size,
    latestCheckLabel: ctLabel(latestCheck),
    priceExample: withPrice,
    dateLabel: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" }),
  };
}
export type PreviewData = Awaited<ReturnType<typeof getPreviewData>>;

/** For the dispensary pitch: what each store near a sample store ran in the
 *  last 30 days, from the deal_observations log (distinct deals, deepest %,
 *  days with a deal). Computed, never typed in. */
export async function getMarketSample(centerSlug = "nuera-east-peoria", radiusMi = 15) {
  const stores = await getRegionStores();
  // lat/lng come from the deals view or master_listings; fetch listing coords.
  let coords: Array<{ slug: string; lat: number | null; lng: number | null }> = [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=slug,lat,lng&project_tag=eq.green&slug=in.(${stores.map((s) => `"${s.slug}"`).join(",")})`,
      { headers: H, next: { revalidate: 3600 } }
    );
    coords = r.ok ? await r.json() : [];
  } catch {}
  const at = new Map(coords.map((c) => [c.slug, c]));
  const center = at.get(centerSlug);
  if (!center?.lat || !center?.lng) return null;
  const near = stores
    .map((s) => {
      const c = at.get(s.slug);
      const mi = c?.lat && c?.lng ? milesBetween({ lat: center.lat!, lng: center.lng! }, { lat: c.lat, lng: c.lng }) : null;
      return { ...s, mi };
    })
    .filter((s) => s.mi != null && s.mi <= radiusMi)
    .sort((a, b) => a.mi! - b.mi!);

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  // One request per store: PostgREST caps a response at 1,000 rows, and one
  // busy store can fill that alone (the first version of this table undercounted).
  type Obs = { title: string | null; discount_value: number | null; discount_unit: string | null; observed_day: string };
  const perStore = await Promise.all(
    near.map(async (s) => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/deal_observations?select=title,discount_value,discount_unit,observed_day&project_tag=eq.green&listing_slug=eq.${encodeURIComponent(s.slug)}&observed_day=gt.${since}&order=observed_day.desc&limit=1000`,
          { headers: H, next: { revalidate: 3600 } }
        );
        return (r.ok ? await r.json() : []) as Obs[];
      } catch {
        return [] as Obs[];
      }
    })
  );
  const rows = near.map((s, i) => {
    const mine = perStore[i];
    const pcts = mine
      .filter((o) => (o.discount_unit || "percent") === "percent" && Number(o.discount_value) > 0 && Number(o.discount_value) <= 100)
      .map((o) => Number(o.discount_value));
    const days = new Set(mine.map((o) => o.observed_day)).size;
    const name = s.name.replace(/^nuera\b/i, "nuEra");
    return {
      slug: s.slug,
      name: name.toLowerCase().includes(s.city.toLowerCase()) ? name : `${name} ${s.city}`,
      mi: Math.round(s.mi! * 10) / 10,
      days,
      deepest: pcts.length ? Math.max(...pcts) : null,
    };
  });
  return { center: rows.find((r) => r.slug === centerSlug) || null, rows, radiusMi, since };
}
