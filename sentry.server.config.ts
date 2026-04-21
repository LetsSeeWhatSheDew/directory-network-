// sentry.server.config.ts
// Server-side Sentry init (Node runtime). No-op if SENTRY_DSN is unset.
// Basic exception capture only.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || "development",
    tracesSampleRate: 0,
  });
}
