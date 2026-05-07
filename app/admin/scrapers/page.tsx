import { Metadata } from "next";
import Link from "next/link";
import { ScraperRunCard } from "./ScraperRunCard";
import { ScraperRunRow } from "./ScraperRunRow";
import { RunTimeline } from "./RunTimeline";

export const metadata: Metadata = {
  title: "Scrapers | PuffPrice Admin",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

type DispensaryResult = {
  slug: string;
  platform: string;
  status: "success" | "failed" | "skipped";
  deals_added: number;
  deals_updated: number;
  deals_deactivated: number;
  error_message: string | null;
};

export type ScraperRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "partial" | "failed";
  trigger: "cron" | "manual" | "admin";
  dispensary_results: DispensaryResult[] | null;
  total_deals_added: number | null;
  total_deals_updated: number | null;
  total_deals_deactivated: number | null;
  duration_ms: number | null;
  error_summary: string | null;
};

async function fetchRuns(): Promise<ScraperRun[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(
      `${url}/rest/v1/scraper_runs?select=*&order=started_at.desc&limit=30`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error("scraper_runs fetch failed:", await res.text());
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("scraper_runs fetch error:", err);
    return [];
  }
}

export default async function AdminScrapersPage() {
  const runs = await fetchRuns();
  const latest = runs[0] ?? null;

  return (
    <div className="min-h-screen bg-[#1F3D2B] text-[#F7F4ED]">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <div>
            <Link
              href="/admin"
              className="text-[11px] uppercase tracking-widest text-[#8a9490] transition-colors hover:text-[#7DBA47]"
            >
              &larr; Dashboard
            </Link>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              Daily scrapers
            </h1>
          </div>
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="text-[#8a9490]">Project</span>
            <span className="font-semibold text-[#7DBA47]">Green</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-5 py-10 md:px-8">
        {latest ? (
          <ScraperRunCard run={latest} />
        ) : (
          <div className="rounded-2xl border border-white/5 bg-[#0a1a12] p-8 text-center">
            <p className="text-sm text-[#8a9490]">
              No scraper runs recorded yet. Trigger one from{" "}
              <span className="text-[#F7F4ED]">
                GitHub Actions → Daily deal scrape → Run workflow
              </span>
              , or run <code className="rounded bg-white/5 px-1.5 py-0.5">npm run scrape:cil:live</code> locally.
            </p>
          </div>
        )}

        {latest && latest.dispensary_results && latest.dispensary_results.length > 0 && (
          <section className="rounded-2xl border border-white/5 bg-[#0a1a12] p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#8a9490]">
              Dispensaries (latest run)
            </h2>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] uppercase tracking-widest text-[#8a9490]">
                    <th className="pb-3 pr-4 text-left font-medium">Dispensary</th>
                    <th className="pb-3 pr-4 text-left font-medium">Platform</th>
                    <th className="pb-3 pr-4 text-left font-medium">Status</th>
                    <th className="pb-3 pr-4 text-right font-medium">Added</th>
                    <th className="pb-3 pr-4 text-right font-medium">Updated</th>
                    <th className="pb-3 pr-4 text-right font-medium">Deactivated</th>
                    <th className="pb-3 pr-4 text-left font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.dispensary_results.map((r) => (
                    <ScraperRunRow key={r.slug} result={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <RunTimeline runs={runs} />
      </main>
    </div>
  );
}
