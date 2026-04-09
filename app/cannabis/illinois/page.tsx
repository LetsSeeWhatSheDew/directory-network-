import type { Metadata } from "next";
import Link from "next/link";
import { ALL_ILLINOIS_CITIES } from "@/config/cities/illinois/shared";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Cannabis Dispensaries in Illinois — City-by-City Guide (${YEAR})`,
  description: `Browse licensed cannabis dispensaries across Illinois. City guides for Chicago, Rockford, Springfield, Peoria, Naperville, and more — laws, tips, and local info updated for ${YEAR}.`,
  openGraph: {
    title: `Illinois Cannabis Dispensary Guide (${YEAR})`,
    description: `Find dispensaries in every major Illinois city. Local laws, first-timer tips, pricing, and curated directory listings.`,
    siteName: "Project Green",
    type: "website",
    locale: "en_US",
  },
};

const CITY_HIGHLIGHTS: Record<string, { dispensaries: string; tagline: string }> = {
  chicago: {
    dispensaries: "20–30+",
    tagline: "Largest market in the state with neighborhood-level options.",
  },
  rockford: {
    dispensaries: "~7",
    tagline: "Border-town draw for Wisconsin visitors.",
  },
  springfield: {
    dispensaries: "~5–15",
    tagline: "State capital hub serving central IL's rural catchment.",
  },
  peoria: {
    dispensaries: "~10",
    tagline: "Central IL's largest metro — Jacaranda Peoria's home turf.",
  },
  naperville: {
    dispensaries: "~9",
    tagline: "Affluent DuPage County suburb with premium selection.",
  },
  "champaign-urbana": {
    dispensaries: "~8",
    tagline: "University of Illinois college-town market.",
  },
  "bloomington-normal": {
    dispensaries: "~10",
    tagline: "I-55/I-74 crossroads with an outsized dispensary cluster.",
  },
  joliet: {
    dispensaries: "~9",
    tagline: "I-80 corridor gateway for Will County.",
  },
  aurora: {
    dispensaries: "~1–3",
    tagline: "IL's 2nd-largest city — underserved and growing.",
  },
  collinsville: {
    dispensaries: "~5–8",
    tagline: "Metro East hub drawing St. Louis cross-border shoppers.",
  },
  effingham: {
    dispensaries: "~3–5",
    tagline: "I-57/I-70 crossroads capturing highway traveler traffic.",
  },
  quincy: {
    dispensaries: "~8",
    tagline: "Western IL hub near Iowa and Missouri borders.",
  },
  danville: {
    dispensaries: "~3–4",
    tagline: "Indiana border town — IN is still illegal recreationally.",
  },
  "east-peoria": {
    dispensaries: "~8",
    tagline: "Complements Peoria with its own dispensary cluster.",
  },
  marion: {
    dispensaries: "~4–6",
    tagline: "Southern IL hub near SIU and Shawnee National Forest.",
  },
  sycamore: {
    dispensaries: "~1–2",
    tagline: "DeKalb County newcomer with fresh 2026 openings.",
  },
  carbondale: {
    dispensaries: "~3–4",
    tagline: "SIU college town in scenic Southern Illinois.",
  },
  decatur: {
    dispensaries: "~3–5",
    tagline: "Central IL market still underserved relative to demand.",
  },
  elgin: {
    dispensaries: "~3–5",
    tagline: "Large NW suburban population in Kane County.",
  },
  waukegan: {
    dispensaries: "~4–6",
    tagline: "Lake County anchor near the Wisconsin border.",
  },
  schaumburg: {
    dispensaries: "~3–5",
    tagline: "Major NW suburban retail corridor.",
  },
  normal: {
    dispensaries: "~7–8",
    tagline: "ISU town with the densest dispensary cluster downstate.",
  },
  champaign: {
    dispensaries: "~5–6",
    tagline: "UofI campus side of the twin-city market.",
  },
  addison: {
    dispensaries: "~2–3",
    tagline: "DuPage County option between Chicago and Naperville.",
  },
  "north-aurora": {
    dispensaries: "~1–2",
    tagline: "Kane County complement to nearby Aurora.",
  },
  mundelein: {
    dispensaries: "~2–3",
    tagline: "Lake County suburban market north of Chicago.",
  },
  ottawa: {
    dispensaries: "~2–3",
    tagline: "LaSalle County stop on the I-80 corridor.",
  },
  canton: {
    dispensaries: "~1–2",
    tagline: "Fulton County market near the Peoria metro.",
  },
  galesburg: {
    dispensaries: "~2–3",
    tagline: "Knox County hub in western Illinois.",
  },
  moline: {
    dispensaries: "~3–4",
    tagline: "Quad Cities anchor drawing Iowa cross-border traffic.",
  },
  "rock-island": {
    dispensaries: "~2–3",
    tagline: "Quad Cities market on the Mississippi River.",
  },
  sterling: {
    dispensaries: "~1–2",
    tagline: "Whiteside County option in northwestern IL.",
  },
  morris: {
    dispensaries: "~2–3",
    tagline: "Grundy County I-80 corridor stop.",
  },
  jacksonville: {
    dispensaries: "~1–2",
    tagline: "Morgan County market in western central Illinois.",
  },
  litchfield: {
    dispensaries: "~1–2",
    tagline: "I-55 corridor stop between Springfield and St. Louis.",
  },
};

export default function IllinoisHubPage() {
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
                Project Green
              </span>
              <span className="text-[11px] text-slate-400">
                Illinois Cannabis Directory
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
            Illinois · {YEAR} Cannabis Guide
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl md:text-4xl">
            Cannabis Dispensaries in{" "}
            <span className="bg-gradient-to-r from-[#7FE3C7] to-[#38bdf8] bg-clip-text text-transparent">
              Illinois
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
            Illinois legalized recreational cannabis on January 1, 2020 and has
            since grown to 271+ licensed dispensaries across 66+ cities.
            Statewide sales topped $1.5 billion in 2025. Browse our city-by-city
            guides below for local laws, dispensary info, first-timer tips, and
            pricing for every major market in the state.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-200 sm:flex sm:flex-wrap sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Licensed Dispensaries
              </div>
              <div className="text-lg font-semibold text-slate-50">271+</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Cities Covered
              </div>
              <div className="text-lg font-semibold text-slate-50">
                {ALL_ILLINOIS_CITIES.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                {YEAR} Sales
              </div>
              <div className="text-lg font-semibold text-slate-50">$1.5B+</div>
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
            {ALL_ILLINOIS_CITIES.map((city) => {
              const info = CITY_HIGHLIGHTS[city.slug];
              return (
                <Link
                  key={city.slug}
                  href={`/cannabis/illinois/${city.slug}`}
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
            Illinois Cannabis at a Glance
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
                IL residents: 30g flower, 5g concentrate, 500mg edibles per
                transaction. Non-residents get half. Must be 21+ with valid
                photo ID.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                Tax Structure
              </div>
              <p className="text-slate-300">
                State excise tax: 10% (≤35% THC), 20% (edibles), 25% (&gt;35%
                THC). Plus 6.25% state sales tax and local municipal taxes up to
                3%. Medical taxed at 1%.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                Consumption
              </div>
              <p className="text-slate-300">
                Public consumption is prohibited statewide. Private residences
                only — landlords may add further restrictions. No cannabis
                lounges yet in most cities.
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
              <span>Project Green · Illinois Cannabis Directory</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
              >
                Directory Network
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
