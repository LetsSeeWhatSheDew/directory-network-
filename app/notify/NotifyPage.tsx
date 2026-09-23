// Single-purpose signup page for ads, QR codes and social posts.
// One promise, one form, who's asking stated plainly. noindex — the SEO
// pages are /drive-thru and /illinois-cannabis-delivery.
import Link from "next/link";
import ZipSignup from "../components/ZipSignup";

export default function NotifyPage({
  kind, headline, sub, fact, channel,
}: { kind: "drive_thru" | "delivery"; headline: string; sub: string; fact: React.ReactNode; channel?: string }) {
  return (
    <main style={{ minHeight: "100vh", background: "var(--pp-canopy)", color: "var(--pp-canopy-text)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 18px" }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--pp-canopy-eyebrow)", margin: 0 }}>Central Illinois · 21+</p>
        <h1 style={{ color: "var(--pp-canopy-text)", fontFamily: "var(--font-display)", fontSize: "clamp(2rem,8vw,3rem)", lineHeight: 1.05, letterSpacing: "-.02em", margin: "10px 0 12px" }}>{headline}</h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.5, margin: "0 0 22px", opacity: 0.92 }}>{sub}</p>
        <ZipSignup source={kind} cta="Tell me first" channel={channel} />
        <p style={{ fontSize: ".85rem", lineHeight: 1.5, margin: "22px 0 0", opacity: 0.8 }}>{fact}</p>
        <p style={{ fontSize: ".8rem", margin: "18px 0 0", opacity: 0.7 }}>
          From <Link href="/" style={{ color: "inherit" }}>PuffPrice</Link> — Central Illinois dispensary deals, checked daily. No spam: one email when it happens near you. <Link href="/privacy" style={{ color: "inherit" }}>Privacy</Link>
        </p>
      </div>
    </main>
  );
}
