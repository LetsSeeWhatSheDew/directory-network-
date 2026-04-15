/**
 * Fetch dispensary listings for a given city from Supabase.
 *
 * Uses the same REST-over-HTTP pattern as the rest of the codebase
 * (SUPABASE_URL + SUPABASE_SERVICE_KEY env vars, no-store cache).
 */

export type CityListing = {
  id: string;
  project_tag: string;
  listing_name: string;
  listing_title: string | null;
  city: string | null;
  state: string | null;
  short_description: string | null;
  is_featured: boolean;
  plan_tier: string | null;
};

export async function fetchCityListings(
  city: string,
  state = "IL"
): Promise<CityListing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // Gracefully degrade — static content still renders
    return [];
  }

  const base = url.replace(/\/$/, "");
  const endpoint =
    `${base}/rest/v1/master_listings` +
    `?project_tag=eq.green` +
    `&city=ilike.${encodeURIComponent(city)}` +
    `&state=ilike.${encodeURIComponent(state)}` +
    `&select=*` +
    `&order=is_featured.desc`;

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

    return (await res.json()) as CityListing[];
  } catch (err) {
    console.error("Error fetching city listings:", err);
    return [];
  }
}
