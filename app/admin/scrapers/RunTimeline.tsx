import type { ScraperRun } from "./page";

const STATUS_DOT: Record<ScraperRun["status"], string> = {
  success: "bg-[#7DBA47]",
  partial: "bg-[#C9A876]",
  failed: "bg-[#E24B4A]",
  running: "bg-white/40",
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

export function RunTimeline({ runs }: { runs: ScraperRun[] }) {
  if (runs.length === 0) return null;
  return (
    <section className="rounded-2xl border border-white/5 bg-[#0a1a12] p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#8a9490]">
        Last {runs.length} runs
      </h2>
      <ul className="divide-y divide-white/5">
        {runs.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between py-2.5 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[r.status]}`} />
              <span className="text-[#F7F4ED]">{formatChicago(r.started_at)}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#8a9490]">
                {r.trigger}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#8a9490]">
              <span>+{r.total_deals_added ?? 0}</span>
              <span>~{r.total_deals_updated ?? 0}</span>
              <span>-{r.total_deals_deactivated ?? 0}</span>
              <span className="w-16 text-right">{r.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
