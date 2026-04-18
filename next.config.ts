import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Next 16 removed the `eslint` key from NextConfig — ESLint flat
  // config (eslint.config.mjs) drives linting now. Build does not
  // run eslint automatically, so no opt-out needed here.
};

export default nextConfig;
