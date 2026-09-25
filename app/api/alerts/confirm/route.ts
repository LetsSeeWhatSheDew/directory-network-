// /api/alerts/confirm?id=<watch id>&x=<expiry unix>&t=<hmac>
// Double opt-in for "Email me new deals" watches.
// GET shows one button; POST (the button) turns the watch on. The extra tap
// keeps mail-scanner link previews (which only GET) from confirming an
// address on someone's behalf.
import { NextRequest, NextResponse } from "next/server";
import { confirmToken, confirmWatch, getWatch, safeEq } from "@/lib/dealWatch";

export const dynamic = "force-dynamic";

function page(body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Confirm · PuffPrice</title><body style="font-family:system-ui,sans-serif;background:#F6F4EE;color:#14201A;display:grid;place-items:center;min-height:100vh;margin:0"><div style="max-width:420px;padding:24px;text-align:center">${body}<p style="font-size:.8rem;color:#66706A;margin-top:28px">For adults 21 and over.</p></div></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

function check(req: NextRequest): { ok: true; id: string } | { ok: false; why: string } {
  const p = req.nextUrl.searchParams;
  const id = p.get("id") || "";
  const x = Number(p.get("x") || 0);
  const t = p.get("t") || "";
  if (!id || !x || !t) return { ok: false, why: "That confirm link is missing a piece." };
  if (!safeEq(t, confirmToken(id, x))) return { ok: false, why: "That confirm link didn't check out." };
  if (x * 1000 < Date.now()) return { ok: false, why: "That confirm link has expired. Sign up again and we'll send a fresh one." };
  return { ok: true, id };
}

const back = `<p><a href="/" style="color:#1F4D36">Back to PuffPrice</a></p>`;

export async function GET(req: NextRequest) {
  const c = check(req);
  if (!c.ok) return page(`<p style="font-size:1.1rem">${c.why}</p>${back}`, 400);
  const row = await getWatch(c.id);
  if (!row) return page(`<p style="font-size:1.1rem">We couldn't find that sign-up. Try signing up again.</p>${back}`, 404);
  const action = `/api/alerts/confirm?${req.nextUrl.searchParams.toString()}`;
  return page(
    `<p style="font-size:1.25rem;margin:0 0 8px">One tap and you're set.</p>
     <p style="color:#3A463F;line-height:1.5;margin:0 0 20px">We'll email <b>${row.email.replace(/[<>&"]/g, "")}</b> on mornings when there's a new deal. Quiet days, no email.</p>
     <form method="post" action="${action.replace(/"/g, "&quot;")}"><button type="submit" style="background:#1F4D36;color:#F6F4EE;border:0;border-radius:12px;padding:13px 22px;font-size:1rem;font-weight:700;cursor:pointer">Yes, email me new deals</button></form>`
  );
}

export async function POST(req: NextRequest) {
  const c = check(req);
  if (!c.ok) return page(`<p style="font-size:1.1rem">${c.why}</p>${back}`, 400);
  const row = await confirmWatch(c.id);
  if (!row) return page(`<p style="font-size:1.1rem">That didn't save. Try the link again in a minute.</p>${back}`, 502);
  const kind = row.alert_type === "store_watch" ? "store" : "city";
  return NextResponse.redirect(new URL(`/alerts/confirmed?watch=${kind}`, req.url), { status: 303 });
}
