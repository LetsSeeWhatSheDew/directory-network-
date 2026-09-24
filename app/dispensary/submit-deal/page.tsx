// app/dispensary/submit-deal/page.tsx
// Public-facing form dispensaries use to submit their active deals.
// No auth — we intentionally keep the friction low. Spam mitigation
// is handled server-side in /api/dispensary/submit-deal via basic
// rate limiting, honeypot, and a 'pending' status on new deals so
// they don't hit public pages until reviewed.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DispensaryAutocomplete from "./DispensaryAutocomplete";
import Footer from "../../components/Footer";
import Nav from "../../components/Nav";

type FormState = {
  dispensary_name: string;
  listing_slug: string;
  city: string;
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

type FieldError = "dispensary_name" | "deal_title" | "category" | "discount_value" | "contact_email";

const CATEGORIES = ["flower", "edibles", "vapes", "concentrate", "pre-roll", "accessory", "other"];
const DISCOUNT_TYPES = ["percent", "flat", "bogo", "price_drop"];

export default function SubmitDealPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    dispensary_name: "",
    listing_slug: "",
    city: "",
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
  const [status, setStatus] = useState<"idle" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldError, string>>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): Partial<Record<FieldError, string>> {
    const errs: Partial<Record<FieldError, string>> = {};
    if (!form.dispensary_name.trim()) errs.dispensary_name = "Dispensary name is required.";
    if (!form.deal_title.trim()) errs.deal_title = "Deal headline is required.";
    if (!form.category.trim()) errs.category = "Pick a category.";
    if (!form.discount_value.trim()) errs.discount_value = "Enter the discount value (e.g. 30 or 5 for $5).";
    if (!form.contact_email.trim() || !form.contact_email.includes("@"))
      errs.contact_email = "A contact email is required so we can verify.";
    return errs;
  }

  const previewSavings = useMemo(() => {
    const v = Number(form.discount_value);
    if (!Number.isFinite(v) || v <= 0) return null;
    if (form.discount_type === "percent") return `${Math.round(v)}% off`;
    if (form.discount_type === "flat") return `$${v} off`;
    if (form.discount_type === "price_drop" && form.original_price && form.sale_price) {
      const saved = Number(form.original_price) - Number(form.sale_price);
      if (saved > 0) return `$${Math.round(saved)} off`;
    }
    return `${v}${form.discount_type === "percent" ? "%" : ""} off`;
  }, [form.discount_value, form.discount_type, form.original_price, form.sale_price]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setMsg("");
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setStatus("err");
      setMsg("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dispensary/submit-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const query = form.city ? `?city=${encodeURIComponent(form.city)}` : "";
        router.push(`/dispensary/submit-deal/confirmed${query}`);
        return;
      }
      setStatus("err");
      setMsg(data.error || "Submission failed. Please try again.");
    } catch {
      setStatus("err");
      setMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", background: "var(--pp-paper)", minHeight: "100vh", color: "var(--pp-ink)" }}>
      <Nav variant="light" />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 8, letterSpacing: "-0.02em" }}>Submit your deal</h1>
        <p style={{ color: "var(--pp-muted)", fontFamily: "var(--font-body)", marginBottom: 28 }}>
          Free to submit. We verify within 24 hours. Your deal goes live to
          PuffPrice users across Central Illinois.
        </p>

        {status === "err" && (
          <div style={{ background: "var(--pp-stop-bg)", border: "1px solid var(--pp-stop-edge)", color: "var(--pp-stop-fg)", padding: 16, borderRadius: 10, marginBottom: 24, fontFamily: "var(--font-body)" }}>
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

          <Field label="Dispensary name *" error={fieldErrors.dispensary_name}>
            <DispensaryAutocomplete
              value={form.dispensary_name}
              style={{ ...input, width: "100%" }}
              placeholder="Type your dispensary name (we'll match to your listing)"
              onSelect={(m) => {
                setForm((f) => ({
                  ...f,
                  dispensary_name: m.name,
                  listing_slug: m.slug,
                  city: m.city || f.city,
                }));
                setFieldErrors((e) => ({ ...e, dispensary_name: undefined }));
              }}
            />
            <input
              type="hidden"
              name="dispensary_name_text"
              value={form.dispensary_name}
              onChange={(e) => update("dispensary_name", e.target.value)}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
            <Field label="PuffPrice listing slug">
              <input value={form.listing_slug} onChange={(e) => update("listing_slug", e.target.value)} style={input} placeholder="auto-filled when you pick above" />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(e) => update("city", e.target.value)} style={input} placeholder="e.g. Peoria" />
            </Field>
          </div>

          <Field label="Your contact email *" error={fieldErrors.contact_email}>
            <input required type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} style={input} />
          </Field>

          <Field label="Deal headline *" error={fieldErrors.deal_title}>
            <input required value={form.deal_title} onChange={(e) => update("deal_title", e.target.value)} style={input} placeholder="e.g. 30% off all vapes today" />
          </Field>

          <Field label="Description">
            <textarea value={form.deal_description} onChange={(e) => update("deal_description", e.target.value)} style={{ ...input, height: 90, resize: "vertical" }} placeholder="Details, restrictions, which brands, etc." />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
            <Field label="Category *" error={fieldErrors.category}>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 12 }}>
            <Field label="Discount value *" error={fieldErrors.discount_value}>
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
            <label style={{ fontFamily: "var(--font-body)", fontSize: ".9rem", display: "flex", alignItems: "center", gap: 8 }}>
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

          {/* LIVE PREVIEW */}
          <div style={{ marginTop: 8, padding: "18px", background: "var(--pp-surface)", border: "1px solid var(--pp-border)", borderRadius: 14, position: "relative" }}>
            <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--pp-signal)", fontFamily: "var(--font-body)", marginBottom: 10 }}>
              Preview — this is how it will appear
            </div>
            <div style={{ background: "linear-gradient(135deg,var(--pp-best-tint) 0%,var(--pp-surface) 60%)", border: "2px solid var(--pp-signal-fill)", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--pp-ink)" }}>
                    {form.dispensary_name || "Your dispensary"}
                  </div>
                  <div style={{ fontSize: ".78rem", color: "var(--pp-muted)", fontFamily: "var(--font-body)" }}>
                    {form.city ? `${form.city}, IL` : "Your city, IL"}
                  </div>
                </div>
                <span style={{ fontSize: ".66rem", background: "var(--pp-best-tint)", color: "var(--pp-signal)", padding: "2px 8px", borderRadius: 100, fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  Likely open
                </span>
              </div>
              <div style={{ fontSize: "1.02rem", fontWeight: 700, color: "var(--pp-signal)", marginBottom: 6 }}>
                {form.deal_title || "Your deal headline"}
              </div>
              {form.deal_description && (
                <div style={{ fontSize: ".8rem", color: "var(--pp-body)", fontFamily: "var(--font-body)", lineHeight: 1.5, marginBottom: 10 }}>
                  {form.deal_description}
                </div>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {form.category && <span style={{ fontSize: ".68rem", color: "var(--pp-muted)", background: "var(--pp-paper)", borderRadius: 100, padding: "2px 9px", fontFamily: "var(--font-body)" }}>{form.category}</span>}
                {form.is_recurring && <span style={{ fontSize: ".68rem", color: "var(--pp-muted)", background: "var(--pp-paper)", borderRadius: 100, padding: "2px 9px", fontFamily: "var(--font-body)" }}>Recurring</span>}
                {form.expires_at && <span style={{ fontSize: ".68rem", color: "var(--pp-muted)", background: "var(--pp-paper)", borderRadius: 100, padding: "2px 9px", fontFamily: "var(--font-body)" }}>Expires {new Date(form.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--pp-best-tint)", border: "1px solid var(--pp-best-border)", borderRadius: 10, padding: "12px 14px" }}>
                <div>
                  <div style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--pp-signal)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: ".12em" }}>You save</div>
                  <div style={{ fontSize: ".68rem", color: "var(--pp-signal-ink)", fontFamily: "var(--font-body)", marginTop: 2 }}>vs. Illinois average</div>
                </div>
                <div style={{ fontSize: "1.7rem", fontWeight: 700, color: "var(--pp-signal)", letterSpacing: "-.02em", lineHeight: 1, fontFamily: "var(--font-display), system-ui, sans-serif" }}>
                  {previewSavings || "—"}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} style={{
            background: "var(--pp-signal-fill)", color: "var(--pp-on-dark)", border: "none",
            padding: "14px 24px", borderRadius: 10, fontSize: "1rem",
            fontFamily: "var(--font-body)", fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? "Submitting…" : "Submit deal"}
          </button>

          <p style={{ fontSize: ".8rem", color: "var(--pp-muted)", fontFamily: "var(--font-body)", textAlign: "center" }}>
            Free to submit. We verify within 24 hours before your deal goes live.
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 6, fontFamily: "var(--font-body)", fontSize: ".85rem", color: "var(--pp-ink)", fontWeight: 600 }}>
      {label}
      {children}
      {error && (
        <span style={{ fontSize: ".78rem", color: "var(--pp-stop-edge)", fontWeight: 500 }}>{error}</span>
      )}
    </label>
  );
}

const input: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--pp-border)",
  borderRadius: 8,
  fontSize: "1rem",
  fontFamily: "var(--font-body)",
  color: "var(--pp-ink)",
  background: "var(--pp-surface)",
  fontWeight: 400,
};
