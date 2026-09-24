// lib/labData.ts — shared live data for the /lab design-direction previews.
import { REGION_CITIES, getRegionStores, getFeatureRows, getClosingTonight } from "./waysToBuy";
import { getDealIndex } from "./dealIndex";
import { storeImageUrl } from "./storeImage";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export type LabDeal = { id: string; store: string; city: string; title: string; pct: number | null; slug: string; img: string | null; verified: string | null };

export async function getLabData() {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const [dRes, stores, features, index] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=*&order=discount_value.desc.nullslast&limit=300`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 900 } }),
    getRegionStores(),
    getFeatureRows(),
    getDealIndex(),
  ]);
  const raw: Array<Record<string, any>> = dRes.ok ? await dRes.json() : [];
  const inRegion = raw.filter((d) => REGION_CITIES.includes(d.city));
  const seen = new Set<string>();
  const deals: LabDeal[] = [];
  for (const d of inRegion) {
    const slug = d.slug || d.listing_slug;
    const pct = (d.discount_unit === "percent" || !d.discount_unit) && Number(d.discount_value) > 0 && Number(d.discount_value) <= 100 ? Math.round(Number(d.discount_value)) : null;
    const key = `${String(d.name).replace(/\s+(Peoria|East Peoria|Pekin|Champaign|Urbana)$/i, "").toLowerCase()}|${String(d.deal_title).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deals.push({ id: d.deal_id || d.id, store: d.name, city: d.city, title: d.deal_title, pct, slug, img: storeImageUrl(d.logo_url, slug), verified: d.verified_at || null });
  }
  deals.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  const tonight = await getClosingTonight(stores);
  const cities = REGION_CITIES.map((c) => ({
    city: c,
    slug: c.toLowerCase().replace(/\s+/g, "-"),
    deals: inRegion.filter((d) => d.city === c).length,
    stores: stores.filter((s) => s.city === c).length,
  }));
  const today = index.days[index.days.length - 1] || null;
  return {
    deals,
    dealCount: inRegion.length,
    storeCount: stores.length,
    storesWithDeals: new Set(inRegion.map((d) => d.slug || d.listing_slug)).size,
    avgPct: today?.avgPct ?? null,
    medical: features.filter((f) => f.feature === "medical" && f.status === "yes").length,
    orderAhead: features.filter((f) => f.feature === "order_ahead" && f.status === "yes").length,
    driveThru: features.filter((f) => f.feature === "drive_thru" && f.status === "yes").length,
    latest: tonight.find((t) => t.closesAt) || null,
    cities,
    dateLabel: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" }),
  };
}
export type LabData = Awaited<ReturnType<typeof getLabData>>;
