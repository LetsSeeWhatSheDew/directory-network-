import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/east-peoria";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function EastPeoriaPage() {
  const listings = await getCityListings("East Peoria");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
