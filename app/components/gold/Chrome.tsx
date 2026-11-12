import Link from "next/link";
import { LeafMark, Leaf } from "./Art";

export function GoldHeader({ city }: { city?: string | null }) {
  return (
    <header className="g-head">
      <div className="g-wrap g-head-in">
        <Link href="/" className="g-logo" aria-label="PuffPrice home">
          <LeafMark />
          <b>PuffPrice</b>
        </Link>
        <nav className="g-head-nav" aria-label="Main">
          <Link className="g-hl" href="/deals">Deals</Link>
          <Link className="g-hl" href="/map">Map</Link>
          <Link className="g-hl" href="/alerts">Free alerts</Link>
          <Link className="g-city" href="/city/peoria" aria-label={`Showing deals near ${city || "Central Illinois"}. Change town`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {city || "Central IL"}
          </Link>
        </nav>
      </div>
    </header>
  );
}

const FOOT_LINKS: [string, string][] = [
  ["All deals", "/deals"],
  ["Towns", "/city/peoria"],
  ["Map", "/map"],
  ["Free alerts", "/alerts"],
  ["How we rank", "/how-we-rank"],
  ["Tax calculator", "/illinois-cannabis-tax-calculator"],
  ["Law updates", "/law-updates"],
  ["For dispensaries", "/for-dispensaries"],
  ["About", "/about"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

export function GoldFooter() {
  return (
    <footer className="g-foot">
      <div className="g-wrap g-foot-in">
        <Link href="/" className="g-logo" aria-label="PuffPrice home">
          <LeafMark />
          <b>PuffPrice</b>
        </Link>
        <nav className="g-foot-links" aria-label="Footer">
          {FOOT_LINKS.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <div className="g-foot-line">
          <span>Independent. Nobody pays us to rank. 21+.</span>
          <span>Central Illinois · checked every morning</span>
        </div>
      </div>
      <Leaf tone="ghost" className="g-alert-leaf" />
    </footer>
  );
}
