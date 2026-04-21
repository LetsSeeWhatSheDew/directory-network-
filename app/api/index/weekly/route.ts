// app/api/index/weekly/route.ts
// GET /api/index/weekly
// Returns the PuffPrice Index — rolling average price-per-gram for
// active flower deals across Illinois. Always 200; the `available`
// flag tells the caller whether sample_size crossed the publish
// threshold. Callers can render a "coming soon" state from the same
// payload without a network-level error branch.

import { NextResponse } from "next/server";
import { computeWeeklyIndex } from "@/lib/puffpriceIndex";

export const revalidate = 3600; // 1h cache
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await computeWeeklyIndex();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
