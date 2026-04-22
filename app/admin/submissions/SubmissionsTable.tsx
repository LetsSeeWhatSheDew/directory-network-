"use client";

import React, { useMemo, useState } from "react";

export type Submission = {
  id: string;
  dispensary_slug: string | null;
  dispensary_name: string | null;
  dispensary_city: string | null;
  submitter_email: string | null;
  submitter_role: string | null;
  deal_title: string;
  deal_description: string | null;
  category: string | null;
  brand: string | null;
  weight_grams: number | null;
  mg_thc: number | null;
  count: number | null;
  regular_price_usd: number | null;
  sale_price_usd: number | null;
  price_per_gram_computed: number | null;
  price_per_mg_computed: number | null;
  price_per_unit_computed: number | null;
  source_url: string | null;
  submitted_at: string;
};

type Decision =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "done"; ok: boolean; message?: string };

const REJECT_REASONS: Array<{ code: string; label: string }> = [
  { code: "duplicate", label: "Duplicate of existing deal" },
  { code: "source_url_dead", label: "Source URL dead / unrelated" },
  { code: "price_implausible", label: "Price outside plausible range" },
  { code: "unknown_dispensary", label: "Dispensary not verified licensed IL" },
  { code: "already_expired", label: "End date already in the past" },
  { code: "spam", label: "Spam / bot submission" },
  { code: "other", label: "Other — free-text in notes" },
];

function denominator(s: Submission): string {
  if (s.weight_grams != null) return `${s.weight_grams}g`;
  if (s.mg_thc != null) return `${s.mg_thc}mg THC`;
  if (s.count != null) return `${s.count} units`;
  return "—";
}

function computedPpg(s: Submission): string {
  if (s.price_per_gram_computed != null) return `$${s.price_per_gram_computed.toFixed(2)}/g`;
  if (s.price_per_mg_computed != null) return `$${s.price_per_mg_computed.toFixed(4)}/mg`;
  if (s.price_per_unit_computed != null) return `$${s.price_per_unit_computed.toFixed(2)}/ea`;
  return "—";
}

