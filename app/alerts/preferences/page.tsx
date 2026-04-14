"use client";

import Link from "next/link";
import { useState } from "react";

export default function AlertPreferencesPage() {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState("25");
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [frequency, setFrequency] = useState("weekly");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(c: string) {
    setCategories((prev) => {
      if (c === "all") return prev.includes("all") ? prev.filter((x) => x !== "all") : ["all"];
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev.filter((x) => x !== "all"), c];
      return next.length === 0 ? ["all"] : next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city, radius, categories, frequency }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        try {
          const w = window as any;
          if (typeof w.gtag === "function") {
            w.gtag("event", "alert_signup", { tier: frequency });
          }
        } catch {}
      } else {
        setError(data.error || "Save failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;position:sticky;top:0;z-index:100}
        .logo{display:flex;align-items:center;gap:8px;color:#fff;text-decoration:none;font-weight:700}
        .logo span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .wrap{max-width:600px;margin:0 auto;padding:40px 20px}
        h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:700;letter-spacing:-.03em;margin-bottom:8px;font-family:Georgia,serif}
        .sub{font-size:.9rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:28px}
        form{background:#fff;border:1px solid #e8e4da;border-radius:14px;padding:24px}
        .field{margin-bottom:20px}
        label.field-label{display:block;font-size:.8rem;font-weight:600;color:#0f1f3d;font-family:system-ui,sans-serif;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em}
        input[type=email],input[type=text]{width:100%;padding:10px 12px;border:1px solid #d1cfc6;border-radius:8px;font-family:system-ui,sans-serif;font-size:.92rem;color:#0f1f3d;outline:none}
        input[type=email]:focus,input[type=text]:focus{border-color:#16a34a}
        .radio-row,.check-row{display:flex;gap:8px;flex-wrap:wrap}
        .pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid #d1cfc6;border-radius:100px;font-family:system-ui,sans-serif;font-size:.85rem;cursor:pointer;background:#fff;color:#374151;transition:all .15s}
        .pill input{accent-color:#16a34a;margin:0}
        .pill:hover{border-color:#9ca3af}
        .pill.active{background:#f0fdf4;border-color:#16a34a;color:#166534;font-weight:600}
        .freq{display:grid;grid-template-columns:1fr;gap:8px}
        .freq label{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid #d1cfc6;border-radius:10px;cursor:pointer;font-family:system-ui,sans-serif;font-size:.88rem;color:#374151;background:#fff;transition:all .15s}
        .freq label.active{background:#f0fdf4;border-color:#16a34a;color:#166534}
        .freq label input{margin-top:3px;accent-color:#16a34a}
        .freq-title{font-weight:600;display:block}
        .freq-desc{font-size:.78rem;color:#6b7280;margin-top:2px}
        .freq label.active .freq-desc{color:#16a34a}
        .save{background:#16a34a;color:#fff;border:none;border-radius:10px;padding:12px 24px;font-family:system-ui,sans-serif;font-weight:700;font-size:.95rem;cursor:pointer;width:100%;margin-top:8px;transition:background .15s}
        .save:hover{background:#15803d}
        .save:disabled{opacity:.6;cursor:not-allowed}
        .msg{margin-top:14px;padding:10px 14px;border-radius:8px;font-family:system-ui,sans-serif;font-size:.85rem}
        .msg.err{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
        .msg.ok{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">clean<span>list</span></Link>
        <Link href="/alerts" className="back">← Back</Link>
      </nav>

      <div className="wrap">
        <h1>Deal alert preferences</h1>
        <p className="sub">Tell us what you want to hear about. Update any time.</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="city">City</label>
            <input id="city" type="text" placeholder="Peoria" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div className="field">
            <span className="field-label">Radius</span>
            <div className="radio-row">
              {[
                { v: "10", l: "10 miles" },
                { v: "25", l: "25 miles" },
                { v: "50", l: "50 miles" },
                { v: "statewide", l: "Statewide" },
              ].map((r) => (
                <label key={r.v} className={`pill${radius === r.v ? " active" : ""}`}>
                  <input type="radio" name="radius" value={r.v} checked={radius === r.v} onChange={() => setRadius(r.v)} />
                  {r.l}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Categories</span>
            <div className="check-row">
              {[
                { v: "flower", l: "Flower" },
                { v: "edibles", l: "Edibles" },
                { v: "vapes", l: "Vapes" },
                { v: "concentrate", l: "Concentrates" },
                { v: "all", l: "All" },
              ].map((c) => (
                <label key={c.v} className={`pill${categories.includes(c.v) ? " active" : ""}`}>
                  <input type="checkbox" checked={categories.includes(c.v)} onChange={() => toggleCategory(c.v)} />
                  {c.l}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Frequency</span>
            <div className="freq">
              {[
                { v: "weekly", t: "Weekly digest", d: "Free · every Monday" },
                { v: "daily", t: "Daily email", d: "$3.99/mo · every morning" },
                { v: "sms", t: "Instant SMS", d: "$4.99/mo · text alerts the moment a deal goes live" },
              ].map((f) => (
                <label key={f.v} className={frequency === f.v ? "active" : ""}>
                  <input type="radio" name="frequency" value={f.v} checked={frequency === f.v} onChange={() => setFrequency(f.v)} />
                  <span>
                    <span className="freq-title">{f.t}</span>
                    <span className="freq-desc">{f.d}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="save" disabled={saving}>
            {saving ? "Saving…" : "Save preferences"}
          </button>

          {error && <div className="msg err">{error}</div>}
          {saved && <div className="msg ok">Saved. You&apos;re all set.</div>}
        </form>
      </div>
    </>
  );
}
