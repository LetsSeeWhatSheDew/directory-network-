// Direction B — "Local paper": the front page of today's deals. Editorial,
// Midwestern, a real sense of place.
import Link from "next/link";
import { getLabData } from "@/lib/labData";
import LabSwitcher from "../LabSwitcher";

export const revalidate = 900;

const CSS = `
.tb{--paper:#F2EEE4;--ink:#161513;--dim:#6A655B;--rule:#1615131f;--red:#B8321F;--green:#1F4D36;background:var(--paper);color:var(--ink);min-height:100vh;font-family:var(--font-body);padding-bottom:90px}
.tb a{color:inherit;text-decoration:none}
.tb-serif{font-family:"Newsreader",Georgia,serif}
.tb-wrap{max-width:1100px;margin:0 auto;padding:0 20px}
.tb-mast{text-align:center;padding:22px 0 10px;border-bottom:3px double var(--ink)}
.tb-mast h1{font-family:"Newsreader",Georgia,serif;font-weight:800;font-size:clamp(2.4rem,11vw,5.2rem);letter-spacing:-.03em;line-height:.9;margin:0}
.tb-dateline{display:flex;justify-content:space-between;gap:10px;font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;padding:8px 0;border-bottom:1px solid var(--ink);flex-wrap:wrap}
.tb-lead{display:grid;grid-template-columns:1.5fr 1fr;gap:26px;padding:22px 0;border-bottom:1px solid var(--rule)}
@media(max-width:760px){.tb-lead{grid-template-columns:1fr}}
.tb-kick{font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;color:var(--red);font-weight:700}
.tb-head{font-family:"Newsreader",Georgia,serif;font-weight:700;font-size:clamp(2rem,7.5vw,3.6rem);line-height:1.02;letter-spacing:-.02em;margin:8px 0 12px}
.tb-deck{font-family:"Newsreader",Georgia,serif;font-size:1.2rem;line-height:1.45;color:#2d2b27}
.tb-photo{position:relative;border:1px solid var(--ink)}
.tb-photo img{display:block;width:100%;height:240px;object-fit:cover;filter:grayscale(.35) contrast(1.05)}
.tb-cap{font-size:.75rem;color:var(--dim);padding:6px 0;font-style:italic}
.tb-box{border:1px solid var(--ink);padding:14px}
.tb-box h3{font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;margin:0 0 8px}
.tb-num{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--rule);padding:8px 0}
.tb-num b{font-family:"Newsreader",Georgia,serif;font-size:2rem;line-height:1}
.tb-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border-bottom:1px solid var(--rule)}
@media(max-width:760px){.tb-cols{grid-template-columns:1fr}}
.tb-col{padding:18px 16px 18px 0;border-right:1px solid var(--rule)}
.tb-col:last-child{border-right:none}
@media(max-width:760px){.tb-col{border-right:none;border-bottom:1px solid var(--rule);padding-right:0}}
.tb-col h2{font-family:"Newsreader",Georgia,serif;font-size:1.45rem;margin:0 0 8px;line-height:1.1}
.tb-item{padding:8px 0;border-top:1px dotted #16151355}
.tb-item b{font-weight:700}
.tb-item span{display:block;font-size:.82rem;color:var(--dim)}
.tb-pct{font-family:"Newsreader",Georgia,serif;font-weight:800;color:var(--green);font-size:1.15rem}
.tb-notice{background:var(--ink);color:var(--paper);padding:14px;margin-top:10px}
.tb-notice h3{margin:0 0 4px;font-family:"Newsreader",Georgia,serif;font-size:1.2rem}
.tb-foot{font-size:.72rem;color:var(--dim);padding:16px 0;text-transform:uppercase;letter-spacing:.1em}
`;

