"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Frequency = "weekly" | "biweekly" | "monthly";
type Spend = "low" | "mid" | "high" | "vip";
type DealHabit = "always" | "sometimes" | "never";

const VISITS_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  biweekly: 24,
  monthly: 12,
};

const AVG_SPEND: Record<Spend, number> = {
  low: 30,
  mid: 60,
  high: 115,
  vip: 180,
};

// How much of the 15% avg discount a shopper is NOT capturing:
const MISSED_MULT: Record<DealHabit, number> = {
  always: 0.05, // already captures most
  sometimes: 0.5,
  never: 1.0,
};

// What a CleanList user with the same profile saves of that same 15%:
const CAPTURED_MULT: Record<DealHabit, number> = {
  always: 0.9,
  sometimes: 0.85,
  never: 0.8,
};

const AVG_DISCOUNT_RATE = 0.15;

export default function SavingsCalculator() {
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [spend, setSpend] = useState<Spend | null>(null);
  const [dealHabit, setDealHabit] = useState<DealHabit | null>(null);

  const complete = frequency && spend && dealHabit;

  const result = useMemo(() => {
    if (!complete) return null;
    const visits = VISITS_PER_YEAR[frequency];
    const spendPer = AVG_SPEND[spend];
    const yearly = visits * spendPer;
    const savingsPool = yearly * AVG_DISCOUNT_RATE;
    const overpaying = Math.round(savingsPool * MISSED_MULT[dealHabit]);
    const cleanlistSaves = Math.round(savingsPool * CAPTURED_MULT[dealHabit]);
    const eighths = Math.floor(cleanlistSaves / 40);
    return { overpaying, cleanlistSaves, eighths, yearly: Math.round(yearly) };
  }, [frequency, spend, dealHabit, complete]);

  return (
    <div style={wrap}>
      <Question
        num={1}
        label="How often do you visit a dispensary?"
        options={[
          { v: "weekly", l: "Weekly" },
          { v: "biweekly", l: "Twice a month" },
          { v: "monthly", l: "Monthly" },
        ]}
        value={frequency}
        onChange={(v) => setFrequency(v as Frequency)}
      />

      <Question
        num={2}
        label="What's your typical spend per visit?"
        options={[
          { v: "low", l: "$20–$40" },
          { v: "mid", l: "$40–$80" },
          { v: "high", l: "$80–$150" },
          { v: "vip", l: "$150+" },
        ]}
        value={spend}
        onChange={(v) => setSpend(v as Spend)}
      />

      <Question
        num={3}
        label="Do you currently look for deals before you go?"
        options={[
          { v: "always", l: "Always" },
          { v: "sometimes", l: "Sometimes" },
          { v: "never", l: "Never" },
        ]}
        value={dealHabit}
        onChange={(v) => setDealHabit(v as DealHabit)}
      />

      {result && (
        <section style={resultCard} aria-live="polite">
          <div style={resultEyebrow}>Your result</div>
          <div style={resultBig}>
            You&apos;re probably overpaying by{" "}
            <span style={{ color: "#dc2626" }}>${result.overpaying}</span> per year.
          </div>
          <p style={resultBody}>
            CleanList users who match your profile save an average of{" "}
            <strong style={{ color: "#16a34a" }}>${result.cleanlistSaves} / year</strong>.
          </p>
          {result.eighths > 0 && (
            <p style={resultSub}>That&apos;s <strong>{result.eighths} free eighth{result.eighths === 1 ? "" : "s"} of flower.</strong></p>
          )}
          <Link href="/alerts" style={cta}>
            Start saving → Get free deal alerts
          </Link>
          <p style={resultFineprint}>
            Based on an average {Math.round(AVG_DISCOUNT_RATE * 100)}% discount across Illinois
            dispensaries and {VISITS_PER_YEAR[frequency!]} visits per year
            (~${result.yearly}/yr total spend).
          </p>
        </section>
      )}

      {!result && (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: ".85rem", color: "#9ca3af", textAlign: "center", marginTop: 6 }}>
          Answer all three to see your result.
        </p>
      )}
    </div>
  );
}

function Question<T extends string>({
  num,
  label,
  options,
  value,
  onChange,
}: {
  num: number;
  label: string;
  options: { v: T; l: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div style={questionBlock}>
      <div style={questionHeader}>
        <span style={questionNum}>{String(num).padStart(2, "0")}</span>
        <span style={questionLabel}>{label}</span>
      </div>
      <div style={optionRow}>
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              style={{ ...pillStyle, ...(active ? pillActive : {}) }}
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
  padding: 28,
};
const questionBlock: React.CSSProperties = { marginBottom: 22 };
const questionHeader: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 };
const questionNum: React.CSSProperties = {
  fontSize: ".75rem",
  fontWeight: 700,
  color: "#16a34a",
  fontFamily: "system-ui, sans-serif",
  letterSpacing: ".08em",
};
const questionLabel: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#0f1f3d",
  fontFamily: "Georgia, serif",
  lineHeight: 1.3,
};
const optionRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
const pillStyle: React.CSSProperties = {
  padding: "9px 16px",
  border: "1px solid #d1cfc6",
  borderRadius: 100,
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
  fontSize: ".88rem",
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
  padding: "24px",
  background: "#0f1f3d",
  color: "#fff",
  borderRadius: 14,
  textAlign: "center",
};
const resultEyebrow: React.CSSProperties = {
  fontSize: ".7rem",
  fontWeight: 700,
  letterSpacing: ".14em",
  color: "#4ade80",
  fontFamily: "system-ui, sans-serif",
  textTransform: "uppercase",
  marginBottom: 14,
};
const resultBig: React.CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 700,
  color: "#fff",
  fontFamily: "Georgia, serif",
  lineHeight: 1.3,
  marginBottom: 14,
};
const resultBody: React.CSSProperties = {
  fontSize: "1rem",
  color: "rgba(255,255,255,.85)",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.55,
  marginBottom: 6,
};
const resultSub: React.CSSProperties = {
  fontSize: ".95rem",
  color: "rgba(255,255,255,.72)",
  fontFamily: "system-ui, sans-serif",
  marginBottom: 18,
};
const cta: React.CSSProperties = {
  display: "inline-block",
  background: "#16a34a",
  color: "#fff",
  padding: "12px 22px",
  borderRadius: 10,
  textDecoration: "none",
  fontFamily: "system-ui, sans-serif",
  fontWeight: 700,
  fontSize: ".92rem",
  marginBottom: 14,
};
const resultFineprint: React.CSSProperties = {
  fontSize: ".7rem",
  color: "rgba(255,255,255,.45)",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.5,
  marginTop: 2,
};
