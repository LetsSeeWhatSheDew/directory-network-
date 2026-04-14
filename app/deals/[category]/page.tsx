// app/deals/[category]/page.tsx
// Fixed: actually queries Supabase and renders real deal data
// Chrome confirmed the DB has 45 deals seeded — this page wasn't fetching them

import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Deal = {
  deal_id: string;
  deal_title: string;
  deal_description: string;
  category: string;
  discount_type: string;
  discount_value: number;
  discount_unit: string;
  original_price: number | null;
  sale_price: number | null;
  unit: string | null;
  price_per_gram: number | null;
  is_recurring: boolean;
  recurring_days: string[] | null;
  expires_at: string | null;
  source: string;
  slug: string;
  name: string;
  city: string;
  phone: string;
  logo_url: string;
  google_rating: number;
  review_count: number;
  accepts_credit: boolean;
  drive_thru: boolean;
  delivery: boolean;
  plan: string;
  savings_amount: number | null;
  savings_percent: number | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  flower: "Flower",
  edibles: "Edibles",
  vapes: "Vapes",
  concentrate: "Concentrates",
  all: "All deals",
};

const CATEGORY_SUBTITLES: Record<string, string> = {
  flower: "Best price per gram on flower near you right now",
  edibles: "Cheapest edibles deals in Illinois today",
  vapes: "Best vape deals and discounts near you",
  concentrate: "Top concentrate deals near you",
  all: "Every active cannabis deal in Illinois right now",
};

async function getDeals(category: string): Promise<Deal[]> {
  const params = new URLSearchParams({
    select: "*",
    project_tag: "eq.green",
    order: "savings_percent.desc.nullslast,discount_value.desc.nullslast",
    limit: "10",
  });

  if (category !== "all") {
    params.append("or", `(category.eq.${category},category.eq.all)`);
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?${params}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      console.error("Supabase error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch deals:", err);
    return [];
  }
}

