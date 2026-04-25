import { NextRequest, NextResponse } from "next/server";
import {
  isInCentralIL,
  CANNABIS_IL_NON_CITY_SLUGS,
} from "./lib/visibility";

const COOKIE_NAME = "dn_admin_auth";

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

  // Legacy `/cannabis/illinois` hub — the old "directory of all Illinois
  // cities" surface. The Central IL homepage absorbs that role today.
  if (pathname === "/cannabis/illinois" || pathname === "/cannabis/illinois/") {
    return NextResponse.redirect(new URL("/", req.url), 308);
  }

  // Legacy `/cannabis/illinois/:slug(/...)` city routes. The new canonical
  // template lives at `/city/:slug`. CIL slugs 308 to the new home; the
  // three content pages (first-time-guide, laws, open-now) pass through
  // unchanged; everything else 404s.
  const cityMatch = pathname.match(/^\/cannabis\/illinois\/([^/]+)(\/.*)?$/);
  if (cityMatch) {
    const slug = cityMatch[1];

    if (CANNABIS_IL_NON_CITY_SLUGS.has(slug)) {
      return NextResponse.next();
    }

    if (isInCentralIL(slug)) {
      return NextResponse.redirect(
        new URL(`/city/${slug.toLowerCase()}`, req.url),
        308
      );
    }

    return new NextResponse(null, { status: 404 });
  }

  // Central IL scope gate for /city/:slug. Non-CIL city landings return
  // 404, so the new template never serves out-of-scope content.
  const cityLanding = pathname.match(/^\/city\/([^/]+)\/?$/);
  if (cityLanding) {
    const slug = cityLanding[1];
    if (!isInCentralIL(slug)) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/cannabis/illinois",
    "/cannabis/illinois/:path*",
    "/city/:slug*",
  ],
};
