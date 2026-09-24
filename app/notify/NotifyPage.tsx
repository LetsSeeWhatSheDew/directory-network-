// Single-purpose signup page for ads, QR codes and social posts.
// One promise, one form, who's asking stated plainly. noindex — the SEO
// pages are /drive-thru and /illinois-cannabis-delivery.
// Breathe (Sep 23): warm paper by day / deep green at night, the breathing
// orb behind the headline, the form on a quiet card. No green slab.
import Link from "next/link";
import ZipSignup from "../components/ZipSignup";
import Logo from "../components/Logo";
import HazeBand from "../components/HazeBand";

const CSS = `
.np{min-height:100vh;display:flex;flex-direction:column;font-family:var(--font-body);color:var(--pp-body)}
.np-top{display:flex;justify-content:center;padding:22px 18px 0}
.np-main{flex:1;display:flex;align-items:center;justify-content:center;padding:18px 18px 8px}
.np-in{position:relative;max-width:540px;width:100%;isolation:isolate}
.np-orb{position:absolute;left:50%;top:-40px;width:340px;height:340px;margin-left:-170px;border-radius:50%;z-index:-1;pointer-events:none;
  background:radial-gradient(circle,rgba(243,195,160,.55) 0%,rgba(188,208,179,.35) 45%,rgba(246,241,232,0) 72%);filter:blur(6px)}
html[data-daypart="night"] .np-orb{background:radial-gradient(circle,rgba(72,150,104,.42) 0%,rgba(40,94,64,.2) 45%,rgba(11,21,16,0) 72%)}
@media (prefers-reduced-motion: no-preference){.np-orb{animation:pp-breath var(--breath) ease-in-out infinite}}
.np-eye{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--pp-muted);margin:0;text-align:center}
.np h1{font-size:clamp(2.2rem,9vw,3.3rem) !important;line-height:1.02 !important;color:var(--pp-ink);margin:12px 0 14px;text-align:center;text-wrap:balance}
.np h1 em{font-style:italic;color:var(--pp-mark)}
.np-sub{font-size:1.08rem;line-height:1.55;margin:0 0 22px;text-align:center}
.np-card{background:var(--pp-surface);border:1px solid var(--pp-border);border-radius:20px;padding:18px}
.np-fact{font-size:.9rem;line-height:1.55;margin:18px 2px 0;color:var(--pp-body)}
.np-fact a{color:var(--pp-mark);font-weight:600}
.np-from{font-size:.8rem;margin:14px 2px 0;color:var(--pp-muted)}
.np-from a{color:inherit}
`;

export default function NotifyPage({
  kind, headline, sub, fact, channel,
}: { kind: "drive_thru" | "delivery"; headline: string; sub: string; fact: React.ReactNode; channel?: string }) {
  // Last sentence of the headline goes italic green, like the homepage.
  const m = headline.match(/^(.*?\s)(\S+\.)$/);
  return (
    <div className="np">
      <style>{CSS}</style>
      <div className="np-top">
        <Link href="/" aria-label="PuffPrice home"><Logo size={34} /></Link>
      </div>
      <main className="np-main">
        <div className="np-in">
          <div className="np-orb" aria-hidden="true" />
          <p className="np-eye">Central Illinois · 21+</p>
          <h1>{m ? <>{m[1]}<em>{m[2]}</em></> : headline}</h1>
          <p className="np-sub">{sub}</p>
          <div className="np-card">
            <ZipSignup source={kind} cta="Tell me first" channel={channel} />
          </div>
          <p className="np-fact">{fact}</p>
          <p className="np-from">
            From <Link href="/">PuffPrice</Link>: Central Illinois dispensary deals, checked on the stores&apos; own sites every morning. One email when it happens near you, nothing else. <Link href="/privacy">Privacy</Link>
          </p>
        </div>
      </main>
      <HazeBand height={150} />
    </div>
  );
}
