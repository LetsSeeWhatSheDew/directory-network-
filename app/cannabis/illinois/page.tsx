export const revalidate = 3600;

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Illinois Cannabis Dispensaries — Complete Directory | PuffPrice",
  description: "Find licensed cannabis dispensaries across Illinois. Browse by city, view real hours, and discover deals. 270+ dispensaries listed across 35+ Illinois cities.",
  alternates: { canonical: "https://puffprice.com/cannabis/illinois" },
  openGraph: {
    title: "Illinois Cannabis Dispensaries — Complete Directory",
    description: "Find licensed cannabis dispensaries across Illinois. Browse by city, view real hours, and discover deals.",
    url: "https://puffprice.com/cannabis/illinois",
    siteName: "PuffPrice",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const IL_CITIES = [
  "Aurora", "Bloomington", "Canton", "Carbondale", "Champaign",
  "Chicago", "Collinsville", "Danville", "Decatur", "East Peoria",
  "Effingham", "Elgin", "Galesburg", "Jacksonville", "Joliet",
  "Litchfield", "Marion", "Moline", "Morris", "Mundelein",
  "Naperville", "Normal", "North Aurora", "Ottawa", "Peoria",
  "Quincy", "Rock Island", "Rockford", "Schaumburg", "Springfield",
  "Sterling", "Sycamore", "Urbana", "Waukegan",
];

const REGIONS: Record<string, string[]> = {
  "Chicago area": ["Chicago", "Aurora", "Elgin", "Joliet", "Mundelein", "Naperville", "North Aurora", "Schaumburg"],
  "Central Illinois": ["Bloomington", "Champaign", "Danville", "Decatur", "Normal", "Peoria", "East Peoria", "Canton", "Springfield", "Urbana"],
  "Southern Illinois": ["Carbondale", "Collinsville", "Effingham", "Litchfield", "Marion"],
  "Northern Illinois": ["Galesburg", "Moline", "Morris", "Ottawa", "Rock Island", "Rockford", "Sterling", "Sycamore", "Waukegan"],
  "Western Illinois": ["Jacksonville", "Quincy"],
};

const faqSchema = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is cannabis legal in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Illinois legalized recreational cannabis on January 1, 2020. Adults 21 and older can purchase cannabis at any licensed dispensary without a medical card.",
      },
    },
    {
      "@type": "Question",
      name: "How many cannabis dispensaries are in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Illinois has over 270 licensed cannabis dispensaries operating across the state, with the highest concentration in the Chicago metro area.",
      },
    },
    {
      "@type": "Question",
      name: "Can tourists buy cannabis in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Any adult 21 or older with a valid government-issued ID can purchase cannabis at any Illinois dispensary, regardless of their home state or country.",
      },
    },
    {
      "@type": "Question",
      name: "What do I need to buy cannabis in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A valid government-issued photo ID proving you are 21 or older. No medical card is required for recreational purchases. Most dispensaries prefer cash, though many also accept debit cards.",
      },
    },
  ],
});

