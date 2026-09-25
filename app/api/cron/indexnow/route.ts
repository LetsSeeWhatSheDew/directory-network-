// GET /api/cron/indexnow — daily after the scrape. Pings IndexNow with the
// pages whose content changes every day (deals, reports, store pages that
// have live deals). Auth: Authorization: Bearer ${CRON_SECRET}.
import { NextRequest, NextResponse } from "next/server";
import { brand } from "@/lib/brand";
import { submitIndexNow } from "@/lib/indexNow";
import { REGION_CITIES } from "@/lib/waysToBuy";

export const dynamic = "force-dynamic";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const u = brand.url;
  const host = new URL(u).host;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  let slugs: string[] = [];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/deals?select=listing_slug&project_tag=eq.green&is_active=eq.true`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, cache: "no-store" });
    const rows: Array<{ listing_slug: string }> = r.ok ? await r.json() : [];
    slugs = [...new Set(rows.map((x) => x.listing_slug))];
  } catch {}
  const urls = [
    u, `${u}/this-week`, `${u}/deal-index`, `${u}/ways-to-buy`, `${u}/open-late`, `${u}/drive-thru`, `${u}/medical`,
    `${u}/deals/all`, `${u}/llms.txt`, `${u}/llms-full.txt`, `${u}/out-the-door`, `${u}/cheapest`, `${u}/status`, `${u}/green-wednesday`,
    `${u}/guides/best-day-for-dispensary-deals`, `${u}/guides/illinois-cannabis-prices-2026`, `${u}/guides/dispensary-first-time-discounts-central-illinois`, `${u}/guides/where-to-buy-near-isu-and-uiuc`, `${u}/guides/buying-cannabis-in-illinois-as-an-out-of-state-visitor`,
    ...REGION_CITIES.map((c) => `${u}/city/${c.toLowerCase().replace(/\s+/g, "-")}`),
    ...slugs.map((s) => `${u}/dispensary/${s}`),
  ];
  const res = await submitIndexNow(host, urls);
  return NextResponse.json({ ok: res.status >= 200 && res.status < 300, ...res });
}
