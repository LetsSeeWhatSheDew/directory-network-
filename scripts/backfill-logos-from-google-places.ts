#!/usr/bin/env tsx
// scripts/backfill-logos-from-google-places.ts
// =============================================================================
// Backfill master_listings.logo_url + lat/lng from the Google Places API (New).
//
// Default behavior is DRY-RUN — no DB writes, just prints what it would do
// and drops a JSON report at /tmp/places-backfill-dryrun-YYYYMMDD.json
// for review. Pass --live (or --apply) to actually persist UPDATEs.
//
// Scope defaults to the 11 Central Illinois cities (see
// lib/constants/regions.ts). Override with --cities=slug1,slug2 to target a
// specific set, or --slug=<listing-slug> for a single dispensary (e.g.,
// after applying an orphan-listings migration).
//
// Setup
//   1. `vercel env pull .env.local` — pulls Supabase keys into local env.
//      NOTE: GOOGLE_PLACES_API_KEY is marked "Sensitive" in Vercel, which
//      means `vercel env pull` will NOT include it. Manually add to
//      .env.local:
//          GOOGLE_PLACES_API_KEY=<paste-from-Vercel-project-settings>
//      (Restricted to the Places API only; safe to put in .env.local since
//      it never ships to the browser.)
//   2. `npx tsx scripts/backfill-logos-from-google-places.ts` (dry-run)
//   3. Inspect /tmp/places-backfill-dryrun-YYYYMMDD.json. If it looks right:
//      `npx tsx scripts/backfill-logos-from-google-places.ts --live`
//
// Rules
//   - logo_url is backfilled as a FALLBACK only — if the row already has a
//     logo_url, we leave it alone (a Places storefront photo is usually
//     not an actual logo).
//   - lat/lng are ALWAYS updated when the Places match returns coordinates.
//     Only 1 of 111 master_listings rows has coords today, so overwriting
//     is a net gain even for the one populated row.
//   - Up to 3 additional photo references are captured in the dry-run JSON
//     for future use (e.g., a future photo_gallery column); they are NOT
//     written to Supabase today because no such column exists.
//
// Cost (as of Apr 2026)
//   - Text Search:  $32 / 1,000 calls ("Text Search Pro")
//   - Place Photos: $7 / 1,000 calls (only if we fetch the photo URL; we
//     construct the media URL directly from photos[].name so we don't pay
//     for Photos during the backfill itself — the URL is served on-demand
//     when a user views a listing).
//   - Central IL (~30 listings × 1 Text Search each) ≈ $0.96 against $300
//     free-trial credit.
// =============================================================================

import { argv, exit, env } from "node:process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { CENTRAL_IL_CITIES } from "../lib/constants/regions";

// ----------------------------- env + flags -----------------------------------

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PLACES_KEY = env.GOOGLE_PLACES_API_KEY;

// --live is the spec-named flag; --apply is kept as a synonym for backward
// compatibility with older commits that referenced the previous flag name.
const APPLY = argv.includes("--apply") || argv.includes("--live");

const SLUG_FLAG = argv.find((a) => a.startsWith("--slug="))?.split("=")[1];

const CITIES_FLAG = argv.find((a) => a.startsWith("--cities="))?.split("=")[1];
const CITY_SLUGS = CITIES_FLAG
  ? CITIES_FLAG.split(",").map((s) => s.trim()).filter(Boolean)
  : SLUG_FLAG
  ? null // --slug overrides --cities; keep cities null
  : CENTRAL_IL_CITIES.map((c) => c.slug); // default scope

const MAX_REQUESTS = 100; // hard cap per run
const PACE_MS = 1000; // 1 req/sec — well under quota

if (!PLACES_KEY) {
  console.error(
    "ERROR: GOOGLE_PLACES_API_KEY is not set. See the header of this file " +
      "for how to add it to .env.local (Sensitive var, won't come from `vercel env pull`)."
  );
  exit(1);
}
if (!SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: SUPABASE_SERVICE_ROLE_KEY is not set. Required to UPDATE master_listings."
  );
  exit(1);
}

function scopeLabel(): string {
  if (SLUG_FLAG) return `slug=${SLUG_FLAG}`;
  if (CITIES_FLAG) return `cities=${CITIES_FLAG}`;
  return `cities=central-il(${CENTRAL_IL_CITIES.length})`;
}

console.log("");
console.log("=== Google Places backfill ===");
console.log(`mode:      ${APPLY ? "LIVE (will write)" : "DRY-RUN (no writes)"}`);
console.log(`scope:     ${scopeLabel()}`);
console.log(`cap:       ${MAX_REQUESTS} Places calls`);
console.log(`pace:      ${PACE_MS}ms between calls`);
console.log("");

