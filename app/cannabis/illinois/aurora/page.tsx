import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/aurora";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function AuroraPage() {
  const listings = await getCityListings("Aurora");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
