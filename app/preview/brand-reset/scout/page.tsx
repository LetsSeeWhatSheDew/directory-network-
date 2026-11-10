// A6 "The Scout" — calm free home: the morning's best find, open-now, one button.
import Link from "next/link";
import { getPreviewData } from "../data";
import { ScoutShell } from "./chrome";
import { ScoutEntry } from "./ui";

export default async function ScoutHome() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <ScoutShell storeCount={data.storeCount}>
      <p className="sc-kick">Best find this morning</p>
      {d ? <ScoutEntry d={d} hist={data.history} /> : <p className="sc-what">Nothing written down yet today. Back after 9.</p>}
      {d ? (
        <div className="sc-act">
          <a className="sc-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
            Get directions
          </a>
        </div>
      ) : null}
      <p className="sc-route">
        {data.storeCount} stores on the route. {data.storesWithDeals} had deals. <Link href="/status">Which sites we couldn&apos;t read</Link>
      </p>
    </ScoutShell>
  );
}
