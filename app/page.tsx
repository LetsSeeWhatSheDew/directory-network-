// app/page.tsx
import Link from "next/link";
import Image from "next/image";

type Listing = {
  id: string;
  project_tag: string;
  listing_name: string;
  city: string | null;
  state: string | null;
  short_description: string | null;
  is_featured: boolean;
};

const PROJECTS: Record<
  string,
  {
    label: string;
    tagline: string;
    badge: string;
    color: string;
  }
> = {
  green: {
    label: "Project Green · Cannabis",
    tagline: "Licensed dispensaries, delivery services & patient-first cannabis brands.",
    badge: "Cannabis",
    color: "#16a34a",
  },
  heal: {
    label: "Project Heal · Holistic",
    tagline: "Somatic workers, energy healers, bodyworkers & alternative care.",
    badge: "Holistic",
    color: "#22c55e",
  },
  her: {
    label: "Project Her · Women’s Wellness",
    tagline: "Clinics, practitioners & brands focused on women’s bodies and stories.",
    badge: "Women’s wellness",
    color: "#ec4899",
  },
  machine: {
    label: "Project Machine · AI Tools",
    tagline: "AI tools actually used by operators, not just launch-day hype.",
    badge: "AI tools",
    color: "#38bdf8",
  },
  bid: {
    label: "Project Bid · Gov Contractors",
    tagline: "Vendors winning city, county & state contracts — mapped and trackable.",
    badge: "Gov contracts",
    color: "#6366f1",
  },
  rent: {
    label: "Project Rent · FSBO Rentals",
    tagline: "For-rent-by-owner inventory without the property management middleman.",
    badge: "FSBO rentals",
    color: "#f97316",
  },
};

function getProjectLabel(tag: string) {
  return PROJECTS[tag]?.label ?? "Directory Network";
}

function getLocation(listing: Listing) {
  if (listing.city && listing.state) return `${listing.city}, ${listing.state}`;
  if (listing.city) return listing.city;
  if (listing.state) return listing.state;
  return "Location on file";
}

