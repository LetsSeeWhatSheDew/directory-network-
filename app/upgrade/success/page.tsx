// app/upgrade/success/page.tsx
// Thank-you page after a successful Stripe Checkout. Single-tier Pro model.

import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata = {
  title: "You're Pro — welcome",
  description: "Your PuffPrice Pro subscription is active.",
};

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; session_id?: string }>;
}) {
  await searchParams;

  return (
    <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", background: "var(--pp-paper)", minHeight: "100vh", color: "var(--pp-ink)", display: "flex", flexDirection: "column" }}>
      <Nav variant="light" />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 84, height: 84, borderRadius: "50%",
            background: "rgba(74, 222, 128, 0.15)",
            marginBottom: 28,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#93CB5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.04em", marginBottom: 14, lineHeight: 1.05 }}>
            You&apos;re Pro.
          </h1>

          <p style={{ fontSize: "1.1rem", color: "var(--pp-muted)", fontFamily: "system-ui, sans-serif", lineHeight: 1.6, marginBottom: 32 }}>
            You&apos;ll get instant email alerts when dispensaries near you post
            a deal worth knowing about.
          </p>

          <div style={{
            background: "var(--pp-surface)",
            border: "1px solid var(--pp-border)",
            borderRadius: 14,
            padding: 24,
            marginBottom: 32,
            textAlign: "left",
            fontFamily: "system-ui, sans-serif",
          }}>
            <h2 style={{ fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--pp-signal)", marginBottom: 12, fontWeight: 700 }}>
              What happens next
            </h2>
            <ol style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 10, color: "var(--pp-muted)", fontSize: ".9rem" }}>
              <li>Watch your inbox for a confirmation email from PuffPrice.</li>
              <li>Set your city, radius and categories on your <a href="/alerts/preferences" style={{ color: "var(--pp-signal)" }}>alert preferences</a>.</li>
              <li>Alerts come by email and browser notification — never by text. Usually 2&ndash;5 a week, never more than one a day.</li>
            </ol>
          </div>

          <Link href="/" style={{
            display: "inline-block",
            background: "var(--pp-signal-fill)", color: "var(--pp-on-dark)",
            padding: "12px 30px", borderRadius: 10,
            textDecoration: "none", fontFamily: "system-ui, sans-serif",
            fontWeight: 700, fontSize: "1rem",
          }}>
            Back to home
          </Link>

          <p style={{ marginTop: 28, fontSize: ".75rem", color: "var(--pp-muted)", fontFamily: "system-ui, sans-serif" }}>
            Questions? Email matthew@jacarandapeoria.com
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
