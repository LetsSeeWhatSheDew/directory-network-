import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import UtmCapture from "./components/UtmCapture";
import { brand } from "../lib/brand";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-TML9Y6VMC2";

// Brand spec 2.3: Geist Display drives every headline and the wordmark;
// Inter is the UI/chrome face for body, navigation, deal cards, metadata;
// Source Serif 4 is reserved for long-form content (about, content guides);
// Geist Mono stays available for code blocks. Each font is wired as a CSS
// variable so globals.css can reference them by role rather than literal
// font name — the type scale rules pick the correct face per element.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${sourceSerif.variable} antialiased`}
      >
        {children}
        <UtmCapture />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
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
