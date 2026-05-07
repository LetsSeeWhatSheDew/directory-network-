"use client";

// Manual deal entry — admin-only. Posts to /api/admin/deals with the
// service-role key, including the new active_days field gated by the
// day-of-week picker.

import { useState } from "react";
import { DayOfWeekPicker } from "./DayOfWeekPicker";
import type { DayKey } from "../../../../lib/dealActiveFilter";

type FormState = {
  listing_slug: string;
  title: string;
  description: string;
  category: string;
  discount_value: string;
  discount_unit: "percent" | "dollars";
  active_until: string; // YYYY-MM-DD or empty
  source_url: string;
  active_days: DayKey[];
};

const empty: FormState = {
  listing_slug: "",
  title: "",
  description: "",
  category: "all",
  discount_value: "",
  discount_unit: "percent",
  active_until: "",
  source_url: "",
  active_days: [],
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: ".9rem",
  fontFamily: "system-ui, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: ".82rem",
  fontWeight: 600,
  color: "#374151",
  fontFamily: "system-ui, sans-serif",
  marginBottom: 6,
  marginTop: 14,
};

export default function NewDealForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; deal_id: string }
    | { ok: false; error: string }
    | null
  >(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_slug: form.listing_slug.trim(),
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category || null,
          discount_value: form.discount_value
            ? Number(form.discount_value)
            : null,
          discount_unit: form.discount_unit,
          active_until: form.active_until
            ? new Date(form.active_until).toISOString()
            : null,
          source_url: form.source_url.trim() || null,
          active_days: form.active_days.length > 0 ? form.active_days : null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, error: body.error ?? `HTTP ${res.status}` });
      } else {
        setResult({ ok: true, deal_id: body.deal_id });
        setForm(empty);
      }
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label style={labelStyle}>
        Listing slug *
        <input
          required
          style={fieldStyle}
          value={form.listing_slug}
          onChange={(e) => update("listing_slug", e.target.value)}
          placeholder="cookies-peoria-heights"
        />
      </label>

      <label style={labelStyle}>
        Deal title *
        <input
          required
          style={fieldStyle}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Wax Wednesday — 25% off concentrates"
        />
      </label>

      <label style={labelStyle}>
        Description
        <textarea
          style={{ ...fieldStyle, minHeight: 80 }}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={labelStyle}>Category</label>
          <select
            style={fieldStyle}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            <option value="all">All / storewide</option>
            <option value="flower">Flower</option>
            <option value="edibles">Edibles</option>
            <option value="vapes">Vapes</option>
            <option value="concentrate">Concentrate</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Discount value</label>
          <input
            style={fieldStyle}
            type="number"
            min="0"
            step="0.01"
            value={form.discount_value}
            onChange={(e) => update("discount_value", e.target.value)}
            placeholder="25"
          />
        </div>
        <div>
          <label style={labelStyle}>Unit</label>
          <select
            style={fieldStyle}
            value={form.discount_unit}
            onChange={(e) =>
              update("discount_unit", e.target.value as "percent" | "dollars")
            }
          >
            <option value="percent">% off</option>
            <option value="dollars">$ off</option>
          </select>
        </div>
      </div>

      <label style={labelStyle}>
        Active until (optional)
        <input
          type="date"
          style={fieldStyle}
          value={form.active_until}
          onChange={(e) => update("active_until", e.target.value)}
        />
      </label>

      <label style={labelStyle}>
        Source URL
        <input
          type="url"
          style={fieldStyle}
          value={form.source_url}
          onChange={(e) => update("source_url", e.target.value)}
          placeholder="https://dispensary.example.com/specials"
        />
      </label>

      <div style={{ marginTop: 14 }}>
        <label style={{ ...labelStyle, marginTop: 0 }}>
          Active days of the week
        </label>
        <DayOfWeekPicker
          value={form.active_days}
          onChange={(next) => update("active_days", next)}
          disabled={submitting}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 22,
          background: "#7DBA47",
          color: "#fff",
          border: "none",
          padding: "12px 20px",
          borderRadius: 10,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          fontSize: ".95rem",
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "Saving…" : "Create deal"}
      </button>

      {result?.ok && (
        <div
          role="status"
          style={{
            marginTop: 16,
            background: "#dcfce7",
            color: "#14532d",
            border: "1px solid #86efac",
            padding: "10px 14px",
            borderRadius: 10,
            fontFamily: "system-ui, sans-serif",
            fontSize: ".88rem",
          }}
        >
          Deal created. ID: <code>{result.deal_id}</code>
        </div>
      )}
      {result && !result.ok && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            padding: "10px 14px",
            borderRadius: 10,
            fontFamily: "system-ui, sans-serif",
            fontSize: ".88rem",
          }}
        >
          {result.error}
        </div>
      )}
    </form>
  );
}
