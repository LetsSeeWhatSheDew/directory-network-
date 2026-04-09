import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/effingham";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function EffinghamPage() {
  const listings = await getCityListings("Effingham");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