// ----------------------------- types -----------------------------------------

type Listing = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  address1: string | null;
  state: string | null;
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

type ResultStatus =
  | "would-write"
  | "wrote"
  | "no-match"
  | "no-data"
  | "already-complete"
  | "capped"
  | "ambiguous-city";

type ResultRow = {
  slug: string;
  name: string;
  city: string | null;
  query: string;
  status: ResultStatus;
  match?: {
    placeId: string;
    displayName: string | null;
    formattedAddress: string | null;
    location: { latitude: number | null; longitude: number | null };
  };
  wouldUpdate?: {
    logo_url?: string;
    lat?: number;
    lng?: number;
  };
  additionalPhotoRefs?: string[]; // up to 3 photos[].name beyond photos[0]
};

// ----------------------------- helpers ---------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function todayStamp(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function fetchListings(): Promise<Listing[]> {
  // --slug takes precedence; otherwise filter by IL/green and we'll
  // narrow by city in-memory below (PostgREST `in.` handling of names
  // with spaces / commas is fiddly enough that JS-side filtering is
  // cleaner).
  const filter = SLUG_FLAG
    ? `slug=eq.${encodeURIComponent(SLUG_FLAG)}`
    : `state=eq.IL&project_tag=eq.green&or=(logo_url.is.null,lat.is.null,lng.is.null)`;
  const url =
    `${SUPABASE_URL}/rest/v1/master_listings?${filter}` +
    `&select=id,slug,name,city,address1,state,logo_url,lat,lng&limit=500`;
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

function cityMatchesScope(cityName: string | null): boolean {
  if (SLUG_FLAG) return true; // scope is already narrowed to one slug
  if (!CITY_SLUGS) return true; // shouldn't happen, but safe
  if (!cityName) return false;
  // Build a name-based set once per call (cheap at 11 elements).
  const scopedNames = new Set(
    CITY_SLUGS.map((slug) => {
      const found = CENTRAL_IL_CITIES.find((c) => c.slug === slug);
      return (found?.name || slug).toLowerCase();
    })
  );
  return scopedNames.has(cityName.toLowerCase());
}

async function textSearch(query: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY as string,
      // Field mask drives cost — request only what we need.
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.photos,places.location,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.warn(`  textSearch ${res.status}: ${query} :: ${t.slice(0, 120)}`);
    return null;
  }
  const data = (await res.json()) as PlaceSearchResult;
  return data.places ?? null;
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

function buildPhotoMediaUrl(photoName: string): string {
  return (
    `https://places.googleapis.com/v1/${photoName}/media` +
    `?maxWidthPx=400&key=${PLACES_KEY}`
  );
}

function writeDryRunReport(
  outputPath: string,
  summary: Record<string, unknown>,
  rows: ResultRow[]
) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    JSON.stringify(
      { summary, results: rows },
      null,
      2
    )
  );
  console.log(`  dry-run JSON → ${outputPath}`);
}

// ----------------------------- main ------------------------------------------

