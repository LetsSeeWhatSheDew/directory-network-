// app/terms/page.tsx
// Terms of Service — PuffPrice
// Stripe Customer Portal links here; this page must not 404.
// Plain-language, under 800 words. Server component (no "use client").

import Link from "next/link";
import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "PuffPrice Terms of Service — plain-language terms covering the free tier, the $0.99/mo Pro tier, cancellation, data use, DMCA, and governing law (Illinois).",
  alternates: { canonical: "https://www.puffprice.com/terms" },
};

export default function TermsPage() {
  return (
    <div style={{ fontFamily: "Manrope, system-ui, sans-serif", background: "var(--color-cream, #F7F4ED)", minHeight: "100vh", color: "var(--color-deep, #1F3D2B)" }}>
      <div className="pp-surface-deep pp-leaf pp-leaf-04">
        <Nav variant="deep" />
        <header style={{ color: "var(--color-cream, #F7F4ED)", padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem)", textAlign: "center", position: "relative", zIndex: 2 }}>
          <p className="pp-eyebrow" style={{ color: "var(--color-sage-vibrant, #93CB5C)", marginBottom: 10 }}>Legal</p>
          <h1 style={{ fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 12, color: "var(--color-cream, #F7F4ED)" }}>
            Terms of Service
          </h1>
          <p style={{ color: "rgba(247, 244, 237, 0.72)", fontFamily: "Manrope, system-ui, sans-serif", maxWidth: 520, margin: "0 auto", lineHeight: 1.6, fontSize: "1rem" }}>
            Last updated: April 18, 2026. Short, plain English, no tricks.
          </p>
        </header>
      </div>

      <section style={{ maxWidth: 720, margin: "-32px auto 0", padding: "0 28px 80px", position: "relative" }}>
        <article style={{ background: "#fff", border: "1px solid #e8e4da", borderRadius: 14, padding: "32px 28px", lineHeight: 1.7, fontSize: "1.02rem" }}>

          <h2 style={h2}>Who we are</h2>
          <p>
            PuffPrice is an Illinois cannabis deal aggregator operated by Matthew Burns. Contact:{" "}
            <a href="mailto:matthew@jacarandapeoria.com" style={link}>matthew@jacarandapeoria.com</a>. By using the site you agree to these terms.
          </p>

          <h2 style={h2}>Eligibility</h2>
          <p>
            PuffPrice is for adults 21 and over. Don&apos;t use the site if you are under 21 or in a jurisdiction where viewing cannabis content is prohibited. We don&apos;t sell cannabis, and nothing on PuffPrice is a purchase offer — we surface deals published by licensed Illinois dispensaries.
          </p>

          <h2 style={h2}>Free tier</h2>
          <p>
            Browsing deals, filtering by city or category, and using the GO HERE / directions flow is free and requires no account. You can use PuffPrice forever without paying us anything.
          </p>

          <h2 style={h2}>PuffPrice Pro — $0.99/month</h2>
          <p>
            Pro adds SMS alerts, a daily digest email, price history on products you watch, and a personal savings dashboard. Pro is a recurring monthly subscription at $0.99 per month, billed through Stripe.
          </p>
          <p>
            <strong>Cancellation.</strong> You can cancel Pro at any time from your Stripe customer portal (link included in every Pro email) or by emailing{" "}
            <a href="mailto:matthew@jacarandapeoria.com" style={link}>matthew@jacarandapeoria.com</a>. Cancellation takes effect at the end of your current billing period — you keep Pro access through the end of that period, and no further charges are made. We do not pro-rate or refund partial months unless the charge was made in error.
          </p>
          <p>
            <strong>Price changes.</strong> If we ever change the Pro price we&apos;ll email you at least 30 days before the new price applies, and you can cancel before the change takes effect.
          </p>

          <h2 style={h2}>Deal accuracy</h2>
          <p>
            We do our best to keep deals accurate and current — every deal shows the time it was last confirmed. We don&apos;t guarantee any deal will be honored at the register. Always verify at the counter before you commit to a purchase. If a deal was wrong, email us and we&apos;ll investigate and correct it.
          </p>

          <h2 style={h2}>Your content</h2>
          <p>
            If you submit a deal correction, a dispensary claim, or feedback, you grant us permission to use that information to update PuffPrice. We don&apos;t publish your email or phone without consent.
          </p>

          <h2 style={h2}>Acceptable use</h2>
          <p>
            Don&apos;t scrape the site at volume, don&apos;t resell our data, and don&apos;t try to break our infrastructure. If you&apos;re a developer interested in structured access, email us — we&apos;re building a public data layer and would rather collaborate than block you.
          </p>

          <h2 style={h2}>DMCA and copyright</h2>
          <p>
            If content on PuffPrice infringes your copyright, send a DMCA notice to{" "}
            <a href="mailto:matthew@jacarandapeoria.com" style={link}>matthew@jacarandapeoria.com</a> including (1) the work at issue, (2) the URL where it appears on PuffPrice, (3) your contact info, and (4) a statement under penalty of perjury that you own the work. We remove infringing content promptly after verified notice.
          </p>

          <h2 style={h2}>No warranty</h2>
          <p>
            PuffPrice is provided as-is. We don&apos;t warrant any specific deal, price, product availability, dispensary behavior, or outcome from using the site. To the maximum extent allowed by Illinois law, our liability is capped at the total amount you&apos;ve paid us in the prior 12 months (for most users, $0).
          </p>

          <h2 style={h2}>Governing law</h2>
          <p>
            These terms are governed by the laws of the State of Illinois, without regard to conflict-of-law rules. Any dispute is resolved in the state or federal courts located in Peoria County, Illinois.
          </p>

          <h2 style={h2}>Changes</h2>
          <p>
            We may update these terms. Material changes get a banner on the site and an email to Pro subscribers at least 15 days before they apply. Continued use after an update means you accept the new version.
          </p>

          <h2 style={h2}>Questions</h2>
          <p>
            Email <a href="mailto:matthew@jacarandapeoria.com" style={link}>matthew@jacarandapeoria.com</a>. A real person reads every message.
          </p>

        </article>

        <p style={{ textAlign: "center", marginTop: 28, fontSize: ".85rem", fontFamily: "Manrope, system-ui, sans-serif", color: "var(--color-gray-500, #6B7280)" }}>
          See also: <Link href="/privacy" style={link}>Privacy Policy</Link>
        </p>
      </section>
      <Footer />
    </div>
  );
}

const h2: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: "1.05rem",
  fontWeight: 700,
  marginTop: 28,
  marginBottom: 8,
  color: "#1F3D2B",
  letterSpacing: "-0.01em",
};

const link: React.CSSProperties = {
  color: "#7DBA47",
  textDecoration: "underline",
};
