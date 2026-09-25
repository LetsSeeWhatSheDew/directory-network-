// app/for-dispensaries/card/page.tsx — general printable card for shoppers
// (coffee shops, bulletin boards): QR to the PuffPrice homepage, tagged
// utm_source=counter_card. Print-only page; noindex.
import type { Metadata } from "next";
import CounterCard, { parseSize } from "../CounterCard";
import { qrSvg, counterCardUrl } from "../../../lib/qrSvg";

export const metadata: Metadata = {
  title: "Printable card: compare dispensary deals",
  robots: { index: false, follow: false },
};

export default async function GeneralCounterCard({
  searchParams,
}: {
  searchParams: Promise<{ size?: string | string[] }>;
}) {
  const sp = await searchParams;
  const size = parseSize(sp?.size);
  const url = counterCardUrl("/", "general");
  const svg = await qrSvg(url);
  return (
    <CounterCard
      size={size}
      svg={svg}
      url={url}
      store="Peoria · Bloomington-Normal · Champaign-Urbana · Springfield"
      headline="Compare today's dispensary deals, all in one place"
      smallPrint="PuffPrice is independent. We read every Central Illinois store's deals each morning from its own website; confirm prices at the register. Free, no account. For adults 21 and over."
      screenTitle="A card for the bulletin board"
      screenText={<>For a coffee shop counter, a break room or a community board. The code opens today&apos;s Central Illinois deals, compared. Print as many as you like.</>}
      backHref="/for-dispensaries"
      backLabel="For dispensaries"
      sizeHref="/for-dispensaries/card"
    />
  );
}
