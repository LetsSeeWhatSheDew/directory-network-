"use client";
import { useState } from "react";

export type PendingReview = {
  id: string;
  listing_slug: string;
  rating: number;
  body: string | null;
  display_name: string | null;
  created_at: string;
};

export default function ReviewQueue({ initial }: { initial: PendingReview[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
    else alert("Failed: " + (await res.text()));
  }

  if (rows.length === 0) return <p style={{ color: "var(--pp-muted)" }}>Nothing waiting. 🎉</p>;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((r) => (
        <div key={r.id} className="pp-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: ".85rem" }}>
            <a href={`/dispensary/${r.listing_slug}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
              {r.listing_slug}
            </a>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {r.display_name || "anon"} ·{" "}
              {new Date(r.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" })}
            </span>
          </div>
          <p style={{ margin: "10px 0", whiteSpace: "pre-line" }}>{r.body || <em>(no text)</em>}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pp-btn pp-btn-primary pp-btn-sm" disabled={busy === r.id} onClick={() => act(r.id, "approve")}>
              Approve
            </button>
            <button className="pp-btn pp-btn-outline pp-btn-sm" disabled={busy === r.id} onClick={() => act(r.id, "reject")}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
