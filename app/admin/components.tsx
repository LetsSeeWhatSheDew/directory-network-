"use client";

import { useState } from "react";

/* ─── Collapsible Section ─── */

export function CollapsibleSection({
  title,
  defaultOpen = false,
  count,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a1a12] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#F7F4ED]">{title}</h2>
          {typeof count === "number" && (
            <span className="rounded-full bg-[#7DBA47]/10 px-2.5 py-0.5 text-xs font-medium text-[#7DBA47]">
              {count}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-[#8a9490] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-white/5 px-6 py-5">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Status Pill (interactive) ─── */

const STATUS_OPTIONS = ["new", "contacted", "converted", "closed"] as const;
type StatusValue = (typeof STATUS_OPTIONS)[number];

const STATUS_STYLES: Record<StatusValue, string> = {
  new: "bg-[#7DBA47]/15 text-[#7DBA47]",
  contacted: "bg-amber-500/15 text-amber-400",
  converted: "bg-sky-500/15 text-sky-400",
  closed: "bg-white/10 text-[#8a9490]",
};

export function StatusPill({
  leadId,
  initialStatus,
}: {
  leadId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState<StatusValue>(
    (STATUS_OPTIONS.includes(initialStatus as StatusValue)
      ? initialStatus
      : "new") as StatusValue
  );
  const [saving, setSaving] = useState(false);

  async function cycle() {
    const idx = STATUS_OPTIONS.indexOf(status);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    setStatus(next);
    setSaving(true);

    try {
      await fetch("/api/admin/update-lead-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: next }),
      });
    } catch {
      // revert on failure
      setStatus(status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={cycle}
      disabled={saving}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${STATUS_STYLES[status]} ${saving ? "opacity-50" : "hover:ring-1 hover:ring-white/20 cursor-pointer"}`}
      title="Click to change status"
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
      {saving && (
        <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" />
      )}
    </button>
  );
}
