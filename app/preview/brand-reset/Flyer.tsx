// Printable 4×6 in flyer with a QR code. Round 3 (after Matthew's note that the
// round-2 flyers didn't say "cannabis"): each one is built around ONE leaf as
// the focal point — drawn from geometry in ./leaf.ts, never stock or AI art.
//   vault      → "Gold Leaf": black card, foil-gold leaf, the keeper line.
//   gallery    → "Big Leaf": deep green, one giant cream leaf off the edge.
//   instrument → "Leaf Code": the leaf sits inside a big QR (error level H).
// Print from the browser (File → Print, "Actual size") or use the PDFs in
// docs/brand-reset-2026-11-10/flyers/. The QR goes to puffprice.com with
// utm_source=flyer so scans show up in GA4 as their own source.
// Copy is evergreen on purpose: a flyer lives on a board for weeks, so it never
// names a deal or a price that could go stale.
import QRCode from "qrcode";
import { flyerUrl } from "./facts";
import { leafSvg } from "./leaf";

type Variant = "vault" | "gallery" | "instrument";

async function qr(text: string, level: "M" | "H") {
  const svg = await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: level,
    margin: 0,
    color: { dark: "#000000ff", light: "#00000000" },
  });
  return svg
    .replace(/stroke="#000000"/g, 'stroke="currentColor"')
    .replace(/fill="#000000"/g, 'fill="currentColor"')
    .replace("<svg ", '<svg role="img" aria-label="QR code to puffprice.com" ');
}

const GOLD = `<linearGradient id="fl-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E3A8"/><stop offset=".45" stop-color="#D9B260"/><stop offset=".7" stop-color="#F1D58E"/><stop offset="1" stop-color="#A9822F"/></linearGradient>`;

const CSS = `
@page{size:4in 6in;margin:0}
html.brx-on,html.brx-on body{background:#D9D6D0!important}
.fl-wrap{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 0;gap:12px}
.fl-note{font:13px/1.4 system-ui,sans-serif;color:#555;max-width:360px;text-align:center;margin:0}
.fl{width:4in;height:6in;max-width:calc(100vw - 16px);aspect-ratio:2/3;height:auto;position:relative;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(0,0,0,.08),0 12px 40px rgba(0,0,0,.12)}
.fl svg{display:block;width:100%;height:100%}
.fl h1{margin:0}
@media print{html.brx-on,html.brx-on body{background:#fff!important}.fl-wrap{padding:0;min-height:0}.fl-note{display:none}.fl{box-shadow:none;width:4in;height:6in;max-width:none}}

/* Gold Leaf */
.fl.vault{background:radial-gradient(120% 70% at 50% 30%,#1B1D1B 0%,#0C0E0D 62%);color:#F2EDE3;font-family:var(--brx-vault-sans),sans-serif;padding:.26in .3in .26in}
.vault .fl-brand{display:flex;justify-content:space-between;align-items:baseline;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#99948A}
.vault .fl-brand b{color:#F2EDE3;font-weight:600;font-size:14px;letter-spacing:-.01em;text-transform:none}
.vault .fl-leaf{width:2.75in;height:2.7in;margin:.12in auto 0;filter:drop-shadow(0 0 18px rgba(230,196,122,.22))}
.vault .fl-h{text-align:center;color:#F2EDE3!important;font-family:var(--brx-vault-sans),sans-serif!important;font-weight:300!important;font-size:38px;line-height:1;letter-spacing:-.04em;margin-top:.08in!important}
.vault .fl-h em{font-family:inherit!important;font-style:normal;font-weight:500;color:#E2BE6E}
.vault .fl-sub{text-align:center;margin:.1in auto 0;font-size:11.5px;line-height:1.45;color:#C9C4B9;max-width:2.9in}
.vault .fl-row{margin-top:auto;display:flex;gap:.16in;align-items:center;border-top:1px solid rgba(230,196,122,.35);padding-top:.16in}
.vault .fl-qr{width:1.12in;height:1.12in;background:#F2EDE3;color:#0C0E0D;padding:.09in;border-radius:8px;flex:none}
.vault .fl-cta{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#E6C47A}
.vault .fl-url{font-size:17px;font-weight:600;letter-spacing:-.01em;margin-top:2px}
.vault .fl-small{font-size:9px;color:#99948A;line-height:1.45;margin-top:5px}

/* Big Leaf */
.fl.gallery{background:#1E3A2B;color:#F4EFE4;font-family:var(--brx-gal-sans),sans-serif}
.gallery .fl-leaf{position:absolute;width:5.3in;height:5.2in;top:-.55in;right:-1.55in;transform:rotate(-14deg);opacity:1}
.gallery .fl-top{position:relative;padding:.24in .28in 0;display:flex;justify-content:space-between;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#B9C7BB}
.gallery .fl-copy{position:relative;margin-top:auto;padding:0 .28in .2in}
.gallery .fl-h{color:#F4EFE4!important;font-family:var(--brx-gal-serif),serif!important;font-weight:400;font-size:40px;line-height:1;letter-spacing:-.02em}
.gallery .fl-h i{font-style:italic;color:#E7C98F}
.gallery .fl-label{position:relative;background:#F4EFE4;color:#1B1A18;margin:0 .2in .2in;border-radius:4px;padding:.14in .16in;display:grid;grid-template-columns:1fr 1.05in;gap:.14in;align-items:center}
.gallery .fl-brandname{font-family:var(--brx-gal-serif),serif;font-size:21px;line-height:1}
.gallery .fl-sub{margin:5px 0 6px;font-size:10.5px;line-height:1.4;color:#4E4A43}
.gallery .fl-small{font-size:8.5px;color:#6E6A62;line-height:1.5}
.gallery .fl-qr{width:1.05in;height:1.05in;color:#1B1A18}
.gallery .fl-url{font-size:11px;margin-top:4px;font-weight:600}

/* Leaf Code */
.fl.instrument{background:#F3F1EC;color:#161616;font-family:var(--brx-ins-sans),sans-serif;padding:.24in .26in .22in;align-items:stretch}
.instrument .fl-top{display:flex;justify-content:space-between;align-items:center;font-family:var(--brx-vault-mono),monospace;font-size:8px;color:#77776F}
.instrument .fl-top b{font-family:var(--brx-ins-sans),sans-serif;font-size:15px;color:#161616;display:inline-flex;align-items:center;gap:5px}
.instrument .fl-top b i{width:12px;height:12px;display:inline-block}
.instrument .fl-h{color:#161616!important;font-family:var(--brx-ins-sans),sans-serif!important;font-weight:700;font-size:39px;line-height:.93;letter-spacing:-.04em;margin-top:.16in!important}
.instrument .fl-h span{color:#FF5A1F}
.instrument .fl-code{position:relative;width:3.05in;height:3.05in;margin:.24in auto 0;color:#161616}
.instrument .fl-badge{position:absolute;left:50%;top:50%;width:21%;height:21%;transform:translate(-50%,-50%);background:#FF5A1F;border-radius:22%;box-shadow:0 0 0 .035in #F3F1EC;padding:4%}
.instrument .fl-go{margin-top:auto;background:#FF5A1F;color:#fff;border-radius:999px;padding:.11in .2in;display:flex;justify-content:space-between;font-weight:600;font-size:14.5px}
.instrument .fl-small{margin-top:.09in;font-family:var(--brx-vault-mono),monospace;font-size:7.5px;color:#77776F;display:flex;justify-content:space-between}
`;

