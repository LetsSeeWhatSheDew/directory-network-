// GET /og/city/peoria — the link preview for a city page (1200×630).
// Leads with the city's longest everyday exhale from live data.
import { ImageResponse } from "next/og";
import { C, loadFonts, liveDeals, exhaleOf, counts, CITY_SLUGS, Wordmark, Backdrop, Orb, IMG_HEADERS } from "../../shared";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = CITY_SLUGS[slug.toLowerCase()] || "Central Illinois";
  const [fonts, deals] = await Promise.all([loadFonts(), liveDeals()]);
  const scoped = city === "Central Illinois" ? null : city;
  const ex = exhaleOf(deals, scoped);
  const n = counts(deals, scoped);
  const W = 1200, H = 630;
  return new ImageResponse(
    (
      <Backdrop w={W} h={H}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 0 56px 72px", width: 640, height: H }}>
          <Wordmark size={44} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, letterSpacing: "0.26em", textTransform: "uppercase", color: C.body, fontWeight: 500 }}>{`${city} · dispensary deals`}</div>
            <div style={{ display: "flex", flexDirection: "column", fontFamily: "Serif", fontSize: 76, lineHeight: 1.0, marginTop: 18, color: C.ink }}>
              <span>Take a breath.</span>
              <span style={{ fontStyle: "italic", color: C.canopy }}>We found the deal.</span>
            </div>
            <div style={{ fontSize: 26, color: C.body, marginTop: 24, lineHeight: 1.35 }}>
              {n.deals > 0
                ? `${n.deals} deal${n.deals === 1 ? "" : "s"} at ${n.stores} ${city} store${n.stores === 1 ? "" : "s"}, checked on their own sites every morning.`
                : `Every ${city} store, checked on its own site every morning.`}
            </div>
          </div>
          <div style={{ fontFamily: "Mono", fontSize: 22, color: C.muted }}>{`puffprice.com/city/${slug}`}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: W - 640, height: H }}>
          <Orb size={470}>
            {ex ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <span style={{ fontSize: 15, letterSpacing: "0.26em", textTransform: "uppercase", color: C.body, fontWeight: 500 }}>Longest exhale today</span>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: ex.big.length > 3 ? 116 : 136, letterSpacing: "-0.055em", lineHeight: 1 }}>{ex.big}</span>
                  <span style={{ fontWeight: 600, fontSize: 32, marginLeft: 8 }}>off</span>
                </div>
                <span style={{ fontSize: 21, color: C.body, marginTop: 10, lineHeight: 1.3 }}>{`${ex.upTo ? "Up to, on " : ""}${ex.product}`}</span>
                <span style={{ fontSize: 21, color: C.ink, fontWeight: 600, marginTop: 2 }}>{ex.store}</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <span style={{ fontFamily: "Mono", fontSize: 110, color: C.canopy }}>{n.deals}</span>
                <span style={{ fontSize: 22, color: C.body }}>deals checked this morning</span>
              </div>
            )}
          </Orb>
        </div>
      </Backdrop>
    ),
    { width: W, height: H, fonts, headers: IMG_HEADERS }
  );
}
