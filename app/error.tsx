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
  }, [error]);

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#f5f4f0",
        color: "#0f1f3d",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
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
        <div
          style={{
            fontSize: ".7rem",
            fontWeight: 700,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#dc2626",
            fontFamily: "system-ui, sans-serif",
            marginBottom: 10,
          }}
        >
          Something didn&apos;t load
        </div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 }}>
          Try that again
        </h1>
        <p
          style={{
            fontSize: ".9rem",
            color: "#6b7280",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1.55,
            marginBottom: 18,
          }}
        >
          We couldn&apos;t load this part of the site. It&apos;s probably temporary —
          try again, or head home.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 700,
              fontSize: ".88rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              background: "transparent",
              color: "#0f1f3d",
              border: "1px solid #d1cfc6",
              borderRadius: 10,
              padding: "10px 18px",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              fontSize: ".88rem",
              textDecoration: "none",
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
