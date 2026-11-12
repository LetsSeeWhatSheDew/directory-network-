// The Instrument — page pieces. One readout module, two labeled cells, a
// switch for the details, and one orange button.
import Link from "next/link";
import Disclosure from "../Disclosure";
import { splitAmount } from "../bits";
import { dealFacts, shortProduct } from "../facts";
import type { PDeal, PreviewData } from "../data";
import { INSTRUMENT_CSS } from "./css";

const SHORT = (s: string) => s.replace(/\s+(East Peoria|Peoria Heights|Peoria|Pekin|Urbana|Champaign|Bloomington|Normal|Springfield)$/i, "");

export function InstrumentShell({ children, clock }: { children: React.ReactNode; clock: string }) {
  return (
    <main className="brx in">
      <style dangerouslySetInnerHTML={{ __html: INSTRUMENT_CSS }} />
      <header className="in-top">
        <Link href="/preview/brand-reset/instrument" className="in-word" aria-label="PuffPrice home">
          <i aria-hidden="true" />
          PuffPrice
        </Link>
        <span className="in-clock">CENTRAL IL · {clock}</span>
      </header>
      {children}
      <p className="in-foot">
        <span>BEST BUD FOR YOUR BUCK$</span>
        <span>NOBODY PAYS TO RANK · 21+</span>
      </p>
    </main>
  );
}

function Facts({ d, hist }: { d: PDeal; hist?: PreviewData["history"] }) {
  return (
    <ul className="in-facts">
      {dealFacts(d, hist).map((f) => (
        <li key={f.k}>
          <span>{f.k.toUpperCase()}</span>
          {f.href ? (
            <a href={f.href} {...(f.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {f.v}
            </a>
          ) : (
            <div>{f.v}</div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function InstrumentReadout({ d, hist, open = false }: { d: PDeal; hist: PreviewData["history"]; open?: boolean }) {
  const a = splitAmount(d.amountBig);
  return (
    <>
      <section className="in-mod" aria-label="Best deal near you">
        <div className="in-lbl">
          <span>BEST DEAL NEAR YOU</span>
          <span>SEEN {d.checkedLabel?.replace(/^Today, /, "").toUpperCase() ?? "—"}</span>
        </div>
        <div className="in-read">
          <h1 className="in-num" data-keep-font="">
            {a ? (a.unit === "$" ? `$${a.n}` : a.n) : "—"}
          </h1>
          <span className="in-unit">{a?.unit === "%" ? "% off" : "off"}</span>
        </div>
      </section>
      <div className="in-grid">
        <div className="in-cell">
          <span className="in-lbl">
            <span>WHAT</span>
          </span>
          <span className="in-name">{shortProduct(d)}</span>
        </div>
        <div className="in-cell">
          <span className="in-lbl">
            <span>WHERE</span>
          </span>
          <span className="in-name">
            {SHORT(d.store)}
            <small>{d.city}</small>
          </span>
        </div>
      </div>
      <div className="in-mod" style={{ paddingTop: 14, paddingBottom: 14 }}>
        <span className={`in-led${d.openNow ? "" : " off"}`}>
          {d.openNow ? "Open now" : "Closed now"} · {d.closesLabel.replace(/^Open until/, "until")}
        </span>
      </div>
      <Disclosure className="in-dx" label="Details" startOpen={open}>
        <div className="in-pmod">
          <Facts d={d} hist={hist} />
        </div>
      </Disclosure>
    </>
  );
}

export function InstrumentRow({ d }: { d: PDeal }) {
  return (
    <Disclosure
      className="in-row"
      label="DETAILS"
      openLabel="CLOSE"
      trigger={
        <span className="in-row-in">
          <span>
            <b>{shortProduct(d)}</b>
            <small>
              {d.store} · {d.openNow ? "open" : "closed"}
            </small>
          </span>
          <em>{d.amountBig ?? "—"}</em>
        </span>
      }
    >
      <Facts d={d} />
    </Disclosure>
  );
}

export function InstrumentAct({ d }: { d: PDeal }) {
  return (
    <div className="in-act">
      <a className="in-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
        <span>Go to {SHORT(d.store)}</span>
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
