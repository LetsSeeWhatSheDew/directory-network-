import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/quincy";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function QuincyPage() {
  const listings = await getCityListings("Quincy");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
