import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/moline";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function MolinePage() {
  const listings = await getCityListings("Moline");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
