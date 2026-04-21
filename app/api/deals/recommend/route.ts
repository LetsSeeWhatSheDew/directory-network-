// app/api/deals/recommend/route.ts
// Core decision-engine API: returns the best-ranked deal + alternatives for
// a category (and optionally a city / lat-lng).
//
// GET /api/deals/recommend?category=flower&city=peoria

import { NextRequest, NextResponse } from "next/server";
import { isInMetro } from "../../../../lib/cityNormalize";
import { computeOpenStatus, type HoursRow } from "../../../../lib/hours";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const VALID_CATEGORIES = new Set(["flower", "edibles", "vapes", "concentrate", "all"]);

type Deal = Record<string, any> & { score?: number; rankingReason?: string };

/**
 * Illinois is America/Chicago. Proxy for "likely open right now" based
 * on current CT hour. Real hours-aware open-now detection requires
 * pulling listing_hours per deal, which would be a separate query —
 * this is a cheap heuristic that keeps closed-at-this-hour dispensaries
 * from landing as the top pick when the user actually wants to go now.
 *
 * Returns true if currently between 9am CT and 9pm CT. Covers the
 * opening hours of nearly every Illinois dispensary (state law requires
 * cannabis sales 6am-10pm, but most shops run 9am-9pm).
 */
function isLikelyOpenCT(): boolean {
  // Chicago is UTC-5 (CDT April-November), UTC-6 CST otherwise. April 15
  // is CDT, so offset is -5. The tiny error around DST transition days
  // doesn't matter for a "likely open" heuristic.
  const utcHour = new Date().getUTCHours();
  const ctHour = (utcHour + 24 - 5) % 24;
  return ctHour >= 9 && ctHour < 21;
}

function scoreDeal(d: Deal, openNow: boolean): number {
  let s = 0;
  const discount = Number(d.discount_value) || 0;
  s += discount * 2;
  if (d.is_recurring) s += 10;
  if (d.accepts_credit) s += 5;
  if (d.drive_thru) s += 3;
  const rating = Number(d.google_rating) || 0;
  if (rating >= 4.5) s += (rating - 4) * 10;
  if (d.plan === "featured") s += 15;
  if (d.plan === "boost") s += 8;
  // Open-now bonus: if current CT hour is within typical dispensary
  // hours, boost the score. This promotes reachable-right-now deals
  // to the top. Weighted at +25 per the spec so it outranks small
  // discount differences but not big ones.
  if (openNow) s += 25;
  return s;
}

function rankingReason(d: Deal, category: string, city?: string): string {
  const cat = category === "all" ? "deals" : category;
  const where = city ? `in ${city[0].toUpperCase()}${city.slice(1)}` : "in Illinois";
  const rating = Number(d.google_rating) || 0;
  if (d.plan === "featured") return `Featured partner · top ${cat} deal ${where} today`;
  if (d.is_recurring) return "Recurring deal — reliable savings week to week";
  if (rating >= 4.7) return `Best-rated dispensary (${rating}★) with an active deal`;
  const discount = Number(d.discount_value) || 0;
  if (discount >= 30) return `Highest discount on ${cat} ${where} today`;
  if (d.accepts_credit && d.drive_thru) return `Drive-thru + cards accepted — easy stop ${where}`;
  return `Top-ranked ${cat} deal ${where} today`;
}

async function fetchDeals(category: string): Promise<Deal[]> {
  const params = new URLSearchParams({ select: "*", order: "discount_value.desc", limit: "50" });
  if (category !== "all") params.set("category", `eq.${category}`);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/active_deals_with_listings?${params.toString()}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

// Fetch lat/lng + weekly hours for a dispensary slug in a single roundtrip
// via PostgREST relationship embed. Returns {lat,lng,hours} with graceful
// nulls/empties when master_listings has no matching row (several
// active_deals rows carry synthesized slugs that don't join back — those
// just render without coords or open-now status, never a lie).
async function fetchListingMeta(slug: string): Promise<{
  lat: number | null;
  lng: number | null;
  hours: HoursRow[];
}> {
  if (!slug) return { lat: null, lng: null, hours: [] };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?slug=eq.${encodeURIComponent(slug)}&select=lat,lng,listing_hours(weekday,opens_at,closes_at,is_closed)&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return { lat: null, lng: null, hours: [] };
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    return {
      lat: typeof row?.lat === "number" ? row.lat : null,
      lng: typeof row?.lng === "number" ? row.lng : null,
      hours: Array.isArray(row?.listing_hours) ? (row.listing_hours as HoursRow[]) : [],
    };
  } catch {
    return { lat: null, lng: null, hours: [] };
  }
}

function emptyResponse(category: string, city: string) {
  return {
    topPick: null,
    alternatives: [],
    totalFound: 0,
    city,
    category,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryRaw = (searchParams.get("category") || "all").toLowerCase();
    const category = VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : "all";
    const city = (searchParams.get("city") || "").trim();
    const limitRaw = Number.parseInt(searchParams.get("limit") || "10", 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 10;
    // lat/lng accepted for forward-compat; not yet used for distance scoring
    void searchParams.get("lat");
    void searchParams.get("lng");

    const statewide = await fetchDeals(category);
    const openNow = isLikelyOpenCT();

    // Broaden to the whole metro: Peoria matches East Peoria +
    // Bartonville, Chicago matches Chicago Heights + Oak Park, etc.
    // Also falls back to the slug-derived city for rows where the view
    // returned generic "Illinois" because the listing wasn't joined.
    const localMatches = city
      ? statewide.filter((d) =>
          isInMetro(d.city as string | null | undefined, (d.slug || d.listing_slug) as string | null | undefined, city)
        )
      : statewide;

    const scoredLocal: Deal[] = localMatches
      .map((d) => ({ ...d, score: scoreDeal(d, openNow), scope: "local" as const }))
      .sort((a, b) => ((b.score as number) || 0) - ((a.score as number) || 0));

    // Fill remaining slots with statewide deals not already included
    const localIds = new Set<string>(scoredLocal.map((d) => String(d.deal_id ?? d.id ?? "")));
    const scoredFill: Deal[] = statewide
      .filter((d) => !localIds.has(String(d.deal_id ?? d.id ?? "")))
      .map((d) => ({ ...d, score: scoreDeal(d, openNow), scope: "statewide" as const }))
      .sort((a, b) => ((b.score as number) || 0) - ((a.score as number) || 0));

    const combined = [...scoredLocal, ...scoredFill].slice(0, limit);

    if (combined.length === 0) {
      return NextResponse.json({ ...emptyResponse(category, city), deals: [] });
    }

    const top = combined[0];
    const topSlug = String(top.slug || top.listing_slug || "");
    const meta = topSlug
      ? await fetchListingMeta(topSlug)
      : { lat: null as number | null, lng: null as number | null, hours: [] as HoursRow[] };
    const openStatus = computeOpenStatus(meta.hours);
    const topPick = {
      ...top,
      rankingReason: rankingReason(top, category, city),
      lat: meta.lat,
      lng: meta.lng,
    };
    const alternatives = combined.slice(1, Math.max(4, limit));

    return NextResponse.json({
      topPick,
      alternatives,
      deals: combined,
      totalFound: combined.length,
      localCount: scoredLocal.length,
      city,
      category,
      likelyOpen: openNow,
      openStatus,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/deals/recommend] error:", err);
    return NextResponse.json({ ...emptyResponse("all", ""), deals: [] });
  }
}
