// app/api/feedback/route.ts
// Public "was this right?" + "report a problem" intake. Writes one row to
// public.deal_reports (anon INSERT-only under RLS; nobody can read it back
// except the service role). No PII: no email, no IP, no user-agent string
// (only a coarse mobile/desktop class).
//
// reason codes:
//   confirmed      — thumbs-up: the deal/price was right
//   price_changed  — price is different in store / online
//   expired        — deal is over
//   wrong_store    — deal or info belongs to a different store
//   wrong_info     — hours / address / details wrong (page-level)
//   other          — free text
//
// Abuse controls: honeypot, cross-site refusal, 4 KB body cap, per-client
// rate limit, and one report per client per deal/page per reason per 12h
// (so one person can't pump the "N people confirmed this today" count).

import { NextRequest, NextResponse } from "next/server";
import { rateLimited, clientKey, firstTimeWithin, forgetSeen } from "../../../lib/rateLimit";
import { readJsonBody, honeypotTripped, crossSiteRequest, cleanText, isUuid, isSlug } from "../../../lib/validation";
import { deviceOf } from "../../../lib/trackEvent";

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

export async function POST(req: NextRequest) {
  if (crossSiteRequest(req.headers)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const client = clientKey(req.headers);
  if (rateLimited(`fb:${client}`, 10)) {
    return NextResponse.json({ ok: false, error: "Slow down a sec." }, { status: 429 });
  }
  const parsed = await readJsonBody(req, 4096);
  if (!parsed.ok) return NextResponse.json({ ok: false }, { status: parsed.status });
  const body = parsed.body;
  // Honeypot: real people never see or fill this field.
  if (honeypotTripped(body)) {
    return NextResponse.json({ ok: true });
  }
  const reason = typeof body.reason === "string" ? body.reason : "";
  if (!REASONS.has(reason)) {
    return NextResponse.json({ ok: false, error: "Pick what's wrong." }, { status: 400 });
  }
  const dealId = isUuid(body.dealId) ? body.dealId : null;
  const listingSlug = isSlug(body.listingSlug) ? body.listingSlug : null;
  const detail = cleanText(body.detail, 1000);
  let pageUrl: string | null = null;
  if (typeof body.pageUrl === "string" && body.pageUrl.length <= 1000) {
    try {
      const u = new URL(body.pageUrl);
      if (u.protocol === "https:" && /(^|\.)puffprice\.com$/.test(u.hostname)) pageUrl = u.toString().slice(0, 500);
    } catch {
      /* ignore */
    }
  }

  // Idempotent per client: a double tap, a retry or a script replaying the
  // same report is accepted but stored once.
  const onceKey = `fb:${client}:${dealId || listingSlug || pageUrl || "-"}:${reason}`;
  if (!firstTimeWithin(onceKey, 12 * 3600_000)) {
    return NextResponse.json({ ok: true });
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
      user_agent: deviceOf(req.headers), // device class only, never the UA string
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);

  if (!res || !res.ok) {
    forgetSeen(onceKey);
    console.error("feedback insert failed", res?.status, res ? (await res.text().catch(() => "")).slice(0, 200) : "timeout");
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
