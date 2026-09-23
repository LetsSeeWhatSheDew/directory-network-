import type { Metadata } from "next";

// Out of scope (Central IL lock, Apr 24 2026): keep the pages reachable but
// out of Google's index so they don't dilute the Central IL site.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function MissouriCannabisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
