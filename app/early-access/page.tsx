// app/early-access/page.tsx
// Personal landing page for word-of-mouth sharing —
// designed for QR code distribution at the yoga studio,
// to friends, and to small in-person networks.
//
// No nav bar (intentional — this is a one-purpose page).
// Posts to /api/alerts/signup, redirects to /alerts/confirmed.

import Link from "next/link";

export const metadata = {
  title: "Early access to PuffPrice — Central Illinois cannabis deal alerts",
  description:
    "Get free early access to PuffPrice deal alerts for Central Illinois cannabis dispensaries. Weekly digest, no account needed.",
  alternates: { canonical: "https://www.puffprice.com/early-access" },
  openGraph: {
    title: "Early access to PuffPrice",
    description: "Free early access to Central Illinois cannabis deal alerts.",
    url: "https://www.puffprice.com/early-access",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function EarlyAccessPage() {
  return (
    <div style={{
      fontFamily: "Georgia, serif",
      background: "linear-gradient(180deg, #0f1f3d 0%, #142847 100%)",
      minHeight: "100vh",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

        {/* Logo (small, no nav) */}
        <Link href="/" style={{
          color: "#fff",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "1rem",
          opacity: 0.6,
          marginBottom: 32,
          display: "inline-block",
        }}>
          puff<span style={{ color: "#4ade80" }}>price</span>
        </Link>

        {/* Personal headline */}
        <h1 style={{
          fontSize: "clamp(2rem, 6vw, 2.8rem)",
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          marginBottom: 16,
        }}>
          You&apos;re early.<br />
          <em style={{ color: "#4ade80", fontStyle: "normal" }}>That&apos;s a good thing.</em>
        </h1>

        <p style={{
          fontSize: "1.05rem",
          color: "rgba(255,255,255,0.75)",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.65,
          marginBottom: 36,
        }}>
          I&apos;m building PuffPrice — it texts you when dispensaries near you post deals.
          You&apos;re one of the first people I&apos;m telling.
        </p>

        {/* Form — same backend as /alerts but personal tone */}
        <form
          action="/api/alerts/signup"
          method="POST"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            textAlign: "left",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Hidden field — tells signup endpoint where to redirect */}
          <input type="hidden" name="redirect_to" value="/alerts/confirmed" />
          <input type="hidden" name="source" value="early-access" />
          <input type="hidden" name="tier" value="free" />

          <label style={{ fontSize: ".85rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                marginTop: 6,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "1rem",
                fontFamily: "system-ui, sans-serif",
              }}
            />
          </label>

          <label style={{ fontSize: ".85rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
            City
            <input
              type="text"
              name="city"
              required
              autoComplete="address-level2"
              placeholder="Peoria"
              style={{
                width: "100%",
                padding: "12px 14px",
                marginTop: 6,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "1rem",
                fontFamily: "system-ui, sans-serif",
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              background: "#16a34a",
              color: "#fff",
              border: "none",
              padding: "14px 22px",
              borderRadius: 10,
              fontSize: "1rem",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Get free early access →
          </button>

          <p style={{
            fontSize: ".75rem",
            color: "rgba(255,255,255,0.45)",
            textAlign: "center",
            margin: "4px 0 0",
          }}>
            No credit card. No spam. Cancel anytime by replying STOP.
          </p>
        </form>

        {/* Trust footer — personal */}
        <p style={{
          marginTop: 36,
          fontSize: ".85rem",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.6,
        }}>
          Built by <strong style={{ color: "rgba(255,255,255,0.8)" }}>Matthew Burns</strong> in Peoria, IL.
          <br />
          Questions? <a href="mailto:matthew@jacarandapeoria.com" style={{ color: "#4ade80", textDecoration: "none" }}>matthew@jacarandapeoria.com</a>
        </p>
      </div>
    </div>
  );
}
