// Round 2 · Concept 2 "The Gallery" — calm free home: one plate, one label, one button.
import { getPreviewData } from "../data";
import { GalleryShell, GalleryPiece, GalleryAct, plateOf } from "./parts";

export default async function GalleryHome() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <GalleryShell plate={d ? plateOf(d.category, d.title) : "house"}>
      {d ? <GalleryPiece d={d} hist={data.history} /> : <p>Nothing checked yet today.</p>}
      <div className="gl-spacer" />
      {d ? <GalleryAct d={d} /> : null}
    </GalleryShell>
  );
}
