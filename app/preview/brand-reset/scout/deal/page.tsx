// A6 "The Scout" — the entry opened in place ("field notes"), plus the rest of
// the morning's finds, one per store, each opening in place.
import Link from "next/link";
import { getPreviewData } from "../../data";
import { ScoutShell } from "../chrome";
import { ScoutEntry, ScoutRow } from "../ui";

export default async function ScoutDeal() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <ScoutShell storeCount={data.storeCount}>
      <p className="sc-kick">Best find this morning</p>
      {d ? <ScoutEntry d={d} hist={data.history} startOpen /> : null}
      <h2 data-keep-font="" className="sc-h2">Also found</h2>
      {data.more.map((m) => (
        <ScoutRow key={m.id} d={m} />
      ))}
      <p className="sc-route">
        {data.dealCount} deals at {data.storesWithDeals} of {data.storeCount} stores. <Link href="/deals/all">The full list</Link>
      </p>
      {d ? (
        <div className="sc-act">
          <a className="sc-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
            Get directions
          </a>
        </div>
      ) : null}
    </ScoutShell>
  );
}
