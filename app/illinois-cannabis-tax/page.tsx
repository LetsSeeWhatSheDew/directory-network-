import Link from "next/link";
import Logo from "../components/Logo";
import MobileNavMenu from "../components/MobileNavMenu";
import {
  STATE_EXCISE_RATES,
  STATE_SALES_TAX,
  TAX_RATES_LAST_UPDATED,
  calculateOutTheDoor,
  findCityRates,
  formatPercent,
  formatUsd,
} from "../../lib/taxRates";

const PAGE_DESC =
  "Illinois cannabis taxes 26% to 45% of the shelf price. We break down every tax that gets added at checkout — state, county, city — and show you what you'll actually pay.";

export const metadata = {
  title: "Illinois cannabis tax explained — why the shelf price isn't the price",
  description: PAGE_DESC,
  alternates: { canonical: "https://www.puffprice.com/illinois-cannabis-tax" },
  openGraph: {
    title: "Illinois cannabis tax explained",
    description: PAGE_DESC,
    url: "https://www.puffprice.com/illinois-cannabis-tax",
    siteName: "PuffPrice",
    type: "article" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Illinois cannabis tax explained",
    description: PAGE_DESC,
  },
};

// East Peoria $35 flower worked example, computed live from the same
// rate table the calculator uses so the article never drifts from the
// calculator. If the data file changes, the prose updates with it.
const WORKED_CITY = findCityRates("east-peoria")!;
const WORKED_PRICE = 35;
const WORKED_RESULT = calculateOutTheDoor(WORKED_PRICE, "flower", WORKED_CITY);

// Same shelf price, same city, but bumped to the 25% concentrate tier so
// the article can show the tier swing without re-deriving by hand.
const WORKED_VAPE_RESULT = calculateOutTheDoor(WORKED_PRICE, "concentrate", WORKED_CITY);

export default function IllinoisCannabisTaxPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-ui, system-ui, sans-serif);background:#F7F4ED;color:#1F3D2B;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;border-bottom:1px solid #e8e4da;position:sticky;top:0;z-index:100}
        .logo-link{display:flex;align-items:center}
        .nav-links{display:flex;gap:18px;align-items:center}
        .nav-link{font-size:.88rem;color:#6b7280;text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif);font-weight:500}
        .nav-link:hover{color:#1F3D2B}
        .nav-cta{background:#1F3D2B;color:#fff;padding:8px 14px;border-radius:8px;font-size:.85rem;font-weight:700;text-decoration:none}
        .nav-cta:hover{background:#2A4F38}
        .desktop-only-nav{display:flex}
        @media(max-width:768px){.desktop-only-nav{display:none !important}}

        .wrap{max-width:680px;margin:0 auto;padding:48px 24px 64px}
        @media(min-width:720px){.wrap{padding:64px 32px 80px}}

        .eyebrow{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.74rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:#7DBA47;margin-bottom:14px;
        }
        h1{
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(2rem, 4.5vw, 2.85rem);
          font-weight:700;letter-spacing:-.04em;line-height:1.1;
          color:#1F3D2B;margin-bottom:32px;
        }
        h2{
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(1.4rem, 2.5vw, 1.75rem);
          font-weight:600;letter-spacing:-.02em;
          color:#1F3D2B;margin:36px 0 14px;
        }
        p, .article-list{
          font-family:var(--font-serif, Georgia, serif);
          font-size:1.0625rem;line-height:1.7;color:#374151;
          margin-bottom:18px;
        }
        p strong, .article-list strong{font-weight:700;color:#1F3D2B}
        .article-list{padding-left:1.4rem;list-style:disc}
        .article-list li{margin-bottom:8px}

        table.worked{
          width:100%;border-collapse:collapse;margin:18px 0 28px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.95rem;
        }
        table.worked th, table.worked td{
          padding:10px 12px;border-bottom:1px dashed #e8e4da;
          text-align:left;color:#374151;
        }
        table.worked thead th{
          background:#F7F4ED;
          font-size:.78rem;font-weight:700;letter-spacing:.06em;
          text-transform:uppercase;color:#6b7280;
        }
        table.worked td.num{
          text-align:right;font-variant-numeric:tabular-nums;
          font-family:var(--font-display, var(--font-geist-sans));
          font-weight:600;color:#1F3D2B;
        }
        table.worked tr.total td{
          border-top:1.5px solid #1F3D2B;border-bottom:none;
          padding-top:14px;font-weight:700;
        }
        table.worked tr.total td.num{font-size:1.05rem;color:#7DBA47}

        .calculator-cta{
          margin:36px 0 24px;
          background:#1F3D2B;color:#fff;
          border-radius:14px;padding:24px;
          display:flex;flex-direction:column;gap:12px;
        }
        @media(min-width:560px){
          .calculator-cta{flex-direction:row;align-items:center;justify-content:space-between}
        }
        .calculator-cta-text{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:1rem;color:#fafaf7;line-height:1.5;
        }
        .calculator-cta-text strong{color:#93CB5C;font-weight:700}
        .calculator-cta-button{
          background:#7DBA47;color:#fff;
          padding:12px 22px;border-radius:10px;
          text-decoration:none;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-weight:700;font-size:.92rem;
          white-space:nowrap;
          transition:background 150ms ease;
        }
        .calculator-cta-button:hover{background:#6BA63B}

        .source-note{
          margin-top:32px;padding-top:24px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.82rem;color:#6b7280;line-height:1.6;
          border-top:1px solid #e8e4da;
          font-style:italic;
        }
        .source-note a{color:#7DBA47;text-decoration:none;font-style:normal;font-weight:600}
        .source-note a:hover{text-decoration:underline}

        .footer{
          background:#fff;border-top:1px solid #e8e4da;
          padding:24px 28px;
          display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:12px;
        }
        .footer-link{font-size:.78rem;color:#6b7280;text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif)}
        .footer-link:hover{color:#1F3D2B}
        .footer-copy{font-size:.74rem;color:#9ca3af;font-family:var(--font-ui, system-ui, sans-serif)}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo-link" aria-label="PuffPrice home">
          <Logo size={36} />
        </Link>
        <div className="nav-links desktop-only-nav">
          <Link href="/dispensaries" className="nav-link">Browse Central IL</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/illinois-cannabis-tax-calculator" className="nav-link">Tax calculator</Link>
          <Link href="/dispensaries" className="nav-cta">For dispensaries</Link>
        </div>
        <MobileNavMenu />
      </nav>

      <main className="wrap">
        <p className="eyebrow">Pricing</p>
        <h1>Why your $35 eighth costs $45 at the register.</h1>

        <p>
          Illinois cannabis is one of the highest-taxed legal markets in the
          country. Between state taxes, county taxes, city taxes, and a tiered
          excise tax that depends on what&apos;s in the product, the price you
          see on the shelf is rarely the price you pay. The total markup at
          checkout runs <strong>between 26% and 45%</strong> of the shelf
          price, depending on what you bought and where you bought it.
        </p>
        <p>
          Most consumers find this out at the register. We&apos;d rather you
          find out before you drive.
        </p>

        <h2>What&apos;s actually on your receipt</h2>
        <p>
          Here&apos;s every tax that lands on a cannabis purchase in Illinois,
          in the order they&apos;re calculated.
        </p>

        <p>
          <strong>Cannabis Cultivation Privilege Tax — 7%.</strong> Paid by the
          grower at the wholesale level. You don&apos;t see this on your
          receipt, but it&apos;s already baked into the shelf price. It&apos;s
          part of why Illinois cannabis costs more than Michigan or Missouri to
          start with.
        </p>

        <p>
          <strong>Cannabis Purchaser Excise Tax — {formatPercent(STATE_EXCISE_RATES.flower, 0)}, {formatPercent(STATE_EXCISE_RATES.edible, 0)}, or {formatPercent(STATE_EXCISE_RATES.concentrate, 0)}.</strong>{" "}
          This is the big one. The rate depends on the product:
        </p>
        <ul className="article-list">
          <li>
            <strong>{formatPercent(STATE_EXCISE_RATES.flower, 0)}</strong> on
            cannabis flower and pre-rolls with{" "}
            <strong>35% THC or less</strong>. Most of the flower on the shelf.
          </li>
          <li>
            <strong>{formatPercent(STATE_EXCISE_RATES.edible, 0)}</strong> on
            cannabis-infused products — edibles, tinctures, drinks, topicals.
          </li>
          <li>
            <strong>{formatPercent(STATE_EXCISE_RATES.concentrate, 0)}</strong>{" "}
            on cannabis with <strong>more than 35% THC</strong> — concentrates,
            most vape carts, high-potency flower.
          </li>
        </ul>
        <p>
          A $35 eighth of 28% THC flower gets a 10% excise tax. A $35 vape cart
          gets a 25% excise tax. The same shelf price isn&apos;t the same
          out-the-door.
        </p>

        <p>
          <strong>State Retailers&apos; Occupation Tax — {formatPercent(STATE_SALES_TAX, 2)}.</strong>{" "}
          The standard Illinois sales tax. Applies on top of the excise tax,
          not the shelf price — which means the excise tax gets taxed too.
        </p>

        <p>
          <strong>County Cannabis Retailers&apos; Occupation Tax — up to 3%.</strong>{" "}
          Counties can impose this independently. Peoria County, McLean County,
          Sangamon County, Champaign County, and Tazewell County (covering East
          Peoria and Pekin) have all adopted the maximum 3% rate.
        </p>

        <p>
          <strong>Municipal Cannabis Retailers&apos; Occupation Tax — up to 3%.</strong>{" "}
          Cities can stack their own on top of the county. All nine
          dispensary-active Central Illinois cities run at the maximum 3% rate.
          Combined county-plus-city cannabis-specific add-on: 6% in every
          Central IL market.
        </p>

        <p>
          <strong>Local sales tax — varies.</strong> An additional municipal
          sales tax (separate from the cannabis-specific tax) of 2.75%–3.50%
          across our nine cities, on top of the 6.25% state ROT. Springfield,
          Bloomington, Normal, and Peoria Heights sit at 3.50%; Peoria and
          Urbana at 2.75%.
        </p>

        <h2>Worked example — ${WORKED_PRICE.toFixed(0)} eighth in {WORKED_CITY.city}</h2>

        <p>
          Listed price: <strong>{formatUsd(WORKED_RESULT.shelfPrice)}</strong>{" "}
          (28% THC flower, 10% excise tier).
        </p>

        <table className="worked" aria-label={`Worked tax example for $${WORKED_PRICE} flower in ${WORKED_CITY.city}`}>
          <thead>
            <tr>
              <th>Tax</th>
              <th style={{ textAlign: "right" }}>Rate</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cannabis Excise (≤35% THC tier)</td>
              <td className="num">{formatPercent(STATE_EXCISE_RATES.flower, 0)}</td>
              <td className="num">{formatUsd(WORKED_RESULT.cannabisExcise)}</td>
            </tr>
            <tr>
              <td>State Retailers&apos; Occupation Tax</td>
              <td className="num">{formatPercent(WORKED_CITY.stateSalesTax, 2)}</td>
              <td className="num">{formatUsd(WORKED_RESULT.stateSalesTax)}</td>
            </tr>
            <tr>
              <td>{WORKED_CITY.county} County Cannabis ROT</td>
              <td className="num">{formatPercent(WORKED_CITY.countyCannabisRot, 2)}</td>
              <td className="num">{formatUsd(WORKED_RESULT.countyCannabisTax)}</td>
            </tr>
            <tr>
              <td>{WORKED_CITY.city} Municipal Cannabis ROT</td>
              <td className="num">{formatPercent(WORKED_CITY.municipalCannabisRot, 2)}</td>
              <td className="num">{formatUsd(WORKED_RESULT.municipalCannabisTax)}</td>
            </tr>
            <tr>
              <td>Local sales tax</td>
              <td className="num">{formatPercent(WORKED_CITY.localSalesTax, 2)}</td>
              <td className="num">{formatUsd(WORKED_RESULT.localSalesTax)}</td>
            </tr>
            <tr className="total">
              <td>Total tax</td>
              <td></td>
              <td className="num">{formatUsd(WORKED_RESULT.totalTax)}</td>
            </tr>
            <tr className="total">
              <td>Out-the-door</td>
              <td></td>
              <td className="num">{formatUsd(WORKED_RESULT.outTheDoor)}</td>
            </tr>
          </tbody>
        </table>

        <p>
          That&apos;s an effective tax rate of{" "}
          <strong>{formatPercent(WORKED_RESULT.effectiveRate, 1)}</strong> on
          flower in {WORKED_CITY.city} — toward the lower end of the spectrum.
          On the same ${WORKED_PRICE} shelf price for a vape cart in the same
          city, the excise jumps from 10% to 25% and the out-the-door climbs to{" "}
          <strong>{formatUsd(WORKED_VAPE_RESULT.outTheDoor)}</strong> — an
          effective rate of {formatPercent(WORKED_VAPE_RESULT.effectiveRate, 1)}. Same dispensary,
          same shelf price, completely different total. Cook County (Chicago)
          on the same vape cart lands closer to 45%.
        </p>

        <h2>What this means for shopping</h2>
        <p>
          If you&apos;re buying flower under 35% THC, you&apos;re at the bottom
          of the tax stack. If you&apos;re buying concentrate or vape,
          you&apos;re at the top. Driving 30 minutes between two Central IL
          counties only saves a fraction of a percent today (the cannabis ROTs
          are maxed in every Central IL county we cover) — the bigger lever
          is the tier choice. Shopping the right tier saves real money.
        </p>

        <div className="calculator-cta">
          <span className="calculator-cta-text">
            <strong>Calculator is live.</strong>{" "}
            Drop a shelf price, pick the tier, pick your city, see what
            you&apos;ll pay.
          </span>
          <Link href="/illinois-cannabis-tax-calculator" className="calculator-cta-button">
            Open the calculator →
          </Link>
        </div>

        <p className="source-note">
          Tax rates current as of {TAX_RATES_LAST_UPDATED}. Sources: state
          excise and 6.25% state sales tax from the{" "}
          <a href="https://tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html" rel="noopener noreferrer" target="_blank">
            Illinois Department of Revenue cannabis tax page
          </a>
          ; per-city Municipal and per-county Cannabis ROTs from the IL DOR
          rate publications and verified against the most recent quarterly
          bulletin (FY 2026-06, effective Jan 1 2026); per-city general sales
          tax verified per city via salestaxhandbook.com.
        </p>
      </main>

      <footer className="footer">
        <span className="footer-copy">© {new Date().getFullYear()} PuffPrice · Photography via Unsplash</span>
        <div style={{ display: "flex", gap: 18 }}>
          <Link href="/about" className="footer-link">About</Link>
          <Link href="/illinois-cannabis-tax-calculator" className="footer-link">Tax calculator</Link>
          <Link href="/dispensaries" className="footer-link">For dispensaries</Link>
        </div>
      </footer>
    </>
  );
}
