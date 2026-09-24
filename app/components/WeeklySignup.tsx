"use client";
// Email + city → weekly Monday report. Posts JSON to /api/alerts/signup.
import { useState } from "react";

const CITIES = ["Peoria", "East Peoria", "Peoria Heights", "Pekin", "Bloomington", "Normal", "Champaign", "Urbana", "Springfield"];

export default function WeeklySignup({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Peoria");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  const fg = tone === "dark" ? "var(--pp-canopy-text)" : "var(--pp-ink)";
  const field: React.CSSProperties = {
    padding: "11px 12px", borderRadius: 10, border: "1px solid var(--pp-border)", fontSize: 15,
    background: "var(--pp-surface)", color: "var(--pp-ink)", minWidth: 0,
  };
  if (state === "done") {
    return <p style={{ color: fg, fontWeight: 600, margin: 0 }}>✓ You&apos;re in. First report lands Monday.</p>;
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        try {
          const r = await fetch("/api/alerts/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, city: city.toLowerCase(), tier: "free", categories: ["all"], website: hp }),
          });
          setState(r.ok ? "done" : "err");
        } catch {
          setState("err");
        }
      }}
      style={{ display: "flex", flexWrap: "wrap", gap: 8, width: "100%" }}
    >
      <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" style={{ ...field, flex: "2 1 200px" }} />
      <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Your city" style={{ ...field, flex: "1 1 140px" }}>
        {CITIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1 }} name="website" />
      <button type="submit" disabled={state === "busy"} style={{ padding: "11px 16px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", background: "var(--pp-btn)", color: "var(--pp-btn-fg)", boxShadow: "inset 0 0 0 1px var(--pp-btn-border)", flex: "1 1 auto" }}>
        {state === "busy" ? "Saving…" : "Send me Mondays"}
      </button>
      {state === "err" && <span style={{ color: fg, fontSize: 13, width: "100%" }}>That didn&apos;t save — check the email and try again.</span>}
      <span style={{ color: fg, opacity: 0.75, fontSize: 12, width: "100%" }}>One email a week. Unsubscribe in one click.</span>
    </form>
  );
}
