import Link from "next/link";

const OG_DESC =
  "How the PuffPrice Index is calculated — our weekly Illinois flower price-per-gram benchmark.";
const OG_IMAGE = "https://puffprice.com/og-image.png";

export const metadata = {
  title: "The PuffPrice Index — Illinois flower price benchmark",
  description: OG_DESC,
  openGraph: {
    title: "The PuffPrice Index",
    description: OG_DESC,
    url: "https://puffprice.com/about/index",
    siteName: "PuffPrice",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "The PuffPrice Index",
    description: OG_DESC,
    images: [OG_IMAGE],
  },
};

export default function AboutIndexPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;position:sticky;top:0;z-index:100}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none}
        .logo-text{font-size:1.1rem;font-weight:700;color:#fff;letter-spacing:-.02em}
        .logo-text span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .wrap{max-width:720px;margin:0 auto;padding:56px 28px 80px}
        .eyebrow{
          font-family:system-ui,sans-serif;font-size:.72rem;font-weight:700;
          letter-spacing:.14em;text-transform:uppercase;color:#16a34a;margin-bottom:14px;
        }
        h1{
          font-size:clamp(2rem,5vw,2.8rem);font-weight:700;color:#0f1f3d;
          letter-spacing:-.04em;line-height:1.08;margin-bottom:18px;
        }
        h1 em{color:#16a34a;font-style:normal}
        .lede{
          font-size:1.1rem;color:#374151;line-height:1.55;
          margin-bottom:32px;max-width:60ch;
        }
        h2{
          font-size:1.3rem;font-weight:700;color:#0f1f3d;
          letter-spacing:-.02em;margin:28px 0 12px;
        }
        p,li{
          font-size:1rem;color:#374151;line-height:1.65;
          max-width:65ch;margin-bottom:14px;
        }
        ul{padding-left:20px;margin-bottom:20px}
        code{
          font-family:ui-monospace,Menlo,monospace;font-size:.92em;
          background:#fff;border:1px solid #e8e4da;padding:1px 6px;border-radius:4px;
        }
        .promise{
          margin-top:40px;padding:22px 24px;
          background:#fff;border:1px solid #e8e4da;border-left:4px solid #16a34a;
          border-radius:12px;box-shadow:0 4px 16px rgba(15,31,61,.04);
        }
        .promise h2{margin:0 0 8px;font-size:1.1rem}
        .promise p{margin-bottom:0;font-size:.95rem}
        .back-link{
          display:inline-block;margin-top:36px;
          font-family:system-ui,sans-serif;font-size:.88rem;font-weight:600;
          color:#16a34a;text-decoration:none;
        }
        .back-link:hover{text-decoration:underline}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home">
          <span className="logo-text">puff<span>price</span></span>
        </Link>
        <Link href="/" className="back">← Back to deals</Link>
      </nav>

      <div className="wrap">
        <div className="eyebrow">Methodology</div>
        <h1>How the PuffPrice <em>Index</em> is calculated</h1>
        <p className="lede">
          The PuffPrice Index is a weekly benchmark for what Illinois flower
          actually costs right now — a single price-per-gram number pulled
          from the active deals we track.
        </p>

        <h2>How we normalize</h2>
        <p>
          Every active flower deal with a posted price gets normalized to a
          price-per-gram using standard weight conversions: an eighth is
          3.5g, a quarter is 7g, a half is 14g, and an ounce is 28g. Pre-rolls
          and infused products are excluded — only loose flower counts toward
          the Index.
        </p>
        <p>
          We trim prices outside a plausible range (below $0 or above $100
          per gram) so a data-entry typo can't pull the average. The
          remaining prices are averaged; that average is the Index for the
          week.
        </p>

        <h2>When we publish</h2>
        <p>
          We only publish the Index when we have at least 10 qualifying deals
          in the sample. Fewer than that and the number isn't stable enough
          to be useful — one $4 eighth or one $60 gram would swing it. Until
          we cross the threshold, the homepage shows a progress bar instead
          of a fake number.
        </p>

        <h2>What it's for</h2>
        <p>
          The Index answers one question: <em>is the deal I'm looking at a
          good one?</em> If a dispensary is advertising flower at $12/g and
          the Index is $7.80/g, you know the "deal" isn't really a deal.
          If it's $5/g, you know to grab it.
        </p>
        <p>
          We rebuild the Index every week so it tracks the real market — not
          a snapshot from six months ago.
        </p>

        <div className="promise">
          <h2>The PuffPrice Promise</h2>
          <p>
            We will never round up a sample size. We will never publish an
            Index from fewer than 10 deals. If we can't calculate it
            honestly, we won't publish it — that's why you see a progress
            bar instead of a placeholder number. <Link href="/about" style={{color:"#16a34a",fontWeight:600,textDecoration:"none"}}>More about how we work →</Link>
          </p>
        </div>

        <Link href="/" className="back-link">← See today&apos;s deals</Link>
      </div>
    </>
  );
}
