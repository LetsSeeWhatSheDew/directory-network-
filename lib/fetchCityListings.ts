/**
 * Fetch dispensary listings for a given city from Supabase.
 *
 * Previously this function queried columns that don't exist in
 * `master_listings` (is_featured, plan_tier, listing_title), which made
 * PostgREST return HTTP 400 and the caller fall through to an empty
 * array. Result: Peoria, Bloomington, and every other populated Central
 * IL city rendered the "we're building the directory now" empty-state
 * while real listings existed in the database. Mapping the raw row
 * shape here keeps the CityPage component's usage stable without a
 * schema change.
 */

export type CityListing = {
  id: string;
  slug: string | null;
  project_tag: string;
  listing_name: string;
  listing_title: string | null;
  city: string | null;
  state: string | null;
  short_description: string | null;
  is_featured: boolean;
  plan_tier: string | null;
};

type MasterListingRow = {
  id: string;
  slug: string | null;
  name: string | null;
  city: string | null;
  state: string | null;
  long_description: string | null;
  project_tag: string;
};

/**
 * Trim a long_description into a short blurb for the city-page listing
 * card. Roughly 1-2 sentences — just enough signal so the card isn't
 * bare. Falls back to a simple city-framed stub when there's no prose.
 */
function shortBlurb(row: MasterListingRow): string | null {
  const src = (row.long_description || "").trim();
  if (!src) return null;
  // First sentence, capped at 200 chars to fit the line-clamp-3 card.
  const firstSentence = src.split(/(?<=[.!?])\s+/)[0] || src;
  return firstSentence.length > 200 ? firstSentence.slice(0, 197) + "…" : firstSentence;
}

export async function fetchCityListings(
  city: string,
  state = "IL"
): Promise<CityListing[]> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "https://hnbjufmtmrhexmdrfubw.supabase.co");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300"));

  if (!url || !key) {
    // Gracefully degrade — static content still renders
    return [];
  }

  const base = url.replace(/\/$/, "");
  const endpoint =
    `${base}/rest/v1/master_listings` +
    `?project_tag=eq.green` +
    `&is_active=eq.true` +
    `&city=ilike.${encodeURIComponent(city)}` +
    `&state=ilike.${encodeURIComponent(state)}` +
    `&select=id,slug,name,city,state,long_description,project_tag` +
    `&order=name.asc`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch city listings:", await res.text());
      return [];
    }

    const rows = (await res.json()) as MasterListingRow[];
    if (!Array.isArray(rows)) return [];
    return rows.map<CityListing>((row) => ({
      id: row.id,
      slug: row.slug,
      project_tag: row.project_tag,
      listing_name: row.name || row.slug || "Dispensary",
      listing_title: row.name,
      city: row.city,
      state: row.state,
      short_description: shortBlurb(row),
      is_featured: false,
      plan_tier: null,
    }));
  } catch (err) {
    console.error("Error fetching city listings:", err);
    return [];
  }
}
