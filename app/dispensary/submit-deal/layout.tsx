// A submission form for dispensaries (and its confirmation), not a page for search.
// The page itself is a client component, so its metadata lives here.
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
