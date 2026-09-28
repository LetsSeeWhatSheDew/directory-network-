// app/api/location/route.ts
// Approximate city for the "deals near X" copy on the homepage.
//
// Reads the coarse geolocation headers Vercel's edge already attaches to
// every request (x-vercel-ip-city / -country-region / -latitude / -longitude).
// An earlier version sent each visitor's IP address to a third-party lookup
// service (ipapi.co), which the privacy policy doesn't list; this version
// sends nothing anywhere and never reads or stores the IP.
//
// Same response shape as before: { city, state, lat, lng, error }.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FALLBACK = { city: null as string | null, state: "IL", lat: null as number | null, lng: null as number | null, error: true };

function header(req: NextRequest, name: string): string | null {
  const v = req.headers.get(name);
  if (!v) return null;
  try {
    return decodeURIComponent(v).trim() || null;
  } catch {
    return v.trim() || null;
  }
}

function coord(v: string | null, limit: number): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export async function GET(req: NextRequest) {
  const city = header(req, "x-vercel-ip-city");
  const region = header(req, "x-vercel-ip-country-region");
  if (!city) {
    return NextResponse.json(FALLBACK, { status: 200, headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.json(
    {
      city: city.slice(0, 60),
      state: region && /^[A-Z0-9]{1,3}$/.test(region) ? region : "IL",
      lat: coord(header(req, "x-vercel-ip-latitude"), 90),
      lng: coord(header(req, "x-vercel-ip-longitude"), 180),
      error: false,
    },
    { status: 200, headers: { "Cache-Control": "private, max-age=3600" } }
  );
}
