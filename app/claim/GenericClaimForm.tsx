"use client";

// Fallback claim form for owners who can't find their dispensary via
// /search. Posts to /api/claim with a sentinel listing_slug that admin
// reconciles manually. Email is required; everything else optional.

import { useState } from "react";

export default function GenericClaimForm() {
  const [dispensary, setDispensary] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (!dispensary.trim()) {
      setError("Dispensary name required — so we know who to verify.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_slug: "_generic_unclaimed_",
          claimant_name: name,
          claimant_email: email,
          claimant_phone: phone,
          verification_method: "email_reply",
          message: `[Dispensary name: ${dispensary}]\n\n${message}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error || "Could not submit — try again in a moment.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          background: "var(--pp-best-tint)",
          border: "1px solid var(--pp-best-border)",
          borderRadius: 14,
          padding: "22px 24px",
          fontFamily: "var(--font-body)",
        }}
      >
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--pp-signal-ink)", marginBottom: 4 }}>
          Got it — we&apos;ll be in touch.
        </div>
        <div style={{ fontSize: ".88rem", color: "var(--pp-signal)", lineHeight: 1.55 }}>
          We&apos;ll verify and reach out via{" "}
          <strong>{email}</strong> within 24 hours. In the meantime, keep selling.
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: "var(--pp-surface)",
        border: "1px solid var(--pp-border)",
        borderRadius: 14,
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: "var(--font-body)",
      }}
    >
      <label style={labelStyle}>
        Dispensary name *
        <input
          type="text"
          required
          value={dispensary}
          onChange={(e) => setDispensary(e.target.value)}
          placeholder="Zen Leaf Peoria"
          style={inputStyle}
          autoComplete="organization"
        />
      </label>
      <label style={labelStyle}>
        Your name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          style={inputStyle}
          autoComplete="name"
        />
      </label>
      <label style={labelStyle}>
        Email *
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@dispensary.com"
          style={inputStyle}
          autoComplete="email"
          inputMode="email"
        />
      </label>
      <label style={labelStyle}>
        Phone
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(309) 555-0100"
          style={inputStyle}
          autoComplete="tel"
          inputMode="tel"
        />
      </label>
      <label style={labelStyle}>
        Anything we should know? (optional)
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="New address, menu URL, deal we missed..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
        />
      </label>
      {error && (
        <div style={{ fontSize: ".8rem", color: "#dc2626", fontWeight: 600 }}>{error}</div>
      )}
      <button
        type="submit"
        disabled={busy}
        style={{
          background: "var(--pp-signal-fill)",
          color: "var(--pp-on-dark)",
          border: "none",
          borderRadius: 10,
          padding: "14px 20px",
          fontWeight: 700,
          fontSize: ".95rem",
          cursor: busy ? "wait" : "pointer",
          minHeight: 48,
          opacity: busy ? 0.75 : 1,
        }}
      >
        {busy ? "Submitting…" : "Send claim request →"}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: ".8rem",
  color: "var(--pp-body)",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--pp-border)",
  borderRadius: 10,
  padding: "12px 14px",
  fontFamily: "var(--font-body)",
  fontSize: ".95rem",
  color: "var(--pp-ink)",
  outline: "none",
  minHeight: 44,
  background: "var(--pp-surface)",
};
