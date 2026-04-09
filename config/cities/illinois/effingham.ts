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
  city: "Effingham",
  state: "Illinois",
  slug: "effingham",
  heroIntro:
    "Effingham sits at the intersection of I-57 and I-70, making it a prime cannabis stop for travelers crossing the Midwest. Though the city population is only ~12,000, its strategic location brings significant highway traffic from St. Louis, Indianapolis, and Champaign. Multiple dispensaries serve both locals and interstate visitors.",
  stats: [
    { label: "Dispensaries", value: "~3-5" },
    { label: "Population", value: "~12K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited throughout Effingham and Effingham County. Cannabis use is permitted only in private residences. This aligns with Illinois state law and applies equally to residents and visitors.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Effingham"),
  priceBlurb:
    "Flower averages $45–60 per eighth, pre-rolls run $15–25, edibles cost $20–30, and concentrates typically range $50–75. Prices reflect regional supply and interstate demand from highway traffic.",
  faqs: [
    {
      question: "Why are there dispensaries in Effingham?",
      answer:
        "Effingham's location at the I-57 and I-70 crossroads makes it a natural stopping point for travelers moving between the St. Louis, Indianapolis, and Champaign regions. This strategic highway position has made the city a prime retail hub for cannabis, drawing both residents and out-of-state visitors. The convenience of multiple dispensaries near interstate exits appeals to travelers looking to make a quick purchase before continuing their journey.",
    },
    {
      question: "Is Effingham a good highway stop for cannabis?",
      answer:
        "Yes, Effingham is an excellent highway stop for cannabis shoppers. Multiple dispensaries are located near I-57 and I-70 exits, making it easy to access products without detouring far from your route. Whether you're heading to or from St. Louis, Indianapolis, or eastern Illinois, Effingham offers competitive pricing and convenient access. Most shops are open until late evening, accommodating travelers on various schedules.",
    },
    statewideOutOfStateFaq("Effingham"),
    statewideHoursFaq("Effingham"),
    statewideMedicalCardFaq("Effingham"),
    statewideOnlineOrderFaq("Effingham"),
  ],
  relatedCities: relatedCities("effingham"),
};
