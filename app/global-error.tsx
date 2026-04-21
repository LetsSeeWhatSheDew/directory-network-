"use client";

// Global error boundary — catches errors thrown in the root layout
// that app/error.tsx cannot catch. Next.js convention: this replaces
// the layout entirely, so it MUST render its own <html>/<body>.
// Logs to console always; reports to Sentry only if DSN is configured.

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("[global error]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Georgia, serif",
          background: "#f5f4f0",
          color: "#0f1f3d",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          margin: 0,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8e4da",
            borderRadius: 16,
            padding: "32px 28px",
            maxWidth: 440,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 }}>
            Something broke
          </h1>
          <p style={{ fontSize: ".9rem", color: "#6b7280", fontFamily: "system-ui, sans-serif", lineHeight: 1.55, marginBottom: 18 }}>
            We hit an error we can&apos;t recover from. Reload the page or head back home.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              background: "#16a34a",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 10,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 700,
              fontSize: ".88rem",
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
