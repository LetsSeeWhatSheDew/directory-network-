import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/canton";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function CantonPage() {
  const listings = await getCityListings("Canton");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
