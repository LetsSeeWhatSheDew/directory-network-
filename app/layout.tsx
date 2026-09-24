import type { Metadata } from "next";
import Script from "next/script";
import { Instrument_Sans, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import UtmCapture from "./components/UtmCapture";
import CityPickerHost from "./components/CityPickerHost";
import ExhaleLayer from "./components/ExhaleLayer";
import { brand } from "../lib/brand";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-TML9Y6VMC2";

// Every page fetches deals/listings — and renders dispensary logo images —
// from the Supabase origin. Preconnecting shaves the TLS/DNS handshake off
// the critical path (Lighthouse flagged ~310ms of uses-rel-preconnect
// savings on deal/listing pages).
const SUPABASE_ORIGIN = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co"
).replace(/\/+$/, "");

// Design Direction v2 (2026-06-13): the "warm price-truth instrument".
// Three self-hosted families via next/font (no layout shift):
//   Display  — Space Grotesk  (headlines, store names, section titles)
//   Body     — Inter          (paragraphs, nav, buttons, labels)
//   Numerals — JetBrains Mono  (ALL prices, %, counts, timestamps, eyebrows)
// Exposed as --font-display / --font-body / --font-mono; globals.css aliases
// the legacy --font-manrope-loaded / --font-display / --font-ui names onto
// these so unmigrated components keep working through the transition.
// Breathe final (2026-09-23): Instrument Sans for UI + display,
// IBM Plex Mono for prices/counts, Instrument Serif for headlines.
const instrumentSans = Instrument_Sans({
  variable: "--font-body-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-loaded",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Breathe (2026-09-23): serif for headlines.
const instrumentSerif = Instrument_Serif({
  variable: "--font-breath-loaded",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
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
  openGraph: {
    title: `Cannabis Deals in Central Illinois | ${brand.name}`,
    description: brand.description,
    url: brand.url,
    siteName: brand.name,
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
    title: `Cannabis Deals in Central Illinois | ${brand.name}`,
    description: brand.description,
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
      className={`${instrumentSans.variable} ${plexMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/* Daypart for the Breathe night sky (19:00–06:00 local). Runs before
            paint so there's no flash. ?daypart=night|day forces it for testing. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var q=new URLSearchParams(location.search).get('daypart');var h=new Date().getHours();document.documentElement.setAttribute('data-daypart',q==='night'||q==='day'?q:(h>=19||h<6?'night':'day'));}catch(e){}})();`,
          }}
        />
        {/* Hoisted to <head> by React 19 — warms the Supabase connection. */}
        <link rel="preconnect" href={SUPABASE_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SUPABASE_ORIGIN} />
        {children}
        <UtmCapture />
        <CityPickerHost />
        <ExhaleLayer />
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
