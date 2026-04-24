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
// Fields backfilled (default: all):
//   - logo_url   (fallback only — never overwrites an existing logo)
//   - lat, lng   (always updated when Places returns coords)
//   - phone      (fallback only — only when master_listings.phone is NULL)
//   - website    (fallback only — only when master_listings.website is NULL)
//   - hours      (inserted into listing_hours, but only when a listing has
//                 ZERO existing listing_hours rows — never overwrites
//                 manual / higher-trust hours data)
// Use --fields=phone,website to limit to specific fields.
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
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
// Accept either name — .env.local in some worktrees uses SUPABASE_SERVICE_KEY,
// while the canonical Vercel var is SUPABASE_SERVICE_ROLE_KEY.
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
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

type Field = "logo" | "coords" | "phone" | "website" | "hours";
const ALL_FIELDS: Field[] = ["logo", "coords", "phone", "website", "hours"];
const FIELDS_FLAG = argv.find((a) => a.startsWith("--fields="))?.split("=")[1];
const FIELDS: Set<Field> = new Set(
  FIELDS_FLAG
    ? (FIELDS_FLAG.split(",").map((s) => s.trim().toLowerCase()) as Field[])
        .filter((f) => (ALL_FIELDS as string[]).includes(f))
    : ALL_FIELDS,
);

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
console.log(`fields:    ${Array.from(FIELDS).join(",")}`);
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
  phone: string | null;
  website: string | null;
  project_tag: string | null;
};

type PlacePeriod = {
  open?: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
};

type PlaceSearchResult = {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    photos?: Array<{ name: string }>;
    location?: { latitude?: number; longitude?: number };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    regularOpeningHours?: {
      periods?: PlacePeriod[];
      openNow?: boolean;
    };
  }>;
};

type ResultStatus =
  | "would-write"
  | "wrote"
  | "no-match"
  | "name-mismatch"
  | "no-data"
  | "already-complete"
  | "capped"
  | "ambiguous-city";

type HoursInsertRow = {
  project_tag: string;
  listing_id: string;
  weekday: number; // DB convention: 0=Mon..6=Sun
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

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
    phone?: string;
    website?: string;
  };
  wouldInsertHours?: HoursInsertRow[];
  hoursSkipReason?: "existing-rows" | "no-data" | "parse-error" | "disabled";
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
  // Pull every row in scope. We filter in-memory:
  //   - by the --fields flag (which fields to consider)
  //   - by null-ness of each relevant master_listings column
  //   - hours is a separate join-table check, done per-row below
  // The cost we care about is the Places API calls, not rows scanned.
  const filter = SLUG_FLAG
    ? `slug=eq.${encodeURIComponent(SLUG_FLAG)}`
    : `state=eq.IL&project_tag=eq.green`;
  const url =
    `${SUPABASE_URL}/rest/v1/master_listings?${filter}` +
    `&select=id,slug,name,city,address1,state,logo_url,lat,lng,phone,website,project_tag&limit=500`;
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
      // Field mask drives cost — request only what we need. We include
      // phone/website/regularOpeningHours here because they're covered by
      // the base Text Search SKU (no extra "Enterprise Atmosphere" charge).
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.photos,places.location,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours",
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

/**
 * Returns the number of existing listing_hours rows for a listing, or -1
 * if the count could not be determined (network blip, 5xx). Callers MUST
 * treat -1 as "unknown — skip the insert" to avoid duplicate rows.
 */
async function countExistingHours(listingId: string): Promise<number> {
  // One retry with a small backoff covers transient 502s from PostgREST.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await sleep(500);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listing_hours?listing_id=eq.${encodeURIComponent(listingId)}&select=listing_id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY as string,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          Prefer: "count=exact",
          "Range-Unit": "items",
        },
      },
    );
    if (!res.ok) {
      const t = await res.text();
      console.warn(
        `  countExistingHours ${listingId} attempt ${attempt + 1} failed ${res.status}: ${t.slice(0, 120)}`,
      );
      continue;
    }
    const cr = res.headers.get("content-range");
    if (cr) {
      const m = cr.match(/\/(\d+)$/);
      if (m) return Number(m[1]);
    }
    const body = (await res.json()) as Array<unknown>;
    return Array.isArray(body) ? body.length : 0;
  }
  // Both attempts failed. Signal "unknown" so we skip the hours insert
  // rather than risk duplicate rows (observed with high-haven-normal in
  // a prior run when 0 was assumed on 502).
  return -1;
}

