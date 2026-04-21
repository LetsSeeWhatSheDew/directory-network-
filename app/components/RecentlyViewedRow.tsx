"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRecentlyViewed, type RecentItem } from "../../lib/recentlyViewed";

// Renders a compact horizontal row of the user's last 5 dispensary visits.
// Returns null on first visit or if localStorage is unavailable — the
// homepage calls this unconditionally; it decides whether to appear.
export default function RecentlyViewedRow() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Recently visited dispensaries"
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 28px 36px",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#16a34a",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 10,
        }}
      >
        Recently visited
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 6,
          scrollbarWidth: "none",
        }}
      >
        {items.map((it) => (
          <Link
            key={it.slug}
            href={`/l/${it.slug}`}
            style={{
              flexShrink: 0,
              background: "#fff",
              border: "1px solid #e8e4da",
              borderRadius: 10,
              padding: "10px 14px",
              textDecoration: "none",
              color: "#0f1f3d",
              fontFamily: "system-ui, sans-serif",
              minWidth: 160,
              maxWidth: 240,
              transition: "border-color .15s",
            }}
          >
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {it.name}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#6b7280",
                marginTop: 2,
              }}
            >
              {it.city || ""}
            </div>
          </Link>
        ))}
      </div>
      <style>{`
        section[aria-label="Recently visited dispensaries"] > div::-webkit-scrollbar{display:none}
      `}</style>
    </section>
  );
}
