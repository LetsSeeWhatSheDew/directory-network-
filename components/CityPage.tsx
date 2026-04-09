import Link from "next/link";
import type { CityListing } from "@/lib/fetchCityListings";
import CityEmailCapture from "@/app/components/CityEmailCapture";
import { getNearbyCities } from "@/config/cities/illinois/geo";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CityFaq {
  question: string;
  answer: string;
}

export interface CityConfig {
  /** City display name — e.g. "Peoria" */
  city: string;
  /** State display name — e.g. "Illinois" */
  state: string;
  /** URL-safe slug — e.g. "peoria" */
  slug: string;
  /** Short hero paragraph (2-4 sentences) */
  heroIntro: string;
  /** Quick-reference stats shown below the hero */
  stats: { label: string; value: string }[];
  /** Cannabis-law cards (title + body) */
  laws: { title: string; body: string }[];
  /** First-timer walkthrough steps (title + body) */
  firstTimerSteps: { title: string; body: string }[];
  /** Average price range blurb shown after the steps */
  priceBlurb: string;
  /** FAQ items — also used for JSON-LD */
  faqs: CityFaq[];
  /** Neighboring / related Illinois cities for footer links */
  relatedCities: { name: string; slug: string }[];
}

/* ------------------------------------------------------------------ */
/*  JSON-LD helper                                                     */
/* ------------------------------------------------------------------ */

const BASE_URL = "https://projectgreen.com";

function buildJsonLd(
  config: CityConfig,
  listings: CityListing[]
) {
  const { city, state, slug, faqs } = config;

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Illinois",
        item: `${BASE_URL}/cannabis/illinois`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${city} Dispensaries`,
        item: `${BASE_URL}/cannabis/illinois/${slug}`,
      },
    ],
  };

  const localBusinesses = listings.map((l) => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/l/${l.id}`,
    name: l.listing_title ?? l.listing_name,
    description: l.short_description ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: l.city ?? city,
      addressRegion: l.state ?? "IL",
      addressCountry: "US",
    },
    url: `${BASE_URL}/l/${l.id}`,
    isAccessibleForFree: true,
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Debit Card",
    areaServed: {
      "@type": "City",
      name: city,
      containedInPlace: {
        "@type": "State",
        name: state,
      },
    },
  }));

  return [faqPage, breadcrumb, ...localBusinesses];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  config: CityConfig;
  listings?: CityListing[];
}

