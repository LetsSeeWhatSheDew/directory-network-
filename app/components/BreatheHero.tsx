// BreatheHero — the homepage opens on a slow breath. The orb swells and
// settles on a 10-second cycle behind today's live deal count; the three
// best deals ease in like an exhale. Ambient only: every number and link
// is readable immediately. After dark the sky turns to night.
import Link from "next/link";
import { MapPin } from "lucide-react";

type Deal = {
  deal_id?: string;
  id?: string;
  name?: string;
  city?: string;
  deal_title?: string;
  discount_value?: number | null;
  discount_unit?: string | null;
  slug?: string;
  listing_slug?: string;
};
type Cat = { slug: string; label: string };

const CSS = `
.bh{position:relative;overflow:hidden;background:linear-gradient(180deg,var(--pp-paper) 0%,#F6F7F2 60%,var(--pp-paper) 100%);color:var(--pp-ink);padding:10px clamp(1rem,4vw,2rem) 34px;transition:background 1.2s ease}
.bh-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:18px;align-items:center}
@media(min-width:960px){.bh-inner{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px}}
.bh-left{display:flex;flex-direction:column;align-items:center;text-align:center}
@media(min-width:960px){.bh-left{order:2}}
.bh-loc{display:inline-flex;align-items:center;background:rgba(255,255,255,.85);border-radius:999px;padding:6px 12px;margin-bottom:6px;box-shadow:0 4px 16px rgba(47,107,69,.08)}
.bh-orb-wrap{position:relative;width:min(76vw,360px);aspect-ratio:1;display:grid;place-items:center}
.bh-orb{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 45%,#ffffff 0%,var(--pp-glow) 45%,rgba(191,227,196,0) 70%);animation:pp-breath var(--breath) ease-in-out infinite}
.bh-ring{position:absolute;inset:6%;border-radius:50%;border:1px solid rgba(47,107,69,.18);animation:pp-breath var(--breath) ease-in-out infinite;animation-delay:-.4s}
.bh-ring.r2{inset:-4%;border-color:rgba(47,107,69,.09);animation-delay:-.8s}
.bh-core{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}
.bh-core b{font-family:var(--font-mono);font-size:clamp(3.6rem,16vw,6rem);font-weight:700;line-height:1;color:var(--pp-signal)}
.bh-core span{font-size:.95rem;color:var(--pp-muted)}
.bh-cue{position:relative;height:1.3em;width:220px;font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;color:var(--pp-muted)}
.bh-cue em{position:absolute;left:0;right:0;font-style:normal;opacity:0;animation:pp-cue var(--breath) ease-in-out infinite}
.bh-cue em.out{animation-delay:calc(var(--breath) / -2)}
.bh-right{display:flex;flex-direction:column;gap:14px}
@media(min-width:960px){.bh-right{order:1}}
.bh h1.bh-h1{font-size:clamp(2.5rem,8vw,4.4rem) !important;line-height:1.02 !important;margin:0;color:var(--pp-ink);text-align:center}
@media(min-width:960px){.bh h1.bh-h1{text-align:left}}
.bh-h1 i{color:var(--pp-signal)}
.bh-sub{color:var(--pp-muted);font-size:1.05rem;line-height:1.55;margin:0;text-align:center}
@media(min-width:960px){.bh-sub{text-align:left}}
.bh-sub b{color:var(--pp-ink);font-weight:600}
.bh-ctas{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
@media(min-width:960px){.bh-ctas{justify-content:flex-start}}
.bh-btn{display:inline-flex;align-items:center;gap:8px;padding:13px 20px;border-radius:999px;font-weight:600;font-size:1rem;text-decoration:none;transition:transform .6s ease,box-shadow .6s ease}
.bh-btn:hover{transform:translateY(-1px)}
.bh-btn.primary{background:var(--pp-canopy);color:var(--pp-canopy-text);box-shadow:0 8px 24px rgba(31,74,50,.22)}
.bh-btn.ghost{background:rgba(255,255,255,.75);color:var(--pp-ink);border:1px solid var(--pp-border)}
.bh-deals{display:flex;flex-direction:column;margin-top:4px}
.bh-deal{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 2px;border-bottom:1px solid rgba(24,38,29,.08);color:inherit;text-decoration:none;animation:pp-exhale 1.4s ease-out both}
.bh-deal .n{font-family:var(--font-breath);font-size:1.2rem;line-height:1.2}
.bh-deal .s{font-size:.82rem;color:var(--pp-muted);margin-top:2px}
.bh-pill{flex:0 0 auto;font-family:var(--font-mono);font-weight:700;font-size:1.05rem;color:var(--pp-signal);background:#fff;border-radius:999px;padding:7px 13px;box-shadow:0 6px 20px rgba(47,107,69,.12)}
.bh-cats{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 2px 6px}
.bh-cats::-webkit-scrollbar{display:none}
.bh-cat{flex:0 0 auto;display:inline-flex;gap:6px;align-items:baseline;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.7);border:1px solid var(--pp-border);color:var(--pp-ink);text-decoration:none;font-size:.9rem}
.bh-cat small{font-family:var(--font-mono);font-size:.72rem;color:var(--pp-muted)}
/* Night sky — same breath, deep colors. */
html[data-daypart="night"] .bh{background:radial-gradient(900px 500px at 70% 0%,#24453A 0%,transparent 60%),linear-gradient(180deg,#0E1A15,#132219 70%,#0E1A15);color:#E6EFE7}
html[data-daypart="night"] .bh h1.bh-h1{color:#EEF4EE}
html[data-daypart="night"] .bh-h1 i{color:#9FE0B0}
html[data-daypart="night"] .bh-sub,html[data-daypart="night"] .bh-core span,html[data-daypart="night"] .bh-cue,html[data-daypart="night"] .bh-deal .s,html[data-daypart="night"] .bh-cat small{color:#A8BBAD}
html[data-daypart="night"] .bh-sub b{color:#EEF4EE}
html[data-daypart="night"] .bh-core b{color:#9FE0B0}
html[data-daypart="night"] .bh-orb{background:radial-gradient(circle at 50% 45%,rgba(214,245,222,.55) 0%,rgba(120,200,150,.28) 40%,rgba(120,200,150,0) 70%)}
html[data-daypart="night"] .bh-ring{border-color:rgba(159,224,176,.22)}
html[data-daypart="night"] .bh-ring.r2{border-color:rgba(159,224,176,.1)}
html[data-daypart="night"] .bh-deal{border-bottom-color:rgba(255,255,255,.08)}
html[data-daypart="night"] .bh-pill{background:#1C3328;color:#9FE0B0;box-shadow:none}
html[data-daypart="night"] .bh-btn.primary{background:#9FE0B0;color:#0E1A15}
html[data-daypart="night"] .bh-btn.ghost,html[data-daypart="night"] .bh-cat{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);color:#E6EFE7}
`;

