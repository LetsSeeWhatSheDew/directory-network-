// GET /api/admin/leads — lead list for /admin, read with the service key.
// Replaces the browser reading `leads` with the public anon key (which
// required a public SELECT policy on a table full of names and emails).
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });
  const r = await fetch(`${url}/rest/v1/leads?select=*&order=created_at.desc`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!r.ok) return NextResponse.json({ error: `Supabase ${r.status}` }, { status: 502 });
  return NextResponse.json(await r.json());
}
