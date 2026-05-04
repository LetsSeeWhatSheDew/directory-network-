import Link from "next/link";
import Logo from "../components/Logo";
import type { Metadata } from "next";
import { brand } from "../../lib/brand";

export const metadata: Metadata = {
  title: `New to dispensaries? Start here | ${brand.name}`,
  description:
    "First-time guide to Central Illinois dispensaries — what to expect, how to compare deals, and how to buy with confidence.",
  alternates: { canonical: `${brand.url}/start` },
  openGraph: {
    title: `New to dispensaries? Start here | ${brand.name}`,
    description:
      "First-time guide to Central Illinois dispensaries — what to expect, how to compare deals, and how to buy with confidence.",
    url: `${brand.url}/start`,
    siteName: brand.name,
    images: [{ url: `${brand.url}/og-image.png`, width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
};

export default function StartPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#F7F4ED;color:#1F3D2B;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;position:sticky;top:0;z-index:100;border-bottom:1px solid #e8e4da}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#7DBA47;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .logo-text{font-size:1.1rem;font-weight:700;color:#1F3D2B}
        .logo-text span{color:#7DBA47}
        .back{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}

        .wrap{max-width:720px;margin:0 auto;padding:48px 22px 72px}
        .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7DBA47;font-family:system-ui,sans-serif;margin-bottom:10px}
        h1{font-size:clamp(2rem,5vw,2.8rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:14px}
        .lede{font-size:1.05rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.65;margin-bottom:36px}

        section{margin-bottom:40px}
        h2{font-size:1.35rem;font-weight:700;letter-spacing:-.02em;margin-bottom:14px;color:#1F3D2B}
        p,li{font-family:system-ui,sans-serif;color:#374151;font-size:1rem;line-height:1.7}
        p{margin-bottom:12px}
        ul{margin:0 0 12px 22px}
        li{margin-bottom:8px}
        strong{color:#1F3D2B}

        .callout{background:#fff;border:1px solid #e8e4da;border-left:4px solid #7DBA47;border-radius:12px;padding:16px 18px;margin:12px 0}
        .callout p{margin:0;font-size:.95rem;color:#374151}

        .cta-row{margin-top:32px;padding:22px 24px;background:#fff;border:1px solid #e8e4da;border-radius:14px;text-align:center}
        .cta-row p{font-size:.92rem;color:#374151;margin-bottom:12px}
        .cta-btn{display:inline-block;background:#7DBA47;color:#fff;padding:14px 26px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:1rem}
        .cta-btn:hover{background:#6BA63B}

        @media(max-width:600px){.wrap{padding:32px 16px 56px}h2{font-size:1.2rem}p,li{font-size:.98rem}}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home">
          <Logo />
        </Link>
        <Link href="/" className="back">← Back</Link>
      </nav>

      <main className="wrap">
        <div className="eyebrow">First-time guide</div>
        <h1>New to dispensaries? Start here.</h1>
        <p className="lede">
          Walking into an Illinois dispensary for the first time can feel
          intimidating. It shouldn&rsquo;t. Here&rsquo;s what to expect, how
          to tell a real deal from a weak one, and how to buy without feeling
          rushed or out of your depth.
        </p>

        <section>
          <h2>1. What to expect at your first Illinois dispensary</h2>
          <p>
            Recreational cannabis has been legal in Illinois since 2020. The
            experience is closer to a pharmacy or a wine shop than anything
            else — staff are trained, IDs are checked at the door, and nobody
            is going to pressure you into buying more than you want.
          </p>
          <ul>
            <li>You must be <strong>21 or older</strong> and show a valid government ID.</li>
            <li>Most dispensaries publish their full menu online — check before you drive.</li>
            <li>Browsing is fine. You don&rsquo;t have to buy anything.</li>
            <li>Staff (often called &ldquo;budtenders&rdquo;) are there to answer questions. Ask.</li>
            <li>
              <strong>Prices don&rsquo;t include Illinois tax.</strong> Total tax runs
              around 20&ndash;34% depending on the product and city. Plan for that at checkout.
            </li>
          </ul>
        </section>

        <section>
          <h2>2. Flower, edibles, vapes — what&rsquo;s the difference?</h2>
          <p>
            These are the four most common categories. You don&rsquo;t need to
            know strain theory or terpene names to buy something sensible.
          </p>
          <ul>
            <li>
              <strong>Flower</strong> — classic dried cannabis. Onset in 15&ndash;30 minutes,
              effect lasts 1&ndash;3 hours. Needs a pipe, papers, or a pre-roll.
            </li>
            <li>
              <strong>Edibles</strong> — gummies, chocolates, drinks. <strong>Onset is slow
              (45&ndash;90 minutes)</strong> and the effect can last 4&ndash;6 hours.
              Easy to misjudge — start with a low dose (2.5&ndash;5 mg) and wait a full
              90 minutes before taking more.
            </li>
            <li>
              <strong>Vapes</strong> — battery-powered cartridges. Fast-acting and portable.
              Quality varies a lot by brand.
            </li>
            <li>
              <strong>Concentrates</strong> — very high potency extracts (wax, shatter, live resin).
              Generally not where a beginner should start.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How to read a cannabis deal</h2>
          <p>
            Not every &ldquo;% off&rdquo; is a real deal. A few things to watch for:
          </p>
          <ul>
            <li>
              <strong>&ldquo;30% off&rdquo;</strong> means 30% off the shelf price —
              <strong> before tax</strong>. A $40 eighth at 30% off is $28 before tax,
              closer to $36 after.
            </li>
            <li>
              <strong>BOGO</strong> (&ldquo;buy one get one&rdquo;) — sometimes genuinely half-price,
              sometimes it&rsquo;s BOGO 50% off, which is 25% off total. Read the fine print.
            </li>
            <li>
              <strong>&ldquo;Free pre-roll with purchase&rdquo;</strong> — the minimum purchase
              is often much higher than the pre-roll is worth. Do the math before driving.
            </li>
            <li>
              <strong>Quick savings check:</strong> (original price &minus; deal price) &divide; original price.
              That&rsquo;s your real % off. Anything 20%+ is a solid deal. 30%+ is genuinely good.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. How to compare dispensaries in Illinois</h2>
          <ul>
            <li>
              <strong>Price varies significantly</strong> between dispensaries for the same
              product. The same half-gram cartridge can be $30 at one shop and $45 at another
              ten minutes away.
            </li>
            <li>
              <strong>Distance matters.</strong> A 10% discount isn&rsquo;t worth a
              30-minute drive. Factor in gas and time.
            </li>
            <li>
              <strong>Check hours before you go.</strong> Illinois dispensary hours
              vary &mdash; some close at 8 PM, some at 10 PM, a few much earlier on Sundays.
            </li>
            <li>
              <strong>Look for express pickup</strong> if you already know what you want.
              Most dispensaries let you order online and skip the in-store line.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. How PuffPrice helps</h2>
          <p>
            PuffPrice tracks active deals at Central Illinois dispensaries daily. When you
            find a deal you like, we make the rest easy:
          </p>
          <ul>
            <li>Every deal card links straight to directions, hours, and the dispensary&rsquo;s menu.</li>
            <li>We flag genuinely extraordinary deals with a 🔥 badge. No letter grades, no padding.</li>
            <li>It&rsquo;s free and no account is needed.</li>
            <li>
              Optional <strong>Pro alerts ($0.99/month)</strong> text you when a new
              deal drops near you.
            </li>
          </ul>
        </section>

        <div className="callout">
          <p>
            <strong>Still unsure?</strong> Walk in during a slow hour (weekday mornings
            are quietest), tell the budtender it&rsquo;s your first time, and ask
            what they&rsquo;d recommend for a beginner. Nobody will judge you.
          </p>
        </div>

        <div className="cta-row">
          <p>Ready to find deals?</p>
          <Link href="/" className="cta-btn">See deals near me →</Link>
        </div>
      </main>
    </>
  );
}
