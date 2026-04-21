// sentry.client.config.ts
// Client-side Sentry init. No-op if NEXT_PUBLIC_SENTRY_DSN is unset,
// which is the default today — Matthew will add the DSN to Vercel env
// once we're ready to capture real traffic. Basic exception capture
// only: no performance tracing, no session replay, no source map upload.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
