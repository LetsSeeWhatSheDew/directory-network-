"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Freq = "weekly" | "biweekly" | "monthly";
type Spend = "low" | "mid" | "high";

const VISITS: Record<Freq, number> = { weekly: 52, biweekly: 24, monthly: 12 };
const SPEND: Record<Spend, number> = { low: 30, mid: 60, high: 100 };
const AVG_DISCOUNT = 0.15;
const PER_WEEK_DIVISOR = 52;

export default function AlertsCalculator() {
  const [freq, setFreq] = useState<Freq | null>(null);
  const [spend, setSpend] = useState<Spend | null>(null);

  const weeklyOverpay = useMemo(() => {
    if (!freq || !spend) return null;
    const yearly = VISITS[freq] * SPEND[spend] * AVG_DISCOUNT;
    return Math.max(2, Math.round(yearly / PER_WEEK_DIVISOR));
  }, [freq, spend]);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e4da",
        borderRadius: 16,
        padding: 24,
        marginTop: 12,
      }}
    >
      <div style={eyebrow}>Quick math</div>
      <h3 style={h3Style}>How much are you leaving on the table?</h3>

      <Row
        label="How often do you visit a dispensary?"
        options={[
          { v: "weekly" as Freq, l: "Weekly" },
          { v: "biweekly" as Freq, l: "Twice a month" },
          { v: "monthly" as Freq, l: "Monthly" },
        ]}
        value={freq}
        onChange={(v) => setFreq(v)}
      />
      <Row
        label="What's your typical spend per visit?"
        options={[
          { v: "low" as Spend, l: "$20–$40" },
          { v: "mid" as Spend, l: "$40–$80" },
          { v: "high" as Spend, l: "$80+" },
        ]}
        value={spend}
        onChange={(v) => setSpend(v)}
      />

      {weeklyOverpay != null ? (
        <div style={resultCard} aria-live="polite">
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", fontFamily: "Georgia,serif", marginBottom: 10 }}>
            You&apos;re probably overpaying <span style={{ color: "#fca5a5" }}>~${weeklyOverpay}/week</span>.
          </div>
          <div style={{ fontSize: ".95rem", color: "rgba(255,255,255,.75)", fontFamily: "system-ui,sans-serif", marginBottom: 16 }}>
            Fix that for <strong style={{ color: "#4ade80" }}>$0.99/month</strong>.
          </div>
          <Link href="#pro" style={cta} onClick={() => document.querySelector(".tier.pro")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
            Start saving → Get Pro for $0.99/month
          </Link>
        </div>
      ) : (
        <div style={{ fontSize: ".82rem", color: "#9ca3af", fontFamily: "system-ui,sans-serif", marginTop: 4 }}>
          Pick both to see your number.
        </div>
      )}
    </div>
  );
}

function Row<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: T; l: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={rowLabel}>{label}</div>
      <div style={pillRow}>
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              style={{ ...pill, ...(active ? pillActive : {}) }}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: ".7rem",
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#16a34a",
  fontFamily: "system-ui, sans-serif",
  marginBottom: 6,
};
const h3Style: React.CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: 700,
  letterSpacing: "-.02em",
  marginBottom: 18,
  lineHeight: 1.2,
};
const rowLabel: React.CSSProperties = {
  fontSize: ".88rem",
  fontWeight: 700,
  color: "#0f1f3d",
  fontFamily: "Georgia, serif",
  marginBottom: 8,
};
const pillRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
const pill: React.CSSProperties = {
  padding: "9px 16px",
  border: "1px solid #d1cfc6",
  borderRadius: 100,
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
  fontSize: ".86rem",
  fontWeight: 500,
  transition: "all .15s",
};
const pillActive: React.CSSProperties = {
  background: "#0f1f3d",
  borderColor: "#0f1f3d",
  color: "#fff",
  fontWeight: 700,
};
const resultCard: React.CSSProperties = {
  marginTop: 10,
  padding: "20px",
  background: "#0f1f3d",
  borderRadius: 12,
  textAlign: "center",
};
const cta: React.CSSProperties = {
  display: "inline-block",
  background: "#16a34a",
  color: "#fff",
  padding: "11px 20px",
  borderRadius: 10,
  textDecoration: "none",
  fontFamily: "system-ui, sans-serif",
  fontWeight: 700,
  fontSize: ".9rem",
};
