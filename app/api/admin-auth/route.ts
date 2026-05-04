import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dn_admin_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Distinct error codes so the login UI can tell the user *why* a sign-in
// failed, not just "incorrect password." Most preview-deploy debugging
// happens at the env-var layer — surfacing "config_missing" beats a
// generic 401 every time.
type AdminAuthError = "config_missing" | "bad_password";

export async function POST(req: NextRequest) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    const body: { error: AdminAuthError; message: string } = {
      error: "config_missing",
      message:
        "ADMIN_PASSWORD env var is not set on this deployment. Set it for the Preview environment in Vercel and redeploy.",
    };
    return NextResponse.json(body, { status: 500 });
  }

  const { password } = (await req.json()) as { password?: string };

  if (typeof password !== "string" || password !== ADMIN_PASSWORD) {
    const body: { error: AdminAuthError; message: string } = {
      error: "bad_password",
      message: "Incorrect password.",
    };
    return NextResponse.json(body, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // Cookie value is the password itself — keeps the middleware check a
  // single string compare without introducing a session table. Same
  // pattern as the original; just typed.
  res.cookies.set(COOKIE_NAME, ADMIN_PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
