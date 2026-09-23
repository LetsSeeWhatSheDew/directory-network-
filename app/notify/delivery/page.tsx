import type { Metadata } from "next";
import Link from "next/link";
import NotifyPage from "../NotifyPage";

export const metadata: Metadata = {
  title: "Weed delivery in Illinois — be first to know",
  description: "Cannabis delivery isn't legal in Illinois yet. Get one email the day it reaches your ZIP.",
  robots: { index: false, follow: true },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <NotifyPage
      kind="delivery"
      channel={sp.utm_source || sp.ref}
      headline="Weed delivery to your door in Illinois?"
      sub="Not legal yet. Drop your ZIP and we'll tell you the day it reaches you — and who has the lowest delivered price."
      fact={<>No Illinois delivery bill is moving right now; the last one died in committee in 2026. <Link href="/illinois-cannabis-delivery" style={{ color: "inherit" }}>Where the bills stand →</Link></>}
    />
  );
}
