// app/api/index/weekly/route.ts
// GET /api/index/weekly
// Returns the PuffPrice Index — rolling average price-per-gram for
// active flower deals across Illinois. 404 when sample size is too
// thin to publish honestly.

import { NextResponse } from "next/server";
import { computeWeeklyIndex } from "@/lib/puffpriceIndex";

export const revalidate = 3600; // 1h cache
export const dynamic = "force-dynamic";

export async function GET() {
  const index = await computeWeeklyIndex();
  if (!index) {
    return NextResponse.json(
      { error: "insufficient_data", message: "Not enough active flower deals to publish an index." },
      { status: 404 }
    );
  }
  return NextResponse.json(index, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
