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
  city: "Addison",
  state: "Illinois",
  slug: "addison",
  heroIntro: "Addison, a DuPage County community with 37,000 residents, provides convenient cannabis access with 2-3 dispensaries serving the western suburban corridor. The town's central location makes it a practical stop for metro area shoppers.",
  stats: [
    { label: "Dispensaries", value: "~2-3" },
    { label: "Population", value: "~37K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Addison, including parks, streets, and commercial areas. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Addison"),
  priceBlurb: "Addison dispensaries offer flower at competitive rates of $40-60 per eighth ounce. Concentrate and edible pricing varies based on product strength and brand, with final totals including 20-35% Illinois excise tax.",
  faqs: [
    { question: "How many dispensaries are in Addison, IL?", answer: "Addison has 2-3 licensed dispensaries providing accessible cannabis retail to residents and DuPage County visitors. Each location offers convenient parking and online ordering options." },
    statewideOutOfStateFaq("Addison"),
    statewideHoursFaq("Addison"),
    statewideMedicalCardFaq("Addison"),
    { question: "What makes Addison convenient for western suburban shoppers?", answer: "Addison's strategic DuPage County location provides easy highway access and convenient parking. The town serves as a practical cannabis shopping destination for residents across the western Chicago metropolitan area." },
    statewideOnlineOrderFaq("Addison"),
  ],
  relatedCities: relatedCities("addison"),
};
