// Direction D — "Breathe": the page breathes. Puff, pass, exhale — the
// calm of knowing the deal is already found. Motion is slow and soft
// (a 10-second breath), never flashy; nothing here glamorizes smoking.
import Link from "next/link";
import { getLabData } from "@/lib/labData";
import LabSwitcher from "../LabSwitcher";

export const revalidate = 900;

const CSS = `
.td{--mist:#EEF2EC;--sage:#DCE6DA;--ink:#18261D;--dim:#5E6E62;--leaf:#2F6B45;--glow:#BFE3C4;background:linear-gradient(180deg,var(--mist),#F6F5EF 55%,var(--mist));color:var(--ink);min-height:100vh;font-family:var(--font-body);padding-bottom:100px;overflow:hidden}
.td a{color:inherit;text-decoration:none}
.td-serif{font-family:"Instrument Serif",Georgia,serif;font-weight:400}
.td-top{display:flex;justify-content:space-between;align-items:center;padding:20px 22px;max-width:1000px;margin:0 auto}
.td-logo{font-family:var(--font-display);font-weight:700;font-size:1.2rem;letter-spacing:-.01em}
.td-live{display:flex;align-items:center;gap:8px;font-size:.78rem;color:var(--dim)}
.td-live i{width:9px;height:9px;border-radius:50%;background:var(--leaf);animation:td-breath 10s ease-in-out infinite}
.td-hero{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 22px 10px;max-width:1000px;margin:0 auto}
.td-orb-wrap{position:relative;width:min(78vw,380px);aspect-ratio:1;display:grid;place-items:center;margin:8px 0 6px}
.td-orb{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 45%,#ffffff 0%,var(--glow) 45%,rgba(191,227,196,0) 70%);animation:td-breath 10s ease-in-out infinite}
.td-ring{position:absolute;inset:6%;border-radius:50%;border:1px solid rgba(47,107,69,.18);animation:td-breath 10s ease-in-out infinite;animation-delay:-.4s}
.td-ring.r2{inset:-4%;border-color:rgba(47,107,69,.09);animation-delay:-.8s}
@keyframes td-breath{0%,100%{transform:scale(.86);opacity:.75}45%,55%{transform:scale(1.06);opacity:1}}
.td-core{position:relative;z-index:1}
.td-core b{display:block;font-family:var(--font-mono);font-size:clamp(3.6rem,17vw,6rem);font-weight:700;line-height:1;color:var(--leaf)}
.td-core span{font-size:.95rem;color:var(--dim)}
.td-cue{height:1.3em;position:relative;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin-bottom:6px;width:200px}
.td-cue em{position:absolute;left:0;right:0;font-style:normal;animation:td-cue 10s ease-in-out infinite}
.td-cue em.out{animation-delay:-5s}
@keyframes td-cue{0%,5%{opacity:0}15%,40%{opacity:1}50%,100%{opacity:0}}
.td-h1{font-size:clamp(2.4rem,9vw,4.4rem);line-height:1.02;letter-spacing:-.01em;margin:10px 0 8px;max-width:16ch}
.td-h1 i{color:var(--leaf)}
.td-lede{color:var(--dim);font-size:1.05rem;max-width:40ch;line-height:1.55}
.td-sec{max-width:760px;margin:0 auto;padding:30px 22px 0}
.td-label{font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin-bottom:10px}
.td-deal{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 4px;border-bottom:1px solid rgba(24,38,29,.08);opacity:0;animation:td-exhale 1.6s ease-out forwards;transition:transform .6s ease}
.td-deal:hover{transform:translateX(4px)}
@keyframes td-exhale{from{opacity:0;transform:translateY(10px);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}
.td-deal .n{font-size:1.25rem;line-height:1.25}
.td-deal .s{font-size:.85rem;color:var(--dim);margin-top:3px}
.td-pill{flex:0 0 auto;font-family:var(--font-mono);font-weight:700;font-size:1.05rem;color:var(--leaf);background:#fff;border-radius:999px;padding:8px 14px;box-shadow:0 6px 22px rgba(47,107,69,.12)}
.td-air{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.td-cap{background:rgba(255,255,255,.7);border-radius:999px;padding:14px 20px;box-shadow:0 8px 30px rgba(47,107,69,.10);animation:td-float 12s ease-in-out infinite;font-size:.95rem}
.td-cap b{font-family:var(--font-mono);color:var(--leaf);margin-right:6px}
@keyframes td-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.td-cities{display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:center;font-size:1.05rem}
.td-cities a{border-bottom:1px solid rgba(47,107,69,.3)}
.td-note{text-align:center;color:var(--dim);font-size:.8rem;margin-top:34px;padding:0 22px}
@media (prefers-reduced-motion:reduce){.td-orb,.td-ring,.td-live i,.td-cue em,.td-cap{animation:none}.td-deal{animation:none;opacity:1}}
`;

