import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
    ];
  },
};

export default nextConfig;
