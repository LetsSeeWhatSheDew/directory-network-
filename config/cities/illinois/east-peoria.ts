import type { CityConfig } from "@/components/CityPage";
import {
  relatedCities,
  PURCHASE_LIMITS_LAW,
  ID_REQUIREMENTS_LAW,
  DRIVING_LAW,
  firstTimerSteps,
  statewideOutOfStateFaq,
  statewideHoursFaq,
  statewideMedicalCardFaq,
  statewideOnlineOrderFaq,
} from "./shared";

export const CITY_CONFIG: CityConfig = {
  city: "East Peoria",
  state: "Illinois",
  slug: "east-peoria",
  heroIntro:
    "East Peoria's concentrated dispensary strip makes it one of Illinois' densest cannabis retail hubs per capita. Located across the Illinois River from Peoria in Tazewell County, this city of ~23K offers competitive pricing and convenient access to a wide range of cannabis products.",
  stats: [
    { label: "Population", value: "~23,000" },
    { label: "Dispensaries", value: "~8" },
    { label: "County", value: "Tazewell" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in East Peoria. Tazewell County follows state rules, meaning consumption is allowed only in private residences. Smoking or consuming cannabis in parks, streets, vehicles, or public spaces carries penalties.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("East Peoria"),
  priceBlurb:
    "East Peoria flower averages $40–60 per eighth, with pre-rolls at $15–25, edibles at $20–30, and concentrates at $50–75. Prices are competitive with nearby Peoria, reflecting the concentrated retail landscape and active local market.",
  faqs: [
    statewideOutOfStateFaq("East Peoria"),
    statewideHoursFaq("East Peoria"),
    statewideMedicalCardFaq("East Peoria"),
    statewideOnlineOrderFaq("East Peoria"),
    {
      question: "How many dispensaries are in East Peoria?",
      answer:
        "East Peoria has approximately 8 dispensaries, making it one of the densest concentrations per capita in Illinois. This high density relative to population means shorter travel distances and competitive pricing for residents and visitors. The dispensaries are strategically concentrated along the city's commercial corridors, creating an easy-to-navigate retail corridor.",
    },
    {
      question:
        "What's the difference between Peoria and East Peoria for dispensaries?",
      answer:
        "East Peoria has a concentrated strip of dispensaries along its commercial corridors, creating a clustered retail hub that's easy to access. Peoria's dispensaries, by contrast, are more spread across the broader metro area, so East Peoria offers more convenient one-stop shopping if you're looking to visit multiple shops quickly. Both cities offer competitive pricing, but East Peoria's density makes it a more efficient shopping destination.",
    },
  ],
  relatedCities: relatedCities("east-peoria"),
};
