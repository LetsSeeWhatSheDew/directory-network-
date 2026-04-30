// app/api/cron/scrape-deals/route.ts
// Vercel Cron handler — direct-source CIL deal scraper.
// Scheduled daily via vercel.json crons entry (Hobby plan limits cron
// to once per day; upgrade to Pro for more frequent refresh).
//
// Auth: requires `Authorization: Bearer ${CRON_SECRET}` header.
//       Vercel Cron passes this header automatically when the env var
//       is set; manual curl calls must supply it.
//
// Call runCilScrape from lib/scraper/cil-deal-scraper.ts — the same
// module the CLI script uses. Returns a JSON summary.

import { NextRequest, NextResponse } from "next/server";
import { runCilScrape } from "@/lib/scraper/cil-deal-scraper";
import { runDailyVerificationSweep } from "@/lib/scraper/dailyVerification";
import { checkCronAuth } from "@/lib/cronAuth";

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
  const auth = checkCronAuth(req, "scrape-deals");
  if (!auth.ok) return auth.response;

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

    // Post-scrape sweep: bump verified_at on active deals the scraper
    // didn't touch this run (within-48h trust tier) and deactivate ones
    // that have gone 7+ days without an independent verification. See
    // lib/scraper/dailyVerification.ts for the tier policy.
    const verification = await runDailyVerificationSweep({
      supabaseUrl: SUPABASE_URL,
      serviceKey: SERVICE_KEY,
    });

    console.log("[scrape-deals]", JSON.stringify({
      mode: summary.mode,
      listings_processed: summary.listings_processed,
      deals_inserted: summary.deals_inserted.length,
      deals_updated: summary.deals_updated.length,
      deals_aged: summary.deals_aged.length,
      fetch_errors: summary.fetch_errors.length,
      rate_limited_hosts: summary.rate_limited_hosts,
      verification: {
        scanned: verification.scanned,
        bumped: verification.bumped,
        held: verification.held,
        deactivated: verification.deactivated,
        skipped: verification.skipped ?? false,
        reason: verification.reason ?? null,
        errors: verification.errors.length,
      },
    }));
    return NextResponse.json({ ...summary, verification });
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
