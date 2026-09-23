// Direction C — "Night drive": late-night energy. Neon, receipts, the road.
import Link from "next/link";
import { getLabData } from "@/lib/labData";
import LabSwitcher from "../LabSwitcher";

export const revalidate = 900;

const CSS = `
.tc{--bg1:#0B0B1A;--bg2:#120F24;--ink:#F3F0FF;--dim:#9A94B8;--neon:#7CFFB2;--pink:#FF5FA2;--amber:#FFC857;background:radial-gradient(1200px 600px at 80% -10%,#2A1C4A 0%,transparent 60%),linear-gradient(180deg,var(--bg1),var(--bg2));color:var(--ink);min-height:100vh;font-family:var(--font-body);padding-bottom:90px;position:relative;overflow:hidden}
.tc a{color:inherit;text-decoration:none}
.tc-road{position:absolute;top:0;bottom:0;left:18px;width:4px;background:repeating-linear-gradient(180deg,var(--amber) 0 26px,transparent 26px 52px);opacity:.35;animation:tc-drive 1.6s linear infinite}
@keyframes tc-drive{from{background-position:0 0}to{background-position:0 52px}}
.tc-wrap{max-width:1000px;margin:0 auto;padding:0 20px 0 40px;position:relative}
.tc-top{display:flex;justify-content:space-between;align-items:center;padding:18px 0}
.tc-logo{font-family:var(--font-display);font-weight:700;font-size:1.3rem}
.tc-sign{font-family:var(--font-display);font-weight:700;font-size:.8rem;letter-spacing:.2em;color:var(--pink);border:2px solid var(--pink);border-radius:8px;padding:6px 10px;text-shadow:0 0 8px var(--pink),0 0 18px var(--pink);box-shadow:0 0 12px rgba(255,95,162,.5),inset 0 0 10px rgba(255,95,162,.35);animation:tc-flicker 6s infinite}
@keyframes tc-flicker{0%,19%,21%,62%,64%,100%{opacity:1}20%,63%{opacity:.45}}
.tc-hero{padding:26px 0 18px}
.tc-h1{font-family:var(--font-display);font-weight:700;font-size:clamp(3rem,14vw,6.5rem);line-height:.9;letter-spacing:-.04em;margin:0}
.tc-h1 em{font-style:normal;color:var(--neon);text-shadow:0 0 14px rgba(124,255,178,.55)}
.tc-lede{font-size:1.1rem;color:var(--dim);max-width:34ch;margin:14px 0 0;line-height:1.5}
.tc-late{display:flex;gap:14px;align-items:center;margin:22px 0 6px;padding:14px 16px;border:1px solid #2B2650;border-radius:14px;background:rgba(255,255,255,.03)}
.tc-late b{font-family:var(--font-mono);font-size:1.8rem;color:var(--amber);text-shadow:0 0 10px rgba(255,200,87,.45)}
.tc-slips{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;margin:22px 0}
.tc-slip{background:#F7F4EA;color:#1a1a1a;font-family:var(--font-mono);padding:16px 16px 22px;position:relative;transform:rotate(var(--r,0deg));box-shadow:0 10px 30px rgba(0,0,0,.45);transition:transform .2s}
.tc-slip:hover{transform:rotate(0deg) translateY(-3px)}
.tc-slip:after{content:"";position:absolute;left:0;right:0;bottom:-10px;height:10px;background:linear-gradient(-45deg,transparent 7px,#F7F4EA 0) 0 0/14px 10px,linear-gradient(45deg,transparent 7px,#F7F4EA 0) 0 0/14px 10px}
.tc-slip small{display:block;font-size:.66rem;letter-spacing:.12em;color:#666}
.tc-slip .t{font-weight:700;font-size:.95rem;line-height:1.3;margin:8px 0}
.tc-slip .p{font-size:2.2rem;font-weight:700;line-height:1;border-top:1px dashed #999;border-bottom:1px dashed #999;padding:8px 0;margin:8px 0}
.tc-sec{margin:28px 0}
.tc-h2{font-family:var(--font-display);font-size:1.5rem;margin:0 0 12px}
.tc-lanes{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.tc-lane{border:1px solid #2B2650;border-radius:14px;padding:16px;background:rgba(255,255,255,.03)}
.tc-lane b{font-family:var(--font-display);font-size:1.15rem;display:block}
.tc-lane span{color:var(--dim);font-size:.9rem}
.tc-lane.hot{border-color:var(--neon);box-shadow:0 0 18px rgba(124,255,178,.18)}
.tc-foot{font-family:var(--font-mono);font-size:.7rem;color:var(--dim);padding:10px 0}
@media (prefers-reduced-motion:reduce){.tc-road,.tc-sign{animation:none}}
`;

export default async function DirectionC() {
  const d = await getLabData();
  const rot = ["-1.5deg", "1deg", "-.6deg", "1.4deg", "-1deg", ".7deg"];
  return (
    <div className="tc">
      <style>{CSS}</style>
      <div className="tc-road" aria-hidden="true" />
      <div className="tc-wrap">
        <header className="tc-top">
          <Link href="/" className="tc-logo">PuffPrice</Link>
          <span className="tc-sign">OPEN LATE</span>
        </header>
        <section className="tc-hero">
          <h1 className="tc-h1">Pull up.<br /><em>Pay less.</em></h1>
          <p className="tc-lede">{d.dealCount} deals live tonight across Central Illinois — checked on every store&apos;s own site, sorted by what you save.</p>
          {d.latest && (
            <Link href="/open-late" className="tc-late">
              <b>{d.latest.closesLabel.replace("Open until ", "")}</b>
              <span>{d.latest.store.name} is open latest tonight · every store by closing time →</span>
            </Link>
          )}
        </section>
        <section className="tc-sec">
          <h2 className="tc-h2">Tonight&apos;s receipts</h2>
          <div className="tc-slips">
            {d.deals.slice(0, 6).map((x, i) => (
              <Link key={x.id} href={`/dispensary/${x.slug}`} className="tc-slip" style={{ ["--r" as any]: rot[i % rot.length] }}>
                <small>{x.store.toUpperCase()} · {x.city.toUpperCase()}</small>
                <div className="t">{x.title}</div>
                <div className="p">{x.pct != null ? `-${x.pct}%` : "DEAL"}</div>
                <small>VERIFIED ON STORE SITE{x.verified ? ` · ${new Date(x.verified).toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "America/Chicago" })}` : ""}</small>
              </Link>
            ))}
          </div>
        </section>
        <section className="tc-sec">
          <h2 className="tc-h2">Ways in</h2>
          <div className="tc-lanes">
            <Link href="/drive-thru" className="tc-lane hot"><b>Drive-thru</b><span>Legal since June 12. None open here yet — we&apos;ll call the first one.</span></Link>
            <Link href="/ways-to-buy" className="tc-lane"><b>Order ahead · {d.orderAhead}</b><span>Skip the line at these stores.</span></Link>
            <Link href="/medical" className="tc-lane"><b>Medical · {d.medical}</b><span>1% state tax with a card.</span></Link>
            <Link href="/illinois-cannabis-delivery" className="tc-lane"><b>Delivery</b><span>Not legal yet. Get told the day it is.</span></Link>
          </div>
        </section>
        <p className="tc-foot">DIRECTION C · NIGHT DRIVE — late-night energy that leans into drive-thru and open-late. No store pays to rank.</p>
      </div>
      <LabSwitcher current="c" />
    </div>
  );
}
