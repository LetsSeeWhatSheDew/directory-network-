// app/api/admin/reviews/[id]/route.ts — approve / reject a pending review.
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const COOKIE_NAME = "dn_admin_auth";

function checkAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return req.cookies.get(COOKIE_NAME)?.value === adminPassword;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await ctx.params;
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
  if (!status) return NextResponse.json({ error: "Bad action" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const res = await fetch(
    `${url}/rest/v1/listing_reviews?id=eq.${encodeURIComponent(id)}&project_tag=eq.green`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ status, moderated_at: new Date().toISOString() }),
      cache: "no-store",
    }
  );
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 502 });
  revalidateTag("reviews");
  return NextResponse.json({ ok: true, status });
}
