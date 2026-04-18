// app/privacy/page.tsx
// Privacy Policy — PuffPrice
// Stripe Customer Portal links here; this page must not 404.
// Plain-language, under 800 words. Server component (no "use client").

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | PuffPrice",
  description:
    "PuffPrice Privacy Policy — what we collect (email, phone, ZIP, anonymous location), who we share it with (Stripe, Twilio, Resend, Google Analytics), and how to request deletion.",
  alternates: { canonical: "https://www.puffprice.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f4f0", minHeight: "100vh", color: "#0f1f3d" }}>
      <nav style={{ padding: "14px 28px", background: "#0f1f3d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "1.15rem" }}>
          puff<span style={{ color: "#4ade80" }}>price</span>
        </Link>
        <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: ".85rem", fontFamily: "system-ui, sans-serif" }}>
          ← Home
        </Link>
      </nav>

      <header style={{ background: "#0f1f3d", color: "#fff", padding: "56px 28px", textAlign: "center" }}>
        <p style={{ fontSize: ".7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#4ade80", fontFamily: "system-ui, sans-serif", fontWeight: 700, marginBottom: 10 }}>
          Legal
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.04em", marginBottom: 12, lineHeight: 1.1 }}>
          Privacy Policy
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "0 auto", lineHeight: 1.6, fontSize: "1rem" }}>
          Last updated: April 18, 2026. Short and specific.
        </p>
      </header>

      <section style={{ maxWidth: 720, margin: "-32px auto 0", padding: "0 28px 80px", position: "relative" }}>
        <article style={{ background: "#fff", border: "1px solid #e8e4da", borderRadius: 14, padding: "32px 28px", lineHeight: 1.7, fontSize: "1.02rem" }}>

          <h2 style={h2}>The short version</h2>
          <p>
            PuffPrice is free to browse without an account. When you share data with us — by signing up for alerts, subscribing to Pro, or emailing us — we only use it for what you asked. We don&apos;t sell your data, and we don&apos;t share it with advertisers.
          </p>

          <h2 style={h2}>What we collect</h2>
          <p>
            <strong>Nothing identifiable</strong> if you just browse. Anonymous page-view analytics only.
          </p>
          <p>
            <strong>Email</strong> — if you subscribe to alerts, Pro, or sign up for the waitlist. We use it to send you the alerts or receipts you asked for.
          </p>
          <p>
            <strong>Phone number</strong> — only if you opt into SMS alerts. Used only for sending the deal alerts you requested. You can reply STOP to unsubscribe at any time.
          </p>
          <p>
            <strong>ZIP code</strong> — if you set a preferred ZIP to filter deals, we store the 5-digit ZIP. No street address.
          </p>
          <p>
            <strong>Approximate location</strong> — if you allow browser geolocation, we read it in the browser to rank deals by proximity. We don&apos;t send your precise GPS coordinates to our server unless you click GO HERE on a specific listing.
          </p>
          <p>
            <strong>Payment information</strong> — Pro payments go through Stripe. Stripe receives your card details; <em>we never see your card number or expiry.</em> We only receive a Stripe customer ID and subscription status.
          </p>

          <h2 style={h2}>Who we share it with</h2>
          <p>
            Three third parties, each for one narrow purpose:
          </p>
          <ul style={ul}>
            <li>
              <strong>Stripe</strong> — payment processing for Pro. Stripe&apos;s privacy practices: <a href="https://stripe.com/privacy" style={link}>stripe.com/privacy</a>.
            </li>
            <li>
              <strong>Twilio</strong> — SMS alert delivery. Your phone number is sent to Twilio only if you opt into SMS. Twilio&apos;s policy: <a href="https://www.twilio.com/legal/privacy" style={link}>twilio.com/legal/privacy</a>.
            </li>
            <li>
              <strong>Resend</strong> — email delivery (alerts, digest, receipts). Your email is sent to Resend only for sending messages you requested. Resend&apos;s policy: <a href="https://resend.com/legal/privacy-policy" style={link}>resend.com/legal/privacy-policy</a>.
            </li>
          </ul>
          <p>
            We do not sell data. We do not share with advertisers or data brokers. We do not use retargeting pixels.
          </p>

          <h2 style={h2}>Cookies and analytics</h2>
          <p>
            We use <strong>Google Analytics 4</strong> to understand which pages and city queries are working. GA4 sets a few first-party cookies and may collect anonymous identifiers, approximate location (country/city level, not precise), and device information. You can opt out by installing the <a href="https://tools.google.com/dlpage/gaoptout" style={link}>Google Analytics opt-out browser add-on</a>.
          </p>
          <p>
            We do not use Facebook Pixel, TikTok Pixel, or any third-party advertising or retargeting tags.
          </p>

          <h2 style={h2}>How long we keep data</h2>
          <p>
            Alert-subscription data (email, phone, ZIP) is kept while your subscription is active and for 30 days after you unsubscribe. Stripe billing records are kept per Stripe&apos;s and applicable accounting-law retention (typically 7 years). Analytics data is retained per Google Analytics default (14 months).
          </p>

          <h2 style={h2}>Your rights</h2>
          <p>
            You can <strong>ask us to delete everything we have on you</strong> at any time by emailing{" "}
            <a href="mailto:matthew@jacarandapeoria.com" style={link}>matthew@jacarandapeoria.com</a> from the address we have on file. We delete your alert subscriptions, ZIP, and any support tickets within 14 days. Stripe billing records have their own retention we can&apos;t override.
          </p>
          <p>
            You can also <strong>see or correct</strong> what we have on you by emailing the same address. No account required — we&apos;ll verify you via the contact channel you provided.
          </p>

          <h2 style={h2}>Security</h2>
          <p>
            Data in transit is encrypted (TLS). Credentials are stored in managed secret stores, not in code. Our database access requires service-role authentication. We do not have a dedicated CISO — we&apos;re a small operation — so if you spot a security issue please report it privately to the email below rather than publicly.
          </p>

          <h2 style={h2}>Children</h2>
          <p>
            PuffPrice is for adults 21+. We don&apos;t knowingly collect data from anyone under 21. If you believe a minor submitted information to us, email us and we&apos;ll delete it.
          </p>

          <h2 style={h2}>Changes</h2>
          <p>
            Material changes get posted here with a new &quot;Last updated&quot; date. We&apos;ll email Pro subscribers for any change that reduces their privacy meaningfully.
          </p>

          <h2 style={h2}>Contact</h2>
          <p>
            Privacy questions, deletion requests, and security reports: <a href="mailto:matthew@jacarandapeoria.com" style={link}>matthew@jacarandapeoria.com</a>.
          </p>

        </article>

        <p style={{ textAlign: "center", marginTop: 28, fontSize: ".85rem", fontFamily: "system-ui, sans-serif", color: "#6b7280" }}>
          See also: <Link href="/terms" style={link}>Terms of Service</Link>
        </p>
      </section>
    </div>
  );
}

const h2: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: "1.05rem",
  fontWeight: 700,
  marginTop: 28,
  marginBottom: 8,
  color: "#0f1f3d",
  letterSpacing: "-0.01em",
};

const ul: React.CSSProperties = {
  paddingLeft: 22,
  marginTop: 4,
  marginBottom: 12,
};

const link: React.CSSProperties = {
  color: "#16a34a",
  textDecoration: "underline",
};
