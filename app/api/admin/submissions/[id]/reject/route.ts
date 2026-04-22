import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dn_admin_auth";

const ALLOWED_REASONS = new Set([
  "duplicate",
  "source_url_dead",
  "price_implausible",
  "unknown_dispensary",
  "already_expired",
  "spam",
  "other",
]);

function checkAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookie = req.cookies.get(COOKIE_NAME);
  return cookie?.value === adminPassword;
}

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason;
  if (!reason || !ALLOWED_REASONS.has(reason)) {
    return NextResponse.json(
      { error: `reason must be one of: ${[...ALLOWED_REASONS].join(", ")}` },
      { status: 400 }
    );
  }

  const { url, key } = supabase();
  if (!url || !key) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const res = await fetch(
    `${url}/rest/v1/deal_submissions?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        rejected_at: new Date().toISOString(),
        rejected_reason: reason,
        approved: false,
        approved_by: "admin",
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `reject patch ${res.status}: ${text}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
