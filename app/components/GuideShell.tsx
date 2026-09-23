// Shared layout for the "ways to buy" and law pages: one look, one voice.
// Lowest price · full detail · compare — every page says what it is in the
// first line, shows the list, then cites where each fact came from.
import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";
import TrustLine from "./TrustLine";

export const GUIDE_CSS = `
.gp-wrap{max-width:880px;margin:0 auto;padding:12px clamp(1rem,4vw,2rem) 56px;font-family:var(--font-body);color:var(--pp-ink)}
.gp-crumbs{font-size:.8rem;color:var(--pp-muted);margin:4px 0 14px}
.gp-crumbs a{color:var(--pp-muted);text-decoration:none}
.gp-eyebrow{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--pp-muted)}
.gp-h1{font-family:var(--font-display);font-size:clamp(1.8rem,5vw,2.6rem);line-height:1.08;margin:6px 0 10px;letter-spacing:-.02em}
.gp-lede{color:var(--pp-body);font-size:1.05rem;max-width:62ch;margin:0 0 14px;line-height:1.5}
.gp-h2{font-family:var(--font-display);font-size:1.25rem;margin:32px 0 10px}
.gp-p{line-height:1.6;max-width:66ch;margin:0 0 12px}
.gp-note{font-size:.84rem;color:var(--pp-muted);line-height:1.5;margin:10px 0}
.gp-list{display:flex;flex-direction:column;border:1px solid var(--pp-border);border-radius:14px;overflow:hidden;background:var(--pp-surface)}
.gp-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border-top:1px solid var(--pp-border);color:inherit;text-decoration:none}
.gp-row:first-child{border-top:none}
a.gp-row:hover{background:var(--pp-paper)}
.gp-row-main{display:flex;flex-direction:column;min-width:0;flex:1}
.gp-row-title{font-weight:600}
.gp-row-sub{font-size:.82rem;color:var(--pp-muted)}
.gp-row-right{flex:0 0 auto;text-align:right;font-family:var(--font-mono);font-weight:700;font-size:.95rem}
.gp-pill{display:inline-block;font-size:.72rem;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--pp-best-tint);color:var(--pp-signal-ink);white-space:nowrap}
.gp-pill.muted{background:var(--pp-paper);color:var(--pp-muted);border:1px solid var(--pp-border)}
.gp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.gp-card{display:flex;flex-direction:column;gap:6px;border:1px solid var(--pp-border);border-radius:14px;padding:16px;background:var(--pp-surface);color:inherit;text-decoration:none}
a.gp-card:hover{border-color:var(--pp-canopy)}
.gp-card b{font-family:var(--font-display);font-size:1.1rem}
.gp-card span{font-size:.88rem;color:var(--pp-muted);line-height:1.45}
.gp-card .gp-big{font-family:var(--font-mono);font-size:1.6rem;font-weight:700;color:var(--pp-canopy)}
.gp-hero-card{background:var(--pp-canopy);color:var(--pp-canopy-text);border-color:var(--pp-canopy)}
.gp-hero-card span{color:var(--pp-canopy-text);opacity:.85}
.gp-hero-card b{color:var(--pp-canopy-text)}
.gp-cta{display:flex;flex-direction:column;gap:10px;margin-top:28px;padding:18px;border-radius:14px;background:var(--pp-canopy);color:var(--pp-canopy-text)}
.gp-cta b{font-family:var(--font-display);font-size:1.1rem}
.gp-timeline{border-left:2px solid var(--pp-border);margin:8px 0 0 6px;padding-left:16px;display:flex;flex-direction:column;gap:14px}
.gp-timeline div{position:relative}
.gp-timeline div:before{content:"";position:absolute;left:-22px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--pp-canopy)}
.gp-timeline .when{font-family:var(--font-mono);font-size:.78rem;color:var(--pp-muted)}
.gp-src{font-size:.78rem;color:var(--pp-muted)}
.gp-src a{color:var(--pp-muted)}
.gp-table{width:100%;border-collapse:collapse;font-size:.92rem}
.gp-table th,.gp-table td{padding:10px 8px;border-bottom:1px solid var(--pp-border);text-align:left}
.gp-table th{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--pp-muted)}
.gp-table td.num{font-family:var(--font-mono);font-weight:700;text-align:right}
`;

export default function GuideShell({
  crumbs,
  eyebrow,
  title,
  lede,
  children,
  jsonLd,
}: {
  crumbs?: { href: string; label: string }[];
  eyebrow: string;
  title: string;
  lede: React.ReactNode;
  children: React.ReactNode;
  jsonLd?: object | object[];
}) {
  return (
    <>
      <Nav variant="light" />
      <style>{GUIDE_CSS}</style>
      <main className="gp-wrap">
        {crumbs && (
          <div className="gp-crumbs">
            <Link href="/">Central IL</Link>
            {crumbs.map((c) => (
              <span key={c.href}> › <Link href={c.href}>{c.label}</Link></span>
            ))}
          </div>
        )}
        <div className="gp-eyebrow">{eyebrow}</div>
        <h1 className="gp-h1">{title}</h1>
        <p className="gp-lede">{lede}</p>
        <TrustLine />
        {children}
      </main>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <Footer />
    </>
  );
}
