// POST /api/waitlist  { zip, email?, source: "delivery" | "drive_thru", website? (honeypot) }
// "Tell me when delivery / a drive-thru reaches my ZIP." Stored with the
// service key (the table has no public policies). Only ZIP counts are ever
// shown publicly (delivery_waitlist_by_zip view).
import { NextRequest, NextResponse } from "next/server";
import { rateLimited, clientKey } from "@/lib/rateLimit";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function POST(req: NextRequest) {
  if (rateLimited(`wl:${clientKey(req.headers)}`, 6)) {
    return NextResponse.json({ error: "Too many tries — give it a minute." }, { status: 429 });
  }
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true });
  const zip = typeof b.zip === "string" ? b.zip.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const source = b.source === "drive_thru" ? "drive_thru" : "delivery";
  if (!/^\d{5}$/.test(zip)) return NextResponse.json({ error: "Enter a 5-digit ZIP." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) return NextResponse.json({ error: "Signups are down for a moment." }, { status: 503 });
  const r = await fetch(`${SUPABASE_URL}/rest/v1/delivery_waitlist`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ zip, email: email || null, source }),
  });
  if (!r.ok) return NextResponse.json({ error: "That didn't save — try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
