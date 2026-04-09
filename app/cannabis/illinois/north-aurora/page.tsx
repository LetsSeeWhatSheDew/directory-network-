import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/north-aurora";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function NorthAuroraPage() {
  const listings = await getCityListings("North Aurora");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
