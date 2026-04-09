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
  city: "Ottawa",
  state: "Illinois",
  slug: "ottawa",
  heroIntro: "Ottawa, a LaSalle County community with 19,000 residents located along the I-80 corridor, provides convenient cannabis access with 2-3 dispensaries. The town's highway position makes it a popular stop for travelers and regional shoppers.",
  stats: [
    { label: "Dispensaries", value: "~2-3" },
    { label: "Population", value: "~19K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Ottawa, including parks and roadside areas. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Ottawa"),
  priceBlurb: "Flower at Ottawa dispensaries ranges from $40-60 per eighth ounce with competitive pricing. Concentrates and edibles vary based on product strength and type, with all costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Ottawa, IL?", answer: "Ottawa has 2-3 licensed dispensaries serving the community and I-80 corridor travelers. These locations offer convenient access for residents and visitors passing through the region." },
    statewideOutOfStateFaq("Ottawa"),
    statewideHoursFaq("Ottawa"),
    statewideMedicalCardFaq("Ottawa"),
    { question: "Why is Ottawa popular with highway travelers?", answer: "Ottawa's strategic location on the I-80 corridor between Chicago and the Quad Cities makes it a convenient stop for long-distance travelers seeking quality cannabis. Dispensaries are positioned for easy highway access." },
    statewideOnlineOrderFaq("Ottawa"),
  ],
  relatedCities: relatedCities("ottawa"),
};
