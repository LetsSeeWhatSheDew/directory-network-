// GET /og/deal-of-the-day — today's deal of the day as a share image.
//   ?size=og (1200×630 link preview, default) | post (1080×1350 Instagram portrait)
//   ?theme=day (default) | night
//   ?download=1  sends it as a file (the /deal-of-the-day download buttons)
// Selection: lib/dealOfTheDay.ts (the same pick as the page, llms-full.txt and
// the MCP tool). Real data only; if nothing qualifies the image says so.
import { ImageResponse } from "next/og";
import { C, loadFonts, todayLabel, Wordmark, Backdrop, Orb, IMG_HEADERS } from "../shared";
import { getDealOfTheDay, dotdCopy, checkedLabel } from "../../../lib/dealOfTheDay";
import { amountOf, productOf, storeWithCity } from "../../../lib/exhale";

export const runtime = "nodejs";

const SIZES = { og: [1200, 630], post: [1080, 1350] } as const;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const want = u.searchParams.get("size") || "og";
  const size = (Object.hasOwn(SIZES, want) ? want : "og") as keyof typeof SIZES;
  const night = u.searchParams.get("theme") === "night";
  const download = u.searchParams.get("download") === "1";
  const [W, H] = SIZES[size];
  const [fonts, r] = await Promise.all([loadFonts(), getDealOfTheDay()]);

  const ink = night ? C.nInk : C.ink, body = night ? C.nBody : C.body, muted = night ? C.nMuted : C.muted;
  const accent = night ? C.mint : C.canopy, big = night ? C.firefly : C.ink;
  const og = size === "og";
  const pick = r.status === "ok" ? dotdCopy(r.pick) : null;
  const checked = r.status === "ok" ? checkedLabel(r.pick.verified_at) : null;
  const a = r.status === "ok" ? r.amount : null;

  const orbInner = pick && a ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <span style={{ fontSize: og ? 15 : 22, letterSpacing: "0.26em", textTransform: "uppercase", color: body, fontWeight: 500 }}>Deal of the day</span>
      <div style={{ display: "flex", alignItems: "baseline", marginTop: 8, color: big }}>
        <span style={{ fontWeight: 700, fontSize: og ? 128 : a.big.length > 3 ? 184 : 214, letterSpacing: "-0.055em", lineHeight: 1 }}>{a.big}</span>
        <span style={{ fontWeight: 600, fontSize: og ? 30 : 46, marginLeft: 10 }}>off</span>
      </div>
      <span style={{ fontSize: og ? 20 : 30, color: body, marginTop: 14, lineHeight: 1.3 }}>{pick.product.slice(0, 48)}</span>
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <span style={{ fontFamily: "Serif", fontSize: og ? 50 : 70, color: accent, lineHeight: 1.05 }}>
        {r.status === "unknown" ? "Checked every morning" : "No clear winner today"}
      </span>
      <span style={{ fontSize: og ? 20 : 28, color: body, marginTop: 12 }}>
        {r.status === "none" ? `${r.live} deals live, none an everyday saving` : "on the stores' own sites"}
      </span>
    </div>
  );

  const headers: Record<string, string> = r.status === "unknown" ? { "Cache-Control": "public, max-age=0, s-maxage=60" } : { ...IMG_HEADERS };
  if (download) headers["Content-Disposition"] = `attachment; filename="puffprice-deal-of-the-day-${r.day}-${size === "og" ? "1200x630" : "1080x1350"}.png"`;

  if (og) {
    return new ImageResponse(
      (
        <Backdrop w={W} h={H} night={night}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 0 52px 72px", width: 650, height: H }}>
            <Wordmark size={44} night={night} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Mono", fontSize: 20, color: muted }}>{todayLabel()}</span>
              <div style={{ display: "flex", flexDirection: "column", fontFamily: "Serif", fontSize: 70, lineHeight: 1.0, color: ink, marginTop: 12 }}>
                <span>Deal of the day.</span>
                <span style={{ fontStyle: "italic", color: accent }}>Biggest real saving.</span>
              </div>
              <div style={{ fontSize: 28, color: ink, fontWeight: 600, marginTop: 24 }}>{pick ? pick.store : "Central Illinois"}</div>
              <div style={{ fontSize: 22, color: body, marginTop: 6, lineHeight: 1.35 }}>
                {pick ? (checked ? `Checked on the store's own site, ${checked} CT` : "Checked on the store's own site") : "Every deal checked on the stores' own sites"}
              </div>
            </div>
            <div style={{ fontFamily: "Mono", fontSize: 20, color: muted }}>puffprice.com · Nobody pays us to rank. 21+.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: W - 650, height: H }}>
            <Orb size={470} night={night}>{orbInner}</Orb>
          </div>
        </Backdrop>
      ),
      { width: W, height: H, fonts, headers }
    );
  }

  const more = r.status === "ok" ? r.runnersUp.slice(0, 2) : [];
  return new ImageResponse(
    (
      <Backdrop w={W} h={H} night={night}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: W, height: H, padding: "64px 72px 56px" }}>
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
            <Wordmark size={46} night={night} />
            <span style={{ fontFamily: "Mono", fontSize: 24, color: muted }}>{todayLabel()}</span>
          </div>
          <div style={{ display: "flex", marginTop: 30 }}>
            <Orb size={660} night={night}>{orbInner}</Orb>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 14 }}>
            <span style={{ fontFamily: "Serif", fontSize: 58, lineHeight: 1.05, color: ink }}>{pick ? pick.store : "Central Illinois"}</span>
            <span style={{ fontSize: 24, color: body, marginTop: 10 }}>
              {pick ? (checked ? `Checked on the store's own site, ${checked} CT` : "Checked on the store's own site") : "Every deal checked on the stores' own sites every morning"}
            </span>
            {pick?.otdEstimate && <span style={{ fontSize: 22, color: muted, marginTop: 6 }}>{pick.otdEstimate}</span>}
          </div>
          {more.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 30, gap: 12 }}>
              <span style={{ fontSize: 18, letterSpacing: "0.22em", textTransform: "uppercase", color: muted }}>Also good today</span>
              {more.map((d, i) => {
                const m = amountOf(d)!;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: night ? C.nSurface : C.surface, border: `1px solid ${night ? "rgba(168,230,191,.14)" : C.border}`, borderRadius: 26, padding: "18px 26px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 27, fontWeight: 600, color: ink }}>{storeWithCity(d).slice(0, 38)}</span>
                      <span style={{ fontSize: 22, color: body, marginTop: 2 }}>{productOf(d).slice(0, 44)}</span>
                    </div>
                    <span style={{ fontSize: 25, fontWeight: 700, padding: "10px 18px", borderRadius: 999, background: night ? C.firefly : C.ink, color: night ? C.nPaper : "#FBF6EE" }}>Save {m.big}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: muted }}>
            <span style={{ fontFamily: "Mono" }}>puffprice.com/deal-of-the-day</span>
            <span>Nobody pays us to rank. 21+.</span>
          </div>
        </div>
      </Backdrop>
    ),
    { width: W, height: H, fonts, headers }
  );
}
