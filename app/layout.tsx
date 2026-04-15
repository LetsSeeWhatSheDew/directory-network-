import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UtmCapture from "./components/UtmCapture";
import { brand } from "../lib/brand";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-TML9Y6VMC2";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  verification: {
    google: ["FdgiJxqm6nBTT1I37dPrrFMNTWkDMLX4-T386WUgFjg", "07gWVtJUIV3VbVxvKmo3NbCPu1_oiH7aYOC9FoF5H6Y"],
  },
  title: {
    default: `Cannabis Deals Near You in Illinois | ${brand.name}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: `Cannabis Deals Near You in Illinois | ${brand.name}`,
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
    title: `Cannabis Deals Near You in Illinois | ${brand.name}`,
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050f09] text-[#f0ede8]`}
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
