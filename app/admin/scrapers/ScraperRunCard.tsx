import type { ScraperRun } from "./page";

const STATUS_BADGE: Record<ScraperRun["status"], { color: string; label: string }> = {
  success: { color: "bg-[#7DBA47]/15 text-[#7DBA47]", label: "Success" },
  partial: { color: "bg-[#C9A876]/15 text-[#C9A876]", label: "Partial" },
  failed: { color: "bg-[#E24B4A]/15 text-[#E24B4A]", label: "Failed" },
  running: { color: "bg-white/10 text-[#F7F4ED]", label: "Running" },
};

function formatChicago(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export function ScraperRunCard({ run }: { run: ScraperRun }) {
  const badge = STATUS_BADGE[run.status];
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0a1a12] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
              {badge.label}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-[#8a9490]">
              Trigger: {run.trigger}
            </span>
          </div>
          <p className="mt-3 text-sm text-[#F7F4ED]">
            Started {relTime(run.started_at)}{" "}
            <span className="text-[#8a9490]">· {formatChicago(run.started_at)}</span>
          </p>
          {run.error_summary && (
            <p className="mt-2 text-xs text-[#E24B4A]/90">
              {run.error_summary}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
          <Stat label="Added" value={run.total_deals_added ?? 0} accent />
          <Stat label="Updated" value={run.total_deals_updated ?? 0} />
          <Stat label="Deactivated" value={run.total_deals_deactivated ?? 0} />
          <Stat label="Duration" value={formatDuration(run.duration_ms)} />
        </dl>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-widest text-[#8a9490]">
        {label}
      </dt>
      <dd
        className={`text-lg font-bold ${accent ? "text-[#7DBA47]" : "text-[#F7F4ED]"}`}
      >
        {value}
      </dd>
    </div>
  );
}
