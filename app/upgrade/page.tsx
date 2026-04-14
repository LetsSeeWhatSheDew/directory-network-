// app/upgrade/page.tsx
// Three-tier pricing with live Stripe Checkout wiring.
// "use client" because each CTA POSTs to /api/stripe/create-checkout
// and redirects on success.

"use client";

import { useState } from "react";
import Link from "next/link";

type TierKey = "free" | "featured" | "pro_consumer";

export default function UpgradePage() {
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(tier: Exclude<TierKey, "free">) {
    setError(null);
    if (!email || !email.includes("@")) {
      setError("Please enter your email first.");
      return;
    }
    setLoadingTier(tier);
    try {
      try {
        const w = window as any;
        if (typeof w.gtag === "function") w.gtag("event", "upgrade_click", { tier });
      } catch {}
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, email, slug: slug || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Checkout failed. Please try again or email matthew@jacarandapeoria.com.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f4f0", minHeight: "100vh", color: "#0f1f3d" }}>
      <nav style={{ padding: "14px 28px", background: "#0f1f3d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "1.15rem" }}>
          clean<span style={{ color: "#4ade80" }}>list</span>
        </Link>
        <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: ".85rem", fontFamily: "system-ui, sans-serif" }}>
          ← Home
        </Link>
      </nav>

      <header style={{ background: "#0f1f3d", color: "#fff", padding: "56px 28px", textAlign: "center" }}>
        <p style={{ fontSize: ".7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#4ade80", fontFamily: "system-ui, sans-serif", fontWeight: 700, marginBottom: 10 }}>
          Plans & pricing
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.04em", marginBottom: 12, lineHeight: 1.1 }}>
          Low Prices.<br /><em style={{ color: "#4ade80", fontStyle: "normal" }}>High Times.</em>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "0 auto", lineHeight: 1.6, fontSize: "1rem" }}>
          Free for every Illinois dispensary. Optional upgrades for dispensaries who want more visibility — and for customers who want instant deal alerts.
        </p>
      </header>

      <section style={{ maxWidth: 1100, margin: "-32px auto 0", padding: "0 28px 40px", position: "relative" }}>
        {/* Email + slug input — shared across tiers */}
        <div style={{
          background: "#fff", border: "1px solid #e8e4da", borderRadius: 14,
          padding: 20, marginBottom: 28,
          display: "flex", flexDirection: "column", gap: 10,
          fontFamily: "system-ui, sans-serif",
        }}>
          <label style={{ fontSize: ".85rem", fontWeight: 600, color: "#0f1f3d" }}>
            Your email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", padding: "10px 12px", marginTop: 6,
                border: "1px solid #d1cfc6", borderRadius: 8,
                fontSize: "1rem", fontFamily: "system-ui, sans-serif",
                color: "#0f1f3d", background: "#fff", fontWeight: 400,
              }}
            />
          </label>
          <label style={{ fontSize: ".85rem", fontWeight: 600, color: "#0f1f3d" }}>
            Your dispensary slug <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional — dispensary plans only)</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. rise-joliet-rock-creek"
              style={{
                width: "100%", padding: "10px 12px", marginTop: 6,
                border: "1px solid #d1cfc6", borderRadius: 8,
                fontSize: "1rem", fontFamily: "system-ui, sans-serif",
                color: "#0f1f3d", background: "#fff", fontWeight: 400,
              }}
            />
          </label>
          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #ef4444", color: "#991b1b", padding: 10, borderRadius: 8, fontSize: ".85rem" }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>

          {/* FREE */}
          <article style={tierCard}>
            <div style={tierLabel}>For dispensaries</div>
            <h2 style={tierName}>Listed</h2>
            <div style={tierPrice}>
              <span style={priceBig}>$0</span>
              <span style={pricePeriod}>/month</span>
            </div>
            <p style={tierDesc}>
              Get discovered by local customers at no cost. Your store appears on every relevant city page automatically.
            </p>
            <ul style={featureList}>
              <li>Basic dispensary listing with hours &amp; address</li>
              <li>Appears on city pages and search</li>
              <li>Google rating &amp; review count displayed</li>
              <li>Claim &amp; self-edit your listing anytime</li>
              <li>Submit your deals at <Link href="/dispensary/submit-deal" style={{ color: "#16a34a" }}>/dispensary/submit-deal</Link></li>
            </ul>
            <Link href="/get-listed" style={ctaSecondary}>
              Claim free listing →
            </Link>
          </article>

          {/* FEATURED */}
          <article style={{ ...tierCard, ...tierCardHighlighted }}>
            <div style={popularBadge}>Most popular</div>
            <div style={{ ...tierLabel, color: "#4ade80" }}>For dispensaries</div>
            <h2 style={{ ...tierName, color: "#fff" }}>Featured</h2>
            <div style={tierPrice}>
              <span style={{ ...priceBig, color: "#fff" }}>$49</span>
              <span style={{ ...pricePeriod, color: "rgba(255,255,255,0.5)" }}>/month</span>
            </div>
            <p style={{ ...tierDesc, color: "rgba(255,255,255,0.7)" }}>
              One Featured slot per city. Pinned to the top of every city page and the deals page. Direct lead alerts.
            </p>
            <ul style={{ ...featureList, color: "rgba(255,255,255,0.8)" }}>
              <li>Pinned #1 on your city&apos;s deals page</li>
              <li>&quot;Featured&quot; badge on your profile</li>
              <li>Lead alert email when someone clicks through</li>
              <li>City exclusivity — no other Featured in your city</li>
              <li>Priority support &amp; onboarding</li>
              <li>Cancel anytime, month-to-month</li>
            </ul>
            <button
              onClick={() => startCheckout("featured")}
              disabled={loadingTier === "featured"}
              style={{
                ...ctaPrimary,
                background: loadingTier === "featured" ? "#15803d" : "#16a34a",
                cursor: loadingTier === "featured" ? "not-allowed" : "pointer",
              }}
            >
              {loadingTier === "featured" ? "Redirecting…" : "Start Featured — $49/mo"}
            </button>
          </article>

          {/* PRO CONSUMER */}
          <article style={tierCard}>
            <div style={tierLabel}>For customers</div>
            <h2 style={tierName}>Pro</h2>
            <div style={tierPrice}>
              <span style={priceBig}>$4.99</span>
              <span style={pricePeriod}>/month</span>
            </div>
            <p style={tierDesc}>
              Instant SMS the moment a deal goes live near you. Cancel anytime.
            </p>
            <ul style={featureList}>
              <li>Everything in Standard</li>
              <li>Instant SMS the moment a deal goes live near you</li>
              <li>Price drop alerts: &ldquo;Flower just dropped below $30 near you&rdquo;</li>
              <li>Flash sale early access (15 min before public)</li>
              <li>Your total savings dashboard</li>
              <li>First to know about new dispensary openings</li>
            </ul>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#16a34a", fontFamily: "Georgia, serif", lineHeight: 1 }}>$400–$800</div>
              <div style={{ fontSize: ".72rem", color: "#166534", fontFamily: "system-ui, sans-serif", marginTop: 5 }}>typical Pro user saves per year</div>
            </div>
            <div style={{ fontSize: ".72rem", color: "#6b7280", fontFamily: "system-ui, sans-serif", fontStyle: "italic", textAlign: "center", marginBottom: 10 }}>
              💡 Less than one pre-roll per month
            </div>
            <button
              onClick={() => startCheckout("pro_consumer")}
              disabled={loadingTier === "pro_consumer"}
              style={{
                ...ctaOutline,
                opacity: loadingTier === "pro_consumer" ? 0.6 : 1,
                cursor: loadingTier === "pro_consumer" ? "not-allowed" : "pointer",
              }}
            >
              {loadingTier === "pro_consumer" ? "Redirecting…" : "Go Pro — $4.99/mo"}
            </button>
            <figure style={{ marginTop: 16, padding: "14px 16px", background: "#fff", borderLeft: "3px solid #16a34a", borderRadius: 8, border: "1px solid #e8e4da" }}>
              <blockquote style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: ".92rem", color: "#0f1f3d", lineHeight: 1.5, margin: 0 }}>
                &ldquo;I saved $23 on my last order just from a Tuesday morning text. Worth every penny.&rdquo;
              </blockquote>
              <figcaption style={{ fontFamily: "system-ui, sans-serif", fontSize: ".75rem", color: "#6b7280", marginTop: 8 }}>
                — <strong style={{ color: "#0f1f3d" }}>K.M., Peoria IL</strong> <span style={{ color: "#16a34a", fontWeight: 600 }}>· Beta user</span>
              </figcaption>
            </figure>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px 60px" }}>
        <h2 style={{ fontSize: "1.4rem", letterSpacing: "-0.02em", marginBottom: 18 }}>FAQ</h2>
        <Faq q="How does Featured compare to Leafly?" a="Leafly charges dispensaries $600+/month for basic placement. CleanList Featured is $49/month with city exclusivity — meaning no other dispensary in your city can buy this slot while you hold it." />
        <Faq q="Is there a contract?" a="No. Everything is month-to-month. Cancel in one click from your Stripe portal anytime." />
        <Faq q="When do Pro SMS alerts start?" a="Within 24 hours of signup. You&apos;ll get a confirmation text first, then start receiving alerts based on your ZIP code and chosen categories." />
        <Faq q="What payment methods do you accept?" a="Credit and debit cards via Stripe. Stripe handles all payment processing — CleanList never sees your card details." />
        <Faq q="Can I try Featured on a trial?" a="Email matthew@jacarandapeoria.com. We&apos;re happy to set up a 2-week trial for Illinois dispensaries that have been open more than 6 months." />
      </section>

      <footer style={{ background: "#0f1f3d", padding: "20px 28px", textAlign: "center" }}>
        <span style={{ color: "#fff", fontSize: ".9rem" }}>
          clean<span style={{ color: "#4ade80" }}>list</span>
        </span>
      </footer>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ borderBottom: "1px solid #e8e4da", padding: "16px 0" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>{q}</h3>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: ".92rem", color: "#6b7280", lineHeight: 1.6 }}>{a}</p>
    </div>
  );
}

const tierCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e4da",
  borderRadius: 14,
  padding: 28,
  display: "flex",
  flexDirection: "column",
  position: "relative",
};
const tierCardHighlighted: React.CSSProperties = {
  background: "#0f1f3d",
  border: "2px solid #16a34a",
  color: "#fff",
};
const popularBadge: React.CSSProperties = {
  position: "absolute", top: -12, left: 22,
  background: "#16a34a", color: "#fff",
  fontSize: ".68rem", fontFamily: "system-ui, sans-serif",
  fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
  padding: "4px 12px", borderRadius: 100,
};
const tierLabel: React.CSSProperties = {
  fontSize: ".68rem",
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#16a34a",
  fontFamily: "system-ui, sans-serif",
  marginBottom: 10,
};
const tierName: React.CSSProperties = {
  fontSize: "1.8rem",
  letterSpacing: "-0.03em",
  marginBottom: 10,
  color: "#0f1f3d",
};
const tierPrice: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 4,
  marginBottom: 12,
};
const priceBig: React.CSSProperties = {
  fontSize: "2.4rem",
  fontWeight: 700,
  color: "#0f1f3d",
  letterSpacing: "-0.04em",
};
const pricePeriod: React.CSSProperties = {
  fontSize: "1rem",
  color: "#9ca3af",
  fontFamily: "system-ui, sans-serif",
};
const tierDesc: React.CSSProperties = {
  fontSize: ".92rem",
  color: "#6b7280",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.6,
  marginBottom: 18,
};
const featureList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "0 0 20px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontSize: ".9rem",
  color: "#374151",
  fontFamily: "system-ui, sans-serif",
};
const ctaPrimary: React.CSSProperties = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: 10,
  fontSize: "1rem",
  fontFamily: "system-ui, sans-serif",
  fontWeight: 700,
  textAlign: "center",
  textDecoration: "none",
  marginTop: "auto",
};
const ctaSecondary: React.CSSProperties = {
  background: "#0f1f3d",
  color: "#fff",
  padding: "12px 20px",
  borderRadius: 10,
  fontSize: "1rem",
  fontFamily: "system-ui, sans-serif",
  fontWeight: 700,
  textAlign: "center",
  textDecoration: "none",
  marginTop: "auto",
};
const ctaOutline: React.CSSProperties = {
  background: "transparent",
  color: "#16a34a",
  border: "2px solid #16a34a",
  padding: "10px 20px",
  borderRadius: 10,
  fontSize: "1rem",
  fontFamily: "system-ui, sans-serif",
  fontWeight: 700,
  textAlign: "center",
  textDecoration: "none",
  marginTop: "auto",
};
