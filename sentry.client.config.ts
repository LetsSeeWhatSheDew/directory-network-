// sentry.client.config.ts
// Client-side Sentry init. No-op if NEXT_PUBLIC_SENTRY_DSN is unset,
// which is the default today — Matthew will add the DSN to Vercel env
// once we're ready to capture real traffic. Basic exception capture
// only: no performance tracing, no session replay, no source map upload.
//
// 2026-09-23: loaded with a dynamic import behind the DSN check. The static
// import shipped ~390 KB of Sentry to every visitor even with no DSN set
// (the biggest chunk on the homepage). With a DSN, behaviour is unchanged.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
  });
}

export {};
