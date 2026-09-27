// app/api/track/route.ts — first-party event counter.
//
// Accepts {type, slug?, dealId?, city?, meta?, vid?, ref?, utm_source?,
// utm_campaign?} from lib/track.ts and writes one row to `events`
// (project_tag 'green', listing_id = store slug). Taps that carry a deal id
// also go to `deal_clicks`. Validation lives in lib/trackEvent.ts.
//
// Privacy: no IP address and no user-agent string is stored. The IP only
// feeds a salted, in-memory rate-limit hash on this instance (lib/rateLimit)
// and is then forgotten. DNT / Global Privacy Control → not counted.
//
// Always answers 204 fast; the insert runs after the response via after().
// Never throws to the client. No service key → silent no-op.
import { NextResponse, after, type NextRequest } from "next/server";
import { analyticsWriter } from "../../../lib/analyticsDb";
import { rateLimited, clientKey, firstTimeWithin } from "../../../lib/rateLimit";
import { buildTrackRows, isLikelyBot, requestOptsOut, MAX_TRACK_BYTES } from "../../../lib/trackEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noContent = () => new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(req: NextRequest) {
  try {
    if (requestOptsOut(req.headers)) return noContent();
    if (isLikelyBot(req.headers)) return noContent();
    if (Number(req.headers.get("content-length") || 0) > MAX_TRACK_BYTES) return noContent();
    if (rateLimited(`track:${clientKey(req.headers)}`, 60, 60_000)) return noContent();

    const rows = buildTrackRows(await req.text(), req.headers);
    if (!rows) return noContent();

    // Drop exact repeats from the same browser within 2s (double effects,
    // retried beacons). The key is hashed in memory, never stored.
    const { event } = rows;
    const repeatKey = `${event.metadata.vid || clientKey(req.headers)}|${event.event_type}|${event.listing_id || ""}|${event.metadata.deal_id || ""}`;
    if (!firstTimeWithin(`track:${repeatKey}`, 2000)) return noContent();

    const db = analyticsWriter();
    if (!db) return noContent();

    after(async () => {
      try {
        const { error } = await db.from("events").insert(rows.event);
        if (error) console.error("[track] events insert:", error.message);
        if (rows.click) {
          const { error: e2 } = await db.from("deal_clicks").insert(rows.click);
          if (e2) console.error("[track] deal_clicks insert:", e2.message);
        }
      } catch (err) {
        console.error("[track] insert failed:", err);
      }
    });
    return noContent();
  } catch {
    return noContent();
  }
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}