(async () => {
  const allListings = await fetchListings();
  const listings = allListings.filter((l) => cityMatchesScope(l.city));
  const droppedForScope = allListings.length - listings.length;

  // Cost estimate at START — the spec wants this up front so Matthew can
  // bail before burning quota on a wider run than intended.
  const projectedCalls = Math.min(listings.length, MAX_REQUESTS);
  const projectedCostUsd = (projectedCalls * 32) / 1000; // $32/1k for Text Search
  console.log(`listings found:            ${allListings.length} (dropped ${droppedForScope} outside scope)`);
  console.log(`listings in scope:         ${listings.length}`);
  console.log(`projected Places calls:    ${projectedCalls} (cap at ${MAX_REQUESTS})`);
  console.log(`projected cost (USD):      $${projectedCostUsd.toFixed(4)} (Text Search @ $32/1k)`);
  console.log("");

  let calls = 0;
  const rows: ResultRow[] = [];
  let updated = 0;
  let skipped_no_match = 0;
  let skipped_no_data = 0;
  let skipped_already_complete = 0;
  let skipped_capped = 0;

  for (const l of listings) {
    if (calls >= MAX_REQUESTS) {
      skipped_capped++;
      rows.push({
        slug: l.slug,
        name: l.name,
        city: l.city,
        query: "",
        status: "capped",
      });
      console.log(`  CAP HIT — stopping. ${listings.length - calls} listings remain.`);
      break;
    }

    // A row is "already complete" only when it has logo + both coords.
    if (l.logo_url && l.lat != null && l.lng != null) {
      skipped_already_complete++;
      rows.push({
        slug: l.slug,
        name: l.name,
        city: l.city,
        query: "",
        status: "already-complete",
      });
      continue;
    }

    const addrBit = l.address1 ? `${l.address1}, ` : "";
    const q = `${l.name} ${addrBit}${l.city || ""} IL dispensary`.replace(/\s+/g, " ").trim();
    const places = await textSearch(q);
    calls++;

    if (!places || places.length === 0) {
      skipped_no_match++;
      rows.push({
        slug: l.slug,
        name: l.name,
        city: l.city,
        query: q,
        status: "no-match",
      });
      console.log(`  SKIP no-match  ${l.slug}  q="${q}"`);
      await sleep(PACE_MS);
      continue;
    }

    const place = places[0];
    const patch: { logo_url?: string; lat?: number; lng?: number } = {};
    const photoName = place.photos?.[0]?.name;
    // logo_url: FALLBACK only — don't overwrite an existing logo.
    if (!l.logo_url && photoName) {
      patch.logo_url = buildPhotoMediaUrl(photoName);
    }
    // lat/lng: always update when Places returns coordinates. Only 1/111
    // rows has coords today, so overwriting is a net gain.
    if (typeof place.location?.latitude === "number") {
      patch.lat = place.location.latitude;
    }
    if (typeof place.location?.longitude === "number") {
      patch.lng = place.location.longitude;
    }

    const additionalPhotoRefs = (place.photos || [])
      .slice(1, 4) // up to 3 beyond photos[0]
      .map((p) => p.name);

    const commonFields = {
      slug: l.slug,
      name: l.name,
      city: l.city,
      query: q,
      match: {
        placeId: place.id,
        displayName: place.displayName?.text ?? null,
        formattedAddress: place.formattedAddress ?? null,
        location: {
          latitude: place.location?.latitude ?? null,
          longitude: place.location?.longitude ?? null,
        },
      },
      additionalPhotoRefs,
    };

    if (Object.keys(patch).length === 0) {
      skipped_no_data++;
      rows.push({ ...commonFields, status: "no-data" });
      console.log(`  SKIP no-data   ${l.slug}  match="${place.displayName?.text}" addr="${place.formattedAddress}"`);
      await sleep(PACE_MS);
      continue;
    }

    if (APPLY) {
      await updateRow(l.id, patch);
      updated++;
      rows.push({ ...commonFields, status: "wrote", wouldUpdate: patch });
      console.log(`  WRITE          ${l.slug}  ← ${Object.keys(patch).join(",")}`);
    } else {
      updated++;
      rows.push({ ...commonFields, status: "would-write", wouldUpdate: patch });
      console.log(
        `  WOULD-WRITE    ${l.slug}  ← ${Object.keys(patch).join(",")}` +
          `  (lat=${patch.lat ?? "—"} lng=${patch.lng ?? "—"} logo=${patch.logo_url ? "yes" : "no"})`
      );
    }
    await sleep(PACE_MS);
  }

  const actualCostUsd = (calls * 32) / 1000;
  const summary = {
    ranAt: new Date().toISOString(),
    mode: APPLY ? "LIVE" : "DRY-RUN",
    scope: SLUG_FLAG ? { slug: SLUG_FLAG } : { cities: CITY_SLUGS },
    budget: { maxRequests: MAX_REQUESTS, paceMs: PACE_MS },
    listingsFound: allListings.length,
    listingsOutsideScope: droppedForScope,
    listingsInScope: listings.length,
    placesCallsMade: calls,
    estimatedCostUsd: Number(actualCostUsd.toFixed(4)),
    counts: {
      updated,
      skipped_already_complete,
      skipped_no_match,
      skipped_no_data,
      skipped_capped,
    },
  };

  console.log("");
  console.log("=== SUMMARY ===");
  console.log(`mode:                       ${APPLY ? "LIVE (rows written)" : "DRY-RUN (no writes)"}`);
  console.log(`listings considered:        ${listings.length}`);
  console.log(`Places API calls:           ${calls}`);
  console.log(`${APPLY ? "updated" : "would-update"}:               ${updated}`);
  console.log(`skipped (already complete): ${skipped_already_complete}`);
  console.log(`skipped (no Places match):  ${skipped_no_match}`);
  console.log(`skipped (no usable data):   ${skipped_no_data}`);
  console.log(`skipped (cap hit):          ${skipped_capped}`);
  console.log("");
  console.log(`Estimated cost (Text Search @ $32/1k): $${actualCostUsd.toFixed(4)}`);

  if (!APPLY) {
    const outputPath = `/tmp/places-backfill-dryrun-${todayStamp()}.json`;
    writeDryRunReport(outputPath, summary, rows);
    console.log("");
    console.log("Re-run with --live to persist these changes.");
  }
})().catch((e) => {
  console.error("FATAL:", e);
  exit(1);
});
