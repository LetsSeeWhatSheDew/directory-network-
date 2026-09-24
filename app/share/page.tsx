// /share — the share kit. Today's longest-exhale images (live data), the
// drive-thru campaign pictures, and every city's link preview, each one tap
// to open or save. noindex: it's a tool, not a page for search.
import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Share kit",
  robots: { index: false, follow: false },
};

const CITIES = ["peoria", "east-peoria", "peoria-heights", "pekin", "bloomington", "normal", "champaign", "urbana", "springfield"];

const CSS = `
.sk{max-width:1100px;margin:0 auto;padding:28px clamp(1rem,4vw,2rem) 64px}
.sk h1{font-size:clamp(2.2rem,7vw,3.2rem);margin:0 0 6px;color:var(--pp-ink)}
.sk h1 em{font-style:italic;color:var(--pp-mark)}
.sk-lede{color:var(--pp-body);max-width:640px;margin:0 0 28px;line-height:1.55}
.sk h2{font-size:1.7rem;margin:34px 0 4px;color:var(--pp-ink)}
.sk-note{color:var(--pp-muted);font-size:.9rem;margin:0 0 14px;max-width:680px;line-height:1.5}
.sk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.sk-grid.wide{grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.sk-card{display:flex;flex-direction:column;gap:8px;background:var(--pp-surface);border:1px solid var(--pp-border);border-radius:18px;padding:10px;text-decoration:none;color:var(--pp-ink)}
.sk-card img{width:100%;height:auto;border-radius:12px;border:1px solid var(--pp-border);background:var(--pp-paper)}
.sk-card b{font-weight:600;font-size:.95rem;padding:0 4px}
.sk-card span{font-size:.8rem;color:var(--pp-muted);padding:0 4px 4px}
.sk-copy{background:var(--pp-haze);border:1px solid var(--pp-haze-border);border-radius:16px;padding:14px 16px;font-size:.95rem;line-height:1.55;color:var(--pp-ink);white-space:pre-wrap}
`;

function Card({ src, title, sub }: { src: string; title: string; sub: string }) {
  return (
    <a className="sk-card" href={src} target="_blank" rel="noopener">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={title} loading="lazy" />
      <b>{title}</b>
      <span>{sub}</span>
    </a>
  );
}

export default function SharePage() {
  return (
    <>
      <style>{CSS}</style>
      <Nav variant="light" />
      <main className="sk">
        <h1>
          Share kit. <em>Made fresh from today&rsquo;s deals.</em>
        </h1>
        <p className="sk-lede">
          Every image here is drawn live from this morning&rsquo;s checks, so the numbers are always real. Tap one to open it
          full size, then save or share. They refresh through the day.
        </p>

        <h2>Today&rsquo;s longest exhale</h2>
        <p className="sk-note">
          Good for X, Threads, Reddit, Nextdoor and group texts. Meta (Facebook and Instagram) restricts posts that promote
          cannabis deals, so keep these off Meta.
        </p>
        <div className="sk-grid">
          <Card src="/og/today?size=post" title="Post · day" sub="1080 × 1350" />
          <Card src="/og/today?size=post&theme=night" title="Post · night" sub="1080 × 1350" />
          <Card src="/og/today?size=story" title="Story · day" sub="1080 × 1920" />
          <Card src="/og/today?size=story&theme=night" title="Story · night" sub="1080 × 1920" />
        </div>

        <h2>Drive-thru picture day</h2>
        <p className="sk-note">
          Civic only: no products, no deals, so it&rsquo;s fine on Facebook and Instagram. The profile picture keeps
          everything inside the circle crop. The count comes from the drive-thru tracker (26 Central Illinois stores).
        </p>
        <div className="sk-grid">
          <Card src="/og/drive-thru?kind=pfp" title="Profile picture · light" sub="1080 × 1080" />
          <Card src="/og/drive-thru?kind=pfp&theme=night" title="Profile picture · dark" sub="1080 × 1080" />
          <Card src="/og/drive-thru?kind=post" title="Explainer · light" sub="1080 × 1350" />
          <Card src="/og/drive-thru?kind=post&theme=night" title="Explainer · dark" sub="1080 × 1350" />
        </div>
        <p className="sk-note" style={{ marginTop: 14 }}>Caption for people who switch their picture:</p>
        <div className="sk-copy">
          {"Illinois made dispensary drive-thrus legal in June. Open near Peoria: 0. Our local rules haven't caught up yet. Want one in your town? Tell your city council, and get told the day one opens: puffprice.com/notify/drive-thru?utm_source=pfp"}
        </div>

        <h2>Link previews</h2>
        <p className="sk-note">What a link to each page looks like when it&rsquo;s pasted into a text, Slack or social post.</p>
        <div className="sk-grid wide">
          <Card src="/og/today?size=og" title="Homepage" sub="puffprice.com" />
          {CITIES.map((c) => (
            <Card key={c} src={`/og/city/${c}`} title={c.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")} sub={`puffprice.com/city/${c}`} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
