// app/claim/page.tsx
// Generic "is this your dispensary?" landing + fallback form.
// Preferred path: user searches for their dispensary and lands on
// /claim/[slug] (which already exists). Fallback path: submit a
// general inquiry with listing_slug="_generic_" — admin reconciles.

import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import type { Metadata } from "next";
import { brand } from "../../lib/brand";
import GenericClaimForm from "./GenericClaimForm";

export const metadata: Metadata = {
  title: "Claim your dispensary listing",
  description:
    "Dispensary owner? Claim your PuffPrice listing to update your hours, add deals, and reach Illinois cannabis shoppers actively looking for offers near them.",
  alternates: { canonical: `${brand.url}/claim` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Claim your dispensary listing | PuffPrice",
    description:
      "Claim your PuffPrice listing and reach Illinois cannabis shoppers actively looking for your deals.",
    url: `${brand.url}/claim`,
    siteName: brand.name,
    images: [{ url: `${brand.url}/og-image.png`, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
};

export default function ClaimLandingPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-body),system-ui,sans-serif;background:var(--pp-paper);color:var(--pp-body);min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:var(--pp-surface);position:sticky;top:0;z-index:100;border-bottom:1px solid var(--pp-border)}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:var(--pp-signal-fill);animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .logo-text{font-size:1.1rem;font-weight:700;color:var(--pp-ink)}
        .logo-text span{color:var(--pp-signal)}
        .back{font-size:.82rem;color:var(--pp-muted);text-decoration:none;font-family:var(--font-body)}
        .wrap{max-width:680px;margin:0 auto;padding:48px 20px 64px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pp-signal);font-family:var(--font-body);margin-bottom:10px}
        h1{font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:14px}
        .lede{font-size:1.02rem;color:var(--pp-body);font-family:var(--font-body);line-height:1.6;margin-bottom:28px}
        .benefits{margin-bottom:32px}
        .benefit{display:flex;gap:10px;align-items:flex-start;padding:10px 0;font-family:var(--font-body);font-size:.92rem;color:var(--pp-body);line-height:1.5}
        .benefit-check{color:var(--pp-signal);font-weight:700;flex-shrink:0}
        .find-panel{background:var(--pp-surface);border:1px solid var(--pp-border);border-radius:14px;padding:22px 24px;margin-bottom:22px}
        .find-h{font-size:.95rem;font-weight:700;color:var(--pp-ink);margin-bottom:10px}
        .find-sub{font-size:.82rem;color:var(--pp-muted);font-family:var(--font-body);margin-bottom:14px}
        .find-form{display:flex;gap:8px;flex-wrap:wrap}
        .find-input{flex:1;min-width:200px;border:1px solid var(--pp-border);border-radius:10px;padding:12px 14px;font-family:var(--font-body);font-size:.95rem;outline:none;min-height:44px}
        .find-input:focus{border-color:var(--pp-signal-fill);box-shadow:0 0 0 3px rgba(22,163,74,.12)}
        .find-btn{background:var(--pp-signal-fill);color:var(--pp-on-dark);border:none;border-radius:10px;padding:0 22px;font-family:var(--font-body);font-weight:700;font-size:.92rem;cursor:pointer;min-height:44px}
        .find-btn:hover{background:var(--pp-signal-fill)}
        .divider{text-align:center;margin:22px 0 18px;font-family:var(--font-body);font-size:.75rem;color:var(--pp-muted);letter-spacing:.16em;text-transform:uppercase}
        @media(max-width:600px){.wrap{padding:28px 14px}}
      `}</style>

      <Nav variant="light" />

      <main className="wrap">
        <div className="eyebrow">For dispensary owners</div>
        <h1>Is this your dispensary?</h1>
        <p className="lede">
          Claim your PuffPrice listing to update your hours, push deals to
          Central Illinois cannabis shoppers actively looking for offers
          near them, and tell us about anything we got wrong.
        </p>

        <div className="benefits" aria-label="Claim benefits">
          <div className="benefit">
            <span className="benefit-check">✓</span>
            <span>Update your address, phone, hours, and menu URL instantly</span>
          </div>
          <div className="benefit">
            <span className="benefit-check">✓</span>
            <span>Post daily deals directly to your listing — shoppers see them in real time</span>
          </div>
          <div className="benefit">
            <span className="benefit-check">✓</span>
            <span>Free — no card required to claim. We verify by phone or email.</span>
          </div>
        </div>

        {/* Preferred path — search for the specific listing */}
        <div className="find-panel">
          <div className="find-h">Find your dispensary</div>
          <div className="find-sub">
            Search by name or city. Claim the specific listing — fastest path to verification.
          </div>
          <form action="/search" method="get" className="find-form" role="search">
            <input
              type="search"
              name="q"
              placeholder="e.g. Zen Leaf Peoria"
              autoComplete="off"
              className="find-input"
              required
            />
            <button type="submit" className="find-btn">Find →</button>
          </form>
        </div>

        <div className="divider">Or — can&rsquo;t find it?</div>

        {/* Fallback path — typed name + contact info, admin reconciles */}
        <GenericClaimForm />
      </main>
      <Footer />
    </>
  );
}