function relative(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(1, Math.floor((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export function SubmissionsTable({ rows }: { rows: Submission[] }) {
  const [dispFilter, setDispFilter] = useState<string>("");
  const [submitterFilter, setSubmitterFilter] = useState<"all" | "human" | "scraper">("all");
  const [catFilter, setCatFilter] = useState<string>("");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (dispFilter && !(r.dispensary_slug ?? "").includes(dispFilter) && !(r.dispensary_name ?? "").toLowerCase().includes(dispFilter.toLowerCase())) {
        return false;
      }
      if (submitterFilter === "scraper" && !(r.submitter_email ?? "").includes("scraper@")) return false;
      if (submitterFilter === "human" && (r.submitter_email ?? "").includes("scraper@")) return false;
      if (catFilter && (r.category ?? "") !== catFilter) return false;
      return true;
    });
  }, [rows, dispFilter, submitterFilter, catFilter]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.category) s.add(r.category);
    return [...s].sort();
  }, [rows]);

  async function approve(id: string) {
    setDecisions((d) => ({ ...d, [id]: { state: "pending" } }));
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDecisions((d) => ({ ...d, [id]: { state: "done", ok: false, message: body.error ?? `HTTP ${res.status}` } }));
        return;
      }
      setDecisions((d) => ({ ...d, [id]: { state: "done", ok: true, message: `Approved → deal ${body.deal_id ?? ""}` } }));
    } catch (e) {
      setDecisions((d) => ({ ...d, [id]: { state: "done", ok: false, message: (e as Error).message } }));
    }
  }

  async function reject(id: string, reason: string) {
    setDecisions((d) => ({ ...d, [id]: { state: "pending" } }));
    try {
      const res = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDecisions((d) => ({ ...d, [id]: { state: "done", ok: false, message: body.error ?? `HTTP ${res.status}` } }));
        return;
      }
      setDecisions((d) => ({ ...d, [id]: { state: "done", ok: true, message: `Rejected: ${reason}` } }));
    } catch (e) {
      setDecisions((d) => ({ ...d, [id]: { state: "done", ok: false, message: (e as Error).message } }));
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={dispFilter}
          onChange={(e) => setDispFilter(e.target.value)}
          placeholder="Filter by dispensary"
          style={fieldStyle}
        />
        <select value={submitterFilter} onChange={(e) => setSubmitterFilter(e.target.value as "all" | "human" | "scraper")} style={fieldStyle}>
          <option value="all">All submitters</option>
          <option value="human">Human submissions</option>
          <option value="scraper">Scraper submissions</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={fieldStyle}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: "auto", fontSize: "0.875rem", color: "#6b7280", alignSelf: "center" }}>
          {filtered.length} of {rows.length}
        </div>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <Th>Submitted</Th>
              <Th>Dispensary</Th>
              <Th>Deal</Th>
              <Th>Brand</Th>
              <Th>Size</Th>
              <Th>Reg</Th>
              <Th>Sale</Th>
              <Th>PPG</Th>
              <Th>Submitter</Th>
              <Th>Source</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const decision = decisions[r.id] ?? { state: "idle" };
              const done = decision.state === "done";
              return (
                <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb", opacity: done ? 0.55 : 1 }}>
                  <Td>{relative(r.submitted_at)}</Td>
                  <Td>
                    <div style={{ fontWeight: 600 }}>{r.dispensary_name ?? r.dispensary_slug ?? "—"}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{r.dispensary_city ?? ""}</div>
                  </Td>
                  <Td>
                    <div style={{ fontWeight: 500 }}>{r.deal_title}</div>
                    {r.deal_description && (
                      <div style={{ color: "#6b7280", fontSize: "0.75rem", maxWidth: 280 }}>
                        {r.deal_description.slice(0, 120)}
                        {r.deal_description.length > 120 ? "…" : ""}
                      </div>
                    )}
                  </Td>
                  <Td>{r.brand ?? "—"}</Td>
                  <Td>{denominator(r)}</Td>
                  <Td>{r.regular_price_usd != null ? `$${r.regular_price_usd.toFixed(2)}` : "—"}</Td>
                  <Td>{r.sale_price_usd != null ? `$${r.sale_price_usd.toFixed(2)}` : "—"}</Td>
                  <Td>{computedPpg(r)}</Td>
                  <Td>
                    <div>{r.submitter_email ?? "—"}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{r.submitter_role ?? ""}</div>
                  </Td>
                  <Td>
                    {r.source_url ? (
                      <a href={r.source_url} target="_blank" rel="noreferrer noopener" style={{ color: "#16a34a" }}>
                        link ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    {done ? (
                      <span style={{ color: decision.ok ? "#15803d" : "#b91c1c", fontSize: "0.75rem" }}>
                        {decision.message}
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          onClick={() => approve(r.id)}
                          disabled={decision.state === "pending"}
                          style={approveBtn}
                        >
                          Approve
                        </button>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) reject(r.id, e.target.value);
                          }}
                          disabled={decision.state === "pending"}
                          style={rejectSelect}
                        >
                          <option value="" disabled>
                            Reject…
                          </option>
                          {REJECT_REASONS.map((reason) => (
                            <option key={reason.code} value={reason.code}>
                              {reason.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: "0.75rem", color: "#374151", textTransform: "uppercase", letterSpacing: ".04em" }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 12px", verticalAlign: "top" }}>{children}</td>;
}

const fieldStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: "0.875rem",
  minWidth: 180,
};

const approveBtn: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: "0.75rem",
  cursor: "pointer",
  fontWeight: 600,
};

const rejectSelect: React.CSSProperties = {
  border: "1px solid #dc2626",
  color: "#dc2626",
  background: "white",
  padding: "6px 8px",
  borderRadius: 6,
  fontSize: "0.75rem",
  cursor: "pointer",
};
