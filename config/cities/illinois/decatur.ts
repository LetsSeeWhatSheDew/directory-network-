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
  city: "Decatur",
  state: "Illinois",
  slug: "decatur",
  heroIntro: "Decatur, central Illinois' hub city with 70,000 residents, has emerged as an underserved cannabis market with growing dispensary availability. Despite its size, Decatur previously lagged in cannabis retail expansion but now offers 3-5 locations to serve the region.",
  stats: [
    { label: "Dispensaries", value: "~3-5" },
    { label: "Population", value: "~70K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Cannabis use in public places, including parks, downtown areas, and within 1,000 feet of schools is strictly prohibited in Decatur. Consumption must occur in private residences by adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Decatur"),
  priceBlurb: "Decatur dispensaries offer competitive flower pricing at $40-60 per eighth ounce. Concentrate and edible prices vary by product, with total costs including 20-35% state excise tax applied at checkout.",
  faqs: [
    { question: "How many dispensaries are in Decatur, IL?", answer: "Decatur has 3-5 licensed dispensaries providing expanding retail access to the area's growing customer base. Competition among locations often leads to promotional pricing and quality product selection." },
    statewideOutOfStateFaq("Decatur"),
    statewideHoursFaq("Decatur"),
    statewideMedicalCardFaq("Decatur"),
    { question: "Why has Decatur been underserved for cannabis retail?", answer: "Decatur's initial licensing delays were due to local regulatory processes and municipal considerations. Recent approvals have expanded the market, making Decatur more competitive and accessible for cannabis consumers in central Illinois." },
    statewideOnlineOrderFaq("Decatur"),
  ],
  relatedCities: relatedCities("decatur"),
};
