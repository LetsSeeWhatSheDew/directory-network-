"use client";

// Scaffolding — NOT wired yet.
// TODO: unblock when migration add-is-medical-friendly.sql is applied
// and master_listings.is_medical_friendly is backfilled. At that point:
//   1. Remove the `disabled` prop default below.
//   2. Lift state into the parent filter bar and push ?medical=1 to URL.
//   3. Wire the query in the deals fetch to `is_medical_friendly=eq.true`
//      when the toggle is on.

type MedicalFriendlyToggleProps = {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
};

export default function MedicalFriendlyToggle({
  checked = false,
  onChange,
  disabled = true, // TODO: flip to false once DB column exists and is backfilled
}: MedicalFriendlyToggleProps) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 100,
        border: "1px solid var(--pp-border)",
        background: disabled ? "var(--pp-paper)" : "var(--pp-surface)",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: ".82rem",
        color: "var(--pp-body)",
        fontFamily: "var(--font-body)",
      }}
      title={disabled ? "Coming soon — we're verifying which IL dispensaries honor the medical tax rate." : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ accentColor: "var(--pp-signal)" }}
      />
      Medical tax rate
      {disabled && (
        <span style={{ fontSize: ".7rem", color: "var(--pp-muted)" }}>(coming soon)</span>
      )}
    </label>
  );
}
