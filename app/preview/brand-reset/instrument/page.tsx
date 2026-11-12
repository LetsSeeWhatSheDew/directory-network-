// Round 2 · Concept 3 "The Instrument" — calm free home: one readout, where, open-now, one button.
import { getPreviewData } from "../data";
import { nowCT } from "../bits";
import { InstrumentShell, InstrumentReadout, InstrumentAct } from "./parts";

export default async function InstrumentHome() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <InstrumentShell clock={nowCT()}>
      {d ? <InstrumentReadout d={d} hist={data.history} /> : <p className="in-mod">Nothing checked yet today.</p>}
      <div className="in-spacer" />
      {d ? <InstrumentAct d={d} /> : null}
    </InstrumentShell>
  );
}
