"use client";

import { useMemo, useState } from "react";
import {
  type Category,
  type SubmissionInput,
  type SubmitterRole,
  pricePerGram,
  pricePerMg,
  validateSubmission,
} from "../../../lib/submissionValidation";

type ListingOpt = { slug: string; name: string; city: string };

type Props = { listings: ListingOpt[] };

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "flower", label: "Flower" },
  { value: "pre-roll", label: "Pre-roll" },
  { value: "vape", label: "Vape" },
  { value: "concentrate", label: "Concentrate" },
  { value: "edibles", label: "Edibles" },
  { value: "topicals", label: "Topicals" },
  { value: "accessories", label: "Accessories" },
  { value: "all", label: "All / Other" },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABEL: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const WEIGHT_OPTIONS = [
  { label: "1g", value: 1 },
  { label: "3.5g (eighth)", value: 3.5 },
  { label: "7g (quarter)", value: 7 },
  { label: "14g (half)", value: 14 },
  { label: "28g (ounce)", value: 28 },
  { label: "0.5g (cartridge)", value: 0.5 },
  { label: "Custom", value: -1 },
];

function initialState(): SubmissionInput {
  return {
    dispensary_slug: null,
    dispensary_name_freetext: null,
    dispensary_city_freetext: null,
    submitter_email: "",
    submitter_role: "owner",
    deal_title: "",
    deal_description: "",
    category: "flower",
    strain_or_product: "",
    brand: "",
    weight_grams: null,
    mg_thc: null,
    count: null,
    regular_price_usd: null,
    sale_price_usd: null,
    start_date: "",
    end_date: "",
    is_recurring: false,
    recurring_days: [],
    source_url: "",
    notes: "",
    website: "",
  };
}

