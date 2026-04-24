// app/api/cron/scrape-deals/route.ts
// Vercel Cron handler — direct-source CIL deal scraper.
// Scheduled every 6 hours via vercel.json crons entry.
//
// Auth: requires `Authorization: Bearer ${CRON_SECRET}` header.
//       Vercel Cron passes this header automatically when the env var
//       is set; manual curl calls must supply it.
//
// Call runCilScrape from lib/scraper/cil-deal-scraper.ts — the same
// module the CLI script uses. Returns a JSON summary.

import { NextRequest, NextResponse } from "next/server";
import { runCilScrape } from "@/lib/scraper/cil-deal-scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Vercel default function timeout is 300s (5min). 26 listings × 2s ×
// up to 3 candidate paths ~= 160s worst-case. Well inside budget.
export const maxDuration = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

async function handle(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  if (!SERVICE_KEY) {
    return NextResponse.json(
      {
        skipped: true,
        reason: "SUPABASE_SERVICE_ROLE_KEY not configured",
        ran_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  try {
    const summary = await runCilScrape({
      supabaseUrl: SUPABASE_URL,
      serviceKey: SERVICE_KEY,
      mode: "live",
      apply: true,
      maxListings: 30,
    });
    console.log("[scrape-deals]", JSON.stringify({
      mode: summary.mode,
      listings_processed: summary.listings_processed,
      deals_inserted: summary.deals_inserted.length,
      deals_updated: summary.deals_updated.length,
      deals_aged: summary.deals_aged.length,
      fetch_errors: summary.fetch_errors.length,
      rate_limited_hosts: summary.rate_limited_hosts,
    }));
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[scrape-deals] fatal", err);
    return NextResponse.json(
      { error: String((err as Error).message), ran_at: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
