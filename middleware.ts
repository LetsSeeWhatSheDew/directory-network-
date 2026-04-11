import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cleanlist2026";
const COOKIE_NAME = "dn_admin_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Check for valid auth cookie
  const authCookie = req.cookies.get(COOKIE_NAME);
  if (authCookie?.value === ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  // Check for login form POST
  if (req.method === "POST") {
    return NextResponse.next();
  }

  // Not authenticated — redirect to login page
  const loginUrl = new URL("/admin-login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
