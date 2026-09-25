// app/for-dispensaries/[slug]/card/page.tsx — printable counter card for one
// store: "Compare today's deals in {city}" + a QR to the store's PuffPrice
// page (tagged utm_source=counter_card). Print-only page; noindex.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CounterCard, { parseSize } from "../../CounterCard";
import { getRegionStores } from "../../../../lib/waysToBuy";
import { qrSvg, counterCardUrl } from "../../../../lib/qrSvg";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = (await getRegionStores()).find((s) => s.slug === slug);
  return {
    title: store ? `Counter card: ${store.name}` : "Counter card",
    robots: { index: false, follow: false },
  };
}

export default async function StoreCounterCard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ size?: string | string[] }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  // getRegionStores reads master_listings with project_tag=green, active, IL, region cities.
  const store = (await getRegionStores()).find((s) => s.slug === slug);
  if (!store) notFound();
  const size = parseSize(sp?.size);
  const url = counterCardUrl(`/dispensary/${store.slug}`, store.slug);
  const svg = await qrSvg(url);
  const name = store.name.replace(/^nuera\b/i, "nuEra");
  return (
    <CounterCard
      size={size}
      svg={svg}
      url={url}
      store={name}
      headline={`Compare today's deals in ${store.city}`}
      smallPrint="PuffPrice is independent and isn't run by this store. We read each store's deals every morning from its own website; confirm prices at the register. For adults 21 and over."
      screenTitle={`Counter card for ${name}`}
      screenText={<>Set it by the register or on the counter. The code opens your PuffPrice page, where your deals sit next to the rest of {store.city}&apos;s. Free to print as many as you like.</>}
      backHref={`/for-dispensaries/${store.slug}`}
      backLabel="Back to your report"
      sizeHref={`/for-dispensaries/${store.slug}/card`}
    />
  );
}