function pctOf(d: Deal): number | null {
  const v = Number(d.discount_value);
  const u = (d.discount_unit || "").toLowerCase();
  return Number.isFinite(v) && v > 0 && v <= 100 && (u === "percent" || !u) ? Math.round(v) : null;
}

export default function BreatheHero({
  dealCount, deals, categories, catCounts, location,
}: {
  dealCount: number | null;
  deals: Deal[];
  categories: Cat[];
  catCounts: Record<string, number>;
  location: React.ReactNode;
}) {
  const seen = new Set<string>();
  const top = (deals || []).filter((d) => {
    const k = `${(d.name || "").toLowerCase()}|${(d.deal_title || "").toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 3);
  return (
    <section className="bh" aria-labelledby="bh-title">
      <style>{CSS}</style>
      <div className="bh-inner">
        <div className="bh-left">
          <div className="bh-loc">{location}</div>
          <div className="bh-orb-wrap">
            <div className="bh-ring r2" aria-hidden="true" />
            <div className="bh-ring" aria-hidden="true" />
            <div className="bh-orb" aria-hidden="true" />
            <div className="bh-core">
              <b>{dealCount ?? "—"}</b>
              <span>deals, already found</span>
            </div>
          </div>
          <div className="bh-cue" aria-hidden="true"><em>breathe in</em><em className="out">breathe out</em></div>
        </div>
        <div className="bh-right">
          <h1 id="bh-title" className="bh-h1">Take a breath. <i>We found the deal.</i></h1>
          <p className="bh-sub"><b>Best Bud For Your Buck$.</b> Every Central Illinois dispensary, checked on its own site every morning — the lowest prices, side by side.</p>
          <div className="bh-ctas">
            <Link href="/cannabis/illinois/open-now" className="bh-btn primary"><MapPin size={18} strokeWidth={2.25} aria-hidden="true" /> Find deals near me</Link>
            <Link href="/ways-to-buy" className="bh-btn ghost">Drive-thru, medical &amp; more</Link>
          </div>
          {top.length > 0 && (
            <div className="bh-deals">
              {top.map((d, i) => {
                const p = pctOf(d);
                return (
                  <Link key={d.deal_id || d.id || i} href={`/dispensary/${d.slug || d.listing_slug}`} className="bh-deal" style={{ animationDelay: `${0.3 + i * 0.35}s` }}>
                    <span><div className="n">{d.deal_title}</div><div className="s">{d.name}{d.city ? ` · ${d.city}` : ""}</div></span>
                    <span className="bh-pill">{p != null ? `${p}%` : "deal"}</span>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="bh-cats" aria-label="Browse by category">
            {categories.map((c) => (
              <Link key={c.slug} href={`/deals/${c.slug}`} className="bh-cat">
                {c.label} <small>{catCounts[c.slug] ? catCounts[c.slug] : "—"}</small>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
