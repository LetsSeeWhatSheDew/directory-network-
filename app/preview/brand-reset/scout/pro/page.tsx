// A6 "The Scout" — Pro: we keep watch for you. Examples are live data.
import { getPreviewData } from "../../data";
import { ScoutShell } from "../chrome";

export default async function ScoutPro() {
  const data = await getPreviewData();
  const b = data.best;
  const h = data.history;
  const p = data.priceExample;
  return (
    <ScoutShell storeCount={data.storeCount} label="Scout Pro">
      <h1 className="sc-title" data-keep-font="">
        The morning report is free. Pro keeps watch for you.
      </h1>
      <ul className="sc-checks" style={{ marginTop: 24 }}>
        <li>
          <span className="sc-ck" aria-hidden="true">1</span>
          <span>
            A text the morning it shows up
            <small>{b?.amountBig ? `Example: “${b.product} ${b.amountBig} off at ${b.store} — back today.”` : "Pick a store, brand or price."}</small>
          </span>
        </li>
        <li>
          <span className="sc-ck" aria-hidden="true">2</span>
          <span>
            Out-the-door on every priced deal
            <small>{p?.otd ? `Example: ${p.title} at ${p.store} ≈ ${p.otd.total} with ${p.otd.city} tax.` : "Illinois and city tax, worked out."}</small>
          </span>
        </li>
        <li>
          <span className="sc-ck" aria-hidden="true">3</span>
          <span>
            Each store&apos;s track record
            <small>{h && b ? `Example: ${b.store}, a deal ${h.deal_days_30d} of 30 days, usually ${h.typical_discount_pct}% off.` : "So you know a real sale from a normal day."}</small>
          </span>
        </li>
        <li>
          <span className="sc-ck" aria-hidden="true">4</span>
          <span>
            Best stop on your drive
            <small>Tell us the route; we check the stores along it.</small>
          </span>
        </li>
        <li>
          <span className="sc-ck" aria-hidden="true">5</span>
          <span>
            Your savings, logged
            <small>Starts at $0. Only deals you opened through us.</small>
          </span>
        </li>
      </ul>
      <div className="sc-price">
        <div className="amt">
          $2.99 <small>a month</small> · $19 <small>a year</small>
        </div>
        <p>Pro money pays for the checking. It never buys a spot on the list.</p>
        <span className="sc-pending">Not on sale yet</span>
      </div>
      <p className="sc-route">
        <b style={{ color: "var(--ink)" }}>Free for everyone, always:</b> the best find, every deal, hours, directions, one alert.
      </p>
      <div className="sc-act">
        <a className="sc-btn" href="/alerts">
          Start with the free alert
        </a>
      </div>
    </ScoutShell>
  );
}
