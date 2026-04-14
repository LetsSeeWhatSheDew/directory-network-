import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-PLACEHOLDER";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cleanlist.co"),
  verification: {
    google: ["FdgiJxqm6nBTT1I37dPrrFMNTWkDMLX4-T386WUgFjg", "07gWVtJUIV3VbVxvKmo3NbCPu1_oiH7aYOC9FoF5H6Y"],
  },
  title: {
    default: "CleanList — Best Bud For Your Buck$",
    template: "%s | CleanList",
  },
  description:
    "Find the best cannabis deals near you in Illinois. Best Bud For Your Buck$ — Low Prices. High Times.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "CleanList — Best Bud For Your Buck$",
    description: "Find the best cannabis deals near you in Illinois. Low Prices. High Times.",
    url: "https://cleanlist.co",
    siteName: "CleanList",
    type: "website",
    images: [
      {
        url: "https://cleanlist.co/og-image.png",
        width: 1200,
        height: 630,
        alt: "CleanList — Best Bud For Your Buck$",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CleanList — Best Bud For Your Buck$",
    description: "Find the best cannabis deals near you in Illinois.",
    images: ["https://cleanlist.co/og-image.png"],
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
