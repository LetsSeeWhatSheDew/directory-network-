import Link from "next/link";
import type { CityListing } from "@/lib/fetchCityListings";
import CityEmailCapture from "@/app/components/CityEmailCapture";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import HazeBand from "@/app/components/HazeBand";
import { MarkC } from "@/app/components/Logo";
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

/**
 * Rewrite the "how many dispensaries" FAQ answer with the live DB count.
 * Also strips any other FAQ entries whose answers contain hardcoded
 * dispensary counts that contradict the live count ("approximately N",
 * "N-N dispensaries", etc). Keeps the question/answer contract clean.
 */
function normalizeFaqs(
  faqs: CityFaq[],
  city: string,
  count: number
): CityFaq[] {
  const hasCountClaim = /approximately\s+[0-9–-]+|[0-9]+\s*[–-]\s*[0-9]+\s+(?:licensed\s+)?dispensar|approximately\s+[a-z]+\s+(?:licensed\s+)?dispensar/i;

  return faqs.map((faq) => {
    const q = faq.question.toLowerCase();
    if (q.includes("how many dispensaries")) {
      const noun = count === 1 ? "dispensary" : "dispensaries";
      return {
        question: faq.question,
        answer:
          count > 0
            ? `PuffPrice currently lists ${count} ${noun} in ${city}. This reflects PuffPrice's Central Illinois coverage — you can see every one in the directory above.`
            : `PuffPrice doesn't currently list any dispensaries in ${city}. Check the nearest-city suggestion or browse our full Central Illinois directory.`,
      };
    }
    // For any other FAQ that embeds a count claim we can't verify, strip
    // the count language but keep the surrounding answer intact.
    if (hasCountClaim.test(faq.answer)) {
      return {
        question: faq.question,
        answer: faq.answer
          .replace(/\b(?:approximately\s+)?[0-9]+\s*[–-]\s*[0-9]+\s+(licensed\s+)?dispensar(?:ies|y)/gi, "licensed dispensaries")
          .replace(/\bapproximately\s+[0-9]+\s+(licensed\s+)?dispensar(?:ies|y)/gi, "licensed dispensaries")
          .replace(/\bapproximately\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(licensed\s+)?dispensar(?:ies|y)/gi, "licensed dispensaries"),
      };
    }
    return faq;
  });
}