export default function SubmitForm({ listings }: Props) {
  const [form, setForm] = useState<SubmissionInput>(initialState());
  const [showFreetext, setShowFreetext] = useState(false);
  const [customWeight, setCustomWeight] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof SubmissionInput>(k: K, v: SubmissionInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const cat = form.category;
  const showWeight =
    cat === "flower" || cat === "pre-roll" || cat === "concentrate" || cat === "vape";
  const showMg = cat === "edibles" || cat === "topicals";
  const showCount = cat === "edibles" || cat === "pre-roll";
  const skipPrice = cat === "accessories" || cat === "all";

  const ppg = useMemo(() => pricePerGram(form.weight_grams, form.sale_price_usd), [form.weight_grams, form.sale_price_usd]);
  const ppm = useMemo(() => pricePerMg(form.mg_thc, form.sale_price_usd), [form.mg_thc, form.sale_price_usd]);

  const clientErrors = useMemo(() => validateSubmission(form), [form]);
  const canSubmit = clientErrors.length === 0 && !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});
    const errs = validateSubmission(form);
    if (errs.length > 0) {
      const map: Record<string, string> = {};
      errs.forEach((x) => {
        if (!map[x.field]) map[x.field] = x.message;
      });
      setFieldErrors(map);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/deals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setServerError(
          payload?.error ||
            "Deal submission temporarily unavailable — the backend schema is being applied. Please try again later."
        );
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setServerError(payload?.error || "Something went wrong. Please try again.");
        if (payload?.fieldErrors) setFieldErrors(payload.fieldErrors);
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setSubmitting(false);
      if (typeof window !== "undefined" && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
          "event",
          "deal_submission_success",
          { category: form.category }
        );
      }
    } catch {
      setServerError(
        "Your submission didn't save — please try again, or email matthew@jacarandapeoria.com."
      );
      setSubmitting(false);
    }
  };

  const reset = () => {
    const keepSlug = form.dispensary_slug;
    setForm({ ...initialState(), dispensary_slug: keepSlug });
    setSubmitted(false);
    setServerError(null);
    setFieldErrors({});
  };

  if (submitted) {
    return (
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderLeft: "4px solid #16a34a",
          borderRadius: 12,
          padding: "22px 22px 20px",
          fontFamily: "system-ui, sans-serif",
        }}
        role="status"
        aria-live="polite"
      >
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#14532d", marginBottom: 8 }}>
          Thanks — we got your deal submission.
        </div>
        <p style={{ fontSize: ".95rem", color: "#166534", lineHeight: 1.55, marginBottom: 14 }}>
          We&apos;ll review and publish it within 24 hours. If there&apos;s anything we need
          to double-check, we&apos;ll email you at <strong>{form.submitter_email}</strong>.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#16a34a",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: ".9rem",
            cursor: "pointer",
          }}
        >
          Submit another deal
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate style={styles.form}>
      {/* Honeypot — hidden off-screen, not display:none (bots inspect) */}
      <div aria-hidden="true" style={styles.honeypot}>
        <label>
          Website (leave blank)
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website || ""}
            onChange={(e) => update("website", e.target.value)}
          />
        </label>
      </div>

      {serverError && (
        <div role="alert" style={styles.errorBanner}>
          {serverError}
        </div>
      )}

      <Section title="Who's submitting">
        <Field
          id="dispensary_slug"
          label="Your dispensary"
          required
          error={fieldErrors.dispensary_slug}
        >
          {!showFreetext ? (
            <>
              <select
                id="dispensary_slug"
                value={form.dispensary_slug || ""}
                onChange={(e) => update("dispensary_slug", e.target.value || null)}
                style={styles.input}
                aria-required="true"
              >
                <option value="">Select your dispensary…</option>
                {listings.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                    {l.city ? ` — ${l.city}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setShowFreetext(true);
                  update("dispensary_slug", null);
                }}
                style={styles.link}
              >
                Not in the list? Add a new one →
              </button>
            </>
          ) : (
            <>
              <input
                id="dispensary_name_freetext"
                type="text"
                placeholder="Dispensary name"
                value={form.dispensary_name_freetext || ""}
                onChange={(e) => update("dispensary_name_freetext", e.target.value)}
                style={styles.input}
                aria-required="true"
              />
              <input
                id="dispensary_city_freetext"
                type="text"
                placeholder="City"
                value={form.dispensary_city_freetext || ""}
                onChange={(e) => update("dispensary_city_freetext", e.target.value)}
                style={{ ...styles.input, marginTop: 8 }}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowFreetext(false)}
                style={styles.link}
              >
                ← Back to list
              </button>
            </>
          )}
        </Field>

        <Field id="submitter_email" label="Your email" required error={fieldErrors.submitter_email}>
          <input
            id="submitter_email"
            type="email"
            value={form.submitter_email}
            onChange={(e) => update("submitter_email", e.target.value)}
            style={styles.input}
            aria-required="true"
            autoComplete="email"
          />
        </Field>

        <Field id="submitter_role" label="Your role" required error={fieldErrors.submitter_role}>
          <div role="radiogroup" aria-labelledby="submitter_role" style={styles.radioRow}>
            {(["owner", "manager", "budtender", "marketing", "other"] as SubmitterRole[]).map((r) => (
              <label key={r} style={styles.radio}>
                <input
                  type="radio"
                  name="submitter_role"
                  value={r}
                  checked={form.submitter_role === r}
                  onChange={() => update("submitter_role", r)}
                />
                <span style={{ textTransform: "capitalize" }}>{r}</span>
              </label>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Deal basics">
        <Field id="deal_title" label="Deal title" required error={fieldErrors.deal_title}>
          <input
            id="deal_title"
            type="text"
            maxLength={120}
            value={form.deal_title}
            onChange={(e) => update("deal_title", e.target.value)}
            placeholder="e.g. 30% off Cresco eighths — Wax Wednesday"
            style={styles.input}
            aria-required="true"
          />
          <div style={styles.hint}>{form.deal_title.length}/120</div>
        </Field>

        <Field id="category" label="Category" required error={fieldErrors.category}>
          <select
            id="category"
            value={form.category}
            onChange={(e) => update("category", e.target.value as Category)}
            style={styles.input}
            aria-required="true"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="deal_description" label="Deal description" error={fieldErrors.deal_description}>
          <textarea
            id="deal_description"
            maxLength={500}
            rows={3}
            value={form.deal_description || ""}
            onChange={(e) => update("deal_description", e.target.value)}
            placeholder="What's the deal? Any exclusions? Days of the week?"
            style={{ ...styles.input, resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={styles.hint}>{(form.deal_description || "").length}/500</div>
        </Field>
      </Section>

      {!skipPrice && (
        <Section title="Product & pricing">
          <Field id="strain_or_product" label="Strain or product name">
            <input
              id="strain_or_product"
              type="text"
              value={form.strain_or_product || ""}
              onChange={(e) => update("strain_or_product", e.target.value)}
              style={styles.input}
            />
          </Field>
          <Field id="brand" label="Brand">
            <input
              id="brand"
              type="text"
              value={form.brand || ""}
              onChange={(e) => update("brand", e.target.value)}
              style={styles.input}
              placeholder="Cresco, Rythm, Kiva…"
            />
          </Field>

          {showWeight && (
            <Field
              id="weight_grams"
              label={cat === "vape" ? "Cartridge size" : "Weight"}
              required
              error={fieldErrors.weight_grams}
            >
              <select
                id="weight_grams"
                value={customWeight ? -1 : (form.weight_grams ?? "")}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v === -1) {
                    setCustomWeight(true);
                    update("weight_grams", null);
                  } else {
                    setCustomWeight(false);
                    update("weight_grams", v || null);
                  }
                }}
                style={styles.input}
                aria-required="true"
              >
                <option value="">Select…</option>
                {WEIGHT_OPTIONS.map((w) => (
                  <option key={w.label} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
              {customWeight && (
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Grams (e.g. 2.5)"
                  value={form.weight_grams ?? ""}
                  onChange={(e) => update("weight_grams", e.target.value ? Number(e.target.value) : null)}
                  style={{ ...styles.input, marginTop: 8 }}
                  aria-label="Custom weight in grams"
                />
              )}
            </Field>
          )}

          {showMg && (
            <Field id="mg_thc" label="Total THC (mg)" required error={fieldErrors.mg_thc}>
              <input
                id="mg_thc"
                type="number"
                step="1"
                min="1"
                value={form.mg_thc ?? ""}
                onChange={(e) => update("mg_thc", e.target.value ? Number(e.target.value) : null)}
                style={styles.input}
                aria-required="true"
              />
            </Field>
          )}

          {showCount && (
            <Field id="count" label="Count (pieces in pack)">
              <input
                id="count"
                type="number"
                step="1"
                min="1"
                value={form.count ?? ""}
                onChange={(e) => update("count", e.target.value ? Number(e.target.value) : null)}
                style={styles.input}
              />
            </Field>
          )}

          <Field id="regular_price_usd" label="Regular price ($)">
            <input
              id="regular_price_usd"
              type="number"
              step="0.01"
              min="0"
              value={form.regular_price_usd ?? ""}
              onChange={(e) => update("regular_price_usd", e.target.value ? Number(e.target.value) : null)}
              style={styles.input}
            />
          </Field>
          <Field id="sale_price_usd" label="Sale price ($)" required error={fieldErrors.sale_price_usd}>
            <input
              id="sale_price_usd"
              type="number"
              step="0.01"
              min="0"
              value={form.sale_price_usd ?? ""}
              onChange={(e) => update("sale_price_usd", e.target.value ? Number(e.target.value) : null)}
              style={styles.input}
              aria-required="true"
            />
          </Field>

          {(ppg !== null || ppm !== null) && (
            <div style={styles.previewBox}>
              {ppg !== null && (
                <div>
                  Price per gram: <strong>${ppg.toFixed(2)}</strong>
                </div>
              )}
              {ppm !== null && (
                <div>
                  Price per mg THC: <strong>${ppm.toFixed(4)}</strong>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      <Section title="Timing">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field id="start_date" label="Start date">
            <input
              id="start_date"
              type="date"
              value={form.start_date || ""}
              onChange={(e) => update("start_date", e.target.value)}
              style={styles.input}
            />
          </Field>
          <Field id="end_date" label="End date" error={fieldErrors.end_date}>
            <input
              id="end_date"
              type="date"
              value={form.end_date || ""}
              onChange={(e) => update("end_date", e.target.value)}
              style={styles.input}
            />
          </Field>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".95rem", color: "#0f1f3d", fontFamily: "system-ui, sans-serif" }}>
          <input
            type="checkbox"
            checked={!!form.is_recurring}
            onChange={(e) => update("is_recurring", e.target.checked)}
          />
          Recurring deal (e.g. Wax Wednesday)
        </label>
        {form.is_recurring && (
          <Field id="recurring_days" label="Which days?" error={fieldErrors.recurring_days}>
            <div style={styles.dayRow}>
              {DAYS.map((d) => {
                const checked = (form.recurring_days || []).includes(d);
                return (
                  <label key={d} style={{ ...styles.dayChip, ...(checked ? styles.dayChipOn : {}) }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(form.recurring_days || []);
                        if (e.target.checked) next.add(d);
                        else next.delete(d);
                        update("recurring_days", Array.from(next));
                      }}
                      style={{ display: "none" }}
                    />
                    {DAY_LABEL[d]}
                  </label>
                );
              })}
            </div>
          </Field>
        )}
      </Section>

      <Section title="Source & notes">
        <Field id="source_url" label="Menu URL" error={fieldErrors.source_url}>
          <input
            id="source_url"
            type="url"
            value={form.source_url || ""}
            onChange={(e) => update("source_url", e.target.value)}
            placeholder="https://"
            style={styles.input}
          />
        </Field>
        <Field id="notes" label="Anything else?">
          <textarea
            id="notes"
            rows={2}
            value={form.notes || ""}
            onChange={(e) => update("notes", e.target.value)}
            style={{ ...styles.input, resize: "vertical", fontFamily: "inherit" }}
          />
        </Field>
      </Section>

      <button type="submit" disabled={!canSubmit} style={{ ...styles.cta, ...(canSubmit ? {} : styles.ctaDisabled) }}>
        {submitting ? "Submitting…" : "Submit deal for review"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset style={styles.section}>
      <legend style={styles.legend}>{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>
        {label}
        {required ? <span style={{ color: "#dc2626" }}> *</span> : null}
      </label>
      {children}
      {error && (
        <div id={`${id}-err`} role="alert" style={styles.fieldError}>
          {error}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    fontFamily: "system-ui, sans-serif",
  },
  honeypot: {
    position: "absolute",
    left: "-10000px",
    top: "auto",
    width: 1,
    height: 1,
    overflow: "hidden",
  },
  section: {
    background: "#fff",
    border: "1px solid #e8e4da",
    borderLeft: "4px solid #16a34a",
    borderRadius: 12,
    padding: "18px 18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  legend: {
    fontSize: ".72rem",
    fontWeight: 700,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "#16a34a",
    padding: "0 6px",
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: ".85rem", fontWeight: 600, color: "#0f1f3d" },
  input: {
    border: "1px solid #d1cfc6",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: ".95rem",
    background: "#fff",
    color: "#0f1f3d",
    fontFamily: "inherit",
    minHeight: 44,
    width: "100%",
  },
  hint: { fontSize: ".75rem", color: "#9ca3af", textAlign: "right" },
  fieldError: { fontSize: ".82rem", color: "#b91c1c", fontWeight: 500 },
  radioRow: { display: "flex", flexWrap: "wrap", gap: 12 },
  radio: { display: "flex", alignItems: "center", gap: 6, fontSize: ".92rem", color: "#374151" },
  previewBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: ".9rem",
    color: "#166534",
    fontWeight: 600,
  },
  link: {
    background: "none",
    border: "none",
    color: "#16a34a",
    fontSize: ".85rem",
    textAlign: "left",
    padding: "4px 0",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
  },
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderLeft: "4px solid #dc2626",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: 10,
    fontSize: ".92rem",
  },
  cta: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "14px 20px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: "1rem",
    cursor: "pointer",
    minHeight: 52,
    letterSpacing: ".02em",
  },
  ctaDisabled: { background: "#9ca3af", cursor: "not-allowed" },
  dayRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  dayChip: {
    border: "1px solid #d1cfc6",
    borderRadius: 100,
    padding: "6px 14px",
    fontSize: ".8rem",
    color: "#6b7280",
    cursor: "pointer",
    userSelect: "none",
    background: "#fff",
  },
  dayChipOn: { background: "#16a34a", color: "#fff", borderColor: "#16a34a", fontWeight: 700 },
};
