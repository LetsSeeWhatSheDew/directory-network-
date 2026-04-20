import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dn_admin_auth";
const INTENTS = ["best", "open-now", "recreational", "deals"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin auth — read env at request time, never at module eval, so a
  // missing ADMIN_PASSWORD doesn't kill `next build`. If unset, the
  // /admin paths still redirect to login (no auth cookie can match an
  // empty expected value).
  if (pathname.startsWith("/admin")) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authCookie = req.cookies.get(COOKIE_NAME);
    if (adminPassword && authCookie?.value === adminPassword) return NextResponse.next();
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
