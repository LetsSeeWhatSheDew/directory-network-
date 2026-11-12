import type { Metadata } from "next";
import Script from "next/script";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import "./components/gold/gold.css";
import { fraunces, frauncesItalic } from "./components/gold/fonts";
import { GoldHeader, GoldFooter } from "./components/gold/Chrome";
import UtmCapture from "./components/UtmCapture";
import TrackListener from "./components/TrackListener";
import CityPickerHost from "./components/CityPickerHost";
import { brand } from "../lib/brand";
import { PP_PACE, PACE_SCRIPT } from "../lib/motion";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-TML9Y6VMC2";

// Every page fetches deals/listings — and renders dispensary logo images —
// from the Supabase origin. Preconnecting shaves the TLS/DNS handshake off
// the critical path (Lighthouse flagged ~310ms of uses-rel-preconnect
// savings on deal/listing pages).
const SUPABASE_ORIGIN = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co"
).replace(/\/+$/, "");

// Gold Leaf (2026-11-11): two families via next/font (no layout shift).
//   Body + UI + numbers: Instrument Sans (--font-body-loaded; tabular nums)
//   Display: Fraunces, upright + italic (app/components/gold/fonts.ts)
// The old IBM Plex Mono and Instrument Serif are gone; globals.css maps
// --font-mono and --font-breath onto these so older pages follow along.
const instrumentSans = Instrument_Sans({
  variable: "--font-body-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  verification: {
    google: ["FdgiJxqm6nBTT1I37dPrrFMNTWkDMLX4-T386WUgFjg", "07gWVtJUIV3VbVxvKmo3NbCPu1_oiH7aYOC9FoF5H6Y"],
  },
  title: {
    default: `Cannabis Deals in Central Illinois | ${brand.name}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // No title / description / url here on purpose: Next.js replaces the
  // openGraph object wholesale, so any page without its own openGraph used to
  // inherit the HOMEPAGE og:title and og:url (crawl 2026-10-04: /deal-index,
  // /status, /how-we-rank, /cheapest, /developers, every /guides/* page…).
  // Without them, link previews and crawlers fall back to the page's own
  // <title>, meta description and canonical. Pages that want a custom
  // preview still set their own openGraph.
  openGraph: {
    siteName: brand.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${brand.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${brand.name} — ${brand.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${brand.url}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${fraunces.variable} ${frauncesItalic.variable}`}
      style={{ "--pp-pace": PP_PACE } as React.CSSProperties}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/* Gold Leaf (2026-11-11) has one theme. data-daypart stays "day" so the
            retired Breathe night rules never apply. */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-daypart','day');` }} />
        {/* Motion pace (lib/motion.ts). ?pace=1.5 slows every animation for review. */}
        <script dangerouslySetInnerHTML={{ __html: PACE_SCRIPT }} />
        {/* Hoisted to <head> by React 19 — warms the Supabase connection. */}
        <link rel="preconnect" href={SUPABASE_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SUPABASE_ORIGIN} />
        <GoldHeader />
        {children}
        <GoldFooter />
        <UtmCapture />
        <TrackListener />
        <CityPickerHost />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
