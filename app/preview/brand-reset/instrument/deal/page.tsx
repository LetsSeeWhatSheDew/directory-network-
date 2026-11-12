// Round 2 · "The Instrument" — details switched on in place, plus three more readouts.
import { getPreviewData } from "../../data";
import { nowCT } from "../../bits";
import { InstrumentShell, InstrumentReadout, InstrumentRow, InstrumentAct } from "../parts";

export default async function InstrumentDeal() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <InstrumentShell clock={nowCT()}>
      {d ? <InstrumentReadout d={d} hist={data.history} open /> : null}
      <h2 className="in-h2" data-keep-font="">
        ALSO TODAY · {data.dealCount} DEALS · {data.storesWithDeals}/{data.storeCount} STORES
      </h2>
      {data.more.map((m) => (
        <InstrumentRow key={m.id} d={m} />
      ))}
      <div className="in-spacer" />
      {d ? <InstrumentAct d={d} /> : null}
    </InstrumentShell>
  );
}
