#!/usr/bin/env tsx
// scripts/backfill-logos-from-google-places.ts
// =============================================================================
// Backfill master_listings.logo_url + lat/lng from the Google Places API (New).
//
// Default behavior is DRY-RUN — no DB writes, just prints what it would do.
// Pass --apply to actually persist UPDATEs.
//
// Differences from the older scripts/backfill-logos-google-places.ts:
//   • Dry-run by default (older script wrote on every run; risky for quota/cost).
//   • --apply flag is required to commit.
//   • Per-row skip logging includes a reason code.
//   • Hard cap of MAX_REQUESTS per run (Places free-tier guardrail).
//   • Pacing uses a token bucket (1 req/sec) — both Text Search and Place
//     Details count toward the budget.
//   • Optional --slug=<slug> flag to backfill a single dispensary (e.g.,
//     after applying the orphan-listings migration).
//
// Setup
//   1. `vercel env pull .env.local` to get GOOGLE_PLACES_API_KEY +
//      SUPABASE_SERVICE_ROLE_KEY locally.
//   2. `npx tsx scripts/backfill-logos-from-google-places.ts` (dry-run)
//   3. Inspect the dry-run log. If it looks right:
//      `npx tsx scripts/backfill-logos-from-google-places.ts --apply`
//
// Cost (as of Apr 2026)
//   • Text Search:  $32 / 1,000 calls (Places API New "Text Search Pro")
//   • Place Details: $17 / 1,000 calls (we don't actually need it — Text
//     Search already returns photos[] and location, see notes below).
//   • At 49 IL dispensaries missing a logo: ~$1.57 worst case.
// =============================================================================

import { argv, exit, env } from "node:process";

// ----------------------------- env + flags -----------------------------------

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PLACES_KEY = env.GOOGLE_PLACES_API_KEY;

const APPLY = argv.includes("--apply");
const SLUG_FLAG = argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const MAX_REQUESTS = 100;            // hard cap per run
const PACE_MS = 1000;                // 1 req/sec — well under quota

if (!PLACES_KEY) {
  console.error(
    "ERROR: GOOGLE_PLACES_API_KEY is not set. Run `vercel env pull .env.local` " +
      "or export it before running this script."
  );
  exit(1);
}
if (!SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: SUPABASE_SERVICE_ROLE_KEY is not set. Required to UPDATE master_listings."
  );
  exit(1);
}

console.log(`mode=${APPLY ? "APPLY" : "DRY-RUN"} slug=${SLUG_FLAG || "(all missing)"} cap=${MAX_REQUESTS} pace=${PACE_MS}ms`);

// ----------------------------- types -----------------------------------------

type Listing = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  logo_url: string | null;
  lat: number | null;
  lng: number | null;
};

type PlaceSearchResult = {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    photos?: Array<{ name: string }>;
    location?: { latitude?: number; longitude?: number };
    formattedAddress?: string;
  }>;
};

// ----------------------------- helpers ---------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchListings(): Promise<Listing[]> {
  // Default: pull every IL/green row that's still missing logo OR coords.
  // With --slug=, target just that one (handy after creating new rows).
  const baseFilter =
    SLUG_FLAG
      ? `slug=eq.${encodeURIComponent(SLUG_FLAG)}`
      : `state=eq.IL&project_tag=eq.green&or=(logo_url.is.null,lat.is.null)`;
  const url =
    `${SUPABASE_URL}/rest/v1/master_listings?${baseFilter}` +
    `&select=id,slug,name,city,logo_url,lat,lng&limit=500`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fetchListings failed ${res.status}: ${t}`);
  }
  return (await res.json()) as Listing[];
}

async function textSearch(query: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY as string,
      // Field mask drives cost — we ask only for what we need.
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.photos,places.location,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.warn(`  textSearch ${res.status}: ${query} :: ${t.slice(0, 120)}`);
    return null;
  }
  const data = (await res.json()) as PlaceSearchResult;
  return data.places?.[0] ?? null;
}

async function updateRow(
  id: string,
  patch: { logo_url?: string; lat?: number; lng?: number }
) {
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

// ----------------------------- main ------------------------------------------

(async () => {
  const listings = await fetchListings();
  console.log(`Considering ${listings.length} listings.`);

  let calls = 0;
  let updated = 0;
  let skipped_no_match = 0;
  let skipped_no_data = 0;
  let skipped_already_complete = 0;
  let skipped_capped = 0;

  for (const l of listings) {
    if (calls >= MAX_REQUESTS) {
      skipped_capped++;
      console.log(`  CAP HIT — stopping. ${listings.length - calls} listings remain.`);
      break;
    }

    // Skip rows that already have everything we'd backfill.
    if (l.logo_url && l.lat != null && l.lng != null) {
      skipped_already_complete++;
      continue;
    }

    const q = `${l.name} dispensary ${l.city || ""} IL`.trim();
    const place = await textSearch(q);
    calls++;

    if (!place) {
      skipped_no_match++;
      console.log(`  SKIP no-match  ${l.slug}  q="${q}"`);
      await sleep(PACE_MS);
      continue;
    }

    const patch: { logo_url?: string; lat?: number; lng?: number } = {};
    const photoName = place.photos?.[0]?.name;
    if (!l.logo_url && photoName) {
      patch.logo_url =
        `https://places.googleapis.com/v1/${photoName}/media` +
        `?maxWidthPx=400&key=${PLACES_KEY}`;
    }
    if (l.lat == null && typeof place.location?.latitude === "number") {
      patch.lat = place.location.latitude;
    }
    if (l.lng == null && typeof place.location?.longitude === "number") {
      patch.lng = place.location.longitude;
    }

    if (Object.keys(patch).length === 0) {
      skipped_no_data++;
      console.log(`  SKIP no-data   ${l.slug}  match="${place.displayName?.text}" addr="${place.formattedAddress}"`);
      await sleep(PACE_MS);
      continue;
    }

    const fields = Object.keys(patch).join(",");
    if (APPLY) {
      await updateRow(l.id, patch);
      updated++;
      console.log(`  WRITE          ${l.slug}  ← ${fields}`);
    } else {
      updated++;
      console.log(`  WOULD-WRITE    ${l.slug}  ← ${fields}  (lat=${patch.lat ?? "—"} lng=${patch.lng ?? "—"} logo=${patch.logo_url ? "yes" : "no"})`);
    }
    await sleep(PACE_MS);
  }

  console.log("");
  console.log("=== SUMMARY ===");
  console.log(`mode:                       ${APPLY ? "APPLY (rows written)" : "DRY-RUN (no writes)"}`);
  console.log(`listings considered:        ${listings.length}`);
  console.log(`Places API calls:           ${calls}`);
  console.log(`updated/would-update:       ${updated}`);
  console.log(`skipped (already complete): ${skipped_already_complete}`);
  console.log(`skipped (no Places match):  ${skipped_no_match}`);
  console.log(`skipped (no usable data):   ${skipped_no_data}`);
  console.log(`skipped (cap hit):          ${skipped_capped}`);
  console.log("");
  console.log(`Estimated cost (Text Search at $32/1k): $${(calls * 0.032).toFixed(4)}`);
  if (!APPLY) {
    console.log("Re-run with --apply to persist these changes.");
  }
})().catch((e) => {
  console.error("FATAL:", e);
  exit(1);
});
