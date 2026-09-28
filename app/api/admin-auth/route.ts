import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, adminSessionToken, passwordMatches } from "@/lib/adminAuth";
import { rateLimited, clientKey } from "@/lib/rateLimit";
import { readJsonBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Distinct error codes so the login UI can tell the user *why* a sign-in
// failed, not just "incorrect password." Most preview-deploy debugging
// happens at the env-var layer — surfacing "config_missing" beats a
// generic 401 every time.
type AdminAuthError = "config_missing" | "bad_password" | "rate_limited";

export async function POST(req: NextRequest) {
  // Brute-force brake: 5 tries per 15 minutes per client (per instance).
  // No global cap, so a stranger can't lock the owner out.
  if (rateLimited(`admin-login:${clientKey(req.headers)}`, 5, 15 * 60_000)) {
    const body: { error: AdminAuthError; message: string } = { error: "rate_limited", message: "Too many tries. Wait 15 minutes." };
    return NextResponse.json(body, { status: 429, headers: { "Retry-After": "900" } });
  }

  const token = await adminSessionToken();
  if (!token) {
    const body: { error: AdminAuthError; message: string } = {
      error: "config_missing",
      message:
        "ADMIN_PASSWORD env var is not set on this deployment. Set it for the Preview environment in Vercel and redeploy.",
    };
    return NextResponse.json(body, { status: 500 });
  }

  const parsed = await readJsonBody(req, 2048);
  const password = parsed.ok ? parsed.body.password : undefined;

  if (!passwordMatches(password)) {
    const body: { error: AdminAuthError; message: string } = {
      error: "bad_password",
      message: "Incorrect password.",
    };
    return NextResponse.json(body, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // The cookie is a hash derived from the password, never the password
  // itself (lib/adminAuth.ts). Strict: admin links from email or other sites
  // shouldn't carry the session.
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
