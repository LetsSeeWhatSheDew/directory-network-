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
  city: "Galesburg",
  state: "Illinois",
  slug: "galesburg",
  heroIntro: "Galesburg, a Knox County community with 30,000 residents in western Illinois, offers growing cannabis access with 2-3 dispensaries. The college town atmosphere and strategic location make it an important hub for the western Illinois region.",
  stats: [
    { label: "Dispensaries", value: "~2-3" },
    { label: "Population", value: "~30K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Galesburg, including parks and commercial areas. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Galesburg"),
  priceBlurb: "Flower at Galesburg dispensaries ranges from $40-60 per eighth ounce with competitive regional pricing. Concentrates and edibles vary based on potency, with all purchases subject to 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Galesburg, IL?", answer: "Galesburg has 2-3 licensed dispensaries serving the Knox County area and western Illinois residents. Each location offers convenient access to quality cannabis products and knowledgeable staff." },
    statewideOutOfStateFaq("Galesburg"),
    statewideHoursFaq("Galesburg"),
    statewideMedicalCardFaq("Galesburg"),
    { question: "What makes Galesburg significant for western Illinois cannabis retail?", answer: "Galesburg's Knox County location and college-town character make it a hub for western Illinois cannabis consumers. The town serves students and regional customers seeking accessible, quality products." },
    statewideOnlineOrderFaq("Galesburg"),
  ],
  relatedCities: relatedCities("galesburg"),
};
