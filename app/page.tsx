// app/page.tsx
// Multi-directory homepage with search, filters, and pagination

import Link from "next/link";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

type Listing = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  type: string | null;
  short_description: string | null;
  plan: string | null;
  project_tag?: string;
};

const PROJECTS: Record<
  string,
  { label: string; description: string }
> = {
  green: {
    label: "Project Green · Cannabis",
    description: "Licensed dispensaries and cannabis listings.",
  },
  heal: {
    label: "Project Heal · Holistic",
    description: "Breathwork, bodywork, and holistic healers.",
  },
  her: {
    label: "Project Her · Women’s Wellness",
    description: "Pelvic floor PTs and women-focused care.",
  },
  machine: {
    label: "Project Machine · AI Tools",
    description: "AI tools for builders and businesses.",
  },
  bid: {
    label: "Project Bid · Gov Contractors",
    description: "Vendors winning city/county/state contracts.",
  },
  rent: {
    label: "Project Rent · FSBO Rentals",
    description: "For-rent-by-owner listings.",
  },
};

async function getListings(projectTag: string): Promise<Listing[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Missing Supabase env vars");
  }

  const baseUrl = SUPABASE_URL.replace(/\/$/, "");
  const url =
    baseUrl +
    "/rest/v1/master_listings" +
    `?project_tag=eq.${projectTag}` +
    "&select=id,name,city,state,type,short_description,plan,project_tag" +
    "&order=city.asc";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to fetch listings:", await res.text());
    throw new Error("Failed to load listings from Supabase");
  }

  return res.json();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    tag?: string;
    q?: string;
    state?: string;
    plan?: string;
    page?: string;
  }>;
}) {
  // Next 16: searchParams is a Promise
  const params = await searchParams;

  const selectedTag = params.tag || "green";
  const tag = PROJECTS[selectedTag] ? selectedTag : "green";

  const q = (params.q || "").toLowerCase().trim();
  const stateFilter = params.state || "all";
  const planFilter = params.plan || "all";
  const pageParam = parseInt(params.page || "1", 10);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = 8;

  const allListings = await getListings(tag);

  // Derive available states and plans from data
  const stateOptions = Array.from(
    new Set(
      allListings
        .map((l) => l.state)
        .filter((s): s is string => !!s && s !== "NA")
    )
  ).sort();

  const planOptions = Array.from(
    new Set(
      allListings
        .map((l) => l.plan)
        .filter((p): p is string => !!p)
    )
  ).sort();

  // Filter in-memory (data set is small enough)
  let filtered = allListings;

  if (q) {
    filtered = filtered.filter((l) => {
      const haystack = `${l.name || ""} ${l.city || ""} ${
        l.state || ""
      }`.toLowerCase();
      return haystack.includes(q);
    });
  }

  if (stateFilter !== "all") {
    filtered = filtered.filter((l) => l.state === stateFilter);
  }

  if (planFilter !== "all") {
    filtered = filtered.filter((l) => (l.plan || "free") === planFilter);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const meta = PROJECTS[tag];
  const tabs = Object.entries(PROJECTS);

  // Helper for building query strings for pagination/filters
  const buildQuery = (overrides: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    sp.set("tag", tag);
    if (q) sp.set("q", q);
    if (stateFilter !== "all") sp.set("state", stateFilter);
    if (planFilter !== "all") sp.set("plan", planFilter);
    sp.set("page", String(overrides.page ?? safePage));
    return `/?${sp.toString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Global header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Directory Network
            </h1>
            <p className="text-slate-400 text-xs">
              Six vertical directories powered by one Supabase backend.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs">
            {tabs.map(([key, info]) => {
              const active = key === tag;
              return (
                <Link
                  key={key}
                  href={key === "green" ? "/" : `/?tag=${key}`}
                  className={[
                    "px-3 py-1 rounded-full border transition",
                    active
                      ? "bg-slate-100 text-slate-900 border-slate-100"
                      : "border-slate-700 text-slate-300 hover:bg-slate-800",
                  ].join(" ")}
                >
                  {info.label.split("·")[0].trim()}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Directory meta + filters */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{meta.label}</h2>
            <p className="text-slate-300 text-sm">{meta.description}</p>
            <p className="text-slate-500 text-xs">
              Showing{" "}
              <span className="font-semibold">
                {total} listing{total === 1 ? "" : "s"}
              </span>{" "}
              for <span className="font-semibold">project_tag = &apos;{tag}&apos;</span>.
            </p>
          </div>

          {/* Filters / search form */}
          <form
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs"
            action="/"
            method="get"
          >
            {/* Keep the current tag */}
            <input type="hidden" name="tag" value={tag} />

            <div className="flex-1 flex flex-col gap-2 md:flex-row md:items-center">
              <input
                name="q"
                placeholder="Search by name or city…"
                defaultValue={q}
                className="w-full md:max-w-xs rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />

              <select
                name="state"
                defaultValue={stateFilter}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="all">All states</option>
                {stateOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                name="plan"
                defaultValue={planFilter}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="all">All plans</option>
                {planOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
              >
                Apply
              </button>
              <Link
                href={tag === "green" ? "/" : `/?tag=${tag}`}
                className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition flex items-center"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        {/* Listings grid */}
        {pageItems.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No listings match these filters yet.
          </p>
        ) : (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/l/${listing.id}`}
                  className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 hover:bg-slate-800/70 transition block"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm md:text-base">
                      {listing.name}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-1 bg-slate-800 text-slate-300">
                      {listing.type || "Listing"}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mb-2">
                    {listing.city || "Unknown city"}
                    {listing.state ? `, ${listing.state}` : ""}
                  </p>

                  {listing.short_description && (
                    <p className="text-slate-200 text-xs mb-3 line-clamp-3">
                      {listing.short_description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      Plan:{" "}
                      <span className="font-semibold text-slate-200">
                        {listing.plan || "free"}
                      </span>
                    </span>
                    <span className="text-slate-500 truncate max-w-[140px]">
                      id: {listing.id}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Page{" "}
                <span className="font-semibold text-slate-200">
                  {safePage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-200">
                  {totalPages}
                </span>
              </span>
              <div className="flex gap-2">
                {safePage > 1 && (
                  <Link
                    href={buildQuery({ page: safePage - 1 })}
                    className="px-3 py-1 rounded-md border border-slate-700 hover:bg-slate-800 transition"
                  >
                    ← Prev
                  </Link>
                )}
                {safePage < totalPages && (
                  <Link
                    href={buildQuery({ page: safePage + 1 })}
                    className="px-3 py-1 rounded-md border border-slate-700 hover:bg-slate-800 transition"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}