"use client";
// Small, calm "email me new deals" control. Store pages: "Watch this store".
// City pages: "Get these deals by email", with optional category and
// minimum discount. Posts to /api/alerts/watch, which sends a confirm email;
// nothing is sent until that link is tapped.
import { useState } from "react";

const CATS: Array<[string, string]> = [
  ["flower", "Flower"],
  ["vapes", "Vapes"],
  ["edibles", "Edibles"],
  ["concentrate", "Concentrates"],
];

type Props =
  | { kind: "store"; slug: string; storeName: string }
  | { kind: "city"; city: string };

export default function WatchControl(props: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [minPct, setMinPct] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "pending" | "active" | "err">("idle");
  const [err, setErr] = useState("");

  const label = props.kind === "store" ? "Watch this store" : "Get these deals by email";
  const where = props.kind === "store" ? `at ${props.storeName}` : `in ${props.city}`;

  if (state === "pending" || state === "active") {
    return (
      <p className="wc-done" role="status">
        {state === "pending"
          ? <>Almost done. Check <b>{email}</b> and tap the confirm link. Nothing arrives until you do.</>
          : <>You&apos;re already set. We&apos;ll email you when there&apos;s a new deal {where}.</>}
        <style>{CSS}</style>
      </p>
    );
  }

  return (
    <div className="wc">
      <style>{CSS}</style>
      {!open ? (
        <button type="button" className="wc-open" onClick={() => setOpen(true)} aria-expanded="false">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          {label}
        </button>
      ) : (
        <form
          className="wc-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("busy");
            setErr("");
            try {
              const body =
                props.kind === "store"
                  ? { kind: "store", slug: props.slug, email, website: hp }
                  : { kind: "city", city: props.city, email, categories: cats, min_discount: minPct ? Number(minPct) : null, website: hp };
              const r = await fetch("/api/alerts/watch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
              const j = (await r.json().catch(() => ({}))) as { ok?: boolean; status?: string; error?: string };
              if (r.ok && j.ok) setState(j.status === "active" ? "active" : "pending");
              else {
                setErr(j.error || "That didn't save. Try again in a minute.");
                setState("err");
              }
            } catch {
              setErr("That didn't save. Try again in a minute.");
              setState("err");
            }
          }}
        >
          <p className="wc-lede">
            One short email on mornings when there&apos;s a new deal {where}. Quiet days, no email. Free.
          </p>
          {props.kind === "city" && (
            <>
              <fieldset className="wc-cats">
                <legend>Only these (optional)</legend>
                {CATS.map(([v, l]) => (
                  <label key={v} className={cats.includes(v) ? "on" : ""}>
                    <input
                      type="checkbox"
                      checked={cats.includes(v)}
                      onChange={(e) => setCats((c) => (e.target.checked ? [...c, v] : c.filter((x) => x !== v)))}
                    />
                    {l}
                  </label>
                ))}
              </fieldset>
              <label className="wc-min">
                At least
                <select value={minPct} onChange={(e) => setMinPct(e.target.value)} aria-label="Minimum discount">
                  <option value="">any discount</option>
                  <option value="15">15% off</option>
                  <option value="20">20% off</option>
                  <option value="25">25% off</option>
                  <option value="30">30% off</option>
                  <option value="40">40% off</option>
                </select>
              </label>
            </>
          )}
          <div className="wc-row">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
            <button type="submit" disabled={state === "busy"}>
              {state === "busy" ? "Saving…" : "Email me"}
            </button>
          </div>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            aria-hidden="true"
            name="website"
            style={{ position: "absolute", left: -9999, width: 1, height: 1 }}
          />
          {state === "err" && <p className="wc-err" role="alert">{err}</p>}
          <p className="wc-fine">We&apos;ll send a confirm link first. Unsubscribe in one tap. 21+.</p>
        </form>
      )}
    </div>
  );
}

const CSS = `
.wc{margin:14px 0 4px;position:relative}
.wc-open{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;border:1px solid var(--pp-border);background:var(--pp-surface);color:var(--pp-ink);font:inherit;font-size:.85rem;font-weight:600;cursor:pointer}
.wc-open:hover{background:var(--pp-paper)}
.wc-open:focus-visible,.wc-form button:focus-visible{outline:2px solid var(--pp-signal);outline-offset:2px}
.wc-form{padding:14px 16px;border-radius:18px;background:var(--pp-haze);border:1px solid var(--pp-haze-border);max-width:520px}
.wc-lede{margin:0 0 10px;font-size:.88rem;line-height:1.5;color:var(--pp-body)}
.wc-cats{border:0;margin:0 0 8px;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.wc-cats legend{font-size:.75rem;color:var(--pp-muted);margin-bottom:6px;padding:0}
.wc-cats label{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:1px solid var(--pp-border);background:var(--pp-surface);font-size:.8rem;cursor:pointer}
.wc-cats label.on{border-color:var(--pp-mark);color:var(--pp-ink)}
.wc-cats input{accent-color:var(--pp-mark);margin:0}
.wc-min{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--pp-muted);margin:0 0 10px}
.wc-min select,.wc-row input{padding:9px 11px;border-radius:10px;border:1px solid var(--pp-border);background:var(--pp-surface);color:var(--pp-ink);font:inherit;font-size:15px;min-width:0}
.wc-row{display:flex;gap:8px;flex-wrap:wrap}
.wc-row input{flex:2 1 200px}
.wc-row button{flex:1 1 auto;padding:9px 16px;border-radius:10px;border:none;font:inherit;font-weight:700;font-size:15px;cursor:pointer;background:var(--pp-btn);color:var(--pp-btn-fg);box-shadow:inset 0 0 0 1px var(--pp-btn-border)}
.wc-row button:disabled{opacity:.6;cursor:default}
.wc-err{margin:8px 0 0;font-size:.82rem;color:var(--pp-stop-fg)}
.wc-fine{margin:8px 0 0;font-size:.75rem;color:var(--pp-muted)}
.wc-done{margin:14px 0 4px;padding:12px 14px;border-radius:14px;background:var(--pp-haze);border:1px solid var(--pp-haze-border);font-size:.88rem;line-height:1.5;color:var(--pp-body);max-width:520px}
`;
