import Link from "next/link";

export const metadata = {
  title: "About CleanList — Built in Peoria, Illinois",
  description: "We built the thing we wished existed. CleanList finds the best cannabis deals near you in Illinois.",
};

export default function AboutPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;position:sticky;top:0;z-index:100}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none}
        .logo-mark{position:relative;width:28px;height:28px;flex-shrink:0}
        .logo-dot{position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#4ade80;border:2px solid #0f1f3d;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.9)}}
        .logo-text{font-size:1.1rem;font-weight:700;color:#fff;letter-spacing:-.02em}
        .logo-text span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .wrap{max-width:640px;margin:0 auto;padding:64px 28px 48px}
        h1{font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:700;letter-spacing:-.04em;line-height:1.1;margin-bottom:28px;color:#0f1f3d}
        p{font-size:1.02rem;line-height:1.7;margin-bottom:20px;color:#374151;font-family:Georgia,serif}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:14px}
        .contact{margin-top:40px;padding-top:24px;border-top:1px solid #e8e4da;font-family:system-ui,sans-serif;font-size:.9rem;color:#6b7280}
        .contact a{color:#16a34a;text-decoration:none;font-weight:600}
        .contact a:hover{text-decoration:underline}
        .built{margin-top:40px;font-family:system-ui,sans-serif;font-size:.85rem;color:#9ca3af;text-align:center}
        @media(max-width:600px){.wrap{padding:40px 20px}.nav{padding:12px 16px}}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo" aria-label="CleanList home">
          <span className="logo-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="0" y="0" width="28" height="28" rx="6" fill="#0b172f" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
              <rect x="7" y="9" width="14" height="1.8" rx="0.9" fill="#fff" />
              <rect x="7" y="13.2" width="14" height="1.8" rx="0.9" fill="#fff" />
              <rect x="7" y="17.4" width="14" height="1.8" rx="0.9" fill="#fff" />
            </svg>
            <span className="logo-dot" aria-hidden="true" />
          </span>
          <span className="logo-text">clean<span>list</span></span>
        </Link>
        <Link href="/" className="back">← Back</Link>
      </nav>

      <main className="wrap">
        <div className="eyebrow">About</div>
        <h1>We built the thing we wished existed.</h1>

        <p>
          I&apos;m Matthew Burns. I live in Peoria, Illinois. I got tired of
          driving to a dispensary only to find out the deal I saw on Instagram
          was expired, or didn&apos;t apply to what I wanted, or was only for
          first-time customers. Cannabis deals are everywhere — on Instagram,
          on websites, on chalkboards — but nobody had put them in one place
          with a clear answer to one question: where should I go right now,
          and why?
        </p>

        <p>
          CleanList aggregates deals from Illinois dispensaries, normalizes
          pricing to price-per-gram, and gives you one recommendation with how
          much you save vs the area average. No menus. No strain databases.
          No ads. Just: here&apos;s the best deal near you today.
        </p>

        <p>
          We cover all 293 licensed cannabis dispensaries across 162 Illinois
          cities. Free for consumers, always. Dispensaries pay $49/month to
          feature their deals — which puts them first when someone searches in
          their city. That&apos;s it.
        </p>

        <div className="contact">
          Questions? <a href="mailto:matthew@jacarandapeoria.com">matthew@jacarandapeoria.com</a>
        </div>

        <div className="built">Built in Peoria, Illinois. 🌿</div>
      </main>
    </>
  );
}
