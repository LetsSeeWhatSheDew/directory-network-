import type { Metadata } from "next";
import Link from "next/link";
import HazeBand from "@/app/components/HazeBand";
import { MarkC } from "@/app/components/Logo";
import { ALL_MISSOURI_CITIES } from "@/config/cities/missouri/shared";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Cannabis Dispensaries in Missouri — City-by-City Guide (${YEAR})`,
  description: `Browse licensed cannabis dispensaries across Missouri. City guides for St. Louis, Kansas City, Springfield, and more — laws, tips, and local info updated for ${YEAR}.`,
  openGraph: {
    title: `Missouri Cannabis Dispensary Guide (${YEAR})`,
    description: `Find dispensaries in every major Missouri city. Local laws, first-timer tips, pricing, and curated directory listings.`,
    siteName: "PuffPrice",
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
    <main className="min-h-screen text-(--pp-body)">
      {/* Header */}
      <header className="relative z-10 border-b border-(--pp-border)">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <Link href="/" className="flex items-center gap-2">
            <MarkC size={36} />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-(--pp-ink)">
                PuffPrice
              </span>
              <span className="text-[11px] text-(--pp-muted)">
                Missouri Cannabis Directory
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 text-xs">
            <Link
              href="/grow"
              className="hidden text-(--pp-body) hover:text-(--pp-ink) md:inline"
            >
              All Listings
            </Link>
            <Link href="/get-listed" className={`px-3.5 py-1.5 text-[11px] ${BTN_PRIMARY}`}>
              Get listed
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 border-b border-(--pp-border)">
        <HazeBand height={160} />
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:pb-16 md:pt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--pp-border) bg-(--pp-surface) px-3 py-1 text-[11px] font-medium text-(--pp-muted)">
            <span className="pp-breathe-dot" style={{ width: 6, height: 6 }} />
            Missouri · {YEAR} Cannabis Guide
          </div>

          <h1 className="mt-5 text-3xl tracking-tight text-(--pp-ink) sm:text-4xl md:text-5xl">
            Cannabis Dispensaries in <span>Missouri</span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-(--pp-body) md:text-base">
            Missouri legalized recreational cannabis via Amendment 3 in February 2023 and has since grown to 100+ licensed dispensaries across 10+ major cities. With significantly lower excise taxes than neighboring states and a rapidly expanding retail footprint, Missouri has become a regional cannabis destination. Browse our city-by-city guides below for local laws, dispensary info, first-timer tips, and pricing for every major market in the state.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs sm:flex sm:flex-wrap sm:gap-4">
            <div className={STAT}>
              <div className="text-[11px] uppercase tracking-wide text-(--pp-muted)">
                Licensed Dispensaries
              </div>
              <div className="text-lg font-semibold text-(--pp-ink)" style={MONO}>100+</div>
            </div>
            <div className={STAT}>
              <div className="text-[11px] uppercase tracking-wide text-(--pp-muted)">
                Cities Covered
              </div>
              <div className="text-lg font-semibold text-(--pp-ink)" style={MONO}>
                {ALL_MISSOURI_CITIES.length}
              </div>
            </div>
            <div className={STAT}>
              <div className="text-[11px] uppercase tracking-wide text-(--pp-muted)">
                Excise Tax
              </div>
              <div className="text-lg font-semibold text-(--pp-ink)" style={MONO}>6%</div>
            </div>
          </div>
        </div>
      </section>

      {/* City Grid */}
      <section className="relative z-10 border-b border-(--pp-border)">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-2xl tracking-tight text-(--pp-ink) md:text-3xl">
            Browse by City
          </h2>
          <p className="mb-6 text-sm text-(--pp-muted)">
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
                  className={`group flex flex-col p-5 text-xs hover:border-(--pp-border-2) ${CARD}`}
                >
                  <h3 className="text-sm font-semibold text-(--pp-ink)">
                    {city.name}
                  </h3>
                  {info && (
                    <>
                      <p className="mt-1 text-[11px] text-(--pp-muted)">
                        <span style={MONO}>{info.dispensaries}</span> dispensaries
                      </p>
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-(--pp-body)">
                        {info.tagline}
                      </p>
                    </>
                  )}
                  <div className="mt-3 flex items-center justify-between pt-1 text-[11px] text-(--pp-muted)">
                    <span>View city guide</span>
                    <span className="group-hover:text-(--pp-mark)">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick statewide info */}
      <section className="relative z-10 border-b border-(--pp-border)">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-2xl tracking-tight text-(--pp-ink) md:text-3xl">
            Missouri Cannabis at a Glance
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-(--pp-body)">
            Quick-reference rules that apply statewide, regardless of which city
            you visit.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={`p-4 text-xs ${CARD}`}>
              <div className="mb-2 text-[11px] font-semibold text-(--pp-mark)">
                Purchase Limits
              </div>
              <p className="text-(--pp-body)">
                All visitors: 3oz flower, 8g concentrate, 24oz edibles, 6oz
                liquid per transaction. Must be 21+ with valid photo ID.
                Medical patients get higher limits with valid card.
              </p>
            </div>
            <div className={`p-4 text-xs ${CARD}`}>
              <div className="mb-2 text-[11px] font-semibold text-(--pp-mark)">
                Tax Structure
              </div>
              <p className="text-(--pp-body)">
                State excise tax: 6% (recreational). Plus state and local sales
                taxes varying by city (typically 8–9% combined). Medical taxed
                at reduced rate. Much lower than Illinois or surrounding states.
              </p>
            </div>
            <div className={`p-4 text-xs ${CARD}`}>
              <div className="mb-2 text-[11px] font-semibold text-(--pp-mark)">
                Consumption
              </div>
              <p className="text-(--pp-body)">
                Public consumption is prohibited statewide. Private residences
                only where owner consents. Landlords may add restrictions. No
                cannabis lounges or social consumption venues yet in Missouri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-3 text-[11px] text-(--pp-muted) md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <MarkC size={28} />
              <span>PuffPrice · Missouri Cannabis Directory</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className={FOOT_LINK}>
                PuffPrice
              </Link>
              <span className="hidden md:inline" aria-hidden="true">·</span>
              <Link href="/grow" className={FOOT_LINK}>
                All Listings
              </Link>
              <span className="hidden md:inline" aria-hidden="true">·</span>
              <Link href="/get-listed" className={FOOT_LINK}>
                Get Listed
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* Breathe styling — tokens only, so night mode flips with the rest of the site. */
const CARD = "rounded-[18px] border border-(--pp-border) bg-(--pp-surface)";
const STAT = "rounded-[14px] border border-(--pp-border) bg-(--pp-surface) px-3 py-2";
const BTN_PRIMARY =
  "inline-flex items-center rounded-full border border-(--pp-btn-border) bg-(--pp-btn) font-semibold text-(--pp-btn-fg) hover:brightness-[.97]";
const FOOT_LINK =
  "text-(--pp-body) underline-offset-2 hover:text-(--pp-ink) hover:underline";
/** Prices and counts only get the mono face. */
const MONO = { fontFamily: "var(--font-mono)" } as const;
