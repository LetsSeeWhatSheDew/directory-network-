// app/components/Footer.tsx
// Shared site footer — Breathe (Sep 23): a quiet paper band that fades up
// from a soft haze edge by day and sits on deep green at night. No photos,
// no photo credits, no founder line. Five link columns (two on phones).

import Link from "next/link";
import Logo from "./Logo";

const FOOTER_COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Browse Central Illinois",
    links: [
      { href: "/city/peoria", label: "Peoria" },
      { href: "/city/east-peoria", label: "East Peoria" },
      { href: "/city/peoria-heights", label: "Peoria Heights" },
      { href: "/city/pekin", label: "Pekin" },
      { href: "/city/bloomington", label: "Bloomington" },
      { href: "/city/normal", label: "Normal" },
      { href: "/city/champaign", label: "Champaign" },
      { href: "/city/urbana", label: "Urbana" },
      { href: "/city/springfield", label: "Springfield" },
      { href: "/dispensaries", label: "All dispensaries" },
    ],
  },
  {
    heading: "Ways to buy",
    links: [
      { href: "/ways-to-buy", label: "Compare every store" },
      { href: "/drive-thru", label: "Drive-thru" },
      { href: "/medical", label: "Medical" },
      { href: "/open-late", label: "Open latest tonight" },
      { href: "/on-the-way", label: "Best deal on your route" },
      { href: "/illinois-cannabis-delivery", label: "Delivery (law tracker)" },
      { href: "/illinois-hemp-law", label: "Nov 12 hemp change" },
    ],
  },
  {
    heading: "Categories",
    links: [
      { href: "/deals/flower", label: "Flower" },
      { href: "/deals/edibles", label: "Edibles" },
      { href: "/deals/vapes", label: "Vapes" },
      { href: "/deals/concentrate", label: "Concentrates" },
      { href: "/cannabis/illinois/open-now", label: "Open now" },
    ],
  },
  {
    heading: "PuffPrice",
    links: [
      { href: "/about", label: "About" },
      { href: "/about/index", label: "PuffPrice Index" },
      { href: "/this-week", label: "This week's deals" },
      { href: "/green-wednesday", label: "Green Wednesday" },
      { href: "/deal-index", label: "Deal Index" },
      { href: "/how-we-rank", label: "How we rank" },
      { href: "/status", label: "Status: is this up to date?" },
      { href: "/out-the-door", label: "Out-the-door prices" },
      { href: "/illinois-cannabis-tax-calculator", label: "Tax calculator" },
      { href: "/guides", label: "Guides: straight answers" },
      { href: "/cannabis/illinois/first-time-guide", label: "First-time guide" },
      { href: "/cannabis/illinois/laws", label: "Illinois cannabis laws" },
    ],
  },
  {
    heading: "For dispensaries",
    links: [
      { href: "/for-dispensaries", label: "Free store report" },
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
    <footer className="pp-footer" aria-label="Site footer">
      <div className="pp-footer-inner">
        <div className="pp-footer-top">
          <div className="pp-footer-brand">
            <Logo size={34} />
            <p className="pp-footer-tagline">
              Best Bud For Your Buck$.
              <span className="pp-footer-tagline-sub">Checked on the stores&apos; own sites every morning. You can close the other tabs.</span>
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
            <span className="pp-footer-dot" aria-hidden="true" />
            Independent. Nobody pays us to rank. 21+.
          </p>
          <p className="pp-footer-disclaimer">
            &copy; {year} PuffPrice. For adults 21+. Cannabis is legal for recreational and medical use in Illinois.
            Consume responsibly. Not affiliated with any dispensary listed. The counter always has the final word.
          </p>
        </div>
      </div>

      <style>{`
        .pp-footer {
          position: relative;
          color: var(--pp-body);
          background: linear-gradient(180deg, var(--pp-paper) 0, var(--pp-surface) 140px);
          border-top: 1px solid var(--pp-border);
          padding: 3.5rem 0 2.5rem;
          margin-top: auto;
          overflow: hidden;
        }
        .pp-footer::before {
          content: ""; position: absolute; left: 50%; top: -220px; width: 760px; height: 360px; transform: translateX(-50%);
          background: radial-gradient(closest-side, rgba(243,195,160,.28), rgba(188,208,179,.16) 55%, rgba(246,241,232,0) 100%);
          pointer-events: none;
        }
        html[data-daypart="night"] .pp-footer { background: linear-gradient(180deg, var(--pp-paper) 0, #0E1A14 160px); }
        html[data-daypart="night"] .pp-footer::before { background: radial-gradient(closest-side, rgba(168,230,191,.10), rgba(238,243,176,.04) 60%, rgba(11,21,16,0) 100%); }
        .pp-footer-inner { position: relative; width: 100%; max-width: 1180px; margin: 0 auto; padding-inline: clamp(1rem, 4vw, 2rem); }
        .pp-footer-top {
          display: grid; grid-template-columns: minmax(220px, 1fr) 3fr; gap: clamp(2rem, 5vw, 4rem);
          padding-bottom: 2.25rem; border-bottom: 1px solid var(--pp-border);
        }
        .pp-footer-brand { display: flex; flex-direction: column; gap: .9rem; align-items: flex-start; }
        .pp-footer-tagline {
          font-family: var(--font-body); font-weight: 600; font-size: 1rem; letter-spacing: -.01em; line-height: 1.45;
          color: var(--pp-ink); margin: 0; display: flex; flex-direction: column; gap: .35rem; max-width: 18rem;
        }
        .pp-footer-tagline-sub { font-weight: 400; color: var(--pp-muted); font-size: .9rem; }
        .pp-footer-cols { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: clamp(1.25rem, 3vw, 2rem); }
        .pp-footer-heading {
          font-family: var(--font-body); font-weight: 600; font-size: .6875rem; letter-spacing: .2em; text-transform: uppercase;
          color: var(--pp-muted); margin: 0 0 .9rem;
        }
        .pp-footer-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .55rem; }
        .pp-footer-link {
          color: var(--pp-body); text-decoration: none; font-family: var(--font-body); font-weight: 500;
          font-size: .9rem; letter-spacing: -.005em; transition: color 160ms ease;
        }
        .pp-footer-link:hover { color: var(--pp-ink); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--pp-border-2); }
        .pp-footer-bottom { padding-top: 1.75rem; display: flex; flex-direction: column; gap: .6rem; }
        .pp-footer-anchor {
          display: flex; align-items: center; gap: .6rem;
          font-family: var(--font-body); font-weight: 600; font-size: .9rem; color: var(--pp-ink); margin: 0;
        }
        .pp-footer-dot {
          width: 9px; height: 9px; border-radius: 50%; background: var(--pp-mark-dot);
          box-shadow: 0 0 0 5px color-mix(in srgb, var(--pp-mark-dot) 18%, transparent);
          animation: pp-breath var(--breath) ease-in-out infinite;
        }
        .pp-footer-disclaimer { font-family: var(--font-body); font-size: .8rem; color: var(--pp-muted); margin: 0; line-height: 1.6; max-width: 52rem; }
        @media (prefers-reduced-motion: reduce) { .pp-footer-dot { animation: none; } }
        @media (max-width: 880px) {
          .pp-footer-top { grid-template-columns: 1fr; }
          .pp-footer-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.75rem 1.25rem; }
        }
        @media (max-width: 480px) { .pp-footer { padding: 2.75rem 0 2rem; } }
      `}</style>
    </footer>
  );
}
