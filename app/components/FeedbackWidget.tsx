"use client";
// app/components/FeedbackWidget.tsx
// One-tap feedback on a deal ("Right price? Yes / No") or a page ("See
// something wrong?"). Posts to /api/feedback → public.deal_reports.
// Falls back to the mailto link if the POST fails, so a report is never lost.

import { useState } from "react";

type Props = {
  mode: "deal" | "page";
  dealId?: string;
  listingSlug?: string;
  pageUrl: string;
  mailtoHref: string;
  label?: string;
};

const DEAL_REASONS: { code: string; label: string }[] = [
  { code: "price_changed", label: "Price is different" },
  { code: "expired", label: "Deal is over" },
  { code: "wrong_store", label: "Wrong store" },
  { code: "other", label: "Something else" },
];
const PAGE_REASONS: { code: string; label: string }[] = [
  { code: "wrong_info", label: "Hours or details wrong" },
  { code: "expired", label: "A deal is over" },
  { code: "other", label: "Something else" },
];

type State = "idle" | "choosing" | "sending" | "thanks" | "error";

export default function FeedbackWidget({
  mode,
  dealId,
  listingSlug,
  pageUrl,
  mailtoHref,
  label,
}: Props) {
  const [state, setState] = useState<State>(mode === "page" ? "idle" : "idle");
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [hp, setHp] = useState("");

  async function send(code: string, text?: string) {
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: code,
          dealId,
          listingSlug,
          detail: text || undefined,
          pageUrl,
          website: hp,
        }),
      });
      setState(res.ok ? "thanks" : "error");
    } catch {
      setState("error");
    }
  }

  const reasons = mode === "deal" ? DEAL_REASONS : PAGE_REASONS;

  if (state === "thanks") {
    return (
      <p className="fbw fbw-done" role="status">
        Thanks — that helps keep every price honest.
      </p>
    );
  }
  if (state === "error") {
    return (
      <p className="fbw fbw-done" role="status">
        Couldn&apos;t send that. <a href={mailtoHref}>Email us instead</a>.
      </p>
    );
  }

  return (
    <div className="fbw">
      <style>{`
        .fbw{font-size:.8rem;color:var(--pp-muted)}
        .fbw-row{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem .5rem}
        .fbw-q{margin-right:.15rem}
        .fbw button{font:inherit;font-size:.78rem;font-weight:600;min-height:32px;padding:.25rem .7rem;border-radius:999px;border:1px solid var(--pp-border);background:var(--pp-surface);color:var(--pp-body);cursor:pointer}
        .fbw button:hover{border-color:var(--pp-signal);color:var(--pp-signal-ink)}
        .fbw button[aria-pressed="true"]{border-color:var(--pp-signal);background:var(--pp-best-tint);color:var(--pp-signal-ink)}
        .fbw button:disabled{opacity:.5;cursor:default}
        .fbw-more{margin-top:.55rem;display:grid;gap:.5rem;max-width:420px}
        .fbw textarea{font:inherit;font-size:.85rem;width:100%;min-height:64px;padding:.5rem .6rem;border:1px solid var(--pp-border);border-radius:8px;background:var(--pp-surface);color:var(--pp-ink);resize:vertical}
        .fbw .fbw-send{justify-self:start;background:var(--pp-signal-fill);border-color:var(--pp-signal-fill);color:var(--pp-on-dark)}
        .fbw .fbw-send:hover{color:var(--pp-on-dark);background:var(--pp-signal-ink)}
        .fbw-done{margin:0}
        .fbw-done a{color:var(--pp-signal-ink);font-weight:600}
        .fbw-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
      `}</style>
      <label className="fbw-hp" aria-hidden="true">
        Leave blank
        <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </label>

      {mode === "deal" && state === "idle" && (
        <div className="fbw-row">
          <span className="fbw-q">{label || "Was this deal right?"}</span>
          <button type="button" onClick={() => send("confirmed")}>Yes</button>
          <button type="button" onClick={() => setState("choosing")}>No</button>
        </div>
      )}

      {mode === "page" && state === "idle" && (
        <div className="fbw-row">
          <button type="button" onClick={() => setState("choosing")}>
            {label || "See something wrong? Tell us"}
          </button>
        </div>
      )}

      {(state === "choosing" || state === "sending") && (
        <>
          <div className="fbw-row" role="group" aria-label="What's wrong?">
            <span className="fbw-q">What&apos;s off?</span>
            {reasons.map((r) => (
              <button
                key={r.code}
                type="button"
                aria-pressed={reason === r.code}
                onClick={() => setReason(r.code)}
                disabled={state === "sending"}
              >
                {r.label}
              </button>
            ))}
          </div>
          {reason && (
            <div className="fbw-more">
              <textarea
                placeholder="Optional — what did you see? (e.g. $35 at the register)"
                maxLength={1000}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
              <button
                type="button"
                className="fbw-send"
                disabled={state === "sending"}
                onClick={() => send(reason, detail)}
              >
                {state === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