export default async function DirectionB() {
  const d = await getLabData();
  const top = d.deals[0];
  const rest = d.deals.slice(1, 8);
  return (
    <div className="tb">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,700;0,6..72,800;1,6..72,400&display=swap" />
      <style>{CSS}</style>
      <div className="tb-wrap">
        <header className="tb-mast">
          <h1 data-keep-font>The PuffPrice Daily</h1>
        </header>
        <div className="tb-dateline"><span>{d.dateLabel}</span><span>Central Illinois edition</span><span>{d.dealCount} deals · {d.storeCount} stores</span></div>

        <section className="tb-lead">
          <div>
            <div className="tb-kick">Today&apos;s biggest discount</div>
            {top ? (
              <>
                <h2 className="tb-head">{top.pct != null && !top.title.includes(`${top.pct}%`) ? `${top.store} goes ${top.pct}% off: ${top.title}` : `${top.store}: ${top.title}`}</h2>
                <p className="tb-deck">Checked this morning on {top.store}&apos;s own site in {top.city}. {d.storesWithDeals} Central Illinois stores are running deals today{d.avgPct != null ? `, averaging ${d.avgPct}% off` : ""}.</p>
                <p style={{ marginTop: 12 }}><Link href={`/dispensary/${top.slug}`} style={{ borderBottom: "2px solid var(--red)", fontWeight: 700 }}>Read the full listing →</Link></p>
              </>
            ) : <h2 className="tb-head">A quiet morning for deals</h2>}
            <figure className="tb-photo" style={{ marginTop: 18 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/photography/cities-il-farmland.jpg" alt="Central Illinois farmland" />
            </figure>
            <div className="tb-cap">Central Illinois — nine cities, {d.storeCount} dispensaries, checked every day.</div>
          </div>
          <aside>
            <div className="tb-box">
              <h3>By the numbers</h3>
              <div className="tb-num"><span>Deals live</span><b>{d.dealCount}</b></div>
              <div className="tb-num"><span>Stores discounting</span><b>{d.storesWithDeals}</b></div>
              <div className="tb-num"><span>Average discount</span><b>{d.avgPct != null ? `${d.avgPct}%` : "—"}</b></div>
              <div className="tb-num"><span>Open latest tonight</span><b style={{ fontSize: "1.3rem" }}>{d.latest?.closesLabel.replace("Open until ", "") || "—"}</b></div>
            </div>
            <div className="tb-notice">
              <h3>Notice: drive-thru is legal</h3>
              <div style={{ fontSize: ".9rem", lineHeight: 1.45 }}>Since June 12. No Central Illinois store has opened one yet — <Link href="/drive-thru" style={{ textDecoration: "underline" }}>our tracker</Link> will name the first.</div>
            </div>
            <div className="tb-notice" style={{ background: "var(--green)" }}>
              <h3>Nov 12: delta-8 leaves gas stations</h3>
              <div style={{ fontSize: ".9rem", lineHeight: 1.45 }}><Link href="/illinois-hemp-law" style={{ textDecoration: "underline" }}>What changes and where to buy →</Link></div>
            </div>
          </aside>
        </section>

        <section className="tb-cols">
          <div className="tb-col">
            <h2>Also on sale today</h2>
            {rest.map((x) => (
              <Link key={x.id} href={`/dispensary/${x.slug}`} className="tb-item" style={{ display: "block" }}>
                {x.pct != null && <span className="tb-pct" style={{ display: "inline", color: "var(--green)" }}>{x.pct}% </span>}<b>{x.title}</b>
                <span>{x.store}, {x.city}</span>
              </Link>
            ))}
          </div>
          <div className="tb-col" style={{ paddingLeft: 16 }}>
            <h2>City desk</h2>
            {d.cities.map((c) => (
              <Link key={c.slug} href={`/city/${c.slug}`} className="tb-item" style={{ display: "block" }}>
                <b>{c.city}</b> — {c.deals} {c.deals === 1 ? "deal" : "deals"}
                <span>{c.stores} dispensaries</span>
              </Link>
            ))}
          </div>
          <div className="tb-col" style={{ paddingLeft: 16 }}>
            <h2>Ways to buy</h2>
            <div className="tb-item"><b>{d.medical} stores sell medical</b><span>1% state tax with a card · <Link href="/medical" style={{ textDecoration: "underline" }}>list</Link></span></div>
            <div className="tb-item"><b>{d.orderAhead} let you order ahead</b><span><Link href="/ways-to-buy" style={{ textDecoration: "underline" }}>compare every store</Link></span></div>
            <div className="tb-item"><b>Delivery: not legal yet</b><span><Link href="/illinois-cannabis-delivery" style={{ textDecoration: "underline" }}>where the bills stand</Link></span></div>
            <figure className="tb-photo" style={{ marginTop: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/photography/about-peoria-flag.jpg" alt="Peoria" style={{ height: 150 }} />
            </figure>
          </div>
        </section>
        <p className="tb-foot">Direction B · Local paper — the front page of today&apos;s deals. Checked on each store&apos;s own site · no store pays to rank.</p>
      </div>
      <LabSwitcher current="b" />
    </div>
  );
}
