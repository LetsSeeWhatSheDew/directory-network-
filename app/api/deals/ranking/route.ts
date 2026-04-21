// app/api/deals/ranking/route.ts
// Thin REST wrapper over the `public.deal_rankings` materialized view
// (sql/migrations/2026-04-21-deal-ranking.sql). Returns the is_top_5_percent
// flag for a given deal_id. Degrades to {is_top_5_percent: false} on any
// error — including the common "view doesn't exist" case when the Supabase
// migration hasn't been applied yet. Consumers (DealBadge) rely on this
// silent degradation; do NOT return 500s here.

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const FALSE_RESPONSE = { is_top_5_percent: false } as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json(FALSE_RESPONSE);

  try {
    const url = `${SUPABASE_URL}/rest/v1/deal_rankings?select=is_top_5_percent&deal_id=eq.${encodeURIComponent(id)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      // Short edge cache — ranking view only changes on daily cron refresh.
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json(FALSE_RESPONSE);
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    const isTop = Boolean(row?.is_top_5_percent);
    return NextResponse.json({ is_top_5_percent: isTop });
  } catch {
    return NextResponse.json(FALSE_RESPONSE);
  }
}
