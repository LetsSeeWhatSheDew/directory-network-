"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MobileNavMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-hamburger"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f1f3d" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
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
        <div className="mobile-menu-panel" role="menu" onClick={() => setOpen(false)}>
          <Link href="/cannabis/illinois/open-now" className="mobile-menu-link">Open now</Link>
          <Link href="/savings/dashboard" className="mobile-menu-link">My savings</Link>
          <Link href="/map" className="mobile-menu-link">Map view</Link>
          <Link href="/cannabis/illinois" className="mobile-menu-link">Browse Illinois</Link>
          <Link href="/alerts" className="mobile-menu-link">Get alerts</Link>
          <Link href="/dispensaries" className="mobile-menu-link highlight">For dispensaries →</Link>
        </div>
      )}
      <style>{`
        .mobile-hamburger{
          display:none;background:transparent;border:none;cursor:pointer;
          padding:6px;margin:0;border-radius:6px;
        }
        .mobile-hamburger:hover{background:#f5f4f0}
        .mobile-menu-panel{
          position:absolute;top:100%;left:0;right:0;
          background:#fff;border-bottom:1px solid #e8e4da;
          box-shadow:0 8px 20px rgba(15,31,61,.08);
          display:flex;flex-direction:column;
          z-index:99;
        }
        .mobile-menu-link{
          padding:14px 20px;
          font-family:system-ui,sans-serif;
          font-size:.95rem;color:#0f1f3d;
          text-decoration:none;
          border-bottom:1px solid #f5f4f0;
        }
        .mobile-menu-link:hover{background:#f5f4f0}
        .mobile-menu-link.highlight{color:#16a34a;font-weight:600}
        @media(max-width:768px){
          .mobile-hamburger{display:inline-flex;align-items:center;justify-content:center}
          .desktop-only-nav{display:none !important}
        }
      `}</style>
    </>
  );
}
