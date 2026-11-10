// Round 2 · "The Gallery" — the piece opened in place, plus the rest of today's room.
import { getPreviewData } from "../../data";
import { GalleryShell, GalleryPiece, GalleryRow, GalleryAct, plateOf } from "../parts";

export default async function GalleryDeal() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <GalleryShell plate={d ? plateOf(d.category, d.title) : "house"}>
      {d ? <GalleryPiece d={d} hist={data.history} open /> : null}
      <h2 className="gl-h2" data-keep-font="">
        Also on the wall today
      </h2>
      {data.more.map((m) => (
        <GalleryRow key={m.id} d={m} />
      ))}
      <p className="gl-medium" style={{ marginTop: 14 }}>
        {data.dealCount} deals at {data.storesWithDeals} of the {data.storeCount} stores we check.
      </p>
      <div className="gl-spacer" />
      {d ? <GalleryAct d={d} /> : null}
    </GalleryShell>
  );
}
