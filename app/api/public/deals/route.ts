// GET /api/public/deals — today's live Central Illinois deals as JSON.
// Open for AI assistants, researchers and reporters; please link back.
import { NextResponse } from "next/server";
import { brand } from "@/lib/brand";
import { REGION_CITIES } from "@/lib/waysToBuy";

export const revalidate = 900;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function GET() {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=*&order=discount_value.desc&limit=300`,
    { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 900 } }
  );
  const rows: Array<Record<string, unknown>> = r.ok ? await r.json() : [];
  const deals = rows
    .filter((d) => REGION_CITIES.includes(String(d.city || "")))
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
      deals,
    },
    { headers: { "Cache-Control": "public, s-maxage=900", "Access-Control-Allow-Origin": "*" } }
  );
}
