"use client";

import { useState } from "react";

export default function ProCheckoutButton() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    const e = email.trim();
    if (!e || !e.includes("@")) {
      setError("Enter your email to continue.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro_consumer", email: e }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        try {
          const w = window as any;
          if (typeof w.gtag === "function") w.gtag("event", "pro_checkout_start", { tier: "pro_consumer" });
        } catch {}
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Checkout unavailable. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

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
          padding: "10px 12px",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          fontSize: ".9rem",
          outline: "none",
        }}
      />
      <button type="button" className="cta cta-pro" onClick={onClick} disabled={busy}>
        {busy ? "Redirecting…" : "Get Pro for $0.99/month →"}
      </button>
      {error && (
        <div style={{ fontSize: ".78rem", color: "#fca5a5", fontFamily: "system-ui, sans-serif" }}>{error}</div>
      )}
    </div>
  );
}
