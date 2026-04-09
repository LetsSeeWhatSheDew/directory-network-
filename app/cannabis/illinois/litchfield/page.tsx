import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/litchfield";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function LitchfieldPage() {
  const listings = await getCityListings("Litchfield");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
