// app/api/deals/submit/route.ts
// POST handler for the dispensary-deal submission form.
//
// Guard: the underlying `deal_submissions` table (migration
// sql/migrations/2026-04-21-deal-submissions.sql) is NOT YET APPLIED.
// We probe for it with a 1-row HEAD against the REST API and short-circuit
// to a 503 "temporarily unavailable" response if the table is missing.
// Once Matthew applies the migration, the probe starts succeeding and
// submissions land normally — no deploy required.

import { NextRequest, NextResponse } from "next/server";
import {
  coerceSubmission,
  toInsertPayload,
  validateSubmission,
} from "../../../../lib/submissionValidation";
import { rateLimited, clientKey, firstTimeWithin, forgetSeen } from "../../../../lib/rateLimit";
import { readJsonBody, crossSiteRequest, honeypotTripped } from "../../../../lib/validation";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

async function tableExists(): Promise<boolean> {
  // HEAD with limit=1 returns 200 if the table exists (even empty),
  // 404 or schema error if it doesn't.
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deal_submissions?select=id&limit=1`,
      {
        method: "HEAD",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Content-type guard
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ error: "Expected application/json" }, { status: 415 });
  }
  if (crossSiteRequest(req.headers)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit: 5 submissions per client per hour (salted in-memory hash;
  // the IP itself is never stored or logged).
  const client = clientKey(req.headers);
  if (rateLimited(`deal-submit:${client}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many submissions. Try again in an hour." },
      { status: 429 }
    );
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.status === 413 ? "That's too much text." : "Malformed JSON" }, { status: parsed.status });
  }

  // Honeypot — any value in `website` is a bot. Drop silently with a 200
  // so the bot thinks it succeeded and moves on.
  if (honeypotTripped(parsed.body)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  const body = coerceSubmission(parsed.body);

  // Schema validation
  const errors = validateSubmission(body);
  if (errors.length > 0) {
    const fieldErrors: Record<string, string> = {};
    errors.forEach((e) => {
      if (!fieldErrors[e.field]) fieldErrors[e.field] = e.message;
    });
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", fieldErrors },
      { status: 400 }
    );
  }

  // Migration not applied yet? Fail fast with a friendly 503.
  const exists = await tableExists();
  if (!exists) {
    return NextResponse.json(
      {
        error:
          "Deal submission temporarily unavailable — schema pending. Please try again later.",
      },
      { status: 503 }
    );
  }

  // Same deal from the same address within the hour → stored once.
  const onceKey = `deal-submit:${body.submitter_email.toLowerCase()}:${body.dispensary_slug || body.dispensary_name_freetext}:${body.deal_title.toLowerCase()}`;
  if (!firstTimeWithin(onceKey, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true, id: null }, { status: 200 });
  }

  // Insert. No IP address and no user-agent string: the columns stay null
  // (moderation doesn't need them, and the privacy policy says we don't
  // keep them).
  const payload = {
    ...toInsertPayload(body),
    submitter_ip: null,
    submitter_user_agent: null,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        // minimal: anon has no SELECT policy on deal_submissions, so asking
        // for the row back (RETURNING) would fail RLS.
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      forgetSeen(onceKey);
      const text = await res.text().catch(() => "");
      console.error("[deals/submit] insert failed", res.status, text.slice(0, 200));
      return NextResponse.json(
        {
          error:
            "Submission didn't save. Our team has been notified — please try again in a few minutes.",
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, id: null }, { status: 200 });
  } catch {
    forgetSeen(onceKey);
    return NextResponse.json(
      { error: "Network error reaching the database. Please try again." },
      { status: 502 }
    );
  }
}
