import { NextRequest, NextResponse } from "next/server";
import {
  isInCentralIL,
  CANNABIS_IL_NON_CITY_SLUGS,
} from "./lib/visibility";

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

  // Central IL scope gate for /cannabis/illinois/:city and deeper.
  // Matches: /cannabis/illinois/chicago, /cannabis/illinois/chicago/best,
  // /cannabis/illinois/chicago/hyde-park. The hub page itself
  // (/cannabis/illinois) has no slug so it passes through. Non-geographic
  // slugs (first-time-guide, laws, open-now, ...) are whitelisted.
  const cityMatch = pathname.match(/^\/cannabis\/illinois\/([^/]+)(\/.*)?$/);
  if (cityMatch) {
    const slug = cityMatch[1];
    if (!CANNABIS_IL_NON_CITY_SLUGS.has(slug) && !isInCentralIL(slug)) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // Central IL scope gate for /city/:slug. Same logic — compound slugs
  // and canonical Central IL city slugs pass, everything else 404s.
  const cityLanding = pathname.match(/^\/city\/([^/]+)\/?$/);
  if (cityLanding) {
    const slug = cityLanding[1];
    if (!isInCentralIL(slug)) {
      return new NextResponse(null, { status: 404 });
    }
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
  matcher: [
    "/admin/:path*",
    "/cannabis/illinois/:slug*",
    "/city/:slug*",
  ],
};
