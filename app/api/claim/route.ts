// app/api/claim/route.ts
// Submit a claim request for a dispensary listing. Row lands in
// listing_claims with status=pending; we'll process claims manually
// and flip status to approved/rejected from the admin panel later.
//
// Abuse controls: cross-site refusal, body cap, per-client rate limit,
// per-field caps, honeypot (if the form sends one), same email + listing
// stored once per hour.

import { NextRequest, NextResponse } from "next/server";
import { rateLimited, clientKey, firstTimeWithin, forgetSeen } from "@/lib/rateLimit";
import { readJsonBody, crossSiteRequest, honeypotTripped, normalizeEmail, cleanLine, cleanText } from "@/lib/validation";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

// Listing slugs plus the sentinel slugs the generic claim form uses.
const LISTING_SLUG = /^[a-z0-9_-]{1,120}$/;

export async function POST(req: NextRequest) {
  try {
    if (crossSiteRequest(req.headers)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const client = clientKey(req.headers);
    if (rateLimited(`claim:${client}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many tries. Give it a few minutes." }, { status: 429 });
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.body;
    if (honeypotTripped(body, "hp")) return NextResponse.json({ ok: true });

    const listing_slug = typeof body.listing_slug === "string" ? body.listing_slug.trim().toLowerCase() : "";
    const claimant_email = normalizeEmail(body.claimant_email);

    if (!listing_slug || !LISTING_SLUG.test(listing_slug)) {
      return NextResponse.json({ error: "listing_slug is required." }, { status: 400 });
    }
    if (!claimant_email) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }

    const payload = {
      listing_slug,
      claimant_name: cleanLine(body.claimant_name, 100),
      claimant_role: cleanLine(body.claimant_role, 60),
      claimant_email,
      claimant_phone: cleanLine(body.claimant_phone, 30),
      verification_method: cleanLine(body.verification_method, 40),
      message: cleanText(body.message, 2000),
      status: "pending",
    };

    const onceKey = `claim:${claimant_email}:${listing_slug}`;
    if (!firstTimeWithin(onceKey, 3600_000)) return NextResponse.json({ ok: true });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/listing_claims`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    if (!res || !res.ok) {
      forgetSeen(onceKey);
      console.error("[api/claim] supabase error:", res?.status, res ? (await res.text().catch(() => "")).slice(0, 300) : "timeout");
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
