import { Metadata } from "next";
import Link from "next/link";
import Nav from "../../../components/Nav";
import Footer from "../../../components/Footer";

export const metadata: Metadata = {
  title: "Illinois Cannabis Laws 2026 — What's Legal Now",
  description: "Illinois cannabis laws for 2026: legal age, the new doubled possession limits, where you can smoke, driving rules, drive-thru and medical changes.",
  alternates: { canonical: "https://www.puffprice.com/cannabis/illinois/laws" },
  openGraph: {
    title: "Illinois Cannabis Laws 2026 — Complete Guide",
    description: "Everything you need to know about Illinois cannabis laws. Possession limits, consumption rules, driving, and more.",
    url: "https://www.puffprice.com/cannabis/illinois/laws",
    siteName: "PuffPrice",
    type: "article",
  },
  robots: { index: true, follow: true },
};

const faqSchema = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is cannabis legal in Illinois?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Illinois legalized recreational cannabis on January 1, 2020 under the Cannabis Regulation and Tax Act. Adults 21 and older can legally purchase, possess, and consume cannabis from licensed dispensaries throughout Illinois." },
    },
    {
      "@type": "Question",
      name: "How much cannabis can you possess in Illinois?",
      acceptedAnswer: { "@type": "Answer", text: "Since June 12, 2026 (SB 3222), Illinois residents may possess up to 60 grams of cannabis flower, 1,000 milligrams of THC in cannabis-infused products, and 10 grams of cannabis concentrate. Non-residents are limited to half those amounts (30 g, 500 mg, 5 g)." },
    },
    {
      "@type": "Question",
      name: "Can you smoke cannabis in public in Illinois?",
      acceptedAnswer: { "@type": "Answer", text: "No. Public consumption of cannabis is illegal in Illinois, including parks, sidewalks, restaurants, bars, and vehicles. Cannabis can only be consumed in private residences where the property owner permits it." },
    },
    {
      "@type": "Question",
      name: "Can you drive after using cannabis in Illinois?",
      acceptedAnswer: { "@type": "Answer", text: "No. Driving under the influence of cannabis is illegal in Illinois. The legal limit is 5 nanograms of THC per milliliter of blood." },
    },
  ],
});

