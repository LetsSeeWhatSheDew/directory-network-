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
  city: "Moline",
  state: "Illinois",
  slug: "moline",
  heroIntro: "Moline, a Rock Island County community with 42,000 residents in the Quad Cities region, offers 3-4 dispensaries serving Illinois and cross-border Iowa shoppers. The city's proximity to Iowa makes it a major cannabis destination for visitors seeking legal purchases.",
  stats: [
    { label: "Dispensaries", value: "~3-4" },
    { label: "Population", value: "~42K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Moline. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Moline"),
  priceBlurb: "Flower in Moline ranges from $40-60 per eighth ounce at dispensaries serving the Quad Cities area. Concentrates and edibles vary based on potency, with all costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Moline, IL?", answer: "Moline has 3-4 licensed dispensaries positioned throughout the community. These locations serve both residents and cross-border shoppers seeking quality Illinois cannabis." },
    statewideOutOfStateFaq("Moline"),
    statewideHoursFaq("Moline"),
    statewideMedicalCardFaq("Moline"),
    { question: "Do Iowa residents come to Moline for cannabis purchases?", answer: "Yes, Moline attracts significant cross-border traffic from Iowa, which does not have recreational cannabis sales. The Quad Cities location makes Moline a convenient destination for Iowa shoppers seeking legal cannabis access." },
    statewideOnlineOrderFaq("Moline"),
  ],
  relatedCities: relatedCities("moline"),
};
