import type { Metadata } from "next";
import Link from "next/link";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Cannabis Dispensary Guides by State (${YEAR})`,
  description: `Browse cannabis dispensary guides for Illinois, Missouri, and more. Find local laws, dispensary information, pricing, and state-specific cannabis regulations.`,
  openGraph: {
    title: `Cannabis Dispensary Guides by State`,
    description: `State-by-state cannabis guides covering legalization status, local laws, dispensary directories, and regulatory info.`,
    siteName: "CleanList",
    type: "website",
    locale: "en_US",
  },
};

export default function CannabisCentralHub() {
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
                Cannabis CleanList
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

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="relative z-10 border-b border-white/5 bg-black/20"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-2 text-[11px] text-slate-400">
          <Link href="/" className="transition-colors hover:text-slate-200">
            Home
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200">Cannabis</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 border-b border-white/5 bg-gradient-to-b from-black/60 via-[#020617] to-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Cannabis Guides by State
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl md:text-4xl">
            Cannabis Dispensary Guides{" "}
            <span className="bg-gradient-to-r from-[#7FE3C7] to-[#38bdf8] bg-clip-text text-transparent">
              by State
            </span>
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            CleanList is building comprehensive cannabis guides for every
            state with legal cannabis sales. Each state guide covers local
            regulations, dispensary directories, first-timer tips, and current
            market information. Start with a state below, or{" "}
            <Link
              href="/cannabis/illinois"
              className="font-medium text-[#7FE3C7] hover:underline"
            >
              explore Illinois
            </Link>{" "}
            to see the full experience.
          </p>
        </div>
      </section>

      {/* States Grid */}
      <section className="relative z-10 border-b border-white/5 bg-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Available State Guides
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Click on a state to explore city-by-city dispensary info, local
            cannabis laws, and first-timer guides.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Illinois - Live */}
            <Link
              href="/cannabis/illinois"
              className="group flex flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-xs shadow-sm transition hover:border-[#7FE3C7]/60 hover:bg-slate-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">
                  Illinois
                </h3>
                <span className="rounded-full bg-[#7FE3C7]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#7FE3C7]">
                  LIVE
                </span>
              </div>

              <div className="mb-4 space-y-1 text-[11px] text-slate-400">
                <p>
                  <span className="text-[#7FE3C7]">35 cities</span> covered
                </p>
                <p>
                  <span className="text-[#7FE3C7]">10 neighborhoods</span> in
                  Chicago
                </p>
                <p>
                  <span className="text-[#7FE3C7]">271+</span> licensed
                  dispensaries
                </p>
              </div>

              <p className="mb-4 flex-1 text-xs leading-relaxed text-slate-300">
                Illinois legalized recreational cannabis on January 1, 2020.
                Browse city guides, local laws, dispensary listings, pricing, and
                first-timer tips for every major market in the state. Over $1.5B
                in annual sales across the state.
              </p>

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                <span>Browse Illinois</span>
                <span className="text-slate-500 group-hover:text-[#7FE3C7]">
                  →
                </span>
              </div>
            </Link>

            {/* Missouri - Coming Soon */}
            <div className="group relative flex flex-col rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-xs shadow-sm opacity-60">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">
                  Missouri
                </h3>
                <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
                  COMING SOON
                </span>
              </div>

              <div className="mb-4 space-y-1 text-[11px] text-slate-500">
                <p>Comprehensive city guides</p>
                <p>Local cannabis laws & regulations</p>
                <p>Dispensary directories & info</p>
              </div>

              <p className="mb-4 flex-1 text-xs leading-relaxed text-slate-400">
                We're building Missouri's complete cannabis guide. Check back
                soon for city-by-city dispensary info, local regulations, and
                more.
              </p>

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                <span>Coming in 2026</span>
                <span>→</span>
              </div>
            </div>
          </div>

          {/* Placeholder for future states */}
          <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950/40 px-6 py-8 text-center">
            <h3 className="text-sm font-semibold text-slate-300">
              More States Coming
            </h3>
            <p className="mt-2 text-xs text-slate-400">
              We're expanding to additional states. Subscribe for updates on
              California, Colorado, Massachusetts, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Statewide Overview */}
      <section className="relative z-10 border-b border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Cannabis Legalization Status
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            A quick snapshot of recreational cannabis legalization in the states
            where CleanList operates guides.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#7FE3C7]" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Illinois
                </h3>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <strong>Legal Date:</strong> January 1, 2020
                </p>
                <p>
                  <strong>Status:</strong> Fully legal for adults 21+ with valid
                  ID
                </p>
                <p>
                  <strong>Medical Program:</strong> Available with qualifying
                  condition
                </p>
                <p>
                  <strong>Home Cultivation:</strong> Legal for medical patients
                  only (5 plants max)
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-700" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Missouri
                </h3>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <strong>Legal Date:</strong> February 3, 2020
                </p>
                <p>
                  <strong>Status:</strong> Medical only (adult-use pending)
                </p>
                <p>
                  <strong>Medical Program:</strong> Fully operational with 500+
                  dispensaries
                </p>
                <p>
                  <strong>Adult-Use:</strong> Ballot initiatives under
                  consideration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's in Each Guide */}
      <section className="relative z-10 border-b border-white/5 bg-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            What's in Each State Guide
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Every state guide includes comprehensive information to help you
            navigate cannabis shopping, regulations, and local markets.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <div className="mb-2 text-sm font-semibold text-[#7FE3C7]">
                City Guides
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Browse city-by-city dispensary directories with local cannabis
                laws, first-timer tips, pricing, and dispensary info.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <div className="mb-2 text-sm font-semibold text-[#7FE3C7]">
                Local Laws
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Detailed state and municipal regulations covering purchase
                limits, taxes, consumption rules, and more.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <div className="mb-2 text-sm font-semibold text-[#7FE3C7]">
                First-Timer Guides
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Step-by-step walkthrough of what to expect on your first
                dispensary visit, what products are available, and pricing.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <div className="mb-2 text-sm font-semibold text-[#7FE3C7]">
                Dispensary Listings
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Up-to-date listings of licensed dispensaries in every covered
                city with profiles and menus.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <div className="mb-2 text-sm font-semibold text-[#7FE3C7]">
                Tax Breakdowns
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Understand how much you'll actually pay: excise taxes, sales
                taxes, municipal taxes, and product pricing.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <div className="mb-2 text-sm font-semibold text-[#7FE3C7]">
                FAQs & Support
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Answers to common questions about legality, medical cards, home
                growing, employment, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="relative z-10 border-b border-white/5 bg-black">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-950/40 p-6 md:p-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-100">
              Get Your Dispensary Listed
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-300">
              If you operate a cannabis dispensary or are a dispensary owner,
              CleanList can help you reach new customers across Illinois and
              beyond. Get listed, manage your profile, and connect with
              cannabis shoppers in your area.
            </p>
            <Link
              href="/get-listed"
              className="inline-flex items-center rounded-full bg-[#7FE3C7] px-5 py-2.5 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#6ad3b7]"
            >
              Get your dispensary listed
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <div className="mb-6">
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">
              Popular Guides
            </h2>
            <p className="text-[11px] text-slate-400">
              Start exploring cannabis information by state.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/cannabis/illinois"
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-[11px] text-slate-300 transition-colors hover:border-[#7FE3C7]/60 hover:bg-slate-800 hover:text-slate-50"
            >
              Illinois Dispensaries
            </Link>
            <Link
              href="/cannabis/illinois/laws"
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-[11px] text-slate-300 transition-colors hover:border-[#7FE3C7]/60 hover:bg-slate-800 hover:text-slate-50"
            >
              Illinois Cannabis Laws
            </Link>
            <Link
              href="/cannabis/illinois/chicago"
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-[11px] text-slate-300 transition-colors hover:border-[#7FE3C7]/60 hover:bg-slate-800 hover:text-slate-50"
            >
              Chicago Dispensaries
            </Link>
          </div>

          <div className="border-t border-white/5 pt-6 text-[11px] text-slate-500">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7FE3C7]/10 text-[10px] font-semibold text-[#7FE3C7]">
                  PG
                </div>
                <span>CleanList · Cannabis CleanList</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
                >
                  Home
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
        </div>
      </footer>
    </main>
  );
}
