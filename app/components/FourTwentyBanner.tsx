"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Auto-gates Apr 17 00:00 — Apr 20 23:59 CT. Dismissible via localStorage.
export default function FourTwentyBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const now = new Date();
    const start = new Date("2026-04-17T00:00:00");
    const end = new Date("2026-04-20T23:59:59");
    const inWindow = now >= start && now <= end;
    const dismissed = typeof window !== "undefined" && localStorage.getItem("pp_420_dismissed") === "1";
    setShow(inWindow && !dismissed);
  }, []);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="4/20 deals banner"
      style={{
        background: "#7DBA47",
        color: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".85rem", fontWeight: 700, flex: "1 1 auto", minWidth: 0 }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            4/20 Deals — Live Now. Find the best 4/20 offers near you before they&rsquo;re gone.
          </span>
        </span>
        <Link
          href="/deals/all"
          style={{
            color: "#fff",
            textDecoration: "underline",
            fontSize: ".85rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          See 4/20 deals →
        </Link>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("pp_420_dismissed", "1");
            setShow(false);
          }}
          aria-label="Dismiss 4/20 banner"
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "1.1rem",
            lineHeight: 1,
            cursor: "pointer",
            padding: "4px 8px",
            opacity: 0.85,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
