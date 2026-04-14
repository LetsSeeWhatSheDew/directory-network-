// app/api/price-history/[slug]/route.ts
// GET /api/price-history/:slug?category=flower
// Returns last 30 days of price history for a listing slug plus a
// simple trend flag: 'better' | 'worse' | 'stable' | 'unknown'.

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

type Row = {
  id: string;
  listing_slug: string;
  category: string | null;
  product_name: string | null;
  price: number | null;
  discount_value: number | null;
  recorded_at: string;
};

function empty(slug: string) {
  return { slug, history: [] as Row[], trend: "unknown" as const };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "").trim().toLowerCase();

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const qs = new URLSearchParams({
      select: "id,listing_slug,category,product_name,price,discount_value,recorded_at",
      listing_slug: `eq.${slug}`,
      project_tag: "eq.green",
      recorded_at: `gte.${since}`,
      order: "recorded_at.asc",
      limit: "200",
    });
    if (category) qs.set("category", `eq.${category}`);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_price_history?${qs}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 600 },
    });

    if (!res.ok) return NextResponse.json(empty(slug), { status: 200 });
    const rows = (await res.json()) as Row[];

    if (!Array.isArray(rows) || rows.length < 2) {
      return NextResponse.json({ slug, history: rows || [], trend: "unknown" });
    }

    const latest = rows[rows.length - 1];
    const weekAgoCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const baseline = [...rows]
      .reverse()
      .find((r) => new Date(r.recorded_at).getTime() <= weekAgoCutoff) || rows[0];

    const a = latest?.discount_value ?? null;
    const b = baseline?.discount_value ?? null;

    let trend: "better" | "worse" | "stable" | "unknown" = "unknown";
    if (a != null && b != null) {
      const diff = a - b;
      if (diff > 1) trend = "better";
      else if (diff < -1) trend = "worse";
      else trend = "stable";
    }

    return NextResponse.json({ slug, history: rows, trend });
  } catch (err) {
    console.error("[api/price-history] unexpected error:", err);
    return NextResponse.json({ history: [], trend: "unknown" }, { status: 200 });
  }
}
