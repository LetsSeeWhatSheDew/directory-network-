// app/api/claim/route.ts
// Submit a claim request for a dispensary listing. Row lands in
// listing_claims with status=pending; we'll process claims manually
// and flip status to approved/rejected from the admin panel later.

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const listing_slug = typeof body.listing_slug === "string" ? body.listing_slug.trim() : "";
    const claimant_email = typeof body.claimant_email === "string" ? body.claimant_email.trim().toLowerCase() : "";

    if (!listing_slug) {
      return NextResponse.json({ error: "listing_slug is required." }, { status: 400 });
    }
    if (!claimant_email.includes("@")) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }

    const payload = {
      listing_slug,
      claimant_name: typeof body.claimant_name === "string" ? body.claimant_name.trim() : null,
      claimant_role: typeof body.claimant_role === "string" ? body.claimant_role.trim() : null,
      claimant_email,
      claimant_phone: typeof body.claimant_phone === "string" ? body.claimant_phone.trim() : null,
      verification_method: typeof body.verification_method === "string" ? body.verification_method : null,
      message: typeof body.message === "string" ? body.message.trim() : null,
      status: "pending",
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/listing_claims`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[api/claim] supabase error:", res.status, errText);
      return NextResponse.json(
        { error: "Could not submit claim. Please email matthew@jacarandapeoria.com." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/claim] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
