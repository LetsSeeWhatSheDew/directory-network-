import Link from "next/link";
import { LeafMark, Leaf } from "./Art";
import CityChip from "./CityChip";

const MENU: [string, string][] = [
  ["Today's deals", "/deals"],
  ["Deals by town", "/city/peoria"],
  ["Map", "/map"],
  ["Open late", "/open-late"],
  ["Drive-thru", "/drive-thru"],
  ["Free alerts", "/alerts"],
  ["Tax calculator", "/illinois-cannabis-tax-calculator"],
  ["Law updates", "/law-updates"],
  ["How we rank", "/how-we-rank"],
];

/** Site header. Rendered once, in the root layout. */
export function GoldHeader() {
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
          <CityChip />
          <details className="g-menu">
            <summary aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M4 8h16M4 16h16" />
              </svg>
            </summary>
            <div className="g-menu-panel">
              {MENU.map(([label, href]) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
            </div>
          </details>
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

/** Site footer. Rendered once, in the root layout. */
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
