// app/api/alerts/preferences/route.ts
// Upsert a subscriber's alert preferences into deal_alerts (match on email).

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const VALID_RADIUS = new Set(["10", "25", "50", "statewide"]);
const VALID_FREQ = new Set(["weekly", "daily", "sms"]);
const VALID_CATS = new Set(["flower", "edibles", "vapes", "concentrate", "all"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const radius = VALID_RADIUS.has(body.radius) ? body.radius : "25";
    const frequency = VALID_FREQ.has(body.frequency) ? body.frequency : "weekly";
    const categoriesRaw = Array.isArray(body.categories) ? body.categories : [];
    const categories = categoriesRaw.filter((c: unknown): c is string => typeof c === "string" && VALID_CATS.has(c));

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }

    const payload = {
      email,
      city: city || null,
      radius,
      categories: categories.length ? categories : ["all"],
      frequency,
      updated_at: new Date().toISOString(),
    };

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deal_alerts?on_conflict=email`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[api/alerts/preferences] supabase error:", res.status, errText);
      return NextResponse.json(
        { error: "Could not save preferences. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/alerts/preferences] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
