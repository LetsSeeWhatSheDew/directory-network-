// app/api/dispensary/submit-deal/route.ts
// Receives a deal submission from the public form, inserts into
// `deals` table with is_active=false (pending review), and fires a
// notification email to the admin.
//
// Anti-abuse: honeypot field, basic rate limit by IP, and server-side
// sanity checks on numeric fields.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key on the server for inserts that bypass RLS.
// Falls back to anon key if service key isn't configured.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Submission = {
  dispensary_name?: string;
  listing_slug?: string;
  contact_email?: string;
  deal_title?: string;
  deal_description?: string;
  category?: string;
  discount_type?: string;
  discount_value?: string;
  original_price?: string;
  sale_price?: string;
  unit?: string;
  is_recurring?: boolean;
  recurring_days?: string;
  expires_at?: string;
  website?: string; // honeypot
};

// In-memory rate limit (resets on cold start — good enough for v1).
// Caps: 5 submissions per IP per hour.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) return true;
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

function parseNumber(v?: string): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Submission;

    // Honeypot — if filled, silently accept and throw away
    if (body.website && body.website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    // Required fields
    if (!body.dispensary_name || !body.contact_email || !body.deal_title || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const slug = body.listing_slug?.trim() || slugify(body.dispensary_name);

    const insert = {
      listing_slug: slug,
      deal_title: body.deal_title.trim(),
      deal_description: body.deal_description?.trim() || null,
      category: body.category,
      discount_type: body.discount_type || null,
      discount_value: parseNumber(body.discount_value),
      original_price: parseNumber(body.original_price),
      sale_price: parseNumber(body.sale_price),
      unit: body.unit?.trim() || null,
      is_recurring: !!body.is_recurring,
      recurring_days: body.recurring_days?.trim() || null,
      expires_at: body.expires_at || null,
      source: "submit-form",
      project_tag: "green",
      is_active: false, // pending review
      submitted_by_email: body.contact_email.trim().toLowerCase(),
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("deals").insert(insert);
    if (error) {
      console.error("[submit-deal] insert error:", error);
      return NextResponse.json(
        { error: "Could not save your deal. Please try again." },
        { status: 500 }
      );
    }

    // Fire-and-forget admin notification (if SMTP/webhook is configured).
    // Left as a console log for now — wire to SendGrid/Resend later.
    console.log("[submit-deal] new submission:", {
      dispensary: body.dispensary_name,
      deal: body.deal_title,
      from: body.contact_email,
      ip,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[submit-deal] unexpected error:", e);
    return NextResponse.json(
      { error: "Unexpected error. Please try again." },
      { status: 500 }
    );
  }
}
