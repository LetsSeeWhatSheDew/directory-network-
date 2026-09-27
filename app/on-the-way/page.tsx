// app/on-the-way/page.tsx — superseded by /route (Sep 27, 2026), which works
// store by store along the straight line between any two of the 12 Central
// Illinois cities instead of town by town. Old links keep working: the
// towns this page used map onto /route's cities.
import { permanentRedirect } from "next/navigation";
import { routeCity, pairSlug } from "../../lib/routeDeals";

const OLD_TOWNS: Record<string, string> = { "bloomington-normal": "bloomington", "champaign-urbana": "champaign" };

export default async function OnTheWayPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const from = routeCity(OLD_TOWNS[sp.from || ""] || sp.from);
  const to = routeCity(OLD_TOWNS[sp.to || ""] || sp.to);
  permanentRedirect(from && to && from.slug !== to.slug ? `/route/${pairSlug(from.slug, to.slug)}` : "/route");
}
