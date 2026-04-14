// app/api/listings/search/route.ts
// Lightweight search over master_listings for the submit-deal autocomplete.

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

export async function GET(req: NextRequest) {
  try {
    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ listings: [] });

    const safe = q.replace(/[(),]/g, "");
    const url = `${SUPABASE_URL}/rest/v1/master_listings?select=slug,name,city&project_tag=eq.green&or=(name.ilike.*${encodeURIComponent(safe)}*,city.ilike.*${encodeURIComponent(safe)}*,slug.ilike.*${encodeURIComponent(safe)}*)&limit=10`;

    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ listings: [] });
    const data = await res.json();
    return NextResponse.json({ listings: Array.isArray(data) ? data : [] });
  } catch {
    return NextResponse.json({ listings: [] });
  }
}
