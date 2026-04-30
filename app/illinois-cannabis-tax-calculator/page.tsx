import Link from "next/link";
import dynamic from "next/dynamic";
import Logo from "../components/Logo";
import MobileNavMenu from "../components/MobileNavMenu";
import { TAX_RATES_LAST_UPDATED } from "../../lib/taxRates";

// The interactive calculator hydrates after first paint so the static
// framing (eyebrow, H1, prose, footer note) renders in the LCP path
// without waiting on the form's JS.
const Calculator = dynamic(() => import("./Calculator"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e4da",
        borderRadius: 14,
        padding: 32,
        minHeight: 280,
        textAlign: "center",
        color: "#9ca3af",
        fontFamily: "var(--font-ui, system-ui, sans-serif)",
        fontSize: ".95rem",
      }}
    >
      Loading calculator…
    </div>
  ),
});

const PAGE_DESC =
  "Calculate the out-the-door price of cannabis at any Central Illinois dispensary. Enter the shelf price, product type, and city; see every tax broken out — state, county, city — and what you'll actually pay.";

export const metadata = {
  title: "Illinois Cannabis Tax Calculator — out-the-door prices for Central IL",
  description: PAGE_DESC,
  alternates: { canonical: "https://www.puffprice.com/illinois-cannabis-tax-calculator" },
  openGraph: {
    title: "Illinois Cannabis Tax Calculator",
    description: PAGE_DESC,
    url: "https://www.puffprice.com/illinois-cannabis-tax-calculator",
    siteName: "PuffPrice",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Illinois Cannabis Tax Calculator",
    description: PAGE_DESC,
  },
};

const APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Illinois Cannabis Tax Calculator",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any (browser)",
  description: PAGE_DESC,
  url: "https://www.puffprice.com/illinois-cannabis-tax-calculator",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function TaxCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_SCHEMA) }}
      />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-ui, system-ui, sans-serif);background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;border-bottom:1px solid #e8e4da;position:sticky;top:0;z-index:100}
        .logo-link{display:flex;align-items:center}
        .nav-links{display:flex;gap:18px;align-items:center}
        .nav-link{font-size:.88rem;color:#6b7280;text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif);font-weight:500}
        .nav-link:hover{color:#0f1f3d}
        .nav-cta{background:#0f1f3d;color:#fff;padding:8px 14px;border-radius:8px;font-size:.85rem;font-weight:700;text-decoration:none}
        .nav-cta:hover{background:#1e3a5f}
        .desktop-only-nav{display:flex}
        @media(max-width:768px){.desktop-only-nav{display:none !important}}

        .wrap{max-width:760px;margin:0 auto;padding:48px 24px 64px}
        @media(min-width:720px){.wrap{padding:64px 32px 80px}}

        .eyebrow{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.74rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:#16a34a;margin-bottom:14px;
        }
        h1{
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(1.9rem, 4.5vw, 2.75rem);
          font-weight:700;letter-spacing:-.04em;line-height:1.1;
          color:#0f1f3d;margin-bottom:18px;
        }
        .lede{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:1.05rem;color:#374151;line-height:1.6;
          margin-bottom:32px;
        }

        .medical-banner{
          background:#fff;border:1px solid #2563eb;border-left:4px solid #2563eb;
          border-radius:10px;padding:14px 18px;margin-bottom:24px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.88rem;color:#1e3a5f;line-height:1.55;
        }
        .medical-banner strong{font-weight:700}

        .article-link{
          margin-top:24px;
          background:#fff;border:1px solid #e8e4da;border-radius:10px;
          padding:14px 18px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.88rem;color:#374151;line-height:1.5;
          display:flex;flex-direction:column;gap:4px;
        }
        @media(min-width:560px){
          .article-link{flex-direction:row;justify-content:space-between;align-items:center;gap:18px}
        }
        .article-link a{color:#16a34a;font-weight:700;text-decoration:none;white-space:nowrap}
        .article-link a:hover{text-decoration:underline}

        .source-note{
          margin-top:32px;padding:18px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.82rem;color:#6b7280;line-height:1.6;
          border-top:1px solid #e8e4da;
        }
        .source-note strong{color:#374151;font-weight:700}
        .source-note a{color:#16a34a;text-decoration:none}
        .source-note a:hover{text-decoration:underline}

        .footer{
          background:#fff;border-top:1px solid #e8e4da;
          padding:24px 28px;
          display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:12px;
        }
        .footer-link{font-size:.78rem;color:#6b7280;text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif)}
        .footer-link:hover{color:#0f1f3d}
        .footer-copy{font-size:.74rem;color:#9ca3af;font-family:var(--font-ui, system-ui, sans-serif)}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo-link" aria-label="PuffPrice home">
          <Logo size={36} />
        </Link>
        <div className="nav-links desktop-only-nav">
          <Link href="/" className="nav-link">Browse Central IL</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/illinois-cannabis-tax" className="nav-link">Tax explainer</Link>
          <Link href="/dispensaries" className="nav-cta">For dispensaries</Link>
        </div>
        <MobileNavMenu />
      </nav>

      <main className="wrap">
        <p className="eyebrow">Pricing</p>
        <h1>Illinois cannabis tax calculator.</h1>
        <p className="lede">
          What does an item on a Central Illinois dispensary shelf actually cost
          at the register? Drop in the shelf price, pick the product type, pick
          your city, and we&apos;ll show you every tax that lands and what
          you&apos;ll pay out the door.
        </p>

        <div className="medical-banner">
          <strong>Recreational only.</strong>{" "}
          Illinois medical-cannabis patients are exempt from the state Cannabis
          Purchaser Excise Tax and pay only the ~1% pharmaceutical sales tax —
          your out-the-door is roughly the shelf price plus 1%. This calculator
          is for adult-use purchases.
        </div>

        <Calculator defaultCitySlug="peoria" />

        <div className="article-link">
          <span>Want to know <em>why</em> cannabis is taxed this way in Illinois?</span>
          <Link href="/illinois-cannabis-tax">Read the explainer →</Link>
        </div>

        <p className="source-note">
          <strong>Sources.</strong>{" "}
          Cannabis Purchaser Excise Tax (10% / 20% / 25% by THC tier) and
          state Retailers&apos; Occupation Tax (6.25%) come from the{" "}
          <a href="https://tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html" rel="noopener noreferrer" target="_blank">
            Illinois Department of Revenue cannabis tax page
          </a>
          . Per-city Municipal Cannabis ROT and per-county Cannabis ROT come
          from the IL DOR&apos;s rate publications, cross-checked against the
          most recent quarterly bulletin (FY 2026-06, effective Jan 1 2026).
          Per-city general sales tax (the local component on top of the 6.25%
          state rate) verified per city via salestaxhandbook.com on{" "}
          {TAX_RATES_LAST_UPDATED}.
        </p>
      </main>

      <footer className="footer">
        <span className="footer-copy">© {new Date().getFullYear()} PuffPrice · Photography via Unsplash</span>
        <div style={{ display: "flex", gap: 18 }}>
          <Link href="/about" className="footer-link">About</Link>
          <Link href="/illinois-cannabis-tax" className="footer-link">Tax explainer</Link>
          <Link href="/dispensaries" className="footer-link">For dispensaries</Link>
        </div>
      </footer>
    </>
  );
}
