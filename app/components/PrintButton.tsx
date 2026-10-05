"use client";
// A plain "Print" button for the counter-card pages.
export default function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        background: "var(--pp-btn)",
        color: "var(--pp-btn-fg)",
        border: "1px solid var(--pp-btn-border)",
        borderRadius: 14,
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
