// app/api/alerts/signup/route.ts
// ============================================================
// ALERT SIGNUP API
// Handles form submissions from /alerts page
// Saves to Supabase deal_alerts table
// Sends confirmation email via... email (manual for now,
// Resend/SendGrid integration once Stripe is live)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { upsertAlert, type AlertRow } from "@/lib/alertSubscribers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    // Accepts a regular form POST (redirects) or JSON (returns {ok}).
    const wantsJson = (req.headers.get("content-type") || "").includes("application/json");
    let email = "", city = "", tier = "free";
    let categories: string[] = [];
    let phoneRaw: string | null = null, smsOptInRaw: string | null = null;
    if (wantsJson) {
      const b = await req.json().catch(() => ({}));
      if (b.website) return NextResponse.json({ ok: true }); // honeypot
      email = typeof b.email === "string" ? b.email.trim() : "";
      city = typeof b.city === "string" ? b.city : "";
      tier = typeof b.tier === "string" ? b.tier : "free";
      categories = Array.isArray(b.categories) ? b.categories.filter((c: unknown) => typeof c === "string") : [];
    } else {
      const formData = await req.formData();
      email = (formData.get("email") as string) || "";
      city = (formData.get("city") as string) || "";
      categories = formData.getAll("categories") as string[];
      tier = (formData.get("tier") as string) || "free";
      phoneRaw = (formData.get("phone") as string | null) ?? null;
      smsOptInRaw = (formData.get("sms_opted_in") as string | null) ?? null;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }

    // Validate
    if (!email || !city) {
      return NextResponse.json(
        { error: "Email and city are required" },
        { status: 400 }
      );
    }

    // Normalize optional phone to E.164 if present, otherwise null
    let phoneE164: string | null = null;
    if (phoneRaw) {
      const digits = phoneRaw.replace(/\D/g, "");
      if (digits.length === 10) phoneE164 = `+1${digits}`;
      else if (digits.length === 11 && digits.startsWith("1")) phoneE164 = `+${digits}`;
    }
    const smsOptedIn = smsOptInRaw === "true" || smsOptInRaw === "1" || smsOptInRaw === "on";

    // Save to Supabase deal_alerts table
    const payload: Record<string, unknown> = {
      email,
      city: city.trim().toLowerCase(),
      categories: categories.length > 0 ? categories : ["all"],
      alert_type: tier === "pro" ? "instant" : tier === "standard" ? "daily" : "weekly",
      is_active: true,
    };
    if (phoneE164) payload.phone = phoneE164;
    // NOTE: sms_opted_in / sms_verified columns land via
    // sql/add-phone-to-deal-alerts.sql. Until that migration runs we can't
    // write to those columns without a PostgREST 400. Phone presence is a
    // sufficient opt-in proxy for now — flip back to payload.sms_opted_in
    // once the migration lands. Captured flag (unused on insert):
    void smsOptedIn;

    const ok = await upsertAlert(payload as unknown as AlertRow);
    if (!ok) {
      return NextResponse.json({ error: "Failed to save signup" }, { status: 500 });
    }
    if (wantsJson) return NextResponse.json({ ok: true });

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/alerts/confirmed", req.url),
      { status: 303 }
    );

  } catch (err) {
    console.error("Alert signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
