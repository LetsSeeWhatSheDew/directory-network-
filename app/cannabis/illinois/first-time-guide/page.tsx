import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "First Time Buying Cannabis in Illinois — Complete Beginner's Guide | PuffPrice",
  description: "Everything first-time cannabis buyers need to know in Illinois. Laws, what to bring, how much you can buy, what to expect, and where to find dispensaries near you.",
  alternates: { canonical: "https://www.puffprice.com/cannabis/illinois/first-time-guide" },
  openGraph: {
    title: "First Time Buying Cannabis in Illinois — Complete Guide",
    description: "Everything first-time buyers need to know: Illinois cannabis laws, what to bring, how much you can buy, and where to find dispensaries.",
    url: "https://www.puffprice.com/cannabis/illinois/first-time-guide",
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
      name: "Can I buy cannabis in Illinois without a medical card?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Illinois legalized recreational cannabis for adults 21 and older in January 2020. You do not need a medical card to purchase cannabis at any licensed recreational dispensary in Illinois.",
      },
    },
    {
      "@type": "Question",
      name: "What ID do I need to buy cannabis in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You need a valid, government-issued photo ID proving you are 21 or older. Acceptable forms include a driver's license, state ID, passport, or military ID. Expired IDs are not accepted.",
      },
    },
    {
      "@type": "Question",
      name: "How much cannabis can I buy at once in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Illinois residents can purchase up to 30 grams of cannabis flower, 500 milligrams of THC in cannabis-infused products, or 5 grams of cannabis concentrate per transaction. Out-of-state visitors are limited to half those amounts.",
      },
    },
    {
      "@type": "Question",
      name: "Can tourists buy cannabis in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Anyone 21 or older with a valid government-issued ID can purchase cannabis at Illinois dispensaries, regardless of what state or country they are from. Out-of-state visitors have lower possession limits than Illinois residents.",
      },
    },
    {
      "@type": "Question",
      name: "Where can I smoke cannabis in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cannabis can be consumed in private residences where the property owner permits it. Public consumption is illegal in Illinois, including parks, sidewalks, and vehicles. Some municipalities have cannabis lounges or social consumption spaces.",
      },
    },
    {
      "@type": "Question",
      name: "How much does cannabis cost in Illinois?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Prices vary by product type and quality. Flower typically ranges from $30–$60 per eighth (3.5 grams). Edibles usually cost $15–$30 for a 10-piece pack. Vape cartridges range from $35–$65. Many dispensaries offer first-time customer discounts of 10–25%.",
      },
    },
  ],
});

