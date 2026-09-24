"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
  }, [error]);

  return (
    <div
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--pp-paper)",
        color: "var(--pp-ink)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="pp-card-elevated"
        style={{
          padding: "32px 28px",
          maxWidth: 460,
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: ".6875rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-status-expired, #B91C1C)",
            fontFamily: "var(--font-body)",
            marginBottom: 12,
          }}
        >
          Something didn&apos;t load
        </div>
        <h1 style={{ fontFamily: "var(--font-body)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 12, color: "var(--pp-ink)" }}>
          Try that again
        </h1>
        <p
          style={{
            fontSize: ".9375rem",
            color: "var(--color-gray-600, var(--pp-body))",
            fontFamily: "var(--font-body)",
            lineHeight: 1.55,
            marginBottom: 20,
          }}
        >
          We couldn&apos;t load this part of the site. It&apos;s probably temporary —
          try again, or head home.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            className="pp-btn pp-btn-primary"
          >
            Try again
          </button>
          <Link href="/" className="pp-btn pp-btn-outline">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
