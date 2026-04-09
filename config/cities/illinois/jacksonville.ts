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
  city: "Jacksonville",
  state: "Illinois",
  slug: "jacksonville",
  heroIntro: "Jacksonville, a Morgan County community with 19,000 residents in western-central Illinois, provides 1-2 dispensaries serving the local area and surrounding regions. The town offers convenient cannabis access for residents of central Illinois.",
  stats: [
    { label: "Dispensaries", value: "~1-2" },
    { label: "Population", value: "~19K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Jacksonville. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Jacksonville"),
  priceBlurb: "Flower in Jacksonville ranges from $40-60 per eighth ounce at local dispensaries. Concentrates and edibles vary in price based on product potency and type, with all costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Jacksonville, IL?", answer: "Jacksonville has 1-2 licensed dispensaries serving the Morgan County community. These locations provide quality cannabis access to local residents and visitors to western-central Illinois." },
    statewideOutOfStateFaq("Jacksonville"),
    statewideHoursFaq("Jacksonville"),
    statewideMedicalCardFaq("Jacksonville"),
    { question: "What is Jacksonville's location in relation to Springfield?", answer: "Jacksonville is located west of Springfield in Morgan County, providing an alternative retail option for central Illinois residents. The town serves as a convenient stop for shoppers seeking local cannabis access." },
    statewideOnlineOrderFaq("Jacksonville"),
  ],
  relatedCities: relatedCities("jacksonville"),
};
