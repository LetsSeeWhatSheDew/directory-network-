"use client";

// Share a deal — native share sheet on mobile (iMessage, WhatsApp,
// etc.), clipboard copy with "Link copied!" toast on desktop. Stops
// event propagation so a nested placement inside a card-wide Link
// still works without triggering the outer navigation.

import { useState } from "react";

type Variant = "icon" | "inline" | "block";

export default function ShareDealButton({
  dealId,
  dispensaryName,
  dealTitle,
  savings,
  variant = "icon",
  label,
}: {
  dealId: string;
  dispensaryName: string;
  dealTitle: string;
  savings?: number | null;
  variant?: Variant;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const text = (() => {
    const savingsPart =
      typeof savings === "number" && savings > 0 ? `Save $${savings} at ` : "";
    return `${savingsPart}${dispensaryName} — ${dealTitle}`;
  })();
  const url = `https://puffprice.com/deal/${dealId}`;

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
      if (nav && typeof nav.share === "function") {
        await nav.share({ title: "PuffPrice Deal", text, url });
        try {
          const w = window as any;
          if (typeof w.gtag === "function")
            w.gtag("event", "deal_share", { method: "native", dispensary: dispensaryName });
        } catch {}
        return;
      }
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
        await nav.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        try {
          const w = window as any;
          if (typeof w.gtag === "function")
            w.gtag("event", "deal_share", { method: "clipboard", dispensary: dispensaryName });
        } catch {}
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // AbortError (user dismissed share sheet) is expected — no-op.
    }
  }

  // Inline (tiny next-to-title)
  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Share this deal"
        title="Share this deal"
        style={{
          background: "transparent",
          border: "none",
          color: copied ? "#16a34a" : "#6b7280",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: ".76rem",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          minHeight: 28,
        }}
      >
        <ShareIcon size={14} />
        {copied ? "Copied!" : label || "Share"}
      </button>
    );
  }

  // Block — full-width prominent button on /l/[slug]
  if (variant === "block") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Share this deal"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          minHeight: 44,
          padding: "12px 16px",
          background: copied ? "#dcfce7" : "#fff",
          color: copied ? "#14532d" : "#0f1f3d",
          border: `1px solid ${copied ? "#bbf7d0" : "#e8e4da"}`,
          borderRadius: 10,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          fontSize: ".88rem",
          cursor: "pointer",
          transition: "border-color .15s, background .15s",
        }}
      >
        <ShareIcon size={16} />
        {copied ? "Link copied!" : label || "Share this deal"}
      </button>
    );
  }

  // Default: icon-only circular button
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share this deal"
      title={copied ? "Link copied!" : "Share this deal"}
      style={{
        background: copied ? "#dcfce7" : "rgba(255,255,255,.9)",
        border: `1px solid ${copied ? "#bbf7d0" : "#e8e4da"}`,
        color: copied ? "#14532d" : "#6b7280",
        borderRadius: "50%",
        cursor: "pointer",
        width: 36,
        height: 36,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background .15s, border-color .15s, color .15s",
      }}
    >
      <ShareIcon size={15} />
    </button>
  );
}

function ShareIcon({ size = 16 }: { size?: number }) {
  // Minimal share-arrow glyph — matches lucide Share2 spec without the dep.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
