'use client';

import { useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function submitLead(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone,
      business_name: data.business_name,
      city: data.city,
      niche: "cannabis-illinois",
      created_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error("Submission failed");
  return true;
}

const stats = [
  { number: "2,400+", label: "Monthly searches for IL dispensaries" },
  { number: "Free", label: "Base listing, always" },
  { number: "72hrs", label: "Average time to go live" },
];

const reasons = [
  {
    icon: "◈",
    title: "You're already being searched",
    body: "Customers are actively looking for dispensaries in your city right now. The question is whether they find you — or your competitor.",
  },
  {
    icon: "◉",
    title: "One listing. Every directory.",
    body: "Directory Network powers multiple local directories. Claim once and your business appears across the entire network.",
  },
  {
    icon: "◎",
    title: "No tech skills needed",
    body: "Fill out a form. We handle the rest. Your listing is live within 72 hours, fully optimized.",
  },
];

const tiers = [
  {
    name: "Listed",
    price: "Free",
    desc: "Get found. Start here.",
    features: ["Basic business profile", "Address & hours", "Phone & website", "Map placement"],
    cta: "Claim Free Listing",
    highlight: false,
  },
  {
    name: "Boost",
    price: "$49/mo",
    desc: "Stand out from the crowd.",
    features: ["Everything in Listed", "Priority placement", "Photo gallery", "Review prompts", "Monthly insights"],
    cta: "Start Boosting",
    highlight: true,
  },
  {
    name: "Featured",
    price: "$149/mo",
    desc: "Own your category.",
    features: ["Everything in Boost", "Top of category page", "Homepage spotlight", "Dedicated profile page", "Direct lead alerts"],
    cta: "Get Featured",
    highlight: false,
  },
];

const colors = {
  bg: "#f8f7f4",
  surface: "#ffffff",
  navy: "#0f1f3d",
  navyLight: "#1e3a5f",
  accent: "#16a34a",
  accentLight: "#dcfce7",
  accentDark: "#14532d",
  text: "#1e293b",
  textMid: "#475569",
  textLight: "#94a3b8",
  border: "#e2e8f0",
  claimBg: "#0f1f3d",
};

const styles = {
  root: { fontFamily: "'Georgia', 'Times New Roman', serif", background: colors.bg, color: colors.text, minHeight: "100vh", lineHeight: 1.6 },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", background: colors.surface, borderBottom: `1px solid ${colors.border}`, position: "sticky", top: 0, zIndex: 100 },
  logo: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: colors.navy, fontFamily: "'Georgia', serif" },
  logoAccent: { color: colors.accent },
  navCta: { background: colors.accent, color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontSize: "0.875rem", fontFamily: "system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.01em" },
  hero: { maxWidth: "860px", margin: "0 auto", padding: "80px 40px 60px", textAlign: "center" },
  heroBadge: { display: "inline-block", background: colors.accentLight, color: colors.accentDark, padding: "6px 16px", borderRadius: "100px", fontSize: "0.8rem", fontFamily: "system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "24px" },
  heroH1: { fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 700, lineHeight: 1.15, color: colors.navy, letterSpacing: "-0.03em", marginBottom: "20px" },
  heroAccent: { color: colors.accent },
  heroSub: { fontSize: "1.15rem", color: colors.textMid, maxWidth: "600px", margin: "0 auto 36px", fontFamily: "system-ui, sans-serif", lineHeight: 1.7 },
  heroActions: { display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "56px" },
  heroPrimary: { background: colors.accent, color: "#fff", padding: "16px 32px", borderRadius: "8px", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.01em" },
  heroSecondary: { background: "transparent", color: colors.navy, padding: "16px 32px", borderRadius: "8px", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: "1rem", border: `2px solid ${colors.border}` },
  statsRow: { display: "flex", justifyContent: "center", gap: "48px", flexWrap: "wrap", borderTop: `1px solid ${colors.border}`, paddingTop: "40px" },
  statItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  statNum: { fontSize: "2rem", fontWeight: 700, color: colors.navy, letterSpacing: "-0.03em" },
  statLabel: { fontSize: "0.8rem", color: colors.textMid, fontFamily: "system-ui, sans-serif", textAlign: "center" },
  section: { padding: "80px 40px" },
  sectionInner: { maxWidth: "1000px", margin: "0 auto", textAlign: "center" },
  eyebrow: { fontSize: "0.75rem", fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: colors.accent, marginBottom: "12px" },
  eyebrowLight: { fontSize: "0.75rem", fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a3e635", marginBottom: "12px" },
  sectionH2: { fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, color: colors.navy, letterSpacing: "-0.03em", marginBottom: "48px", lineHeight: 1.2 },
  reasonsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", textAlign: "left" },
  reasonCard: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "32px" },
  reasonIcon: { fontSize: "1.5rem", color: colors.accent, display: "block", marginBottom: "16px" },
  reasonTitle: { fontSize: "1.1rem", fontWeight: 700, color: colors.navy, marginBottom: "10px", letterSpacing: "-0.01em" },
  reasonBody: { fontSize: "0.95rem", color: colors.textMid, fontFamily: "system-ui, sans-serif", lineHeight: 1.65, margin: 0 },
  claimSection: { background: colors.claimBg, padding: "80px 40px" },
  claimInner: { maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" },
  claimLeft: { color: "#fff" },
  claimH2: { fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "16px" },
  claimSub: { fontSize: "1rem", color: "#94a3b8", fontFamily: "system-ui, sans-serif", lineHeight: 1.7, marginBottom: "28px" },
  claimList: { listStyle: "none", padding: 0, margin: 0 },
  claimListItem: { fontFamily: "system-ui, sans-serif", fontSize: "0.95rem", color: "#e2e8f0", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" },
  check: { color: colors.accent, fontWeight: 700 },
  claimRight: {},
  form: { background: "#fff", borderRadius: "12px", padding: "36px", display: "flex", flexDirection: "column", gap: "16px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.8rem", fontFamily: "system-ui, sans-serif", fontWeight: 600, color: colors.textMid, letterSpacing: "0.04em", textTransform: "uppercase" },
  input: { border: `1px solid ${colors.border}`, borderRadius: "6px", padding: "12px 14px", fontSize: "0.95rem", fontFamily: "system-ui, sans-serif", color: colors.text, background: colors.bg, outline: "none" },
  submitBtn: { background: colors.accent, color: "#fff", border: "none", borderRadius: "8px", padding: "16px", fontSize: "1rem", fontFamily: "system-ui, sans-serif", fontWeight: 700, cursor: "pointer", letterSpacing: "0.01em", marginTop: "4px" },
  formNote: { fontSize: "0.78rem", color: colors.textLight, fontFamily: "system-ui, sans-serif", textAlign: "center", margin: 0 },
  errorMsg: { fontSize: "0.85rem", color: "#dc2626", fontFamily: "system-ui, sans-serif", margin: 0 },
  successBox: { background: "#fff", borderRadius: "12px", padding: "48px 36px", textAlign: "center" },
  successIcon: { width: "56px", height: "56px", background: colors.accentLight, color: colors.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, margin: "0 auto 20px" },
  successTitle: { fontSize: "1.5rem", fontWeight: 700, color: colors.navy, marginBottom: "12px", letterSpacing: "-0.02em" },
  successBody: { fontSize: "0.95rem", color: colors.textMid, fontFamily: "system-ui, sans-serif", lineHeight: 1.65 },
  tiersGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", textAlign: "left" },
  tierCard: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "32px", position: "relative" },
  tierCardHighlight: { background: colors.navy, border: `1px solid ${colors.navyLight}` },
  tierBadge: { position: "absolute", top: "-12px", left: "24px", background: colors.accent, color: "#fff", fontSize: "0.72rem", fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px", borderRadius: "100px" },
  tierName: { fontSize: "1rem", fontWeight: 700, color: colors.navy, fontFamily: "system-ui, sans-serif", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "8px" },
  tierPrice: { fontSize: "2rem", fontWeight: 700, color: colors.navy, letterSpacing: "-0.03em", marginBottom: "6px" },
  tierDesc: { fontSize: "0.875rem", color: colors.textMid, fontFamily: "system-ui, sans-serif", marginBottom: "20px" },
  tierFeatures: { listStyle: "none", padding: 0, margin: "0 0 24px" },
  tierFeatureItem: { fontSize: "0.875rem", fontFamily: "system-ui, sans-serif", color: colors.textMid, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" },
  tierCta: { display: "block", textAlign: "center", border: `2px solid ${colors.navy}`, color: colors.navy, borderRadius: "8px", padding: "12px", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: "0.9rem" },
  tierCtaHighlight: { display: "block", textAlign: "center", background: colors.accent, color: "#fff", borderRadius: "8px", padding: "12px", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: "0.9rem" },
  finalCta: { background: colors.accentLight, padding: "80px 40px", textAlign: "center" },
  finalH2: { fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, color: colors.navy, letterSpacing: "-0.03em", marginBottom: "12px" },
  finalSub: { fontSize: "1.1rem", color: colors.textMid, fontFamily: "system-ui, sans-serif", marginBottom: "32px" },
  footer: { background: colors.navy, padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  footerNote: { fontSize: "0.8rem", color: "#64748b", fontFamily: "system-ui, sans-serif", margin: 0 },
};

export default function DirectoryLanding() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", business_name: "", city: "" });
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try { await submitLead(form); setStatus("success"); }
    catch { setStatus("error"); }
  };

  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <span style={styles.logo}>Directory<span style={styles.logoAccent}>Network</span></span>
        <a href="#claim" style={styles.navCta}>Claim Your Listing →</a>
      </nav>
      <section style={styles.hero}>
        <div style={styles.heroBadge}>Illinois Cannabis Directory</div>
        <h1 style={styles.heroH1}>Your dispensary deserves<br /><span style={styles.heroAccent}>to be found.</span></h1>
        <p style={styles.heroSub}>Illinois cannabis buyers are searching right now. Claim your free listing in the Directory Network and make sure they find you — not just your competitors.</p>
        <div style={styles.heroActions}>
          <a href="#claim" style={styles.heroPrimary}>Claim Your Free Listing</a>
          <a href="#why" style={styles.heroSecondary}>See how it works</a>
        </div>
        <div style={styles.statsRow}>
          {stats.map((s) => (
            <div key={s.label} style={styles.statItem}>
              <span style={styles.statNum}>{s.number}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section id="why" style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>Why Directory Network</p>
          <h2 style={styles.sectionH2}>Built for local businesses.<br />Not big chains.</h2>
          <div style={styles.reasonsGrid}>
            {reasons.map((r) => (
              <div key={r.title} style={styles.reasonCard}>
                <span style={styles.reasonIcon}>{r.icon}</span>
                <h3 style={styles.reasonTitle}>{r.title}</h3>
                <p style={styles.reasonBody}>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="claim" style={styles.claimSection}>
        <div style={styles.claimInner}>
          <div style={styles.claimLeft}>
            <p style={styles.eyebrowLight}>Get Started Today</p>
            <h2 style={styles.claimH2}>Claim your listing.<br />It takes 2 minutes.</h2>
            <p style={styles.claimSub}>Free forever. No credit card. No tech skills needed. We'll reach out within 24 hours to confirm your info and get you live.</p>
            <ul style={styles.claimList}>
              {["Free base listing included", "Live within 72 hours", "Upgrade anytime"].map((item) => (
                <li key={item} style={styles.claimListItem}><span style={styles.check}>✓</span> {item}</li>
              ))}
            </ul>
          </div>
          <div style={styles.claimRight}>
            {status === "success" ? (
              <div style={styles.successBox}>
                <div style={styles.successIcon}>✓</div>
                <h3 style={styles.successTitle}>You're on the list.</h3>
                <p style={styles.successBody}>We'll reach out within 24 hours to confirm your details and get your listing live.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formRow}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Your Name</label>
                    <input style={styles.input} name="name" placeholder="Jane Smith" value={form.name} onChange={handleChange} required />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Business Name</label>
                    <input style={styles.input} name="business_name" placeholder="Green Leaf Dispensary" value={form.business_name} onChange={handleChange} required />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Email</label>
                    <input style={styles.input} name="email" type="email" placeholder="jane@greenlead.com" value={form.email} onChange={handleChange} required />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Phone</label>
                    <input style={styles.input} name="phone" type="tel" placeholder="(312) 555-0100" value={form.phone} onChange={handleChange} />
                  </div>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>City</label>
                  <input style={styles.input} name="city" placeholder="Chicago" value={form.city} onChange={handleChange} required />
                </div>
                {status === "error" && <p style={styles.errorMsg}>Something went wrong. Please try again or email us directly.</p>}
                <button type="submit" style={status === "loading" ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn} disabled={status === "loading"}>
                  {status === "loading" ? "Submitting..." : "Claim My Free Listing →"}
                </button>
                <p style={styles.formNote}>No credit card. No commitment. Free forever.</p>
              </form>
            )}
          </div>
        </div>
      </section>
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>Upgrade When Ready</p>
          <h2 style={styles.sectionH2}>Start free. Grow on your terms.</h2>
          <div style={styles.tiersGrid}>
            {tiers.map((t) => (
              <div key={t.name} style={t.highlight ? { ...styles.tierCard, ...styles.tierCardHighlight } : styles.tierCard}>
                {t.highlight && <div style={styles.tierBadge}>Most Popular</div>}
                <h3 style={t.highlight ? { ...styles.tierName, color: "#fff" } : styles.tierName}>{t.name}</h3>
                <div style={t.highlight ? { ...styles.tierPrice, color: "#a3e635" } : styles.tierPrice}>{t.price}</div>
                <p style={t.highlight ? { ...styles.tierDesc, color: "#94a3b8" } : styles.tierDesc}>{t.desc}</p>
                <ul style={styles.tierFeatures}>
                  {t.features.map((f) => (
                    <li key={f} style={t.highlight ? { ...styles.tierFeatureItem, color: "#e2e8f0" } : styles.tierFeatureItem}>
                      <span style={t.highlight ? { ...styles.check, color: "#a3e635" } : styles.check}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="#claim" style={t.highlight ? styles.tierCtaHighlight : styles.tierCta}>{t.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={styles.finalCta}>
        <h2 style={styles.finalH2}>Your competitors are already listed.</h2>
        <p style={styles.finalSub}>Don't let them take the customers searching for you.</p>
        <a href="#claim" style={styles.heroPrimary}>Claim Your Free Listing Now →</a>
      </section>
      <footer style={styles.footer}>
        <span style={styles.logo}>Directory<span style={styles.logoAccent}>Network</span></span>
        <p style={styles.footerNote}>© 2025 Directory Network. Built for local business owners.</p>
      </footer>
    </div>
  );
}
