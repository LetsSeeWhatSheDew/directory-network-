// app/api/cron/menu-baseline/route.ts
// Vercel Cron handler — daily menu baseline pipeline.
//
// Runs the snapshot stage in-process and returns a structured summary.
// Heavier downstream stages (full normalize-write, baseline compute,
// OTD backfill, deal score) are intentionally separate cron entries so
// any single function stays comfortably under the 300s limit and a
// failure in one stage doesn't block the others.
//
// Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron
// sets this header automatically when the env var is configured.
//
// Schedule (see vercel.json):
//   /api/cron/menu-baseline-snapshots  daily at 10:00 UTC
//   /api/cron/menu-baseline-compute    daily at 11:00 UTC
//
// This file is the SNAPSHOTS handler.

import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/cronAuth";
import { runMenuPipeline } from "@/lib/scraper/menu/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

async function handle(req: NextRequest): Promise<NextResponse> {
  const auth = checkCronAuth(req, "menu-baseline");
  if (!auth.ok) return auth.response;

  if (!SERVICE_KEY) {
    return NextResponse.json(
      {
        skipped: true,
        reason: "SUPABASE_SERVICE_ROLE_KEY not configured",
        ran_at: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  try {
    const summary = await runMenuPipeline({
      supabaseUrl: SUPABASE_URL,
      serviceKey: SERVICE_KEY,
    });

    // Breakage detection: if EVERY store failed, this is loud-fail
    // territory. Return non-OK so monitoring picks it up.
    const allFailed =
      summary.stores_attempted > 0 &&
      summary.stores_ok === 0 &&
      summary.stores_empty === 0;

    if (allFailed) {
      console.error("[menu-baseline] ALL STORES FAILED", JSON.stringify(summary));
      return NextResponse.json(summary, { status: 502 });
    }

    // Partial: at least one store succeeded.
    return NextResponse.json(summary, { status: 200 });
  } catch (err) {
    console.error("[menu-baseline] handler error:", (err as Error).message);
    return NextResponse.json(
      {
        error: "pipeline-crashed",
        message: (err as Error).message,
        ran_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
