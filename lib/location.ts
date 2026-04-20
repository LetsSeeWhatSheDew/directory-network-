// lib/location.ts
// Server-readable location helper. Backs the pp_loc cookie that
// LocationAware.tsx writes whenever it commits a location.
//
// Why a cookie: server components (force-dynamic pages like
// /deals/[category]) can't read sessionStorage. The cookie is the
// smallest fix that lets a server-rendered "Our Recommendation" use
// the user's detected city without rewriting every internal link.

import { cookies } from "next/headers";

export type LocationSource = "gps" | "manual" | "ip";

export type ServerLocation = {
  city: string;
  source: LocationSource;
  lat?: number | null;
  lng?: number | null;
};

export const LOCATION_COOKIE = "pp_loc";

export async function getServerLocation(): Promise<ServerLocation | null> {
  try {
    const c = (await cookies()).get(LOCATION_COOKIE)?.value;
    if (!c) return null;
    const parsed = JSON.parse(decodeURIComponent(c));
    if (typeof parsed?.city !== "string" || !parsed.city.trim()) return null;
    const src: LocationSource =
      parsed.source === "gps" || parsed.source === "manual" ? parsed.source : "ip";
    return {
      city: parsed.city,
      source: src,
      lat: typeof parsed.lat === "number" ? parsed.lat : null,
      lng: typeof parsed.lng === "number" ? parsed.lng : null,
    };
  } catch {
    return null;
  }
}
