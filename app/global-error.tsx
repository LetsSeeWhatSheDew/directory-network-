"use client";

// Global error boundary — catches errors thrown in the root layout
// that app/error.tsx cannot catch. Next.js convention: this replaces
// the layout entirely, so it MUST render its own <html>/<body>.

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
          fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          background: "#F7F4ED",
          color: "#1F3D2B",
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
            background: "#FAFAF7",
            border: "1px solid #E8E2D5",
            borderRadius: 14,
            padding: "32px 28px",
            maxWidth: 460,
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(31, 61, 43, 0.08)",
          }}
        >
          <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 12, color: "#1F3D2B" }}>
            Something broke
          </h1>
          <p style={{ fontFamily: "inherit", fontSize: "0.9375rem", color: "#4B5563", lineHeight: 1.55, marginBottom: 20 }}>
            We hit an error we can&apos;t recover from. Reload the page or head back home.
          </p>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#7DBA47",
              color: "#1F3D2B",
              padding: "12px 22px",
              borderRadius: 9999,
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: "0.9375rem",
              textDecoration: "none",
              minHeight: 44,
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