export default function CityPage({ config, listings = [] }: Props) {
  const {
    city,
    state,
    stats,
    heroIntro,
    laws,
    firstTimerSteps,
    priceBlurb,
    faqs,
    relatedCities,
  } = config;

  const jsonLdBlocks = buildJsonLd(config, listings);

  return (
    <>
      {/* JSON-LD structured data */}
      {jsonLdBlocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <main className="min-h-screen bg-[#030712] text-slate-50">
        {/* ---- Top gradient halo ---- */}
        <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-[#2D1B69] via-[#030712] to-transparent opacity-80" />

        {/* ---- Header / Nav ---- */}
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
                  {state} Cannabis Directory
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

        {/* ---- Breadcrumbs ---- */}
        <nav
          aria-label="Breadcrumb"
          className="relative z-10 border-b border-white/5 bg-black/20"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-2 text-[11px] text-slate-400">
            <Link
              href="/"
              className="transition-colors hover:text-slate-200"
            >
              Home
            </Link>
            <span className="text-slate-600">/</span>
            <Link
              href="/cannabis/illinois"
              className="transition-colors hover:text-slate-200"
            >
              Illinois
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200">{city}</span>
          </div>
        </nav>

        {/* ============================================================ */}
        {/*  HERO SECTION                                                */}
        {/* ============================================================ */}
        <section className="relative z-10 border-b border-white/5 bg-gradient-to-b from-black/60 via-[#020617] to-[#020617]">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              {city}, {state} · Cannabis Guide
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl md:text-4xl">
              Dispensaries in{" "}
              <span className="bg-gradient-to-r from-[#7FE3C7] to-[#38bdf8] bg-clip-text text-transparent">
                {city}, {state}
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
              {heroIntro}
            </p>

            {/* Quick-reference stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-200 sm:flex sm:flex-wrap sm:gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {stat.label}
                  </div>
                  <div className="text-lg font-semibold text-slate-50">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/get-listed"
                className="inline-flex items-center rounded-full bg-[#7FE3C7] px-4 py-2 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#6ad3b7]"
              >
                Claim your dispensary listing
              </Link>
              <a
                href="#laws"
                className="inline-flex items-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-[11px] font-medium text-slate-200 hover:border-white/40 hover:bg-white/5"
              >
                Local cannabis laws
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  DISPENSARY LISTINGS (dynamic from Supabase)                  */}
        {/* ============================================================ */}
        {listings.length > 0 && (
          <section className="relative z-10 border-b border-white/5 bg-[#020617]">
            <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
                    Dispensaries in {city}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {listings.length} listing{listings.length === 1 ? "" : "s"}{" "}
                    — featured first.
                  </p>
                </div>
                <Link
                  href="/get-listed"
                  className="inline-flex items-center rounded-full bg-[#7FE3C7] px-4 py-2 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#6ad3b7]"
                >
                  Add your dispensary
                </Link>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => {
                  const name =
                    listing.listing_title ?? listing.listing_name ?? "Unnamed";
                  const loc = [listing.city, listing.state]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <Link
                      key={listing.id}
                      href={`/l/${listing.id}`}
                      className="group flex flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-100 shadow-sm transition hover:border-[#7FE3C7]/60 hover:bg-slate-900"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="line-clamp-1 text-sm font-semibold">
                            {name}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {loc || "Location on file"}
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
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Empty state — no listings yet */}
        {listings.length === 0 && (
          <section className="relative z-10 border-b border-white/5 bg-[#020617]">
            <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-10 text-center text-sm text-slate-400 md:px-8">
                <p>
                  We&apos;re building the {city} dispensary directory now.{" "}
                  <Link
                    href="/get-listed"
                    className="font-medium text-[#7FE3C7] underline-offset-2 hover:underline"
                  >
                    Claim your listing
                  </Link>{" "}
                  to be one of the first featured.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/*  LOCAL CANNABIS LAWS                                          */}
        {/* ============================================================ */}
        <section
          id="laws"
          className="relative z-10 border-b border-white/5 bg-[#020617]"
        >
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
              Cannabis Laws in {city}, {state}
            </h2>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
              Illinois legalized recreational cannabis on January 1, 2020 under
              the Cannabis Regulation and Tax Act. {city} has opted in to allow
              both recreational and medical dispensary sales. Here&apos;s what
              you need to know before your visit.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {laws.map((law) => (
                <div
                  key={law.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 p-5"
                >
                  <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                    {law.title}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300 md:text-sm">
                    {law.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FIRST-TIMER GUIDE                                           */}
        {/* ============================================================ */}
        <section className="relative z-10 border-b border-white/5 bg-black">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
              First Time at a {city} Dispensary?
            </h2>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
              Walking into a dispensary for the first time can feel unfamiliar.
              Here&apos;s what a typical visit looks like in {city} so you know
              exactly what to expect.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {firstTimerSteps.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200"
                >
                  <div className="mb-2 text-[11px] font-semibold text-[#7FE3C7]">
                    {String(i + 1).padStart(2, "0")} · {step.title}
                  </div>
                  <p className="text-slate-300">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-100">
                Average Price Ranges in {city}
              </h3>
              <p className="text-xs leading-relaxed text-slate-300 md:text-sm">
                {priceBlurb}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FAQ SECTION                                                 */}
        {/* ============================================================ */}
        <section className="relative z-10 border-b border-white/5 bg-[#020617]">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
              Frequently Asked Questions
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Common questions about cannabis in {city}, IL.
            </p>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 p-5"
                >
                  <h3 className="mb-2 text-sm font-semibold text-slate-100">
                    {faq.question}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300 md:text-sm">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  NEARBY CITIES                                               */}
        {/* ============================================================ */}
        <section className="relative z-10 border-b border-white/5 bg-black">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
              Nearby Cities
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Browse dispensaries in nearby Illinois cities.
            </p>

            <div className="flex flex-wrap gap-2">
              {getNearbyCities(config.slug, 5).map((nearby) => (
                <Link
                  key={nearby.slug}
                  href={`/cannabis/illinois/${nearby.slug}`}
                  className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-[#7FE3C7]/60 hover:bg-slate-800 hover:text-slate-50"
                >
                  <span>{nearby.name}</span>
                  <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-[#7FE3C7]">
                    {nearby.distanceMi} mi
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  EMAIL CAPTURE                                               */}
        {/* ============================================================ */}
        <section className="relative z-10 border-b border-white/5 bg-[#020617]">
          <div className="mx-auto max-w-xl px-4 py-10 md:py-14">
            <CityEmailCapture city={city} state={state} />
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FOOTER                                                      */}
        {/* ============================================================ */}
        <footer className="relative z-10 border-t border-white/5 bg-black">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
            <div className="mb-4">
              <h2 className="text-sm font-semibold tracking-tight text-slate-100">
                Explore Other Illinois Cities
              </h2>
              <p className="text-[11px] text-slate-400">
                Find dispensaries and cannabis info across the state.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {relatedCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/cannabis/illinois/${c.slug}`}
                  className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 transition-colors hover:border-[#7FE3C7]/60 hover:bg-slate-800 hover:text-slate-50"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-5 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7FE3C7]/10 text-[10px] font-semibold text-[#7FE3C7]">
                  PG
                </div>
                <span>
                  Project Green · {city}, {state} Cannabis Guide
                </span>
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
    </>
  );
}
