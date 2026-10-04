import type { NextConfig } from "next";

// ── Security headers ────────────────────────────────────────────────────
// Enforced CSP: only directives that can't break a page (no framing by other
// sites, no <base>/<object> injection, forms post only to us, http→https).
// Report-only CSP: the full allow-list. Browsers log violations to the
// console without blocking anything; once it's quiet in production, move it
// to the enforced header. Every third party the site uses today is listed:
//   scripts  Google Analytics (googletagmanager), Vercel toolbar on previews
//   connect  Supabase, GA collect, Sentry ingest, OSM Nominatim (LocationAware),
//            Vercel analytics (same origin: /_vercel/*)
//   images   any https (store logos live on each store's own site; Google
//            Places photos redirect to googleusercontent; OSM map tiles)
//   frames   Google Maps embed on /l/[id]
//   fonts    self-hosted next/font, plus Google Fonts on two /lab pages
const SUPABASE_ORIGIN = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co").replace(/\/$/, "");
const isDev = process.env.NODE_ENV !== "production";

const ENFORCED_CSP = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

const REPORT_ONLY_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://vercel.live`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${SUPABASE_ORIGIN} https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://nominatim.openstreetmap.org https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://vercel.live wss://ws-us3.pusher.com`,
  "frame-src https://maps.google.com https://www.google.com https://vercel.live",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Geolocation stays available to our own pages ("deals near me").
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: ENFORCED_CSP },
  { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_CSP },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Share-image fonts are read from disk by the /og routes (app/og/shared.tsx).
  outputFileTracingIncludes: {
    "/og/**": ["./app/og/fonts/**"],
  },
  // Next 16 removed the `eslint` key from NextConfig — ESLint flat
  // config (eslint.config.mjs) drives linting now. Build does not
  // run eslint automatically, so no opt-out needed here.
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      // SEO consolidation: /dispensary/[slug] is the canonical listing URL.
      // /l/[slug] was the legacy "GO HERE" surface; 308 keeps method/body
      // and tells crawlers the move is permanent.
      {
        source: "/l/:slug",
        destination: "/dispensary/:slug",
        permanent: true,
      },
      // Breathe consolidation (2026-09-23): legacy/off-scope pages.
      { source: "/cannabis", destination: "/", permanent: true },
      { source: "/grow", destination: "/for-dispensaries", permanent: true },
      { source: "/early-access", destination: "/alerts", permanent: true },
      // /deals had no index page (404 since at least Sep 25); the full list lives at /deals/all.
      { source: "/deals", destination: "/deals/all", permanent: true },
    ];
  },
};

export default nextConfig;
