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
  city: "Canton",
  state: "Illinois",
  slug: "canton",
  heroIntro: "Canton, a Fulton County community with 13,000 residents near Peoria, serves as a small-town cannabis hub with 1-2 dispensaries. The town offers an intimate shopping experience while providing access to quality products for the western Illinois region.",
  stats: [
    { label: "Dispensaries", value: "~1-2" },
    { label: "Population", value: "~13K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Cannabis consumption in public places is prohibited throughout Canton. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Canton"),
  priceBlurb: "Flower in Canton ranges from $40-60 per eighth ounce at local dispensaries. Concentrates and edibles vary in price based on product potency, with final costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Canton, IL?", answer: "Canton has 1-2 licensed dispensaries serving the local community and surrounding Fulton County. As the market develops, additional retail options may become available." },
    statewideOutOfStateFaq("Canton"),
    statewideHoursFaq("Canton"),
    statewideMedicalCardFaq("Canton"),
    { question: "How far is Canton from Peoria cannabis retailers?", answer: "Canton is located near Peoria in Fulton County, providing an alternative option to the larger Peoria cannabis market. The town offers a more intimate shopping experience for residents seeking local access." },
    statewideOnlineOrderFaq("Canton"),
  ],
  relatedCities: relatedCities("canton"),
};
