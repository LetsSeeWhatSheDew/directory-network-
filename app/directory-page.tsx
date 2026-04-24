// app/page.tsx
import Link from "next/link";
import Image from "next/image";

type Listing = {
  id: string;
  project_tag: string;
  listing_name?: string;
  name?: string;
  listing_title?: string;
  city: string | null;
  state: string | null;
  short_description: string | null;
  is_featured: boolean;
};

function getListingName(listing: Listing): string {
  return listing.listing_name || listing.name || listing.listing_title || "Unnamed";
}

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
    label: "PuffPrice · Cannabis",
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
  return PROJECTS[tag]?.label ?? "PuffPrice";
}

function getLocation(listing: Listing) {
  if (listing.city && listing.state) return `${listing.city}, ${listing.state}`;
  if (listing.city) return listing.city;
  if (listing.state) return listing.state;
  return "Location on file";
}

async function fetchListings(tag: string): Promise<Listing[]> {
  // Env fallback chain — tolerates the pre/post rename on Vercel and falls
  // back to anon on public reads so this page never crashes silently.
  const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    "https://hnbjufmtmrhexmdrfubw.supabase.co";
  const SUPABASE_SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

  const baseUrl = SUPABASE_URL.replace(/\/$/, "");
  const url =
    `${baseUrl}/rest/v1/master_listings` +
    `?project_tag=eq.${encodeURIComponent(tag)}` +
    `&is_active=eq.true` +
    `&select=*` +
    `&order=is_featured.desc`;

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
    <main className="min-h-screen bg-[#050f09] text-slate-50">
      {/* Top gradient halo */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-[#0a2818] via-[#050f09] to-transparent opacity-80" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo-512.png" alt="PuffPrice" width={32} height={32} className="h-8 w-8" />
          </div>

          <nav className="hidden items-center gap-4 text-xs text-slate-300 md:flex">
            <Link
              href="/cannabis/illinois"
              className="transition-colors hover:text-slate-50"
            >
              Illinois Cannabis
            </Link>
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
              href="/admin"
              className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-slate-300 hover:border-white/30 hover:bg-white/5"
            >
              Dashboard
            </Link>
            <Link
              href="/get-listed"
              className="rounded-full bg-[#50c878] px-3.5 py-1.5 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#3da85e]"
            >
              Get listed
            </Link>
          </nav>

          {/* Mobile CTA */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/get-listed"
              className="rounded-full bg-[#50c878] px-3 py-1.5 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#3da85e]"
            >
              Get listed
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + summary */}
      <section className="relative z-10 border-b border-white/5 bg-gradient-to-b from-black/60 via-[#040d07] to-[#040d07]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:items-center md:py-12">
          {/* Left: copy */}
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#50c878]/20 bg-[#50c878]/5 px-3 py-1 text-[11px] font-medium text-[#50c878]/80 tracking-wide uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#50c878]" />
              Live &middot; Cannabis-led rollout
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-[#f0ede8] sm:text-3xl md:text-4xl">
              The curated directory for{" "}
              <span className="text-[#50c878]">
                licensed cannabis operators
              </span>
              .
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-[#8a9490] md:text-base">
              PuffPrice is an editorially curated directory of licensed
              cannabis dispensaries across Central Illinois. Verified
              listings only. No pay-to-play. Built for operators who take
              their market seriously.
            </p>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 text-xs text-[#f0ede8] sm:flex sm:flex-wrap sm:gap-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-[#8a9490]">
                  Markets
                </div>
                <div className="text-lg font-semibold text-[#f0ede8]">2</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-[#8a9490]">
                  Verified listings
                </div>
                <div className="text-lg font-semibold text-[#f0ede8]">
                  {listings.length}+
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-[#8a9490]">
                  Cities covered
                </div>
                <div className="text-lg font-semibold text-[#f0ede8]">45</div>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <Link
                href="/get-listed"
                className="inline-flex items-center rounded-full bg-[#50c878] px-4 py-2 text-[12px] font-semibold text-[#050f09] shadow-sm hover:bg-[#3da85e] transition-colors"
              >
                Request a listing
              </Link>
              <Link
                href="/cannabis/illinois"
                className="inline-flex items-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-[12px] font-medium text-[#f0ede8] hover:border-[#50c878]/30 hover:bg-white/5 transition-colors"
              >
                Browse Illinois
              </Link>
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
                      className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-slate-900/80 px-3 py-2.5 text-xs text-slate-100 transition hover:border-[#50c878]/60 hover:bg-slate-900"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-semibold">
                            {getListingName(listing)}
                          </h3>
                          {listing.is_featured && (
                            <span className="rounded-full bg-[#50c878]/15 px-2 py-0.5 text-[10px] font-medium text-[#50c878]">
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
        className="relative z-10 border-t border-white/5 bg-[#040d07]"
      >
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          {/* Directory tabs */}
          <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[#f0ede8] md:text-base">
                Directory index
              </h2>
              <p className="text-[11px] text-[#8a9490] md:text-xs">
                Select a vertical to view its listings.
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
                        ? "border-[#50c878] bg-[#50c878]/15 text-[#50c878]"
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
                  className="font-medium text-[#50c878] underline-offset-2 hover:underline"
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
                  className="group flex flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-100 shadow-sm transition hover:border-[#50c878]/60 hover:bg-slate-900"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-semibold">
                        {getListingName(listing)}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {getLocation(listing)}
                      </p>
                    </div>
                    {listing.is_featured && (
                      <span className="rounded-full bg-[#50c878]/15 px-2 py-0.5 text-[10px] font-medium text-[#50c878]">
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
                    <span className="text-slate-500 group-hover:text-[#50c878]">
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
              <h2 className="text-sm font-semibold tracking-tight text-[#f0ede8] md:text-base">
                Editorial standards
              </h2>
              <p className="text-[11px] text-[#8a9490] md:text-xs">
                How listings earn their place in the directory.
              </p>
            </div>
            <Link
              href="/get-listed"
              className="inline-flex items-center rounded-full bg-[#50c878] px-4 py-2 text-[11px] font-semibold text-[#050f09] shadow-sm hover:bg-[#3da85e] transition-colors"
            >
              Submit for review
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-xs text-[#f0ede8]">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#50c878]">
                Verification
              </div>
              <p className="text-[#8a9490] leading-relaxed">
                Every listing is checked against state licensing records.
                We verify active status, location accuracy, and operational
                legitimacy before publication.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-xs text-[#f0ede8]">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#50c878]">
                Local authority
              </div>
              <p className="text-[#8a9490] leading-relaxed">
                City-level pages with jurisdiction-specific regulations,
                purchase limits, and consumption rules. Built for Illinois
                and Missouri — not a national aggregator.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-xs text-[#f0ede8]">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#50c878]">
                Curation
              </div>
              <p className="text-[#8a9490] leading-relaxed">
                Inclusion is not automatic. Listing requests are reviewed
                for fit, quality, and regional relevance. Featured placements
                are earned, not purchased.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-512.png" alt="PuffPrice" width={20} height={20} className="h-5 w-5 opacity-60" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/cannabis/illinois" className="text-[#8a9490] hover:text-[#f0ede8] transition-colors">Illinois</Link>
            <Link href="/cannabis/missouri" className="text-[#8a9490] hover:text-[#f0ede8] transition-colors">Missouri</Link>
            <span className="hidden text-slate-700 md:inline">|</span>
            <Link
              href="/get-listed"
              className="text-[#50c878] underline-offset-2 hover:text-[#3da85e]"
            >
              Request a listing
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
