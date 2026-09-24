// GET /og/today — the daily "today's longest exhale" share image.
//   ?size=post (1080×1350, default) | story (1080×1920) | og (1200×630)
//   ?theme=day (default) | night
// Live data, refreshed every 15 minutes. If no everyday deal qualifies, the
// orb shows the true deal count instead of inventing a number.
import { ImageResponse } from "next/og";
import { lowestList, amountOf, productOf, storeName } from "../../../lib/exhale";
import { C, loadFonts, liveDeals, exhaleOf, counts, todayLabel, Wordmark, Backdrop, Orb, IMG_HEADERS } from "../shared";

export const runtime = "nodejs";

const SIZES = { post: [1080, 1350], story: [1080, 1920], og: [1200, 630] } as const;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const size = (u.searchParams.get("size") as keyof typeof SIZES) || "post";
  const night = u.searchParams.get("theme") === "night";
  const [W, H] = SIZES[size] || SIZES.post;
  const [fonts, deals] = await Promise.all([loadFonts(), liveDeals()]);
  const ex = exhaleOf(deals);
  const n = counts(deals);
  const ink = night ? C.nInk : C.ink, body = night ? C.nBody : C.body, muted = night ? C.nMuted : C.muted;
  const accent = night ? C.mint : C.canopy, big = night ? C.firefly : C.ink;
  const lead = deals.find((d) => ex && productOf(d) === ex.product && d.city === ex.city);
  const more = lowestList(deals, 6, null, lead ? String(lead.deal_id || "") : null).filter((d) => productOf(d) !== ex?.product).slice(0, 3);

  const orbInner = ex ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <span style={{ fontSize: size === "og" ? 15 : 22, letterSpacing: "0.26em", textTransform: "uppercase", color: body, fontWeight: 500 }}>Today&rsquo;s longest exhale</span>
      <div style={{ display: "flex", alignItems: "baseline", marginTop: 8, color: big }}>
        <span style={{ fontWeight: 700, fontSize: size === "og" ? 132 : ex.big.length > 3 ? 190 : 220, letterSpacing: "-0.055em", lineHeight: 1 }}>{ex.big}</span>
        <span style={{ fontWeight: 600, fontSize: size === "og" ? 30 : 46, marginLeft: 10 }}>off</span>
      </div>
      <span style={{ fontSize: size === "og" ? 20 : 30, color: body, marginTop: 14, lineHeight: 1.3 }}>{`${ex.upTo ? "Up to, on " : ""}${ex.product}`}</span>
      <span style={{ fontSize: size === "og" ? 20 : 30, color: ink, fontWeight: 600, marginTop: 4 }}>{ex.store}</span>
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <span style={{ fontFamily: "Mono", fontSize: 160, color: accent }}>{n.deals}</span>
      <span style={{ fontSize: 30, color: body }}>deals checked this morning</span>
    </div>
  );

  if (size === "og") {
    return new ImageResponse(
      (
        <Backdrop w={W} h={H} night={night}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 0 56px 72px", width: 640, height: H }}>
            <Wordmark size={44} night={night} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", flexDirection: "column", fontFamily: "Serif", fontSize: 78, lineHeight: 1.0, color: ink }}>
                <span>Take a breath.</span>
                <span style={{ fontStyle: "italic", color: accent }}>We found the deal.</span>
              </div>
              <div style={{ fontSize: 26, color: body, marginTop: 24, lineHeight: 1.35 }}>
                {`Best Bud For Your Buck$. ${n.deals} Central Illinois deals, checked on the stores' own sites every morning.`}
              </div>
            </div>
            <div style={{ fontFamily: "Mono", fontSize: 22, color: muted }}>puffprice.com</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: W - 640, height: H }}>
            <Orb size={470} night={night}>{orbInner}</Orb>
          </div>
        </Backdrop>
      ),
      { width: W, height: H, fonts, headers: IMG_HEADERS }
    );
  }

  const story = size === "story";
  return new ImageResponse(
    (
      <Backdrop w={W} h={H} night={night}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: W, height: H, padding: story ? "120px 72px 110px" : "64px 72px 56px" }}>
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
            <Wordmark size={46} night={night} />
            <span style={{ fontFamily: "Mono", fontSize: 24, color: muted }}>{todayLabel()}</span>
          </div>
          <div style={{ display: "flex", marginTop: story ? 110 : 36 }}>
            <Orb size={story ? 800 : 700} night={night}>{orbInner}</Orb>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Serif", fontSize: story ? 64 : 54, lineHeight: 1.05, color: ink, marginTop: story ? 60 : 20, textAlign: "center" }}>
            <span>Drop your shoulders.</span>
            <span style={{ fontStyle: "italic", color: accent }}>The comparing is done.</span>
          </div>
          {more.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: story ? 70 : 30, gap: 12 }}>
              {more.slice(0, story ? 3 : 2).map((d, i) => {
                const a = amountOf(d)!;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: night ? C.nSurface : C.surface, border: `1px solid ${night ? "rgba(168,230,191,.14)" : C.border}`, borderRadius: 26, padding: "20px 26px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 28, fontWeight: 600, color: ink }}>{storeName(d)}{d.city && !storeName(d).toLowerCase().includes(String(d.city).toLowerCase()) ? ` · ${d.city}` : ""}</span>
                      <span style={{ fontSize: 23, color: body, marginTop: 2 }}>{productOf(d).slice(0, 44)}</span>
                    </div>
                    <span style={{ fontSize: 26, fontWeight: 700, padding: "10px 18px", borderRadius: 999, background: night ? C.firefly : C.ink, color: night ? C.nPaper : "#FBF6EE" }}>Save {a.upTo ? "up to " : ""}{a.big}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: muted }}>
            <span style={{ fontFamily: "Mono" }}>{n.deals} deals · {n.stores} stores · puffprice.com</span>
            <span>Nobody pays us to rank. 21+.</span>
          </div>
        </div>
      </Backdrop>
    ),
    { width: W, height: H, fonts, headers: IMG_HEADERS }
  );
}
