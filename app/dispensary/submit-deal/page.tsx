// app/dispensary/submit-deal/page.tsx
// Public-facing form dispensaries use to submit their active deals.
// No auth — we intentionally keep the friction low. Spam mitigation
// is handled server-side in /api/dispensary/submit-deal via basic
// rate limiting, honeypot, and a 'pending' status on new deals so
// they don't hit public pages until reviewed.

"use client";

import { useState } from "react";
import Link from "next/link";

type FormState = {
  dispensary_name: string;
  listing_slug: string;
  contact_email: string;
  deal_title: string;
  deal_description: string;
  category: string;
  discount_type: string;
  discount_value: string;
  original_price: string;
  sale_price: string;
  unit: string;
  is_recurring: boolean;
  recurring_days: string;
  expires_at: string;
  // Honeypot — real users won't fill this, bots will
  website: string;
};

const CATEGORIES = ["flower", "edibles", "vapes", "concentrate", "pre-roll", "accessory", "other"];
const DISCOUNT_TYPES = ["percent", "flat", "bogo", "price_drop"];

export default function SubmitDealPage() {
  const [form, setForm] = useState<FormState>({
    dispensary_name: "",
    listing_slug: "",
    contact_email: "",
    deal_title: "",
    deal_description: "",
    category: "flower",
    discount_type: "percent",
    discount_value: "",
    original_price: "",
    sale_price: "",
    unit: "",
    is_recurring: false,
    recurring_days: "",
    expires_at: "",
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setMsg("");
    try {
      const res = await fetch("/api/dispensary/submit-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("ok");
        setMsg("Deal submitted. We'll review and publish within a few hours.");
      } else {
        setStatus("err");
        setMsg(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setStatus("err");
      setMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f4f0", minHeight: "100vh", color: "#0f1f3d" }}>
      <nav style={{ padding: "14px 28px", background: "#0f1f3d" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700 }}>
          clean<span style={{ color: "#4ade80" }}>list</span>
        </Link>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 8, letterSpacing: "-0.02em" }}>Submit your deal</h1>
        <p style={{ color: "#6b7280", fontFamily: "system-ui, sans-serif", marginBottom: 28 }}>
          Free for all Illinois dispensaries. Your deal appears on the homepage, your
          city page, and the relevant category page within a few hours of approval.
        </p>

        {status === "ok" && (
          <div style={{ background: "#dcfce7", border: "1px solid #16a34a", color: "#166534", padding: 16, borderRadius: 10, marginBottom: 24, fontFamily: "system-ui, sans-serif" }}>
            {msg}
          </div>
        )}
        {status === "err" && (
          <div style={{ background: "#fee2e2", border: "1px solid #ef4444", color: "#991b1b", padding: 16, borderRadius: 10, marginBottom: 24, fontFamily: "system-ui, sans-serif" }}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Honeypot — visually hidden, real users won't fill */}
          <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
            <label>
              Website (leave blank)
              <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} />
            </label>
          </div>

          <Field label="Dispensary name *">
            <input required value={form.dispensary_name} onChange={(e) => update("dispensary_name", e.target.value)} style={input} />
          </Field>

          <Field label="CleanList listing slug (e.g. rise-joliet-rock-creek)">
            <input value={form.listing_slug} onChange={(e) => update("listing_slug", e.target.value)} style={input} placeholder="optional — we'll match by name if blank" />
          </Field>

          <Field label="Your contact email *">
            <input required type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} style={input} />
          </Field>

          <Field label="Deal headline *">
            <input required value={form.deal_title} onChange={(e) => update("deal_title", e.target.value)} style={input} placeholder="e.g. 30% off all vapes today" />
          </Field>

          <Field label="Description">
            <textarea value={form.deal_description} onChange={(e) => update("deal_description", e.target.value)} style={{ ...input, height: 90, resize: "vertical" }} placeholder="Details, restrictions, which brands, etc." />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Category *">
              <select required value={form.category} onChange={(e) => update("category", e.target.value)} style={input}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Discount type *">
              <select required value={form.discount_type} onChange={(e) => update("discount_type", e.target.value)} style={input}>
                {DISCOUNT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Discount value">
              <input value={form.discount_value} onChange={(e) => update("discount_value", e.target.value)} style={input} placeholder="30" />
            </Field>
            <Field label="Original price ($)">
              <input value={form.original_price} onChange={(e) => update("original_price", e.target.value)} style={input} placeholder="60" />
            </Field>
            <Field label="Sale price ($)">
              <input value={form.sale_price} onChange={(e) => update("sale_price", e.target.value)} style={input} placeholder="42" />
            </Field>
          </div>

          <Field label="Unit (gram, cart, 100mg pack, etc.)">
            <input value={form.unit} onChange={(e) => update("unit", e.target.value)} style={input} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
            <label style={{ fontFamily: "system-ui, sans-serif", fontSize: ".9rem", display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.is_recurring} onChange={(e) => update("is_recurring", e.target.checked)} />
              Recurring
            </label>
            {form.is_recurring && (
              <Field label="Recurring days (e.g. Mon,Wed,Fri)">
                <input value={form.recurring_days} onChange={(e) => update("recurring_days", e.target.value)} style={input} />
              </Field>
            )}
          </div>

          <Field label="Expires at (leave blank if no end date)">
            <input type="datetime-local" value={form.expires_at} onChange={(e) => update("expires_at", e.target.value)} style={input} />
          </Field>

          <button type="submit" disabled={submitting} style={{
            background: "#16a34a", color: "#fff", border: "none",
            padding: "14px 24px", borderRadius: 10, fontSize: "1rem",
            fontFamily: "system-ui, sans-serif", fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? "Submitting…" : "Submit deal"}
          </button>

          <p style={{ fontSize: ".8rem", color: "#9ca3af", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
            Free to submit. We review each deal before it goes live (usually within a few hours).
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "system-ui, sans-serif", fontSize: ".85rem", color: "#0f1f3d", fontWeight: 600 }}>
      {label}
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #d1cfc6",
  borderRadius: 8,
  fontSize: "1rem",
  fontFamily: "system-ui, sans-serif",
  color: "#0f1f3d",
  background: "#fff",
  fontWeight: 400,
};
