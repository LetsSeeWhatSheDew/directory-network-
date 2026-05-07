// app/api/admin/deals/route.ts
//
// Admin-only manual deal entry. Powers /admin/deals/new — the new
// day-of-week picker writes here, which forwards to public.deals via
// the service-role key. Mirrors the admin auth pattern in
// app/api/admin/submissions/[id]/approve/route.ts.

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dn_admin_auth";

const VALID_DAYS = new Set([
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
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

type Payload = {
  listing_slug?: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  discount_value?: number | null;
  discount_unit?: "percent" | "dollars";
  active_until?: string | null;
  source_url?: string | null;
  active_days?: string[] | null;
};

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { url, key } = supabase();
  if (!url || !key) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = (body.listing_slug || "").trim();
  const title = (body.title || "").trim();
  if (!slug || !title) {
    return NextResponse.json(
      { error: "listing_slug and title are required" },
      { status: 400 }
    );
  }

  // Whitelist active_days against the canonical 3-letter set; the DB has
  // a CHECK constraint on this column, but failing fast here surfaces the
  // problem to the admin UI with a clean message.
  let activeDays: string[] | null = null;
  if (Array.isArray(body.active_days) && body.active_days.length > 0) {
    const cleaned = Array.from(
      new Set(
        body.active_days
          .map((d) => (typeof d === "string" ? d.toLowerCase() : ""))
          .filter((d) => VALID_DAYS.has(d))
      )
    );
    activeDays = cleaned.length > 0 ? cleaned : null;
  }

  const now = new Date().toISOString();
  const dealRow: Record<string, unknown> = {
    listing_slug: slug,
    title,
    description: body.description ?? null,
    category: body.category ?? null,
    discount_value: body.discount_value ?? null,
    discount_unit: body.discount_unit ?? null,
    active_days: activeDays,
    active_until: body.active_until ?? null,
    source: "manual_admin",
    source_url: body.source_url ?? null,
    is_active: true,
    verified_at: now,
    project_tag: "green",
  };

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const res = await fetch(`${url}/rest/v1/deals`, {
    method: "POST",
    headers,
    body: JSON.stringify(dealRow),
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `deal insert ${res.status}: ${text}` },
      { status: 500 }
    );
  }
  const inserted = (await res.json()) as Array<{ id: string }>;
  const dealId = inserted[0]?.id;
  if (!dealId) {
    return NextResponse.json(
      { error: "deal insert returned no id" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, deal_id: dealId });
}
