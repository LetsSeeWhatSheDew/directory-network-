import type { Metadata } from "next";
import Link from "next/link";
import NotifyPage from "../NotifyPage";

export const metadata: Metadata = {
  title: "Drive-thru weed is legal in Illinois — be first to know near you",
  description: "Drive-thru dispensaries became legal in Illinois in June 2026. Get one email when the first one opens near you in Central Illinois.",
  robots: { index: false, follow: true },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <NotifyPage
      kind="drive_thru"
      channel={sp.utm_source || sp.ref}
      headline="Drive-thru weed is legal in Illinois."
      sub="None are open in Central Illinois yet. Drop your ZIP and we'll tell you the day one opens near you."
      fact={<>Illinois legalized dispensary drive-thrus when SB 3222 was signed on June 12, 2026; the first ones opened downstate in September. <Link href="/drive-thru" >See the tracker →</Link></>}
    />
  );
}
