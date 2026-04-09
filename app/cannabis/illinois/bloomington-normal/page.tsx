import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/bloomington-normal";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function BloomingtonNormalPage() {
  const listings = await getCityListings("Bloomington-Normal");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
