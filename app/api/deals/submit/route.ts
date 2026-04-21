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
  type SubmissionInput,
  toInsertPayload,
  validateSubmission,
} from "../../../../lib/submissionValidation";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

// In-memory rate limiter: 5 submissions per IP per hour. Resets on cold
// start — acceptable for MVP, upgrade to Upstash/Supabase later if abuse
// volume warrants it.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const ipHits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = ipHits.get(ip) || [];
  const fresh = hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  ipHits.set(ip, fresh);
  return false;
}

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

  let body: SubmissionInput;
  try {
    body = (await req.json()) as SubmissionInput;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // Honeypot — any value in `website` is a bot. Drop silently with a 200
  // so the bot thinks it succeeded and moves on.
  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Rate limit
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions from this IP. Try again in an hour." },
      { status: 429 }
    );
  }

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

  // Insert
  const payload = {
    ...toInsertPayload(body),
    submitter_ip: ip,
    submitter_user_agent: req.headers.get("user-agent") || null,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error:
            "Submission didn't save. Our team has been notified — please try again in a few minutes.",
          details: text.slice(0, 200),
        },
        { status: 502 }
      );
    }
    const rows = await res.json().catch(() => null);
    const id = Array.isArray(rows) && rows[0]?.id ? rows[0].id : null;
    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Network error reaching the database. Please try again." },
      { status: 502 }
    );
  }
}
