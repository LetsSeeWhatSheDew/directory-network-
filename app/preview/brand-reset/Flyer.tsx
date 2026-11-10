// Printable 4×6 in flyer with a QR code, in each round-2 concept's look.
// Print from the browser (File → Print, "Actual size") or use the PDFs in
// docs/brand-reset-2026-11-10/flyers/. The QR goes to puffprice.com with
// utm_source=flyer so scans show up in GA4 as their own source.
// Copy is evergreen on purpose: a flyer lives on a board for weeks, so it never
// names a deal or a price that could go stale.
import { qrSvg } from "@/lib/qrSvg";
import { flyerUrl } from "./facts";

type Variant = "vault" | "gallery" | "instrument";

const CSS = `
@page{size:4in 6in;margin:0}
html.brx-on,html.brx-on body{background:#D9D6D0!important}
.fl-wrap{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 0;gap:12px}
.fl-note{font:13px/1.4 system-ui,sans-serif;color:#555;max-width:360px;text-align:center;margin:0}
.fl{width:4in;height:6in;max-width:calc(100vw - 16px);aspect-ratio:2/3;height:auto;position:relative;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(0,0,0,.08),0 12px 40px rgba(0,0,0,.12)}
.fl-qr svg{width:100%;height:100%;display:block}
@media print{html.brx-on,html.brx-on body{background:#fff!important}.fl-wrap{padding:0;min-height:0}.fl-note{display:none}.fl{box-shadow:none;width:4in;height:6in;max-width:none}}

/* Vault: ink card, one gold line, thin numerals */
.fl.vault{background:#0C0E0D;color:#F2EDE3;font-family:var(--brx-vault-sans),sans-serif;padding:.34in .32in .28in}
.vault .fl-brand{display:flex;justify-content:space-between;font-size:11px;color:#99948A}
.vault .fl-brand b{color:#F2EDE3;font-weight:600;font-size:14px;letter-spacing:-.01em}
.vault .fl-h{margin:auto 0 0;color:#F2EDE3!important;font-family:var(--brx-vault-sans),sans-serif!important;font-weight:300!important;font-size:46px;line-height:.98;letter-spacing:-.045em}
.vault .fl-h em{font-style:normal;color:#E6C47A;font-family:inherit!important}
.vault .fl-sub{margin:.14in 0 .22in;font-size:12.5px;line-height:1.45;color:#C9C4B9;max-width:2.8in}
.vault .fl-row{display:flex;gap:.18in;align-items:flex-end;border-top:1px solid rgba(242,237,227,.14);padding-top:.18in}
.vault .fl-qr{width:1.25in;height:1.25in;background:#F2EDE3;color:#0C0E0D;padding:.12in;border-radius:8px;flex:none}
.vault .fl-url{font-size:15px;font-weight:600;letter-spacing:-.01em}
.vault .fl-small{font-size:9.5px;color:#99948A;line-height:1.45;margin-top:4px}

/* Gallery: stone card, a color plate, a wall label */
.fl.gallery{background:#F7F5F1;color:#1B1A18;font-family:var(--brx-gal-sans),sans-serif}
.gallery .fl-plate{background:#D1A08A;height:52%;padding:.26in .28in;display:flex;flex-direction:column;justify-content:space-between}
.gallery .fl-plate small{font-size:10px;opacity:.75}
.gallery .fl-h{margin:0;color:#1B1A18!important;font-family:var(--brx-gal-serif),serif;font-weight:400;font-size:44px;line-height:.98;letter-spacing:-.02em}
.gallery .fl-label{flex:1;padding:.2in .28in .22in;display:grid;grid-template-columns:1fr 1.12in;gap:.16in;align-items:end}
.gallery .fl-brandname{font-family:var(--brx-gal-serif),serif;font-size:20px}
.gallery .fl-sub{margin:4px 0 8px;font-size:11.5px;line-height:1.45;color:#5F5B54}
.gallery .fl-small{font-size:9px;color:#6E6A62;line-height:1.5}
.gallery .fl-qr{width:1.12in;height:1.12in;color:#1B1A18}
.gallery .fl-url{font-size:12px;margin-top:4px;text-align:center}

/* Instrument: grey body, white modules, one orange signal */
.fl.instrument{background:#E7E7E3;color:#161616;font-family:var(--brx-ins-sans),sans-serif;padding:.2in;gap:.07in}
.instrument .fl-mod{background:#F8F8F6;border:1px solid #D3D3CD;border-radius:16px;padding:.14in .16in}
.instrument .fl-top{display:flex;justify-content:space-between;align-items:center;font-family:var(--brx-vault-mono),monospace;font-size:8.5px;color:#77776F}
.instrument .fl-top b{font-family:var(--brx-ins-sans),sans-serif;font-size:15px;color:#161616;display:inline-flex;align-items:center;gap:5px;text-transform:lowercase}
.instrument .fl-top b i{width:7px;height:7px;border-radius:50%;background:#FF5A1F;display:inline-block}
.instrument .fl-h{margin:0;color:#161616!important;font-family:var(--brx-ins-sans),sans-serif!important;font-weight:600;font-size:42px;line-height:.95;letter-spacing:-.035em}
.instrument .fl-lbl{font-family:var(--brx-vault-mono),monospace;font-size:8.5px;color:#77776F;display:block;margin-bottom:.08in}
.instrument .fl-sub{font-size:12.5px;line-height:1.35;margin:0}
.instrument .fl-grid{display:grid;grid-template-columns:1fr 1.3in;gap:.07in;flex:1}
.instrument .fl-qr{width:100%;aspect-ratio:1;color:#161616}
.instrument .fl-go{background:#FF5A1F;color:#fff;border-radius:999px;padding:.11in .18in;display:flex;justify-content:space-between;font-weight:600;font-size:14px}
.instrument .fl-small{font-family:var(--brx-vault-mono),monospace;font-size:7.5px;color:#77776F;display:flex;justify-content:space-between}
`;

