import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/marion";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function MarionPage() {
  const listings = await getCityListings("Marion");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
