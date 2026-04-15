// app/api/location/route.ts
// Approximate city detection from request IP via ipapi.co (no API key for
// low volume). Used to pre-fill "deals near X" copy on the homepage.

import { NextRequest, NextResponse } from "next/server";

const FALLBACK = { city: null as string | null, state: "IL", lat: null as number | null, lng: null as number | null, error: true };

function extractIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const ip = extractIp(req);
    const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : "https://ipapi.co/json/";
    const res = await fetch(url, {
      headers: { "User-Agent": "puffprice.com/1.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }
    const data = await res.json();
    if (data?.error) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }
    return NextResponse.json(
      {
        city: data.city || null,
        state: data.region || "IL",
        lat: typeof data.latitude === "number" ? data.latitude : null,
        lng: typeof data.longitude === "number" ? data.longitude : null,
        error: false,
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=3600" },
      }
    );
  } catch {
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}
