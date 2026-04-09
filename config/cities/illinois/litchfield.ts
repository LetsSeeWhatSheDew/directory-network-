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
  city: "Litchfield",
  state: "Illinois",
  slug: "litchfield",
  heroIntro: "Litchfield, a small community with 7,000 residents positioned on the I-55 corridor between Springfield and St. Louis, offers 1-2 dispensaries serving highway travelers and regional customers. The town's location makes it a convenient stop for cross-state cannabis shoppers.",
  stats: [
    { label: "Dispensaries", value: "~1-2" },
    { label: "Population", value: "~7K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Litchfield. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Litchfield"),
  priceBlurb: "Flower in Litchfield ranges from $40-60 per eighth ounce at local dispensaries. Concentrates and edibles vary based on potency, with all costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Litchfield, IL?", answer: "Litchfield has 1-2 licensed dispensaries serving the community and I-55 corridor travelers. These locations provide convenient access for customers traveling between Springfield and St. Louis." },
    statewideOutOfStateFaq("Litchfield"),
    statewideHoursFaq("Litchfield"),
    statewideMedicalCardFaq("Litchfield"),
    { question: "Why is Litchfield popular for I-55 travelers?", answer: "Litchfield's strategic location on the I-55 corridor between Springfield, Illinois, and St. Louis, Missouri, makes it an ideal stop for long-distance travelers. Dispensaries provide convenient highway access for cannabis purchases." },
    statewideOnlineOrderFaq("Litchfield"),
  ],
  relatedCities: relatedCities("litchfield"),
};
