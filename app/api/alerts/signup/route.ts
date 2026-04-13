// app/api/alerts/signup/route.ts
// ============================================================
// ALERT SIGNUP API
// Handles form submissions from /alerts page
// Saves to Supabase deal_alerts table
// Sends confirmation email via... email (manual for now,
// Resend/SendGrid integration once Stripe is live)
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const city = formData.get("city") as string;
    const categories = formData.getAll("categories") as string[];
    const tier = (formData.get("tier") as string) || "free";

    // Validate
    if (!email || !city) {
      return NextResponse.json(
        { error: "Email and city are required" },
        { status: 400 }
      );
    }

    // Save to Supabase deal_alerts table
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deal_alerts`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          email,
          city: city.trim().toLowerCase(),
          categories: categories.length > 0 ? categories : ["all"],
          frequency: tier === "pro" ? "instant" : tier === "standard" ? "daily" : "weekly",
          is_active: true,
        }),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save signup" },
        { status: 500 }
      );
    }

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
