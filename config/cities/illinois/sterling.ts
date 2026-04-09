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
  city: "Sterling",
  state: "Illinois",
  slug: "sterling",
  heroIntro: "Sterling, a Whiteside County community with 15,000 residents in northern Illinois, serves as a small-town cannabis hub with 1-2 dispensaries. The town provides accessible retail options for residents and visitors in the rural Illinois region.",
  stats: [
    { label: "Dispensaries", value: "~1-2" },
    { label: "Population", value: "~15K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Sterling. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Sterling"),
  priceBlurb: "Flower in Sterling ranges from $40-60 per eighth ounce at local dispensaries. Concentrates and edibles vary based on product potency and type, with all costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Sterling, IL?", answer: "Sterling has 1-2 licensed dispensaries providing cannabis access to the Whiteside County community. These locations serve as the primary retail options for residents seeking quality products." },
    statewideOutOfStateFaq("Sterling"),
    statewideHoursFaq("Sterling"),
    statewideMedicalCardFaq("Sterling"),
    { question: "Is Sterling accessible from the Quad Cities?", answer: "Sterling's location in Whiteside County places it south of the Quad Cities region, offering an alternative destination for northern Illinois cannabis shoppers. The town provides convenient access for rural area residents." },
    statewideOnlineOrderFaq("Sterling"),
  ],
  relatedCities: relatedCities("sterling"),
};
