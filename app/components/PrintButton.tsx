"use client";
// A plain "Print" button for the counter-card pages.
export default function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        background: "var(--pp-signal-fill)",
        color: "var(--pp-on-dark)",
        border: 0,
        borderRadius: 10,
        padding: "10px 16px",
        fontWeight: 700,
        fontSize: ".95rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
