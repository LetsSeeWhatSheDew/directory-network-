// A personal dashboard (reads this browser's saved records), not a page for search.
// The page itself is a client component, so its metadata lives here.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your savings dashboard",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
