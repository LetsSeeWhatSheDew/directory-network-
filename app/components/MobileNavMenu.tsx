"use client";

// MobileNavMenu — Breathe menu (2026-09-23).
// The old panel was a flat list of ten same-weight links with no context,
// so opening it told you nothing. This sheet leads with what matters right
// now (where you are, today's longest exhale, how many deals were checked),
// then groups the rest by what you're trying to do, each with one plain line
// that says what you'll find. The sticky bottom CTA hides while it's open.

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { longestExhale, productOf, storeWithCity, type ExDeal } from "../../lib/exhale";

const toEx = (d: ApiDeal): ExDeal => ({ name: d.store, city: d.city, deal_title: d.title, discount_value: d.discount_value, discount_unit: d.discount_unit });

type Variant = "light" | "deep";
type Props = { variant?: Variant };

type ApiDeal = {
  store: string | null;
  city: string | null;
  title: string | null;
  discount_value: number | null;
  discount_unit: string | null;
  url: string;
};

function readCookieCity(): string | null {
  try {
    const m = document.cookie.match(/(?:^|;\s*)pp_loc=([^;]+)/);
    if (!m) return null;
    const p = JSON.parse(decodeURIComponent(m[1]));
    return typeof p?.city === "string" && p.city.trim() ? p.city : null;
  } catch {
    return null;
  }
}

function amount(d: ApiDeal): string | null {
  const v = Number(d.discount_value);
  if (!Number.isFinite(v) || v <= 0) return null;
  const u = (d.discount_unit || "").toLowerCase();
  if (u === "dollars") return `$${Math.round(v)} off`;
  if ((u === "percent" || !u) && v <= 100) return `${Math.round(v)}% off`;
  return null;
}

const GROUPS: { title: string; items: { href: string; label: string; hint: string }[] }[] = [
  {
    title: "Find a deal",
    items: [
      { href: "/deals/all", label: "Every deal today", hint: "All of Central Illinois, biggest savings first" },
      { href: "/cannabis/illinois/open-now", label: "Open now", hint: "Stores you can walk into right now" },
      { href: "/map", label: "Map", hint: "What's close to you" },
      { href: "/this-week", label: "This week's report", hint: "What changed, what's worth the drive" },
    ],
  },
  {
    title: "Ways to buy",
    items: [
      { href: "/drive-thru", label: "Drive-thru", hint: "Legal since June — which stores have one" },
      { href: "/medical", label: "Medical", hint: "Stores that serve patients" },
      { href: "/open-late", label: "Open late", hint: "Sorted by closing time tonight" },
    ],
  },
  {
    title: "Before you go",
    items: [
      { href: "/illinois-cannabis-tax-calculator", label: "Tax calculator", hint: "What you'll really pay at the counter" },
      { href: "/how-we-rank", label: "How we rank", hint: "Nobody pays us to be on top" },
      { href: "/dispensaries", label: "All dispensaries", hint: "Every Central Illinois store" },
    ],
  },
];

