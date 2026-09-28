// app/api/dispensary/submit-deal/route.ts
// Receives a deal submission from the public form, inserts into
// `deals` table with is_active=false (pending review), and fires a
// notification email to the admin.
//
// This writes to the live deals table with the service key, so every field
// is validated and capped here: enums for category / discount type, bounded
// numbers, a real date for expires_at, a well-formed slug, length caps on
// text. The row is always inactive and always project_tag='green'; nothing a
// submitter sends can make it live.
//
// Anti-abuse: honeypot field, cross-site refusal, body cap, per-client rate
// limit (salted in-memory hash — no IP is stored or logged), and the same
// deal from the same address is stored once per hour.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimited, clientKey, firstTimeWithin, forgetSeen } from "@/lib/rateLimit";
import {
  readJsonBody,
  crossSiteRequest,
  honeypotTripped,
  normalizeEmail,
  cleanLine,
  cleanText,
  isSlug,
  boundedNumber,
  isoDateOrNull,
} from "@/lib/validation";

// Same lists as the form (app/dispensary/submit-deal/page.tsx).
const CATEGORIES = new Set(["flower", "edibles", "vapes", "concentrate", "pre-roll", "accessory", "other"]);
const DISCOUNT_TYPES = new Set(["percent", "flat", "bogo", "price_drop"]);

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function POST(req: NextRequest) {
  try {
    if (crossSiteRequest(req.headers)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Caps: 5 submissions per client per hour.
    if (rateLimited(`submit-deal:${clientKey(req.headers)}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait before trying again." },
        { status: 429 }
      );
    }

    const parsed = await readJsonBody(req);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.body;

    // Honeypot — if filled, silently accept and throw away
    if (honeypotTripped(body)) {
      return NextResponse.json({ ok: true });
    }

    const dispensaryName = cleanLine(body.dispensary_name, 120);
    const email = normalizeEmail(body.contact_email);
    const dealTitle = cleanLine(body.deal_title, 160);
    const category = typeof body.category === "string" && CATEGORIES.has(body.category) ? body.category : null;

    // Required fields
    if (!dispensaryName || !email || !dealTitle || !category) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const slugIn = typeof body.listing_slug === "string" ? body.listing_slug.trim().toLowerCase() : "";
    const slug = isSlug(slugIn) ? slugIn : slugify(dispensaryName);
    if (!slug) return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Submissions are down for a moment." }, { status: 503 });
    }

    const onceKey = `submit-deal:${email}:${slug}:${dealTitle.toLowerCase()}`;
    if (!firstTimeWithin(onceKey, 60 * 60 * 1000)) return NextResponse.json({ ok: true });

    const insert = {
      listing_slug: slug,
      deal_title: dealTitle,
      deal_description: cleanText(body.deal_description, 1000),
      category,
      discount_type: typeof body.discount_type === "string" && DISCOUNT_TYPES.has(body.discount_type) ? body.discount_type : null,
      discount_value: boundedNumber(body.discount_value, 0, 10000),
      original_price: boundedNumber(body.original_price, 0, 10000),
      sale_price: boundedNumber(body.sale_price, 0, 10000),
      unit: cleanLine(body.unit, 40),
      is_recurring: body.is_recurring === true,
      recurring_days: cleanLine(body.recurring_days, 80),
      expires_at: isoDateOrNull(body.expires_at),
      source: "submit-form",
      project_tag: "green",
      is_active: false, // pending review
      submitted_by_email: email,
      submitted_at: new Date().toISOString(),
    };

    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.from("deals").insert(insert);
    if (error) {
      forgetSeen(onceKey);
      console.error("[submit-deal] insert error:", error.message);
      return NextResponse.json(
        { error: "Could not save your deal. Please try again." },
        { status: 500 }
      );
    }

    // Admin notification is a log line for now (no email yet). No IP and no
    // submitter email in logs.
    console.log("[submit-deal] new submission:", { dispensary: dispensaryName, slug, deal: dealTitle });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[submit-deal] unexpected error:", e);
    return NextResponse.json(
      { error: "Unexpected error. Please try again." },
      { status: 500 }
    );
  }
}
