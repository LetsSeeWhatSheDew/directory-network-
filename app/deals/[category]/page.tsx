// app/deals/[category]/page.tsx
// ============================================================
// THE DECISION ENGINE PAGE
// This is the core product — not a list, a recommendation
//
// URL: /deals/flower, /deals/edibles, /deals/vapes, /deals/all
// User arrives here after clicking a category on the homepage
// They get ONE top recommendation + 2-3 alternatives
// ============================================================

import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Props = {
  params: { category: string };
  searchParams: {
    city?: string;
    open?: string;
    drivethu?: string;
    credit?: string;
    sort?: string;
  };
};

// Fetch deals from Supabase view
async function getDeals(category: string, city?: string) {
  const params = new URLSearchParams({
    select: "*",
    project_tag: "eq.green",
    order: "price_per_gram.asc.nullslast",
    limit: "10",
  });

  if (category !== "all") {
    params.set("category", `eq.${category}`);
  }
  if (city) {
    params.set("city", `ilike.${city}`);
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/active_deals_with_listings?${params}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) return [];
  return res.json();
}

const CATEGORY_LABELS: Record<string, string> = {
  flower: "Flower",
  edibles: "Edibles",
  vapes: "Vapes",
  concentrate: "Concentrates",
  all: "All deals",
};

const CATEGORY_CONTEXT: Record<string, string> = {
  flower: "Best price per gram on flower near you",
  edibles: "Cheapest edibles deals near you today",
  vapes: "Best vape deals and discounts near you",
  concentrate: "Top concentrate deals near you",
  all: "Best cannabis deals near you right now",
};

