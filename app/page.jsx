import Link from "next/link";

const CITIES = [
  { name: "Chicago", slug: "chicago", count: 3 },
  { name: "Springfield", slug: "springfield", count: 5 },
  { name: "Champaign", slug: "champaign", count: 2 },
  { name: "Normal", slug: "normal", count: 4 },
  { name: "Naperville", slug: "naperville", count: 2 },
  { name: "Joliet", slug: "joliet", count: 2 },
  { name: "Aurora", slug: "aurora", count: 2 },
  { name: "Schaumburg", slug: "schaumburg", count: 3 },
  { name: "Peoria", slug: "peoria", count: 3 },
  { name: "Rockford", slug: "rockford", count: 1 },
  { name: "Waukegan", slug: "waukegan", count: 2 },
  { name: "Elgin", slug: "elgin", count: 1 },
  { name: "Bloomington", slug: "bloomington", count: 3 },
  { name: "Danville", slug: "danville", count: 2 },
  { name: "Quincy", slug: "quincy", count: 3 },
  { name: "Moline", slug: "moline", count: 2 },
  { name: "Collinsville", slug: "collinsville", count: 1 },
  { name: "Effingham", slug: "effingham", count: 1 },
  ];

const QUICK = [
  { label: "Open now in Chicago", href: "/cannabis/illinois/chicago/open-now" },
  { label: "Open now in Springfield", href: "/cannabis/illinois/springfield/open-now" },
  { label: "Open now in Champaign", href: "/cannabis/illinois/champaign/open-now" },
  { label: "Best dispensaries in Normal", href: "/cannabis/illinois/normal/best" },
  { label: "Deals in Joliet", href: "/cannabis/illinois/joliet/deals" },
  { label: "Near Wrigley Field", href: "/cannabis/illinois/chicago/near-wrigley-field" },
  { label: "Recreational in Naperville", href: "/cannabis/illinois/naperville/recreational" },
  { label: "Best in Schaumburg", href: "/cannabis/illinois/schaumburg/best" },
  ];

