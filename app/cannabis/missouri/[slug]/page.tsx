import CityPage from "@/components/CityPage";
import { buildCityMetadata, getCityListings } from "../_helpers";

// Import all Missouri city configs
import { CITY_CONFIG as ST_LOUIS } from "@/config/cities/missouri/st-louis";
import { CITY_CONFIG as KANSAS_CITY } from "@/config/cities/missouri/kansas-city";
import { CITY_CONFIG as SPRINGFIELD } from "@/config/cities/missouri/springfield";
import { CITY_CONFIG as COLUMBIA } from "@/config/cities/missouri/columbia";
import { CITY_CONFIG as INDEPENDENCE } from "@/config/cities/missouri/independence";
import { CITY_CONFIG as LEES_SUMMIT } from "@/config/cities/missouri/lees-summit";
import { CITY_CONFIG as JOPLIN } from "@/config/cities/missouri/joplin";
import { CITY_CONFIG as JEFFERSON_CITY } from "@/config/cities/missouri/jefferson-city";
import { CITY_CONFIG as CAPE_GIRARDEAU } from "@/config/cities/missouri/cape-girardeau";
import { CITY_CONFIG as BRANSON } from "@/config/cities/missouri/branson";

const CITY_CONFIGS: Record<string, typeof ST_LOUIS> = {
  "st-louis": ST_LOUIS,
  "kansas-city": KANSAS_CITY,
  springfield: SPRINGFIELD,
  columbia: COLUMBIA,
  independence: INDEPENDENCE,
  "lees-summit": LEES_SUMMIT,
  joplin: JOPLIN,
  "jefferson-city": JEFFERSON_CITY,
  "cape-girardeau": CAPE_GIRARDEAU,
  branson: BRANSON,
};

export async function generateStaticParams() {
  return Object.keys(CITY_CONFIGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = CITY_CONFIGS[slug];
  if (!config) return {};
  return buildCityMetadata(config);
}

export default async function CityPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = CITY_CONFIGS[slug];

  if (!config) {
    return <div>City not found</div>;
  }

  const listings = await getCityListings(config.city);
  return <CityPage config={config} listings={listings} />;
}