export default function MobileNavMenu({ variant = "light" }: Props) {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [best, setBest] = useState<ApiDeal | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("pp-menu-open");
    const c = readCookieCity();
    setCity(c);
    let alive = true;
    fetch("/api/public/deals")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j) return;
        const all: ApiDeal[] = Array.isArray(j.deals) ? j.deals : [];
        // Same pick as the homepage orb: real everyday amounts only, no "up to" or conditional deals, local city first.
        const ex = all.map(toEx);
        const pick = longestExhale(ex, c);
        setBest(pick ? all[ex.indexOf(pick)] : null);
        const n = typeof j.count === "number" ? j.count : all.length;
        setCount(n > 0 ? n : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("pp-menu-open");
    };
  }, [open]);

  const stroke = variant === "deep" ? "#F4F5EF" : "var(--pp-ink)";
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="mobile-hamburger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 8 H20" />
          <path d="M4 16 H14" />
        </svg>
      </button>

      {open && (
        <div className="pm" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="pm-top">
            <Link href="/" onClick={close} aria-label="PuffPrice — home" className="pm-logo">
              <Logo size={30} />
            </Link>
            <button type="button" className="pm-close" aria-label="Close menu" onClick={close}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6 L18 18" />
                <path d="M18 6 L6 18" />
              </svg>
            </button>
          </div>

          <div className="pm-body">
            <div className="pm-where">
              <span>{city ? <>Showing deals near <b>{city}</b></> : <>Showing all of <b>Central Illinois</b></>}</span>
              <button
                type="button"
                className="pm-change"
                onClick={() => {
                  close();
                  window.dispatchEvent(new CustomEvent("cl:open-city-picker"));
                }}
              >
                Change
              </button>
            </div>

            <Link href={best ? best.url.replace(/^https?:\/\/[^/]+/, "") : "/deals/all"} onClick={close} className="pm-exhale">
              <span className="pm-exhale-label">Today&apos;s longest exhale</span>
              {best ? (
                <>
                  <span className="pm-exhale-amt">{amount(best)}</span>
                  <span className="pm-exhale-where">{`${productOf(toEx(best))} at ${storeWithCity(toEx(best))}`}</span>
                </>
              ) : (
                <span className="pm-exhale-where">See every deal checked this morning →</span>
              )}
              {count != null && <span className="pm-exhale-count">One of {count} deals checked today</span>}
            </Link>

            {GROUPS.map((g) => (
              <section key={g.title} className="pm-group" aria-label={g.title}>
                <h2 className="pm-group-title">{g.title}</h2>
                {g.items.map((it) => (
                  <Link key={it.href} href={it.href} onClick={close} className="pm-item">
                    <span>
                      <span className="pm-item-label">{it.label}</span>
                      <span className="pm-item-hint">{it.hint}</span>
                    </span>
                    <span className="pm-chev" aria-hidden="true">›</span>
                  </Link>
                ))}
              </section>
            ))}

            <Link href="/alerts" onClick={close} className="pm-alerts">
              Get deal alerts
              <small>An email when a price drops near you</small>
            </Link>

            <div className="pm-small">
              <Link href="/savings/dashboard" onClick={close}>My savings</Link>
              <Link href="/about" onClick={close}>About</Link>
              <Link href="/for-dispensaries" onClick={close}>For dispensaries</Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mobile-hamburger{display:none;background:transparent;border:none;cursor:pointer;padding:8px;margin:0;border-radius:999px;min-width:44px;min-height:44px;align-items:center;justify-content:center;transition:background-color 160ms ease,transform 160ms ease}
        .mobile-hamburger:active{transform:scale(.94)}
        .mobile-hamburger:hover{background:color-mix(in srgb,var(--pp-ink) 6%,transparent)}
        @media(max-width:880px){.mobile-hamburger{display:inline-flex}.desktop-only-nav{display:none !important}}

        html.pp-menu-open{overflow:hidden}
        html.pp-menu-open .pp-sticky-mobile-cta{display:none !important}

        .pm{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;background:var(--pp-paper);color:var(--pp-ink);animation:pm-in .32s cubic-bezier(.16,1,.3,1) both}
        @keyframes pm-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        .pm::before{content:"";position:absolute;inset:0 0 auto 0;height:260px;pointer-events:none;background:radial-gradient(420px 220px at 80% 0%,var(--pp-warm,#F6DCC6) 0%,transparent 70%);opacity:.55}
        html[data-daypart="night"] .pm::before{background:radial-gradient(420px 220px at 80% 0%,#24453A 0%,transparent 70%);opacity:.8}
        .pm-top{position:relative;display:flex;align-items:center;justify-content:space-between;padding:10px clamp(1rem,4vw,2rem)}
        .pm-logo{display:inline-flex;align-items:center;min-height:44px}
        .pm-close{background:transparent;border:none;color:var(--pp-ink);min-width:44px;min-height:44px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
        .pm-close:active{transform:scale(.94)}
        .pm-body{position:relative;flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px clamp(1rem,4vw,2rem) calc(24px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px}
        .pm-where{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:.95rem;color:var(--pp-muted)}
        .pm-where b{color:var(--pp-ink);font-weight:600}
        .pm-change{background:transparent;border:1px solid var(--pp-border);color:var(--pp-ink);border-radius:999px;padding:8px 14px;min-height:40px;font:inherit;font-size:.9rem;cursor:pointer}
        .pm-exhale{display:flex;flex-direction:column;gap:2px;padding:16px 18px;border-radius:18px;text-decoration:none;color:var(--pp-ink);background:var(--pp-surface);border:1px solid var(--pp-border);transition:transform .16s ease}
        .pm-exhale:active{transform:scale(.985)}
        .pm-exhale-label{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--pp-muted)}
        .pm-exhale-amt{font-family:var(--font-body);font-weight:700;font-size:2.25rem;letter-spacing:-.04em;line-height:1.1;color:var(--pp-ink)}
        .pm-exhale-where{font-size:.95rem;color:var(--pp-body)}
        .pm-exhale-count{font-size:.82rem;color:var(--pp-muted);margin-top:4px}
        .pm-group{display:flex;flex-direction:column}
        .pm-group-title{font-family:var(--font-mono) !important;font-size:.7rem !important;letter-spacing:.18em;text-transform:uppercase;color:var(--pp-muted);margin:4px 0 2px;font-weight:500 !important;animation:none !important}
        .pm-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 2px;min-height:56px;text-decoration:none;color:var(--pp-ink);border-bottom:1px solid var(--pp-border)}
        .pm-item:last-child{border-bottom:none}
        .pm-item:active{opacity:.7}
        .pm-item-label{display:block;font-size:1.05rem;font-weight:600}
        .pm-item-hint{display:block;font-size:.85rem;color:var(--pp-muted);margin-top:1px}
        .pm-chev{font-size:1.4rem;color:var(--pp-muted);line-height:1}
        .pm-alerts{display:flex;flex-direction:column;align-items:center;gap:2px;padding:14px 18px;border-radius:999px;background:var(--pp-canopy);color:var(--pp-canopy-text);text-decoration:none;font-weight:600;font-size:1.02rem;text-align:center}
        .pm-alerts small{font-weight:400;font-size:.8rem;opacity:.85}
        html[data-daypart="night"] .pm-alerts{background:#9FE0B0;color:#0E1A15}
        .pm-small{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;font-size:.88rem}
        .pm-small a{color:var(--pp-muted);text-decoration:none;padding:8px 2px}
        @media (prefers-reduced-motion: reduce){.pm{animation:none}}
      `}</style>
    </>
  );
}
