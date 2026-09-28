// Environment for running the app against the mock Supabase. Fake keys only:
// nothing here is a secret, and none of it can reach a real service.
import { MOCK_PORT } from "./mock-supabase.mjs";

export function fixtureEnv() {
  const noProxy = ["127.0.0.1", "localhost", process.env.NO_PROXY || process.env.no_proxy].filter(Boolean).join(",");
  return {
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
    SUPABASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "fixture-service-key",
    // Keep analytics, error reporting and payments off in test builds.
    NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-FIXTURE",
    NEXT_PUBLIC_SENTRY_DSN: "",
    SENTRY_DSN: "",
    NEXT_TELEMETRY_DISABLED: "1",
    NO_PROXY: noProxy,
    no_proxy: noProxy,
  };
}