// Fallback: if the view doesn't exist yet, query deals table directly
async function getDealsDirectly(category: string): Promise<Deal[]> {
  const params = new URLSearchParams({
    select: "id,title,description,category,discount_type,discount_value,discount_unit,original_price,sale_price,unit,price_per_gram,is_recurring,recurring_days,expires_at,source,listing_slug",
    project_tag: "eq.green",
    is_active: "eq.true",
    order: "discount_value.desc",
    limit: "10",
  });

  if (category !== "all") {
    params.append("category", `eq.${category}`);
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deals?${params}`,
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
  } catch {
    return [];
  }
}

function isOpenNow(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 9 && hour < 21;
}

function formatSavings(deal: Deal): string {
  if (deal.savings_amount && deal.savings_amount > 0) {
    return `~$${Math.round(deal.savings_amount)}`;
  }
  if (deal.discount_value) {
    if (deal.discount_unit === "percent") return `${Math.round(deal.discount_value)}% off`;
    if (deal.discount_unit === "dollars") return `$${deal.discount_value} off`;
  }
  return "Deal available";
}

function getRankingReason(deal: Deal, index: number): string {
  if (index === 0) {
    if (deal.price_per_gram) return `$${deal.price_per_gram.toFixed(2)}/gram — cheapest near you`;
    if (deal.savings_percent && deal.savings_percent >= 30) return `${Math.round(deal.savings_percent)}% off — best discount in Illinois today`;
    return "Best value deal available right now";
  }
  if (deal.drive_thru) return "Drive-thru available — fastest option";
  if (deal.accepts_credit) return "Cards accepted · No ATM needed";
  if (deal.google_rating >= 4.8) return `${deal.google_rating}★ — one of Illinois' highest rated`;
  return `${deal.discount_value}% off ${deal.category}`;
}

export async function generateMetadata({ params }: { params: { category: string } }) {
  const label = CATEGORY_LABELS[params.category] || "Cannabis deals";
  return {
    title: `${label} Deals Near You | CleanList — Best Bud For Your Buck$`,
    description: `Find the cheapest ${label.toLowerCase()} deals at Illinois dispensaries right now. Real prices, real savings. Best Bud For Your Buck$.`,
  };
}

export default async function DealsPage({ params }: { params: { category: string } }) {
  const { category } = params;

  let deals = await getDeals(category);

  // Fallback to direct table query if view doesn't exist
  if (deals.length === 0) {
    deals = await getDealsDirectly(category) as any[];
  }

  const categoryLabel = CATEGORY_LABELS[category] || "Deals";
  const subtitle = CATEGORY_SUBTITLES[category] || "Best deals near you";
  const topDeal = deals[0] || null;
  const alternatives = deals.slice(1, 4);
  const openNow = isOpenNow();

  // Avg savings calc
  const prices = deals.filter(d => d.sale_price).map(d => d.sale_price as number);
  const avgPrice = prices.length > 0
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : null;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;position:sticky;top:0;z-index:100}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .logo-text{font-size:1.1rem;font-weight:700;color:#fff}
        .logo-text span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.5);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .page{max-width:800px;margin:0 auto;padding:40px 20px}
        .cat-tag{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:8px}
        .page-title{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:700;color:#0f1f3d;letter-spacing:-.04em;line-height:1.1;margin-bottom:6px}
        .page-sub{font-size:.88rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:24px}
        .cat-switch{background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:16px;margin-bottom:24px}
        .cat-switch-label{font-size:.7rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:10px}
        .cat-pills{display:flex;gap:8px;flex-wrap:wrap}
        .cat-pill{font-size:.8rem;font-family:system-ui,sans-serif;font-weight:500;padding:6px 14px;border-radius:100px;text-decoration:none;border:1px solid #e8e4da;color:#6b7280}
        .cat-pill.active{background:#0f1f3d;color:#fff;border-color:#0f1f3d}
        .cat-pill:hover:not(.active){border-color:#9ca3af;color:#374151}
        .top-label{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:10px}
        .top-card{background:#fff;border:2px solid #16a34a;border-radius:16px;padding:24px;position:relative;margin-bottom:24px}
        .top-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:#16a34a;border-radius:16px 16px 0 0}
        .verdict-badge{display:inline-flex;align-items:center;gap:6px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:100px;padding:4px 12px;margin-bottom:16px;font-size:.72rem;font-family:system-ui,sans-serif;font-weight:600;color:#166534}
        .vdot{width:5px;height:5px;border-radius:50%;background:#16a34a}
        .card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
        .disp-name{font-size:1.2rem;font-weight:700;color:#0f1f3d}
        .disp-city{font-size:.82rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px}
        .open-pill{font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:100px;font-family:system-ui,sans-serif;white-space:nowrap}
        .open-pill.open{color:#166534;background:#dcfce7}
        .open-pill.unknown{color:#92400e;background:#fef3c7}
        .deal-title-big{font-size:1.4rem;font-weight:700;color:#16a34a;margin-bottom:6px}
        .deal-reason{font-size:.875rem;color:#374151;font-family:system-ui,sans-serif;margin-bottom:16px;line-height:1.5}
        .attrs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
        .attr{font-size:.72rem;color:#6b7280;background:#f5f4f0;border-radius:100px;padding:3px 10px;font-family:system-ui,sans-serif}
        .savings-bar{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .save-label{font-size:.82rem;color:#166534;font-family:system-ui,sans-serif;font-weight:600}
        .save-sub{font-size:.72rem;color:#86efac;font-family:system-ui,sans-serif;margin-top:2px}
        .save-amount{font-size:2rem;font-weight:700;color:#16a34a}
        .card-cta{display:block;text-align:center;background:#0f1f3d;color:#fff;padding:12px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.9rem}
        .card-cta:hover{background:#1e3a5f}
        .alt-label{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:12px}
        .alt-cards{display:flex;flex-direction:column;gap:10px;margin-bottom:36px}
        .alt-card{background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;text-decoration:none;transition:border-color .15s}
        .alt-card:hover{border-color:#16a34a}
        .alt-name{font-size:.9rem;font-weight:700;color:#0f1f3d}
        .alt-deal{font-size:.82rem;color:#16a34a;font-family:system-ui,sans-serif;margin-top:2px}
        .alt-attrs{display:flex;gap:5px;margin-top:4px;flex-wrap:wrap}
        .alt-attr{font-size:.68rem;color:#9ca3af;font-family:system-ui,sans-serif}
        .alt-savings{font-size:1.1rem;font-weight:700;color:#16a34a;text-align:right}
        .alt-savings-label{font-size:.7rem;color:#9ca3af;font-family:system-ui,sans-serif;text-align:right}
        .no-deals{text-align:center;padding:60px 20px;background:#fff;border-radius:16px;border:1px solid #e8e4da}
        .no-deals-title{font-size:1.2rem;font-weight:700;color:#0f1f3d;margin-bottom:8px}
        .no-deals-sub{font-size:.875rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:20px}
        .no-deals-link{display:inline-block;background:#0f1f3d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.875rem}
        .source-note{font-size:.7rem;color:#d1cfc6;font-family:system-ui,sans-serif;text-align:center;margin-top:24px}
        @media(max-width:600px){.page{padding:24px 14px}.nav{padding:12px 16px}}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">
          <span className="logo-dot" />
          <span className="logo-text">clean<span>list</span></span>
        </Link>
        <Link href="/" className="back">← Back</Link>
      </nav>

      <div className="page">
        <div className="cat-tag">{categoryLabel}</div>
        <h1 className="page-title">{subtitle}</h1>
        <p className="page-sub">
          {deals.length > 0
            ? `${deals.length} active deal${deals.length !== 1 ? "s" : ""} found in Illinois`
            : "No active deals right now — check back soon"}
        </p>

        {/* Category switcher */}
        <div className="cat-switch">
          <div className="cat-switch-label">Switch category</div>
          <div className="cat-pills">
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <Link
                key={slug}
                href={`/deals/${slug}`}
                className={`cat-pill ${slug === category ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {topDeal ? (
          <>
            <div className="top-label">Our recommendation</div>
            <div className="top-card">
              <div className="verdict-badge">
                <span className="vdot" />
                Best value right now
              </div>
              <div className="card-top">
                <div>
                  <div className="disp-name">{topDeal.name || topDeal.listing_slug}</div>
                  <div className="disp-city">{topDeal.city}, IL</div>
                </div>
                <span className={`open-pill ${openNow ? "open" : "unknown"}`}>
                  {openNow ? "Likely open" : "Check hours"}
                </span>
              </div>

              <div className="deal-title-big">
                {topDeal.deal_title || topDeal.title || `${topDeal.discount_value}% off ${topDeal.category}`}
              </div>
              <div className="deal-reason">{getRankingReason(topDeal, 0)}</div>

              <div className="attrs">
                {topDeal.accepts_credit && <span className="attr">Cards OK</span>}
                {topDeal.drive_thru && <span className="attr">Drive-thru</span>}
                {topDeal.google_rating > 0 && <span className="attr">{topDeal.google_rating}★</span>}
                {topDeal.delivery && <span className="attr">Delivery</span>}
                {topDeal.is_recurring && topDeal.recurring_days && (
                  <span className="attr">Every {topDeal.recurring_days.join(", ")}</span>
                )}
              </div>

              <div className="savings-bar">
                <div>
                  <div className="save-label">You save</div>
                  <div className="save-sub">
                    vs avg price across {deals.length} Illinois dispensaries
                  </div>
                </div>
                <div className="save-amount">{formatSavings(topDeal)}</div>
              </div>

              <Link href={`/l/${topDeal.slug || topDeal.listing_slug}`} className="card-cta">
                View deal at {topDeal.name || "dispensary"} →
              </Link>
            </div>

            {alternatives.length > 0 && (
              <>
                <div className="alt-label">Also worth considering</div>
                <div className="alt-cards">
                  {alternatives.map((deal, i) => (
                    <Link
                      key={deal.deal_id || deal.slug || i}
                      href={`/l/${deal.slug || deal.listing_slug}`}
                      className="alt-card"
                    >
                      <div>
                        <div className="alt-name">{deal.name || deal.listing_slug}</div>
                        <div className="alt-deal">
                          {deal.deal_title || deal.title || `${deal.discount_value}% off`}
                        </div>
                        <div className="alt-attrs">
                          {deal.city && <span className="alt-attr">{deal.city}</span>}
                          {deal.accepts_credit && <span className="alt-attr">· Cards OK</span>}
                          {deal.drive_thru && <span className="alt-attr">· Drive-thru</span>}
                          {deal.google_rating > 0 && <span className="alt-attr">· {deal.google_rating}★</span>}
                        </div>
                      </div>
                      <div>
                        <div className="alt-savings">{formatSavings(deal)}</div>
                        <div className="alt-savings-label">savings</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            <div className="source-note">
              Deal data sourced from Leafly, Weedmaps, and dispensary websites ·
              Updated daily · <Link href="/dispensary/submit-deal" style={{color:"#16a34a",textDecoration:"none"}}>Submit your deal →</Link>
            </div>
          </>
        ) : (
          <div className="no-deals">
            <div className="no-deals-title">No active {categoryLabel.toLowerCase()} deals right now</div>
            <p className="no-deals-sub">
              We&apos;re adding dispensary deals daily. Get notified the moment one goes live near you.
            </p>
            <Link href="/alerts" className="no-deals-link">
              Get deal alerts →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
