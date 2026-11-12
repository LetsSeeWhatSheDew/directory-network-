"use client";
// The Scout — client pieces: the morning's entry and the rows open in place.
import { useState } from "react";
import type { PDeal } from "../data";

type Hist = { deal_days_30d: number; typical_discount_pct: number | null; best_discount_pct: number | null } | null;

const Tick = () => (
  <span className="sc-ck" aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 14 14">
      <path d="M2.5 7.5l3 3L11.5 3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

function short(name: string) {
  return name.replace(/\s+(East Peoria|Peoria Heights|Peoria|Pekin|Urbana|Champaign|Bloomington|Normal|Springfield)$/i, "");
}

function Notes({ d, hist }: { d: PDeal; hist?: Hist }) {
  return (
    <ul className="sc-checks">
      <li>
        <Tick />
        <span>
          “{d.title}”
          <small>
            Written on {short(d.store)}&apos;s own site{d.checkedLabel ? `, seen ${d.checkedLabel}` : ""}.{" "}
            {d.sourceUrl ? (
              <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
                Look for yourself ↗
              </a>
            ) : null}
          </small>
        </span>
      </li>
      {d.conditionNote ? (
        <li>
          <Tick />
          <span>
            {d.conditionNote}
            <small>From the deal&apos;s own wording.</small>
          </span>
        </li>
      ) : null}
      {d.otd ? (
        <li>
          <Tick />
          <span>
            {d.otd.shelf} shelf price ≈ {d.otd.total} out the door
            <small>
              {d.otd.city} tax, +{d.otd.ratePct}%. The counter has the final word.
            </small>
          </span>
        </li>
      ) : null}
      {hist !== undefined ? (
        <li>
          <Tick />
          <span>
            {hist ? `A deal here ${hist.deal_days_30d} of the last 30 days` : "Not enough history yet"}
            <small>
              {hist ? `Usually ${hist.typical_discount_pct ?? "—"}% off. Best we've logged: ${hist.best_discount_pct ?? "—"}%.` : "We need 7 days of notes before we say what's normal."}
            </small>
          </span>
        </li>
      ) : null}
      <li>
        <Tick />
        <span>
          {d.closesLabel}
          <small>
            {d.address ? `${d.address}, ${d.city}` : d.city}
            {d.features.length ? ` · ${d.features.join(", ")}` : ""}
            {d.phone ? (
              <>
                {" · "}
                <a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`}>{d.phone}</a>
              </>
            ) : null}
          </small>
        </span>
      </li>
    </ul>
  );
}

export function ScoutEntry({ d, hist, startOpen = false }: { d: PDeal; hist: Hist; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="sc-entry">
      <span className="sc-stamp" aria-label={`Checked ${d.checkedLabel || ""}`}>
        Checked
        <span>{d.checkedLabel?.replace(/^Today, /, "") || "—"}</span>
      </span>
      <h1 className="sc-big" data-keep-font="">
        {d.amountBig ? (
          <>
            {d.amountBig}
            <small>off</small>
          </>
        ) : (
          d.title
        )}
      </h1>
      <p className="sc-what">{d.product}</p>
      <p className="sc-where">
        {d.store} · {d.openNow ? "open now" : "closed now"}, {d.closesLabel.replace(/^Open until/, "till").toLowerCase()}
      </p>
      <button type="button" className="sc-tap" aria-expanded={open} aria-controls="sc-entry-notes" onClick={() => setOpen((o) => !o)}>
        <span>{open ? "Field notes" : "How we know"}</span>
        <i>{open ? "close" : "open"}</i>
      </button>
      <div id="sc-entry-notes" className={`sc-more${open ? " on" : ""}`} aria-hidden={!open}>
        <div>
          <Notes d={d} hist={hist} />
        </div>
      </div>
    </div>
  );
}

export function ScoutRow({ d }: { d: PDeal }) {
  const [open, setOpen] = useState(false);
  const id = `sc-row-${d.id}`;
  return (
    <div>
      <button type="button" className="sc-row" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span className="sc-row-top">
          <b>{d.amountBig ? `${d.amountBig} off` : "Deal"}</b>
          <em>{open ? "close" : "notes"}</em>
        </span>
        <span className="w">
          {d.product} · {d.store}
        </span>
      </button>
      <div id={id} className={`sc-more${open ? " on" : ""}`} aria-hidden={!open}>
        <div className="sc-inline">
          <Notes d={d} />
          <a className="sc-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
            Directions to {short(d.store)}
          </a>
        </div>
      </div>
    </div>
  );
}
