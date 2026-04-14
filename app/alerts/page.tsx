// app/alerts/page.tsx
// ============================================================
// DEAL ALERTS SIGNUP — Consumer Revenue Engine
//
// This is the fastest path to first revenue.
// Consumers sign up for deal alerts by city + category.
// Free tier gets weekly digest.
// Paid tiers get instant SMS alerts.
//
// Design: warm, personal, not techy. This is a service
// that saves you money — it should feel like a smart friend
// tipping you off, not a SaaS dashboard.
// ============================================================

import Link from "next/link";

export const metadata = {
  title: "Deal Alerts | CleanList — Never overpay for cannabis again",
  description:
    "Get texted when dispensaries near you post deals. Free weekly digest or real-time SMS alerts for Illinois cannabis dispensaries.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "no signup needed",
    headline: "See today's best deal near you",
    description: "No account. No email required. Browse the whole state.",
    features: [
      "See today's best deal near you",
      "Browse all Illinois dispensaries",
      "Basic deal search by category",
      "Weekly deal digest (with email signup)",
      "Always free, no account required",
    ],
    cta: "Start browsing",
    highlighted: false,
    color: "#6b7280",
    anchor: null as string | null,
  },
  {
    name: "Standard",
    price: "$3.99",
    period: "/month",
    headline: "Daily 8am email",
    description: "Today's best deals near you — delivered every morning.",
    features: [
      "Daily 8am email: \"Today's best deals near you\"",
      "Personalized by city + categories you choose",
      "Price comparison across nearby dispensaries",
      "Deal history: see what you've saved this month",
      "Cancel anytime",
    ],
    cta: "Start for $3.99/mo",
    highlighted: false,
    color: "#0f1f3d",
    anchor: null,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    headline: "Instant SMS the moment a deal goes live",
    description: "The fastest way to get alerted when your favorite dispensary drops a deal.",
    features: [
      "Everything in Standard",
      "Instant SMS the moment a deal goes live near you",
      "Price drop alerts: \"Flower just dropped below $30 near you\"",
      "Flash sale early access (15 min before public)",
      "Your total savings dashboard: \"You've saved $847 this year with CleanList\"",
      "First to know about new dispensary openings near you",
    ],
    cta: "Start for $4.99/mo",
    highlighted: true,
    color: "#16a34a",
    anchor: "Less than one pre-roll per month",
  },
];

const PRO_TYPICAL_SAVINGS = "$400–$800";

const TESTIMONIAL = {
  quote: "I saved $23 on my last order just from a Tuesday morning text. Worth every penny.",
  who: "K.M., Peoria IL",
  label: "Beta user",
};

