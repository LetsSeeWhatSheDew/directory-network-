import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  verification: {
    google: "FdgiJxqm6nBTT1I37dPrrFMNTWkDMLX4-T386WUgFjg",
  },
  title: {
    default: "Project Green | Cannabis Directory Network",
    template: "%s | Project Green",
  },
  description: "Curated cannabis dispensary directories for Illinois, Missouri, and beyond. Find licensed dispensaries, read local laws, and get listed.",
  openGraph: {
    siteName: "Project Green",
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
      </body>
    </html>
  );
}