export default function HomePage() {
    return (
          <>
                <style>{`
                        *{box-sizing:border-box;margin:0;padding:0}
                                body{font-family:Georgia,serif;background:#f7f6f2;min-height:100vh}
                                        .nav{display:flex;justify-content:space-between;align-items:center;padding:16px 32px;background:#fff;border-bottom:1px solid #e8e5de;position:sticky;top:0;z-index:50}
                                                .logo{display:flex;align-items:center;gap:10px;text-decoration:none}
                                                        .ndot{width:10px;height:10px;border-radius:50%;background:#16a34a;animation:pulse 2s infinite}
                                                                @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
                                                                        .wm{font-size:1.1rem;font-weight:700;color:#0f1f3d;letter-spacing:-.02em}
                                                                                .ac{color:#16a34a}
                                                                                        .nr{display:flex;align-items:center;gap:20px}
                                                                                                .nl{font-size:.85rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}
                                                                                                        .nl:hover{color:#0f1f3d}
                                                                                                                .nc{font-size:.85rem;font-family:system-ui,sans-serif;font-weight:700;color:#16a34a;text-decoration:none;border:1px solid #16a34a;padding:6px 16px;border-radius:8px}
                                                                                                                        .nc:hover{background:#f0fdf4}
                                                                                                                                .hero{background:#0f1f3d;padding:72px 32px;text-align:center}
                                                                                                                                        .hbadge{display:inline-flex;align-items:center;gap:6px;background:rgba(22,163,74,.15);border:1px solid rgba(22,163,74,.3);border-radius:100px;padding:5px 16px;font-size:.75rem;font-family:system-ui,sans-serif;color:#4ade80;font-weight:700;margin-bottom:22px;letter-spacing:.08em;text-transform:uppercase}
                                                                                                                                                .hbd{width:6px;height:6px;border-radius:50%;background:#16a34a;animation:pulse 2s infinite}
                                                                                                                                                        .hero h1{font-size:clamp(2.2rem,5vw,3.4rem);font-weight:700;color:#fff;letter-spacing:-.04em;line-height:1.1;margin-bottom:18px}
                                                                                                                                                                .hero h1 em{color:#4ade80;font-style:normal}
                                                                                                                                                                        .hsub{font-size:1.05rem;color:#94a3b8;font-family:system-ui,sans-serif;line-height:1.7;margin-bottom:36px;max-width:520px;margin-left:auto;margin-right:auto}
                                                                                                                                                                                .hbtns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
                                                                                                                                                                                        .bp{background:#16a34a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.95rem}
                                                                                                                                                                                                .bp:hover{background:#15803d}
                                                                                                                                                                                                        .bs{background:rgba(255,255,255,.1);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.95rem;border:1px solid rgba(255,255,255,.2)}
                                                                                                                                                                                                                .bs:hover{background:rgba(255,255,255,.15)}
                                                                                                                                                                                                                        .hstats{display:flex;justify-content:center;gap:48px;margin-top:48px;padding-top:36px;border-top:1px solid rgba(255,255,255,.1)}
                                                                                                                                                                                                                                .sn{font-size:1.9rem;font-weight:700;color:#fff;letter-spacing:-.03em}
                                                                                                                                                                                                                                        .sl{font-size:.75rem;color:#64748b;font-family:system-ui,sans-serif;margin-top:3px}
                                                                                                                                                                                                                                                .sec{max-width:1100px;margin:0 auto;padding:56px 24px}
                                                                                                                                                                                                                                                        .slbl{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:8px}
                                                                                                                                                                                                                                                                .stit{font-size:clamp(1.4rem,3vw,1.9rem);font-weight:700;color:#0f1f3d;letter-spacing:-.03em;margin-bottom:6px}
                                                                                                                                                                                                                                                                        .ssub{font-size:.875rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:28px}
                                                                                                                                                                                                                                                                                .qgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
                                                                                                                                                                                                                                                                                        .qlink{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #e8e5de;border-radius:10px;padding:13px 16px;text-decoration:none;font-family:system-ui,sans-serif;font-size:.875rem;color:#0f1f3d;font-weight:600}
                                                                                                                                                                                                                                                                                                .qlink:hover{border-color:#16a34a;color:#16a34a}
                                                                                                                                                                                                                                                                                                        .qa{color:#16a34a}
                                                                                                                                                                                                                                                                                                                .why{background:#fff;border-top:1px solid #e8e5de;border-bottom:1px solid #e8e5de}
                                                                                                                                                                                                                                                                                                                        .wi{max-width:1100px;margin:0 auto;padding:48px 24px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
                                                                                                                                                                                                                                                                                                                                .wico{font-size:1.5rem;margin-bottom:12px}
                                                                                                                                                                                                                                                                                                                                        .wt{font-size:.95rem;font-weight:700;color:#0f1f3d;margin-bottom:6px}
                                                                                                                                                                                                                                                                                                                                                .wd{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.6}
                                                                                                                                                                                                                                                                                                                                                        .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:12px}
                                                                                                                                                                                                                                                                                                                                                                .ccard{display:block;background:#fff;border:1px solid #e8e5de;border-radius:12px;padding:18px;text-decoration:none}
                                                                                                                                                                                                                                                                                                                                                                        .ccard:hover{border-color:#16a34a}
                                                                                                                                                                                                                                                                                                                                                                                .ccard:hover .cn{color:#16a34a}
                                                                                                                                                                                                                                                                                                                                                                                        .cn{font-size:.95rem;font-weight:700;color:#0f1f3d;margin-bottom:3px}
                                                                                                                                                                                                                                                                                                                                                                                                .cc{font-size:.75rem;color:#9ca3af;font-family:system-ui,sans-serif}
                                                                                                                                                                                                                                                                                                                                                                                                        .cpills{display:flex;gap:5px;margin-top:10px;flex-wrap:wrap}
                                                                                                                                                                                                                                                                                                                                                                                                                .cp{font-size:.68rem;font-family:system-ui,sans-serif;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:100px;padding:2px 9px;text-decoration:none}
                                                                                                                                                                                                                                                                                                                                                                                                                        .cp:hover{background:#dcfce7}
                                                                                                                                                                                                                                                                                                                                                                                                                                .ba{display:inline-flex;align-items:center;gap:8px;margin-top:24px;font-family:system-ui,sans-serif;font-size:.875rem;font-weight:700;color:#16a34a;text-decoration:none;border:1px solid #16a34a;padding:10px 20px;border-radius:8px}
                                                                                                                                                                                                                                                                                                                                                                                                                                        .ba:hover{background:#f0fdf4}
                                                                                                                                                                                                                                                                                                                                                                                                                                                .bstrip{background:#0f1f3d;padding:52px 32px;text-align:center}
                                                                                                                                                                                                                                                                                                                                                                                                                                                        .bt{font-size:1.4rem;font-weight:700;color:#fff;letter-spacing:-.02em;margin-bottom:8px}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                .bsub{font-size:.875rem;color:#94a3b8;font-family:system-ui,sans-serif;margin-bottom:24px}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .bbtns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                .bb{background:#16a34a;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.875rem}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .bb:hover{background:#15803d}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                .bbs{background:transparent;color:#94a3b8;padding:11px 24px;border-radius:8px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.875rem;border:1px solid rgba(255,255,255,.15)}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .bbs:hover{border-color:rgba(255,255,255,.3)}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                .ft{background:#0f1f3d;border-top:1px solid rgba(255,255,255,.08);padding:24px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .flo{font-size:.95rem;font-weight:700;color:#fff;font-family:Georgia,serif}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                .fls{display:flex;gap:20px}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .fl{font-size:.78rem;color:#475569;font-family:system-ui,sans-serif;text-decoration:none}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                .fl:hover{color:#94a3b8}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .fc{font-size:.75rem;color:#334155;font-family:system-ui,sans-serif}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @media(max-width:768px){
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          .nav,.ft{padding:14px 20px}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    .hero{padding:48px 20px}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              .hstats{gap:28px}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .wi{grid-template-columns:1fr}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  .nr .nl{display:none}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            .sec{padding:40px 16px}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `}</style>
          
                <nav className="nav">
                        <Link href="/" className="logo">
                                  <span className="ndot" />
                                  <span className="wm">Directory<span className="ac">Network</span></span>
                        </Link>
                        <div className="nr">
                                  <Link href="/cannabis/illinois" className="nl">Browse Illinois</Link>
                                  <Link href="/cannabis/illinois/open-now" className="nl">Open Now</Link>
                                  <Link href="/get-listed" className="nc">List your business</Link>
                        </div>
                </nav>
          
                <div className="hero">
                        <div className="hbadge"><span className="hbd" />Illinois Cannabis Directory</div>
                        <h1>Find a dispensary<br /><em>open right now</em></h1>
                        <p className="hsub">Real hours, verified listings, and directions to licensed cannabis dispensaries across Illinois. Free, always.</p>
                        <div className="hbtns">
                                  <Link href="/cannabis/illinois/open-now" className="bp">See who&apos;s open now &rarr;</Link>
                                  <Link href="/cannabis/illinois" className="bs">Browse all cities</Link>
                        </div>
                        <div className="hstats">
                                  <div><div className="sn">50+</div><div className="sl">Licensed dispensaries</div></div>
                                  <div><div className="sn">34</div><div className="sl">Illinois cities</div></div>
                                  <div><div className="sn">Free</div><div className="sl">Always, for consumers</div></div>
                        </div>
                </div>
          
                <div className="sec">
                        <p className="slbl">Quick access</p>
                        <h2 className="stit">What are you looking for?</h2>
                        <p className="ssub">Jump straight to what you need</p>
                        <div className="qgrid">
                          {QUICK.map(q => (
                        <Link key={q.href} href={q.href} className="qlink">
                          {q.label}<span className="qa">&rarr;</span>
                        </Link>
                      ))}
                        </div>
                </div>
          
                <div className="why">
                        <div className="wi">
                                  <div><div className="wico">🕐</div><p className="wt">Real-time hours</p><p className="wd">Every listing shows current open/closed status based on verified business hours. No more calling ahead.</p></div>
                                  <div><div className="wico">✓</div><p className="wt">Licensed only</p><p className="wd">Every dispensary on Directory Network is a state-licensed Illinois cannabis retailer. No unlicensed operators.</p></div>
                                  <div><div className="wico">$0</div><p className="wt">Free for consumers</p><p className="wd">No subscriptions, no paywalls, no ads. This directory is free for anyone searching for cannabis in Illinois.</p></div>
                        </div>
                </div>
          
                <div className="sec">
                        <p className="slbl">Browse by city</p>
                        <h2 className="stit">Dispensaries near you</h2>
                        <p className="ssub">Select a city to see all licensed dispensaries, hours, and directions</p>
                        <div className="cgrid">
                          {CITIES.map(city => (
                        <Link key={city.slug} href={`/cannabis/illinois/${city.slug}`} className="ccard">
                                      <p className="cn">{city.name}</p>
                                      <p className="cc">{city.count} dispensar{city.count === 1 ? "y" : "ies"}</p>
                                      <div className="cpills">
                                                      <Link href={`/cannabis/illinois/${city.slug}/open-now`} className="cp">Open now</Link>
                                                      <Link href={`/cannabis/illinois/${city.slug}/best`} className="cp">Best</Link>
                                                      <Link href={`/cannabis/illinois/${city.slug}/deals`} className="cp">Deals</Link>
                                      </div>
                        </Link>
                      ))}
                        </div>
                        <Link href="/cannabis/illinois" className="ba">View all Illinois cities &rarr;</Link>
                </div>
          
                <div className="bstrip">
                        <p className="bt">Own a dispensary?</p>
                        <p className="bsub">Your listing is probably already live. Claim it free and keep your hours accurate.</p>
                        <div className="bbtns">
                                  <Link href="/get-listed" className="bb">Claim your listing &rarr;</Link>
                                  <Link href="/cannabis/illinois" className="bbs">Find your listing first</Link>
                        </div>
                </div>
          
                <footer className="ft">
                        <span className="flo">Directory<span style={{color:"#16a34a"}}>Network</span></span>
                        <div className="fls">
                                  <Link href="/cannabis/illinois" className="fl">Illinois</Link>
                                  <Link href="/cannabis/illinois/first-time-guide" className="fl">First-time guide</Link>
                                  <Link href="/cannabis/illinois/laws" className="fl">IL cannabis laws</Link>
                                  <Link href="/get-listed" className="fl">List your business</Link>
                        </div>
                        <span className="fc">&copy; {new Date().getFullYear()} Directory Network</span>
                </footer>
    </>
  );
}