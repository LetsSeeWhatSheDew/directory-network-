// Printable counter card: a 4x6 card (single) or two per letter sheet with
// cut lines. Server-rendered; the QR is inline SVG from lib/qrSvg.ts.
// Print tokens (--pp-print-*) keep it ink-on-white day or night.
import Link from "next/link";
import PrintButton from "../components/PrintButton";
import { brand } from "../../lib/brand";

export type CardSize = "letter" | "4x6";

export function parseSize(v: string | string[] | undefined): CardSize {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "4x6" ? "4x6" : "letter";
}

const CSS = (size: CardSize) => `
.cc-root{min-height:100vh;padding:16px 16px 48px;font-family:var(--font-body);color:var(--pp-ink)}
.cc-screen{max-width:760px;margin:0 auto 20px}
.cc-screen .back{font-size:.85rem;color:var(--pp-muted);text-decoration:none}
.cc-screen h1{font-size:clamp(1.5rem,5vw,2.1rem);line-height:1.1;margin:8px 0 6px}
.cc-screen p{color:var(--pp-body);line-height:1.5;margin:0 0 12px;max-width:62ch}
.cc-tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0 0}
.cc-size{display:inline-flex;border:1px solid var(--pp-border);border-radius:10px;overflow:hidden}
.cc-size a{padding:9px 12px;font-size:.88rem;text-decoration:none;color:var(--pp-body);background:var(--pp-surface)}
.cc-size a[aria-current="page"]{background:var(--pp-best-tint);color:var(--pp-signal-ink);font-weight:700}
.cc-preview{overflow-x:auto;padding-bottom:8px}
.cc-sheet{display:flex;gap:0;justify-content:center;margin:0 auto;width:max-content;background:var(--pp-print-paper);box-shadow:0 1px 0 var(--pp-border),0 8px 30px rgba(0,0,0,.08)}
.cc-card{width:4in;height:6in;box-sizing:border-box;padding:.32in .32in .26in;display:flex;flex-direction:column;align-items:center;text-align:center;background:var(--pp-print-paper);color:var(--pp-print-ink);position:relative}
.cc-sheet.two .cc-card{outline:1px dashed var(--pp-print-rule);outline-offset:-1px}
.cc-brand{display:flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:9pt;letter-spacing:.16em;text-transform:uppercase;color:var(--pp-print-muted)}
.cc-dot{width:7px;height:7px;border-radius:50%;background:var(--pp-print-ink)}
.cc-store{margin-top:.16in;font-weight:700;font-size:12.5pt;line-height:1.2}
.cc-head{font-family:var(--font-breath);font-size:24pt;line-height:1.05;margin-top:.06in;max-width:3.3in}
.cc-qr{width:2.15in;height:2.15in;margin-top:.2in;color:var(--pp-print-ink)}
.cc-qr svg{width:100%;height:100%;display:block}
.cc-scan{font-size:9pt;margin-top:.1in;color:var(--pp-print-muted)}
.cc-url{font-family:var(--font-mono);font-size:7.5pt;margin-top:.03in;color:var(--pp-print-muted);word-break:break-all;max-width:3.3in}
.cc-trust{margin-top:auto;padding-top:.1in;border-top:1px solid var(--pp-print-rule);width:100%;font-weight:700;font-size:9.5pt}
.cc-small{font-size:6.5pt;line-height:1.35;color:var(--pp-print-muted);margin-top:.05in;max-width:3.3in}
.cc-cut{font-size:.8rem;color:var(--pp-muted);text-align:center;margin-top:10px}
@page{size:${size === "4x6" ? "4in 6in" : "letter portrait"};margin:${size === "4x6" ? "0" : "0.5in 0.25in"}}
@media print{
  html,body{background:var(--pp-print-paper) !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body > *:not(.cc-root){display:none !important}
  .cc-root{padding:0;min-height:0}
  .cc-screen,.cc-cut{display:none !important}
  .cc-preview{overflow:visible;padding:0}
  .cc-sheet{box-shadow:none;margin:0 auto}
  .cc-card{break-inside:avoid}
}
`;

export default function CounterCard({
  size,
  svg,
  url,
  store,
  headline,
  smallPrint,
  screenTitle,
  screenText,
  backHref,
  backLabel,
  sizeHref,
}: {
  size: CardSize;
  svg: string;
  url: string;
  store?: string | null;
  headline: string;
  smallPrint: string;
  screenTitle: string;
  screenText: React.ReactNode;
  backHref: string;
  backLabel: string;
  /** Base path for the size switch links. */
  sizeHref: string;
}) {
  const shown = url.replace(/^https:\/\/(www\.)?/, "").replace(/\?.*$/, "");
  const one = (
    <div className="cc-card">
      <div className="cc-brand"><span className="cc-dot" aria-hidden="true" />{brand.name}</div>
      {store && <div className="cc-store">{store}</div>}
      <div className="cc-head">{headline}</div>
      <div className="cc-qr" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="cc-scan">Point your phone camera here.</div>
      <div className="cc-url">{shown}</div>
      <div className="cc-trust">Independent. Nobody pays us to rank. 21+.</div>
      <div className="cc-small">{smallPrint}</div>
    </div>
  );
  return (
    <div className="cc-root">
      <style>{CSS(size)}</style>
      <div className="cc-screen">
        <Link href={backHref} className="back">← {backLabel}</Link>
        <h1>{screenTitle}</h1>
        <p>{screenText}</p>
        <div className="cc-tools">
          <div className="cc-size" role="group" aria-label="Paper size">
            <Link href={sizeHref} aria-current={size === "letter" ? "page" : undefined}>Letter, 2 per sheet</Link>
            <Link href={`${sizeHref}?size=4x6`} aria-current={size === "4x6" ? "page" : undefined}>4×6 card</Link>
          </div>
          <PrintButton label="Print card" />
        </div>
      </div>
      <div className="cc-preview">
        <div className={`cc-sheet${size === "letter" ? " two" : ""}`}>
          {one}
          {size === "letter" && one}
        </div>
      </div>
      {size === "letter" && <p className="cc-cut">Cut along the dashed lines. Each card is 4×6 inches.</p>}
    </div>
  );
}
