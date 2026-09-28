// app/api/leads/route.ts
// "Claim this listing" / "Get listed" / city email capture → public.leads,
// plus a fire-and-forget operator email via Resend.
//
// Abuse controls: cross-site refusal, 16 KB body cap, per-client rate limit,
// per-field length caps, same email + listing stored once per hour. Every
// user-supplied value is HTML-escaped before it goes into the operator email
// (it used to be interpolated raw, so a submission could inject markup and
// links into mail the owner trusts).
import { NextResponse, after } from "next/server";
import { rateLimited, clientKey, firstTimeWithin, forgetSeen } from "@/lib/rateLimit";
import { readJsonBody, crossSiteRequest, normalizeEmail, cleanLine, cleanText, escapeHtml, hasLink } from "@/lib/validation";

const TAG_RE = /^[a-z0-9_-]{1,32}$/;
const token = (v: unknown) => (typeof v === "string" && TAG_RE.test(v.trim().toLowerCase()) ? v.trim().toLowerCase() : null);

export async function POST(request: Request) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY } = process.env;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY;
  const supabaseUrl = SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }
  if (crossSiteRequest(request.headers)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const client = clientKey(request.headers);
  if (rateLimited(`leads:${client}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many tries. Give it a few minutes." }, { status: 429 });
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const body = parsed.body;

  const email = normalizeEmail(body.email);
  const tierInterest = token(body.tier_interest);
  // The city-page email capture sends no name; label it so the row saves.
  const name = cleanLine(body.name, 100) || (tierInterest === "newsletter" ? "Newsletter subscriber" : null);
  if (!name || !email) {
    return NextResponse.json({ error: "Missing required fields: name, email" }, { status: 400 });
  }
  const projectTag = token(body.project_tag) || token(body.directory);
  const listingName = cleanLine(body.listing_name, 200) || cleanLine(body.business_name, 200);
  const company = cleanLine(body.company, 200) || cleanLine(body.website, 200);
  const message = cleanText(body.message, 2000);
  const source = token(body.source);
  if (hasLink(name) || hasLink(listingName)) {
    return NextResponse.json({ error: "Please leave links out of the name fields." }, { status: 400 });
  }
  let listingId = cleanLine(body.listing_id, 120);
  if (!listingId) {
    const now = Date.now();
    listingId = body.mode === "new_listing" ? `new-${projectTag || "unknown"}-${now}` : `unknown-${now}`;
  }

  const onceKey = `leads:${email}:${body.listing_id ?? listingName ?? ""}`;
  if (!firstTimeWithin(onceKey, 3600_000)) return NextResponse.json({ ok: true });

  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      listing_id: listingId,
      project_tag: projectTag,
      listing_name: listingName,
      name,
      email,
      company,
      message,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);

  if (!res || !res.ok) {
    forgetSeen(onceKey);
    console.error("Supabase insert error:", res ? (await res.text().catch(() => "")).slice(0, 300) : "timeout");
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }

  // Fire-and-forget email notification via Resend
  if (RESEND_API_KEY) {
    // Extract city from source pattern like "city-page-peoria"
    const city = source?.match(/^city-page-([a-z0-9-]+)$/)?.[1] ?? null;
    const businessName = listingName || "Unknown Business";
    const location = city || company || "N/A";
    const e = escapeHtml;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <div style="border-bottom: 2px solid #50c878; padding-bottom: 12px; margin-bottom: 24px;">
          <span style="font-size: 13px; color: #8a9490; letter-spacing: 1px; text-transform: uppercase;">PuffPrice</span>
          <span style="font-size: 13px; color: #ccc; margin: 0 8px;">|</span>
          <span style="font-size: 13px; color: #50c878; font-weight: 600;">New Lead</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-size: 12px; color: #8a9490; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Business</td>
            <td style="padding: 10px 0; font-size: 14px; font-weight: 600;">${e(businessName)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-size: 12px; color: #8a9490; text-transform: uppercase; letter-spacing: 0.5px;">Contact</td>
            <td style="padding: 10px 0; font-size: 14px;">${e(name)} &mdash; <a href="mailto:${e(email)}" style="color: #50c878;">${e(email)}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-size: 12px; color: #8a9490; text-transform: uppercase; letter-spacing: 0.5px;">Market</td>
            <td style="padding: 10px 0; font-size: 14px;">${e(location)}</td>
          </tr>
        </table>

        ${message ? `<div style="background: #f8f8f6; padding: 16px; border-left: 3px solid #50c878; margin: 20px 0; font-size: 13px; color: #444; line-height: 1.6; white-space: pre-wrap;">${e(message)}</div>` : ""}

        <div style="margin-top: 28px;">
          <a href="https://www.puffprice.com/admin" style="background-color: #050f09; color: #50c878; padding: 10px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Open Dashboard &rarr;</a>
        </div>

        <p style="color: #bbb; font-size: 11px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 12px;">
          PuffPrice &middot; Operator notifications
        </p>
      </div>
    `;

    // after(): the response returns now; the send finishes before the
    // function is frozen (a bare un-awaited fetch can be cut off).
    after(() => fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PuffPrice <notifications@updates.jacarandapeoria.com>",
        to: ["matthew@jacarandapeoria.com"],
        // Header-safe: cleanLine already stripped newlines/control chars.
        subject: `New Lead: ${businessName}`.slice(0, 150),
        html: emailHtml,
      }),
      signal: AbortSignal.timeout(8000),
    }).then(() => undefined, (emailErr) => {
      console.error("Failed to send Resend notification:", emailErr);
    }));
  }

  return NextResponse.json({ ok: true });
}
