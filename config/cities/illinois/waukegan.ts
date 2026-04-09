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
  city: "Waukegan",
  state: "Illinois",
  slug: "waukegan",
  heroIntro: "Waukegan, located in Lake County with a population of 90,000, sits near the Wisconsin border and offers 4-6 dispensaries serving both Illinois residents and cross-border visitors. The city's strategic location makes it a gateway for cannabis tourism from the Great Lakes region.",
  stats: [
    { label: "Dispensaries", value: "~4-6" },
    { label: "Population", value: "~90K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is illegal throughout Waukegan, including on sidewalks, beaches, parks, and commercial areas. Private residence consumption only for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Waukegan"),
  priceBlurb: "Flower prices in Waukegan range from $40-60 per eighth ounce, with competitive options across multiple dispensaries. Concentrates and edibles vary by potency, with total costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Waukegan, IL?", answer: "Waukegan has 4-6 licensed dispensaries distributed throughout the city, offering residents and visitors multiple options. This competitive market ensures good product selection and pricing." },
    statewideOutOfStateFaq("Waukegan"),
    statewideHoursFaq("Waukegan"),
    statewideMedicalCardFaq("Waukegan"),
    { question: "Can Wisconsin residents purchase cannabis in Waukegan?", answer: "Yes, Wisconsin residents are welcome to purchase cannabis at Waukegan dispensaries with valid ID. Wisconsin currently prohibits recreational sales, making Waukegan a convenient destination for cross-border shoppers." },
    statewideOnlineOrderFaq("Waukegan"),
  ],
  relatedCities: relatedCities("waukegan"),
};