async function insertHours(rows: HoursInsertRow[]) {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/listing_hours`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const t = await res.text();
    console.warn(`  insertHours failed ${res.status}: ${t.slice(0, 200)}`);
  }
}

// Google Places day convention: 0=Sun..6=Sat. DB convention: 0=Mon..6=Sun.
// Translate: dbWeekday = (googleDay + 6) % 7.
function gdayToDb(gday: number): number {
  return (gday + 6) % 7;
}

function padTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/**
 * Convert Google Places regularOpeningHours.periods into 7 DB rows
 * (one per weekday, Mon..Sun). Returns null on parse error.
 * Closed-all-day becomes `{is_closed: true}`. 24-hour open becomes
 * 00:00–24:00 (represented as 00:00:00..23:59:00 — we can't store 24:00
 * in a TIME column). If Places supplies neither open nor close for a
 * period block, we skip that block.
 */
function periodsToHoursRows(
  periods: PlacePeriod[] | undefined,
  projectTag: string,
  listingId: string,
): HoursInsertRow[] | null {
  if (!Array.isArray(periods)) return null;
  // Start every weekday as closed; fill in as periods say otherwise.
  const byDay: Record<number, { opens_at: string | null; closes_at: string | null; is_closed: boolean }> = {};
  for (let d = 0; d < 7; d++) byDay[d] = { opens_at: null, closes_at: null, is_closed: true };

  // Special case: some 24/7 places emit a single period with open.day=0,
  // hour=0, minute=0 and NO close field.
  if (periods.length === 1 && periods[0].open && !periods[0].close) {
    for (let d = 0; d < 7; d++) {
      byDay[d] = { opens_at: "00:00:00", closes_at: "23:59:00", is_closed: false };
    }
  } else {
    for (const p of periods) {
      if (!p.open) continue;
      const dbDay = gdayToDb(p.open.day);
      const opens = padTime(p.open.hour || 0, p.open.minute || 0);
      // If close is missing or on a different day than open, approximate
      // as same-day midnight (23:59). Hours editor can fix manually later.
      const closes = p.close
        ? padTime(p.close.hour || 0, p.close.minute || 0)
        : "23:59:00";
      byDay[dbDay] = { opens_at: opens, closes_at: closes, is_closed: false };
    }
  }

  const rows: HoursInsertRow[] = [];
  for (let d = 0; d < 7; d++) {
    rows.push({
      project_tag: projectTag,
      listing_id: listingId,
      weekday: d,
      opens_at: byDay[d].opens_at,
      closes_at: byDay[d].closes_at,
      is_closed: byDay[d].is_closed,
    });
  }
  return rows;
}

async function updateRow(
  id: string,
  patch: { logo_url?: string; lat?: number; lng?: number; phone?: string; website?: string }
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

// Valid area codes for Central IL metros. Any phone Places returns that
// sits outside this set is treated as a suspect match — the dispensary
// is probably tagged as the wrong branch of a chain. Covers 217, 309,
// 447 (the tri-county overlay). See
// https://en.wikipedia.org/wiki/List_of_North_American_Numbering_Plan_area_codes
const CENTRAL_IL_AREA_CODES = new Set(["217", "309", "447"]);

function phoneAreaCode(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const tenDigit =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits.slice(-10);
  return tenDigit.slice(0, 3);
}

function phoneLooksCentralIL(phone: string | null | undefined): boolean {
  const ac = phoneAreaCode(phone);
  return !!ac && CENTRAL_IL_AREA_CODES.has(ac);
}

/**
 * Loose name-match check to guard against Places returning a DIFFERENT
 * business at the same city. Example bad matches observed:
 *   listing="north-star-remedies-peoria-il"  places="Aroma Hill Dispensary - Peoria"
 *   listing="consume-cannabis-champaign"     places="Cloud9 Cannabis"
 * Both are same-city rebrands or nearby competitors — the address/coords
 * may be right but the phone/website point at a different business.
 *
 * Accept if the listing's first 5-char alphanumeric token is a substring
 * of the Places displayName (or vice versa). Rejects the rebrand cases
 * above while accepting legitimate matches like "Beyond Hello" →
 * "Beyond / Hello Cannabis Dispensary".
 */
function namesMatch(listingName: string, placeName: string | null | undefined): boolean {
  if (!placeName) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const a = norm(listingName);
  const b = norm(placeName);
  if (!a || !b) return false;
  const tokenA = a.slice(0, 5);
  const tokenB = b.slice(0, 5);
  return b.includes(tokenA) || a.includes(tokenB);
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
  let skipped_name_mismatch = 0;
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

    // A row is "already complete" only when every field we're asked to
    // backfill is already populated. For master_listings columns that's
    // a simple null check; for hours we run a cheap COUNT against
    // listing_hours. No Places call is made if there's nothing to do.
    const needsLogo = FIELDS.has("logo") && !l.logo_url;
    const needsCoords = FIELDS.has("coords") && (l.lat == null || l.lng == null);
    const needsPhone = FIELDS.has("phone") && !l.phone;
    const needsWebsite = FIELDS.has("website") && !l.website;
    let needsHours = false;
    let hoursPrecheckFailed = false;
    if (FIELDS.has("hours")) {
      const existing = await countExistingHours(l.id);
      if (existing < 0) {
        // Could not determine hours coverage — skip rather than guess.
        hoursPrecheckFailed = true;
      } else {
        needsHours = existing === 0;
      }
    }
    if (!needsLogo && !needsCoords && !needsPhone && !needsWebsite && !needsHours) {
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

    // Name-match guard — reject writes when the Places match looks like a
    // different business at the same address (rebrand or nearby competitor).
    // We still record the match detail in the dry-run JSON so a human can
    // reconcile manually.
    if (!namesMatch(l.name, place.displayName?.text)) {
      skipped_name_mismatch++;
      rows.push({
        slug: l.slug,
        name: l.name,
        city: l.city,
        query: q,
        status: "name-mismatch",
        match: {
          placeId: place.id,
          displayName: place.displayName?.text ?? null,
          formattedAddress: place.formattedAddress ?? null,
          location: {
            latitude: place.location?.latitude ?? null,
            longitude: place.location?.longitude ?? null,
          },
        },
      });
      console.log(
        `  SKIP name-mismatch  ${l.slug}  wanted="${l.name}" got="${place.displayName?.text}"`,
      );
      await sleep(PACE_MS);
      continue;
    }

    // Phone-area-code guard. If Places returns a phone whose area code
    // isn't Central IL, the match is probably tagged as the wrong branch
    // of a chain (example observed: "The Dispensary Champaign" → Fulton
    // phone 815-...). Refuse the whole row and flag for manual reconcile.
    const placePhone = place.nationalPhoneNumber || place.internationalPhoneNumber;
    if (placePhone && !phoneLooksCentralIL(placePhone)) {
      skipped_name_mismatch++;
      rows.push({
        slug: l.slug,
        name: l.name,
        city: l.city,
        query: q,
        status: "name-mismatch",
        match: {
          placeId: place.id,
          displayName: place.displayName?.text ?? null,
          formattedAddress: place.formattedAddress ?? null,
          location: {
            latitude: place.location?.latitude ?? null,
            longitude: place.location?.longitude ?? null,
          },
        },
      });
      console.log(
        `  SKIP area-code      ${l.slug}  phone="${placePhone}" (not Central IL)`,
      );
      await sleep(PACE_MS);
      continue;
    }

    const patch: { logo_url?: string; lat?: number; lng?: number; phone?: string; website?: string } = {};
    const photoName = place.photos?.[0]?.name;
    // logo_url: FALLBACK only — don't overwrite an existing logo.
    if (FIELDS.has("logo") && !l.logo_url && photoName) {
      patch.logo_url = buildPhotoMediaUrl(photoName);
    }
    // lat/lng: FALLBACK only. The earlier Cowork backfill populated
    // coords for every Central IL row, so overwriting risks losing a
    // known-good value with a Places drift. Only fill when null.
    if (FIELDS.has("coords")) {
      if (l.lat == null && typeof place.location?.latitude === "number") {
        patch.lat = place.location.latitude;
      }
      if (l.lng == null && typeof place.location?.longitude === "number") {
        patch.lng = place.location.longitude;
      }
    }
    // phone: FALLBACK only — don't overwrite an existing phone.
    if (FIELDS.has("phone") && !l.phone) {
      const p = place.nationalPhoneNumber || place.internationalPhoneNumber;
      if (p && p.trim()) patch.phone = p.trim();
    }
    // website: FALLBACK only — don't overwrite an existing website.
    if (FIELDS.has("website") && !l.website && place.websiteUri) {
      patch.website = place.websiteUri.trim();
    }

    // Hours: INSERT into listing_hours, but only when the listing has
    // zero existing rows (decided in the pre-check via needsHours).
    // Manual hours data is higher-trust than Places' opening hours feed,
    // so never overwrite.
    let hoursRows: HoursInsertRow[] | null = null;
    let hoursSkipReason: ResultRow["hoursSkipReason"] = undefined;
    if (!FIELDS.has("hours")) {
      hoursSkipReason = "disabled";
    } else if (hoursPrecheckFailed) {
      // Defensive — don't insert when the pre-check failed: see
      // countExistingHours comment. Leaves the field untouched, which
      // is what we want when we can't confirm existing state.
      hoursSkipReason = "parse-error";
    } else if (!needsHours) {
      hoursSkipReason = "existing-rows";
    } else if (!place.regularOpeningHours?.periods) {
      hoursSkipReason = "no-data";
    } else {
      const parsed = periodsToHoursRows(
        place.regularOpeningHours.periods,
        l.project_tag ?? "green",
        l.id,
      );
      if (!parsed) {
        hoursSkipReason = "parse-error";
      } else {
        hoursRows = parsed;
      }
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

    const hasPatch = Object.keys(patch).length > 0;
    const hasHours = !!hoursRows;
    if (!hasPatch && !hasHours) {
      skipped_no_data++;
      rows.push({
        ...commonFields,
        status: "no-data",
        hoursSkipReason,
      });
      console.log(`  SKIP no-data   ${l.slug}  match="${place.displayName?.text}" addr="${place.formattedAddress}"`);
      await sleep(PACE_MS);
      continue;
    }

    const patchFieldsLabel = hasPatch ? Object.keys(patch).join(",") : "";
    const hoursLabel = hasHours ? "hours(7)" : "";
    const effectLabel = [patchFieldsLabel, hoursLabel].filter(Boolean).join(" + ");

    if (APPLY) {
      if (hasPatch) await updateRow(l.id, patch);
      if (hasHours && hoursRows) await insertHours(hoursRows);
      updated++;
      rows.push({
        ...commonFields,
        status: "wrote",
        wouldUpdate: patch,
        wouldInsertHours: hoursRows ?? undefined,
        hoursSkipReason,
      });
      console.log(`  WRITE          ${l.slug}  ← ${effectLabel}`);
    } else {
      updated++;
      rows.push({
        ...commonFields,
        status: "would-write",
        wouldUpdate: patch,
        wouldInsertHours: hoursRows ?? undefined,
        hoursSkipReason,
      });
      console.log(
        `  WOULD-WRITE    ${l.slug}  ← ${effectLabel}` +
          `  (phone=${patch.phone ? "yes" : "—"} website=${patch.website ? "yes" : "—"}` +
          ` hours=${hasHours ? "yes" : hoursSkipReason ?? "—"})`,
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
      skipped_name_mismatch,
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
  console.log(`skipped (name mismatch):    ${skipped_name_mismatch}`);
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
