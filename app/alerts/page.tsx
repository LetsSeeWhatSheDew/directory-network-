// app/alerts/page.tsx
// Two-tier consumer page: FREE (no account) and PRO ($0.99/month).
// Standard tier removed per GPT advice — habit beats monetization
// at this stage.

import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import AlertsCalculator from "./AlertsCalculator";
import ProCheckoutButton from "./ProCheckoutButton";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

// Social proof count — total active alert subscribers. Runs on the
// server, cached 300s. If the fetch fails we render nothing rather
// than show a misleading zero.
async function getAlertCount(): Promise<number | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deal_alerts?select=id&is_active=eq.true`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "count=exact",
          "Range-Unit": "items",
          Range: "0-0",
        },
        next: { revalidate: 300, tags: ["alerts"] },
      }
    );
    const range = res.headers.get("content-range");
    if (range) {
      const total = range.split("/")[1];
      const n = Number.parseInt(total, 10);
      if (Number.isFinite(n)) return n;
    }
  } catch {}
  return null;
}

export const revalidate = 300;

const OG_IMAGE = "https://www.puffprice.com/og-image.png";
const OG_DESC =
  "Central Illinois cannabis deal alerts. Free forever, no account needed. Pro is $0.99/month. Deal alerts within minutes.";

export const metadata = {
  title: "Get Deal Alerts",
  description: OG_DESC,
  openGraph: {
    title: "Get Deal Alerts | PuffPrice",
    description: OG_DESC,
    url: "https://www.puffprice.com/alerts",
    siteName: "PuffPrice",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Get Deal Alerts | PuffPrice",
    description: OG_DESC,
    images: [OG_IMAGE],
  },
};

const FREE_FEATURES = [
  "Best deal near you right now — always",
  "Browse every Central Illinois dispensary we track — updated weekly",
  "Map view with deal pins",
  "Search by city or dispensary name",
  "Weekly Monday digest (just email + city, no account)",
];

const PRO_FEATURES = [
  "Everything free",
  "Deal alerts within minutes of dispensary updates",
  "Daily 8am deal digest personalized to your city + categories",
  'Price history — "this eighth was $45 last week, today $28"',
  '"Beat My Last Price" alerts — set your price, we tell you when it\'s beaten',
  'Monthly savings report: "You saved $84 this month"',
  "Annual savings dashboard with shareable stats",
  "First to know about new dispensary openings near you",
];

export default async function AlertsPage() {
  const alertCount = await getAlertCount();
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#F7F4ED;color:#1F3D2B;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#1F3D2B;position:sticky;top:0;z-index:100}
        .logo{color:#fff;text-decoration:none;font-weight:700;letter-spacing:-.02em;font-size:1.1rem}
        .logo span{color:#93CB5C}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}

        .hero{background:#1F3D2B;color:#fff;padding:64px 28px 40px;text-align:center}
        .hero h1{font-size:clamp(2rem,5vw,3rem);font-weight:700;letter-spacing:-.04em;line-height:1.1;margin-bottom:14px}
        .hero h1 em{color:#93CB5C;font-style:normal}
        .hero-sub{font-size:clamp(1rem,2.5vw,1.15rem);color:rgba(255,255,255,.65);font-family:system-ui,sans-serif;line-height:1.55;max-width:560px;margin:0 auto}

        .tiers{max-width:960px;margin:0 auto;padding:48px 20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
        @media(max-width:720px){.tiers{grid-template-columns:1fr}}
        .tier{background:#fff;border:1px solid #e8e4da;border-radius:16px;padding:28px 26px;display:flex;flex-direction:column;gap:14px;position:relative}
        .tier.pro{background:#0b172f;color:#fff;border-color:rgba(74,222,128,.35);box-shadow:0 8px 24px rgba(22,163,74,.08)}
        .tier-eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7DBA47;font-family:system-ui,sans-serif}
        .tier.pro .tier-eyebrow{color:#93CB5C}
        .tier-name{font-size:1.35rem;font-weight:700;letter-spacing:-.02em;font-family:Georgia,serif;line-height:1.1}
        .tier.pro .tier-name{color:#fff}
        .tier-price{display:flex;align-items:baseline;gap:6px}
        .tier-price-big{font-size:2.4rem;font-weight:700;color:#1F3D2B;letter-spacing:-.03em;line-height:1;font-family:Georgia,serif}
        .tier.pro .tier-price-big{color:#fff}
        .tier-price-period{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif}
        .tier.pro .tier-price-period{color:rgba(255,255,255,.55)}
        .tier-anchor{font-size:.82rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.5}
        .tier.pro .tier-anchor{color:rgba(255,255,255,.7)}
        .tier-anchor strong{color:#7DBA47;font-weight:700}
        .tier.pro .tier-anchor strong{color:#93CB5C}
        .tier-headline{font-size:.95rem;font-weight:600;color:#374151;font-family:system-ui,sans-serif;line-height:1.5}
        .tier.pro .tier-headline{color:rgba(255,255,255,.8)}
        ul.tier-features{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px}
        ul.tier-features li{display:flex;gap:8px;align-items:flex-start;font-size:.86rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.5}
        .tier.pro ul.tier-features li{color:rgba(255,255,255,.82)}
        .check{color:#7DBA47;font-weight:700;flex-shrink:0}
        .tier.pro .check{color:#93CB5C}
        .testimonial{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.22);border-radius:10px;padding:14px 16px;margin-top:6px}
        .tier:not(.pro) .testimonial{background:#F2F8E9;border-color:#C7E5A8}
        .testimonial blockquote{font-family:Georgia,serif;font-style:italic;font-size:.92rem;line-height:1.5;color:inherit;margin:0;opacity:.88}
        .testimonial figcaption{font-family:system-ui,sans-serif;font-size:.74rem;color:rgba(255,255,255,.55);margin-top:8px}
        .tier:not(.pro) .testimonial figcaption{color:#7DBA47}
        .tier.pro .testimonial figcaption strong{color:#fff}

        .cta{display:inline-block;padding:13px 22px;border-radius:10px;font-family:system-ui,sans-serif;font-weight:700;font-size:.95rem;text-decoration:none;text-align:center;transition:all .15s;cursor:pointer;border:none;width:100%}
        .cta-free{background:#1F3D2B;color:#fff}
        .cta-free:hover{background:#2A4F38}
        .cta-pro{background:#7DBA47;color:#fff}
        .cta-pro:hover{background:#6BA63B}
        .cta-pro:disabled{opacity:.7;cursor:not-allowed}

        .feels{max-width:760px;margin:24px auto 0;padding:48px 24px}
        .feels h2{font-size:clamp(1.5rem,3.5vw,2rem);font-weight:700;letter-spacing:-.03em;line-height:1.15;margin-bottom:24px;font-family:Georgia,serif}
        .feels p{font-family:Georgia,serif;font-size:1.02rem;line-height:1.7;color:#374151;margin-bottom:20px}
        .feels p em{color:#7DBA47;font-style:normal;font-weight:700}
        .feels p.closer{color:#1F3D2B;font-weight:600}

        .calc{max-width:640px;margin:0 auto;padding:12px 20px 64px}
      `}</style>

      <Nav variant="light" />

      <header className="hero">
        <h1>Never overpay for weed again.</h1>
        <p className="hero-sub">
          Check this before you buy. You might be leaving money on the table.
        </p>
        {alertCount !== null && alertCount > 0 && (
          <p
            style={{
              marginTop: 14,
              fontSize: ".85rem",
              color: "rgba(255,255,255,.65)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <span style={{ color: "#93CB5C", fontWeight: 700 }}>
              {alertCount.toLocaleString()}
            </span>{" "}
            {alertCount === 1 ? "person is" : "people are"} already getting deal alerts in Central Illinois.
          </p>
        )}
      </header>

      <section className="tiers">
        {/* FREE */}
        <article className="tier">
          <div className="tier-eyebrow">Free · no account</div>
          <div className="tier-name">Start here</div>
          <div className="tier-price">
            <span className="tier-price-big">$0</span>
            <span className="tier-price-period">forever</span>
          </div>
          <p className="tier-anchor">No account, no friction, forever. Actually free — not a trial.</p>
          <ul className="tier-features">
            {FREE_FEATURES.map((f) => (
              <li key={f}><span className="check">✓</span>{f}</li>
            ))}
          </ul>
          <div style={{ flex: 1 }} />
          <Link href="/deals/all" className="cta cta-free">Start using free →</Link>
        </article>

        {/* PRO */}
        <article className="tier pro">
          <div className="tier-eyebrow">Pro · $0.99/month</div>
          <div className="tier-name">Pay to stop missing deals.</div>
          <div className="tier-price">
            <span className="tier-price-big">$0.99</span>
            <span className="tier-price-period">/month</span>
          </div>
          <p className="tier-anchor">
            <strong>$0.99/month. That&apos;s it.</strong>
          </p>
          <ul className="tier-features">
            {PRO_FEATURES.map((f) => (
              <li key={f}><span className="check">✓</span>{f}</li>
            ))}
          </ul>
          <figure className="testimonial">
            <blockquote>&ldquo;Got a text Tuesday morning, saved $22 on my lunch break. Worth every penny.&rdquo;</blockquote>
            <figcaption>— <strong>J.R., Chicago IL</strong></figcaption>
          </figure>
          <div style={{ flex: 1 }} />
          <ProCheckoutButton />
        </article>
      </section>

      <section className="feels">
        <h2>What Pro actually feels like</h2>
        <p>
          You&apos;re about to drive to a dispensary. Your phone buzzes. <em>&ldquo;Zen Leaf just posted 30% off
          vapes — 6 minutes away.&rdquo;</em> You save $18. That&apos;s Pro.
        </p>
        <p>
          You paid $35 for an eighth last month. You told us. This week we texted you: <em>&ldquo;Same strain,
          $27, two miles away.&rdquo;</em> That&apos;s Pro.
        </p>
        <p className="closer">
          Monday morning. Your digest lands. <em>&ldquo;Best deals near you this week.&rdquo;</em> You pick one.
          You go. You save money you didn&apos;t know you were losing. That&apos;s Pro.
        </p>
      </section>

      <section className="calc">
        <AlertsCalculator />
      </section>
      <Footer />
    </>
  );
}
