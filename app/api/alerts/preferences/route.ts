// app/api/alerts/preferences/route.ts
// Upsert a subscriber's alert preferences into deal_alerts (match on email).

import { NextRequest, NextResponse } from "next/server";
import { upsertAlert } from "@/lib/alertSubscribers";


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

    // deal_alerts has no radius/frequency/updated_at columns — map the
    // frequency onto alert_type and keep the rest out of the write.
    void radius;
    const ok = await upsertAlert({
      email,
      city: city ? city.toLowerCase() : null,
      categories: categories.length ? categories : ["all"],
      alert_type: frequency === "daily" ? "daily" : frequency === "sms" ? "instant" : "weekly",
    });
    if (!ok) {
      return NextResponse.json({ error: "Could not save preferences. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/alerts/preferences] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
