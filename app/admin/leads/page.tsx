// app/admin/leads/page.tsx
import Link from "next/link";

type Lead = {
  id: number;
  created_at: string;
  listing_id: string | null;
  project_tag: string | null;
  listing_name: string | null;
  name: string | null;
  email: string | null;
  company: string | null;
  message: string | null;
};

const TAG_LABELS: Record<string, string> = {
  green: "Project Green · Cannabis",
  heal: "Project Heal · Holistic",
  her: "Project Her · Women’s Wellness",
  machine: "Project Machine · AI Tools",
  bid: "Project Bid · Gov Contractors",
  rent: "Project Rent · FSBO Rentals",
};

const FILTERS = [
  { value: "all", label: "All directories" },
  { value: "green", label: "Green · Cannabis" },
  { value: "heal", label: "Heal · Holistic" },
  { value: "her", label: "Her · Women’s Wellness" },
  { value: "machine", label: "Machine · AI Tools" },
  { value: "bid", label: "Bid · Gov Contracts" },
  { value: "rent", label: "Rent · FSBO" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

async function fetchLeads(filterTag?: string): Promise<Lead[]> {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    return [];
  }

  const baseUrl = SUPABASE_URL.replace(/\/$/, "");
  let url = `${baseUrl}/rest/v1/leads?select=*&order=created_at.desc`;

  if (filterTag && filterTag !== "all") {
    // filter by project_tag using PostgREST syntax
    url += `&project_tag=eq.${encodeURIComponent(filterTag)}`;
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
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const selectedTag =
    tag && FILTERS.some((f) => f.value === tag) ? tag : "all";

  const leads = await fetchLeads(
    selectedTag === "all" ? undefined : selectedTag
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7FE3C7] text-xs font-semibold text-slate-900 shadow-sm">
              DN
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Directory Network · Operator
              </span>
              <span className="text-xs text-slate-400">
                Leads inbox · claims &amp; listing requests
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm hover:bg-slate-800"
          >
            ← Back to public site
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {/* Header + filters */}
        <section className="mb-4 space-y-3 md:mb-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                Leads inbox
              </h1>
              <p className="text-xs text-slate-400 md:text-sm">
                Every claim and “Get listed” submission across all directories,
                newest first.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-slate-200">
                Total leads:{" "}
                <span className="ml-1 font-semibold text-[#7FE3C7]">
                  {leads.length}
                </span>
              </span>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px] md:text-xs">
            {FILTERS.map((f) => {
              const isActive = f.value === selectedTag;
              const href =
                f.value === "all"
                  ? "/admin/leads"
                  : `/admin/leads?tag=${encodeURIComponent(f.value)}`;

              return (
                <Link
                  key={f.value}
                  href={href}
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 transition-colors",
                    isActive
                      ? "border-[#7FE3C7] bg-[#7FE3C7]/15 text-[#7FE3C7]"
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
            <p>No leads for this filter yet. Submit a claim or Get listed request to test.</p>
          </div>
        )}

        {/* Leads list */}
        {leads.length > 0 && (
          <section className="space-y-2">
            {leads.map((lead) => {
              const tagKey = (lead.project_tag || "").toLowerCase();
              const tagLabel = TAG_LABELS[tagKey] || "Unknown directory";

              const isNewListing = lead.listing_id?.startsWith("new-");
              const shortId = lead.listing_id || "—";

              return (
                <article
                  key={lead.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-100 shadow-sm md:px-5 md:py-4 md:text-sm"
                >
                  <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold md:text-base">
                          {lead.listing_name || "New listing request"}
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-200">
                          {tagLabel}
                        </span>
                        {isNewListing && (
                          <span className="inline-flex items-center rounded-full bg-[#7FE3C7]/15 px-2 py-0.5 text-[10px] font-medium text-[#7FE3C7]">
                            New listing
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 md:text-xs">
                        <span>{formatDate(lead.created_at)}</span>
                        <span className="text-slate-600">•</span>
                        <span>ID: {shortId}</span>
                        {lead.company && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span>{lead.company}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-col items-start gap-1 text-[11px] text-slate-300 md:mt-0 md:items-end">
                      <span className="font-medium">
                        {lead.name || "Unknown contact"}
                      </span>
                      <span className="text-slate-400">{lead.email}</span>
                    </div>
                  </div>

                  {lead.message && (
                    <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-900/80 px-3 py-2 text-[11px] leading-relaxed text-slate-200 md:text-xs">
                      {lead.message}
                    </p>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}