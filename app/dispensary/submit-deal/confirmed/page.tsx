import Link from "next/link";

export const metadata = {
  title: "Deal submitted — thanks! | PuffPrice",
  description: "Your deal has been submitted to PuffPrice and will be reviewed within 24 hours.",
  robots: { index: false, follow: true },
};

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const cityLabel = city && city.trim() ? city.trim() : "your city";

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{padding:14px 28px;background:#0f1f3d;display:flex;justify-content:space-between;align-items:center}
        .logo{color:#fff;text-decoration:none;font-weight:700;letter-spacing:-.02em}
        .logo span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .wrap{max-width:600px;margin:0 auto;padding:64px 24px 48px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:12px}
        h1{font-size:clamp(1.8rem,4.5vw,2.4rem);font-weight:700;letter-spacing:-.03em;line-height:1.15;margin-bottom:14px}
        p{font-size:1rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.6;margin-bottom:18px}
        .card{background:#fff;border:1px solid #e8e4da;border-radius:14px;padding:22px;margin-top:24px}
        .card h2{font-size:1.1rem;font-weight:700;margin-bottom:8px;letter-spacing:-.02em}
        .card p{font-size:.92rem;margin-bottom:14px}
        .cta{display:inline-block;background:#16a34a;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.95rem}
        .cta:hover{background:#15803d}
        .cta-secondary{display:inline-block;color:#0f1f3d;border:1px solid #d1cfc6;padding:12px 20px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:600;font-size:.9rem;margin-left:8px}
        .cta-secondary:hover{border-color:#9ca3af}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">puff<span>price</span></Link>
        <Link href="/dispensary/submit-deal" className="back">← Submit another</Link>
      </nav>

      <div className="wrap">
        <div className="eyebrow">✓ Submitted</div>
        <h1>Your deal has been submitted.</h1>
        <p>
          We&apos;ll review and post it within <strong>24 hours</strong>. You&apos;ll see it
          on the homepage, the relevant category page, and your PuffPrice listing
          as soon as it&apos;s live.
        </p>

        <div className="card">
          <h2>Want to appear first in {cityLabel} searches?</h2>
          <p>
            Featured placement puts your deal at the top of every{" "}
            <strong>{cityLabel}</strong> search and deal page on PuffPrice —
            $49/month, cancel anytime. First month free for dispensaries that
            sign up this week.
          </p>
          <div>
            <Link href="/upgrade" className="cta">See Featured pricing →</Link>
            <Link href="/dispensaries" className="cta-secondary">View dispensaries</Link>
          </div>
        </div>
      </div>
    </>
  );
}
