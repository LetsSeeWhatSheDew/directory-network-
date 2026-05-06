import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dn_admin_auth";

function checkAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookie = req.cookies.get(COOKIE_NAME);
  return cookie?.value === adminPassword;
}

const DAY_MAP: Record<string, string> = {
  mon: "mon", monday: "mon",
  tue: "tue", tues: "tue", tuesday: "tue",
  wed: "wed", wednesday: "wed",
  thu: "thu", thur: "thu", thurs: "thu", thursday: "thu",
  fri: "fri", friday: "fri",
  sat: "sat", saturday: "sat",
  sun: "sun", sunday: "sun",
};

function mapToActiveDays(input: unknown): string[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const out = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const k = DAY_MAP[raw.toLowerCase()];
    if (k) out.add(k);
  }
  return out.size > 0 ? Array.from(out) : null;
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

  // 1. Read the submission.
  const subRes = await fetch(
    `${url}/rest/v1/deal_submissions?select=*&id=eq.${encodeURIComponent(id)}`,
    { headers, cache: "no-store" }
  );
  if (!subRes.ok) {
    return NextResponse.json({ error: `fetch submission ${subRes.status}` }, { status: 500 });
  }
  const subs = (await subRes.json()) as Array<Record<string, unknown>>;
  if (subs.length === 0) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  const s = subs[0];
  if (s.approved || s.rejected_at) {
    return NextResponse.json({ error: "Submission already resolved" }, { status: 409 });
  }

  // 2. Build the deals row.
  const now = new Date().toISOString();
  const dealRow: Record<string, unknown> = {
    listing_slug: s.dispensary_slug,
    title: s.deal_title,
    description: s.deal_description,
    category: s.category,
    brand: s.brand,
    weight_grams: s.weight_grams,
    mg_thc: s.mg_thc,
    count: s.count,
    original_price: s.regular_price_usd,
    sale_price: s.sale_price_usd,
    price_per_gram: s.price_per_gram_computed,
    expires_at: s.end_date,
    is_recurring: s.is_recurring ?? false,
    recurring_days: s.recurring_days,
    // Mirror recurring_days into active_days so the new day-of-week
    // visibility filter (sql/migrations/2026-11-05-deal-hygiene.sql)
    // applies on approval. Map both 'monday' and 'mon' shapes to the
    // canonical 3-letter token. Unset (NULL) = always-active default.
    active_days: mapToActiveDays(s.recurring_days),
    source: "manual_approval",
    source_url: s.source_url,
    is_active: true,
    verified_at: now,
    status_reason: null,
    project_tag: "green",
  };

  // 3. INSERT into deals.
  const dealRes = await fetch(`${url}/rest/v1/deals`, {
    method: "POST",
    headers,
    body: JSON.stringify(dealRow),
  });
  if (!dealRes.ok) {
    const text = await dealRes.text();
    return NextResponse.json({ error: `deal insert ${dealRes.status}: ${text}` }, { status: 500 });
  }
  const inserted = (await dealRes.json()) as Array<{ id: string }>;
  const newDealId = inserted[0]?.id;
  if (!newDealId) {
    return NextResponse.json({ error: "deal insert returned no id" }, { status: 500 });
  }

  // 4. UPDATE the submission.
  const patchRes = await fetch(
    `${url}/rest/v1/deal_submissions?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        approved: true,
        approved_at: now,
        approved_by: "admin",
        promoted_deal_id: newDealId,
        verified: true,
      }),
    }
  );
  if (!patchRes.ok) {
    const text = await patchRes.text();
    // Deal is live but submission didn't update — log and continue.
    console.error(`submission patch failed: ${patchRes.status} ${text}`);
  }

  return NextResponse.json({ ok: true, deal_id: newDealId });
}
