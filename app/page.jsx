import Link from "next/link";

// ============================================================
// NEW CLEANLIST HOMEPAGE
// The pivot: from directory to decision engine
//
// Design philosophy:
// - One question answered: "Where should I go right now?"
// - Deals are the hook, savings are the emotion
// - Mobile-first — this is a phone behavior
// - Dark navy + green = authority + cannabis without cliché
// - Georgia serif = trustworthy local guide, not tech startup
// ============================================================

const CATEGORIES = [
  { label: "Flower", slug: "flower", emoji: "🌿" },
  { label: "Edibles", slug: "edibles", emoji: "🍬" },
  { label: "Vapes", slug: "vapes", emoji: "💨" },
  { label: "Concentrates", slug: "concentrate", emoji: "💎" },
  { label: "All deals", slug: "all", emoji: "🔥" },
];

const QUICK_FILTERS = [
  { label: "Open now", param: "open=true" },
  { label: "Drive-thru", param: "drivethu=true" },
  { label: "Cards accepted", param: "credit=true" },
  { label: "Best rated", param: "sort=rated" },
];

const CITIES = [
  { name: "Chicago", slug: "chicago" },
  { name: "Peoria", slug: "peoria" },
  { name: "Springfield", slug: "springfield" },
  { name: "Champaign", slug: "champaign" },
  { name: "Normal", slug: "normal" },
  { name: "Naperville", slug: "naperville" },
  { name: "Joliet", slug: "joliet" },
  { name: "Rockford", slug: "rockford" },
  { name: "Waukegan", slug: "waukegan" },
  { name: "Elgin", slug: "elgin" },
  { name: "Schaumburg", slug: "schaumburg" },
  { name: "Aurora", slug: "aurora" },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:Georgia,serif;background:#f5f4f0;min-height:100vh;color:#0f1f3d}

        /* NAV */
        .nav{
          display:flex;justify-content:space-between;align-items:center;
          padding:14px 28px;background:#0f1f3d;
          position:sticky;top:0;z-index:100;
        }
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.9)}}
        .logo-text{font-size:1.15rem;font-weight:700;color:#fff;letter-spacing:-.02em}
        .logo-text span{color:#4ade80}
        .nav-links{display:flex;align-items:center;gap:20px}
        .nav-link{font-size:.82rem;color:rgba(255,255,255,.6);text-decoration:none;font-family:system-ui,sans-serif}
        .nav-link:hover{color:#fff}
        .nav-cta{
          font-size:.82rem;font-family:system-ui,sans-serif;font-weight:600;
          color:#0f1f3d;background:#4ade80;padding:6px 14px;border-radius:6px;
          text-decoration:none;
        }
        .nav-cta:hover{background:#22c55e}

        /* HERO */
        .hero{
          background:#0f1f3d;
          padding:56px 28px 48px;
          text-align:center;
        }
        .hero-badge{
          display:inline-flex;align-items:center;gap:6px;
          background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.25);
          border-radius:100px;padding:4px 14px;
          font-size:.72rem;font-family:system-ui,sans-serif;
          color:#4ade80;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
          margin-bottom:20px;
        }
        .hero-badge-dot{width:5px;height:5px;border-radius:50%;background:#4ade80;animation:pulse 2s infinite}
        .hero h1{
          font-size:clamp(2rem,5vw,3.2rem);
          font-weight:700;color:#fff;
          letter-spacing:-.04em;line-height:1.1;
          margin-bottom:12px;
        }
        .hero h1 em{color:#4ade80;font-style:normal}
        .hero-sub{
          font-size:1rem;color:rgba(255,255,255,.55);
          font-family:system-ui,sans-serif;
          line-height:1.6;margin-bottom:36px;
          max-width:480px;margin-left:auto;margin-right:auto;
        }

        /* CATEGORY BUTTONS — the main decision input */
        .category-grid{
          display:flex;flex-wrap:wrap;justify-content:center;
          gap:10px;margin-bottom:16px;
          max-width:560px;margin-left:auto;margin-right:auto;
        }
        .cat-btn{
          display:flex;align-items:center;gap:7px;
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.15);
          border-radius:10px;padding:12px 20px;
          font-size:.88rem;font-family:system-ui,sans-serif;font-weight:600;
          color:#fff;cursor:pointer;text-decoration:none;
          transition:all .15s;
        }
        .cat-btn:hover{background:rgba(74,222,128,.15);border-color:rgba(74,222,128,.4)}
        .cat-btn.primary{
          background:#16a34a;border-color:#16a34a;
          font-size:.95rem;padding:14px 28px;
        }
        .cat-btn.primary:hover{background:#15803d}
        .cat-emoji{font-size:16px}

        /* QUICK FILTERS */
        .filter-row{
          display:flex;flex-wrap:wrap;justify-content:center;gap:8px;
          margin-top:12px;max-width:480px;
          margin-left:auto;margin-right:auto;
        }
        .filter-pill{
          font-size:.75rem;font-family:system-ui,sans-serif;font-weight:500;
          color:rgba(255,255,255,.5);
          background:transparent;border:1px solid rgba(255,255,255,.15);
          border-radius:100px;padding:4px 12px;
          cursor:pointer;text-decoration:none;
        }
        .filter-pill:hover{color:#fff;border-color:rgba(255,255,255,.4)}

        /* HOW IT WORKS — 3 steps, editorial layout */
        .how{background:#fff;border-top:1px solid #e8e4da;border-bottom:1px solid #e8e4da}
        .how-inner{
          max-width:900px;margin:0 auto;
          padding:52px 28px;
          display:grid;grid-template-columns:repeat(3,1fr);gap:40px;
        }
        .how-step{}
        .how-num{
          font-size:2.4rem;font-weight:700;color:#e8e4da;
          line-height:1;margin-bottom:10px;
        }
        .how-title{font-size:.95rem;font-weight:700;color:#0f1f3d;margin-bottom:6px}
        .how-desc{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.6}

        /* DEALS SECTION */
        .deals-section{max-width:1100px;margin:0 auto;padding:52px 28px}
        .section-eyebrow{
          font-size:.7rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:#16a34a;
          font-family:system-ui,sans-serif;margin-bottom:6px;
        }
        .section-title{
          font-size:clamp(1.4rem,3vw,1.8rem);font-weight:700;
          color:#0f1f3d;letter-spacing:-.03em;margin-bottom:4px;
        }
        .section-sub{
          font-size:.875rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:28px;
        }

        /* DEAL CARDS */
        .deal-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .deal-card{
          background:#fff;border:1px solid #e8e4da;border-radius:14px;
          padding:18px;position:relative;
          transition:border-color .15s;
        }
        .deal-card:hover{border-color:#16a34a}
        .deal-card.top-pick{
          border:2px solid #16a34a;
          background:linear-gradient(135deg,#f0fdf4 0%,#fff 60%);
        }
        .top-pick-badge{
          position:absolute;top:-10px;left:16px;
          background:#16a34a;color:#fff;
          font-size:.68rem;font-family:system-ui,sans-serif;
          font-weight:700;letter-spacing:.08em;text-transform:uppercase;
          padding:3px 10px;border-radius:100px;
        }
        .deal-card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
        .deal-name{font-size:.95rem;font-weight:700;color:#0f1f3d}
        .deal-city{font-size:.75rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px}
        .open-badge{
          font-size:.68rem;font-weight:600;
          padding:2px 8px;border-radius:100px;
          font-family:system-ui,sans-serif;
          white-space:nowrap;
        }
        .open-badge.open{color:#166534;background:#dcfce7}
        .open-badge.closed{color:#991b1b;background:#fee2e2}
        .deal-highlight{
          font-size:.95rem;font-weight:700;color:#16a34a;
          margin-bottom:6px;
        }
        .deal-reason{
          font-size:.78rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:12px;
          line-height:1.5;
        }
        .deal-attrs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px}
        .deal-attr{
          font-size:.68rem;color:#6b7280;
          background:#f5f4f0;border-radius:100px;
          padding:2px 9px;font-family:system-ui,sans-serif;
        }
        .deal-savings{
          display:flex;align-items:center;justify-content:space-between;
          background:#f0fdf4;border-radius:8px;
          padding:8px 12px;
        }
        .savings-label{font-size:.75rem;color:#166534;font-family:system-ui,sans-serif}
        .savings-num{font-size:1.1rem;font-weight:700;color:#16a34a}

        /* CITY BROWSE */
        .cities-section{
          background:#0f1f3d;padding:52px 28px;
        }
        .cities-inner{max-width:1100px;margin:0 auto}
        .cities-title{
          font-size:1.5rem;font-weight:700;color:#fff;
          letter-spacing:-.03em;margin-bottom:4px;
        }
        .cities-sub{
          font-size:.875rem;color:rgba(255,255,255,.4);
          font-family:system-ui,sans-serif;margin-bottom:24px;
        }
        .city-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
          gap:10px;
        }
        .city-card{
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.1);
          border-radius:10px;padding:14px;
          text-decoration:none;
          transition:all .15s;
        }
        .city-card:hover{background:rgba(74,222,128,.1);border-color:rgba(74,222,128,.3)}
        .city-name{font-size:.9rem;font-weight:700;color:#fff;margin-bottom:8px}
        .city-pills{display:flex;gap:4px;flex-wrap:wrap}
        .city-pill{
          font-size:.62rem;color:#4ade80;
          background:rgba(74,222,128,.1);
          border:1px solid rgba(74,222,128,.2);
          border-radius:100px;padding:2px 7px;
          font-family:system-ui,sans-serif;text-decoration:none;
        }
        .city-pill:hover{background:rgba(74,222,128,.2)}

        /* DISPENSARY CTA */
        .biz-strip{
          background:#f5f4f0;border-top:1px solid #e8e4da;
          padding:44px 28px;text-align:center;
        }
        .biz-title{
          font-size:1.25rem;font-weight:700;color:#0f1f3d;
          letter-spacing:-.02em;margin-bottom:6px;
        }
        .biz-sub{
          font-size:.875rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:20px;
          max-width:400px;margin-left:auto;margin-right:auto;
        }
        .biz-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .biz-btn-primary{
          background:#0f1f3d;color:#fff;
          padding:10px 22px;border-radius:8px;
          text-decoration:none;font-family:system-ui,sans-serif;
          font-weight:700;font-size:.875rem;
        }
        .biz-btn-primary:hover{background:#1e3a5f}
        .biz-btn-secondary{
          background:transparent;color:#6b7280;
          padding:10px 22px;border-radius:8px;
          text-decoration:none;font-family:system-ui,sans-serif;
          font-weight:600;font-size:.875rem;
          border:1px solid #d1cfc6;
        }
        .biz-btn-secondary:hover{border-color:#9ca3af;color:#374151}

        /* FOOTER */
        .footer{
          background:#0f1f3d;border-top:1px solid rgba(255,255,255,.07);
          padding:20px 28px;
          display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:12px;
        }
        .footer-logo{font-size:.9rem;font-weight:700;color:#fff}
        .footer-logo span{color:#4ade80}
        .footer-links{display:flex;gap:18px}
        .footer-link{font-size:.75rem;color:#475569;font-family:system-ui,sans-serif;text-decoration:none}
        .footer-link:hover{color:#94a3b8}
        .footer-copy{font-size:.72rem;color:#334155;font-family:system-ui,sans-serif}

        /* RESPONSIVE */
        @media(max-width:768px){
          .nav{padding:12px 16px}
          .hero{padding:40px 16px 36px}
          .how-inner{grid-template-columns:1fr;gap:24px;padding:36px 16px}
          .deals-section{padding:36px 16px}
          .cities-section{padding:36px 16px}
          .footer{padding:16px;flex-direction:column;text-align:center}
          .footer-links{justify-content:center}
          .nav-links .nav-link{display:none}
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="logo">
          <span className="logo-dot" />
          <span className="logo-text">clean<span>list</span></span>
        </Link>
        <div className="nav-links">
          <Link href="/cannabis/illinois/open-now" className="nav-link">Open now</Link>
          <Link href="/cannabis/illinois" className="nav-link">Browse Illinois</Link>
          <Link href="/upgrade" className="nav-cta">For dispensaries</Link>
        </div>
      </nav>

      {/* HERO — decision engine entry point */}
      <div className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Illinois dispensary deals — live
        </div>
        <h1>Best deal on weed<br /><em>near you right now</em></h1>
        <p className="hero-sub">
          Tell us what you want. We find the cheapest price, the best discount,
          and the fastest option near you.
        </p>

        {/* CATEGORY SELECTION — the one input */}
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/deals/${cat.slug}`}
              className={`cat-btn ${cat.slug === 'all' ? 'primary' : ''}`}
            >
              <span className="cat-emoji">{cat.emoji}</span>
              {cat.label}
            </Link>
          ))}
        </div>

        {/* QUICK FILTERS */}
        <div className="filter-row">
          {QUICK_FILTERS.map(f => (
            <Link
              key={f.param}
              href={`/deals/all?${f.param}`}
              className="filter-pill"
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="how">
        <div className="how-inner">
          <div className="how-step">
            <div className="how-num">01</div>
            <div className="how-title">Pick what you want</div>
            <div className="how-desc">
              Flower, edibles, vapes, or concentrates.
              We pull every active deal within range.
            </div>
          </div>
          <div className="how-step">
            <div className="how-num">02</div>
            <div className="how-title">We do the math</div>
            <div className="how-desc">
              Price per gram, discount percentage, distance,
              open status — normalized so you don&apos;t have to.
            </div>
          </div>
          <div className="how-step">
            <div className="how-num">03</div>
            <div className="how-title">You save money</div>
            <div className="how-desc">
              One recommendation. Where to go right now
              for the best value. You see exactly how much you save.
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S DEALS — populated from DB once deals data exists */}
      <div className="deals-section">
        <p className="section-eyebrow">Live deals</p>
        <h2 className="section-title">Best deals in Illinois today</h2>
        <p className="section-sub">Updated continuously · Verified against dispensary sites</p>

        <div className="deal-cards">

          {/* TOP PICK card — will be dynamic, hardcoded for now */}
          <div className="deal-card top-pick">
            <div className="top-pick-badge">Best value today</div>
            <div className="deal-card-header">
              <div>
                <div className="deal-name">NOXX East Peoria</div>
                <div className="deal-city">East Peoria, IL</div>
              </div>
              <span className="open-badge open">Open</span>
            </div>
            <div className="deal-highlight">30% off all vapes</div>
            <div className="deal-reason">Cheapest vape deal within 15 miles · 4 min away</div>
            <div className="deal-attrs">
              <span className="deal-attr">Drive-thru</span>
              <span className="deal-attr">Cards OK</span>
              <span className="deal-attr">4.7 ★</span>
            </div>
            <div className="deal-savings">
              <span className="savings-label">You save vs avg price</span>
              <span className="savings-num">~$18</span>
            </div>
          </div>

          {/* Alternative cards */}
          <div className="deal-card">
            <div className="deal-card-header">
              <div>
                <div className="deal-name">Ivy Hall Peoria</div>
                <div className="deal-city">Peoria, IL</div>
              </div>
              <span className="open-badge open">Open</span>
            </div>
            <div className="deal-highlight">$5 pre-rolls Mon–Wed</div>
            <div className="deal-reason">Weekly recurring deal · 9 min away</div>
            <div className="deal-attrs">
              <span className="deal-attr">Cards OK</span>
              <span className="deal-attr">4.5 ★</span>
            </div>
            <div className="deal-savings">
              <span className="savings-label">You save vs avg price</span>
              <span className="savings-num">~$12</span>
            </div>
          </div>

          <div className="deal-card">
            <div className="deal-card-header">
              <div>
                <div className="deal-name">Terrace Cannabis</div>
                <div className="deal-city">Moline, IL</div>
              </div>
              <span className="open-badge open">Open</span>
            </div>
            <div className="deal-highlight">20% off all flower today</div>
            <div className="deal-reason">Highest rated in IL · 4.9 ★ · 4,200+ reviews</div>
            <div className="deal-attrs">
              <span className="deal-attr">Drive-thru</span>
              <span className="deal-attr">4.9 ★</span>
            </div>
            <div className="deal-savings">
              <span className="savings-label">You save vs avg price</span>
              <span className="savings-num">~$10</span>
            </div>
          </div>

        </div>
      </div>

      {/* CITY BROWSE */}
      <div className="cities-section">
        <div className="cities-inner">
          <div className="cities-title">Browse by city</div>
          <div className="cities-sub">Find deals near you across Illinois</div>
          <div className="city-grid">
            {CITIES.map(city => (
              <Link
                key={city.slug}
                href={`/cannabis/illinois/${city.slug}`}
                className="city-card"
              >
                <div className="city-name">{city.name}</div>
                <div className="city-pills">
                  <Link href={`/cannabis/illinois/${city.slug}/deals`} className="city-pill">Deals</Link>
                  <Link href={`/cannabis/illinois/${city.slug}/open-now`} className="city-pill">Open now</Link>
                  <Link href={`/cannabis/illinois/${city.slug}/best`} className="city-pill">Best</Link>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* DISPENSARY CTA — pushed to bottom where it belongs */}
      <div className="biz-strip">
        <div className="biz-title">Own a dispensary?</div>
        <p className="biz-sub">
          Get your daily deals in front of people actively looking to buy right now.
          Featured placement from $49/month.
        </p>
        <div className="biz-btns">
          <Link href="/upgrade" className="biz-btn-primary">Submit your deals →</Link>
          <Link href="/get-listed" className="biz-btn-secondary">Claim free listing</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span className="footer-logo">clean<span>list</span></span>
        <div className="footer-links">
          <Link href="/cannabis/illinois" className="footer-link">Illinois</Link>
          <Link href="/cannabis/illinois/first-time-guide" className="footer-link">First-time guide</Link>
          <Link href="/cannabis/illinois/laws" className="footer-link">IL laws</Link>
          <Link href="/upgrade" className="footer-link">For dispensaries</Link>
        </div>
        <span className="footer-copy">© {new Date().getFullYear()} CleanList</span>
      </footer>
    </>
  );
}
