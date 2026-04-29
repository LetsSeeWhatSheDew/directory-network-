"use client";

// app/components/StickyMobileCTA.tsx
// Phase 6 mobile polish: sticky bottom CTA appears once the user has
// scrolled past the hero. Mobile only (hidden on viewports >= 720px).
//
// Uses an IntersectionObserver-on-sentinel pattern — much cheaper than
// a scroll listener. The component renders a 1px sentinel directly
// after the hero in DOM, then watches whether the sentinel has scrolled
// out of view. When it has, the CTA fades in. No throttling needed,
// browser-optimized.

import Link from "next/link";
import { useEffect, useState } from "react";

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const sentinel = document.getElementById("pp-hero-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Sentinel is visible → user has not scrolled past hero → hide CTA.
        // Sentinel is gone → user is past hero → show CTA.
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* The sentinel sits where the bottom of the hero ends. The
          parent layout drops `<div id="pp-hero-sentinel" />` in place
          right after the hero markup. */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "saturate(180%) blur(8px)",
          borderTop: "1px solid var(--color-gray-200, #E8E4DA)",
          display: "block",
          zIndex: 90,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
        className="pp-sticky-mobile-cta"
      >
        <Link
          href="/deals/all"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "var(--color-green, #16A34A)",
            color: "#fff",
            textDecoration: "none",
            fontFamily: "var(--font-ui, system-ui, sans-serif)",
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: "0.01em",
            padding: "12px 20px",
            borderRadius: 10,
            minHeight: 44,
            width: "100%",
            boxShadow: "0 8px 22px rgba(22, 163, 74, 0.25)",
          }}
        >
          See all Central IL deals →
        </Link>
      </div>
      <style>{`
        .pp-sticky-mobile-cta { display: none; }
        @media (max-width: 720px) {
          .pp-sticky-mobile-cta { display: block; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pp-sticky-mobile-cta { transition: none; }
        }
      `}</style>
    </>
  );
}
