import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import MobileNavMenu from "../components/MobileNavMenu";
import Calculator from "./Calculator";
import { TAX_RATES_LAST_UPDATED } from "../../lib/taxRates";

// Calculator is a Client Component (`"use client"` at top of the file).
// Importing it directly from this Server Component is fine — Next.js
// renders the static framing here as HTML and hydrates the calculator
// in-place. We can't use `next/dynamic` with `{ ssr: false }` from a
// Server Component in Next 16; the page wrapper would have to become
// `"use client"` to do that, and we'd lose the streaming SSR for the
// static prose.

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
        body{font-family:var(--font-ui, system-ui, sans-serif);background:var(--pp-paper);color:var(--pp-ink);min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:var(--pp-surface);border-bottom:1px solid var(--pp-border);position:sticky;top:0;z-index:100}
        .logo-link{display:flex;align-items:center}
        .nav-links{display:flex;gap:18px;align-items:center}
        .nav-link{font-size:.88rem;color:var(--pp-muted);text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif);font-weight:500}
        .nav-link:hover{color:var(--pp-ink)}
        .nav-cta{background:var(--pp-canopy);color:var(--pp-on-dark);padding:8px 14px;border-radius:8px;font-size:.85rem;font-weight:700;text-decoration:none}
        .nav-cta:hover{background:var(--pp-canopy)}
        .desktop-only-nav{display:flex}
        @media(max-width:768px){.desktop-only-nav{display:none !important}}

        .wrap{max-width:760px;margin:0 auto;padding:48px 24px 64px}
        @media(min-width:720px){.wrap{padding:64px 32px 80px}}

        .eyebrow{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.74rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:var(--pp-signal);margin-bottom:14px;
        }
        h1{
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(1.9rem, 4.5vw, 2.75rem);
          font-weight:700;letter-spacing:-.04em;line-height:1.1;
          color:var(--pp-ink);margin-bottom:18px;
        }
        .lede{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:1.05rem;color:var(--pp-body);line-height:1.6;
          margin-bottom:32px;
        }

        .medical-banner{
          background:var(--pp-surface);border:1px solid var(--pp-border);border-left:4px solid var(--pp-mark);
          border-radius:10px;padding:14px 18px;margin-bottom:24px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.88rem;color:var(--pp-signal-ink);line-height:1.55;
        }
        .medical-banner strong{font-weight:700}

        .article-link{
          margin-top:24px;
          background:var(--pp-surface);border:1px solid var(--pp-border);border-radius:10px;
          padding:14px 18px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.88rem;color:var(--pp-body);line-height:1.5;
          display:flex;flex-direction:column;gap:4px;
        }
        @media(min-width:560px){
          .article-link{flex-direction:row;justify-content:space-between;align-items:center;gap:18px}
        }
        .article-link a{color:var(--pp-signal);font-weight:700;text-decoration:none;white-space:nowrap}
        .article-link a:hover{text-decoration:underline}

        .source-note{
          margin-top:32px;padding:18px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.82rem;color:var(--pp-muted);line-height:1.6;
          border-top:1px solid var(--pp-border);
        }
        .source-note strong{color:var(--pp-body);font-weight:700}
        .source-note a{color:var(--pp-signal);text-decoration:none}
        .source-note a:hover{text-decoration:underline}

        .footer{
          background:var(--pp-surface);border-top:1px solid var(--pp-border);
          padding:24px 28px;
          display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:12px;
        }
        .footer-link{font-size:.78rem;color:var(--pp-muted);text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif)}
        .footer-link:hover{color:var(--pp-ink)}
        .footer-copy{font-size:.74rem;color:var(--pp-muted);font-family:var(--font-ui, system-ui, sans-serif)}
      `}</style>

      <Nav variant="light" />

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

      <Footer />
    </>
  );
}
