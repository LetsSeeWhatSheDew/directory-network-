import { NextRequest, NextResponse } from "next/server";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cleanlist2026";
const COOKIE_NAME = "dn_admin_auth";
const INTENTS = ["best", "open-now", "recreational", "deals"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin auth
  if (pathname.startsWith("/admin")) {
    const authCookie = req.cookies.get(COOKIE_NAME);
    if (authCookie?.value === ADMIN_PASSWORD) return NextResponse.next();
    if (req.method === "POST") return NextResponse.next();
    const loginUrl = new URL("/admin-login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Intent page rewrite — force Next.js to route /[city]/[intent] correctly
  const match = pathname.match(/^\/cannabis\/illinois\/([^/]+)\/([^/]+)$/);
  if (match) {
    const intent = match[2];
    if (INTENTS.includes(intent)) {
      return NextResponse.rewrite(new URL(pathname, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cannabis/illinois/:city/:intent"],
};
