// app/api/leads/route.ts
import { NextResponse } from "next/server";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}