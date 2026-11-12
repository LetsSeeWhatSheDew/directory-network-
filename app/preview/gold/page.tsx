import type { Metadata } from "next";
import "../../components/gold/gold.css";
import { fraunces } from "../../components/gold/fonts";
import GoldHome from "../../components/gold/GoldHome";
import { getGoldHome } from "../../../lib/home/goldData";
import { getServerLocation } from "../../../lib/location";

export const metadata: Metadata = {
  title: "Gold Leaf preview",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function GoldPreview({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const sp = await searchParams;
  const [data, loc] = await Promise.all([getGoldHome(), getServerLocation()]);
  const origin = sp.city ? { city: sp.city } : loc ? { city: loc.city, lat: loc.lat ?? null, lng: loc.lng ?? null } : null;
  return (
    <div className={fraunces.variable}>
      <GoldHome data={data} origin={origin} />
    </div>
  );
}
