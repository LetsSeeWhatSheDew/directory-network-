// app/admin/leads/page.tsx
import Link from "next/link";

type Lead = {
  id: string;
  created_at: string;
  updated_at: string;
  business_name: string;
  email: string;
  phone: string | null;
  tier_interest: string;
  niche: string;
  region: string;
  source: string;
  status: string;
};

const NICHE_LABELS: Record<string, string> = {
  cannabis: "PuffPrice · Cannabis",
  holistic: "Project Heal · Holistic",
  wellness: "Project Her · Women's Wellness",
  ai: "Project Machine · AI Tools",
  government: "Project Bid · Gov Contractors",
  rentals: "Project Rent · FSBO Rentals",
};

const FILTERS = [
  { value: "all", label: "All directories" },
  { value: "cannabis", label: "Green · Cannabis" },
  { value: "holistic", label: "Heal · Holistic" },
  { value: "wellness", label: "Her · Women's Wellness" },
  { value: "ai", label: "Machine · AI Tools" },
  { value: "government", label: "Bid · Gov Contracts" },
  { value: "rentals", label: "Rent · FSBO" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-[#93CB5C]/15 text-[#93CB5C] border-[#93CB5C]/30",
  reviewed: "bg-blue-500/15 text-blue-300 border-blue-400/30",
  converted: "bg-purple-500/15 text-purple-300 border-purple-400/30",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

async function fetchLeads(filterNiche?: string): Promise<Lead[]> {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    return [];
  }

  const baseUrl = SUPABASE_URL.replace(/\/$/, "");
  let url = `${baseUrl}/rest/v1/directory_leads?select=*&order=created_at.desc`;

  if (filterNiche && filterNiche !== "all") {
    url += `&niche=eq.${encodeURIComponent(filterNiche)}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch leads:", text);
    return [];
  }

  return (await res.json()) as Lead[];
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ niche?: string }>;
}) {
  const { niche } = await searchParams;
  const selectedNiche =
    niche && FILTERS.some((f) => f.value === niche) ? niche : "all";

  const leads = await fetchLeads(
    selectedNiche === "all" ? undefined : selectedNiche
  );

  const newLeads = leads.filter((l) => l.status === "new").length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#93CB5C] text-xs font-semibold text-slate-900 shadow-sm">
              PG
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                PuffPrice · Admin
              </span>
              <span className="text-xs text-slate-400">
                Leads inbox · listing requests
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm hover:bg-slate-800"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {/* Header + stats */}
        <section className="mb-4 space-y-3 md:mb-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                Leads inbox
              </h1>
              <p className="text-xs text-slate-400 md:text-sm">
                All "Get Listed" submissions, newest first.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-slate-200">
                Total:{" "}
                <span className="ml-1 font-semibold text-[#93CB5C]">
                  {leads.length}
                </span>
              </span>
              {newLeads > 0 && (
                <span className="inline-flex items-center rounded-full bg-[#93CB5C]/15 px-3 py-1 text-[#93CB5C]">
                  New:{" "}
                  <span className="ml-1 font-semibold">{newLeads}</span>
                </span>
              )}
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px] md:text-xs">
            {FILTERS.map((f) => {
              const isActive = f.value === selectedNiche;
              const href =
                f.value === "all"
                  ? "/admin/leads"
                  : `/admin/leads?niche=${encodeURIComponent(f.value)}`;

              return (
                <Link
                  key={f.value}
                  href={href}
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 transition-colors",
                    isActive
                      ? "border-[#93CB5C] bg-[#93CB5C]/15 text-[#93CB5C]"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800",
                  ].join(" ")}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* No data state */}
        {leads.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-8 text-center text-sm text-slate-400 md:px-8">
            <p>No leads yet. Once someone submits the "Get Listed" form, they&apos;ll appear here.</p>
          </div>
        )}

        {/* Leads list */}
        {leads.length > 0 && (
          <section className="space-y-2">
            {leads.map((lead) => {
              const nicheLabel = NICHE_LABELS[lead.niche] || lead.niche;
              const statusStyle = STATUS_STYLES[lead.status] || STATUS_STYLES.new;

              return (
                <article
                  key={lead.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-100 shadow-sm md:px-5 md:py-4 md:text-sm"
                >
                  <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold md:text-base">
                          {lead.business_name}
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-200">
                          {nicheLabel}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                            statusStyle,
                          ].join(" ")}
                        >
                          {lead.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 md:text-xs">
                        <span>{formatDate(lead.created_at)}</span>
                        <span className="text-slate-600">•</span>
                        <span>Tier: <span className="text-slate-200">{lead.tier_interest}</span></span>
                        <span className="text-slate-600">•</span>
                        <span>{lead.region}</span>
                      </div>
                    </div>

                    <div className="mt-1 flex flex-col items-start gap-1 text-[11px] text-slate-300 md:mt-0 md:items-end">
                      <span className="font-medium text-slate-100">{lead.email}</span>
                      {lead.phone && (
                        <span className="text-slate-400">{lead.phone}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
