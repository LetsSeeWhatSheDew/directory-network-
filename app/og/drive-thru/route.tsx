// GET /og/drive-thru — the drive-thru profile-picture day kit, in Breathe.
//   ?kind=pfp (1080×1080, default) | post (1080×1350 explainer)
//   ?theme=day (default) | night
// Civic, no products, no deals (Meta rules). The "0" is the /drive-thru
// tracker's count for the 26 Central Illinois stores: update OPEN_NEAR_PEORIA
// here the day that changes.
import { ImageResponse } from "next/og";
import { C, loadFonts, Mark, Wordmark, Backdrop, Orb, IMG_HEADERS } from "../shared";

export const runtime = "nodejs";
const OPEN_NEAR_PEORIA = 0;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const kind = u.searchParams.get("kind") === "post" ? "post" : "pfp";
  const night = u.searchParams.get("theme") === "night";
  const fonts = await loadFonts();
  const ink = night ? C.nInk : C.ink, body = night ? C.nBody : C.body, muted = night ? C.nMuted : C.muted;
  const accent = night ? C.mint : C.canopy, big = night ? C.firefly : C.ink;

  if (kind === "pfp") {
    const W = 1080;
    return new ImageResponse(
      (
        <Backdrop w={W} h={W} night={night}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: W, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Orb size={900} night={night}>
              <span style={{ fontSize: 34, letterSpacing: "0.24em", textTransform: "uppercase", color: body, fontWeight: 600 }}>Drive-thrus open</span>
              <span style={{ fontSize: 34, letterSpacing: "0.24em", textTransform: "uppercase", color: body, fontWeight: 600 }}>near Peoria</span>
              <span style={{ fontWeight: 700, fontSize: 400, lineHeight: 0.9, letterSpacing: "-0.06em", color: big, marginTop: 10 }}>{OPEN_NEAR_PEORIA}</span>
              <span style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 58, color: accent, marginTop: 8 }}>Legal since June.</span>
              <div style={{ display: "flex", marginTop: 26 }}>
                <Mark size={64} night={night} />
              </div>
            </Orb>
          </div>
        </Backdrop>
      ),
      { width: W, height: W, fonts, headers: IMG_HEADERS }
    );
  }

  const W = 1080, H = 1350;
  const step = (n: string, head: string, text: string) => (
    <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
      <span style={{ fontFamily: "Mono", fontSize: 26, color: accent, width: 40, marginTop: 6 }}>{n}</span>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={{ fontSize: 32, fontWeight: 600, color: ink }}>{head}</span>
        <span style={{ fontSize: 27, color: body, lineHeight: 1.4, marginTop: 4 }}>{text}</span>
      </div>
    </div>
  );
  return new ImageResponse(
    (
      <Backdrop w={W} h={H} night={night}>
        <div style={{ display: "flex", flexDirection: "column", width: W, height: H, padding: "64px 76px 60px" }}>
          <Wordmark size={42} night={night} />
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Serif", fontSize: 76, lineHeight: 1.02, color: ink, marginTop: 44 }}>
            <span>Illinois made dispensary</span>
            <span>drive-thrus legal in June.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 36 }}>
            <span style={{ fontWeight: 700, fontSize: 230, lineHeight: 0.85, letterSpacing: "-0.06em", color: big }}>{OPEN_NEAR_PEORIA}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 40, fontWeight: 600, color: ink }}>open near Peoria.</span>
              <span style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 44, color: accent }}>Not one, yet.</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 52, background: night ? C.nSurface : C.surface, border: `1px solid ${night ? "rgba(168,230,191,.14)" : C.border}`, borderRadius: 30, padding: "38px 40px" }}>
            {step("01", "Our local rules haven't caught up.", "Most were written in 2019–20 and don't allow a pickup window.")}
            {step("02", "A city has to update its ordinance first.", "Until it does, a store here can't even apply to the state.")}
            {step("03", "Want one in your town?", "Tell your city council. That's the conversation that moves it.")}
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 24, color: muted }}>Get told the day one opens near you</span>
              <span style={{ fontFamily: "Mono", fontSize: 32, color: ink, marginTop: 4 }}>puffprice.com/drive-thru</span>
            </div>
            <span style={{ fontSize: 22, color: muted }}>21+ · Independent</span>
          </div>
        </div>
      </Backdrop>
    ),
    { width: W, height: H, fonts, headers: IMG_HEADERS }
  );
}