export default async function DirectionD() {
  const d = await getLabData();
  return (
    <div className="td">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" />
      <style>{CSS}</style>
      <header className="td-top">
        <Link href="/" className="td-logo">PuffPrice</Link>
        <span className="td-live"><i /> checked this morning</span>
      </header>
      <section className="td-hero">
        <div className="td-orb-wrap" aria-hidden="true">
          <div className="td-ring r2" /><div className="td-ring" /><div className="td-orb" />
          <div className="td-core"><b>{d.dealCount}</b><span>deals, already found</span></div>
        </div>
        <div className="td-cue" aria-hidden="true"><em>breathe in</em><em className="out">breathe out</em></div>
        <h1 className="td-h1 td-serif">Take a breath. <i>We found the deal.</i></h1>
        <p className="td-lede">Every Central Illinois dispensary, checked on its own site every morning. The lowest prices, side by side — nothing to chase.</p>
      </section>

      <section className="td-sec">
        <div className="td-label">Today&apos;s best, one at a time</div>
        {d.deals.slice(0, 7).map((x, i) => (
          <Link key={x.id} href={`/dispensary/${x.slug}`} className="td-deal" style={{ animationDelay: `${0.25 + i * 0.35}s` }}>
            <span><div className="n td-serif">{x.title}</div><div className="s">{x.store} · {x.city}</div></span>
            <span className="td-pill">{x.pct != null ? `${x.pct}%` : "deal"}</span>
          </Link>
        ))}
      </section>

      <section className="td-sec" style={{ textAlign: "center" }}>
        <div className="td-label">Easy ways in</div>
        <div className="td-air">
          <Link href="/drive-thru" className="td-cap" style={{ animationDelay: "0s" }}><b>new</b>Drive-thru is legal — we&apos;ll name the first</Link>
          <Link href="/medical" className="td-cap" style={{ animationDelay: "-3s" }}><b>{d.medical}</b>stores sell medical</Link>
          <Link href="/ways-to-buy" className="td-cap" style={{ animationDelay: "-6s" }}><b>{d.orderAhead}</b>let you order ahead</Link>
          <Link href="/open-late" className="td-cap" style={{ animationDelay: "-9s" }}><b>{d.latest?.closesLabel.replace("Open until ", "") || "—"}</b>latest close tonight</Link>
        </div>
      </section>

      <section className="td-sec" style={{ textAlign: "center" }}>
        <div className="td-label">Your city</div>
        <div className="td-cities">
          {d.cities.map((c) => <Link key={c.slug} href={`/city/${c.slug}`}>{c.city} <span style={{ color: "var(--dim)", fontSize: ".85rem" }}>{c.deals}</span></Link>)}
        </div>
      </section>
      <p className="td-note">Direction D · Breathe — the page moves at the pace of a slow breath: in, hold, out. Calm, alive, and the deal is already found. No store pays to rank.</p>
      <LabSwitcher current="d" />
    </div>
  );
}
