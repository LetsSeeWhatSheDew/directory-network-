// The Gallery — page pieces. A deal is a plate + a wall label:
//   title = the product, maker = the store, medium = what it is,
//   dates = when it's on (open until…). Details open in place under the label.
import Link from "next/link";
import Disclosure from "../Disclosure";
import { splitAmount } from "../bits";
import { dealFacts, shortProduct } from "../facts";
import type { PDeal, PreviewData } from "../data";
import { GALLERY_CSS, plateOf, SWATCH, PLATE_NAME } from "./css";

export function GalleryShell({ children, plate = "house" }: { children: React.ReactNode; plate?: string }) {
  return (
    <main className="brx gl" data-plate={plate}>
      <style dangerouslySetInnerHTML={{ __html: GALLERY_CSS }} />
      <header className="gl-top">
        <Link href="/preview/brand-reset/gallery" className="gl-word" aria-label="PuffPrice home">
          PuffPrice
        </Link>
        <span className="gl-room">Central Illinois · today</span>
      </header>
      {children}
      <p className="gl-foot">
        <em>Best Bud For Your Buck$</em>
        Independent. Nobody pays to rank. 21+.
      </p>
    </main>
  );
}

function Facts({ d, hist }: { d: PDeal; hist?: PreviewData["history"] }) {
  return (
    <ul className="gl-facts">
      {dealFacts(d, hist).map((f) => (
        <li key={f.k}>
          <span>{f.k}</span>
          {f.href ? (
            <a href={f.href} {...(f.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {f.v}
            </a>
          ) : (
            f.v
          )}
        </li>
      ))}
    </ul>
  );
}

export function GalleryPiece({ d, hist, open = false }: { d: PDeal; hist: PreviewData["history"]; open?: boolean }) {
  const a = splitAmount(d.amountBig);
  const plate = plateOf(d.category, d.title);
  return (
    <>
      <figure className="gl-plate" style={{ margin: 0 }} aria-label={`${d.amountBig ?? ""} off ${d.product} at ${d.store}`}>
        <small>Best deal near you</small>
        <h1 className="gl-num" data-keep-font="">
          {a ? (
            a.unit === "$" ? (
              <>
                <span>$</span>
                {a.n}
              </>
            ) : (
              <>
                {a.n}
                <span>{a.unit} off</span>
              </>
            )
          ) : (
            "Deal"
          )}
        </h1>
        <div className="gl-cap">
          <span>{PLATE_NAME[plate]}</span>
          <span>{d.city}</span>
        </div>
      </figure>
      <div className="gl-label">
        <h2 className="gl-title" data-keep-font="">
          {shortProduct(d)}
        </h2>
        <p className="gl-maker">{d.store}</p>
        <p className="gl-medium">
          <b>{d.openNow ? "Open now" : "Closed now"}</b> · {d.closesLabel.replace(/^Open until/, "until")}
          {d.checkedLabel ? ` · seen ${d.checkedLabel.replace(/^Today, /, "")}` : ""}
        </p>
        <Disclosure className="gl-dx" label="The details" openLabel="Close" startOpen={open}>
          <Facts d={d} hist={hist} />
        </Disclosure>
      </div>
    </>
  );
}

export function GalleryRow({ d }: { d: PDeal }) {
  const plate = plateOf(d.category, d.title);
  return (
    <Disclosure
      className="gl-row"
      label="Details"
      openLabel="Close"
      trigger={
        <span className="gl-row-in">
          <span className="gl-swatch" style={{ ["--sw" as string]: SWATCH[plate] }}>
            {d.amountBig ?? "—"}
          </span>
          <span>
            <b>{shortProduct(d)}</b>
            <small>
              {d.store} · {d.openNow ? "open" : "closed"}
            </small>
          </span>
        </span>
      }
    >
      <Facts d={d} />
    </Disclosure>
  );
}

export function GalleryAct({ d }: { d: PDeal }) {
  return (
    <div className="gl-act">
      <a className="gl-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
        Directions to {d.store.replace(/\s+(East Peoria|Peoria Heights|Peoria|Pekin|Urbana|Champaign|Bloomington|Normal|Springfield)$/i, "")}
      </a>
    </div>
  );
}

export { plateOf };