export default async function Flyer({ variant }: { variant: Variant }) {
  const url = flyerUrl(variant);
  const qr = await qrSvg(url);
  const QR = <div className="fl-qr" dangerouslySetInnerHTML={{ __html: qr }} />;
  return (
    <main className="brx fl-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {variant === "vault" ? (
        <article className="fl vault">
          <div className="fl-brand">
            <b>PuffPrice</b>
            <span>Central Illinois</span>
          </div>
          <h1 className="fl-h" data-keep-font="">
            Scan before
            <br />
            you <em>buy.</em>
          </h1>
          <p className="fl-sub">The best cannabis deal near you, checked every morning at 26 Central Illinois dispensaries.</p>
          <div className="fl-row">
            {QR}
            <div>
              <div className="fl-url">puffprice.com</div>
              <div className="fl-small">
                Best Bud For Your Buck$
                <br />
                Free. No account. Nobody pays to rank.
                <br />
                21+ only.
              </div>
            </div>
          </div>
        </article>
      ) : variant === "gallery" ? (
        <article className="fl gallery">
          <div className="fl-plate">
            <small>Central Illinois · every morning</small>
            <h1 className="fl-h" data-keep-font="">
              Scan before
              <br />
              you buy.
            </h1>
          </div>
          <div className="fl-label">
            <div>
              <div className="fl-brandname">PuffPrice</div>
              <p className="fl-sub">The best cannabis deal near you, checked at 26 dispensaries&apos; own sites.</p>
              <div className="fl-small">
                Best Bud For Your Buck$
                <br />
                Free · No account · Nobody pays to rank · 21+
              </div>
            </div>
            <div>
              {QR}
              <div className="fl-url">puffprice.com</div>
            </div>
          </div>
        </article>
      ) : (
        <article className="fl instrument">
          <div className="fl-mod fl-top">
            <b>
              <i aria-hidden="true" />
              PuffPrice
            </b>
            <span>CENTRAL IL · 26 STORES</span>
          </div>
          <div className="fl-mod">
            <span className="fl-lbl">BEFORE YOU BUY</span>
            <h1 className="fl-h" data-keep-font="">
              Scan for the best deal near you.
            </h1>
          </div>
          <div className="fl-grid">
            <div className="fl-mod" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span className="fl-lbl">HOW</span>
              <p className="fl-sub">We check every store&apos;s own site each morning. Nobody pays to rank. Free, no account.</p>
            </div>
            <div className="fl-mod">{QR}</div>
          </div>
          <div className="fl-go">
            <span>puffprice.com</span>
            <span aria-hidden="true">→</span>
          </div>
          <div className="fl-small">
            <span>BEST BUD FOR YOUR BUCK$</span>
            <span>21+ ONLY</span>
          </div>
        </article>
      )}
      <p className="fl-note">4 × 6 in. Print at actual size. QR opens puffprice.com (tagged “flyer” so scans show up in analytics).</p>
    </main>
  );
}
