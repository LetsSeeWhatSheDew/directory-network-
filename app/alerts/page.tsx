// app/alerts/page.tsx
// Two-tier consumer page: FREE (no account) and PRO ($0.99/month).
// Standard tier removed per GPT advice — habit beats monetization
// at this stage.

import Link from "next/link";
import AlertsCalculator from "./AlertsCalculator";
import ProCheckoutButton from "./ProCheckoutButton";

export const metadata = {
  title: "Never overpay for weed again | CleanList deal alerts",
  description:
    "Illinois cannabis deal alerts. Free forever, no account needed. Pro is $0.99/month — instant SMS the moment a deal drops near you.",
};

const FREE_FEATURES = [
  "Best deal near you right now — always",
  "Browse all 293 Illinois dispensaries",
  "Deal Score grade (A/B/C/D) on every deal",
  "Map view with deal pins",
  "Search by city or dispensary name",
  "Weekly Monday digest (just email + city, no account)",
];

const PRO_FEATURES = [
  "Everything free",
  "Instant SMS the moment a deal drops near you",
  "Daily 8am deal digest personalized to your city + categories",
  'Price history — "this eighth was $45 last week, today $28"',
  '"Beat My Last Price" alerts — set your price, we tell you when it\'s beaten',
  "Flash sale early access — 15 min before public",
  'Monthly savings report: "You saved $84 this month"',
  "Annual savings dashboard with shareable stats",
  "First to know about new dispensary openings near you",
];

export default function AlertsPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;position:sticky;top:0;z-index:100}
        .logo{color:#fff;text-decoration:none;font-weight:700;letter-spacing:-.02em;font-size:1.1rem}
        .logo span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}

        .hero{background:#0f1f3d;color:#fff;padding:64px 28px 40px;text-align:center}
        .hero h1{font-size:clamp(2rem,5vw,3rem);font-weight:700;letter-spacing:-.04em;line-height:1.1;margin-bottom:14px}
        .hero h1 em{color:#4ade80;font-style:normal}
        .hero-sub{font-size:clamp(1rem,2.5vw,1.15rem);color:rgba(255,255,255,.65);font-family:system-ui,sans-serif;line-height:1.55;max-width:560px;margin:0 auto}

        .tiers{max-width:960px;margin:0 auto;padding:48px 20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
        @media(max-width:720px){.tiers{grid-template-columns:1fr}}
        .tier{background:#fff;border:1px solid #e8e4da;border-radius:16px;padding:28px 26px;display:flex;flex-direction:column;gap:14px;position:relative}
        .tier.pro{background:#0b172f;color:#fff;border-color:rgba(74,222,128,.35);box-shadow:0 8px 24px rgba(22,163,74,.08)}
        .tier-eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif}
        .tier.pro .tier-eyebrow{color:#4ade80}
        .tier-name{font-size:1.35rem;font-weight:700;letter-spacing:-.02em;font-family:Georgia,serif;line-height:1.1}
        .tier.pro .tier-name{color:#fff}
        .tier-price{display:flex;align-items:baseline;gap:6px}
        .tier-price-big{font-size:2.4rem;font-weight:700;color:#0f1f3d;letter-spacing:-.03em;line-height:1;font-family:Georgia,serif}
        .tier.pro .tier-price-big{color:#fff}
        .tier-price-period{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif}
        .tier.pro .tier-price-period{color:rgba(255,255,255,.55)}
        .tier-anchor{font-size:.82rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.5}
        .tier.pro .tier-anchor{color:rgba(255,255,255,.7)}
        .tier-anchor strong{color:#16a34a;font-weight:700}
        .tier.pro .tier-anchor strong{color:#4ade80}
        .tier-headline{font-size:.95rem;font-weight:600;color:#374151;font-family:system-ui,sans-serif;line-height:1.5}
        .tier.pro .tier-headline{color:rgba(255,255,255,.8)}
        ul.tier-features{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px}
        ul.tier-features li{display:flex;gap:8px;align-items:flex-start;font-size:.86rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.5}
        .tier.pro ul.tier-features li{color:rgba(255,255,255,.82)}
        .check{color:#16a34a;font-weight:700;flex-shrink:0}
        .tier.pro .check{color:#4ade80}
        .testimonial{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.22);border-radius:10px;padding:14px 16px;margin-top:6px}
        .tier:not(.pro) .testimonial{background:#f0fdf4;border-color:#bbf7d0}
        .testimonial blockquote{font-family:Georgia,serif;font-style:italic;font-size:.92rem;line-height:1.5;color:inherit;margin:0;opacity:.88}
        .testimonial figcaption{font-family:system-ui,sans-serif;font-size:.74rem;color:rgba(255,255,255,.55);margin-top:8px}
        .tier:not(.pro) .testimonial figcaption{color:#16a34a}
        .tier.pro .testimonial figcaption strong{color:#fff}

        .cta{display:inline-block;padding:13px 22px;border-radius:10px;font-family:system-ui,sans-serif;font-weight:700;font-size:.95rem;text-decoration:none;text-align:center;transition:all .15s;cursor:pointer;border:none;width:100%}
        .cta-free{background:#0f1f3d;color:#fff}
        .cta-free:hover{background:#1e3a5f}
        .cta-pro{background:#16a34a;color:#fff}
        .cta-pro:hover{background:#15803d}
        .cta-pro:disabled{opacity:.7;cursor:not-allowed}

        .feels{max-width:760px;margin:24px auto 0;padding:48px 24px}
        .feels h2{font-size:clamp(1.5rem,3.5vw,2rem);font-weight:700;letter-spacing:-.03em;line-height:1.15;margin-bottom:24px;font-family:Georgia,serif}
        .feels p{font-family:Georgia,serif;font-size:1.02rem;line-height:1.7;color:#374151;margin-bottom:20px}
        .feels p em{color:#16a34a;font-style:normal;font-weight:700}
        .feels p.closer{color:#0f1f3d;font-weight:600}

        .calc{max-width:640px;margin:0 auto;padding:12px 20px 64px}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">clean<span>list</span></Link>
        <Link href="/" className="back">← Home</Link>
      </nav>

      <header className="hero">
        <h1>Never overpay for weed again.</h1>
        <p className="hero-sub">
          Check this before you buy. You might be leaving money on the table.
        </p>
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
            <strong>Less than a dollar a week.</strong> You&apos;ll save that in your first trip.
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
    </>
  );
}
