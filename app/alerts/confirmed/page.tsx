// app/alerts/confirmed/page.tsx
// Thank-you page after a user confirms their deal alerts signup.
// Reached via the /alerts form POST and also via /early-access.

import Link from "next/link";

export const metadata = {
  title: "You're in — PuffPrice deal alerts",
  description: "You're signed up for Illinois dispensary deal alerts.",
};

export default function AlertsConfirmedPage() {
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#0f1f3d", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "14px 28px" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "1.15rem" }}>
          puff<span style={{ color: "#4ade80" }}>price</span>
        </Link>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(74, 222, 128, 0.15)",
            marginBottom: 24,
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 }}>
            You&apos;re in.
          </h1>

          <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.7)", fontFamily: "system-ui, sans-serif", lineHeight: 1.6, marginBottom: 32 }}>
            We&apos;ll text you when dispensaries near you post a deal worth knowing about.
            No spam, no daily blast — just the stuff you&apos;d want to know.
          </p>

          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: 24,
            marginBottom: 32,
            textAlign: "left",
            fontFamily: "system-ui, sans-serif",
          }}>
            <h2 style={{ fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".12em", color: "#4ade80", marginBottom: 12, fontWeight: 700 }}>
              While you wait
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li>
                <Link href="/cannabis/illinois/open-now" style={{ color: "#fff", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 10, display: "block", fontSize: ".9rem" }}>
                  → See dispensaries open right now
                </Link>
              </li>
              <li>
                <Link href="/deals/all" style={{ color: "#fff", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 10, display: "block", fontSize: ".9rem" }}>
                  → Browse today&apos;s deals
                </Link>
              </li>
              <li>
                <Link href="/cannabis/illinois/first-time-guide" style={{ color: "#fff", textDecoration: "none", paddingBottom: 0, display: "block", fontSize: ".9rem" }}>
                  → First-time buyer guide
                </Link>
              </li>
            </ul>
          </div>

          <Link href="/" style={{
            display: "inline-block",
            background: "#16a34a", color: "#fff",
            padding: "12px 28px", borderRadius: 10,
            textDecoration: "none", fontFamily: "system-ui, sans-serif",
            fontWeight: 700, fontSize: ".95rem",
          }}>
            Back to home
          </Link>

          <p style={{ marginTop: 28, fontSize: ".75rem", color: "rgba(255,255,255,0.4)", fontFamily: "system-ui, sans-serif" }}>
            Built by Matthew Burns in Peoria, IL.
          </p>
        </div>
      </main>
    </div>
  );
}
