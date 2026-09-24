import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
