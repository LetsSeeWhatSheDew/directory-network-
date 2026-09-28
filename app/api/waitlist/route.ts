// POST /api/waitlist  { zip, email?, source: "delivery" | "drive_thru", website? (honeypot) }
// "Tell me when delivery / a drive-thru reaches my ZIP." Stored with the
// service key (the table has no public policies). Only ZIP counts are ever
// shown publicly (delivery_waitlist_by_zip view).
//
// Abuse controls: honeypot, cross-site refusal, 2 KB body cap, per-client rate
// limit, and the same ZIP + email + source is stored once per day.
import { NextRequest, NextResponse } from "next/server";
import { rateLimited, clientKey, firstTimeWithin, forgetSeen } from "@/lib/rateLimit";
import { readJsonBody, honeypotTripped, crossSiteRequest, normalizeEmail } from "@/lib/validation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function POST(req: NextRequest) {
  if (crossSiteRequest(req.headers)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const client = clientKey(req.headers);
  if (rateLimited(`wl:${client}`, 6)) {
    return NextResponse.json({ error: "Too many tries — give it a minute." }, { status: 429 });
  }
  const parsed = await readJsonBody(req, 2048);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const b = parsed.body;
  if (honeypotTripped(b)) return NextResponse.json({ ok: true });
  const zip = typeof b.zip === "string" ? b.zip.trim() : "";
  const emailRaw = typeof b.email === "string" ? b.email.trim() : "";
  const kind = b.source === "drive_thru" ? "drive_thru" : "delivery";
  // Where the signup came from (utm_source / ref), e.g. "drive_thru:reddit".
  const channel = typeof b.channel === "string" ? b.channel.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) : "";
  const source = channel ? `${kind}:${channel}` : kind;
  if (!/^\d{5}$/.test(zip)) return NextResponse.json({ error: "Enter a 5-digit ZIP." }, { status: 400 });
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) return NextResponse.json({ error: "Signups are down for a moment." }, { status: 503 });

  const onceKey = `wl:${zip}:${email || client}:${kind}`;
  if (!firstTimeWithin(onceKey, 24 * 3600_000)) return NextResponse.json({ ok: true });

  const r = await fetch(`${SUPABASE_URL}/rest/v1/delivery_waitlist`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ zip, email, source }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!r || !r.ok) {
    forgetSeen(onceKey);
    return NextResponse.json({ error: "That didn't save — try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
