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
  city: "Schaumburg",
  state: "Illinois",
  slug: "schaumburg",
  heroIntro: "Schaumburg, a northwest suburban powerhouse with 78,000 residents and a thriving retail corridor, offers 3-5 cannabis dispensaries integrated into the area's commercial landscape. The city's strong retail infrastructure ensures convenient access and professional shopping experiences.",
  stats: [
    { label: "Dispensaries", value: "~3-5" },
    { label: "Population", value: "~78K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Cannabis consumption is prohibited in all public spaces in Schaumburg, including shopping centers, parks, and streets. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Schaumburg"),
  priceBlurb: "Schaumburg dispensaries offer competitive flower pricing at $40-60 per eighth ounce. Concentrate and edible prices vary based on product type and potency, with all prices subject to 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Schaumburg, IL?", answer: "Schaumburg has 3-5 licensed dispensaries positioned in convenient retail locations. Many feature modern facilities, knowledgeable staff, and comprehensive online menus for customer convenience." },
    statewideOutOfStateFaq("Schaumburg"),
    statewideHoursFaq("Schaumburg"),
    statewideMedicalCardFaq("Schaumburg"),
    { question: "Are parking and accessibility good at Schaumburg dispensaries?", answer: "Yes, Schaumburg dispensaries are located in well-developed retail areas with ample parking. ADA accessibility is standard at most locations, ensuring convenient access for all customers." },
    statewideOnlineOrderFaq("Schaumburg"),
  ],
  relatedCities: relatedCities("schaumburg"),
};
