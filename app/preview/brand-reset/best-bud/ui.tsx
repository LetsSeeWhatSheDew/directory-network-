"use client";
// Best Bud — client pieces: the hero deal and the "more" rows open in place.
import { useState } from "react";
import type { PDeal } from "../data";

type Hist = { deal_days_30d: number; typical_discount_pct: number | null; best_discount_pct: number | null } | null;

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** "Ogeez is 40% off at nuEra East Peoria." — the deal said like a friend would. */
export function Say({ d, as: Tag = "h1", className = "bud-say" }: { d: PDeal; as?: "h1" | "p" | "span"; className?: string }) {
  const what = d.product.replace(/\s+(products|brands)$/i, "");
  if (d.amountBig) {
    return (
      <Tag className={className} data-keep-font="">
        {what} is <mark className="bud-hi">{d.amountBig} off</mark> at {d.store}.
      </Tag>
    );
  }
  return (
    <Tag className={className} data-keep-font="">
      {d.title} at {d.store}.
    </Tag>
  );
}

function storeShort(name: string) {
  return name.replace(/\s+(East Peoria|Peoria Heights|Peoria|Pekin|Urbana|Champaign|Bloomington|Normal|Springfield)$/i, "");
}

function Facts({ d, hist }: { d: PDeal; hist?: Hist }) {
  return (
    <ul className="bud-facts">
      <li>
        <span className="bud-k">The store&apos;s own words</span>
        <span className="bud-v bud-quote">“{d.title}”</span>
      </li>
      {d.conditionNote ? (
        <li>
          <span className="bud-k">Heads up</span>
          <span className="bud-v">{d.conditionNote}</span>
        </li>
      ) : null}
      {d.otd ? (
        <li>
          <span className="bud-k">Out the door in {d.otd.city}</span>
          <span className="bud-v">
            {d.otd.shelf} on the shelf is about <b>{d.otd.total}</b> after tax (+{d.otd.ratePct}%)
          </span>
        </li>
      ) : null}
      {hist !== undefined ? (
        <li>
          <span className="bud-k">Track record</span>
          <span className="bud-v">
            {hist
              ? `Had a deal ${hist.deal_days_30d} of the last 30 days. Usually ${hist.typical_discount_pct ?? "—"}% off; best we've seen ${hist.best_discount_pct ?? "—"}%.`
              : "Not enough history yet to say."}
          </span>
        </li>
      ) : null}
      <li>
        <span className="bud-k">Where</span>
        <span className="bud-v">
          {d.address ? `${d.address}, ${d.city}` : d.city} · {d.closesLabel}
          {d.features.length ? <><br />{d.features.join(" · ")}</> : null}
        </span>
      </li>
      <li>
        <span className="bud-k">Double-check it yourself</span>
        <span className="bud-v">
          {d.sourceUrl ? (
            <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
              {storeShort(d.store)}&apos;s deals page ↗
            </a>
          ) : null}
          {d.sourceUrl && d.phone ? "  ·  " : null}
          {d.phone ? <a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`}>Call {d.phone}</a> : null}
        </span>
      </li>
    </ul>
  );
}

export function BudHero({ d, hist, startOpen = false }: { d: PDeal; hist: Hist; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <Say d={d} />
      <p className="bud-sub">
        <span className={d.openNow ? "bud-open" : "bud-closed"}>{d.openNow ? "Open now" : "Closed now"}</span>
        <span>{d.closesLabel.replace(/^Open until/, "till")}</span>
      </p>
      <p className="bud-proof">
        <Check />
        <span>
          Checked on {storeShort(d.store)}&apos;s own site{d.checkedLabel ? ` · ${d.checkedLabel}` : ""}. Nobody paid for this spot.
        </span>
      </p>
      <button type="button" className="bud-tap" aria-expanded={open} aria-controls="bud-hero-more" onClick={() => setOpen((o) => !o)}>
        <span>{open ? "Less" : "The details"}</span>
        <span aria-hidden="true">+</span>
      </button>
      <div id="bud-hero-more" className={`bud-more${open ? " on" : ""}`} aria-hidden={!open}>
        <div>
          <Facts d={d} hist={hist} />
        </div>
      </div>
    </>
  );
}

export function BudRow({ d }: { d: PDeal }) {
  const [open, setOpen] = useState(false);
  const id = `bud-row-${d.id}`;
  return (
    <div>
      <button type="button" className="bud-row" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <Say d={d} as="span" className="bud-row-say" />
        <span className="bud-row-sub">
          <span>
            {d.city} · {d.openNow ? "open now" : "closed now"}
          </span>
          <span>{open ? "Less" : "Details"}</span>
        </span>
      </button>
      <div id={id} className={`bud-more${open ? " on" : ""}`} aria-hidden={!open}>
        <div className="bud-inline">
          <Facts d={d} />
          <a className="bud-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
            Take me there
          </a>
        </div>
      </div>
    </div>
  );
}
