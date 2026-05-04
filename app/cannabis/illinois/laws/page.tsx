import { Metadata } from "next";
import Link from "next/link";
import Nav from "../../../components/Nav";
import Footer from "../../../components/Footer";

export const metadata: Metadata = {
  title: "Illinois Cannabis Laws 2025 — What's Legal, What's Not | PuffPrice",
  description: "Complete guide to Illinois cannabis laws. Legal age, possession limits, where you can smoke, driving rules, and what happens if you break the law. Updated for 2025.",
  alternates: { canonical: "https://www.puffprice.com/cannabis/illinois/laws" },
  openGraph: {
    title: "Illinois Cannabis Laws 2025 — Complete Guide",
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
      acceptedAnswer: { "@type": "Answer", text: "Illinois residents may possess up to 30 grams of cannabis flower, 500 milligrams of THC in cannabis-infused products, and 5 grams of cannabis concentrate. Non-residents are limited to half those amounts." },
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
        .laws-root { min-height: 100vh; background: #f7f6f2; font-family: Georgia, serif; }
        .laws-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #fff; border-bottom: 1px solid #e8e5de; position: sticky; top: 0; z-index: 50; }
        .laws-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .laws-nav-dot { width: 10px; height: 10px; border-radius: 50%; background: #16a34a; display: inline-block; }
        .laws-nav-name { font-size: 1.1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; }
        .laws-nav-accent { color: #16a34a; }
        .laws-nav-back { font-size: 0.85rem; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
        .laws-breadcrumb { padding: 12px 32px; background: #fff; border-bottom: 1px solid #f0ede6; font-size: 0.8rem; font-family: system-ui, sans-serif; color: #6b7280; display: flex; gap: 8px; }
        .laws-breadcrumb a { color: #6b7280; text-decoration: none; }
        .laws-inner { max-width: 800px; margin: 0 auto; padding: 40px 24px 80px; }
        .laws-label { font-size: 0.72rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #16a34a; margin-bottom: 12px; }
        .laws-h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 16px; }
        .laws-intro { font-size: 1.05rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.75; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid #e8e5de; }
        .laws-updated { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 12px; font-size: 0.75rem; font-family: system-ui, sans-serif; color: #14532d; font-weight: 600; margin-bottom: 20px; }
        .laws-section { margin-bottom: 48px; }
        .laws-h2 { font-size: 1.5rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; margin-bottom: 16px; }
        .laws-p { font-size: 0.95rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.8; margin-bottom: 16px; }
        .laws-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-radius: 12px; overflow: hidden; }
        .laws-table th { background: #0f1f3d; color: #fff; font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 700; padding: 12px 16px; text-align: left; }
        .laws-table td { font-size: 0.875rem; font-family: system-ui, sans-serif; color: #374151; padding: 12px 16px; border-bottom: 1px solid #f0ede6; }
        .laws-table tr:nth-child(even) td { background: #f7f6f2; }
        .laws-ok { background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 16px; }
        .laws-ok-title { font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 700; color: #14532d; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .laws-ok-text { font-size: 0.875rem; color: #166534; font-family: system-ui, sans-serif; line-height: 1.6; }
        .laws-no { background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 16px; }
        .laws-no-title { font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .laws-no-text { font-size: 0.875rem; color: #991b1b; font-family: system-ui, sans-serif; line-height: 1.6; }
        .laws-warn { background: #fffbeb; border-left: 4px solid #d97706; border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 16px; }
        .laws-warn-title { font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .laws-warn-text { font-size: 0.875rem; color: #92400e; font-family: system-ui, sans-serif; line-height: 1.6; }
        .laws-faq-item { border-bottom: 1px solid #e8e5de; padding: 20px 0; }
        .laws-faq-q { font-size: 1rem; font-weight: 700; color: #0f1f3d; margin-bottom: 8px; line-height: 1.4; }
        .laws-faq-a { font-size: 0.9rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.7; }
        .laws-cta { background: #0f1f3d; border-radius: 16px; padding: 32px; text-align: center; margin-top: 48px; }
        .laws-cta-title { font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .laws-cta-sub { font-size: 0.875rem; color: #94a3b8; font-family: system-ui, sans-serif; margin-bottom: 20px; }
        .laws-cta-btn { display: inline-block; background: #16a34a; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 700; font-size: 0.9rem; }
        .laws-footer { background: #0f1f3d; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 80px; }
        .laws-footer-brand { font-size: 1rem; font-weight: 700; color: #fff; font-family: Georgia, serif; }
        .laws-footer-note { font-size: 0.78rem; color: #475569; font-family: system-ui, sans-serif; }
        @media (max-width: 768px) { .laws-nav { padding: 14px 20px; } .laws-breadcrumb { padding: 10px 20px; } .laws-inner { padding: 24px 16px 60px; } }
      `}</style>
      <div className="laws-root">
        <Nav variant="light" />
        <div className="laws-breadcrumb">
          <Link href="/">Home</Link><span>›</span>
          <Link href="/cannabis">Cannabis</Link><span>›</span>
          <Link href="/">Central IL</Link><span>›</span>
          <span style={{ color: "#374151" }}>Laws</span>
        </div>
        <div className="laws-inner">
          <span className="laws-updated">✓ Updated April 2026</span>
          <p className="laws-label">Illinois Cannabis Guide</p>
          <h1 className="laws-h1">Illinois Cannabis Laws — Complete Guide</h1>
          <p className="laws-intro">Illinois legalized adult-use cannabis on January 1, 2020 under the Cannabis Regulation and Tax Act. This guide covers what is legal, what is not, possession limits, consumption rules, and penalties.</p>
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
                <tr><td>Cannabis flower</td><td>30 grams</td><td>15 grams</td></tr>
                <tr><td>THC in infused products</td><td>500mg</td><td>250mg</td></tr>
                <tr><td>Cannabis concentrate</td><td>5 grams</td><td>2.5 grams</td></tr>
              </tbody>
            </table>
            <div className="laws-warn">
              <p className="laws-warn-title">Over the limit</p>
              <p className="laws-warn-text">Possessing between 30–100 grams is a civil infraction up to $200. Over 100 grams is a criminal offense.</p>
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