export default function IllinoisHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .il-root { min-height: 100vh; background: #f7f6f2; font-family: Georgia, serif; }
        .il-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #fff; border-bottom: 1px solid #e8e5de; position: sticky; top: 0; z-index: 50; }
        .il-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .il-nav-dot { width: 10px; height: 10px; border-radius: 50%; background: #16a34a; display: inline-block; }
        .il-nav-name { font-size: 1.1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; }
        .il-nav-accent { color: #16a34a; }
        .il-nav-back { font-size: 0.85rem; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
        .il-breadcrumb { padding: 12px 32px; background: #fff; border-bottom: 1px solid #f0ede6; font-size: 0.8rem; font-family: system-ui, sans-serif; color: #6b7280; display: flex; gap: 8px; }
        .il-breadcrumb a { color: #6b7280; text-decoration: none; }
        .il-inner { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }
        .il-hero { margin-bottom: 40px; }
        .il-label { font-size: 0.72rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #16a34a; margin-bottom: 12px; }
        .il-h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 14px; }
        .il-intro { font-size: 1rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.7; max-width: 640px; margin-bottom: 24px; }
        .il-stats { display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e8e5de; }
        .il-stat-num { font-size: 2rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; }
        .il-stat-label { font-size: 0.78rem; color: #6b7280; font-family: system-ui, sans-serif; margin-top: 2px; }
        .il-quick-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 40px; }
        .il-quick-card { background: #fff; border-radius: 12px; border: 1px solid #e8e5de; padding: 18px 20px; text-decoration: none; display: flex; align-items: center; gap: 14px; }
        .il-quick-card:hover { border-color: #16a34a; background: #f0fdf4; }
        .il-quick-icon { font-size: 1.4rem; flex-shrink: 0; }
        .il-quick-title { font-size: 0.9rem; font-weight: 700; color: #0f1f3d; font-family: system-ui, sans-serif; margin-bottom: 2px; }
        .il-quick-sub { font-size: 0.75rem; color: #6b7280; font-family: system-ui, sans-serif; }
        .il-section-title { font-size: 1.2rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; margin-bottom: 16px; }
        .il-region { margin-bottom: 36px; }
        .il-region-label { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 12px; }
        .il-city-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
        .il-city-link { background: #fff; border-radius: 8px; border: 1px solid #e8e5de; padding: 10px 14px; text-decoration: none; display: flex; align-items: center; justify-content: space-between; }
        .il-city-link:hover { border-color: #16a34a; color: #16a34a; }
        .il-city-name { font-size: 0.875rem; font-family: system-ui, sans-serif; font-weight: 500; color: #0f1f3d; }
        .il-city-arrow { font-size: 0.75rem; color: #16a34a; }
        .il-guides { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 40px; }
        .il-guide-card { background: #fff; border-radius: 14px; border: 1px solid #e8e5de; padding: 24px; text-decoration: none; }
        .il-guide-card:hover { border-color: #16a34a; }
        .il-guide-label { font-size: 0.68rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #16a34a; margin-bottom: 8px; }
        .il-guide-title { font-size: 1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.01em; margin-bottom: 6px; line-height: 1.3; }
        .il-guide-desc { font-size: 0.825rem; color: #6b7280; font-family: system-ui, sans-serif; line-height: 1.5; }
        .il-faq { margin-bottom: 48px; }
        .il-faq-item { border-bottom: 1px solid #e8e5de; padding: 18px 0; }
        .il-faq-q { font-size: 1rem; font-weight: 700; color: #0f1f3d; margin-bottom: 8px; line-height: 1.4; }
        .il-faq-a { font-size: 0.9rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.7; }
        .il-cta { background: #0f1f3d; border-radius: 16px; padding: 32px; text-align: center; margin-top: 48px; }
        .il-cta-title { font-size: 1.4rem; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .il-cta-sub { font-size: 0.9rem; color: #94a3b8; font-family: system-ui, sans-serif; margin-bottom: 20px; }
        .il-cta-btn { display: inline-block; background: #16a34a; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 700; font-size: 0.9rem; }
        .il-footer { background: #0f1f3d; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 80px; }
        .il-footer-brand { font-size: 1rem; font-weight: 700; color: #fff; font-family: Georgia, serif; }
        .il-footer-note { font-size: 0.78rem; color: #475569; font-family: system-ui, sans-serif; }
        @media (max-width: 768px) {
          .il-nav { padding: 14px 20px; }
          .il-breadcrumb { padding: 10px 20px; }
          .il-inner { padding: 24px 16px 60px; }
          .il-city-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
        }
      `}</style>

      <div className="il-root">
        <nav className="il-nav">
          <Link href="/" className="il-nav-brand">
            <span className="il-nav-dot" />
            <span className="il-nav-name">puff<span className="il-nav-accent">price</span></span>
          </Link>
          <Link href="/cannabis" className="il-nav-back">← Cannabis</Link>
        </nav>

        <div className="il-breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/cannabis">Cannabis</Link>
          <span>›</span>
          <span style={{ color: "#374151" }}>Illinois</span>
        </div>

        <div className="il-inner">
          <div className="il-hero">
            <p className="il-label">Illinois Cannabis Directory</p>
            <h1 className="il-h1">Cannabis Dispensaries in Illinois</h1>
            <p className="il-intro">
              Find every licensed cannabis dispensary in Illinois. Browse by city, check real hours,
              and discover deals near you. Illinois legalized recreational cannabis in January 2020 —
              adults 21 and older can purchase at any licensed dispensary without a medical card.
            </p>
            <div className="il-stats">
              <div>
                <div className="il-stat-num">270+</div>
                <div className="il-stat-label">Licensed dispensaries</div>
              </div>
              <div>
                <div className="il-stat-num">{IL_CITIES.length}</div>
                <div className="il-stat-label">Cities covered</div>
              </div>
              <div>
                <div className="il-stat-num">2020</div>
                <div className="il-stat-label">Year legalized</div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="il-quick-links">
            <Link href="/cannabis/illinois/open-now" className="il-quick-card">
              <span className="il-quick-icon">🟢</span>
              <div>
                <p className="il-quick-title">Open right now</p>
                <p className="il-quick-sub">See what&apos;s open now</p>
              </div>
            </Link>
            <Link href="/cannabis/illinois/first-time-guide" className="il-quick-card">
              <span className="il-quick-icon">👋</span>
              <div>
                <p className="il-quick-title">First-time guide</p>
                <p className="il-quick-sub">What to know before you go</p>
              </div>
            </Link>
            <Link href="/cannabis/illinois/laws" className="il-quick-card">
              <span className="il-quick-icon">⚖️</span>
              <div>
                <p className="il-quick-title">Illinois cannabis laws</p>
                <p className="il-quick-sub">What&apos;s legal, what&apos;s not</p>
              </div>
            </Link>
            <Link href="/get-listed" className="il-quick-card">
              <span className="il-quick-icon">📋</span>
              <div>
                <p className="il-quick-title">Claim your listing</p>
                <p className="il-quick-sub">Free for dispensary owners</p>
              </div>
            </Link>
          </div>

          {/* Cities by region */}
          <p className="il-section-title">Browse by city</p>
          {Object.entries(REGIONS).map(([region, cities]) => (
            <div key={region} className="il-region">
              <p className="il-region-label">{region}</p>
              <div className="il-city-grid">
                {cities.map(city => (
                  <Link
                    key={city}
                    href={`/cannabis/illinois/${city.toLowerCase().replace(/\s+/g, "-")}`}
                    className="il-city-link"
                  >
                    <span className="il-city-name">{city}</span>
                    <span className="il-city-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Guides */}
          <p className="il-section-title" style={{ marginTop: "16px" }}>Illinois cannabis guides</p>
          <div className="il-guides">
            <Link href="/cannabis/illinois/first-time-guide" className="il-guide-card">
              <p className="il-guide-label">Beginner guide</p>
              <p className="il-guide-title">First Time Buying Cannabis in Illinois</p>
              <p className="il-guide-desc">What to bring, how much you can buy, what to expect inside, and what things cost.</p>
            </Link>
            <Link href="/cannabis/illinois/laws" className="il-guide-card">
              <p className="il-guide-label">Legal guide</p>
              <p className="il-guide-title">Illinois Cannabis Laws — Complete Guide</p>
              <p className="il-guide-desc">Possession limits, consumption rules, driving laws, taxes, and penalties explained.</p>
            </Link>
            <Link href="/cannabis/illinois/open-now" className="il-guide-card">
              <p className="il-guide-label">Live hours</p>
              <p className="il-guide-title">Illinois Dispensaries Open Right Now</p>
              <p className="il-guide-desc">Real-time view of which dispensaries are currently open across Illinois.</p>
            </Link>
          </div>

          {/* FAQ */}
          <div className="il-faq">
            <p className="il-section-title">Frequently asked questions</p>
            <div className="il-faq-item">
              <p className="il-faq-q">Is cannabis legal in Illinois?</p>
              <p className="il-faq-a">Yes. Illinois legalized adult-use recreational cannabis on January 1, 2020 under the Cannabis Regulation and Tax Act. Adults 21 and older can legally purchase and possess cannabis from any licensed dispensary.</p>
            </div>
            <div className="il-faq-item">
              <p className="il-faq-q">Do I need a medical card to buy cannabis in Illinois?</p>
              <p className="il-faq-a">No. Illinois has full recreational cannabis — no medical card required. You just need a valid government-issued ID showing you are 21 or older.</p>
            </div>
            <div className="il-faq-item">
              <p className="il-faq-q">How many dispensaries are in Illinois?</p>
              <p className="il-faq-a">Illinois has over 270 licensed cannabis dispensaries operating statewide, with the largest concentration in the Chicago metro area. PuffPrice lists dispensaries across 35+ Illinois cities.</p>
            </div>
            <div className="il-faq-item">
              <p className="il-faq-q">Can tourists buy cannabis in Illinois?</p>
              <p className="il-faq-a">Yes. Any adult 21 or older with a valid government-issued ID can purchase cannabis in Illinois, regardless of where they are from. Out-of-state visitors have lower possession limits than Illinois residents.</p>
            </div>
          </div>

          <div className="il-cta">
            <p className="il-cta-title">Own a dispensary in Illinois?</p>
            <p className="il-cta-sub">Claim your free listing, update your hours, and get in front of customers searching for dispensaries near them.</p>
            <Link href="/get-listed" className="il-cta-btn">Claim your free listing →</Link>
          </div>
        </div>

        <footer className="il-footer">
          <span className="il-footer-brand">puff<span style={{ color: "#16a34a" }}>price</span></span>
          <span className="il-footer-note">© {new Date().getFullYear()} PuffPrice · Illinois Cannabis Directory</span>
        </footer>
      </div>
    </>
  );
}
