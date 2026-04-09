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
  city: "Rock Island",
  state: "Illinois",
  slug: "rock-island",
  heroIntro: "Rock Island, a Quad Cities community with 36,000 residents, provides 2-3 dispensaries serving the Quad Cities area and cross-border Iowa visitors. The city's strategic location near the Mississippi River makes it an attractive destination for cannabis shoppers.",
  stats: [
    { label: "Dispensaries", value: "~2-3" },
    { label: "Population", value: "~36K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Rock Island. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Rock Island"),
  priceBlurb: "Flower at Rock Island dispensaries ranges from $40-60 per eighth ounce. Concentrates and edibles vary in price based on potency and product type, with all costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Rock Island, IL?", answer: "Rock Island has 2-3 licensed dispensaries serving the Quad Cities community. These locations provide convenient access to quality cannabis for residents and visitors." },
    statewideOutOfStateFaq("Rock Island"),
    statewideHoursFaq("Rock Island"),
    statewideMedicalCardFaq("Rock Island"),
    { question: "What is the Quad Cities cannabis market like?", answer: "The Quad Cities area, including Rock Island and Moline, serves as a major regional cannabis hub attracting customers from Illinois and Iowa. The competitive market provides excellent product selection and pricing." },
    statewideOnlineOrderFaq("Rock Island"),
  ],
  relatedCities: relatedCities("rock-island"),
};