function buildJsonLd(
  config: CityConfig,
  listings: CityListing[]
) {
  const { city, state, slug, faqs } = config;
  const normalizedFaqs = normalizeFaqs(faqs, city, listings.length);

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: normalizedFaqs.map((faq) => ({
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
    "@id": `${BASE_URL}/dispensary/${l.slug || l.id}`,
    name: l.listing_title ?? l.listing_name,
    description: l.short_description ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: l.city ?? city,
      addressRegion: l.state ?? "IL",
      addressCountry: "US",
    },
    url: `${BASE_URL}/dispensary/${l.slug || l.id}`,
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

  // When we have live listings, replace the config's hardcoded
  // "Dispensaries: ~10" stat with the actual count. The config strings
  // are authored for long-term SEO copy but drift quickly; rendering
  // the truth at request time is the only way the card matches the
  // listing grid below it.
  const liveStats = listings.length > 0
    ? stats.map((s) =>
        /dispensar/i.test(s.label)
          ? { ...s, value: String(listings.length) }
          : s,
      )
    : stats;

  // Rewrite any hardcoded dispensary counts in FAQ answers to match the
  // live listing count. Same reason as liveStats: configs drift.
  const liveFaqs = normalizeFaqs(faqs, city, listings.length);

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

      {/* Breathe: CityEmailCapture ships its own dark styling; re-skin it
          onto the tokens from here so it reads on paper, day and night. */}
      <style>{CAPTURE_CSS}</style>

      <main className="min-h-screen text-(--pp-body)">
        {/* ---- Header / Nav ---- */}
        <div className="relative z-10">
          <Nav />
        </div>

        {/* ---- Breadcrumbs ---- */}
        <nav
          aria-label="Breadcrumb"
          className="relative z-10 border-b border-(--pp-border)"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-2 text-[11px] text-(--pp-muted)">
            <Link href="/" className="hover:text-(--pp-ink)">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/cannabis/illinois"
              className="hover:text-(--pp-ink)"
            >
              Illinois
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-(--pp-ink)">{city}</span>
          </div>
        </nav>

        {/* ============================================================ */}
        {/*  HERO SECTION                                                */}
        {/* ============================================================ */}
        <section className="relative z-10 border-b border-(--pp-border)">
          <HazeBand height={160} />
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:pb-16 md:pt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-(--pp-border) bg-(--pp-surface) px-3 py-1 text-[11px] font-medium text-(--pp-muted)">
              <span className="pp-breathe-dot" style={{ width: 6, height: 6 }} />
              {city}, {state} · Cannabis Guide
            </div>

            <h1 className="mt-5 text-3xl tracking-tight text-(--pp-ink) sm:text-4xl md:text-5xl">
              Dispensaries in{" "}
              <span>
                {city}, {state}
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-(--pp-body) md:text-base">
              {heroIntro}
            </p>

            {/* Quick-reference stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs sm:flex sm:flex-wrap sm:gap-4">
              {liveStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[14px] border border-(--pp-border) bg-(--pp-surface) px-3 py-2"
                >
                  <div className="text-[11px] uppercase tracking-wide text-(--pp-muted)">
                    {stat.label}
                  </div>
                  <div
                    className="text-lg font-semibold text-(--pp-ink)"
                    style={IS_NUMERIC.test(stat.value) ? MONO : undefined}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/get-listed" className={BTN_PRIMARY}>
                Claim your dispensary listing
              </Link>
              <a href="#laws" className={BTN_QUIET}>
                Local cannabis laws
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  DISPENSARY LISTINGS (dynamic from Supabase)                  */}
        {/* ============================================================ */}
        {listings.length > 0 && (
          <section className="relative z-10 border-b border-(--pp-border)">
            <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl tracking-tight text-(--pp-ink) md:text-3xl">
                    Dispensaries in {city}
                  </h2>
                  <p className="text-sm text-(--pp-muted)">
                    <span style={MONO}>{listings.length}</span> listing
                    {listings.length === 1 ? "" : "s"} — featured first.
                  </p>
                </div>
                <Link href="/get-listed" className={BTN_PRIMARY}>
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
                      href={`/dispensary/${listing.slug || listing.id}`}
                      className={`group flex flex-col p-4 text-xs text-(--pp-ink) hover:border-(--pp-border-2) ${CARD}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="line-clamp-1 text-sm font-semibold">
                            {name}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-(--pp-muted)">
                            {loc || "Location on file"}
                          </p>
                        </div>
                        {listing.is_featured && (
                          <span className="rounded-full border border-(--pp-best-border) bg-(--pp-best-tint) px-2 py-0.5 text-[10px] font-medium text-(--pp-mark)">
                            Featured
                          </span>
                        )}
                      </div>
                      {listing.short_description && (
                        <p className="mb-3 line-clamp-3 text-[11px] text-(--pp-body)">
                          {listing.short_description}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-1 text-[11px] text-(--pp-muted)">
                        <span>View profile</span>
                        <span className="group-hover:text-(--pp-mark)">→</span>
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
          <section className="relative z-10 border-b border-(--pp-border)">
            <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
              <div className="pp-haze rounded-[20px] px-4 py-10 text-center text-sm md:px-8">
                <p className="text-(--pp-body)">
                  We&apos;re building the {city} dispensary directory now.{" "}
                  <Link
                    href="/get-listed"
                    className="font-medium text-(--pp-mark) underline underline-offset-2"
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
        <section id="laws" className="relative z-10 border-b border-(--pp-border)">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h2 className="mb-2 text-2xl tracking-tight text-(--pp-ink) md:text-3xl">
              Cannabis Laws in {city}, {state}
            </h2>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-(--pp-body)">
              Illinois legalized recreational cannabis on January 1, 2020 under
              the Cannabis Regulation and Tax Act. {city} has opted in to allow
              both recreational and medical dispensary sales. Here&apos;s what
              you need to know before your visit.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {laws.map((law) => (
                <div key={law.title} className={`p-5 ${CARD}`}>
                  <div className="mb-2 text-[11px] font-semibold text-(--pp-mark)">
                    {law.title}
                  </div>
                  <p className="text-xs leading-relaxed text-(--pp-body) md:text-sm">
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
        <section className="relative z-10 border-b border-(--pp-border)">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h2 className="mb-2 text-2xl tracking-tight text-(--pp-ink) md:text-3xl">
              First Time at a {city} Dispensary?
            </h2>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-(--pp-body)">
              Walking into a dispensary for the first time can feel unfamiliar.
              Here&apos;s what a typical visit looks like in {city} so you know
              exactly what to expect.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {firstTimerSteps.map((step, i) => (
                <div key={step.title} className={`p-4 text-xs ${CARD}`}>
                  <div className="mb-2 text-[11px] font-semibold text-(--pp-mark)">
                    {String(i + 1).padStart(2, "0")} · {step.title}
                  </div>
                  <p className="text-(--pp-body)">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="pp-haze mt-6 rounded-[20px] p-5">
              <h3 className="mb-2 text-sm font-semibold text-(--pp-ink)">
                Average Price Ranges in {city}
              </h3>
              <p className="text-xs leading-relaxed text-(--pp-body) md:text-sm">
                {priceBlurb}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FAQ SECTION                                                 */}
        {/* ============================================================ */}
        <section className="relative z-10 border-b border-(--pp-border)">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h2 className="mb-2 text-2xl tracking-tight text-(--pp-ink) md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mb-6 text-sm text-(--pp-muted)">
              Common questions about cannabis in {city}, IL.
            </p>

            <div className="space-y-4">
              {liveFaqs.map((faq) => (
                <div key={faq.question} className={`p-5 ${CARD}`}>
                  <h3 className="mb-2 text-sm font-semibold text-(--pp-ink)">
                    {faq.question}
                  </h3>
                  <p className="text-xs leading-relaxed text-(--pp-body) md:text-sm">
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
        <section className="relative z-10 border-b border-(--pp-border)">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h2 className="mb-2 text-2xl tracking-tight text-(--pp-ink) md:text-3xl">
              Nearby Cities
            </h2>
            <p className="mb-6 text-sm text-(--pp-muted)">
              Browse dispensaries in nearby Illinois cities.
            </p>

            <div className="flex flex-wrap gap-2">
              {getNearbyCities(config.slug, 5).map((nearby) => (
                <Link
                  key={nearby.slug}
                  href={`/cannabis/illinois/${nearby.slug}`}
                  className={`px-3.5 py-1.5 ${CHIP}`}
                >
                  <span>{nearby.name}</span>
                  <span
                    className="ml-2 rounded-full bg-(--pp-best-tint) px-1.5 py-0.5 text-[10px] font-medium text-(--pp-mark)"
                    style={MONO}
                  >
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
        <section className="relative z-10 border-b border-(--pp-border)">
          <div className="cp-capture mx-auto max-w-xl px-4 py-10 md:py-14">
            <CityEmailCapture city={city} state={state} />
          </div>
        </section>

        {/* ============================================================ */}
        {/*  RELATED CITIES BAND  (true site footer follows below)       */}
        {/* ============================================================ */}
        <section className="relative z-10">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
            <div className="mb-4">
              <h2 className="text-xl tracking-tight text-(--pp-ink)">
                Explore Other Central Illinois Cities
              </h2>
              <p className="text-[11px] text-(--pp-muted)">
                Find dispensaries and cannabis info across the Central IL metro belt.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {relatedCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/cannabis/illinois/${c.slug}`}
                  className={`px-3 py-1 ${CHIP}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-(--pp-border) pt-5 text-[11px] text-(--pp-muted) md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <MarkC size={28} />
                <span>
                  PuffPrice · {city}, {state} Cannabis Guide
                </span>
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
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Breathe styling (tokens only — night mode flips them)              */
/* ------------------------------------------------------------------ */

const CARD =
  "rounded-[18px] border border-(--pp-border) bg-(--pp-surface)";
const CHIP =
  "inline-flex items-center rounded-full border border-(--pp-border) bg-(--pp-surface) text-[11px] text-(--pp-body) hover:border-(--pp-border-2) hover:text-(--pp-ink)";
const BTN_PRIMARY =
  "inline-flex min-h-[44px] items-center rounded-[14px] border border-(--pp-btn-border) bg-(--pp-btn) px-4 py-2 text-sm font-semibold text-(--pp-btn-fg) hover:brightness-[.97]";
const BTN_QUIET =
  "inline-flex min-h-[44px] items-center rounded-[14px] border border-(--pp-border-2) bg-transparent px-4 py-2 text-sm font-medium text-(--pp-ink) hover:bg-(--pp-surface)";
const FOOT_LINK =
  "text-(--pp-body) underline-offset-2 hover:text-(--pp-ink) hover:underline";

/** Prices and counts only get the mono face. */
const MONO = { fontFamily: "var(--font-mono)" } as const;
const IS_NUMERIC = /^[~$<>]?\d/;

const CAPTURE_CSS = `
.cp-capture > div { background: var(--pp-surface); border: 1px solid var(--pp-border); border-radius: 18px; }
.cp-capture > div.text-center { background: var(--pp-best-tint); border-color: var(--pp-best-border); }
.cp-capture .text-center > div:first-child { background: var(--pp-surface); color: var(--pp-mark); }
.cp-capture h3, .cp-capture .text-slate-100 { color: var(--pp-ink); }
.cp-capture .text-slate-400, .cp-capture .text-slate-500 { color: var(--pp-muted); }
.cp-capture input { background: var(--pp-paper); border: 1px solid var(--pp-border); border-radius: 14px; color: var(--pp-ink); min-height: 44px; }
.cp-capture input::placeholder { color: var(--pp-muted); }
.cp-capture input:focus { border-color: var(--pp-mark); --tw-ring-color: var(--pp-mark); }
.cp-capture button[type="submit"] { background: var(--pp-btn); color: var(--pp-btn-fg); border: 1px solid var(--pp-btn-border); border-radius: 14px; box-shadow: none; min-height: 44px; }
.cp-capture button[type="submit"]:hover { background: var(--pp-btn); filter: brightness(.97); }
.cp-capture .text-red-400 { color: var(--pp-stop-fg); }
`;
