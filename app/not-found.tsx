// app/not-found.tsx — brand-matched 404 page.
// Next.js App Router renders this for any unmatched path OR any
// notFound() call inside a server component.

import Link from "next/link";

export const metadata = {
  title: "Page not found | PuffPrice",
  description: "This page doesn't exist — but good cannabis deals do.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nf-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 1.25rem;text-align:center}
        .nf-eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:12px}
        .nf-title{font-size:clamp(1.8rem,5vw,2.8rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:14px}
        .nf-sub{font-size:1rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.55;max-width:420px;margin:0 auto 28px}
        .nf-btn{
          display:inline-block;background:#22C55E;color:#fff;
          padding:16px 28px;border-radius:12px;text-decoration:none;
          font-family:system-ui,sans-serif;font-weight:700;font-size:.95rem;
          letter-spacing:.01em;min-height:44px;
          transition:background .15s;
        }
        .nf-btn:hover{background:#16a34a}
        .nf-links{margin-top:18px;display:flex;gap:18px;justify-content:center;flex-wrap:wrap;font-family:system-ui,sans-serif;font-size:.85rem}
        .nf-link{color:#16a34a;text-decoration:none}
        .nf-link:hover{text-decoration:underline}
      `}</style>
      <div className="nf-wrap">
        <div className="nf-eyebrow">404 · Not found</div>
        <h1 className="nf-title">Deal not found.</h1>
        <p className="nf-sub">
          This page doesn&apos;t exist — but good deals do. Head back home and
          we&apos;ll point you at the best one near you.
        </p>
        <Link href="/" className="nf-btn">
          Find deals near me →
        </Link>
        <div className="nf-links">
          <Link href="/deals/all" className="nf-link">Browse all Central IL deals</Link>
          <Link href="/alerts" className="nf-link">Get deal alerts</Link>
          <Link href="/about" className="nf-link">About PuffPrice</Link>
        </div>
      </div>
    </>
  );
}
