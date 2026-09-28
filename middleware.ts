import { NextRequest, NextResponse } from "next/server";
import {
  isInCentralIL,
  CANNABIS_IL_NON_CITY_SLUGS,
} from "./lib/visibility";
import { isAdmin } from "./lib/adminAuth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin auth — read env at request time, never at module eval, so a
  // missing ADMIN_PASSWORD doesn't kill `next build`. If unset, the
  // /admin paths still redirect to login (no cookie can match).
  // Every method is gated: App Router pages render for POST too, so letting
  // POST through (as an earlier version did) served the admin pages — leads,
  // subscriber data — to anyone who sent a POST.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (await isAdmin(req)) {
      const res = NextResponse.next();
      res.headers.set("Cache-Control", "private, no-store");
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return new NextResponse("unauthorized", { status: 401 });
    }
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
