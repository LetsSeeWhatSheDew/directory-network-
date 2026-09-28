// app/on-the-way/page.tsx — superseded by /route (Sep 27, 2026), which works
// store by store along the straight line between any two of the 12 Central
// Illinois cities instead of town by town. Old links keep working: the
// towns this page used map onto /route's cities (lib/routeDeals onTheWayTarget).
import { permanentRedirect } from "next/navigation";
import { onTheWayTarget } from "../../lib/routeDeals";

export default async function OnTheWayPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  permanentRedirect(onTheWayTarget(sp.from, sp.to));
}
