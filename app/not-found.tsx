// app/not-found.tsx — brand-matched 404 page.
// Next.js App Router renders this for any unmatched path OR any
// notFound() call inside a server component.

import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata = {
  title: "Page not found | PuffPrice",
  description: "This page doesn't exist — but good cannabis deals do.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <style>{`
        body { background: var(--color-cream, #F7F4ED); }
        .nf-shell { min-height: calc(100vh - 80px); display:flex; flex-direction:column; }
        .nf-wrap { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4rem 1.25rem; text-align:center; }
        .nf-eyebrow { font-family: Manrope, system-ui, sans-serif; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-sage, #7DBA47); margin-bottom: 12px; }
        .nf-title { font-family: Manrope, system-ui, sans-serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; color: var(--color-deep, #1F3D2B); margin-bottom: 14px; }
        .nf-sub { font-family: Manrope, system-ui, sans-serif; font-size: 1rem; color: var(--color-gray-600, #4B5563); line-height: 1.55; max-width: 460px; margin: 0 auto 28px; }
        .nf-links { margin-top: 18px; display:flex; gap:18px; justify-content:center; flex-wrap:wrap; font-family: Manrope, system-ui, sans-serif; font-size: 0.875rem; }
        .nf-link { color: var(--color-sage-deep, #6BA63B); text-decoration: none; font-weight: 500; }
        .nf-link:hover { text-decoration: underline; }
      `}</style>
      <Nav variant="light" />
      <div className="nf-shell">
        <div className="nf-wrap">
          <div className="nf-eyebrow">404 · Not found</div>
          <h1 className="nf-title">Deal not found.</h1>
          <p className="nf-sub">
            This page doesn&apos;t exist — but good deals do. Head back home and
            we&apos;ll point you at the best one near you.
          </p>
          <Link href="/" className="pp-btn pp-btn-lg pp-btn-primary">
            Find deals near me &rarr;
          </Link>
          <div className="nf-links">
            <Link href="/dispensaries" className="nf-link">Browse Central IL dispensaries</Link>
            <Link href="/alerts" className="nf-link">Get deal alerts</Link>
            <Link href="/about" className="nf-link">About PuffPrice</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
