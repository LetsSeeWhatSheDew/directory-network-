// A8 "Best Bud" — what Pro gets you. The answer stays free; Pro is the
// friend who keeps watch. Every example below is computed from live data.
import { getPreviewData } from "../../data";
import { BudShell } from "../chrome";

export default async function BestBudPro() {
  const data = await getPreviewData();
  const b = data.best;
  const h = data.history;
  const p = data.priceExample;
  return (
    <BudShell>
      <h1 className="bud-big" data-keep-font="">The answer&apos;s free. Always.</h1>
      <p className="bud-lede">Pro is for when you want us to keep an eye out for you.</p>
      <ol className="bud-list">
        <li>
          <span className="n">1</span>
          <div>
            <b>Text me when it drops</b>
            <p>Pick a store, a brand or a price. We tell you the morning it shows up.</p>
            {b?.amountBig ? <span className="eg">“{b.product.replace(/\s+(products|brands)$/i, "")} is {b.amountBig} off at {b.store} again.”</span> : null}
          </div>
        </li>
        <li>
          <span className="n">2</span>
          <div>
            <b>Out-the-door on everything</b>
            <p>The real total after Illinois and city tax, on every deal with a price.</p>
            {p?.otd ? (
              <span className="eg">
                {p.title} at {p.store}: about <b style={{ display: "inline", fontSize: "inherit" }}>{p.otd.total}</b> out the door.
              </span>
            ) : null}
          </div>
        </li>
        <li>
          <span className="n">3</span>
          <div>
            <b>Is this deal actually good?</b>
            <p>Each store&apos;s track record, so you know a sale from a normal Tuesday.</p>
            {h && b ? (
              <span className="eg">
                {b.store}: a deal {h.deal_days_30d} of the last 30 days, usually {h.typical_discount_pct}% off.
              </span>
            ) : null}
          </div>
        </li>
        <li>
          <span className="n">4</span>
          <div>
            <b>Best deal on your way</b>
            <p>Tell us where you&apos;re driving. We find the best stop along the route.</p>
          </div>
        </li>
        <li>
          <span className="n">5</span>
          <div>
            <b>Your savings, added up</b>
            <p>Only deals you opened through us. It starts at $0 and we never guess.</p>
          </div>
        </li>
      </ol>
      <div className="bud-price">
        <div className="amt">
          $2.99<small>/month</small> · $19<small>/year</small>
        </div>
        <p>Cancel in two taps. No ads, ever. Pro money never touches the ranking.</p>
        <span className="bud-note">Not on sale yet. Free alerts first.</span>
      </div>
      <p className="bud-free">
        <b>Free, forever:</b> the best deal near you, every deal we found, hours, directions and one alert.
      </p>
      <div className="bud-act">
        <a className="bud-btn" href="/alerts">
          Get the free alert
        </a>
      </div>
    </BudShell>
  );
}
