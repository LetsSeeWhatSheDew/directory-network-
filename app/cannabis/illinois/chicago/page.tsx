import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/chicago";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function ChicagoPage() {
  const listings = await getCityListings("Chicago");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
