// app/upgrade/page.tsx — v2: single $0.99 PRO tier, Featured removed.
// CTA uses NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL (Stripe Payment Link).
// Fallback: mailto — so page never looks broken before env var is set.

import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Go Pro — $0.99/mo | PuffPrice",
  description:
    "Instant SMS when cannabis deals drop near you in Illinois. $0.99 a month. Cancel anytime.",
  alternates: { canonical: "https://www.puffprice.com/upgrade" },
  openGraph: {
    title: "PuffPrice Pro — $0.99/mo",
    description:
      "Never miss a deal. Instant SMS the moment prices drop near you in Illinois.",
    url: "https://www.puffprice.com/upgrade",
    siteName: "PuffPrice",
    type: "website",
    images: [{ url: "https://www.puffprice.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PuffPrice Pro — $0.99/mo",
    description:
      "Never miss a deal. Instant SMS the moment prices drop near you in Illinois.",
    images: ["https://www.puffprice.com/og-image.png"],
  },
};

const FEATURES: string[] = [
  "Instant SMS the moment a deal goes live near you",
  'Price drop alerts — "Flower just dropped below $30 near you"',
  "Flash-sale early access — 15 minutes before public",
  "Your total-savings dashboard",
  "First to know when a new dispensary opens",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "When do Pro SMS alerts start?",
    a: "Within 24 hours of signup. You'll get a confirmation text first, then start receiving alerts based on your ZIP code and chosen categories.",
  },
  {
    q: "Is there a contract?",
    a: "No. Everything is month-to-month. Cancel in one click from your Stripe billing portal anytime.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Credit and debit cards via Stripe. Stripe handles all payment processing — PuffPrice never sees your card details.",
  },
  {
    q: "What if I don't like it?",
    a: "Cancel any time, no questions. You keep every dollar you've already saved — those are real transactions at real dispensaries.",
  },
  {
    q: "Do dispensaries pay you?",
    a: "No. Dispensary listings are free, forever. PuffPrice is funded by Pro subscribers only. That's why you can trust the deal ranking.",
  },
];

const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL ||
  "mailto:matthew@jacarandapeoria.com?subject=PuffPrice%20Pro%20interest";

export default function UpgradePage() {
  return (
    <main className="min-h-screen text-gray-900" style={{ background: "var(--color-cream, #F7F4ED)" }}>
      <Nav variant="light" />

      <section className="max-w-2xl mx-auto px-6 pt-8 pb-16 text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">
          PuffPrice Pro
        </p>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] mb-5">
          Low Prices.
          <br />
          <em className="italic text-green-700 font-serif">High Times.</em>
        </h1>
        <p className="text-lg text-gray-700 mb-10 max-w-xl mx-auto leading-relaxed">
          Get texted the instant a deal drops near you.
          <br className="hidden md:inline" />
          $0.99 a month. Cancel any time.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10 shadow-sm text-left">
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-green-700 font-semibold mb-1">
                Pro
              </p>
              <p className="font-serif text-5xl leading-none">
                $0.99
                <span className="text-base text-gray-500 font-sans font-normal">
                  {" "}
                  / month
                </span>
              </p>
            </div>
            <span className="shrink-0 text-xs bg-green-50 text-green-800 border border-green-200 rounded-full px-3 py-1 font-medium">
              Cancel anytime
            </span>
          </div>

          <ul className="space-y-3 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-gray-800">
                <span className="text-green-600 mt-0.5 font-bold">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <a
            href={CHECKOUT_URL}
            className="block w-full text-center bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl py-3.5 transition"
          >
            Go Pro — $0.99/mo
          </a>

          <p className="text-center text-xs text-gray-500 mt-4">
            Less than a single pre-roll — every three years.
          </p>
        </div>

        <figure className="mt-10 text-sm text-gray-600">
          <blockquote className="italic">
            &ldquo;I saved $23 on my last order just from a Tuesday morning
            text. Worth every penny.&rdquo;
          </blockquote>
          <figcaption className="text-xs mt-2 text-gray-500 not-italic">
            — K.M., Peoria IL · Beta user
          </figcaption>
        </figure>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-2xl mb-6">FAQ</h2>
        <div className="space-y-6">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <p className="font-semibold mb-1">{q}</p>
              <p className="text-gray-700 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-24 text-center border-t border-gray-200 pt-10">
        <p className="text-xs tracking-wider uppercase text-gray-500 mb-2">
          For dispensaries
        </p>
        <p className="text-gray-800 mb-4">
          Your listing on PuffPrice is always free. No Featured tier. No upsell.
        </p>
        <Link
          href="/get-listed"
          className="inline-block text-green-700 hover:text-green-900 font-medium underline underline-offset-4"
        >
          Claim your free listing →
        </Link>
      </section>
      <Footer />
    </main>
  );
}
