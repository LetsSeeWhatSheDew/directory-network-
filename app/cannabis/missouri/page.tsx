import type { Metadata } from "next";
import Link from "next/link";
import { ALL_MISSOURI_CITIES } from "@/config/cities/missouri/shared";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Cannabis Dispensaries in Missouri — City-by-City Guide (${YEAR})`,
  description: `Browse licensed cannabis dispensaries across Missouri. City guides for St. Louis, Kansas City, Springfield, and more — laws, tips, and local info updated for ${YEAR}.`,
  openGraph: {
    title: `Missouri Cannabis Dispensary Guide (${YEAR})`,
    description: `Find dispensaries in every major Missouri city. Local laws, first-timer tips, pricing, and curated directory listings.`,
    siteName: "CleanList",
    type: "website",
    locale: "en_US",
  },
};

const CITY_HIGHLIGHTS: Record<string, { dispensaries: string; tagline: string }> = {
  "st-louis": {
    dispensaries: "30+",
    tagline: "Missouri's largest market with 300K+ residents and The Grove's trendy retail corridor.",
  },
  "kansas-city": {
    dispensaries: "25+",
    tagline: "Second-largest metro drawing cross-border traffic from Kansas with strong Crossroads presence.",
  },
  springfield: {
    dispensaries: "~15",
    tagline: "Southwest Missouri's cannabis hub serving the Ozark region with growing competition.",
  },
  columbia: {
    dispensaries: "~8",
    tagline: "College town anchored by Mizzou with educated, young consumer base.",
  },
  independence: {
    dispensaries: "5–6",
    tagline: "Kansas City suburb serving eastern metro with convenient access.",
  },
  "lees-summit": {
    dispensaries: "3–4",
    tagline: "Affluent Kansas City suburb catering to premium product selection.",
  },
  joplin: {
    dispensaries: "~8",
    tagline: "Tri-state gateway near OK/KS borders attracting cross-border shoppers.",
  },
  "jefferson-city": {
    dispensaries: "4–5",
    tagline: "State capital serving government workers and central Missouri residents.",
  },
  "cape-girardeau": {
    dispensaries: "3–4",
    tagline: "Southeast Missouri hub near Illinois border drawing cross-border traffic.",
  },
  branson: {
    dispensaries: "3–4",
    tagline: "Ozark tourist destination serving millions of annual visitors and lake-area residents.",
  },
};

export default function MissouriHubPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-slate-50">
      {/* Gradient halo */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-[#2D1B69] via-[#030712] to-transparent opacity-80" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7FE3C7] text-xs font-semibold text-slate-900 shadow-sm">
              PG
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                CleanList
              </span>
              <span className="text-[11px] text-slate-400">
                Missouri Cannabis Directory
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 text-xs">
            <Link
              href="/grow"
              className="hidden text-slate-300 transition-colors hover:text-slate-50 md:inline"
            >
              All Listings
            </Link>
            <Link
              href="/get-listed"
              className="rounded-full bg-[#7FE3C7] px-3.5 py-1.5 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#6ad3b7]"
            >
              Get listed
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 border-b border-white/5 bg-gradient-to-b from-black/60 via-[#020617] to-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Missouri · {YEAR} Cannabis Guide
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl md:text-4xl">
            Cannabis Dispensaries in{" "}
            <span className="bg-gradient-to-r from-[#7FE3C7] to-[#38bdf8] bg-clip-text text-transparent">
              Missouri
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
            Missouri legalized recreational cannabis via Amendment 3 in February 2023 and has since grown to 100+ licensed dispensaries across 10+ major cities. With significantly lower excise taxes than neighboring states and a rapidly expanding retail footprint, Missouri has become a regional cannabis destination. Browse our city-by-city guides below for local laws, dispensary info, first-timer tips, and pricing for every major market in the state.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-200 sm:flex sm:flex-wrap sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Licensed Dispensaries
              </div>
              <div className="text-lg font-semibold text-slate-50">100+</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Cities Covered
              </div>
              <div className="text-lg font-semibold text-slate-50">
                {ALL_MISSOURI_CITIES.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Excise Tax
              </div>
              <div className="text-lg font-semibold text-slate-50">6%</div>
            </div>
          </div>
        </div>
      </section>

      {/* City Grid */}
      <section className="relative z-10 border-b border-white/5 bg-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Browse by City
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Each guide includes local cannabis laws, dispensary info, pricing,
            and a first-timer walkthrough.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_MISSOURI_CITIES.map((city) => {
              const info = CITY_HIGHLIGHTS[city.slug];
              return (
                <Link
                  key={city.slug}
                  href={`/cannabis/missouri/${city.slug}`}
                  className="group flex flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-5 text-xs shadow-sm transition hover:border-[#7FE3C7]/60 hover:bg-slate-900"
                >
                  <h3 className="text-sm font-semibold text-slate-100">
                    {city.name}
                  </h3>
                  {info && (
                    <>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {info.dispensaries} dispensaries
                      </p>
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-300">
                        {info.tagline}
                      </p>
                    </>
                  )}
                  <div className="mt-3 flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>View city guide</span>
                    <span className="text-slate-500 group-hover:text-[#7FE3C7]">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick statewide info */}
      <section className="relative z-10 border-b border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Missouri Cannabis at a Glance
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            Quick-reference rules that apply statewide, regardless of which city
            you visit.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                Purchase Limits
              </div>
              <p className="text-slate-300">
                All visitors: 3oz flower, 8g concentrate, 24oz edibles, 6oz
                liquid per transaction. Must be 21+ with valid photo ID.
                Medical patients get higher limits with valid card.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                Tax Structure
              </div>
              <p className="text-slate-300">
                State excise tax: 6% (recreational). Plus state and local sales
                taxes varying by city (typically 8–9% combined). Medical taxed
                at reduced rate. Much lower than Illinois or surrounding states.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                Consumption
              </div>
              <p className="text-slate-300">
                Public consumption is prohibited statewide. Private residences
                only where owner consents. Landlords may add restrictions. No
                cannabis lounges or social consumption venues yet in Missouri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-3 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7FE3C7]/10 text-[10px] font-semibold text-[#7FE3C7]">
                PG
              </div>
              <span>CleanList · Missouri Cannabis Directory</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
              >
                CleanList
              </Link>
              <span className="hidden text-slate-600 md:inline">·</span>
              <Link
                href="/grow"
                className="text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
              >
                All Listings
              </Link>
              <span className="hidden text-slate-600 md:inline">·</span>
              <Link
                href="/get-listed"
                className="text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
              >
                Get Listed
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
