// app/api/feedback/route.ts
// Public "was this right?" + "report a problem" intake. Writes one row to
// public.deal_reports (anon INSERT-only under RLS; nobody can read it back
// except the service role). No PII: no email, no IP stored.
//
// reason codes:
//   confirmed      — thumbs-up: the deal/price was right
//   price_changed  — price is different in store / online
//   expired        — deal is over
//   wrong_store    — deal or info belongs to a different store
//   wrong_info     — hours / address / details wrong (page-level)
//   other          — free text

import { NextRequest, NextResponse } from "next/server";
import { rateLimited, clientKey } from "../../../lib/rateLimit";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const REASONS = new Set([
  "confirmed",
  "price_changed",
  "expired",
  "wrong_store",
  "wrong_info",
  "other",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9-]{1,120}$/;

export async function POST(req: NextRequest) {
  if (rateLimited(`fb:${clientKey(req.headers)}`, 10)) {
    return NextResponse.json({ ok: false, error: "Slow down a sec." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // Honeypot: real people never see or fill this field.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }
  const reason = typeof body.reason === "string" ? body.reason : "";
  if (!REASONS.has(reason)) {
    return NextResponse.json({ ok: false, error: "Pick what's wrong." }, { status: 400 });
  }
  const dealId = typeof body.dealId === "string" && UUID.test(body.dealId) ? body.dealId : null;
  const listingSlug =
    typeof body.listingSlug === "string" && SLUG.test(body.listingSlug) ? body.listingSlug : null;
  const detail =
    typeof body.detail === "string" ? body.detail.trim().slice(0, 1000) || null : null;
  let pageUrl: string | null = null;
  if (typeof body.pageUrl === "string") {
    try {
      const u = new URL(body.pageUrl);
      if (/(^|\.)puffprice\.com$/.test(u.hostname)) pageUrl = u.toString().slice(0, 500);
    } catch {
      /* ignore */
    }
  }

  if (!SUPABASE_ANON_KEY) {
    return NextResponse.json({ ok: false, error: "Not configured" }, { status: 503 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_reports`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      project_tag: "green",
      deal_id: dealId,
      listing_slug: listingSlug,
      reason,
      detail,
      page_url: pageUrl,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300) || null,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("feedback insert failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
