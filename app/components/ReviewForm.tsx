"use client";
// app/components/ReviewForm.tsx
// Leave-a-review form for a dispensary. Posts to /api/reviews; every review
// lands as PENDING and only shows after Matthew approves it.

import { useState } from "react";

export default function ReviewForm({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setMsg("Pick a star rating first.");
      return;
    }
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingSlug: slug, rating, body, displayName, website: hp }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setState("done");
      else {
        setState("error");
        setMsg(j?.error || "Couldn't save that. Try again in a minute.");
      }
    } catch {
      setState("error");
      setMsg("Couldn't save that. Try again in a minute.");
    }
  }

  if (state === "done") {
    return (
      <p className="rvf-done" role="status">
        Thanks — your review is in. We read every one before it goes live, usually within a day.
      </p>
    );
  }

  return (
    <div className="rvf">
      <style>{`
        .rvf-open{font:inherit;font-weight:700;font-size:.9rem;min-height:44px;padding:.6rem 1.1rem;border-radius:8px;border:1px solid var(--pp-signal);background:var(--pp-surface);color:var(--pp-signal-ink);cursor:pointer}
        .rvf-open:hover{background:var(--pp-best-tint)}
        .rvf form{display:grid;gap:.75rem;max-width:520px;margin-top:.25rem}
        .rvf-stars{display:flex;gap:.15rem}
        .rvf-star{font-size:1.9rem;line-height:1;min-width:44px;min-height:44px;background:none;border:none;cursor:pointer;color:var(--pp-border);padding:0}
        .rvf-star.on{color:var(--pp-signal)}
        .rvf label{display:grid;gap:.3rem;font-size:.8rem;color:var(--pp-muted)}
        .rvf textarea,.rvf input{font:inherit;font-size:.95rem;padding:.6rem .7rem;border:1px solid var(--pp-border);border-radius:8px;background:var(--pp-surface);color:var(--pp-ink)}
        .rvf textarea{min-height:110px;resize:vertical}
        .rvf-submit{justify-self:start;font:inherit;font-weight:700;min-height:44px;padding:.6rem 1.2rem;border-radius:8px;border:none;background:var(--pp-signal);color:#fff;cursor:pointer}
        .rvf-submit:disabled{opacity:.6}
        .rvf-msg{font-size:.82rem;color:var(--pp-high);margin:0}
        .rvf-fine{font-size:.74rem;color:var(--pp-muted);margin:0}
        .rvf-done{font-size:.9rem;color:var(--pp-signal-ink);background:var(--pp-best-tint);border:1px solid var(--pp-best-border);border-radius:10px;padding:.8rem 1rem}
        .rvf-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
      `}</style>
      {!open ? (
        <button type="button" className="rvf-open" onClick={() => setOpen(true)}>
          Review {name}
        </button>
      ) : (
        <form onSubmit={submit}>
          <div className="rvf-stars" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className={`rvf-star${(hover || rating) >= n ? " on" : ""}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
          <label>
            What was it like? Prices, staff, wait, selection — the stuff you&apos;d tell a friend.
            <textarea value={body} maxLength={1500} onChange={(e) => setBody(e.target.value)} />
          </label>
          <label>
            Name to show (optional)
            <input value={displayName} maxLength={40} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Sam from Pekin" />
          </label>
          <label className="rvf-hp" aria-hidden="true">
            Leave blank
            <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
          </label>
          {msg && <p className="rvf-msg" role="alert">{msg}</p>}
          <button type="submit" className="rvf-submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Post review"}
          </button>
          <p className="rvf-fine">
            Reviews are read before they go live. No links, no promo codes, no reviews from store staff.
          </p>
        </form>
      )}
    </div>
  );
}
