"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Variant = "light" | "deep";

type Props = {
  variant?: Variant;
};

export default function MobileNavMenu({ variant = "light" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const stroke = variant === "deep" ? "#F7F4ED" : "#1F3D2B";

  return (
    <>
      <button
        type="button"
        className="mobile-hamburger"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <>
              <path d="M6 6 L18 18" />
              <path d="M18 6 L6 18" />
            </>
          ) : (
            <>
              <path d="M4 7 H20" />
              <path d="M4 12 H20" />
              <path d="M4 17 H20" />
            </>
          )}
        </svg>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="mobile-menu-backdrop"
            onClick={() => setOpen(false)}
          />
          <div className="mobile-menu-panel" role="menu" onClick={() => setOpen(false)}>
            <Link href="/" className="mobile-menu-link">Home</Link>
            <Link href="/cannabis/illinois/open-now" className="mobile-menu-link">Open now</Link>
            <Link href="/dispensaries" className="mobile-menu-link">Browse Central IL</Link>
            <Link href="/map" className="mobile-menu-link">Map view</Link>
            <Link href="/illinois-cannabis-tax-calculator" className="mobile-menu-link">Tax calculator</Link>
            <Link href="/savings/dashboard" className="mobile-menu-link">My savings</Link>
            <Link href="/about" className="mobile-menu-link">About PuffPrice</Link>
            <Link href="/alerts" className="mobile-menu-link highlight">Get deal alerts &rarr;</Link>
            <Link href="/dispensaries" className="mobile-menu-link muted">For dispensaries</Link>
          </div>
        </>
      )}
      <style>{`
        .mobile-hamburger{
          display:none;background:transparent;border:none;cursor:pointer;
          padding:8px;margin:0;border-radius:8px;
          min-width:44px;min-height:44px;
          align-items:center;justify-content:center;
          transition: background-color 160ms ease;
        }
        .mobile-hamburger:hover{background:rgba(31,61,43,0.06)}
        .mobile-menu-backdrop{
          position:fixed;inset:0;background:rgba(31,61,43,.40);
          border:none;cursor:pointer;z-index:98;
        }
        .mobile-menu-panel{
          position:absolute;top:100%;left:0;right:0;
          background:var(--color-cream-pure, #FAFAF7);
          border-bottom:1px solid var(--color-gray-200, #E8E2D5);
          box-shadow:0 12px 32px rgba(31,61,43,.14), 0 4px 12px rgba(31,61,43,.08);
          display:flex;flex-direction:column;
          z-index:99;
        }
        .mobile-menu-link{
          padding:16px 24px;
          font-family:Manrope, system-ui, -apple-system, sans-serif;
          font-weight:500;
          font-size:1rem;
          color:var(--color-deep, #1F3D2B);
          text-decoration:none;
          border-bottom:1px solid var(--color-gray-100, #F1EEE7);
          min-height:48px;
          display:flex;align-items:center;
          transition: background-color 160ms ease;
        }
        .mobile-menu-link:hover{background:var(--color-gray-100, #F1EEE7)}
        .mobile-menu-link.highlight{color:var(--color-sage-deep, #6BA63B);font-weight:700}
        .mobile-menu-link.muted{color:var(--color-gray-500, #6B7280); font-size:.875rem;}
        .mobile-menu-link:last-of-type{border-bottom:none}
        @media(max-width:880px){
          .mobile-hamburger{display:inline-flex}
          .desktop-only-nav{display:none !important}
        }
      `}</style>
    </>
  );
}
