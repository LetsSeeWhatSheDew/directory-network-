// Direction A — "The Ticker": a live price screen. Dark, confident, numbers first.
import Link from "next/link";
import { getLabData } from "@/lib/labData";
import LabSwitcher from "../LabSwitcher";

export const revalidate = 900;

const CSS = `
.ta{--bg:#0A0D0B;--ink:#EDEFE9;--dim:#7C857E;--line:#1E2521;--lime:#B6F36A;--red:#FF6B5B;background:var(--bg);color:var(--ink);min-height:100vh;font-family:var(--font-body);padding-bottom:90px}
.ta a{color:inherit;text-decoration:none}
.ta-top{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line)}
.ta-logo{font-family:var(--font-display);font-weight:700;font-size:1.25rem;letter-spacing:-.02em}
.ta-logo span{color:var(--lime)}
.ta-live{font-family:var(--font-mono);font-size:.72rem;color:var(--dim);display:flex;align-items:center;gap:8px}
.ta-dot{width:8px;height:8px;border-radius:50%;background:var(--lime);box-shadow:0 0 0 0 rgba(182,243,106,.6);animation:ta-pulse 2s infinite}
@keyframes ta-pulse{0%{box-shadow:0 0 0 0 rgba(182,243,106,.55)}70%{box-shadow:0 0 0 12px rgba(182,243,106,0)}100%{box-shadow:0 0 0 0 rgba(182,243,106,0)}}
.ta-tape{overflow:hidden;border-bottom:1px solid var(--line);white-space:nowrap;font-family:var(--font-mono);font-size:.8rem}
.ta-tape-in{display:inline-block;padding:10px 0;animation:ta-scroll 60s linear infinite}
.ta-tape-in span{margin:0 22px;color:var(--dim)}
.ta-tape-in b{color:var(--lime);font-weight:700;margin-left:6px}
@keyframes ta-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ta-hero{padding:34px 20px 26px;max-width:1100px;margin:0 auto}
.ta-kicker{font-family:var(--font-mono);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.ta-big{font-family:var(--font-mono);font-weight:700;font-size:clamp(5rem,26vw,11rem);line-height:.85;letter-spacing:-.06em;color:var(--lime);margin:12px 0 6px}
.ta-sub{font-family:var(--font-display);font-size:clamp(1.3rem,5vw,2rem);line-height:1.15;max-width:22ch}
.ta-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:26px 0 0}
.ta-stat{padding:14px 0 14px 0;border-right:1px solid var(--line)}
.ta-stat:last-child{border-right:none}
.ta-stat b{display:block;font-family:var(--font-mono);font-size:1.6rem;font-weight:700}
.ta-stat span{font-size:.72rem;color:var(--dim);text-transform:uppercase;letter-spacing:.08em}
.ta-stat{padding-left:12px}
.ta-sec{max-width:1100px;margin:0 auto;padding:18px 20px}
.ta-h{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--font-mono);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);padding:10px 0;border-bottom:1px solid var(--line)}
.ta-row{display:grid;grid-template-columns:28px 1fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line)}
.ta-row:hover{background:#0f1411}
.ta-rank{font-family:var(--font-mono);color:var(--dim);font-size:.85rem}
.ta-deal{font-weight:600;line-height:1.25}
.ta-store{font-size:.8rem;color:var(--dim);margin-top:2px}
.ta-pct{font-family:var(--font-mono);font-weight:700;font-size:1.7rem;color:var(--lime)}
.ta-pct.na{font-size:.9rem;color:var(--ink)}
.ta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
.ta-cell{background:var(--bg);padding:14px}
.ta-cell b{display:block;font-family:var(--font-mono);font-size:1.4rem}
.ta-cell span{font-size:.8rem;color:var(--dim)}
.ta-foot{max-width:1100px;margin:20px auto 0;padding:0 20px;font-family:var(--font-mono);font-size:.7rem;color:var(--dim);line-height:1.7}
@media (prefers-reduced-motion:reduce){.ta-tape-in,.ta-dot{animation:none}}
`;

export default async function DirectionA() {
  const d = await getLabData();
  const tape = d.deals.slice(0, 14);
  return (
    <div className="ta">
      <style>{CSS}</style>
      <header className="ta-top">
        <Link href="/" className="ta-logo">PuffPrice<span>$</span></Link>
        <span className="ta-live"><span className="ta-dot" /> LIVE · CENTRAL IL</span>
      </header>
      <div className="ta-tape" aria-hidden="true">
        <div className="ta-tape-in">
          {[...tape, ...tape].map((x, i) => (
            <span key={i}>{x.store.toUpperCase()} · {x.title}{x.pct != null && <b>▼{x.pct}%</b>}</span>
          ))}
        </div>
      </div>
      <section className="ta-hero">
        <div className="ta-kicker">{d.dateLabel}</div>
        <div className="ta-big">{d.dealCount}</div>
        <div className="ta-sub">deals live right now across Central Illinois. Checked on every store&apos;s own site.</div>
        <div className="ta-stats">
          <div className="ta-stat"><b>{d.storesWithDeals}</b><span>stores discounting</span></div>
          <div className="ta-stat"><b>{d.avgPct != null ? `${d.avgPct}%` : "—"}</b><span>avg. off</span></div>
          <div className="ta-stat"><b>{d.deals[0]?.pct != null ? `${d.deals[0].pct}%` : "—"}</b><span>deepest</span></div>
        </div>
      </section>
      <section className="ta-sec">
        <div className="ta-h"><span>Best discounts · ranked</span><span>no store pays to rank</span></div>
        {d.deals.slice(0, 10).map((x, i) => (
          <Link key={x.id} href={`/dispensary/${x.slug}`} className="ta-row">
            <span className="ta-rank">{String(i + 1).padStart(2, "0")}</span>
            <span><div className="ta-deal">{x.title}</div><div className="ta-store">{x.store} · {x.city}</div></span>
            <span className={`ta-pct${x.pct == null ? " na" : ""}`}>{x.pct != null ? `${x.pct}%` : "deal"}</span>
          </Link>
        ))}
      </section>
      <section className="ta-sec">
        <div className="ta-h"><span>By city</span><span>deals · stores</span></div>
        <div className="ta-grid" style={{ marginTop: 12 }}>
          {d.cities.map((c) => (
            <Link key={c.slug} href={`/city/${c.slug}`} className="ta-cell"><b>{c.deals}</b><span>{c.city} · {c.stores} stores</span></Link>
          ))}
        </div>
      </section>
      <section className="ta-sec">
        <div className="ta-h"><span>Ways to buy</span><span>new in 2026</span></div>
        <div className="ta-grid" style={{ marginTop: 12 }}>
          <Link href="/drive-thru" className="ta-cell"><b>{d.driveThru}</b><span>drive-thrus open (legal since June)</span></Link>
          <Link href="/medical" className="ta-cell"><b>{d.medical}</b><span>medical stores</span></Link>
          <Link href="/ways-to-buy" className="ta-cell"><b>{d.orderAhead}</b><span>order ahead</span></Link>
          <Link href="/open-late" className="ta-cell"><b>{d.latest?.closesLabel.replace("Open until ", "") || "—"}</b><span>latest close tonight</span></Link>
        </div>
      </section>
      <p className="ta-foot">DIRECTION A · THE TICKER — a live price screen. Numbers first, lines instead of boxes, the tape always moving.</p>
      <LabSwitcher current="a" />
    </div>
  );
}
