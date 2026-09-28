// app/api/reviews/route.ts
// Public review submission. Inserts a PENDING row into listing_reviews
// (anon INSERT-only; RLS forbids self-approval). Matthew approves in
// /admin/reviews. Honeypot + cross-site refusal + body cap + per-client rate
// limit + one review per client per store per day + server caps. No IP and
// no user-agent string is stored (device class only).

import { NextRequest, NextResponse } from "next/server";
import { rateLimited, clientKey, firstTimeWithin, forgetSeen } from "../../../lib/rateLimit";
import { readJsonBody, honeypotTripped, crossSiteRequest, cleanText, cleanLine, isSlug, hasLink } from "../../../lib/validation";
import { deviceOf } from "../../../lib/trackEvent";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const MONTH = /^20\d{2}-(0[1-9]|1[0-2])$/;

export async function POST(req: NextRequest) {
  if (crossSiteRequest(req.headers)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const client = clientKey(req.headers);
  if (rateLimited(`rv:${client}`, 4, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many reviews — try again later." }, { status: 429 });
  }
  const parsed = await readJsonBody(req, 8192);
  if (!parsed.ok) return NextResponse.json({ ok: false }, { status: parsed.status });
  const b = parsed.body;
  if (honeypotTripped(b)) {
    return NextResponse.json({ ok: true }); // honeypot
  }
  const slug = isSlug(b.listingSlug) ? b.listingSlug : null;
  const rating = Number(b.rating);
  if (!slug || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "Pick a star rating." }, { status: 400 });
  }
  const body = cleanText(b.body, 1500);
  const name = cleanLine(b.displayName, 40);
  if (hasLink(body) || hasLink(name)) {
    return NextResponse.json({ ok: false, error: "Links aren't allowed in reviews." }, { status: 400 });
  }
  const visit = typeof b.visitMonth === "string" && MONTH.test(b.visitMonth) ? b.visitMonth : null;

  // One review per client per store per day; repeats are accepted silently.
  const onceKey = `rv:${client}:${slug}`;
  if (!firstTimeWithin(onceKey, 24 * 3600_000)) {
    return NextResponse.json({ ok: true });
  }

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
      user_agent: deviceOf(req.headers), // device class only, never the UA string
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res || !res.ok) {
    forgetSeen(onceKey);
    const txt = res ? await res.text().catch(() => "") : "timeout";
    console.error("review insert failed", res?.status, txt.slice(0, 200));
    const notReady = res?.status === 404 || /listing_reviews/.test(txt);
    return NextResponse.json(
      { ok: false, error: notReady ? "Reviews open soon." : "Couldn't save that." },
      { status: notReady ? 503 : 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
