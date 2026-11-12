"use client";

// Free weekly alert signup (email + town), same endpoint as WeeklySignup:
// POST /api/alerts/signup with tier "free" (a Monday email). Double opt-in is
// handled server-side; "pending" means check your inbox to confirm.
import { useState } from "react";
import { Arrow } from "./Kit";

const TOWNS = ["Peoria", "East Peoria", "Peoria Heights", "Pekin", "Bloomington", "Normal", "Champaign", "Urbana", "Springfield"];

export default function GoldSignup({ defaultCity }: { defaultCity?: string | null }) {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState(defaultCity && TOWNS.includes(defaultCity) ? defaultCity : "Peoria");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "pending" | "err">("idle");

  if (state === "done" || state === "pending") {
    return (
      <p className="g-signup-ok" role="status">
        {state === "done"
          ? `You're in. ${city}'s best deals land Monday morning.`
          : "Almost there: check your inbox and tap the confirm link."}
      </p>
    );
  }

  return (
    <form
      className="g-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        try {
          const r = await fetch("/api/alerts/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, city: city.toLowerCase(), tier: "free", categories: ["all"], website: hp }),
          });
          const j = await r.json().catch(() => null);
          setState(!r.ok ? "err" : j?.status === "active" ? "done" : "pending");
        } catch {
          setState("err");
        }
      }}
    >
      <label className="sr-only" htmlFor="g-email">Email address</label>
      <input id="g-email" className="g-input" type="email" name="email" placeholder="you@email.com" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="sr-only" htmlFor="g-town">Your town</label>
      <select id="g-town" className="g-input" value={city} onChange={(e) => setCity(e.target.value)}>
        {TOWNS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1 }} />
      <button className="g-btn g-btn-gold" type="submit" disabled={state === "busy"}>
        {state === "busy" ? "Signing you up…" : <>Send me the deals <Arrow /></>}
      </button>
      {state === "err" && <p className="g-signup-err" role="alert">That didn&apos;t go through. Try again in a minute.</p>}
    </form>
  );
}
