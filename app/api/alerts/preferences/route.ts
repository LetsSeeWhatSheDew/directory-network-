// app/api/alerts/preferences/route.ts
// Save a subscriber's alert preferences into deal_alerts (match on email).
//
// There's no login, so this can't prove who's asking. It therefore goes
// through the same double opt-in as signup: a confirmed, active subscriber's
// preferences update in place; any other address (new, or unsubscribed)
// gets a confirm email and nothing is sent until the link is tapped. That
// way nobody can subscribe a stranger or undo someone's unsubscribe here.

import { NextRequest, NextResponse } from "next/server";
import { subscribeWeekly } from "@/lib/alertSubscribers";
import { sendWeeklyConfirm } from "@/lib/weeklyConfirm";
import { rateLimited, clientKey } from "@/lib/rateLimit";
import { readJsonBody, crossSiteRequest, honeypotTripped, normalizeEmail, cleanLine } from "@/lib/validation";

export const dynamic = "force-dynamic";

const VALID_FREQ = new Set(["weekly", "daily", "sms"]);
const VALID_CATS = new Set(["flower", "edibles", "vapes", "concentrate", "all"]);

export async function POST(req: NextRequest) {
  try {
    if (crossSiteRequest(req.headers)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (rateLimited(`prefs:${clientKey(req.headers)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many tries. Give it a few minutes." }, { status: 429 });
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.body;
    if (honeypotTripped(body)) return NextResponse.json({ ok: true, status: "pending" });

    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }
    const city = cleanLine(body.city, 40)?.toLowerCase() || null;
    const frequency = typeof body.frequency === "string" && VALID_FREQ.has(body.frequency) ? body.frequency : "weekly";
    const categoriesRaw = Array.isArray(body.categories) ? body.categories : [];
    const categories = categoriesRaw.filter((c: unknown): c is string => typeof c === "string" && VALID_CATS.has(c)).slice(0, 5);

    // deal_alerts has no radius/frequency/updated_at columns — map the
    // frequency onto alert_type and keep the rest out of the write.
    const saved = await subscribeWeekly({
      email,
      city,
      categories: categories.length ? categories : ["all"],
      alert_type: frequency === "daily" ? "daily" : frequency === "sms" ? "instant" : "weekly",
    });
    if (!saved.ok) {
      return NextResponse.json({ error: "Could not save preferences. Please try again." }, { status: 502 });
    }
    if (saved.status === "pending") {
      const sent = await sendWeeklyConfirm(email, saved.id);
      if (sent === "unavailable" || sent === "failed") {
        return NextResponse.json({ error: "We couldn't send the confirm email just now. Try again later." }, { status: 502 });
      }
    }
    return NextResponse.json({ ok: true, status: saved.status });
  } catch (err) {
    console.error("[api/alerts/preferences] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
