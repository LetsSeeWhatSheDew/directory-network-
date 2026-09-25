// GET/POST /api/alerts/unsubscribe?e=<email>&t=<hmac>   everything for that email
// GET/POST /api/alerts/unsubscribe?w=<watch id>&t=<hmac> just that one deal watch
// One-click unsubscribe (RFC 8058 POST from mail clients, GET from the link).
import { NextRequest, NextResponse } from "next/server";
import { deactivateAlert, unsubscribeToken } from "@/lib/alertSubscribers";
import { stopWatch, watchStopToken, safeEq } from "@/lib/dealWatch";
import { timingSafeEqual } from "crypto";

async function handle(req: NextRequest) {
  const e = (req.nextUrl.searchParams.get("e") || "").trim().toLowerCase();
  const w = (req.nextUrl.searchParams.get("w") || "").trim();
  const t = req.nextUrl.searchParams.get("t") || "";
  let ok = false;
  if (w) {
    ok = safeEq(t, watchStopToken(w)) ? await stopWatch(w) : false;
  } else {
    const expected = e ? unsubscribeToken(e) : "";
    const valid = !!e && t.length === expected.length && timingSafeEqual(Buffer.from(t), Buffer.from(expected));
    ok = valid ? await deactivateAlert(e) : false;
  }
  if (req.method === "POST") return NextResponse.json({ ok });
  const msg = ok
    ? w
      ? "Done. We've stopped that deal email. Anything else you signed up for keeps coming."
      : "You're unsubscribed. No more PuffPrice emails."
    : "That unsubscribe link didn't work. Reply to any PuffPrice email and we'll remove you by hand.";
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Unsubscribe · PuffPrice</title><body style="font-family:system-ui,sans-serif;background:#F6F4EE;color:#14201A;display:grid;place-items:center;min-height:100vh;margin:0"><div style="max-width:420px;padding:24px;text-align:center"><p style="font-size:1.1rem">${msg}</p><p><a href="/" style="color:#1F4D36">Back to PuffPrice</a></p></div></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
export const GET = handle;
export const POST = handle;
