"use client";

// Client island for the "Ending soon" urgency row. Server fetches a list
// of <24h deals; this component ticks the countdown once a minute and
// hides individual rows as they expire. If the list is empty after
// expiry sweeps, the whole row self-destructs — honest or invisible.

import Link from "next/link";
import { useEffect, useState } from "react";
import { listingHref } from "../../lib/links";

export type EndingSoonDeal = {
  id: string;
  listing_slug: string;
  dispensary_name: string;
  city: string;
  title: string;
  expires_at: string;
};

function formatCountdown(targetIso: string, now: number): string | null {
  const target = new Date(targetIso).getTime();
  if (!Number.isFinite(target)) return null;
  const diff = target - now;
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function EndingSoonRow({ deals }: { deals: EndingSoonDeal[] }) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    // Tick once a minute — second-level precision would be noisy and
    // burn the prerender cache for no user gain.
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const live = deals
    .map((d) => ({ d, left: formatCountdown(d.expires_at, now) }))
    .filter((x): x is { d: EndingSoonDeal; left: string } => x.left !== null);

  if (live.length === 0) return null;

  return (
    <section
      aria-label="Deals ending soon"
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "8px 28px 32px",
      }}
    >
      <div
        style={{
          fontSize: ".7rem",
          fontWeight: 700,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "#b45309",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 10,
        }}
      >
        ⏱ Ending soon
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
        {live.map(({ d, left }) => {
          const href = listingHref(d.listing_slug, d.city);
          if (!href) return null;
          return (
          <Link
            key={d.id}
            href={href}
            style={{
              flexShrink: 0,
              background: "#fff",
              border: "1px solid #fde68a",
              borderLeft: "4px solid #f59e0b",
              borderRadius: 12,
              padding: "12px 14px",
              textDecoration: "none",
              color: "#0f1f3d",
              fontFamily: "system-ui, sans-serif",
              minWidth: 220,
              maxWidth: 280,
              transition: "border-color .15s, transform .05s",
            }}
          >
            <div
              style={{
                fontSize: ".72rem",
                fontWeight: 700,
                color: "#b45309",
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Ends in {left}
            </div>
            <div
              style={{
                fontSize: ".92rem",
                fontWeight: 700,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={d.dispensary_name}
            >
              {d.dispensary_name}
            </div>
            <div
              style={{
                fontSize: ".78rem",
                color: "#374151",
                marginTop: 2,
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={d.title}
            >
              {d.title}
            </div>
            {d.city && (
              <div
                style={{
                  fontSize: ".7rem",
                  color: "#9ca3af",
                  marginTop: 4,
                }}
              >
                {d.city}
              </div>
            )}
          </Link>
          );
        })}
      </div>
      <style>{`
        section[aria-label="Deals ending soon"] > div::-webkit-scrollbar{display:none}
      `}</style>
    </section>
  );
}
