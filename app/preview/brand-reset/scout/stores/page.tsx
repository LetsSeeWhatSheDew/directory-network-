// A6 "The Scout" — the dispensary pitch. Ledger computed from the deal log.
import { getMarketSample, getPreviewData } from "../../data";
import { ScoutShell } from "../chrome";

export default async function ScoutStores() {
  const [m, data] = await Promise.all([getMarketSample(), getPreviewData()]);
  return (
    <ScoutShell storeCount={data.storeCount} label="For dispensaries">
      <h1 className="sc-title" data-keep-font="">
        We already watch your market every morning.
      </h1>
      <p className="sc-lede">Shoppers trust the list because nobody can buy a spot on it. Not you, not the store down the road. What we offer you is the notebook.</p>

      <h2 data-keep-font="" className="sc-h2">Sample: within {m?.radiusMi ?? 15} mi of nuEra East Peoria</h2>
      {m && m.rows.length ? (
        <>
          <table className="sc-ledger">
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
          <p className="sc-cap">Logged daily from each store&apos;s own site since {m.since}. A day counts if the store posted at least one deal. “None seen” = no deals posted, or a site we couldn&apos;t read; the report tells you which.</p>
        </>
      ) : (
        <p className="sc-cap">Not enough data yet for this sample.</p>
      )}

      <div className="sc-tier">
        <h3 data-keep-font="">
          Listed <span>Free, always</span>
        </h3>
        <ul>
          <li>Your page kept right. Fixes the same day.</li>
          <li>Your deals read from your own site every morning.</li>
          <li>Same ranking rules as every store.</li>
        </ul>
      </div>
      <div className="sc-tier pick">
        <h3 data-keep-font="">
          Market Report <span>$99 / mo</span>
        </h3>
        <ul>
          <li>Every deal the stores near you ran this month, how deep, how often.</li>
          <li>Where yours landed against theirs.</li>
          <li>One page on the 1st, plus a 20-minute call.</li>
        </ul>
        <span className="why">Founding price, first five stores. First report free.</span>
      </div>
      <div className="sc-tier later">
        <h3 data-keep-font="">
          Market Watch <span>later</span>
        </h3>
        <ul>
          <li>Your shelf prices against every store in 15 miles, weekly.</li>
        </ul>
        <span className="why">Opens when the menu-price reader runs daily again.</span>
      </div>
      <div className="sc-act">
        <a className="sc-btn" href="mailto:hi@puffprice.com?subject=Free%20market%20report">
          Get your free first report
        </a>
      </div>
    </ScoutShell>
  );
}
