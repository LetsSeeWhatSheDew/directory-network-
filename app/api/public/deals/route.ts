// GET /api/public/deals — today's live Central Illinois deals as JSON.
// Open for AI assistants, researchers and reporters; please link back.
import { NextResponse } from "next/server";
import { brand } from "@/lib/brand";
import { REGION_CITIES } from "@/lib/waysToBuy";
import { capPerStore, STORE_CAP } from "@/lib/storeCap";

export const revalidate = 900;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function GET() {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,name,city,slug,listing_slug,discount_value,discount_unit,category,verified_at&order=discount_value.desc.nullslast&limit=1000`,
    { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 900 } }
  );
  const rows: Array<Record<string, unknown>> = r.ok ? await r.json() : [];
  const inRegion = rows.filter((d) => REGION_CITIES.includes(String(d.city || "")));
  // Up to STORE_CAP.feed per store so one store's long specials page can't
  // crowd the feed; stores_truncated says where to find the rest.
  const { kept, overflow } = capPerStore(inRegion, STORE_CAP.feed);
  const deals = kept
    .map((d) => ({
      store: d.name ?? null,
      city: d.city ?? null,
      title: d.deal_title ?? null,
      discount_value: d.discount_value ?? null,
      discount_unit: d.discount_unit ?? null,
      category: d.category ?? null,
      verified_at: d.verified_at ?? null,
      url: `${brand.url}/dispensary/${d.slug || d.listing_slug}`,
    }));
  return NextResponse.json(
    {
      source: "PuffPrice",
      about: `${brand.url}/how-we-rank`,
      license: "Free to cite with a link to puffprice.com",
      region: "Central Illinois",
      generated_at: new Date().toISOString(),
      count: deals.length,
      total_live: inRegion.length,
      per_store_limit: STORE_CAP.feed,
      stores_truncated: overflow.map((o) => ({
        store: o.name,
        city: o.city,
        total_live: o.total,
        included: o.shown,
        url: `${brand.url}/dispensary/${o.slug}`,
      })),
      deals,
    },
    { headers: { "Cache-Control": "public, s-maxage=900", "Access-Control-Allow-Origin": "*" } }
  );
}
