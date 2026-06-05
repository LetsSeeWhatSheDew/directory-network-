// scripts/geocode-dispensaries.ts
// =============================================================================
// Geocode every dispensary address and write back lat/lng + geocode_status.
//
// Registry coordinates are hand-estimated and approximate. Before any
// radius / distance math runs in Phase 6, every store needs verified
// coordinates from a real geocoder.
//
// Provider
//   Uses Nominatim (OpenStreetMap) as the default. Free, no API key, rate-
//   limited to ~1 req/sec — fine for 10 stores. Set GEOCODER=google + a
//   GOOGLE_MAPS_API_KEY to use Google Geocoding for higher precision.
//
// Idempotency
//   Reads every row from `dispensaries`, geocodes any with geocode_status
//   = 'approx' or 'failed'. Skips 'verified' rows. Pass --force to
//   re-geocode all rows.
//
// Usage
//   # dry-run
//   npx tsx scripts/geocode-dispensaries.ts
//
//   # apply
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/geocode-dispensaries.ts --apply
//
//   # re-geocode everything
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/geocode-dispensaries.ts --apply --force
//
//   # use Google geocoder
//   GEOCODER=google GOOGLE_MAPS_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npx tsx scripts/geocode-dispensaries.ts --apply
//
// Safety
//   - Sanity check: result must be within IL bounding box
//     (lat 36.97..42.51, lng -91.51..-87.50). Otherwise marks 'failed'.
//   - Logs each lookup with provider response so failures are debuggable.
// =============================================================================

import { argv, exit, env } from "node:process";

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PROVIDER = (env.GEOCODER || "nominatim").toLowerCase();
const GOOGLE_KEY = env.GOOGLE_MAPS_API_KEY;

const APPLY = argv.includes("--apply");
const FORCE = argv.includes("--force");

if (APPLY && !SERVICE_KEY) {
  console.error("ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY in env.");
  exit(1);
}
if (PROVIDER === "google" && !GOOGLE_KEY) {
  console.error("ERROR: GEOCODER=google requires GOOGLE_MAPS_API_KEY in env.");
  exit(1);
}

const READ_KEY = SERVICE_KEY || ANON_KEY;
if (!READ_KEY) {
  console.error(
    "ERROR: set NEXT_PUBLIC_SUPABASE_ANON_KEY for dry-run or SUPABASE_SERVICE_ROLE_KEY for apply."
  );
  exit(1);
}

const USER_AGENT =
  "PuffPriceMenuPipeline/1.0 (contact=team@puffprice.com; +https://puffprice.com/about)";

const IL_BBOX = {
  lat_min: 36.97,
  lat_max: 42.51,
  lng_min: -91.51,
  lng_max: -87.50,
};

interface Dispensary {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  geocode_status: "approx" | "verified" | "failed";
}

interface GeocodeResult {
  lat: number;
  lng: number;
  provider: string;
  raw: unknown;
}

async function fetchDispensaries(): Promise<Dispensary[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/dispensaries?select=id,slug,name,address,city,state,zip,lat,lng,geocode_status&is_active=eq.true&order=slug`,
    {
      headers: {
        apikey: READ_KEY!,
        Authorization: `Bearer ${READ_KEY!}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Fetch dispensaries failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as Dispensary[];
}

function buildQuery(d: Dispensary): string {
  // Prefer full street address. Fall back to "City, State ZIP" for stores
  // whose registry entry only has city-level address (Ivy Hall, Cookies).
  const parts: string[] = [];
  const addr = (d.address ?? "").trim();
  // "Peoria Heights, IL" matches city pattern, not street -- skip if so.
  const isJustCity = /^[A-Za-z .'-]+,\s*IL\b/i.test(addr) && !/\d/.test(addr);
  if (addr && !isJustCity) parts.push(addr);
  parts.push(d.city);
  parts.push(d.state);
  if (d.zip) parts.push(d.zip);
  return parts.join(", ");
}

async function geocodeNominatim(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}: ${await res.text()}`);
  const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (arr.length === 0) return null;
  return {
    lat: Number(arr[0].lat),
    lng: Number(arr[0].lon),
    provider: "nominatim",
    raw: arr[0],
  };
}

async function geocodeGoogle(query: string): Promise<GeocodeResult | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    status: string;
    results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  };
  if (json.status !== "OK" || json.results.length === 0) return null;
  const loc = json.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng, provider: "google", raw: json.results[0] };
}

async function geocode(query: string): Promise<GeocodeResult | null> {
  if (PROVIDER === "google") return geocodeGoogle(query);
  return geocodeNominatim(query);
}

function inIllinois(lat: number, lng: number): boolean {
  return (
    lat >= IL_BBOX.lat_min &&
    lat <= IL_BBOX.lat_max &&
    lng >= IL_BBOX.lng_min &&
    lng <= IL_BBOX.lng_max
  );
}

async function patchDispensary(
  id: string,
  patch: { lat?: number; lng?: number; geocode_status: "verified" | "failed"; geocoded_at: string }
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/dispensaries?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`PATCH ${id} failed: ${res.status} ${await res.text()}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  console.log(`Geocoder: ${PROVIDER}  apply=${APPLY}  force=${FORCE}\n`);

  const all = await fetchDispensaries();
  const todo = FORCE ? all : all.filter((d) => d.geocode_status !== "verified");

  console.log(`Dispensaries total=${all.length}  to geocode=${todo.length}\n`);

  let ok = 0;
  let failed = 0;
  let skippedSanity = 0;

  for (const d of todo) {
    const q = buildQuery(d);
    process.stdout.write(`  ${d.slug.padEnd(30)}  "${q}" … `);
    try {
      const r = await geocode(q);
      if (!r) {
        console.log("no result");
        failed++;
        if (APPLY) {
          await patchDispensary(d.id, { geocode_status: "failed", geocoded_at: new Date().toISOString() });
        }
      } else if (!inIllinois(r.lat, r.lng)) {
        console.log(`out of IL (${r.lat},${r.lng}) — skip`);
        skippedSanity++;
        if (APPLY) {
          await patchDispensary(d.id, { geocode_status: "failed", geocoded_at: new Date().toISOString() });
        }
      } else {
        const drift = d.lat && d.lng ? haversineMiles(d.lat, d.lng, r.lat, r.lng) : null;
        console.log(`${r.lat.toFixed(5)}, ${r.lng.toFixed(5)} (${r.provider})${drift !== null ? ` drift ${drift.toFixed(2)}mi` : ""}`);
        ok++;
        if (APPLY) {
          await patchDispensary(d.id, {
            lat: r.lat,
            lng: r.lng,
            geocode_status: "verified",
            geocoded_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message}`);
      failed++;
    }
    // Nominatim usage policy: <= 1 req/sec
    if (PROVIDER === "nominatim") await sleep(1100);
  }

  console.log(
    `\n${APPLY ? "Applied" : "Dry-run"}: ok=${ok}  failed=${failed}  out-of-IL=${skippedSanity}`
  );
  if (!APPLY) console.log("Pass --apply to write lat/lng back to Supabase.");
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

main().catch((e) => {
  console.error(e);
  exit(1);
});
