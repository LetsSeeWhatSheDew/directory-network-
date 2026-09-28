// /api/alerts/subscribe-confirm?id=<deal_alerts id>&x=<expiry unix>&t=<hmac>
// Double opt-in for the Monday report (lib/alertSubscribers.subscribeWeekly).
// GET shows one button; POST (the button) turns the subscription on. The
// extra tap keeps mail-scanner link previews (which only GET) from
// confirming an address on someone's behalf. Same pattern as
// /api/alerts/confirm, which handles deal watches.
import { NextRequest, NextResponse } from "next/server";
import { confirmWeekly, weeklyConfirmToken } from "@/lib/alertSubscribers";
import { safeEqual } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function page(body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Confirm · PuffPrice</title><body style="font-family:system-ui,sans-serif;background:#F6F4EE;color:#14201A;display:grid;place-items:center;min-height:100vh;margin:0"><div style="max-width:420px;padding:24px;text-align:center">${body}<p style="font-size:.8rem;color:#66706A;margin-top:28px">For adults 21 and over.</p></div></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

function check(req: NextRequest): { ok: true; id: string; x: number; t: string } | { ok: false; why: string } {
  const p = req.nextUrl.searchParams;
  const id = p.get("id") || "";
  const x = Number(p.get("x") || 0);
  const t = p.get("t") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(x) || !/^[0-9a-f]{32}$/.test(t)) return { ok: false, why: "That confirm link is missing a piece." };
  if (!safeEqual(t, weeklyConfirmToken(id, x))) return { ok: false, why: "That confirm link didn't check out." };
  if (x * 1000 < Date.now()) return { ok: false, why: "That confirm link has expired. Sign up again and we'll send a fresh one." };
  return { ok: true, id, x, t };
}

const back = `<p><a href="/" style="color:#1F4D36">Back to PuffPrice</a></p>`;

export async function GET(req: NextRequest) {
  const c = check(req);
  if (!c.ok) return page(`<p style="font-size:1.1rem">${c.why}</p>${back}`, 400);
  // Rebuilt from validated parts only, so nothing user-supplied is echoed.
  const action = `/api/alerts/subscribe-confirm?id=${c.id}&x=${c.x}&t=${c.t}`;
  return page(
    `<p style="font-size:1.25rem;margin:0 0 8px">One tap and you're set.</p>
     <p style="color:#3A463F;line-height:1.5;margin:0 0 20px">We'll send one email a week, on Mondays, with the best Central Illinois deals. Every email has a one-tap way out.</p>
     <form method="post" action="${action}"><button type="submit" style="background:#1F4D36;color:#F6F4EE;border:0;border-radius:12px;padding:13px 22px;font-size:1rem;font-weight:700;cursor:pointer">Yes, send me Mondays</button></form>`
  );
}

export async function POST(req: NextRequest) {
  const c = check(req);
  if (!c.ok) return page(`<p style="font-size:1.1rem">${c.why}</p>${back}`, 400);
  const ok = await confirmWeekly(c.id);
  if (!ok) return page(`<p style="font-size:1.1rem">That didn't save. Try the link again in a minute.</p>${back}`, 502);
  return NextResponse.redirect(new URL("/alerts/confirmed", req.url), { status: 303 });
}
