// The dashboard page is a client component (reads this browser's tracked
// deals), so its metadata lives here. Personal, per-browser view: noindex.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your savings dashboard",
  robots: { index: false, follow: true },
};

export default function SavingsDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
