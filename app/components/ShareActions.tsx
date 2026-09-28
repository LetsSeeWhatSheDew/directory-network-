"use client";
// Copy link + download buttons for a shareable page (/deal-of-the-day).
// Copy falls back to selecting the URL when the clipboard API is blocked.
// Taps are counted as share_tap (lib/track) with where they came from.
import { useState } from "react";

export default function ShareActions({
  url,
  downloads,
  from,
}: {
  url: string;
  downloads: { href: string; label: string; sub: string }[];
  from: string;
}) {
  const [copied, setCopied] = useState<"idle" | "ok" | "manual">("idle");
  return (
    <div className="sa">
      <style>{CSS}</style>
      <div className="sa-row">
        <button
          type="button"
          className="sa-btn sa-primary"
          data-track="share_tap"
          data-track-from={`${from}_copy`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied("ok");
            } catch {
              setCopied("manual");
            }
          }}
        >
          {copied === "ok" ? "Link copied" : "Copy link"}
        </button>
        {downloads.map((d) => (
          <a key={d.href} className="sa-btn" href={d.href} download data-track="share_tap" data-track-from={`${from}_download`}>
            {d.label}
            <span>{d.sub}</span>
          </a>
        ))}
      </div>
      {copied === "manual" && (
        <input className="sa-url" readOnly value={url} aria-label="Link to share" onFocus={(e) => e.currentTarget.select()} autoFocus />
      )}
      <p className="sa-live" role="status" aria-live="polite">{copied === "ok" ? "Copied. Paste it anywhere." : ""}</p>
    </div>
  );
}

const CSS = `
.sa{margin:18px 0 6px}
.sa-row{display:flex;flex-wrap:wrap;gap:8px}
.sa-btn{display:inline-flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;min-height:44px;padding:9px 16px;border-radius:14px;border:1px solid var(--pp-border);background:var(--pp-surface);color:var(--pp-ink);font:inherit;font-size:.9rem;font-weight:600;text-decoration:none;cursor:pointer}
.sa-btn span{font-family:var(--font-mono);font-size:.68rem;font-weight:500;color:var(--pp-muted)}
.sa-btn:hover{background:var(--pp-paper)}
.sa-primary{background:var(--pp-btn);color:var(--pp-btn-fg);border-color:var(--pp-btn-border)}
.sa-primary:hover{background:var(--pp-btn)}
.sa-btn:focus-visible{outline:2px solid var(--pp-signal);outline-offset:2px}
.sa-url{margin-top:8px;width:100%;max-width:520px;padding:10px 12px;border-radius:10px;border:1px solid var(--pp-border);background:var(--pp-surface);color:var(--pp-ink);font:inherit;font-size:15px}
.sa-live{min-height:1em;margin:6px 0 0;font-size:.8rem;color:var(--pp-muted)}
`;
