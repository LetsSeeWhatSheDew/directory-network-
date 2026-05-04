import type { Metadata } from "next";
import Script from "next/script";
import { Manrope } from "next/font/google";
import "./globals.css";
import UtmCapture from "./components/UtmCapture";
import CityPickerHost from "./components/CityPickerHost";
import { brand } from "../lib/brand";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-TML9Y6VMC2";

// Brand spec § 3 (locked 2026-05-04): Manrope, single family, four weights.
// Wired as a CSS variable so globals.css references the loaded family
// regardless of next/font's hash. Legacy variable names (--font-geist-sans,
// --font-inter, --font-source-serif) are aliased to Manrope inside
// globals.css so older component code keeps working until it's migrated.
const manrope = Manrope({
  variable: "--font-manrope-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
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
      <body className={`${manrope.variable} antialiased`}>
        {children}
        <UtmCapture />
        <CityPickerHost />
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
