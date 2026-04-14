// app/upgrade/success/page.tsx
// Thank-you page after a successful Stripe Checkout.
// Shows a different message based on the ?tier=... query param.

import Link from "next/link";

export const metadata = {
  title: "Thanks — you're in",
  description: "Your CleanList subscription is active.",
};

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; session_id?: string }>;
}) {
  const { tier } = await searchParams;

  const isDispensary = tier === "featured";
  const isConsumer = tier === "pro_consumer";

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#0f1f3d", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "14px 28px" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "1.15rem" }}>
          clean<span style={{ color: "#4ade80" }}>list</span>
        </Link>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 84, height: 84, borderRadius: "50%",
            background: "rgba(74, 222, 128, 0.15)",
            marginBottom: 28,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.04em", marginBottom: 14, lineHeight: 1.05 }}>
            {isDispensary ? "You're featured." : isConsumer ? "You're Pro." : "You're in."}
          </h1>

          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", fontFamily: "system-ui, sans-serif", lineHeight: 1.6, marginBottom: 32 }}>
            {isDispensary && (
              <>Your deal now shows first on your city&apos;s deals page. Expect lead traffic to start within 24 hours.</>
            )}
            {isConsumer && (
              <>You&apos;ll get instant SMS alerts when dispensaries near you post a deal worth knowing about.</>
            )}
            {!isDispensary && !isConsumer && (
              <>Your subscription is active. Welcome aboard.</>
            )}
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
              What happens next
            </h2>
            <ol style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 10, color: "rgba(255,255,255,0.85)", fontSize: ".9rem" }}>
              {isDispensary ? (
                <>
                  <li>We&apos;ll email you within 24 hours to confirm your featured placement and collect your first deal submission.</li>
                  <li>Your store appears at the top of your city&apos;s deals page and earns a &quot;Featured&quot; badge.</li>
                  <li>You&apos;ll get a lead alert email every time someone clicks through to your listing.</li>
                </>
              ) : isConsumer ? (
                <>
                  <li>Watch for a confirmation text to the phone number you gave us.</li>
                  <li>Reply with your ZIP code to set your deal-alert radius.</li>
                  <li>Alerts start within 24 hours — usually 2-5 per week, never more than one per day.</li>
                </>
              ) : (
                <>
                  <li>Check your email for a receipt from Stripe.</li>
                  <li>You&apos;ll hear from Matthew within 24 hours with onboarding details.</li>
                </>
              )}
            </ol>
          </div>

          <Link href="/" style={{
            display: "inline-block",
            background: "#16a34a", color: "#fff",
            padding: "12px 30px", borderRadius: 10,
            textDecoration: "none", fontFamily: "system-ui, sans-serif",
            fontWeight: 700, fontSize: "1rem",
          }}>
            Back to home
          </Link>

          <p style={{ marginTop: 28, fontSize: ".75rem", color: "rgba(255,255,255,0.4)", fontFamily: "system-ui, sans-serif" }}>
            Questions? Email matthew@jacarandapeoria.com
          </p>
        </div>
      </main>
    </div>
  );
}
