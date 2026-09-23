"use client";
// ZIP (+ optional email) → /api/waitlist. Used on /illinois-cannabis-delivery and /drive-thru.
import { useState } from "react";

export default function ZipSignup({ source, cta, channel }: { source: "delivery" | "drive_thru"; cta: string; channel?: string }) {
  const [zip, setZip] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  const [msg, setMsg] = useState("");
  const field: React.CSSProperties = { padding: "11px 12px", borderRadius: 10, border: "1px solid var(--pp-border)", fontSize: 15, background: "var(--pp-surface)", color: "var(--pp-ink)", minWidth: 0 };
  if (state === "done") return <p style={{ margin: 0, fontWeight: 600 }}>✓ You&apos;re on the list for {zip}. We&apos;ll only write when it&apos;s real.</p>;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zip, email, source, channel, website: hp }) }).catch(() => null);
        if (r?.ok) setState("done");
        else { setState("err"); setMsg((await r?.json().catch(() => null))?.error || "That didn't save — try again."); }
      }}
      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
    >
      <input inputMode="numeric" pattern="[0-9]{5}" maxLength={5} required placeholder="ZIP" aria-label="ZIP code" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} style={{ ...field, flex: "0 1 110px" }} />
      <input type="email" placeholder="Email (optional)" aria-label="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...field, flex: "2 1 200px" }} />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} style={{ position: "absolute", left: -9999, width: 1, height: 1 }} />
      <button type="submit" disabled={state === "busy"} style={{ padding: "11px 16px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", background: "rgb(255 255 255)", color: "rgb(31 74 50)", flex: "1 1 auto" }}>
        {state === "busy" ? "Saving…" : cta}
      </button>
      {state === "err" && <span style={{ width: "100%", fontSize: 13 }}>{msg}</span>}
      <span style={{ width: "100%", fontSize: 12, opacity: 0.8 }}>ZIP only is fine. We never sell or share it.</span>
    </form>
  );
}
