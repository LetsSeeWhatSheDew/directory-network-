// A8 "Best Bud" — the dispensary pitch. One package, a founding price, and a
// sample table computed from the deal log. Rank is never for sale.
import { getMarketSample } from "../../data";
import { BudShell } from "../chrome";

export default async function BestBudStores() {
  const m = await getMarketSample();
  return (
    <BudShell where="For stores">
      <h1 className="bud-big" data-keep-font="">You can&apos;t buy a better spot here. Nobody can.</h1>
      <p className="bud-lede">That&apos;s why shoppers trust the list. What we sell stores is a clear read on the market around them.</p>

      <h2 data-keep-font="" className="bud-h2">The stores within {m?.radiusMi ?? 15} miles of nuEra East Peoria, last 30 days</h2>
      {m && m.rows.length ? (
        <>
          <table className="bud-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Miles</th>
                <th>Days w/ deal</th>
                <th>Deepest</th>
              </tr>
            </thead>
            <tbody>
              {m.rows.map((r) => (
                <tr key={r.slug} className={r.slug === m.center?.slug ? "me" : undefined}>
                  <td>{r.name}</td>
                  <td>{r.mi.toFixed(1)}</td>
                  <td>{r.days ? `${r.days} of 30` : "none seen"}</td>
                  <td>{r.deepest != null ? `${r.deepest}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="bud-cap">From our daily log of each store&apos;s own site since {m.since}. A day counts if the store posted at least one deal. “None seen” can mean no deals or a site we couldn&apos;t read; the report says which.</p>
        </>
      ) : (
        <p className="bud-cap">Not enough data yet for this sample.</p>
      )}

      <div className="bud-tiers">
        <div className="bud-tier">
          <h3 data-keep-font="">
            Listed <span>Free, always</span>
          </h3>
          <ul>
            <li>Your page, kept accurate. Fixes the same day.</li>
            <li>Your deals read from your own site, every morning.</li>
            <li>Same ranking rules as everyone.</li>
          </ul>
        </div>
        <div className="bud-tier pick">
          <h3 data-keep-font="">
            Market Report <span>$99/mo</span>
          </h3>
          <ul>
            <li>Every deal the stores near you ran this month: how deep, how often, which brands.</li>
            <li>Where your deals landed against theirs.</li>
            <li>One page, plain words, in your inbox on the 1st. Plus a 20-minute call.</li>
          </ul>
          <span className="why">Founding price for the first five stores. First report free.</span>
        </div>
        <div className="bud-tier later">
          <h3 data-keep-font="">
            Market Watch <span>later</span>
          </h3>
          <ul>
            <li>Your shelf prices against every store in 15 miles, weekly.</li>
          </ul>
          <span className="why">Opens when our menu-price reader runs every day again.</span>
        </div>
      </div>
      <div className="bud-act">
        <a className="bud-btn" href="mailto:hi@puffprice.com?subject=Free%20market%20report">
          Get your free first report
        </a>
      </div>
    </BudShell>
  );
}
