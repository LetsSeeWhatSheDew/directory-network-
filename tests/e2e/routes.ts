// tests/e2e/routes.ts
// Which URLs the smoke suite visits. Static routes are discovered from
// app/**/page.{tsx,jsx}; every dynamic route needs real sample URLs here.
// A new dynamic route with no entry fails the suite on purpose — add one.
import fs from "node:fs";
import path from "node:path";

const APP = path.join(process.cwd(), "app");

/** "app/cheapest/[city]/[item]/page.tsx" → "/cheapest/[city]/[item]". */
export function discoverRoutes(dir = APP, prefix = ""): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name.startsWith("_") || e.name.startsWith("@") || e.name === "api") continue;
      // Route groups "(x)" don't add a path segment.
      const seg = /^\(.*\)$/.test(e.name) ? "" : `/${e.name}`;
      out.push(...discoverRoutes(path.join(dir, e.name), prefix + seg));
    } else if (/^page\.(tsx|jsx|ts|js)$/.test(e.name)) {
      out.push(prefix || "/");
    }
  }
  return [...new Set(out)].sort();
}

export const isDynamic = (route: string) => route.includes("[");

/** Real slugs (they exist in production and in tests/fixtures/data.mjs).
 *  Answer routes list a well-covered city, a thin one and a city with no
 *  store of its own, so empty states get rendered too. */
export const DYNAMIC_SAMPLES: Record<string, string[]> = {
  "/brand/[slug]": ["/brand/cresco"],
  "/cannabis/missouri/[slug]": ["/cannabis/missouri/st-louis"],
  "/city/[city]": ["/city/peoria", "/city/springfield"],
  "/claim/[slug]": ["/claim/noxx-east-peoria"],
  "/deal/[id]": ["/deal/00000000-0000-4000-8000-000000005000"],
  "/deals/[category]": ["/deals/all", "/deals/flower"],
  "/dispensary/[slug]": ["/dispensary/noxx-east-peoria", "/dispensary/nuera-urbana"],
  "/for-dispensaries/[slug]": ["/for-dispensaries/noxx-east-peoria"],
  "/for-dispensaries/[slug]/card": ["/for-dispensaries/noxx-east-peoria/card"],
  "/l/[id]": ["/l/noxx-east-peoria"],
  "/cheapest/[city]": ["/cheapest/peoria", "/cheapest/champaign"],
  "/cheapest/[city]/[item]": ["/cheapest/peoria/eighth", "/cheapest/normal/edibles", "/cheapest/springfield/vape-cart", "/cheapest/morton/eighth"],
  "/best-deals/[city]": ["/best-deals/peoria", "/best-deals/urbana", "/best-deals/morton"],
  "/open-late/[city]": ["/open-late/peoria", "/open-late/normal", "/open-late/washington"],
  "/medical/[city]": ["/medical/peoria-heights", "/medical/urbana", "/medical/bartonville"],
  "/drive-thru/[city]": ["/drive-thru/pekin", "/drive-thru/springfield"],
  // PR #8. A common (pre-rendered, indexed) pair and an on-demand one (noindex).
  // Its static pages — /deal-of-the-day, /route, /green-wednesday, /420, /710,
  // /price-watch — are picked up by discoverRoutes() automatically.
  "/route/[pair]": ["/route/peoria-to-bloomington", "/route/east-peoria-to-champaign"],
};

/** Sample URLs that only exist in the fixture data (skipped with BASE_URL). */
export const FIXTURE_ONLY = new Set(["/deal/00000000-0000-4000-8000-000000005000"]);

/** Known problems on pages owned by another in-flight work stream, tolerated
 *  so CI stays meaningful while they're fixed there. Ratchet: once a listed
 *  problem stops happening, the test fails until the entry is removed.
 *  Keys are the visited URL; values are problem prefixes as the suite words them.
 *
 *  2026-09-27: these pages don't use the Breathe page components yet and are
 *  being restyled in a parallel session; each needs `alternates.canonical`
 *  (public pages) or `robots: noindex` (confirmation / dashboard screens). */
export const KNOWN_ISSUES: Record<string, string[]> = {
  "/about": ["missing canonical"],
  "/about/index": ["missing canonical"],
  "/alerts": ["missing canonical"],
  "/alerts/confirmed": ["missing canonical"],
  "/early-access": ["missing canonical"], // 308 → /alerts
  "/get-listed": ["missing canonical"],
  "/map": ["missing canonical"],
  "/savings": ["missing canonical"],
  "/savings/dashboard": ["missing canonical"],
  "/upgrade/success": ["missing canonical"],
  "/dispensary/submit-deal": ["missing canonical"],
};

/** The URLs to visit, in order. */
export function smokeUrls(): string[] {
  return discoverRoutes().flatMap((r) => (isDynamic(r) ? DYNAMIC_SAMPLES[r] || [] : [r]));
}

export function missingSamples(): string[] {
  return discoverRoutes().filter((r) => isDynamic(r) && !(DYNAMIC_SAMPLES[r] && DYNAMIC_SAMPLES[r].length));
}
