// app/api/alerts/signup/route.ts
// ============================================================
// ALERT SIGNUP API — the Monday report (and the Pro waitlist fallback).
// Accepts a regular form POST (303 redirect) or JSON ({ ok, status }).
//
// Double opt-in: a new address (or one that unsubscribed) is saved inactive
// and gets a confirm email; nothing is sent until the link is tapped
// (/api/alerts/subscribe-confirm). A confirmed subscriber just updates their
// preferences. status: "pending" = check your email, "active" = already on.
//
// Abuse controls: honeypot, cross-site refusal, body cap, per-client rate
// limit, one confirm email per address per 10 minutes.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { subscribeWeekly } from "@/lib/alertSubscribers";
import { sendWeeklyConfirm } from "@/lib/weeklyConfirm";
import { rateLimited, clientKey } from "@/lib/rateLimit";
import { readJsonBody, crossSiteRequest, honeypotTripped, normalizeEmail, cleanLine, MAX_FORM_BYTES } from "@/lib/validation";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(["all", "flower", "edibles", "vapes", "concentrate"]);

type Input = { email: unknown; city: unknown; tier: unknown; categories: unknown[]; phone: unknown; honeypot: boolean };

async function readInput(req: NextRequest, wantsJson: boolean): Promise<Input | { error: string; status: number }> {
  if (wantsJson) {
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return { error: parsed.error, status: parsed.status };
    const b = parsed.body;
    return {
      email: b.email,
      city: b.city,
      tier: b.tier,
      categories: Array.isArray(b.categories) ? b.categories : [],
      phone: null,
      honeypot: honeypotTripped(b),
    };
  }
  if (Number(req.headers.get("content-length") || 0) > MAX_FORM_BYTES) return { error: "That's too much text.", status: 413 };
  const form = await req.formData().catch(() => null);
  if (!form) return { error: "Couldn't read that.", status: 400 };
  return {
    email: form.get("email"),
    city: form.get("city"),
    tier: form.get("tier"),
    categories: form.getAll("categories"),
    phone: form.get("phone"),
    honeypot: typeof form.get("website") === "string" && String(form.get("website")).trim() !== "",
  };
}

export async function POST(req: NextRequest) {
  const wantsJson = (req.headers.get("content-type") || "").includes("application/json");
  const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });
  try {
    if (crossSiteRequest(req.headers)) return fail("Forbidden", 403);
    if (rateLimited(`signup:${clientKey(req.headers)}`, 5, 10 * 60_000)) {
      return fail("Too many tries. Give it a few minutes.", 429);
    }
    const input = await readInput(req, wantsJson);
    if ("error" in input) return fail(input.error, input.status);
    if (input.honeypot) return wantsJson ? NextResponse.json({ ok: true, status: "pending" }) : NextResponse.redirect(new URL("/alerts/confirmed", req.url), { status: 303 });

    const email = normalizeEmail(input.email);
    if (!email) return fail("Enter a valid email", 400);
    const city = cleanLine(input.city, 40)?.toLowerCase() || null;
    if (!city) return fail("Email and city are required", 400);
    const categories = input.categories
      .filter((c): c is string => typeof c === "string" && CATEGORIES.has(c))
      .slice(0, 5);
    const tier = input.tier === "pro" || input.tier === "standard" ? input.tier : "free";

    // Optional phone → E.164, otherwise dropped.
    let phone: string | null = null;
    if (typeof input.phone === "string" && input.phone.length <= 30) {
      const digits = input.phone.replace(/\D/g, "");
      if (digits.length === 10) phone = `+1${digits}`;
      else if (digits.length === 11 && digits.startsWith("1")) phone = `+${digits}`;
    }

    const saved = await subscribeWeekly({
      email,
      city,
      categories: categories.length ? categories : ["all"],
      alert_type: tier === "pro" ? "instant" : tier === "standard" ? "daily" : "weekly",
      phone,
    });
    if (!saved.ok) {
      console.error(`[alerts/signup] save failed: ${saved.reason}`);
      return fail("Failed to save signup", saved.reason === "unavailable" ? 503 : 500);
    }
    if (saved.status === "pending") {
      const sent = await sendWeeklyConfirm(email, saved.id);
      if (sent === "unavailable" || sent === "failed") {
        return fail("We couldn't send the confirm email just now. Try again later.", sent === "unavailable" ? 503 : 502);
      }
    }
    if (wantsJson) return NextResponse.json({ ok: true, status: saved.status });
    const next = new URL("/alerts/confirmed", req.url);
    if (saved.status === "pending") next.searchParams.set("pending", "1");
    return NextResponse.redirect(next, { status: 303 });
  } catch (err) {
    console.error("Alert signup error:", err);
    return fail("Something went wrong", 500);
  }
}
