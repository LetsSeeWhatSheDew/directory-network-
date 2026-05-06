"use client";

// Reusable seven-button day-of-week picker.
//
// Selection model: an array of 3-letter tokens ('mon','tue', …, 'sun').
// Empty array == "always active" — caller decides whether to persist
// that as NULL or [] on the deal row. Matches the canonical day keys
// used by `lib/dealActiveFilter.ts` and the migration's CHECK constraint.

import { DAY_KEYS, type DayKey } from "../../../../lib/dealActiveFilter";

const LABELS: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

type Props = {
  value: DayKey[];
  onChange: (next: DayKey[]) => void;
  disabled?: boolean;
};

export function DayOfWeekPicker({ value, onChange, disabled }: Props) {
  const set = new Set(value);
  const toggle = (k: DayKey) => {
    const next = new Set(set);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    // Preserve canonical week order on the way out.
    onChange(DAY_KEYS.filter((d) => next.has(d)));
  };
  return (
    <div role="group" aria-label="Active days of the week">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {DAY_KEYS.map((k) => {
          const active = set.has(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(k)}
              disabled={disabled}
              style={{
                minWidth: 56,
                padding: "8px 12px",
                borderRadius: 999,
                border: active ? "1px solid #6BA63B" : "1px solid #d1d5db",
                background: active ? "#7DBA47" : "#fff",
                color: active ? "#fff" : "#374151",
                fontFamily: "system-ui, sans-serif",
                fontSize: ".84rem",
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                transition: "background .15s, border-color .15s",
              }}
            >
              {LABELS[k]}
            </button>
          );
        })}
      </div>
      <p
        style={{
          marginTop: 6,
          fontFamily: "system-ui, sans-serif",
          fontSize: ".78rem",
          color: "#6b7280",
        }}
      >
        {value.length === 0
          ? "Leave all empty for an always-active deal."
          : value.length === 7
          ? "Active every day."
          : `Active ${value.length} day${value.length === 1 ? "" : "s"} per week.`}
      </p>
    </div>
  );
}
