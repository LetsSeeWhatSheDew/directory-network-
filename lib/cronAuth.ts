// lib/cronAuth.ts
//
// Shared bearer-token auth for /api/cron/* routes. Vercel Cron sends
// `Authorization: Bearer ${CRON_SECRET}` automatically when the env var
// is set on the project. Manual curl invocations must supply the same
// header.
//
// History note: a previous version of the per-route auth check failed
// silently when CRON_SECRET was pasted into Vercel env with a trailing
// newline (the literal env value was `<secret>\n`, which never matched
// the bare `<secret>` Vercel sends in the header). This helper trims
// both sides before comparison and emits a structured one-line log so
// the next 401 mystery is debuggable from Vercel Logs alone.
//
// Usage:
//   const auth = checkCronAuth(req, "scrape-deals");
//   if (!auth.ok) return auth.response;

import { NextRequest, NextResponse } from "next/server";

export type CronAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

export function checkCronAuth(req: NextRequest, route: string): CronAuthResult {
  // headers.get is case-insensitive in Next.js, so this catches
  // "Authorization", "authorization", and "AUTHORIZATION".
  const rawHeader = req.headers.get("authorization") ?? "";
  const headerValue = rawHeader.trim();
  const headerPresent = headerValue.length > 0;
  const headerStartsWithBearer = /^bearer\s+/i.test(headerValue);
  const headerToken = headerValue.replace(/^bearer\s+/i, "").trim();

  const envSecret = (process.env.CRON_SECRET ?? "").trim();
  const envPresent = envSecret.length > 0;

  const tokenMatches =
    envPresent &&
    headerToken.length === envSecret.length &&
    timingSafeEqual(headerToken, envSecret);

  if (!envPresent || !tokenMatches) {
    // One-line structured log so the next 401 debugging session is
    // grep-able. Never logs the actual secret value, only presence
    // and length so an operator can see "header was 43 chars, env was
    // 43 chars, did not match" without leaking the secret.
    console.warn(
      `[cron-auth] 401 route=${route} env_present=${envPresent} env_len=${envSecret.length} header_present=${headerPresent} header_bearer=${headerStartsWithBearer} header_token_len=${headerToken.length} match=${tokenMatches}`
    );
    return {
      ok: false,
      response: new NextResponse("unauthorized", { status: 401 }),
    };
  }

  return { ok: true };
}

// Constant-time string comparison. Avoids exposing the secret length /
// matched-prefix length via response timing. Standard library has
// `crypto.timingSafeEqual` but it requires Buffer of equal length, so we
// pre-check length and then iterate. Inputs that aren't equal length
// short-circuit to false above before reaching this.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