export default function FirstTimeGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .guide-root { min-height: 100vh; background: #f7f6f2; font-family: Georgia, 'Times New Roman', serif; }
        .guide-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #fff; border-bottom: 1px solid #e8e5de; position: sticky; top: 0; z-index: 50; }
        .guide-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .guide-nav-dot { width: 10px; height: 10px; border-radius: 50%; background: #16a34a; display: inline-block; }
        .guide-nav-name { font-size: 1.1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; }
        .guide-nav-accent { color: #16a34a; }
        .guide-nav-back { font-size: 0.85rem; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
        .guide-breadcrumb { padding: 12px 32px; background: #fff; border-bottom: 1px solid #f0ede6; font-size: 0.8rem; font-family: system-ui, sans-serif; color: #6b7280; display: flex; gap: 8px; }
        .guide-breadcrumb a { color: #6b7280; text-decoration: none; }
        .guide-inner { max-width: 800px; margin: 0 auto; padding: 40px 24px 80px; }
        .guide-label { font-size: 0.72rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #16a34a; margin-bottom: 12px; }
        .guide-h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 16px; }
        .guide-intro { font-size: 1.05rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.75; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid #e8e5de; }
        .guide-toc { background: #fff; border-radius: 14px; border: 1px solid #e8e5de; padding: 24px; margin-bottom: 40px; }
        .guide-toc-title { font-size: 0.75rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 12px; }
        .guide-toc-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .guide-toc-item a { font-size: 0.9rem; font-family: system-ui, sans-serif; color: #16a34a; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .guide-toc-item a:hover { text-decoration: underline; }
        .guide-section { margin-bottom: 48px; }
        .guide-h2 { font-size: 1.5rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; margin-bottom: 16px; padding-top: 8px; }
        .guide-p { font-size: 0.95rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.8; margin-bottom: 16px; }
        .guide-callout { background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 20px; }
        .guide-callout-title { font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 700; color: #14532d; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .guide-callout-text { font-size: 0.875rem; color: #166534; font-family: system-ui, sans-serif; line-height: 1.6; }
        .guide-warning { background: #fffbeb; border-left: 4px solid #d97706; border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 20px; }
        .guide-warning-title { font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .guide-warning-text { font-size: 0.875rem; color: #92400e; font-family: system-ui, sans-serif; line-height: 1.6; }
        .guide-list { list-style: none; margin: 0 0 20px; display: flex; flex-direction: column; gap: 10px; }
        .guide-list-item { font-size: 0.95rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.6; padding-left: 20px; position: relative; }
        .guide-list-item::before { content: "✓"; position: absolute; left: 0; color: #16a34a; font-weight: 700; }
        .guide-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .guide-table th { background: #0f1f3d; color: #fff; font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 700; padding: 10px 14px; text-align: left; }
        .guide-table td { font-size: 0.875rem; font-family: system-ui, sans-serif; color: #374151; padding: 10px 14px; border-bottom: 1px solid #f0ede6; }
        .guide-table tr:nth-child(even) td { background: #f7f6f2; }
        .guide-faq { margin-bottom: 48px; }
        .guide-faq-item { border-bottom: 1px solid #e8e5de; padding: 20px 0; }
        .guide-faq-q { font-size: 1rem; font-weight: 700; color: #0f1f3d; margin-bottom: 8px; line-height: 1.4; }
        .guide-faq-a { font-size: 0.9rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.7; }
        .guide-cta { background: #0f1f3d; border-radius: 16px; padding: 32px; text-align: center; margin-top: 48px; }
        .guide-cta-title { font-size: 1.4rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; margin-bottom: 10px; }
        .guide-cta-sub { font-size: 0.9rem; color: #94a3b8; font-family: system-ui, sans-serif; margin-bottom: 20px; }
        .guide-cta-btn { display: inline-block; background: #16a34a; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 700; font-size: 0.9rem; }
        .guide-footer { background: #0f1f3d; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 80px; }
        .guide-footer-brand { font-size: 1rem; font-weight: 700; color: #fff; font-family: Georgia, serif; }
        .guide-footer-note { font-size: 0.78rem; color: #475569; font-family: system-ui, sans-serif; }
        @media (max-width: 768px) {
          .guide-nav { padding: 14px 20px; }
          .guide-breadcrumb { padding: 10px 20px; }
          .guide-inner { padding: 24px 16px 60px; }
        }
      `}</style>

      <div className="guide-root">
        <nav className="guide-nav">
          <Link href="/" className="guide-nav-brand">
            <span className="guide-nav-dot" />
            <span className="guide-nav-name">puff<span className="guide-nav-accent">price</span></span>
          </Link>
          <Link href="/" className="guide-nav-back">← Central IL</Link>
        </nav>

        <div className="guide-breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/cannabis">Cannabis</Link>
          <span>›</span>
          <Link href="/">Central IL</Link>
          <span>›</span>
          <span style={{ color: "#374151" }}>First-Time Guide</span>
        </div>

        <div className="guide-inner">
          <p className="guide-label">Illinois Cannabis Guide</p>
          <h1 className="guide-h1">First Time Buying Cannabis in Illinois</h1>
          <p className="guide-intro">
            Illinois legalized recreational cannabis in January 2020, making it one of the most
            accessible states for adult cannabis consumers. Whether you&apos;re a lifelong Illinois
            resident or visiting from out of state, this guide covers everything you need to walk
            into a dispensary with confidence.
          </p>

          <div className="guide-toc">
            <p className="guide-toc-title">In this guide</p>
            <ul className="guide-toc-list">
              <li className="guide-toc-item"><a href="#laws">→ Illinois cannabis laws</a></li>
              <li className="guide-toc-item"><a href="#what-to-bring">→ What to bring to the dispensary</a></li>
              <li className="guide-toc-item"><a href="#how-much">→ How much can you buy</a></li>
              <li className="guide-toc-item"><a href="#what-to-expect">→ What to expect inside</a></li>
              <li className="guide-toc-item"><a href="#prices">→ What things cost</a></li>
              <li className="guide-toc-item"><a href="#tourists">→ For out-of-state visitors</a></li>
              <li className="guide-toc-item"><a href="#faq">→ Frequently asked questions</a></li>
              <li className="guide-toc-item"><a href="#find">→ Find dispensaries near you</a></li>
            </ul>
          </div>

          <div id="laws" className="guide-section">
            <h2 className="guide-h2">Illinois Cannabis Laws</h2>
            <p className="guide-p">
              The Cannabis Regulation and Tax Act took effect January 1, 2020, legalizing adult-use
              cannabis throughout Illinois. Here&apos;s what the law says:
            </p>
            <div className="guide-callout">
              <p className="guide-callout-title">Legal age</p>
              <p className="guide-callout-text">You must be 21 or older to purchase, possess, or consume cannabis in Illinois.</p>
            </div>
            <div className="guide-callout">
              <p className="guide-callout-title">Where you can consume</p>
              <p className="guide-callout-text">Private residences where the owner permits it. Public consumption — including parks, sidewalks, cars, and most businesses — is illegal and subject to fines.</p>
            </div>
            <div className="guide-warning">
              <p className="guide-warning-title">Federal property</p>
              <p className="guide-warning-text">Cannabis remains federally illegal. Never bring cannabis onto federal property including national parks, federal buildings, or airports — even if you purchased it legally in Illinois.</p>
            </div>
          </div>

          <div id="what-to-bring" className="guide-section">
            <h2 className="guide-h2">What to Bring to the Dispensary</h2>
            <p className="guide-p">Every dispensary in Illinois is required by law to verify your age before allowing you to purchase. Bring one of the following:</p>
            <ul className="guide-list">
              <li className="guide-list-item">Driver&apos;s license (Illinois or any other state)</li>
              <li className="guide-list-item">State-issued ID card</li>
              <li className="guide-list-item">U.S. passport or passport card</li>
              <li className="guide-list-item">Military ID</li>
              <li className="guide-list-item">Permanent Resident Card (Green Card)</li>
            </ul>
            <div className="guide-warning">
              <p className="guide-warning-title">Expired IDs will not be accepted</p>
              <p className="guide-warning-text">Even if your ID shows you are clearly over 21, expired identification is not accepted at any Illinois dispensary. Make sure your ID is current.</p>
            </div>
            <p className="guide-p">
              <strong>Cash or debit card:</strong> Many Illinois dispensaries are cash-preferred due
              to federal banking restrictions. Most have ATMs on-site. Some accept debit cards with
              a small processing fee. Credit cards are rarely accepted. Check the dispensary listing
              before you go.
            </p>
          </div>

          <div id="how-much" className="guide-section">
            <h2 className="guide-h2">How Much Cannabis Can You Buy</h2>
            <p className="guide-p">Illinois law sets purchase limits per transaction. The limits differ for residents and visitors:</p>
            <table className="guide-table">
              <thead>
                <tr>
                  <th>Product Type</th>
                  <th>Illinois Residents</th>
                  <th>Out-of-State Visitors</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cannabis flower</td>
                  <td>30 grams</td>
                  <td>15 grams</td>
                </tr>
                <tr>
                  <td>THC in infused products</td>
                  <td>500mg</td>
                  <td>250mg</td>
                </tr>
                <tr>
                  <td>Cannabis concentrate</td>
                  <td>5 grams</td>
                  <td>2.5 grams</td>
                </tr>
              </tbody>
            </table>
            <p className="guide-p">
              These are per-transaction limits. There is no limit on how many times you can visit
              a dispensary per day, though purchasing more than the daily limit is a violation of
              Illinois law.
            </p>
          </div>

          <div id="what-to-expect" className="guide-section">
            <h2 className="guide-h2">What to Expect Inside a Dispensary</h2>
            <p className="guide-p">
              Illinois dispensaries are professional, regulated retail environments — more like an
              Apple Store than what you might imagine. Here&apos;s the typical experience:
            </p>
            <ul className="guide-list">
              <li className="guide-list-item">Check-in at the front desk where your ID is verified. This is required by law.</li>
              <li className="guide-list-item">A staff member (often called a Budtender or Cannabis Advisor) will help you navigate the menu and answer questions.</li>
              <li className="guide-list-item">Products are typically displayed in cases or on screens — you can&apos;t open or smell most products before purchase.</li>
              <li className="guide-list-item">First-time visitors often receive a welcome packet with information about products and a discount off their first purchase.</li>
              <li className="guide-list-item">Payment at the register — cash, debit, or ATM. Receipt provided.</li>
              <li className="guide-list-item">Products are packaged in child-resistant, labeled containers. Keep them sealed during transport.</li>
            </ul>
            <div className="guide-callout">
              <p className="guide-callout-title">Don&apos;t be afraid to ask questions</p>
              <p className="guide-callout-text">Budtenders are trained to help beginners. Tell them it&apos;s your first time and what effect you&apos;re looking for — they&apos;ll recommend the right product and dose.</p>
            </div>
          </div>

          <div id="prices" className="guide-section">
            <h2 className="guide-h2">What Things Cost in Illinois</h2>
            <p className="guide-p">Cannabis prices in Illinois are among the higher in the country due to state taxes. Illinois adds a 10–25% excise tax on top of regular sales tax, depending on THC content.</p>
            <table className="guide-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Typical Price Range</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Flower — 1 gram</td><td>$12–$18</td></tr>
                <tr><td>Flower — 3.5 grams (eighth)</td><td>$35–$65</td></tr>
                <tr><td>Pre-roll — single</td><td>$8–$15</td></tr>
                <tr><td>Vape cartridge — .5g</td><td>$25–$50</td></tr>
                <tr><td>Edibles — 10-pack (100mg total)</td><td>$20–$35</td></tr>
                <tr><td>Concentrate — 1 gram</td><td>$40–$80</td></tr>
              </tbody>
            </table>
            <div className="guide-callout">
              <p className="guide-callout-title">First-time discount</p>
              <p className="guide-callout-text">Many Illinois dispensaries offer 10–25% off your first purchase. Ask when you check in — most dispensaries don&apos;t advertise it at the door.</p>
            </div>
          </div>

          <div id="tourists" className="guide-section">
            <h2 className="guide-h2">For Out-of-State Visitors</h2>
            <p className="guide-p">
              Illinois welcomes cannabis tourists. Any adult 21+ with a valid ID can purchase at
              any licensed dispensary — your home state&apos;s laws don&apos;t matter here.
            </p>
            <div className="guide-warning">
              <p className="guide-warning-title">Do not take cannabis across state lines</p>
              <p className="guide-warning-text">Transporting cannabis across state lines is a federal crime, even between two states where cannabis is legal. Consume what you purchase in Illinois before you leave.</p>
            </div>
            <p className="guide-p">
              Across Central Illinois, Peoria, Bloomington-Normal, Champaign-Urbana, and
              Springfield all have licensed dispensaries that serve out-of-state visitors.
              Travelers driving between Chicago and St. Louis on I-55 frequently stop in
              Bloomington-Normal — the cluster sits near the I-55/I-74 interchange and is
              one of the easier access points off the highway.
            </p>
          </div>

          <div id="faq" className="guide-faq">
            <h2 className="guide-h2">Frequently Asked Questions</h2>
            <div className="guide-faq-item">
              <p className="guide-faq-q">Can I buy cannabis without a medical card in Illinois?</p>
              <p className="guide-faq-a">Yes. Illinois has full recreational cannabis. You don&apos;t need a medical card — just a valid ID showing you are 21 or older.</p>
            </div>
            <div className="guide-faq-item">
              <p className="guide-faq-q">Can I smoke cannabis in my hotel room?</p>
              <p className="guide-faq-a">Most hotels prohibit smoking of any kind, including cannabis. Check your hotel&apos;s policy before assuming it&apos;s allowed. Vaping or edibles are often the more practical option for hotel stays.</p>
            </div>
            <div className="guide-faq-item">
              <p className="guide-faq-q">Do dispensaries take credit cards?</p>
              <p className="guide-faq-a">Rarely. Most Illinois dispensaries accept cash and debit cards (with a fee). Almost all have ATMs on-site. Bring cash to be safe.</p>
            </div>
            <div className="guide-faq-item">
              <p className="guide-faq-q">What if I&apos;m a medical patient visiting from another state?</p>
              <p className="guide-faq-a">Illinois does not have reciprocity with other states&apos; medical programs. Out-of-state medical patients are treated as recreational customers and subject to visitor purchase limits.</p>
            </div>
            <div className="guide-faq-item">
              <p className="guide-faq-q">Is there a tax on cannabis in Illinois?</p>
              <p className="guide-faq-a">Yes. Illinois imposes an excise tax of 10% on cannabis with less than 35% THC, 20% on cannabis with more than 35% THC, and 25% on infused products like edibles. Regular sales tax applies on top of that.</p>
            </div>
          </div>

          <div id="find">
            <h2 className="guide-h2">Find Dispensaries Near You</h2>
            <p className="guide-p">
              PuffPrice lists every licensed cannabis dispensary in Central Illinois with real hours,
              phone numbers, and directions. Browse by city or search for dispensaries near specific
              locations.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
              {[
                { name: "Peoria", slug: "peoria" },
                { name: "East Peoria", slug: "east-peoria" },
                { name: "Bloomington", slug: "bloomington" },
                { name: "Normal", slug: "normal" },
                { name: "Champaign", slug: "champaign" },
                { name: "Urbana", slug: "urbana" },
                { name: "Springfield", slug: "springfield" },
                { name: "Peoria Heights", slug: "peoria-heights" },
              ].map((city) => (
                <Link
                  key={city.slug}
                  href={`/city/${city.slug}`}
                  style={{
                    background: "#fff",
                    border: "1px solid #e8e5de",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    textDecoration: "none",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "0.875rem",
                    color: "#0f1f3d",
                    fontWeight: 500,
                  }}
                >
                  {city.name} →
                </Link>
              ))}
            </div>
          </div>

          <div className="guide-cta">
            <p className="guide-cta-title">Own a dispensary in Illinois?</p>
            <p className="guide-cta-sub">Get your free listing on PuffPrice. Claim your page, update your hours, and reach customers searching for dispensaries near them.</p>
            <Link href="/get-listed" className="guide-cta-btn">Claim your free listing →</Link>
          </div>
        </div>

        <footer className="guide-footer">
          <span className="guide-footer-brand">puff<span style={{ color: "#16a34a" }}>price</span></span>
          <span className="guide-footer-note">© {new Date().getFullYear()} PuffPrice · Illinois Cannabis Directory</span>
        </footer>
      </div>
    </>
  );
}
