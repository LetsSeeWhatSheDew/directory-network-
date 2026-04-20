// scripts/backfill-logos-google-places.ts
//
// One-shot backfill for master_listings.logo_url and lat/lng using the
// Google Places API (New). Intended to run after Matthew provisions a
// restricted API key in Google Cloud Console and adds it to Vercel env
// as GOOGLE_PLACES_API_KEY (server-side; NOT NEXT_PUBLIC_).
//
// Strategy
//   1. Fetch every IL green-tag master_listing where logo_url IS NULL.
//   2. For each, call Places Text Search v1 with `{name} dispensary {city} IL`.
//   3. Take the first result's `photos[0].name` and construct the
//      Place Photo media URL. That URL IS the image — store it AS
//      logo_url (Google serves the bytes directly, no proxy needed).
//   4. Also extract `location.latitude` / `location.longitude` and
//      backfill lat/lng at the same time. Only 1/61 dispensaries has
//      coords today — this run fixes the ranking-distance gap.
//   5. Rate-limit 500ms per call to stay well under Places quota.
//
// Run once:
//   npx tsx scripts/backfill-logos-google-places.ts
//
// The script is idempotent: it only touches rows where logo_url IS NULL,
// so re-runs only cover rows the previous run didn't fill.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!PLACES_KEY) {
  console.error(
    "ERROR: GOOGLE_PLACES_API_KEY is not set. Add it to .env.local (for local runs) or Vercel env, then retry."
  );
  process.exit(1);
}
if (!SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: SUPABASE_SERVICE_ROLE_KEY is not set. Required to UPDATE master_listings from a script."
  );
  process.exit(1);
}

type Listing = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
};

async function fetchNullLogoListings(): Promise<Listing[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/master_listings?state=eq.IL&project_tag=eq.green&logo_url=is.null&select=id,slug,name,city&limit=500`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY as string,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fetchNullLogoListings failed ${res.status}: ${t}`);
  }
  return (await res.json()) as Listing[];
}

type PlaceSearchResult = {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    photos?: Array<{ name: string }>;
    location?: { latitude?: number; longitude?: number };
  }>;
};

async function textSearch(query: string): Promise<PlaceSearchResult["places"] extends Array<infer T> | undefined ? (T extends undefined ? never : T) | null : never> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY as string,
      "X-Goog-FieldMask": "places.id,places.displayName,places.photos,places.location",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  if (!res.ok) {
    console.warn(`  textSearch ${res.status}: ${query}`);
    return null as any;
  }
  const data = (await res.json()) as PlaceSearchResult;
  return (data.places?.[0] ?? null) as any;
}

async function updateRow(
  id: string,
  patch: { logo_url?: string; lat?: number; lng?: number }
) {
  if (Object.keys(patch).length === 0) return;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/master_listings?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_KEY as string,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    console.warn(`  updateRow ${id} failed ${res.status}: ${t}`);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const listings = await fetchNullLogoListings();
  console.log(`Processing ${listings.length} listings with NULL logo_url…`);
  let ok = 0;
  let skipped = 0;
  for (const l of listings) {
    const q = `${l.name} dispensary ${l.city || ""} IL`.trim();
    const place = await textSearch(q);
    if (!place) {
      skipped++;
      console.log(`  skip: no place match for ${l.slug}`);
      await sleep(500);
      continue;
    }
    const patch: { logo_url?: string; lat?: number; lng?: number } = {};
    const photoName = place.photos?.[0]?.name;
    if (photoName) {
      patch.logo_url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${PLACES_KEY}`;
    }
    if (typeof place.location?.latitude === "number") patch.lat = place.location.latitude;
    if (typeof place.location?.longitude === "number") patch.lng = place.location.longitude;
    if (Object.keys(patch).length === 0) {
      skipped++;
      console.log(`  skip: place match but no photo+location for ${l.slug}`);
      await sleep(500);
      continue;
    }
    await updateRow(l.id, patch);
    ok++;
    console.log(
      `  ok: ${l.slug} ← ${patch.logo_url ? "logo " : ""}${patch.lat ? "coords" : ""}`
    );
    await sleep(500);
  }
  console.log(`Done. updated=${ok} skipped=${skipped}`);
})();