export default function IllinoisLawsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .laws-root { min-height: 100vh; background: var(--pp-paper); font-family:var(--font-display), system-ui, sans-serif; }
        .laws-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background:var(--pp-surface); border-bottom:1px solid var(--pp-border); position: sticky; top: 0; z-index: 50; }
        .laws-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .laws-nav-dot { width: 10px; height: 10px; border-radius: 50%; background:var(--pp-signal-fill); display: inline-block; }
        .laws-nav-name { font-size: 1.1rem; font-weight: 700; color:var(--pp-ink); letter-spacing: -0.02em; }
        .laws-nav-accent { color:var(--pp-signal); }
        .laws-nav-back { font-size: 0.85rem; color:var(--pp-muted); text-decoration: none; font-family: var(--font-body); }
        .laws-breadcrumb { padding: 12px 32px; background:var(--pp-surface); border-bottom:1px solid var(--pp-border); font-size: 0.8rem; font-family: var(--font-body); color:var(--pp-muted); display: flex; gap: 8px; }
        .laws-breadcrumb a { color:var(--pp-muted); text-decoration: none; }
        .laws-inner { max-width: 800px; margin: 0 auto; padding: 40px 24px 80px; }
        .laws-label { font-size: 0.72rem; font-family: var(--font-body); font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color:var(--pp-signal); margin-bottom: 12px; }
        .laws-h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; color:var(--pp-ink); letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 16px; }
        .laws-intro { font-size: 1.05rem; color:var(--pp-body); font-family: var(--font-body); line-height: 1.75; margin-bottom: 40px; padding-bottom: 32px; border-bottom:1px solid var(--pp-border); }
        .laws-updated { display: inline-flex; align-items: center; gap: 6px; background:var(--pp-best-tint); border:1px solid var(--pp-best-border); border-radius: 100px; padding: 4px 12px; font-size: 0.75rem; font-family: var(--font-body); color:var(--pp-signal-ink); font-weight: 600; margin-bottom: 20px; }
        .laws-section { margin-bottom: 48px; }
        .laws-h2 { font-size: 1.5rem; font-weight: 700; color:var(--pp-ink); letter-spacing: -0.02em; margin-bottom: 16px; }
        .laws-p { font-size: 0.95rem; color:var(--pp-body); font-family: var(--font-body); line-height: 1.8; margin-bottom: 16px; }
        .laws-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-radius: 12px; overflow: hidden; }
        .laws-table th { background:var(--pp-best-tint); color:var(--pp-ink); font-size: 0.8rem; font-family: var(--font-body); font-weight: 700; padding: 12px 16px; text-align: left; }
        .laws-table td { font-size: 0.875rem; font-family: var(--font-body); color:var(--pp-body); padding: 12px 16px; border-bottom:1px solid var(--pp-border); }
        .laws-table tr:nth-child(even) td { background: var(--pp-paper); }
        .laws-ok { background:var(--pp-best-tint); border-left:4px solid var(--pp-signal-fill); border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 16px; }
        .laws-ok-title { font-size: 0.8rem; font-family: var(--font-body); font-weight: 700; color:var(--pp-signal-ink); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .laws-ok-text { font-size: 0.875rem; color:var(--pp-signal); font-family: var(--font-body); line-height: 1.6; }
        .laws-no { background:var(--pp-stop-bg); border-left:4px solid var(--pp-stop-edge); border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 16px; }
        .laws-no-title { font-size: 0.8rem; font-family: var(--font-body); font-weight: 700; color:var(--pp-stop-fg); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .laws-no-text { font-size: 0.875rem; color:var(--pp-stop-fg); font-family: var(--font-body); line-height: 1.6; }
        .laws-warn { background:var(--pp-note-bg); border-left:4px solid var(--pp-note-edge); border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 16px; }
        .laws-warn-title { font-size: 0.8rem; font-family: var(--font-body); font-weight: 700; color:var(--pp-note-fg); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .laws-warn-text { font-size: 0.875rem; color:var(--pp-note-fg); font-family: var(--font-body); line-height: 1.6; }
        .laws-faq-item { border-bottom:1px solid var(--pp-border); padding: 20px 0; }
        .laws-faq-q { font-size: 1rem; font-weight: 700; color:var(--pp-ink); margin-bottom: 8px; line-height: 1.4; }
        .laws-faq-a { font-size: 0.9rem; color:var(--pp-body); font-family: var(--font-body); line-height: 1.7; }
        .laws-cta { background:var(--pp-canopy); border-radius: 16px; padding: 32px; text-align: center; margin-top: 48px; }
        .laws-cta-title { font-size: 1.3rem; font-weight: 700; color:var(--pp-on-dark); margin-bottom: 10px; }
        .laws-cta-sub { font-size: 0.875rem; color:var(--pp-canopy-eyebrow); font-family: var(--font-body); margin-bottom: 20px; }
        .laws-cta-btn { display: inline-block; background:var(--pp-signal-fill); color:var(--pp-on-dark); padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: var(--font-body); font-weight: 700; font-size: 0.9rem; }
        .laws-footer { background:var(--pp-canopy); padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 80px; }
        .laws-footer-brand { font-size: 1rem; font-weight: 700; color:var(--pp-on-dark); font-family:var(--font-display), system-ui, sans-serif; }
        .laws-footer-note { font-size: 0.78rem; color:var(--pp-body); font-family: var(--font-body); }
        @media (max-width: 768px) { .laws-nav { padding: 14px 20px; } .laws-breadcrumb { padding: 10px 20px; } .laws-inner { padding: 24px 16px 60px; } }
      `}</style>
      <div className="laws-root">
        <Nav variant="light" />
        <div className="laws-breadcrumb">
          <Link href="/">Home</Link><span>›</span>
          <Link href="/cannabis">Cannabis</Link><span>›</span>
          <Link href="/">Central IL</Link><span>›</span>
          <span style={{ color: "var(--pp-body)" }}>Laws</span>
        </div>
        <div className="laws-inner">
          <span className="laws-updated">✓ Updated September 2026</span>
          <p className="laws-label">Illinois Cannabis Guide</p>
          <h1 className="laws-h1">Illinois Cannabis Laws — Complete Guide</h1>
          <p className="laws-intro">Illinois legalized adult-use cannabis on January 1, 2020 under the Cannabis Regulation and Tax Act. This guide covers what is legal, what is not, possession limits, consumption rules, and penalties.</p>
          <div className="laws-section">
            <h2 className="laws-h2">What changed in 2026</h2>
            <ul className="laws-p" style={{ paddingLeft: 18, lineHeight: 1.7 }}>
              <li><strong>Drive-thru is legal</strong> (SB 3222, signed June 12, 2026) once IDFPR approves a store&apos;s setup. <Link href="/drive-thru">Who has one in Central Illinois →</Link></li>
              <li><strong>Stores may stay open until 2 a.m.</strong> with city approval. <Link href="/open-late">Who&apos;s open latest tonight →</Link></li>
              <li><strong>Possession limits doubled</strong> — 60 g flower, 1,000 mg infused, 10 g concentrate for residents.</li>
              <li><strong>Every dispensary can add medical sales</strong> (IDFPR began issuing licenses Sept 10, 2026). <Link href="/medical">Central IL medical dispensaries →</Link></li>
              <li><strong>Delta-8 and other intoxicating hemp leave gas stations and smoke shops</strong> on Nov 12, 2026. <Link href="/illinois-hemp-law">What changes →</Link></li>
              <li><strong>Delivery is still not legal.</strong> <Link href="/illinois-cannabis-delivery">Where the delivery bills stand →</Link></li>
            </ul>
          </div>
          <div className="laws-section">
            <h2 className="laws-h2">Is Cannabis Legal in Illinois?</h2>
            <div className="laws-ok">
              <p className="laws-ok-title">Legal for adults 21+</p>
              <p className="laws-ok-text">Yes. Adults 21 and older can legally purchase, possess, and consume cannabis in Illinois from any licensed dispensary. No medical card required.</p>
            </div>
            <p className="laws-p">Cannabis remains federally illegal. Illinois law only protects you within the state and does not override federal law on federal property including airports, national parks, and federal buildings.</p>
          </div>
          <div className="laws-section">
            <h2 className="laws-h2">Possession Limits</h2>
            <table className="laws-table">
              <thead><tr><th>Product Type</th><th>Illinois Residents</th><th>Out-of-State Visitors</th></tr></thead>
              <tbody>
                <tr><td>Cannabis flower</td><td>60 grams</td><td>30 grams</td></tr>
                <tr><td>THC in infused products</td><td>1,000mg</td><td>500mg</td></tr>
                <tr><td>Cannabis concentrate</td><td>10 grams</td><td>5 grams</td></tr>
              </tbody>
            </table>
            <div className="laws-warn">
              <p className="laws-warn-title">Over the limit</p>
              <p className="laws-warn-text">Limits doubled on June 12, 2026 (SB 3222). Possessing more than the limit is a civil or criminal offense depending on the amount.</p>
            </div>
          </div>
          <div className="laws-section">
            <h2 className="laws-h2">Where You Can and Cannot Consume</h2>
            <div className="laws-ok">
              <p className="laws-ok-title">Legal</p>
              <p className="laws-ok-text">Private residences where the property owner permits it. Licensed cannabis consumption lounges where authorized by local municipalities.</p>
            </div>
            <div className="laws-no">
              <p className="laws-no-title">Illegal</p>
              <p className="laws-no-text">Public places, parks, sidewalks, restaurants, bars, vehicles, schools, federal property, and anywhere tobacco smoking is prohibited.</p>
            </div>
          </div>
          <div className="laws-section">
            <h2 className="laws-h2">Cannabis and Driving</h2>
            <div className="laws-no">
              <p className="laws-no-title">DUI laws apply to cannabis</p>
              <p className="laws-no-text">Driving under the influence of cannabis is illegal. The legal limit is 5 nanograms of THC per milliliter of whole blood. Cannabis must be stored in a sealed container in the trunk when transported.</p>
            </div>
          </div>
          <div className="laws-section">
            <h2 className="laws-h2">Taxes on Cannabis in Illinois</h2>
            <table className="laws-table">
              <thead><tr><th>Product</th><th>State Excise Tax</th></tr></thead>
              <tbody>
                <tr><td>Flower under 35% THC</td><td>10%</td></tr>
                <tr><td>Flower over 35% THC</td><td>25%</td></tr>
                <tr><td>Infused products (edibles)</td><td>20%</td></tr>
              </tbody>
            </table>
            <p className="laws-p">Regular Illinois sales tax (6.25% + local) also applies on top of the excise tax. Effective total tax rates typically run 20–35%.</p>
          </div>
          <div className="laws-section">
            <h2 className="laws-h2">Home Cultivation</h2>
            <div className="laws-warn">
              <p className="laws-warn-title">Medical patients only</p>
              <p className="laws-warn-text">Home cultivation is NOT legal for recreational users. Only registered medical cannabis patients may grow up to 5 plants. Growing without a medical card is a criminal offense.</p>
            </div>
          </div>
          <div className="laws-section">
            <h2 className="laws-h2">Frequently Asked Questions</h2>
            <div className="laws-faq-item">
              <p className="laws-faq-q">Can I bring cannabis from Illinois to another state?</p>
              <p className="laws-faq-a">No. Transporting cannabis across state lines is a federal crime regardless of the laws in either state. Never bring cannabis through airports or across state borders.</p>
            </div>
            <div className="laws-faq-item">
              <p className="laws-faq-q">Can tourists buy cannabis in Illinois?</p>
              <p className="laws-faq-a">Yes. Any adult 21+ with a valid government-issued ID can purchase at any Illinois licensed dispensary. Out-of-state visitors have lower possession limits than residents.</p>
            </div>
            <div className="laws-faq-item">
              <p className="laws-faq-q">Can employers drug test for cannabis?</p>
              <p className="laws-faq-a">Yes. Illinois employers can maintain drug-free workplace policies and test for cannabis. You can be disciplined or fired for failing a cannabis test, particularly in safety-sensitive positions.</p>
            </div>
            <div className="laws-faq-item">
              <p className="laws-faq-q">Is cannabis legal on college campuses?</p>
              <p className="laws-faq-a">Generally no. Most Illinois colleges prohibit cannabis on campus because they receive federal funding. Possession on campus can result in disciplinary action even though it is legal under state law.</p>
            </div>
          </div>
          <div className="laws-cta">
            <p className="laws-cta-title">Find a dispensary near you</p>
            <p className="laws-cta-sub">Browse every licensed cannabis dispensary in Central Illinois with real hours and directions.</p>
            <Link href="/dispensaries" className="laws-cta-btn">Browse Central IL dispensaries →</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
