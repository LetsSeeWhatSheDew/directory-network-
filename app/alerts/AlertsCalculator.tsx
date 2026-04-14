"use client";

import { useMemo, useState } from "react";

type Freq = "weekly" | "biweekly" | "monthly";
type Spend = "low" | "mid" | "high";
type DealHabit = "always" | "sometimes" | "never";

// Baseline: weekly + high spend + never checks deals = $15/week overpaid.
// Spec-provided numbers per combo:
//   weekly + $80+   + never = $15/wk
//   weekly + $40-80 + never = $9/wk
//   weekly + $20-40 + never = $5/wk
const WEEKLY_BY_SPEND: Record<Spend, number> = { high: 15, mid: 9, low: 5 };
const FREQ_MULT: Record<Freq, number> = { weekly: 1, biweekly: 0.5, monthly: 0.25 };
const HABIT_MULT: Record<DealHabit, number> = { always: 0.2, sometimes: 0.6, never: 1 };

export default function AlertsCalculator() {
  const [freq, setFreq] = useState<Freq | null>(null);
  const [spend, setSpend] = useState<Spend | null>(null);
  const [habit, setHabit] = useState<DealHabit | null>(null);

  const result = useMemo(() => {
    if (!freq || !spend || !habit) return null;
    const weekly = Math.max(1, Math.round(WEEKLY_BY_SPEND[spend] * FREQ_MULT[freq] * HABIT_MULT[habit]));
    const annual = weekly * 52;
    const eighths = Math.floor(annual / 40);
    return { weekly, annual, eighths };
  }, [freq, spend, habit]);

  return (
    <div style={wrap}>
      <div style={eyebrow}>Quick math</div>
      <h3 style={h3}>How much are you leaving on the table?</h3>

      <Row
        label="How often do you visit a dispensary?"
        value={freq}
        onChange={(v) => setFreq(v)}
        options={[
          { v: "weekly" as Freq, l: "Weekly" },
          { v: "biweekly" as Freq, l: "Twice a month" },
          { v: "monthly" as Freq, l: "Monthly" },
        ]}
      />
      <Row
        label="What's your typical spend per visit?"
        value={spend}
        onChange={(v) => setSpend(v)}
        options={[
          { v: "low" as Spend, l: "$20–$40" },
          { v: "mid" as Spend, l: "$40–$80" },
          { v: "high" as Spend, l: "$80+" },
        ]}
      />
      <Row
        label="Do you check for deals before you go?"
        value={habit}
        onChange={(v) => setHabit(v)}
        options={[
          { v: "always" as DealHabit, l: "Always" },
          { v: "sometimes" as DealHabit, l: "Sometimes" },
          { v: "never" as DealHabit, l: "Never" },
        ]}
      />

      {result ? (
        <div style={resultCard} aria-live="polite">
          <div style={resultBig}>
            You&apos;re probably overpaying <span style={{ color: "#4ade80" }}>~${result.weekly}/week</span>
          </div>
          <div style={resultSmall}>
            That&apos;s <strong>${result.annual}/year</strong>
            {result.eighths > 0 && <> — enough for <strong>{result.eighths} free eighth{result.eighths === 1 ? "" : "s"}</strong></>}.
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                const w = window as any;
                if (typeof w.gtag === "function") w.gtag("event", "calculator_cta", { weekly: result.weekly });
              } catch {}
              const card = document.querySelector(".tier.pro");
              card?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            style={cta}
          >
            Fix that for $0.99/month →
          </button>
        </div>
      ) : (
        <div style={{ fontSize: ".82rem", color: "#9ca3af", fontFamily: "system-ui,sans-serif" }}>
          Pick all three to see your number.
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

const wrap: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e4da",
  borderRadius: 16,
  padding: 24,
  marginTop: 12,
};
const eyebrow: React.CSSProperties = {
  fontSize: ".7rem",
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#16a34a",
  fontFamily: "system-ui, sans-serif",
  marginBottom: 6,
};
const h3: React.CSSProperties = {
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
  background: "#16a34a",
  borderColor: "#16a34a",
  color: "#fff",
  fontWeight: 700,
};
const resultCard: React.CSSProperties = {
  marginTop: 12,
  padding: "22px",
  background: "#0f1f3d",
  borderRadius: 12,
  textAlign: "center",
};
const resultBig: React.CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 700,
  color: "#fff",
  fontFamily: "Georgia, serif",
  letterSpacing: "-.02em",
  marginBottom: 8,
  lineHeight: 1.3,
};
const resultSmall: React.CSSProperties = {
  fontSize: ".95rem",
  color: "rgba(255,255,255,.75)",
  fontFamily: "system-ui, sans-serif",
  marginBottom: 16,
  lineHeight: 1.5,
};
const cta: React.CSSProperties = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "11px 20px",
  fontFamily: "system-ui, sans-serif",
  fontWeight: 700,
  fontSize: ".92rem",
  cursor: "pointer",
};
