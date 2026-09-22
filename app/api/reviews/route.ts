// app/api/reviews/route.ts
// Public review submission. Inserts a PENDING row into listing_reviews
// (anon INSERT-only; RLS forbids self-approval). Matthew approves in
// /admin/reviews. Honeypot + per-instance rate limit + server caps.

import { NextRequest, NextResponse } from "next/server";
import { rateLimited, clientKey } from "../../../lib/rateLimit";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const SLUG = /^[a-z0-9-]{1,120}$/;
const MONTH = /^20\d{2}-(0[1-9]|1[0-2])$/;

export async function POST(req: NextRequest) {
  if (rateLimited(`rv:${clientKey(req.headers)}`, 4, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many reviews — try again later." }, { status: 429 });
  }
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (typeof b.website === "string" && b.website.trim() !== "") {
    return NextResponse.json({ ok: true }); // honeypot
  }
  const slug = typeof b.listingSlug === "string" && SLUG.test(b.listingSlug) ? b.listingSlug : null;
  const rating = Number(b.rating);
  if (!slug || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "Pick a star rating." }, { status: 400 });
  }
  const body = typeof b.body === "string" ? b.body.trim().slice(0, 1500) || null : null;
  if (body && /https?:\/\//i.test(body)) {
    return NextResponse.json({ ok: false, error: "Links aren't allowed in reviews." }, { status: 400 });
  }
  const name = typeof b.displayName === "string" ? b.displayName.trim().slice(0, 40) || null : null;
  const visit = typeof b.visitMonth === "string" && MONTH.test(b.visitMonth) ? b.visitMonth : null;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/listing_reviews`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      project_tag: "green",
      listing_slug: slug,
      rating,
      body,
      display_name: name,
      visit_month: visit,
      status: "pending",
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300) || null,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("review insert failed", res.status, txt);
    const notReady = res.status === 404 || /listing_reviews/.test(txt);
    return NextResponse.json(
      { ok: false, error: notReady ? "Reviews open soon." : "Couldn't save that." },
      { status: notReady ? 503 : 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
