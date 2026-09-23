// GET /api/store-photo/[slug]
// Resolves a listing's Google Places photo server-side (API key stays on
// the server) and 302-redirects to the key-free googleusercontent URL.
// The redirect is CDN-cached for a day, so each store costs ~1 Places
// Photo call per day per edge region. 404 when there is no photo; the
// UI falls back to a monogram.
import { placesPhotoName } from "@/lib/storeImage";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !/^[a-z0-9-]{2,120}$/.test(slug)) return new Response(null, { status: 404 });
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=logo_url&slug=eq.${slug}&project_tag=eq.green&limit=1`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate: 86400 } }
    );
    const rows: Array<{ logo_url: string | null }> = r.ok ? await r.json() : [];
    const name = rows[0]?.logo_url ? placesPhotoName(rows[0].logo_url) : null;
    if (!name) return new Response(null, { status: 404, headers: { "Cache-Control": "public, s-maxage=3600" } });
    const g = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxWidthPx=480&skipHttpRedirect=true&key=${key}`,
      { cache: "no-store" }
    );
    const j = g.ok ? await g.json() : null;
    if (!j?.photoUri) return new Response(null, { status: 404, headers: { "Cache-Control": "public, s-maxage=3600" } });
    return new Response(null, {
      status: 302,
      headers: { Location: j.photoUri, "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
