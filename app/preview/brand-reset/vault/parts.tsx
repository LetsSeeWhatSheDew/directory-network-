// The Vault — page pieces (server components; the open-in-place is Disclosure).
import Link from "next/link";
import Disclosure from "../Disclosure";
import { StoreMark, splitAmount } from "../bits";
import { dealFacts, shortProduct } from "../facts";
import type { PDeal, PreviewData } from "../data";
import { VAULT_CSS } from "./css";

export function VaultShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="brx vt">
      <style dangerouslySetInnerHTML={{ __html: VAULT_CSS }} />
      <header className="vt-top">
        <Link href="/preview/brand-reset/vault" className="vt-word" aria-label="PuffPrice home">
          PuffPrice
        </Link>
        <span className="vt-where">Central Illinois</span>
      </header>
      {children}
      <p className="vt-foot">
        <span>Best Bud For Your Buck$</span>
        <span>Nobody pays to rank · 21+</span>
      </p>
    </main>
  );
}

function Facts({ d, hist }: { d: PDeal; hist?: PreviewData["history"] }) {
  return (
    <ul className="vt-facts">
      {dealFacts(d, hist).map((f) => (
        <li key={f.k}>
          <span>{f.k}</span>
          <div>
            {f.href ? (
              <a href={f.href} {...(f.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {f.v}
              </a>
            ) : (
              f.v
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VaultHero({ d, hist, open = false }: { d: PDeal; hist: PreviewData["history"]; open?: boolean }) {
  const a = splitAmount(d.amountBig);
  return (
    <section className="vt-hero">
      <p className="vt-label">Best deal near you right now</p>
      <h1 className="vt-big" data-keep-font="">
        {a ? (
          a.unit === "$" ? (
            <>
              <span>$</span>
              {a.n}
            </>
          ) : (
            <>
              {a.n}
              <span>{a.unit}</span>
            </>
          )
        ) : (
          "Deal"
        )}
      </h1>
      <p className="vt-what">off {shortProduct(d)}</p>
      <div className="vt-store">
        <StoreMark d={d} className="vt-logo" monoClassName="vt-mono" />
        <div>
          <b>{d.store}</b>
          <small>
            {d.openNow ? <i className="vt-dot" aria-hidden="true" /> : null}
            {d.openNow ? "Open" : "Closed"} · {d.closesLabel.replace(/^Open /, "")}
          </small>
        </div>
      </div>
      <Disclosure className="vt-dx" label="Details" openLabel="Close" startOpen={open}>
        <Facts d={d} hist={hist} />
      </Disclosure>
    </section>
  );
}

export function VaultRow({ d }: { d: PDeal }) {
  return (
    <Disclosure
      className="vt-row"
      label="Details"
      openLabel="Close"
      trigger={
        <span className="vt-row-in">
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

export function VaultAct({ d }: { d: PDeal }) {
  return (
    <div className="vt-act">
      <a className="vt-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
        <span>Directions</span>
        <i>{d.city}</i>
      </a>
    </div>
  );
}
