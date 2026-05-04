// app/components/Footer.tsx
// Shared site footer — deep brand surface with leaf-pattern watermark
// at 6% opacity. Cream wordmark, "Built in Peoria, Illinois 🌿" anchor,
// "Photography via Pexels" trust line, four-column link grid.
// Brand spec § 6 page-by-page surface table; manifest § 2 leaf-pattern
// rule for footer band.

import Link from "next/link";
import Logo from "./Logo";

const FOOTER_COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Browse Central Illinois",
    links: [
      { href: "/city/peoria", label: "Peoria" },
      { href: "/city/bloomington", label: "Bloomington" },
      { href: "/city/champaign", label: "Champaign" },
      { href: "/city/springfield", label: "Springfield" },
      { href: "/dispensaries", label: "All dispensaries" },
    ],
  },
  {
    heading: "Categories",
    links: [
      { href: "/deals/flower", label: "Flower" },
      { href: "/deals/edibles", label: "Edibles" },
      { href: "/deals/vapes", label: "Vapes" },
      { href: "/deals/concentrates", label: "Concentrates" },
      { href: "/cannabis/illinois/open-now", label: "Open now" },
    ],
  },
  {
    heading: "PuffPrice",
    links: [
      { href: "/about", label: "About" },
      { href: "/about/index", label: "PuffPrice Index" },
      { href: "/illinois-cannabis-tax-calculator", label: "Tax calculator" },
      { href: "/cannabis/illinois/first-time-guide", label: "First-time guide" },
      { href: "/cannabis/illinois/laws", label: "Illinois cannabis laws" },
    ],
  },
  {
    heading: "For dispensaries",
    links: [
      { href: "/get-listed", label: "Get listed" },
      { href: "/claim", label: "Claim a listing" },
      { href: "/dispensaries", label: "Dispensary directory" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="pp-footer pp-surface-deep pp-leaf pp-leaf-06" aria-label="Site footer">
      <div className="pp-footer-inner">
        <div className="pp-footer-top">
          <div className="pp-footer-brand">
            <Logo size={36} inverse />
            <p className="pp-footer-tagline">
              Best Bud For Your Buck<span className="pp-footer-dollar">$</span>
              <br />
              <span className="pp-footer-tagline-sub">Low Prices. High Times.</span>
            </p>
          </div>

          <div className="pp-footer-cols">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="pp-footer-col">
                <h4 className="pp-footer-heading">{col.heading}</h4>
                <ul className="pp-footer-list">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="pp-footer-link">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pp-footer-bottom">
          <p className="pp-footer-anchor">
            Built in Peoria, Illinois <span aria-hidden="true">🌿</span>
          </p>
          <p className="pp-footer-meta">
            &copy; {year} PuffPrice &mdash; All rights reserved.{" "}
            <span aria-hidden="true" style={{ opacity: 0.4 }}>&middot;</span>{" "}
            Photography via{" "}
            <a href="https://www.pexels.com" rel="noreferrer noopener" target="_blank" className="pp-footer-link-inline">Pexels</a>{" "}
            and Unsplash
          </p>
          <p className="pp-footer-disclaimer">
            For adults 21+. Cannabis is legal for recreational and medical use in Illinois.
            Consume responsibly. Not affiliated with any dispensary listed.
          </p>
        </div>
      </div>

      <style>{`
        .pp-footer {
          color: var(--color-cream, #F7F4ED);
          padding: 4rem 0 3rem;
          margin-top: auto;
        }
        .pp-footer-inner {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding-inline: clamp(1rem, 4vw, 2rem);
        }
        .pp-footer-top {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 3fr;
          gap: clamp(2rem, 5vw, 4rem);
          padding-bottom: 2.5rem;
          border-bottom: 1px solid rgba(247, 244, 237, 0.12);
        }
        .pp-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }
        .pp-footer-tagline {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 600;
          font-size: 1.0625rem;
          letter-spacing: -0.015em;
          line-height: 1.4;
          color: var(--color-cream, #F7F4ED);
          margin: 0;
        }
        .pp-footer-dollar { color: var(--color-sage-vibrant, #93CB5C); font-weight: 800; }
        .pp-footer-tagline-sub {
          font-weight: 400;
          color: rgba(247, 244, 237, 0.72);
          font-size: 0.9375rem;
        }
        .pp-footer-cols {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(1.25rem, 3vw, 2rem);
        }
        .pp-footer-heading {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 800;
          font-size: 0.6875rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-sage-vibrant, #93CB5C);
          margin: 0 0 1rem;
        }
        .pp-footer-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.625rem; }
        .pp-footer-link, .pp-footer-link-inline {
          color: rgba(247, 244, 237, 0.78);
          text-decoration: none;
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 500;
          font-size: 0.9375rem;
          letter-spacing: -0.005em;
          transition: color 160ms ease;
        }
        .pp-footer-link:hover, .pp-footer-link-inline:hover {
          color: var(--color-cream, #F7F4ED);
        }
        .pp-footer-link-inline { text-decoration: underline; text-decoration-color: rgba(247, 244, 237, 0.30); text-underline-offset: 3px; }
        .pp-footer-bottom {
          padding-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .pp-footer-anchor {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          letter-spacing: 0.01em;
          color: var(--color-cream, #F7F4ED);
          margin: 0;
        }
        .pp-footer-meta, .pp-footer-disclaimer {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 400;
          font-size: 0.8125rem;
          color: rgba(247, 244, 237, 0.55);
          margin: 0;
          line-height: 1.55;
        }
        .pp-footer-disclaimer { padding-top: 0.5rem; max-width: 56rem; }

        @media (max-width: 880px) {
          .pp-footer-top { grid-template-columns: 1fr; }
          .pp-footer-cols { grid-template-columns: repeat(2, 1fr); gap: 1.75rem; }
        }
        @media (max-width: 480px) {
          .pp-footer { padding: 3rem 0 2rem; }
          .pp-footer-cols { grid-template-columns: 1fr; }
        }
      `}</style>
    </footer>
  );
}