export default function AlertsPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}

        /* NAV */
        .nav{
          display:flex;justify-content:space-between;align-items:center;
          padding:14px 28px;background:#0f1f3d;
        }
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .logo-text{font-size:1.1rem;font-weight:700;color:#fff}
        .logo-text span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.5);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}

        /* HERO */
        .hero{
          background:#0f1f3d;
          padding:56px 28px 52px;text-align:center;
        }
        .hero-eyebrow{
          font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
          color:#4ade80;font-family:system-ui,sans-serif;margin-bottom:16px;
        }
        .hero h1{
          font-size:clamp(2rem,5vw,3rem);font-weight:700;
          color:#fff;letter-spacing:-.04em;line-height:1.1;margin-bottom:14px;
        }
        .hero h1 em{color:#4ade80;font-style:normal}
        .hero-sub{
          font-size:1rem;color:rgba(255,255,255,.55);
          font-family:system-ui,sans-serif;line-height:1.7;
          max-width:460px;margin:0 auto 36px;
        }

        /* SOCIAL PROOF */
        .proof{
          display:inline-flex;align-items:center;gap:10px;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
          border-radius:100px;padding:8px 18px;
          font-size:.8rem;font-family:system-ui,sans-serif;color:rgba(255,255,255,.6);
        }
        .proof-num{font-weight:700;color:#4ade80}

        /* FREE SIGNUP STRIP */
        .free-strip{
          background:#fff;border-bottom:1px solid #e8e4da;
          padding:32px 28px;text-align:center;
        }
        .free-strip-title{
          font-size:1.2rem;font-weight:700;color:#0f1f3d;
          letter-spacing:-.02em;margin-bottom:6px;
        }
        .free-strip-sub{
          font-size:.875rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:20px;
        }
        .free-form{
          display:flex;gap:10px;justify-content:center;flex-wrap:wrap;
          max-width:480px;margin:0 auto;
        }
        .free-input{
          flex:1;min-width:200px;
          padding:12px 16px;border-radius:10px;
          border:1px solid #d1cfc6;
          font-size:.9rem;font-family:system-ui,sans-serif;
          outline:none;
          background:#f5f4f0;color:#0f1f3d;
        }
        .free-input:focus{border-color:#16a34a;background:#fff}
        .free-btn{
          background:#0f1f3d;color:#fff;
          padding:12px 22px;border-radius:10px;
          border:none;font-family:system-ui,sans-serif;
          font-weight:700;font-size:.9rem;cursor:pointer;
          white-space:nowrap;
        }
        .free-btn:hover{background:#1e3a5f}
        .free-note{
          font-size:.75rem;color:#9ca3af;
          font-family:system-ui,sans-serif;margin-top:10px;
        }

        /* TIERS */
        .tiers-section{max-width:960px;margin:0 auto;padding:56px 28px}
        .tiers-eyebrow{
          font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
          color:#16a34a;font-family:system-ui,sans-serif;
          text-align:center;margin-bottom:8px;
        }
        .tiers-title{
          font-size:clamp(1.5rem,3vw,2rem);font-weight:700;
          color:#0f1f3d;letter-spacing:-.03em;
          text-align:center;margin-bottom:6px;
        }
        .tiers-sub{
          font-size:.9rem;color:#6b7280;
          font-family:system-ui,sans-serif;
          text-align:center;margin-bottom:40px;
        }

        .tier-grid{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:16px;
          align-items:start;
        }

        .tier-card{
          background:#fff;border:1px solid #e8e4da;
          border-radius:16px;padding:28px 24px;
          position:relative;
        }
        .tier-card.highlighted{
          border:2px solid #16a34a;
          background:#fff;
        }
        .popular-badge{
          position:absolute;top:-12px;left:50%;transform:translateX(-50%);
          background:#16a34a;color:#fff;
          font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
          padding:4px 14px;border-radius:100px;
          font-family:system-ui,sans-serif;white-space:nowrap;
        }

        .tier-name{
          font-size:.8rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
          font-family:system-ui,sans-serif;color:#9ca3af;margin-bottom:10px;
        }
        .tier-price-wrap{display:flex;align-items:baseline;gap:3px;margin-bottom:4px}
        .tier-price{font-size:2.4rem;font-weight:700;color:#0f1f3d;letter-spacing:-.04em}
        .tier-period{font-size:.9rem;color:#9ca3af;font-family:system-ui,sans-serif}
        .tier-headline{
          font-size:.95rem;font-weight:700;color:#0f1f3d;margin-bottom:6px;
        }
        .tier-desc{
          font-size:.82rem;color:#6b7280;font-family:system-ui,sans-serif;
          line-height:1.6;margin-bottom:20px;
        }
        .tier-features{list-style:none;margin-bottom:24px}
        .tier-feature{
          display:flex;align-items:center;gap:8px;
          font-size:.82rem;color:#374151;
          font-family:system-ui,sans-serif;
          padding:4px 0;
        }
        .check{
          width:16px;height:16px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;font-size:10px;font-weight:700;
          background:#dcfce7;color:#166534;
        }
        .tier-cta{
          display:block;text-align:center;
          padding:12px;border-radius:10px;
          font-family:system-ui,sans-serif;font-weight:700;
          font-size:.9rem;text-decoration:none;cursor:pointer;
          border:none;width:100%;
        }
        .tier-cta.primary{background:#16a34a;color:#fff}
        .tier-cta.primary:hover{background:#15803d}
        .tier-cta.secondary{background:#0f1f3d;color:#fff}
        .tier-cta.secondary:hover{background:#1e3a5f}
        .tier-cta.ghost{
          background:transparent;color:#6b7280;
          border:1px solid #d1cfc6;
        }
        .tier-cta.ghost:hover{border-color:#9ca3af;color:#374151}
        .pro-savings{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:10px;padding:12px 14px;margin-bottom:12px;text-align:center}
        .pro-savings-num{font-size:1.5rem;font-weight:700;color:#4ade80;letter-spacing:-.02em;line-height:1;font-family:Georgia,serif}
        .pro-savings-label{font-size:.68rem;color:rgba(255,255,255,.55);font-family:system-ui,sans-serif;margin-top:6px;letter-spacing:.04em}
        .tier-anchor{font-size:.72rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:10px;text-align:center;font-style:italic}
        .tier-card.highlighted .tier-anchor{color:rgba(255,255,255,.6)}
        .testimonial{max-width:640px;margin:28px auto 0;background:#fff;border:1px solid #e8e4da;border-left:3px solid #16a34a;border-radius:10px;padding:20px 24px}
        .testimonial-quote{font-family:Georgia,serif;font-style:italic;font-size:1.02rem;color:#0f1f3d;line-height:1.55;margin-bottom:10px}
        .testimonial-cite{font-family:system-ui,sans-serif;font-size:.8rem;color:#6b7280}
        .testimonial-cite strong{color:#0f1f3d;font-weight:700}
        .testimonial-label{color:#16a34a;font-weight:600}

        /* HOW ALERTS WORK */
        .how-section{
          background:#0f1f3d;padding:52px 28px;
        }
        .how-inner{max-width:800px;margin:0 auto;text-align:center}
        .how-title{
          font-size:1.6rem;font-weight:700;color:#fff;
          letter-spacing:-.03em;margin-bottom:8px;
        }
        .how-sub{
          font-size:.9rem;color:rgba(255,255,255,.45);
          font-family:system-ui,sans-serif;margin-bottom:40px;
        }

        /* SAMPLE ALERT */
        .sample-alert{
          background:#1a1a2e;border:1px solid rgba(255,255,255,.1);
          border-radius:16px;padding:20px;text-align:left;
          max-width:360px;margin:0 auto 40px;
        }
        .alert-header{
          display:flex;align-items:center;gap:10px;margin-bottom:14px;
        }
        .alert-icon{
          width:36px;height:36px;border-radius:10px;
          background:#16a34a;display:flex;align-items:center;justify-content:center;
          font-size:16px;
        }
        .alert-from{font-size:.75rem;color:rgba(255,255,255,.4);font-family:system-ui,sans-serif}
        .alert-name{font-size:.85rem;font-weight:600;color:#fff;font-family:system-ui,sans-serif}
        .alert-body{
          font-size:.9rem;color:rgba(255,255,255,.8);
          font-family:system-ui,sans-serif;line-height:1.6;margin-bottom:12px;
        }
        .alert-body strong{color:#4ade80}
        .alert-savings{
          background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.2);
          border-radius:8px;padding:8px 12px;
          font-size:.8rem;color:#4ade80;font-family:system-ui,sans-serif;
          font-weight:600;
        }
        .alert-time{
          font-size:.72rem;color:rgba(255,255,255,.25);
          font-family:system-ui,sans-serif;margin-top:10px;
        }

        .how-steps{
          display:grid;grid-template-columns:repeat(3,1fr);gap:32px;
          text-align:center;
        }
        .how-step-num{
          font-size:1.8rem;font-weight:700;color:rgba(255,255,255,.1);
          margin-bottom:8px;
        }
        .how-step-title{
          font-size:.9rem;font-weight:700;color:#fff;margin-bottom:4px;
        }
        .how-step-desc{
          font-size:.8rem;color:rgba(255,255,255,.4);
          font-family:system-ui,sans-serif;line-height:1.5;
        }

        /* FAQ */
        .faq-section{max-width:640px;margin:0 auto;padding:52px 28px}
        .faq-title{
          font-size:1.4rem;font-weight:700;color:#0f1f3d;
          letter-spacing:-.03em;text-align:center;margin-bottom:28px;
        }
        .faq-item{
          border-bottom:1px solid #e8e4da;padding:16px 0;
        }
        .faq-q{font-size:.9rem;font-weight:700;color:#0f1f3d;margin-bottom:6px}
        .faq-a{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.6}

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

        @media(max-width:768px){
          .tier-grid{grid-template-columns:1fr}
          .how-steps{grid-template-columns:1fr;gap:20px}
          .hero{padding:40px 16px}
          .tiers-section{padding:36px 16px}
          .nav{padding:12px 16px}
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="logo">
          <span className="logo-dot" />
          <span className="logo-text">clean<span>list</span></span>
        </Link>
        <Link href="/" className="back">← Back to deals</Link>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">Deal alerts · Illinois cannabis</div>
        <h1>Never overpay<br /><em>for weed again</em></h1>
        <p className="hero-sub">
          Get texted the moment a dispensary near you posts a deal.
          Flower, edibles, vapes — you pick. We do the watching.
        </p>
        <div className="proof">
          <span className="proof-num">293</span>
          Illinois dispensaries tracked ·
          <span className="proof-num">deals posted daily</span>
        </div>
      </div>

      {/* FREE SIGNUP — capture emails before they hit the paywall */}
      <div className="free-strip">
        <div className="free-strip-title">Start free — get this week&apos;s best deals</div>
        <p className="free-strip-sub">
          Enter your email and city. We&apos;ll send you the best deals in your area every Monday. Free forever.
        </p>
        <form className="free-form" action="/api/alerts/signup" method="POST">
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            className="free-input"
            required
          />
          <input
            type="text"
            name="city"
            placeholder="Your city (e.g. Peoria)"
            className="free-input"
            required
          />
          <button type="submit" className="free-btn">
            Get free alerts →
          </button>
        </form>
        <p className="free-note">No spam. No credit card. Just deals. Unsubscribe anytime.</p>
      </div>

      {/* TIERS */}
      <div className="tiers-section">
        <div className="tiers-eyebrow">Upgrade for more</div>
        <h2 className="tiers-title">Choose how you want alerts</h2>
        <p className="tiers-sub">
          Start free, upgrade when you want real-time SMS alerts.
          Less than the cost of one pre-roll per month.
        </p>

        <div className="tier-grid">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`tier-card ${tier.highlighted ? "highlighted" : ""}`}
            >
              {tier.highlighted && (
                <div className="popular-badge">Most popular</div>
              )}

              <div className="tier-name">{tier.name}</div>
              <div className="tier-price-wrap">
                <span className="tier-price">{tier.price}</span>
                <span className="tier-period">{tier.period}</span>
              </div>
              <div className="tier-headline">{tier.headline}</div>
              <p className="tier-desc">{tier.description}</p>

              <ul className="tier-features">
                {tier.features.map((f) => (
                  <li key={f} className="tier-feature">
                    <span className="check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {tier.highlighted && (
                <div className="pro-savings">
                  <div className="pro-savings-num">{PRO_TYPICAL_SAVINGS}</div>
                  <div className="pro-savings-label">typical Pro user saves per year</div>
                </div>
              )}

              {tier.anchor && (
                <div className="tier-anchor">💡 {tier.anchor}</div>
              )}

              <button
                className={`tier-cta ${
                  tier.highlighted
                    ? "primary"
                    : tier.name === "Free"
                    ? "ghost"
                    : "secondary"
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        <figure className="testimonial">
          <blockquote className="testimonial-quote">&ldquo;{TESTIMONIAL.quote}&rdquo;</blockquote>
          <figcaption className="testimonial-cite">
            — <strong>{TESTIMONIAL.who}</strong> <span className="testimonial-label">· {TESTIMONIAL.label}</span>
          </figcaption>
        </figure>
      </div>

      {/* HOW IT WORKS */}
      <div className="how-section">
        <div className="how-inner">
          <h2 className="how-title">What a Pro alert looks like</h2>
          <p className="how-sub">You get a text. You go. You save money. That&apos;s it.</p>

          {/* SAMPLE SMS */}
          <div className="sample-alert">
            <div className="alert-header">
              <div className="alert-icon">🌿</div>
              <div>
                <div className="alert-from">CleanList · Deal Alert</div>
                <div className="alert-name">Flower deal near you</div>
              </div>
            </div>
            <div className="alert-body">
              <strong>NOXX East Peoria</strong> just posted: 30% off all flower today only. Open until 9pm. Drive-thru available. Accepts cards.
            </div>
            <div className="alert-savings">You save ~$18 vs area average</div>
            <div className="alert-time">Sent 10:14 AM · Tap to see deal</div>
          </div>

          <div className="how-steps">
            <div>
              <div className="how-step-num">01</div>
              <div className="how-step-title">Set your preferences</div>
              <div className="how-step-desc">City, radius, categories. Takes 60 seconds.</div>
            </div>
            <div>
              <div className="how-step-num">02</div>
              <div className="how-step-title">We watch dispensaries</div>
              <div className="how-step-desc">We check 293 IL dispensaries for new deals, continuously.</div>
            </div>
            <div>
              <div className="how-step-num">03</div>
              <div className="how-step-title">You get a text</div>
              <div className="how-step-desc">Instant notification with deal details + how much you save.</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq-section">
        <h2 className="faq-title">Questions</h2>

        <div className="faq-item">
          <div className="faq-q">How do you get deal data?</div>
          <div className="faq-a">We monitor dispensary websites, social media, and deal platforms daily. Dispensaries can also submit deals directly — which we verify before sending alerts.</div>
        </div>

        <div className="faq-item">
          <div className="faq-q">How accurate are the deals?</div>
          <div className="faq-a">We verify every deal before it goes out. If a deal isn&apos;t valid when you arrive, let us know and we&apos;ll give you a free month. Deal accuracy is everything to us.</div>
        </div>

        <div className="faq-item">
          <div className="faq-q">How many texts will I get?</div>
          <div className="faq-a">Only when a deal matches your preferences. In a typical week that&apos;s 1-5 texts depending on your city and categories. Never spam.</div>
        </div>

        <div className="faq-item">
          <div className="faq-q">Can I cancel anytime?</div>
          <div className="faq-a">Yes. No contracts, no cancellation fees. Text STOP to unsubscribe from SMS immediately.</div>
        </div>

        <div className="faq-item">
          <div className="faq-q">What areas do you cover?</div>
          <div className="faq-a">All of Illinois right now — 162 cities across 44 counties. More states coming in 2026.</div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span className="footer-logo">clean<span>list</span></span>
        <div className="footer-links">
          <Link href="/" className="footer-link">Find deals</Link>
          <Link href="/cannabis/illinois" className="footer-link">Browse Illinois</Link>
          <Link href="/upgrade" className="footer-link">For dispensaries</Link>
        </div>
      </footer>
    </>
  );
}
