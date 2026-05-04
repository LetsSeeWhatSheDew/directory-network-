"use client";

import { useState } from "react";

// Decides what to show based on backend response:
// - If Stripe is live and the checkout session returns ok → redirect to Stripe
// - If Stripe 503s (keys not configured), fall back to a "notify me when Pro
//   launches" state that saves the email to deal_alerts so we can email them
//   at launch. A motivated user still gets captured; no one sees a dead end.
type Status =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "waitlisted" }
  | { kind: "error"; message: string };

async function joinWaitlist(
  email: string,
  phone: string,
  smsOptIn: boolean
): Promise<boolean> {
  try {
    const form = new FormData();
    form.set("email", email);
    form.set("city", "_waitlist_");
    form.set("tier", "pro");
    form.append("categories", "all");
    if (phone) form.set("phone", phone);
    if (smsOptIn) form.set("sms_opted_in", "true");
    const res = await fetch("/api/alerts/signup", {
      method: "POST",
      body: form,
      redirect: "manual",
    });
    return res.ok || res.type === "opaqueredirect" || res.status === 0;
  } catch {
    return false;
  }
}

export default function ProCheckoutButton() {
  const [email, setEmail] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onClick() {
    const e = email.trim();
    if (!e || !e.includes("@")) {
      setStatus({ kind: "error", message: "Enter your email to continue." });
      return;
    }
    setStatus({ kind: "busy" });
    try {
      try {
        const w = window as any;
        if (typeof w.gtag === "function") w.gtag("event", "upgrade_click", { tier: "pro" });
      } catch {}
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro_consumer", email: e }),
      });
      // 503 = Stripe not configured yet. Convert to a waitlist capture so the
      // user still gets value (we'll email them when Pro goes live).
      if (res.status === 503) {
        const ok = await joinWaitlist(e, phone.trim(), smsOptIn);
        if (ok) {
          try {
            const w = window as any;
            if (typeof w.gtag === "function")
              w.gtag("event", "pro_waitlist_joined", { tier: "pro_consumer" });
          } catch {}
          setStatus({ kind: "waitlisted" });
        } else {
          setStatus({
            kind: "error",
            message: "Couldn't save your email. Try again in a moment.",
          });
        }
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        try {
          const w = window as any;
          if (typeof w.gtag === "function")
            w.gtag("event", "pro_checkout_start", { tier: "pro_consumer" });
        } catch {}
        window.location.href = data.url;
        return;
      }
      setStatus({
        kind: "error",
        message: data.error || "Checkout unavailable. Please try again.",
      });
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  if (status.kind === "waitlisted") {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          background: "rgba(74,222,128,.12)",
          border: "1px solid rgba(74,222,128,.4)",
          borderRadius: 10,
          padding: "14px 16px",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ fontSize: ".95rem", fontWeight: 700, color: "#fff" }}>
          ✓ You&rsquo;re on the list
        </div>
        <div style={{ fontSize: ".82rem", color: "rgba(255,255,255,.75)", lineHeight: 1.5 }}>
          Pro isn&rsquo;t live yet. We&rsquo;ll email <strong style={{ color: "#93CB5C" }}>{email}</strong>{" "}
          the moment it launches — usually within a few days.
        </div>
      </div>
    );
  }

  const busy = status.kind === "busy";
  const errMsg = status.kind === "error" ? status.message : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        style={{
          background: "rgba(255,255,255,.08)",
          border: "1px solid rgba(255,255,255,.18)",
          borderRadius: 10,
          padding: "12px 12px",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          fontSize: ".95rem",
          outline: "none",
          minHeight: 44,
        }}
      />
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: ".82rem",
          color: "rgba(255,255,255,.78)",
          fontFamily: "system-ui, sans-serif",
          cursor: "pointer",
          userSelect: "none",
          paddingTop: 2,
        }}
      >
        <input
          type="checkbox"
          checked={smsOptIn}
          onChange={(e) => setSmsOptIn(e.target.checked)}
          style={{ accentColor: "#7DBA47", width: 16, height: 16 }}
        />
        Text me when new deals drop near me
      </label>
      {smsOptIn && (
        <input
          type="tel"
          inputMode="tel"
          placeholder="(309) 555-0100 — optional, SMS coming soon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          aria-label="Phone number for SMS alerts (optional)"
          style={{
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 10,
            padding: "12px 12px",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            fontSize: ".95rem",
            outline: "none",
            minHeight: 44,
          }}
        />
      )}
      <button type="button" className="cta cta-pro" onClick={onClick} disabled={busy}>
        {busy ? "One sec…" : "Get Pro for $0.99/month →"}
      </button>
      {errMsg && (
        <div style={{ fontSize: ".78rem", color: "#fca5a5", fontFamily: "system-ui, sans-serif" }}>
          {errMsg}
        </div>
      )}
    </div>
  );
}
