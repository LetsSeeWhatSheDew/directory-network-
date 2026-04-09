import type { Metadata } from "next";
import Link from "next/link";
import { ALL_ILLINOIS_CITIES } from "@/config/cities/illinois/shared";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Illinois Cannabis Laws — Complete Guide (${YEAR})`,
  description: `Complete Illinois cannabis laws guide covering purchase limits, possession, consumption rules, taxes, medical programs, employment, housing, and home growing. Updated for ${YEAR}.`,
  openGraph: {
    title: `Illinois Cannabis Laws — Complete Reference (${YEAR})`,
    description: `Learn Illinois cannabis regulations: purchase and possession limits, taxes, medical programs, employment rights, and more.`,
    siteName: "Project Green",
    type: "website",
    locale: "en_US",
  },
};

export default function IllinoisLawsPage() {
  const faqs = [
    {
      question: "Can I grow cannabis at home in Illinois for recreational use?",
      answer:
        "No. Illinois does not permit recreational home cultivation. Only medical cannabis patients with a valid Illinois medical cannabis card can legally grow cannabis at home — and only up to 5 plants per patient (maximum 10 plants per household). Recreational cultivation is prohibited statewide.",
    },
    {
      question: "What is the Illinois medical cannabis program?",
      answer:
        "Illinois medical cannabis card holders enjoy higher purchase limits (60g flower per transaction vs. 30g for recreational users), lower taxes (1% state excise tax vs. 10-25% for recreational), and access to medical-only product categories. Qualifying conditions include chronic pain, PTSD, cancer, epilepsy, glaucoma, HIV/AIDS, Parkinson's disease, and others. Cards are issued by the Illinois Department of Financial and Professional Regulation (IDFPR).",
    },
    {
      question: "Can my employer fire me for using cannabis off-duty?",
      answer:
        "Illinois law provides some workplace protections. Employers cannot discipline or terminate employees for off-duty cannabis use that doesn't impair job performance or violate workplace conduct policies. However, employers can still test for cannabis and take action if an employee is impaired at work. Safety-sensitive positions may have stricter rules. Federal employees should be aware that federal law still prohibits cannabis use entirely.",
    },
    {
      question: "Can my landlord prohibit cannabis in my apartment?",
      answer:
        "Yes. While Illinois allows adult cannabis use, landlords can include cannabis prohibitions in lease agreements. Even if you rent in a city that allows sales, your lease may legally restrict or ban cannabis use on the property. Always check your lease or ask your landlord before consuming cannabis in a rental property.",
    },
    {
      question: "Can I be arrested for possessing cannabis in Illinois?",
      answer:
        "No, provided you comply with legal possession limits. Possessing up to 30 grams (about 1 ounce) of flower is legal for adults 21+. Exceeding legal limits or possessing cannabis while under the legal age remains a criminal offense. Public consumption is also illegal and can result in fines or other penalties.",
    },
    {
      question: "Is medical cannabis more affordable than recreational?",
      answer:
        "Yes. Medical patients pay only 1% state excise tax compared to 10-25% for recreational users. Combined with lower municipal taxes in some areas, medical cardholders often save 20-30% on their total purchase. The upfront cost of obtaining a medical card ($150-$250) is typically recouped within a few visits.",
    },
    {
      question: "Can I bring cannabis across state lines to or from Illinois?",
      answer:
        "No. Cannabis remains illegal under federal law and is prohibited across state lines. Even if you legally purchase cannabis in Illinois, transporting it to another state is a federal crime, regardless of that state's laws. Similarly, bringing cannabis into Illinois from another state is illegal.",
    },
    {
      question: "What happens if I'm caught with cannabis in a federal building or airport?",
      answer:
        "Federal law still prohibits cannabis entirely. Possessing cannabis in federal buildings, national forests, federal courthouses, airports, or on federal property is a federal crime. Even if you legally purchased the cannabis in Illinois, you cannot possess it in federal spaces. Violators face federal charges and potential imprisonment.",
    },
  ];

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
          <Link
            href="/cannabis/illinois"
            className="transition-colors hover:text-slate-200"
          >
            Illinois
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200">Laws</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 border-b border-white/5 bg-gradient-to-b from-black/60 via-[#020617] to-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Illinois Cannabis Law Guide
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl md:text-4xl">
            Illinois Cannabis Laws —{" "}
            <span className="bg-gradient-to-r from-[#7FE3C7] to-[#38bdf8] bg-clip-text text-transparent">
              Complete Guide
            </span>
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            Illinois legalized recreational cannabis on January 1, 2020 with the
            Cannabis Regulation and Tax Act. This guide covers everything you
            need to know about Illinois cannabis law: purchase limits, possession
            rules, taxes, medical programs, employment protections, and more.
          </p>
        </div>
      </section>

      {/* Purchase Limits */}
      <section className="relative z-10 border-b border-white/5 bg-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Purchase Limits — Residents vs. Non-Residents
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            Illinois has different limits depending on your residency status and
            the product type. Each transaction is capped independently, so you
            can make multiple purchases throughout the day.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Illinois Residents
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Flower:</strong> 30 grams per transaction
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Concentrate:</strong> 5 grams per transaction
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Edibles (THC):</strong> 500 mg per transaction
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Tinctures/Topicals:</strong> No limit per se, but
                    subject to total THC caps on infused products
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Non-Residents / Out-of-State Visitors
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Flower:</strong> 15 grams per transaction
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Concentrate:</strong> 2.5 grams per transaction
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Edibles (THC):</strong> 250 mg per transaction
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Tinctures/Topicals:</strong> Half the resident limit
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs leading-relaxed text-slate-300 md:text-sm">
              <strong className="text-slate-100">Important:</strong> You can
              visit multiple dispensaries in a single day, but each transaction
              is governed independently by these limits. A valid government-issued
              photo ID proving you are 21 or older is required for all purchases.
              Medical cannabis cardholders enjoy double the purchase limits for
              medical-only products.
            </p>
          </div>
        </div>
      </section>

      {/* Possession Limits */}
      <section className="relative z-10 border-b border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Possession Limits — What You Can Carry
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            Illinois law distinguishes between what you can purchase in one
            transaction and what you can legally possess at any given time.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                At Home (Residential)
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>No legal limit</strong> on amount of cannabis you can
                    possess in your private residence, provided it was legally
                    purchased
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    Cannabis must be kept secure and out of reach of minors and
                    pets
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    Landlords may impose stricter limits or prohibitions in lease
                    agreements
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                In Public / While Traveling
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>30 grams</strong> (residents) or <strong>15 grams</strong> (non-residents) of flower while in
                    a vehicle or traveling
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    Must be stored in a sealed, odor-proof, child-resistant
                    container in the trunk or a locked compartment — not
                    accessible to the driver
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    Open containers in vehicles carry the same penalties as open
                    alcohol
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Consumption Rules */}
      <section className="relative z-10 border-b border-white/5 bg-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Consumption Rules — Where You Can and Cannot Use
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            Illinois prohibits public consumption of cannabis. Violations can
            result in fines of $50–$200 or other penalties depending on
            circumstances and jurisdiction.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Legal Consumption Locations
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Private residences (subject to lease restrictions)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Private property with owner consent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Cannabis lounges (if available in your municipality)</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Prohibited Consumption Locations
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Any public space (streets, parks, sidewalks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Within 1,000 feet of schools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Vehicles (as driver or passenger)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Workplaces (with limited exceptions)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Federal property or federal buildings</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tax Breakdown */}
      <section className="relative z-10 border-b border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Tax Breakdown — Excise Tax, Sales Tax, and Municipal Tax
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            Cannabis purchases in Illinois are subject to multiple tax layers.
            The final price you pay can be 20-35% higher than the listed menu
            price depending on the product type and municipality.
          </p>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                State Excise Tax (Tiered by THC Content)
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <strong className="text-slate-100">10%</strong> — Products with
                  ≤35% THC (most flower)
                </p>
                <p>
                  <strong className="text-slate-100">20%</strong> — Edibles and
                  infused products
                </p>
                <p>
                  <strong className="text-slate-100">25%</strong> — Products with
                  &gt;35% THC (premium flower, high-potency concentrates)
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                State & Local Sales Tax
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <strong className="text-slate-100">6.25%</strong> — State sales
                  tax (applied to base price + excise tax)
                </p>
                <p>
                  <strong className="text-slate-100">0-3%</strong> — Municipal tax
                  varies by city (most cities cap at 3%)
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Medical Cannabis Tax Reduction
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <strong className="text-slate-100">1%</strong> — State excise
                  tax for medical cardholders (vs. 10-25% for recreational)
                </p>
                <p>
                  Medical patients typically save <strong>20-30%</strong> on total
                  purchase cost compared to recreational buyers.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs leading-relaxed text-slate-300 md:text-sm">
              <strong className="text-slate-100">Example:</strong> A $50 eighth of
              flower with 25% THC would cost approximately $68-$70 after taxes at
              a 3% municipal tax rate (50 × 1.25 excise × 1.0925 sales & municipal
              = ~$68).
            </p>
          </div>
        </div>
      </section>

      {/* Medical Cannabis Program */}
      <section className="relative z-10 border-b border-white/5 bg-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Illinois Medical Cannabis Program
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            Patients with qualifying medical conditions can obtain an Illinois
            medical cannabis card and access lower taxes, higher purchase limits,
            and medical-only product categories.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                How to Get a Medical Card
              </div>
              <ol className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#7FE3C7]">1.</span>
                  <span>
                    Consult with a licensed Illinois physician (in-person or
                    telemedicine)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#7FE3C7]">2.</span>
                  <span>
                    Physician certifies your qualifying condition in the state
                    registry
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#7FE3C7]">3.</span>
                  <span>
                    Apply through the IDFPR (Illinois Department of Financial and
                    Professional Regulation)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#7FE3C7]">4.</span>
                  <span>
                    Pay application fee (typically $150–$250) and receive your
                    digital or physical card
                  </span>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Qualifying Conditions
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Chronic or intractable pain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>PTSD (Post-Traumatic Stress Disorder)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Cancer, epilepsy, glaucoma</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>HIV/AIDS, Parkinson's disease</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>Arthritis, fibromyalgia, and others</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-100">
              Medical vs. Recreational Benefits Comparison
            </h3>
            <div className="grid gap-3 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Purchase Limit (Flower)</span>
                <span>
                  <span className="text-[#7FE3C7]">60g</span> (med) vs.{" "}
                  <span>30g</span> (rec)
                </span>
              </div>
              <div className="flex justify-between">
                <span>State Excise Tax</span>
                <span>
                  <span className="text-[#7FE3C7]">1%</span> (med) vs.{" "}
                  <span>10-25%</span> (rec)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Home Cultivation</span>
                <span>
                  <span className="text-[#7FE3C7]">Yes (5 plants)</span> (med)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Typical Savings</span>
                <span>
                  <span className="text-[#7FE3C7]">20-30%</span> (med)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employment & Housing */}
      <section className="relative z-10 border-b border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Employment & Housing Rights
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            Illinois provides certain workplace and housing protections for
            cannabis users, though these are not absolute and have important
            exceptions.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Workplace Protections
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Off-duty use:</strong> Employers cannot discipline
                    employees for legal, off-duty cannabis use
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>No impairment:</strong> Must comply with reasonable
                    employer conduct policies
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Medical patients:</strong> Additional protections and
                    reasonable accommodations may apply
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>IMPORTANT:</strong> Federal employees, transportation
                    workers, and others in regulated industries are still subject
                    to federal prohibition
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Housing Rights & Restrictions
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Landlord authority:</strong> Landlords can impose
                    cannabis prohibitions in lease agreements
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>HOA & condos:</strong> Home owner associations may
                    restrict or prohibit cannabis
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Private property:</strong> Owners can prohibit growing
                    or consuming on their property
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Check your lease:</strong> Always review lease terms
                    before consuming cannabis in a rental
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Home Growing */}
      <section className="relative z-10 border-b border-white/5 bg-[#020617]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Growing Cannabis at Home
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-300">
            Home cultivation in Illinois is restricted to medical patients only.
            Recreational home growing is not permitted under any circumstances.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Medical Patient Cultivation
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>5 plants per patient</strong> maximum (10 per
                    household if multiple cardholders)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Private residence only:</strong> Must be grown
                    indoors or in secured area
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Secured/locked:</strong> Must be inaccessible to
                    minors and the public
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-[#7FE3C7]">•</span>
                  <span>
                    <strong>Landlord consent:</strong> Landlord may still
                    prohibit growing even if legally entitled
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 text-sm font-semibold text-[#7FE3C7]">
                Recreational Cultivation (NOT Permitted)
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-red-400">•</span>
                  <span>
                    <strong>Illegal:</strong> No home growing for recreational
                    use in Illinois under any circumstances
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-red-400">•</span>
                  <span>
                    <strong>Penalties:</strong> Possession of plants without a
                    medical card is a criminal offense
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-red-400">•</span>
                  <span>
                    <strong>Felony potential:</strong> Growing 20+ plants can
                    result in felony charges
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-red-400">•</span>
                  <span>
                    <strong>Only option:</strong> Buy from legal dispensaries
                    instead
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 border-b border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-100 md:text-xl">
            Frequently Asked Questions
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Common legal questions about cannabis in Illinois.
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

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
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
              }),
            }}
          />
        </div>
      </section>

      {/* Footer - City links */}
      <footer className="relative z-10 border-t border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="mb-6">
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">
              Find Dispensaries by City
            </h2>
            <p className="text-[11px] text-slate-400">
              Browse city-specific cannabis guides across Illinois.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_ILLINOIS_CITIES.slice(0, 12).map((c) => (
              <Link
                key={c.slug}
                href={`/cannabis/illinois/${c.slug}`}
                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 transition-colors hover:border-[#7FE3C7]/60 hover:bg-slate-800 hover:text-slate-50"
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="mt-6 border-t border-white/5 pt-6 text-[11px] text-slate-500">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7FE3C7]/10 text-[10px] font-semibold text-[#7FE3C7]">
                  PG
                </div>
                <span>Project Green · Illinois Cannabis Laws Guide</span>
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
                  href="/cannabis/illinois"
                  className="text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
                >
                  Illinois Hub
                </Link>
                <span className="hidden text-slate-600 md:inline">·</span>
                <Link
                  href="/grow"
                  className="text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
                >
                  All Listings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