export default async function DealsPage({ params, searchParams }: Props) {
  const { category } = params;
  const city = searchParams.city;
  const deals = await getDeals(category, city);

  const categoryLabel = CATEGORY_LABELS[category] || "Deals";
  const contextLabel = CATEGORY_CONTEXT[category] || "Best deals near you";

  const topDeal = deals[0] || null;
  const alternatives = deals.slice(1, 4);

  // Calculate average sale price for "you save vs average" stat
  const prices = deals
    .filter((d: any) => d.sale_price)
    .map((d: any) => d.sale_price);
  const avgPrice =
    prices.length > 0
      ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length)
      : null;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}

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
        .back-link{font-size:.82rem;color:rgba(255,255,255,.5);text-decoration:none;font-family:system-ui,sans-serif}
        .back-link:hover{color:#fff}

        .page{max-width:800px;margin:0 auto;padding:40px 20px}

        .page-header{margin-bottom:32px}
        .category-tag{
          display:inline-block;
          font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
          color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:8px;
        }
        .page-title{
          font-size:clamp(1.6rem,4vw,2.4rem);
          font-weight:700;color:#0f1f3d;
          letter-spacing:-.04em;line-height:1.1;margin-bottom:6px;
        }
        .page-sub{font-size:.9rem;color:#6b7280;font-family:system-ui,sans-serif}

        /* TOP PICK */
        .top-pick-wrap{position:relative;margin-bottom:24px}
        .top-pick-label{
          font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
          color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:10px;
        }
        .top-card{
          background:#fff;border:2px solid #16a34a;border-radius:16px;
          padding:24px;position:relative;overflow:hidden;
        }
        .top-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg,#16a34a,#4ade80);
        }

        .verdict-badge{
          display:inline-flex;align-items:center;gap:6px;
          background:#f0fdf4;border:1px solid #bbf7d0;border-radius:100px;
          padding:4px 12px;margin-bottom:16px;
          font-size:.72rem;font-family:system-ui,sans-serif;
          font-weight:600;color:#166534;
        }
        .verdict-dot{width:5px;height:5px;border-radius:50%;background:#16a34a}

        .card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
        .dispensary-name{font-size:1.2rem;font-weight:700;color:#0f1f3d}
        .dispensary-city{font-size:.82rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px}
        .open-pill{
          font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:100px;
          font-family:system-ui,sans-serif;white-space:nowrap;
        }
        .open-pill.open{color:#166534;background:#dcfce7}
        .open-pill.closed{color:#991b1b;background:#fee2e2}

        .deal-title{font-size:1.4rem;font-weight:700;color:#16a34a;margin-bottom:6px}
        .deal-reason{font-size:.875rem;color:#374151;font-family:system-ui,sans-serif;margin-bottom:16px;line-height:1.5}

        .attrs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
        .attr{
          font-size:.72rem;color:#6b7280;background:#f5f4f0;
          border-radius:100px;padding:3px 10px;
          font-family:system-ui,sans-serif;
        }

        .savings-bar{
          background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
          padding:14px 16px;display:flex;justify-content:space-between;align-items:center;
          margin-bottom:16px;
        }
        .savings-left{}
        .savings-label{font-size:.82rem;color:#166534;font-family:system-ui,sans-serif;font-weight:600}
        .savings-sublabel{font-size:.72rem;color:#4ade80;font-family:system-ui,sans-serif;margin-top:2px}
        .savings-amount{font-size:2rem;font-weight:700;color:#16a34a}

        .card-cta{
          display:block;text-align:center;
          background:#0f1f3d;color:#fff;
          padding:12px;border-radius:10px;
          text-decoration:none;font-family:system-ui,sans-serif;
          font-weight:700;font-size:.9rem;
        }
        .card-cta:hover{background:#1e3a5f}

        /* ALTERNATIVES */
        .alt-label{
          font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
          color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:12px;
        }
        .alt-cards{display:flex;flex-direction:column;gap:10px;margin-bottom:36px}
        .alt-card{
          background:#fff;border:1px solid #e8e4da;border-radius:12px;
          padding:16px;display:flex;justify-content:space-between;align-items:center;
          text-decoration:none;transition:border-color .15s;
        }
        .alt-card:hover{border-color:#16a34a}
        .alt-left{}
        .alt-name{font-size:.9rem;font-weight:700;color:#0f1f3d}
        .alt-deal{font-size:.82rem;color:#16a34a;font-family:system-ui,sans-serif;margin-top:2px}
        .alt-attrs{display:flex;gap:5px;margin-top:6px}
        .alt-attr{font-size:.65rem;color:#9ca3af;font-family:system-ui,sans-serif}
        .alt-right{text-align:right}
        .alt-savings{font-size:1.1rem;font-weight:700;color:#16a34a}
        .alt-savings-label{font-size:.7rem;color:#9ca3af;font-family:system-ui,sans-serif}

        /* NO DEALS STATE */
        .no-deals{
          text-align:center;padding:60px 20px;
          background:#fff;border-radius:16px;border:1px solid #e8e4da;
        }
        .no-deals-title{font-size:1.2rem;font-weight:700;color:#0f1f3d;margin-bottom:8px}
        .no-deals-sub{font-size:.875rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:20px}
        .no-deals-link{
          display:inline-block;background:#0f1f3d;color:#fff;
          padding:10px 20px;border-radius:8px;text-decoration:none;
          font-family:system-ui,sans-serif;font-weight:700;font-size:.875rem;
        }

        /* CATEGORY SWITCHER */
        .cat-switch{
          background:#fff;border:1px solid #e8e4da;border-radius:12px;
          padding:16px;margin-bottom:24px;
        }
        .cat-switch-label{
          font-size:.72rem;color:#9ca3af;font-family:system-ui,sans-serif;
          margin-bottom:10px;
        }
        .cat-switch-pills{display:flex;gap:8px;flex-wrap:wrap}
        .cat-pill{
          font-size:.8rem;font-family:system-ui,sans-serif;font-weight:500;
          padding:6px 14px;border-radius:100px;text-decoration:none;
          border:1px solid #e8e4da;color:#6b7280;
        }
        .cat-pill.active{background:#0f1f3d;color:#fff;border-color:#0f1f3d}
        .cat-pill:hover:not(.active){border-color:#9ca3af;color:#374151}

        @media(max-width:600px){
          .page{padding:24px 14px}
          .nav{padding:12px 16px}
        }
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">
          <span className="logo-dot" />
          <span className="logo-text">clean<span>list</span></span>
        </Link>
        <Link href="/" className="back-link">← Back</Link>
      </nav>

      <div className="page">

        {/* Page header */}
        <div className="page-header">
          <div className="category-tag">{categoryLabel}</div>
          <h1 className="page-title">{contextLabel}</h1>
          <p className="page-sub">
            {deals.length > 0
              ? `${deals.length} active deals found${city ? ` in ${city}` : " in Illinois"}`
              : "Checking dispensary sites for active deals..."}
          </p>
        </div>

        {/* Category switcher */}
        <div className="cat-switch">
          <div className="cat-switch-label">Switch category</div>
          <div className="cat-switch-pills">
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <Link
                key={slug}
                href={`/deals/${slug}${city ? `?city=${city}` : ""}`}
                className={`cat-pill ${slug === category ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {topDeal ? (
          <>
            {/* TOP PICK */}
            <div className="top-pick-wrap">
              <div className="top-pick-label">Our recommendation</div>
              <div className="top-card">
                <div className="verdict-badge">
                  <span className="verdict-dot" />
                  Best value right now
                </div>

                <div className="card-top">
                  <div>
                    <div className="dispensary-name">{topDeal.name || "Dispensary"}</div>
                    <div className="dispensary-city">{topDeal.city}, IL</div>
                  </div>
                  <span className="open-pill open">Open now</span>
                </div>

                <div className="deal-title">
                  {topDeal.deal_title || `${topDeal.discount_value || ""}% off ${topDeal.category || "products"}`}
                </div>
                <div className="deal-reason">
                  {topDeal.price_per_gram
                    ? `$${topDeal.price_per_gram.toFixed(2)}/gram · cheapest in the area`
                    : "Best available deal near you right now"}
                </div>

                <div className="attrs">
                  {topDeal.accepts_credit && <span className="attr">Cards OK</span>}
                  {topDeal.drive_thru && <span className="attr">Drive-thru</span>}
                  {topDeal.google_rating && <span className="attr">{topDeal.google_rating} ★</span>}
                  {topDeal.delivery && <span className="attr">Delivery</span>}
                </div>

                <div className="savings-bar">
                  <div className="savings-left">
                    <div className="savings-label">You save vs area average</div>
                    <div className="savings-sublabel">
                      Based on {deals.length} dispensaries near you
                    </div>
                  </div>
                  <div className="savings-amount">
                    {topDeal.savings_amount
                      ? `~$${Math.round(topDeal.savings_amount)}`
                      : avgPrice && topDeal.sale_price
                      ? `~$${Math.round(avgPrice - topDeal.sale_price)}`
                      : `${topDeal.discount_value || "?"}% off`}
                  </div>
                </div>

                <Link
                  href={`/l/${topDeal.slug}`}
                  className="card-cta"
                >
                  View {topDeal.name} →
                </Link>
              </div>
            </div>

            {/* ALTERNATIVES */}
            {alternatives.length > 0 && (
              <>
                <div className="alt-label">Also worth considering</div>
                <div className="alt-cards">
                  {alternatives.map((deal: any) => (
                    <Link
                      key={deal.deal_id || deal.slug}
                      href={`/l/${deal.slug}`}
                      className="alt-card"
                    >
                      <div className="alt-left">
                        <div className="alt-name">{deal.name}</div>
                        <div className="alt-deal">
                          {deal.deal_title || `${deal.discount_value}% off`}
                        </div>
                        <div className="alt-attrs">
                          <span className="alt-attr">{deal.city}</span>
                          {deal.accepts_credit && <span className="alt-attr">· Cards OK</span>}
                          {deal.drive_thru && <span className="alt-attr">· Drive-thru</span>}
                        </div>
                      </div>
                      <div className="alt-right">
                        <div className="alt-savings">
                          {deal.savings_amount
                            ? `~$${Math.round(deal.savings_amount)}`
                            : `${deal.discount_value || "?"}% off`}
                        </div>
                        <div className="alt-savings-label">savings</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="no-deals">
            <div className="no-deals-title">No active deals found right now</div>
            <p className="no-deals-sub">
              We&apos;re adding more dispensary deals daily. Check back soon
              or browse all Illinois dispensaries.
            </p>
            <Link href="/cannabis/illinois" className="no-deals-link">
              Browse all dispensaries →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
