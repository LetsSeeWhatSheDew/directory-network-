"use client";

// app/components/Nav.tsx
// Shared site navigation — sage-on-cream by default, cream-on-deep when
// rendered above a deep brand surface. Sticky on scroll. Wires up the
// MobileNavMenu for sub-880px viewports. Brand spec § 1 / § 6.1.

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import MobileNavMenu from "./MobileNavMenu";

type Variant = "light" | "deep";

type Props = {
  /** Render against a light cream surface ("light") or atop a deep
   *  brand surface ("deep"). Defaults to "light". */
  variant?: Variant;
  /** Sticky on scroll. Defaults to true. */
  sticky?: boolean;
};

const PRIMARY_LINKS = [
  { href: "/cannabis/illinois/open-now", label: "Open now" },
  { href: "/dispensaries", label: "Dispensaries" },
  { href: "/map", label: "Map" },
];

export default function Nav({ variant = "light", sticky = true }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  const isDeep = variant === "deep";

  return (
    <header
      className={`pp-nav ${isDeep ? "pp-nav-deep" : "pp-nav-light"} ${sticky ? "pp-nav-sticky" : ""} ${scrolled ? "pp-nav-scrolled" : ""}`}
      aria-label="Primary navigation"
    >
      <div className="pp-nav-inner">
        <Link href="/" className="pp-nav-logo" aria-label="PuffPrice — home">
          <Logo size={36} inverse={isDeep} priority />
        </Link>

        <nav className="pp-nav-links desktop-only-nav" aria-label="Primary">
          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="pp-nav-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="pp-nav-actions desktop-only-nav">
          <Link
            href="/illinois-cannabis-tax-calculator"
            className={`pp-btn pp-btn-sm ${isDeep ? "pp-btn-outline-cream" : "pp-btn-outline"}`}
          >
            Tax calculator
          </Link>
          <Link
            href="/alerts"
            className="pp-btn pp-btn-sm pp-btn-primary"
          >
            Get alerts
          </Link>
        </div>

        <MobileNavMenu variant={variant} />
      </div>

      <style>{`
        .pp-nav {
          position: relative;
          z-index: 50;
          width: 100%;
          transition: background-color 240ms ease, box-shadow 240ms ease, border-color 240ms ease;
        }
        .pp-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 14px clamp(1rem, 4vw, 2rem);
        }
        .pp-nav-logo {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          flex: 0 0 auto;
        }
        .pp-nav-links {
          display: flex;
          align-items: center;
          gap: 1.75rem;
          margin: 0 auto 0 1rem;
        }
        .pp-nav-link {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 500;
          font-size: 0.9375rem;
          letter-spacing: -0.005em;
          text-decoration: none;
          padding: 0.5rem 0;
          transition: color 160ms ease;
          white-space: nowrap;
        }
        .pp-nav-actions { display: flex; align-items: center; gap: 0.625rem; }

        /* Light variant */
        .pp-nav-light {
          background: transparent;
          color: var(--color-deep, #1F3D2B);
        }
        .pp-nav-light .pp-nav-link { color: var(--color-deep, #1F3D2B); }
        .pp-nav-light .pp-nav-link:hover { color: var(--color-sage-deep, #6BA63B); }

        /* Deep variant */
        .pp-nav-deep {
          background: transparent;
          color: var(--color-cream, #F7F4ED);
        }
        .pp-nav-deep .pp-nav-link { color: var(--color-cream, #F7F4ED); }
        .pp-nav-deep .pp-nav-link:hover { color: var(--color-sage-vibrant, #93CB5C); }

        /* Sticky behaviour */
        .pp-nav-sticky { position: sticky; top: 0; }
        .pp-nav-sticky.pp-nav-light.pp-nav-scrolled {
          background: rgba(247, 244, 237, 0.94);
          backdrop-filter: saturate(140%) blur(8px);
          -webkit-backdrop-filter: saturate(140%) blur(8px);
          border-bottom: 1px solid var(--color-gray-200, #E8E2D5);
          box-shadow: 0 2px 8px rgba(31, 61, 43, 0.06);
        }
        .pp-nav-sticky.pp-nav-deep.pp-nav-scrolled {
          background: rgba(31, 61, 43, 0.94);
          backdrop-filter: saturate(140%) blur(8px);
          -webkit-backdrop-filter: saturate(140%) blur(8px);
          border-bottom: 1px solid rgba(247, 244, 237, 0.10);
        }

        @media (max-width: 880px) {
          .pp-nav-inner { padding: 10px clamp(1rem, 4vw, 2rem); gap: 0.5rem; }
          .desktop-only-nav { display: none !important; }
        }
      `}</style>
    </header>
  );
}
