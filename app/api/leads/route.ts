// app/api/leads/route.ts
import { NextResponse } from "next/server";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY } = process.env;

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json(
      { error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    let {
      listing_id,
      project_tag,
      listing_name,
      name,
      email,
      company,
      message,
      // extra from /get-listed
      mode,
      directory,
      business_name,
      website,
      // extra from city page email capture
      source,
    } = body;

    if (!project_tag && directory) {
      project_tag = directory;
    }

    if (!listing_name && business_name) {
      listing_name = business_name;
    }

    if (!listing_id) {
      const now = Date.now();
      if (mode === "new_listing") {
        listing_id = `new-${project_tag || directory || "unknown"}-${now}`;
      } else {
        listing_id = `unknown-${now}`;
      }
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: name, email" },
        { status: 400 }
      );
    }

    const baseUrl = SUPABASE_URL.replace(/\/$/, "");
    const url = baseUrl + "/rest/v1/leads";

    const payload = {
      listing_id,
      project_tag,
      listing_name,
      name,
      email,
      company: company || website || null,
      message,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Supabase insert error:", text);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }

    // Fire-and-forget email notification via Resend
    if (RESEND_API_KEY) {
      (async () => {
        try {
          // Extract city from source pattern like "city-page-peoria"
          let city = null;
          if (source && typeof source === "string") {
            const match = source.match(/city-page-(\w+)/i);
            if (match) {
              city = match[1];
            }
          }

          const businessName = listing_name || business_name || "Unknown Business";
          const location = city || company || "N/A";

          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
              <div style="border-bottom: 2px solid #50c878; padding-bottom: 12px; margin-bottom: 24px;">
                <span style="font-size: 13px; color: #8a9490; letter-spacing: 1px; text-transform: uppercase;">CleanList</span>
                <span style="font-size: 13px; color: #ccc; margin: 0 8px;">|</span>
                <span style="font-size: 13px; color: #50c878; font-weight: 600;">New Lead</span>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0; font-size: 12px; color: #8a9490; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Business</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600;">${businessName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0; font-size: 12px; color: #8a9490; text-transform: uppercase; letter-spacing: 0.5px;">Contact</td>
                  <td style="padding: 10px 0; font-size: 14px;">${name} &mdash; <a href="mailto:${email}" style="color: #50c878;">${email}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0; font-size: 12px; color: #8a9490; text-transform: uppercase; letter-spacing: 0.5px;">Market</td>
                  <td style="padding: 10px 0; font-size: 14px;">${location}</td>
                </tr>
              </table>

              ${message ? `<div style="background: #f8f8f6; padding: 16px; border-left: 3px solid #50c878; margin: 20px 0; font-size: 13px; color: #444; line-height: 1.6;">${message}</div>` : ""}

              <div style="margin-top: 28px;">
                <a href="https://directory-network-eta.vercel.app/admin" style="background-color: #050f09; color: #50c878; padding: 10px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Open Dashboard &rarr;</a>
              </div>

              <p style="color: #bbb; font-size: 11px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 12px;">
                CleanList &middot; Operator notifications
              </p>
            </div>
          `;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "CleanList <notifications@updates.jacarandapeoria.com>",
              to: ["matthew@jacarandapeoria.com"],
              subject: `New Lead: ${businessName}`,
              html: emailHtml,
            }),
          });
        } catch (emailErr) {
          console.error("Failed to send Resend notification:", emailErr);
          // Don't throw - this is fire-and-forget
        }
      })();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}