export default async function Flyer({ variant }: { variant: Variant }) {
  // Each design gets its own QR tag so GA4 can tell them apart.
  const url = flyerUrl({ vault: "gold-leaf", gallery: "big-leaf", instrument: "leaf-code" }[variant]);
  const html = (s: string, className: string) => <div className={className} dangerouslySetInnerHTML={{ __html: s }} />;

  if (variant === "vault") {
    const leaf = leafSvg({ mode: "solid", color: "url(#fl-gold)", bg: "#0C0E0D", stroke: 7, defs: GOLD, title: "Cannabis leaf" });
    return (
      <main className="brx fl-wrap">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <article className="fl vault">
          <div className="fl-brand">
            <b>PuffPrice</b>
            <span>Central Illinois</span>
          </div>
          {html(leaf, "fl-leaf")}
          <h1 className="fl-h" data-keep-font="">
            Best Bud For
            <br />
            Your <em>Buck$</em>
          </h1>
          <p className="fl-sub">Today&apos;s best cannabis deal near you, checked every morning at 26 Central Illinois dispensaries.</p>
          <div className="fl-row">
            {html(await qr(url, "M"), "fl-qr")}
            <div>
              <div className="fl-cta">Scan before you buy</div>
              <div className="fl-url">puffprice.com</div>
              <div className="fl-small">
                Free. No account. Nobody pays to rank.
                <br />
                21+ only.
              </div>
            </div>
          </div>
        </article>
        <Note />
      </main>
    );
  }

  if (variant === "gallery") {
    const leaf = leafSvg({ mode: "solid", color: "#F4EFE4", bg: "#1E3A2B", stroke: 5, title: "Cannabis leaf" });
    return (
      <main className="brx fl-wrap">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <article className="fl gallery">
          {html(leaf, "fl-leaf")}
          <div className="fl-top">
            <span>Central Illinois</span>
          </div>
          <div className="fl-copy">
            <h1 className="fl-h" data-keep-font="">
              The best deal
              <br />
              in town, <i>daily.</i>
            </h1>
          </div>
          <div className="fl-label">
            <div>
              <div className="fl-brandname">PuffPrice</div>
              <p className="fl-sub">Best Bud For Your Buck$. We check 26 dispensaries&apos; own sites every morning. Nobody pays to rank.</p>
              <div className="fl-small">Free · No account · 21+ only</div>
            </div>
            <div>
              {html(await qr(url, "M"), "fl-qr")}
              <div className="fl-url">puffprice.com</div>
            </div>
          </div>
        </article>
        <Note />
      </main>
    );
  }

  const badge = leafSvg({ mode: "solid", color: "#FFFFFF", stroke: 9, title: "Cannabis leaf" });
  const dot = leafSvg({ mode: "solid", color: "#FF5A1F", stroke: 9 });
  return (
    <main className="brx fl-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <article className="fl instrument">
        <div className="fl-top">
          <b>
            <i aria-hidden="true" dangerouslySetInnerHTML={{ __html: dot }} />
            PuffPrice
          </b>
          <span>CENTRAL IL · 26 STORES · DAILY</span>
        </div>
        <h1 className="fl-h" data-keep-font="">
          Best Bud For
          <br />
          Your Buck<span>$</span>
        </h1>
        <div className="fl-code">
          <div dangerouslySetInnerHTML={{ __html: await qr(url, "H") }} style={{ width: "100%", height: "100%" }} />
          {html(badge, "fl-badge")}
        </div>
        <div className="fl-go">
          <span>Scan · today&apos;s best deal near you</span>
          <span aria-hidden="true">→</span>
        </div>
        <div className="fl-small">
          <span>PUFFPRICE.COM · NOBODY PAYS TO RANK</span>
          <span>21+ ONLY</span>
        </div>
      </article>
      <Note />
    </main>
  );
}

function Note() {
  return <p className="fl-note">4 × 6 in. Print at actual size. QR opens puffprice.com (tagged “flyer” so scans show up in analytics).</p>;
}
