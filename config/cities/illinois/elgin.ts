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
  city: "Elgin",
  state: "Illinois",
  slug: "elgin",
  heroIntro: "Elgin, a thriving northwest suburban community in Kane County with 115,000 residents, serves as a major cannabis hub for the western Chicago metro area. The city features 3-5 dispensaries along its retail corridors, making it a convenient destination for quality cannabis.",
  stats: [
    { label: "Dispensaries", value: "~3-5" },
    { label: "Population", value: "~115K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Cannabis consumption is prohibited in public areas throughout Elgin, including parks, plazas, and street-facing spaces. Consumption is only permitted in private residences by adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Elgin"),
  priceBlurb: "Flower in Elgin typically ranges from $40-60 per eighth ounce at competitive prices. Concentrates and edibles vary based on strength and brand, with total costs including 20-35% Illinois excise tax.",
  faqs: [
    { question: "How many dispensaries are in Elgin, IL?", answer: "Elgin has 3-5 licensed dispensaries positioned throughout the community, offering convenient access to northwest suburban customers. Many feature online ordering and curbside pickup options for quick transactions." },
    statewideOutOfStateFaq("Elgin"),
    statewideHoursFaq("Elgin"),
    statewideMedicalCardFaq("Elgin"),
    { question: "How far is Elgin from Chicago and Milwaukee?", answer: "Elgin is approximately 35 miles west of downtown Chicago and 70 miles south of Milwaukee, Wisconsin. This strategic location makes it attractive for visitors from both regions seeking quality Illinois cannabis." },
    statewideOnlineOrderFaq("Elgin"),
  ],
  relatedCities: relatedCities("elgin"),
};
