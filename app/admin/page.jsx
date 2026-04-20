'use client';

import { useState, useEffect } from "react";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sbFetch(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

async function updateLead(id, patch) {
  const res = await fetch(`${SB_URL}/rest/v1/leads?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Update failed");
}

const STATUS_COLORS = {
  new:       { bg: "#dbeafe", text: "#1e40af" },
  contacted: { bg: "#fef9c3", text: "#854d0e" },
  listed:    { bg: "#dcfce7", text: "#14532d" },
  boosted:   { bg: "#ede9fe", text: "#4c1d95" },
  lost:      { bg: "#fee2e2", text: "#991b1b" },
};

const STATUSES = ["new", "contacted", "listed", "boosted", "lost"];

function Badge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.new;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "3px 10px", borderRadius: "100px",
      fontSize: "0.72rem", fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      fontFamily: "system-ui, sans-serif",
    }}>{status}</span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: "12px", padding: "24px 28px",
      borderTop: `3px solid ${accent || "#16a34a"}`,
    }}>
      <p style={{ margin: "0 0 6px", fontSize: "0.75rem", fontFamily: "system-ui", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>{label}</p>
      <p style={{ margin: "0 0 4px", fontSize: "2.2rem", fontWeight: 700, color: "#0f1f3d", letterSpacing: "-0.03em", fontFamily: "Georgia, serif" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", fontFamily: "system-ui" }}>{sub}</p>}
    </div>
  );
}

function Collapsible({ title, count, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 700, color: "#0f1f3d",
        }}
      >
        <span>{title} {count !== undefined && <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontFamily: "system-ui", fontWeight: 400 }}>({count})</span>}</span>
        <span style={{ fontSize: "0.75rem", color: "#94a3b8", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>
      {open && <div style={{ borderTop: "1px solid #f1f5f9" }}>{children}</div>}
    </div>
  );
}

function LeadRow({ lead, onStatusChange }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(lead.status || "new");
  const [saving, setSaving] = useState(false);

  const save = async (newStatus) => {
    setSaving(true);
    try {
      await updateLead(lead.id, { status: newStatus });
      setStatus(newStatus);
    } catch { /* silent */ }
    setSaving(false);
    setEditing(false);
    onStatusChange?.();
  };

  const date = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 120px 100px 80px",
      gap: "12px", alignItems: "center",
      padding: "14px 24px", borderBottom: "1px solid #f8fafc",
      fontSize: "0.875rem", fontFamily: "system-ui, sans-serif",
    }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>{lead.business_name || "—"}</p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>{lead.city || ""} · {lead.niche || ""}</p>
      </div>
      <div>
        <p style={{ margin: 0, color: "#334155" }}>{lead.name || "—"}</p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>{lead.email || ""}</p>
      </div>
      <div>{lead.phone || "—"}</div>
      <div>
        {editing ? (
          <select
            autoFocus
            value={status}
            onChange={e => save(e.target.value)}
            onBlur={() => setEditing(false)}
            disabled={saving}
            style={{ fontSize: "0.8rem", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", fontFamily: "system-ui" }}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Badge status={status} />
          </button>
        )}
      </div>
      <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{date}</div>
    </div>
  );
}

export default function AdminPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await sbFetch("leads?select=*&order=created_at.desc");
      setLeads(data);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const total = leads.length;
  const newToday = leads.filter(l => {
    if (!l.created_at) return false;
    const d = new Date(l.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const listed = leads.filter(l => l.status === "listed" || l.status === "boosted").length;
  const byNiche = leads.reduce((acc, l) => {
    const n = l.niche || "unknown";
    acc[n] = (acc[n] || 0) + 1;
    return acc;
  }, {});
  const topNiche = Object.entries(byNiche).sort((a, b) => b[1] - a[1])[0];

  const newLeads = leads.filter(l => !l.status || l.status === "new");
  const activeLeads = leads.filter(l => l.status === "contacted");
  const liveLeads = leads.filter(l => l.status === "listed" || l.status === "boosted");
  const todayFocus = newLeads.slice(0, 5);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#0f1f3d", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
          puff<span style={{ color: "#16a34a" }}>price</span>
          <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "#64748b", marginLeft: "12px", fontFamily: "system-ui", letterSpacing: "0.1em", textTransform: "uppercase" }}>Admin</span>
        </span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {lastRefresh && (
            <span style={{ fontSize: "0.75rem", color: "#475569" }}>
              Updated {lastRefresh.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <button onClick={load} disabled={loading} style={{ background: "#16a34a", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px" }}>
        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px", color: "#991b1b", fontSize: "0.9rem" }}>
            ⚠ Could not load leads: {error}. Check your Supabase env vars and RLS policy.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "40px" }}>
          <StatCard label="Total Leads" value={total} sub="All time" accent="#16a34a" />
          <StatCard label="New Today" value={newToday} sub="Submitted today" accent="#3b82f6" />
          <StatCard label="Live Listings" value={listed} sub="Listed or Boosted" accent="#8b5cf6" />
          <StatCard label="Top Niche" value={topNiche ? topNiche[1] : "—"} sub={topNiche ? topNiche[0] : "No data yet"} accent="#f59e0b" />
        </div>

        {todayFocus.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px 28px", marginBottom: "24px", borderLeft: "4px solid #16a34a" }}>
            <p style={{ margin: "0 0 16px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#16a34a" }}>
              Today's Focus — {todayFocus.length} new lead{todayFocus.length !== 1 ? "s" : ""} to contact
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {todayFocus.map(l => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{l.business_name || "Unknown"}</span>
                    <span style={{ color: "#94a3b8", margin: "0 8px" }}>·</span>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{l.city}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {l.phone && <a href={`tel:${l.phone}`} style={{ fontSize: "0.85rem", color: "#3b82f6", textDecoration: "none" }}>{l.phone}</a>}
                    {l.email && <a href={`mailto:${l.email}`} style={{ fontSize: "0.85rem", color: "#3b82f6", textDecoration: "none" }}>{l.email}</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px 80px", gap: "12px", padding: "10px 24px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
          <span>Business</span><span>Contact</span><span>Phone</span><span>Status</span><span>Date</span>
        </div>

        <Collapsible title="New Leads" count={newLeads.length}>
          {newLeads.length === 0
            ? <p style={{ padding: "20px 24px", color: "#94a3b8", fontSize: "0.875rem" }}>No new leads yet.</p>
            : newLeads.map(l => <LeadRow key={l.id} lead={l} onStatusChange={load} />)}
        </Collapsible>

        <Collapsible title="In Progress" count={activeLeads.length}>
          {activeLeads.length === 0
            ? <p style={{ padding: "20px 24px", color: "#94a3b8", fontSize: "0.875rem" }}>Nothing in progress.</p>
            : activeLeads.map(l => <LeadRow key={l.id} lead={l} onStatusChange={load} />)}
        </Collapsible>

        <Collapsible title="Live Listings" count={liveLeads.length}>
          {liveLeads.length === 0
            ? <p style={{ padding: "20px 24px", color: "#94a3b8", fontSize: "0.875rem" }}>No live listings yet.</p>
            : liveLeads.map(l => <LeadRow key={l.id} lead={l} onStatusChange={load} />)}
        </Collapsible>
      </div>
    </div>
  );
}