async function fetchListings(tag: string): Promise<Listing[]> {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    return [];
  }

  const baseUrl = SUPABASE_URL.replace(/\/$/, "");
  const url =
    `${baseUrl}/rest/v1/master_listings` +
    `?project_tag=eq.${encodeURIComponent(tag)}` +
    `&select=id,project_tag,listing_name,city,state,short_description,is_featured` +
    `&order=is_featured.desc,listing_name.asc`;

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
    console.error("Failed to fetch listings:", text);
    return [];
  }

  return (await res.json()) as Listing[];
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const selectedTag = tag && PROJECTS[tag] ? tag : "green";

  const listings = await fetchListings(selectedTag);
  const featured = listings.filter((l) => l.is_featured);
  const regular = listings.filter((l) => !l.is_featured);

  const currentProject = PROJECTS[selectedTag];

  return (
    <main className="min-h-screen bg-[#030712] text-slate-50">
      {/* Top gradient halo */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-[#2D1B69] via-[#030712] to-transparent opacity-80" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7FE3C7] text-xs font-semibold text-slate-900 shadow-sm">
              DN
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Directory Network
              </span>
              <span className="text-[11px] text-slate-400">
                Curated vertical directories · 6 markets
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-4 text-xs text-slate-300 md:flex">
            <Link
              href="#how-it-works"
              className="transition-colors hover:text-slate-50"
            >
              How it works
            </Link>
            <Link
              href="#directories"
              className="transition-colors hover:text-slate-50"
            >
              Directories
            </Link>
            <Link
              href="/admin/leads"
              className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-slate-300 hover:border-white/30 hover:bg-white/5"
            >
              Operator inbox
            </Link>
            <Link
              href="/get-listed"
              className="rounded-full bg-[#7FE3C7] px-3.5 py-1.5 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#6ad3b7]"
            >
              Get listed
            </Link>
          </nav>

          {/* Mobile CTA */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/get-listed"
              className="rounded-full bg-[#7FE3C7] px-3 py-1.5 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#6ad3b7]"
            >
              Get listed
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + summary */}
      <section className="relative z-10 border-b border-white/5 bg-gradient-to-b from-black/60 via-[#020617] to-[#020617]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:items-center md:py-12">
          {/* Left: copy */}
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Live multi-directory prototype · Cannabis-led rollout
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl md:text-4xl">
              A clean, credible home for{" "}
              <span className="bg-gradient-to-r from-[#7FE3C7] to-[#38bdf8] bg-clip-text text-transparent">
                high-trust directories
              </span>
              .
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
              The Directory Network is a small, opinionated collection of
              vertical marketplaces — starting with{" "}
              <span className="font-medium text-emerald-300">
                cannabis, healers, women&apos;s wellness, AI tools, gov
                contractors &amp; FSBO rentals
              </span>
              . Fewer listings, more signal, and zero late-2000s scam energy.
            </p>

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-200 sm:flex sm:flex-wrap sm:gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Directories
                </div>
                <div className="text-lg font-semibold text-slate-50">6</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Curated listings
                </div>
                <div className="text-lg font-semibold text-slate-50">
                  {listings.length.toString().padStart(2, "0")}+
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Focus
                </div>
                <div className="text-xs font-medium text-slate-100">
                  Regulated, niche &amp; high-trust markets
                </div>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <Link
                href="/get-listed"
                className="inline-flex items-center rounded-full bg-[#7FE3C7] px-4 py-2 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#6ad3b7]"
              >
                Apply to get listed
              </Link>
              <a
                href="#directories"
                className="inline-flex items-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-[11px] font-medium text-slate-200 hover:border-white/40 hover:bg-white/5"
              >
                Explore live directories
              </a>
            </div>
          </div>

          {/* Right: current project highlight */}
          <div className="flex-1">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl sm:p-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1 text-[11px] text-slate-200">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: currentProject.color }}
                />
                Currently viewing
                <span className="font-semibold text-slate-50">
                  {currentProject.label}
                </span>
              </div>

              <p className="mb-4 text-xs text-slate-300 md:text-sm">
                {currentProject.tagline}
              </p>

              <div className="space-y-2">
                {(featured.length ? featured : listings.slice(0, 3)).map(
                  (listing) => (
                    <Link
                      key={listing.id}
                      href={`/l/${listing.id}`}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-slate-900/80 px-3 py-2.5 text-xs text-slate-100 transition hover:border-[#7FE3C7]/60 hover:bg-slate-900"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-semibold">
                            {listing.listing_name}
                          </h3>
                          {listing.is_featured && (
                            <span className="rounded-full bg-[#7FE3C7]/15 px-2 py-0.5 text-[10px] font-medium text-[#7FE3C7]">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {getLocation(listing)}
                        </div>
                        {listing.short_description && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                            {listing.short_description}
                          </p>
                        )}
                      </div>
                      <span className="mt-1 text-[11px] text-slate-500">
                        View →
                      </span>
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directories + listings */}
      <section
        id="directories"
        className="relative z-10 border-t border-white/5 bg-[#020617]"
      >
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          {/* Directory tabs */}
          <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-100 md:text-base">
                Browse the network
              </h2>
              <p className="text-[11px] text-slate-400 md:text-xs">
                Switch directories to see a different slice of the network.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px] md:text-xs">
              {Object.entries(PROJECTS).map(([key, proj]) => {
                const isActive = key === selectedTag;
                return (
                  <Link
                    key={key}
                    href={key === "green" ? "/" : `/?tag=${key}`}
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 transition-colors",
                      isActive
                        ? "border-[#7FE3C7] bg-[#7FE3C7]/15 text-[#7FE3C7]"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {proj.badge}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Listing grid */}
          {listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-10 text-center text-sm text-slate-400 md:px-8">
              <p>
                No listings yet for this directory. We&apos;re curating the
                first operators —{" "}
                <Link
                  href="/get-listed"
                  className="font-medium text-[#7FE3C7] underline-offset-2 hover:underline"
                >
                  apply to be one of them
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/l/${listing.id}`}
                  className="group flex flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-100 shadow-sm transition hover:border-[#7FE3C7]/60 hover:bg-slate-900"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-semibold">
                        {listing.listing_name}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {getLocation(listing)}
                      </p>
                    </div>
                    {listing.is_featured && (
                      <span className="rounded-full bg-[#7FE3C7]/15 px-2 py-0.5 text-[10px] font-medium text-[#7FE3C7]">
                        Featured
                      </span>
                    )}
                  </div>
                  {listing.short_description && (
                    <p className="mb-3 line-clamp-3 text-[11px] text-slate-300">
                      {listing.short_description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>View profile</span>
                    <span className="text-slate-500 group-hover:text-[#7FE3C7]">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 border-t border-white/5 bg-black"
      >
        <div className="mx-auto max-w-6xl px-4 py-9 md:py-12">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-100 md:text-base">
                How the Directory Network works
              </h2>
              <p className="text-[11px] text-slate-400 md:text-xs">
                Simple for visitors, opinionated behind the scenes.
              </p>
            </div>
            <Link
              href="/get-listed"
              className="inline-flex items-center rounded-full bg-[#7FE3C7] px-4 py-2 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#6ad3b7]"
            >
              Start a listing request
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                01 · Curated verticals
              </div>
              <p className="text-slate-300">
                We don&apos;t list everything. Each directory is focused on a
                specific, high-trust niche where relevance matters more than
                raw volume.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                02 · Human review
              </div>
              <p className="text-slate-300">
                Claims and new listing requests go to a real operator inbox,
                not a black hole. Basic checks on licensing, fit, and quality
                before anything goes live.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                03 · Room to grow
              </div>
              <p className="text-slate-300">
                This is a prototype built for speed — but the rails are in
                place for featured placements, paid tiers, and deeper
                search/filter when the time is right.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7FE3C7]/10 text-[10px] font-semibold text-[#7FE3C7]">
              DN
            </div>
            <span>Directory Network · prototype build</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <span>6 verticals live in v1</span>
            <span className="hidden text-slate-600 md:inline">•</span>
            <Link
              href="/get-listed"
              className="text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
            >
              Get listed
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}