import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/sterling";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function SterlingPage() {
  const listings = await getCityListings("Sterling");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
